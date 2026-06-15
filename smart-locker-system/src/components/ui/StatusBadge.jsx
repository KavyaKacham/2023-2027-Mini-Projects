import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  Clock,
  Check,
  X,
  Zap,
  Timer,
  CheckCircle,
} from 'lucide-react';

const statusConfig = {
  locked: {
    icon: Lock,
    label: 'Locked',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    glowClass: 'shadow-red-500/20',
    pulse: false,
  },
  unlocked: {
    icon: Unlock,
    label: 'Unlocked',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    pulse: false,
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    glowClass: 'shadow-amber-500/20',
    pulse: true,
  },
  success: {
    icon: Check,
    label: 'Success',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    pulse: false,
  },
  failed: {
    icon: X,
    label: 'Failed',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    glowClass: 'shadow-red-500/20',
    pulse: false,
  },
  active: {
    icon: Zap,
    label: 'Active',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    glowClass: 'shadow-emerald-500/20',
    pulse: true,
  },
  expired: {
    icon: Timer,
    label: 'Expired',
    bgClass: 'bg-gray-500/15',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
    glowClass: 'shadow-gray-500/10',
    pulse: false,
  },
  used: {
    icon: CheckCircle,
    label: 'Used',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    glowClass: 'shadow-blue-500/20',
    pulse: false,
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'px-4 py-1.5 text-base gap-2',
    icon: 'w-4 h-4',
  },
};

const StatusBadge = ({ status = 'pending', size = 'md', className = '' }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeStyles = sizeConfig[size] || sizeConfig.md;
  const IconComponent = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
      className={`
        relative inline-flex items-center font-medium rounded-full
        border backdrop-blur-sm
        ${config.bgClass} ${config.textClass} ${config.borderClass}
        shadow-lg ${config.glowClass}
        ${sizeStyles.container}
        ${className}
      `}
    >
      {/* Pulse ring for active states */}
      {config.pulse && (
        <span className="absolute inset-0 rounded-full">
          <span
            className={`absolute inset-0 rounded-full ${config.bgClass} animate-ping opacity-40`}
          />
        </span>
      )}

      <IconComponent className={`${sizeStyles.icon} relative z-10`} />
      <span className="relative z-10">{config.label}</span>
    </motion.span>
  );
};

export default StatusBadge;
