import { motion } from 'framer-motion';

const LockerAnimation = ({ status = 'locked', size = 'md' }) => {
  const sizeMap = {
    sm: { w: 120, h: 140 },
    md: { w: 200, h: 230 },
    lg: { w: 280, h: 320 },
  };

  const { w, h } = sizeMap[size] || sizeMap.md;

  const isLocked = status === 'locked';
  const isUnlocked = status === 'unlocked';
  const isPending = status === 'pending';

  const glowColor = isUnlocked
    ? 'rgba(16, 185, 129, 0.4)'
    : isPending
    ? 'rgba(245, 158, 11, 0.4)'
    : 'rgba(239, 68, 68, 0.35)';

  const accentColor = isUnlocked
    ? '#10b981'
    : isPending
    ? '#f59e0b'
    : '#ef4444';

  const accentColorLight = isUnlocked
    ? '#34d399'
    : isPending
    ? '#fbbf24'
    : '#f87171';

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-2xl"
        style={{
          width: w + 40,
          height: h + 40,
        }}
        animate={{
          boxShadow: isPending
            ? [
                `0 0 20px ${glowColor}`,
                `0 0 50px ${glowColor}`,
                `0 0 20px ${glowColor}`,
              ]
            : `0 0 30px ${glowColor}`,
        }}
        transition={
          isPending
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.5 }
        }
      />

      <motion.svg
        width={w}
        height={h}
        viewBox="0 0 200 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id="lockerBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Door gradient */}
          <linearGradient id="lockerDoor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Accent gradient */}
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={accentColorLight} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === LOCKER BODY === */}
        <motion.rect
          x="20"
          y="50"
          width="160"
          height="170"
          rx="12"
          fill="url(#lockerBody)"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeOpacity="0.3"
          animate={{
            strokeOpacity: isPending ? [0.2, 0.6, 0.2] : isLocked ? 0.3 : 0.5,
          }}
          transition={
            isPending
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.5 }
          }
        />

        {/* Body inner border highlight */}
        <rect
          x="22"
          y="52"
          width="156"
          height="166"
          rx="10"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.05"
        />

        {/* === DOOR === */}
        <motion.g
          animate={{
            rotateY: isUnlocked ? -35 : 0,
          }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          style={{ originX: '30px', transformBox: 'fill-box' }}
        >
          {/* Door panel */}
          <motion.rect
            x="30"
            y="60"
            width="140"
            height="150"
            rx="8"
            fill="url(#lockerDoor)"
            stroke={accentColor}
            strokeWidth="1"
            strokeOpacity="0.2"
            animate={{
              scaleX: isUnlocked ? 0.85 : 1,
              x: isUnlocked ? 5 : 0,
            }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          />

          {/* Door inner panel */}
          <motion.rect
            x="40"
            y="70"
            width="120"
            height="130"
            rx="4"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.05"
            animate={{
              scaleX: isUnlocked ? 0.85 : 1,
            }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
          />

          {/* === HANDLE === */}
          <motion.g
            animate={{
              rotate: isUnlocked ? 45 : 0,
              x: isUnlocked ? -5 : 0,
            }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
          >
            {/* Handle base */}
            <circle
              cx="130"
              cy="135"
              r="18"
              fill="#1e293b"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <circle
              cx="130"
              cy="135"
              r="14"
              fill="#0f172a"
              stroke="white"
              strokeWidth="0.5"
              strokeOpacity="0.08"
            />

            {/* Handle bar */}
            <rect
              x="127"
              y="117"
              width="6"
              height="20"
              rx="3"
              fill={accentColor}
              opacity="0.8"
            />
          </motion.g>

          {/* === KEYHOLE === */}
          <motion.g filter="url(#glow)">
            {/* Keyhole circle */}
            <motion.circle
              cx="80"
              cy="130"
              r="8"
              fill={accentColor}
              opacity="0.9"
              animate={{
                opacity: isPending ? [0.5, 1, 0.5] : 0.9,
                r: isPending ? [7, 9, 7] : 8,
              }}
              transition={
                isPending
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            />
            {/* Keyhole slot */}
            <motion.rect
              x="77"
              y="135"
              width="6"
              height="12"
              rx="2"
              fill={accentColor}
              opacity="0.8"
              animate={{
                opacity: isPending ? [0.4, 0.9, 0.4] : 0.8,
              }}
              transition={
                isPending
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            />
          </motion.g>

          {/* === RIVETS / BOLTS === */}
          {[
            [45, 75],
            [155, 75],
            [45, 185],
            [155, 185],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill="#334155"
              stroke="white"
              strokeWidth="0.3"
              strokeOpacity="0.1"
            />
          ))}
        </motion.g>

        {/* === TOP SECTION (above door) === */}
        <rect
          x="50"
          y="20"
          width="100"
          height="25"
          rx="6"
          fill="#1e293b"
          stroke={accentColor}
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* Shield icon in top section */}
        <motion.g
          filter="url(#glow)"
          animate={{
            y: isPending ? [0, -2, 0] : 0,
          }}
          transition={
            isPending
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : {}
          }
        >
          <motion.path
            d="M100 24 L110 28 L110 36 C110 40 106 44 100 46 C94 44 90 40 90 36 L90 28 Z"
            fill="url(#accentGrad)"
            opacity="0.9"
            animate={{
              opacity: isPending ? [0.5, 1, 0.5] : isUnlocked ? 1 : 0.8,
            }}
            transition={
              isPending
                ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.4 }
            }
          />
          {/* Checkmark inside shield for unlocked */}
          {isUnlocked && (
            <motion.path
              d="M96 35 L99 38 L105 32"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            />
          )}
          {/* Lock inside shield for locked */}
          {isLocked && (
            <>
              <rect
                x="96"
                y="33"
                width="8"
                height="6"
                rx="1"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M98 33 L98 31 C98 29.5 99 28.5 100 28.5 C101 28.5 102 29.5 102 31 L102 33"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
            </>
          )}
        </motion.g>

        {/* === STATUS INDICATOR LIGHT === */}
        <motion.circle
          cx="100"
          cy="195"
          r="4"
          fill={accentColor}
          filter="url(#softGlow)"
          animate={{
            opacity: isPending ? [0.3, 1, 0.3] : [0.7, 1, 0.7],
            r: isPending ? [3, 5, 3] : 4,
          }}
          transition={{
            duration: isPending ? 1 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Status text */}
        <text
          x="100"
          y="218"
          textAnchor="middle"
          fill={accentColor}
          fontSize="11"
          fontWeight="600"
          fontFamily="monospace"
          letterSpacing="2"
          opacity="0.8"
        >
          {status.toUpperCase()}
        </text>
      </motion.svg>
    </div>
  );
};

export default LockerAnimation;
