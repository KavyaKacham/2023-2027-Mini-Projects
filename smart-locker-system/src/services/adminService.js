// ============================================================
// adminService — Admin Dashboard API
// ============================================================
import { auth, isFirebaseConfigured } from '../config/firebase';

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

// ── User Management ────────────────────────────────────────

/**
 * Fetch all registered users.
 *
 * @returns {Promise<Array<object>>} List of user profiles
 */
export async function getAllUsers() {
  const result = await apiFetch('/api/admin/users');
  return result?.users ?? result?.data ?? result ?? [];
}

/**
 * Delete a user account by their application-level user ID.
 *
 * @param {string} userId   Application user ID (e.g. "U1234")
 * @returns {Promise<object>}
 */
export async function deleteUser(userId) {
  const result = await apiFetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
  return result;
}

/**
 * Enable or disable a user account.
 *
 * @param {string}  userId    Application user ID
 * @param {boolean} isActive  New active status
 * @returns {Promise<object>}
 */
export async function toggleUserStatus(userId, isActive) {
  const result = await apiFetch(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
  return result;
}

// ── Stats & Analytics ──────────────────────────────────────

/**
 * Fetch aggregate admin dashboard statistics.
 *
 * @returns {Promise<{
 *   totalUsers: number,
 *   activeUsers: number,
 *   totalOTPs: number,
 *   totalLogs: number,
 *   lockerStatus: string,
 *   recentActivity: Array
 * }>}
 */
export async function getAdminStats() {
  const result = await apiFetch('/api/admin/stats');
  return result;
}

// ── Logs ───────────────────────────────────────────────────

/**
 * Fetch access / activity logs with optional filters.
 *
 * @param {{ userId?: string, action?: string, startDate?: string, endDate?: string, page?: number, limit?: number }} filters
 * @returns {Promise<Array<object>>}
 */
export async function getAllLogs(filters = {}) {
  const params = new URLSearchParams();

  if (filters.userId) params.set('userId', filters.userId);
  if (filters.action) params.set('action', filters.action);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`;

  const result = await apiFetch(endpoint);
  return result?.logs ?? result?.data ?? result ?? [];
}

// ── OTP Records ────────────────────────────────────────────

/**
 * Fetch ALL OTP records across all users (admin view).
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllOTPRecords() {
  const result = await apiFetch('/api/otp/history/all');
  return result?.records ?? result?.data ?? result ?? [];
}

// ── Security ───────────────────────────────────────────────

/**
 * Fetch security events (failed logins, failed OTPs, anomalies, etc.).
 *
 * @returns {Promise<Array<object>>}
 */
export async function getSecurityEvents() {
  const result = await apiFetch('/api/security/events');
  return result?.events ?? result?.data ?? result ?? [];
}

/**
 * Fetch security analytics for a given date range.
 *
 * @param {'24h'|'7d'|'30d'|'90d'} range  Time range for the analytics
 * @returns {Promise<{
 *   failedLogins: number,
 *   failedOTPs: number,
 *   successRate: number,
 *   threatLevel: string,
 *   timeline: Array<{ date: string, events: number }>,
 *   topThreats: Array<{ type: string, count: number }>
 * }>}
 */
export async function getSecurityAnalytics(range = '7d') {
  const result = await apiFetch(`/api/security/analytics?range=${range}`);
  return result;
}
