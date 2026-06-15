// ============================================================
// helpers — Utility Functions
// ============================================================
import { STATUS_COLORS } from './constants';

// ── Date & Time Formatting ─────────────────────────────────

/**
 * Format a timestamp into a human-readable date string.
 * Handles Firestore Timestamps, Date objects, ISO strings, and Unix ms.
 *
 * @param {any}    timestamp  The value to format
 * @param {object} options    Intl.DateTimeFormat options override
 * @returns {string}
 */
export function formatDate(timestamp, options = {}) {
  const date = toDate(timestamp);
  if (!date) return '—';

  const defaults = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-US', { ...defaults, ...options }).format(
    date
  );
}

/**
 * Format a timestamp into a time string (e.g. "2:35 PM").
 *
 * @param {any} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns a human-readable relative time string (e.g. "3 minutes ago").
 *
 * @param {any} timestamp
 * @returns {string}
 */
export function timeAgo(timestamp) {
  const date = toDate(timestamp);
  if (!date) return '—';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12)
    return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Convert various timestamp representations to a JS Date.
 * @private
 */
function toDate(value) {
  if (!value) return null;
  // Firestore Timestamp
  if (typeof value?.toDate === 'function') return value.toDate();
  // Already a Date
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // ISO string
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Unix ms (number)
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp-like { seconds, nanoseconds }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return null;
}

// ── ID / OTP Generators ───────────────────────────────────

/**
 * Generate a random User ID in the format U + 4 random digits.
 * @returns {string}  e.g. "U4829"
 */
export function generateUserId() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `U${digits}`;
}

/**
 * Generate a random 4-digit OTP string.
 * @returns {string}  e.g. "0742"
 */
export function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── Validation ─────────────────────────────────────────────

/**
 * Evaluate the strength of a password.
 *
 * @param {string} password
 * @returns {{ score: number, label: string, color: string, percent: number }}
 */
export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: '', color: '#475569', percent: 0 };
  }

  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Uniqueness bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 1;

  // Map score → label + color
  const levels = [
    { min: 0, max: 2, label: 'Very Weak', color: '#ef4444', percent: 15 },
    { min: 3, max: 3, label: 'Weak', color: '#f97316', percent: 30 },
    { min: 4, max: 5, label: 'Fair', color: '#eab308', percent: 50 },
    { min: 6, max: 6, label: 'Strong', color: '#22c55e', percent: 75 },
    { min: 7, max: Infinity, label: 'Very Strong', color: '#06b6d4', percent: 100 },
  ];

  const level = levels.find((l) => score >= l.min && score <= l.max) || levels[0];

  return {
    score,
    label: level.label,
    color: level.color,
    percent: level.percent,
  };
}

/**
 * Validate an email address.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false;
  // RFC 5322 simplified
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email);
}

/**
 * Validate a mobile / phone number.
 * Accepts formats like +1234567890, (123) 456-7890, 123-456-7890, etc.
 *
 * @param {string} mobile
 * @returns {boolean}
 */
export function validateMobile(mobile) {
  if (!mobile) return false;
  // Strip non-digit characters except leading +
  const cleaned = mobile.replace(/[^\d+]/g, '');
  // Must have between 10 and 15 digits (with optional +)
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Validate a password against minimum requirements.
 *
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

// ── String Utilities ───────────────────────────────────────

/**
 * Truncate text to a maximum length, appending an ellipsis.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Extract initials from a full name (up to 2 characters).
 *
 * @param {string} name
 * @returns {string}  e.g. "JD"
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Status Colors ──────────────────────────────────────────

/**
 * Retrieve the status colour configuration for a given status key.
 *
 * @param {string} status
 * @returns {{ label: string, color: string, bg: string, textClass: string, bgClass: string, dotClass: string }}
 */
export function getStatusColor(status) {
  if (!status) {
    return {
      label: 'Unknown',
      color: '#64748b',
      bg: 'rgba(100, 116, 139, 0.15)',
      textClass: 'text-dark-400',
      bgClass: 'bg-dark-400/15',
      dotClass: 'bg-dark-400',
    };
  }

  return (
    STATUS_COLORS[status] ||
    STATUS_COLORS[status.toUpperCase()] ||
    STATUS_COLORS[status.toLowerCase()] || {
      label: status,
      color: '#64748b',
      bg: 'rgba(100, 116, 139, 0.15)',
      textClass: 'text-dark-400',
      bgClass: 'bg-dark-400/15',
      dotClass: 'bg-dark-400',
    }
  );
}

// ── Class Name Utility ─────────────────────────────────────

/**
 * Conditionally join class names, filtering out falsy values.
 * Works like the popular `classnames` / `clsx` libraries.
 *
 * @param  {...(string|boolean|null|undefined)} classes
 * @returns {string}
 *
 * @example
 * classNames('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')
 * // → "btn btn-active"
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
