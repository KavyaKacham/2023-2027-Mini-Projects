// ============================================================
// authService — Authentication & Profile API
// ============================================================
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Helpers ────────────────────────────────────────────────

/**
 * Generic fetch wrapper with JSON parsing and error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach Firebase ID token if available
  if (isFirebaseConfigured && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } catch {
      // Token retrieval failed — continue without it
    }
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // Try to parse JSON regardless of status code
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Public API ─────────────────────────────────────────────

/**
 * Register a new user through the backend API.
 *
 * @param {{ fullName: string, username: string, email: string, password: string, mobileNumber: string }} userData
 * @returns {Promise<object>} Created user profile
 */
export async function registerUser(userData) {
  const result = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return result;
}

/**
 * Log in a user — calls the backend for custom validation,
 * then signs in via Firebase client SDK to set the local auth state.
 *
 * @param {string} username   Username or email
 * @param {string} password   Plain-text password
 * @returns {Promise<object>} User data from the backend
 */
export async function loginUser(username, password) {
  // 1. Call backend for validation / logging / rate-limiting
  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  // 2. Also sign in on the client with Firebase so onAuthStateChanged fires
  const email = result.email || result.user?.email || username;
  if (isFirebaseConfigured) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (firebaseErr) {
      console.warn(
        '[authService] Firebase client sign-in failed:',
        firebaseErr.message
      );
      // The backend already validated — we continue even if Firebase client sign-in fails
    }
  }

  return result;
}

/**
 * Log out the current user.
 */
export async function logoutUser() {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}

/**
 * Send a password-reset email.
 *
 * @param {string} email
 */
export async function resetPassword(email) {
  if (isFirebaseConfigured) {
    await sendPasswordResetEmail(auth, email);
  }

  // Also notify the backend (e.g. for audit logging)
  try {
    await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  } catch {
    // Backend call is best-effort
  }
}

/**
 * Fetch a user profile from Firestore (or backend).
 *
 * @param {string} userId   The Firestore document ID (uid)
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
  // Try Firestore first
  if (isFirebaseConfigured && userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
    } catch (err) {
      console.warn('[authService] Firestore profile fetch failed:', err.message);
    }
  }

  // Fallback to backend API
  try {
    return await apiFetch(`/api/auth/profile/${userId}`);
  } catch {
    return null;
  }
}

/**
 * Update user profile fields.
 *
 * @param {string} userId   The Firestore document ID (uid)
 * @param {object} data     Fields to update
 * @returns {Promise<object>}
 */
export async function updateProfile(userId, data) {
  // Update Firestore document
  if (isFirebaseConfigured && userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[authService] Firestore profile update failed:', err.message);
    }
  }

  // Also notify backend
  const result = await apiFetch(`/api/auth/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return result;
}

/**
 * Change the current user's password.
 * Requires re-authentication with the old password first.
 *
 * @param {string} userId      (unused directly — we use auth.currentUser)
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export async function changePassword(userId, oldPassword, newPassword) {
  if (!isFirebaseConfigured || !auth.currentUser) {
    // Fallback to backend-only password change
    await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, oldPassword, newPassword }),
    });
    return;
  }

  // Re-authenticate the user
  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    oldPassword
  );
  await reauthenticateWithCredential(auth.currentUser, credential);

  // Update Firebase password
  await updatePassword(auth.currentUser, newPassword);

  // Notify backend (audit log etc.)
  try {
    await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, oldPassword: '***', newPassword: '***' }),
    });
  } catch {
    // Best-effort
  }
}
