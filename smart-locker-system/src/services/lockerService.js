// ============================================================
// lockerService — Locker Status Monitoring & Control
// ============================================================
import { doc, onSnapshot } from 'firebase/firestore';
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
 * Get the current locker status from the backend.
 *
 * @returns {Promise<{ status: string, lastUpdated: string, updatedBy: string }>}
 */
export async function getLockerStatus() {
  const result = await apiFetch('/api/locker/status');
  return result;
}

/**
 * Update the locker status (lock / unlock).
 *
 * @param {string} status   New status: 'LOCKED' | 'UNLOCKED' | 'OTP_PENDING'
 * @param {string} userId   ID of the user performing the action
 * @returns {Promise<object>}
 */
export async function updateLockerStatus(status, userId) {
  const result = await apiFetch('/api/locker/status', {
    method: 'PUT',
    body: JSON.stringify({ status, userId }),
  });
  return result;
}

/**
 * Subscribe to real-time locker status changes via Firestore.
 *
 * Watches the `lockerStatus/current` document in Firestore.
 * Returns an unsubscribe function.
 *
 * @param {Function} callback  Receives the locker status document on every change
 * @returns {Function}         Unsubscribe function
 */
export function subscribeToLockerStatus(callback) {
  if (!isFirebaseConfigured) {
    // Demo mode — return a static "LOCKED" status
    callback({
      id: 'current',
      status: 'LOCKED',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system',
      servoAngle: 0,
    });
    return () => {};
  }

  const docRef = doc(db, 'lockerStatus', 'current');

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Document doesn't exist yet — assume locked
        callback({
          id: 'current',
          status: 'LOCKED',
          lastUpdated: null,
          updatedBy: null,
        });
      }
    },
    (error) => {
      console.error('[lockerService] Subscription error:', error);
      callback({
        id: 'current',
        status: 'LOCKED',
        lastUpdated: null,
        updatedBy: null,
        error: error.message,
      });
    }
  );

  return unsubscribe;
}
