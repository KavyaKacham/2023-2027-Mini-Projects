// ============================================================
// otpService — OTP Generation, Verification & History
// ============================================================
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Helpers ────────────────────────────────────────────────

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  if (isFirebaseConfigured && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Continue without token
    }
  }

  return headers;
}

async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────

/**
 * Request a new OTP to be generated for the given user.
 *
 * The backend is responsible for:
 *  - Generating the OTP
 *  - Storing it in Firestore (otpRecords collection)
 *  - Sending it to the ESP32 / locker hardware
 *
 * @param {string} userId    Application-level user ID (e.g. "U1234")
 * @param {string} username  Username for logging purposes
 * @returns {Promise<{ otpId: string, expiresAt: string, message: string }>}
 */
export async function generateOTP(userId, username) {
  const result = await apiFetch('/api/otp/generate', {
    method: 'POST',
    body: JSON.stringify({ userId, username }),
  });

  return result;
}

/**
 * Verify an OTP entered by the user.
 *
 * @param {string} otpId   The ID of the OTP record to verify against
 * @param {string} otp     The 4-digit OTP string
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function verifyOTP(otpId, otp) {
  const result = await apiFetch('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ otpId, otp }),
  });

  return result;
}

/**
 * Get the OTP history for a specific user.
 *
 * @param {string} userId   Application-level user ID
 * @returns {Promise<Array<object>>}   List of OTP records
 */
export async function getOTPHistory(userId) {
  const result = await apiFetch(`/api/otp/history/${userId}`);
  return result?.records ?? result?.data ?? result ?? [];
}

/**
 * Subscribe to real-time OTP record changes for a user via Firestore.
 * Returns an unsubscribe function.
 *
 * @param {string}   userId    Application-level user ID
 * @param {Function} callback  Receives an array of OTP records on every change
 * @returns {Function}         Unsubscribe function
 */
export function subscribeToOTP(userId, callback) {
  if (!isFirebaseConfigured || !userId) {
    // In demo mode, call back with empty data and return a no-op unsub
    callback([]);
    return () => {};
  }

  const otpRef = collection(db, 'otpRecords');
  const q = query(
    otpRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(records);
    },
    (error) => {
      console.error('[otpService] Subscription error:', error);
      callback([]);
    }
  );

  return unsubscribe;
}
