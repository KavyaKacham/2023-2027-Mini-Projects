// ============================================================
// constants — Application-wide Constants
// ============================================================

/**
 * Application name used across the UI.
 */
export const APP_NAME = 'SecureVault';

/**
 * Backend API base URL, sourced from environment variables.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * OTP validity window in seconds.
 */
export const OTP_EXPIRY_SECONDS = 60;

/**
 * Number of digits in a generated OTP.
 */
export const OTP_LENGTH = 4;

// ── Locker States ──────────────────────────────────────────

export const LOCKER_STATES = Object.freeze({
  LOCKED: 'LOCKED',
  OTP_PENDING: 'OTP_PENDING',
  UNLOCKED: 'UNLOCKED',
});

// ── User Roles ─────────────────────────────────────────────

export const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

// ── Log Actions ────────────────────────────────────────────

export const LOG_ACTIONS = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  OTP_GENERATED: 'OTP_GENERATED',
  OTP_VERIFIED: 'OTP_VERIFIED',
  LOCKER_OPENED: 'LOCKER_OPENED',
  LOCKER_CLOSED: 'LOCKER_CLOSED',
  FAILED_LOGIN: 'FAILED_LOGIN',
  FAILED_OTP: 'FAILED_OTP',
});

// ── Status Color Map ───────────────────────────────────────
// Maps status strings to Tailwind-compatible color tokens & CSS class prefixes.

export const STATUS_COLORS = Object.freeze({
  // Locker states
  [LOCKER_STATES.LOCKED]: {
    label: 'Locked',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    textClass: 'text-danger-400',
    bgClass: 'status-locked-bg',
    dotClass: 'bg-danger-400',
  },
  [LOCKER_STATES.OTP_PENDING]: {
    label: 'OTP Pending',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.15)',
    textClass: 'text-warning-400',
    bgClass: 'status-pending-bg',
    dotClass: 'bg-warning-400',
  },
  [LOCKER_STATES.UNLOCKED]: {
    label: 'Unlocked',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    textClass: 'text-success-400',
    bgClass: 'status-unlocked-bg',
    dotClass: 'bg-success-400',
  },

  // Generic boolean statuses
  active: {
    label: 'Active',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    textClass: 'text-success-400',
    bgClass: 'status-active-bg',
    dotClass: 'bg-success-400',
  },
  inactive: {
    label: 'Inactive',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    textClass: 'text-danger-400',
    bgClass: 'status-inactive-bg',
    dotClass: 'bg-danger-400',
  },

  // Log actions
  [LOG_ACTIONS.LOGIN]: {
    label: 'Login',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    textClass: 'text-info-400',
    bgClass: 'status-info-bg',
    dotClass: 'bg-info-400',
  },
  [LOG_ACTIONS.LOGOUT]: {
    label: 'Logout',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.15)',
    textClass: 'text-dark-400',
    bgClass: 'bg-dark-400/15',
    dotClass: 'bg-dark-400',
  },
  [LOG_ACTIONS.OTP_GENERATED]: {
    label: 'OTP Generated',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    textClass: 'text-primary-400',
    bgClass: 'bg-primary-400/15',
    dotClass: 'bg-primary-400',
  },
  [LOG_ACTIONS.OTP_VERIFIED]: {
    label: 'OTP Verified',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    textClass: 'text-success-400',
    bgClass: 'status-active-bg',
    dotClass: 'bg-success-400',
  },
  [LOG_ACTIONS.LOCKER_OPENED]: {
    label: 'Locker Opened',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    textClass: 'text-secondary-400',
    bgClass: 'bg-secondary-400/15',
    dotClass: 'bg-secondary-400',
  },
  [LOG_ACTIONS.LOCKER_CLOSED]: {
    label: 'Locker Closed',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-400/15',
    dotClass: 'bg-orange-400',
  },
  [LOG_ACTIONS.FAILED_LOGIN]: {
    label: 'Failed Login',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    textClass: 'text-danger-400',
    bgClass: 'status-locked-bg',
    dotClass: 'bg-danger-400',
  },
  [LOG_ACTIONS.FAILED_OTP]: {
    label: 'Failed OTP',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    textClass: 'text-danger-400',
    bgClass: 'status-locked-bg',
    dotClass: 'bg-danger-400',
  },
});

// ── Navigation Items ───────────────────────────────────────
// Used by the sidebar / bottom-nav to render links.
// `icon` values correspond to Lucide React icon component names.

export const NAV_ITEMS = Object.freeze([
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['user', 'admin'],
  },
  {
    label: 'OTP Access',
    path: '/otp',
    icon: 'KeyRound',
    roles: ['user', 'admin'],
  },
  {
    label: 'Access Logs',
    path: '/logs',
    icon: 'ScrollText',
    roles: ['user', 'admin'],
  },
  {
    label: 'Security Center',
    path: '/security',
    icon: 'ShieldCheck',
    roles: ['user', 'admin'],
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: 'UserCog',
    roles: ['user', 'admin'],
  },
  {
    label: 'Admin Panel',
    path: '/admin',
    icon: 'Settings',
    roles: ['admin'],
  },
]);

// ── Misc ───────────────────────────────────────────────────

/**
 * Password strength rules displayed to the user.
 */
export const PASSWORD_RULES = Object.freeze([
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]);

/**
 * Toaster configuration defaults.
 */
export const TOAST_CONFIG = Object.freeze({
  position: 'top-right',
  duration: 4000,
  style: {
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
  },
});
