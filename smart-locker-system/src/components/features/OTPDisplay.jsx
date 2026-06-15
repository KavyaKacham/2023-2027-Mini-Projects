import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const OTPDisplay = ({ otp = '----', expiresAt, status = 'active', onGenerate }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const expiryTime =
      expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();

    const calcRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      return remaining;
    };

    // Calculate initial total duration (for the progress ring)
    const initial = calcRemaining();
    setTotalDuration(initial);
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!otp || otp === '----') return;
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy OTP');
    }
  }, [otp]);

  // Progress for countdown ring
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 0;
  const ringRadius = 72;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Urgency color
  const isUrgent = timeLeft > 0 && timeLeft <= 30;
  const ringColor = isUrgent ? '#ef4444' : status === 'active' ? '#6366f1' : '#6b7280';

  // Split OTP into digits
  const digits = String(otp).padEnd(4, '-').split('').slice(0, 4);

  const effectiveStatus =
    status === 'active' && timeLeft <= 0 && expiresAt ? 'expired' : status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      {/* Countdown Ring */}
      <div className="relative mb-8">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="90"
            cy="90"
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <motion.circle
            cx="90"
            cy="90"
            r={ringRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            animate={{ strokeDashoffset: ringOffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
            filter="url(#ringGlow)"
          />
          <defs>
            <filter id="ringGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Timer text inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-mono font-bold ${
              isUrgent ? 'text-red-400' : 'text-gray-800 dark:text-white'
            }`}
            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
            transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
          >
            {effectiveStatus === 'expired' ? '0:00' : timeString}
          </motion.span>
          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            remaining
          </span>
        </div>
      </div>

      {/* OTP Digits */}
      <div className="flex items-center gap-3 mb-6">
        <AnimatePresence mode="popLayout">
          {digits.map((digit, index) => (
            <motion.div
              key={`${index}-${digit}`}
              initial={{ opacity: 0, y: 20, scale: 0.5, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.5, rotateX: 90 }}
              transition={{
                delay: index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
              }}
              className={`
                relative flex items-center justify-center
                w-16 h-20 sm:w-20 sm:h-24 rounded-2xl
                bg-white/5 dark:bg-white/5 bg-gray-100/80
                backdrop-blur-xl
                border border-white/10 dark:border-white/10 border-gray-200/50
                shadow-lg
                ${
                  effectiveStatus === 'active'
                    ? 'shadow-indigo-500/10'
                    : effectiveStatus === 'expired'
                    ? 'shadow-gray-500/5'
                    : 'shadow-blue-500/10'
                }
              `}
            >
              {/* Top highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent rounded-t-2xl" />

              <span
                className={`
                  text-4xl sm:text-5xl font-mono font-bold tracking-tighter
                  ${
                    digit === '-'
                      ? 'text-gray-600 dark:text-gray-700'
                      : 'bg-gradient-to-b from-indigo-300 via-white to-cyan-300 dark:from-indigo-300 dark:via-white dark:to-cyan-300 from-indigo-600 via-gray-900 to-cyan-600 bg-clip-text text-transparent'
                  }
                `}
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              >
                {digit}
              </span>

              {/* Glow under digit */}
              {digit !== '-' && effectiveStatus === 'active' && (
                <div className="absolute bottom-2 w-8 h-4 bg-indigo-500/15 blur-md rounded-full" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Status Badge */}
      <div className="mb-5">
        <StatusBadge status={effectiveStatus} size="md" />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Copy Button */}
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          disabled={!otp || otp === '----' || effectiveStatus !== 'active'}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
            bg-white/5 dark:bg-white/5 bg-gray-100/80 backdrop-blur-md
            border border-white/10 dark:border-white/10 border-gray-200/50
            transition-all duration-200 cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed
            ${
              copied
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-400 hover:border-indigo-500/30'
            }
          `}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy OTP</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Generate / Regenerate Button */}
        {onGenerate && (
          <motion.button
            onClick={onGenerate}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{otp === '----' ? 'Generate' : 'Regenerate'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default OTPDisplay;
