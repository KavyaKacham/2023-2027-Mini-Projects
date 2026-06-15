import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import GlassCard from './GlassCard';

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    ring: 'ring-indigo-500/20',
    glow: 'shadow-indigo-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    ring: 'ring-cyan-500/20',
    glow: 'shadow-cyan-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    glow: 'shadow-emerald-500/20',
  },
  rose: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    ring: 'ring-rose-500/20',
    glow: 'shadow-rose-500/20',
  },
  amber: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    ring: 'ring-amber-500/20',
    glow: 'shadow-amber-500/20',
  },
  purple: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    ring: 'ring-purple-500/20',
    glow: 'shadow-purple-500/20',
  },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral',
  color = 'indigo',
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedRef = useRef(false);
  const colors = colorMap[color] || colorMap.indigo;

  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (!isNumeric || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1200;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = numericValue;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [numericValue, isNumeric]);

  const changeColor =
    changeType === 'increase'
      ? 'text-emerald-400'
      : changeType === 'decrease'
      ? 'text-rose-400'
      : 'text-gray-400 dark:text-gray-500';

  const ChangeIcon =
    changeType === 'increase'
      ? TrendingUp
      : changeType === 'decrease'
      ? TrendingDown
      : null;

  return (
    <GlassCard delay={delay} hover={true} className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
          </p>
          <motion.p
            className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.1 + 0.3, duration: 0.4 }}
          >
            {isNumeric ? displayValue.toLocaleString() : value}
          </motion.p>

          {change !== undefined && (
            <motion.div
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${changeColor}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay * 0.1 + 0.5, duration: 0.3 }}
            >
              {ChangeIcon && <ChangeIcon className="w-4 h-4" />}
              <span>{change}</span>
            </motion.div>
          )}
        </div>

        <motion.div
          className={`
            flex items-center justify-center w-12 h-12 rounded-xl
            ${colors.bg} ${colors.text} ring-1 ${colors.ring}
            shadow-lg ${colors.glow}
            group-hover:scale-110 transition-transform duration-300
          `}
          initial={{ opacity: 0, rotate: -30, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{
            delay: delay * 0.1 + 0.2,
            duration: 0.5,
            type: 'spring',
            stiffness: 200,
          }}
        >
          {Icon && <Icon className="w-6 h-6" />}
        </motion.div>
      </div>
    </GlassCard>
  );
};

export default StatCard;
