import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = '', fullScreen = false }) => {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', ring: 32, stroke: 2.5 },
    md: { container: 'w-16 h-16', icon: 'w-7 h-7', ring: 64, stroke: 3 },
    lg: { container: 'w-24 h-24', icon: 'w-10 h-10', ring: 96, stroke: 3.5 },
  };

  const s = sizeMap[size] || sizeMap.md;
  const radius = s.ring / 2 - s.stroke * 2;
  const circumference = 2 * Math.PI * radius;

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${s.container}`}>
        {/* Outer spinning ring */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${s.ring} ${s.ring}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth={s.stroke}
          />
          <motion.circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="url(#spinnerGradient)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.7}
          />
          <defs>
            <linearGradient
              id="spinnerGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Inner pulsing shield */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield className={`${s.icon} text-indigo-400`} />
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 15px rgba(99, 102, 241, 0.15)',
              '0 0 30px rgba(99, 102, 241, 0.3)',
              '0 0 15px rgba(99, 102, 241, 0.15)',
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {text && (
        <motion.p
          className="text-sm font-medium text-gray-400 dark:text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-[#0a0e1a]/90 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
