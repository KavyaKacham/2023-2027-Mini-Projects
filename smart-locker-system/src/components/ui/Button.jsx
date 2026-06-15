import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: `
    bg-gradient-to-r from-indigo-600 to-indigo-500
    hover:from-indigo-500 hover:to-indigo-400
    text-white shadow-lg shadow-indigo-500/25
    border border-indigo-500/50
  `,
  secondary: `
    bg-transparent border border-cyan-500/50
    text-cyan-400 hover:bg-cyan-500/10
    shadow-lg shadow-cyan-500/10
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-red-500
    hover:from-red-500 hover:to-red-400
    text-white shadow-lg shadow-red-500/25
    border border-red-500/50
  `,
  ghost: `
    bg-transparent hover:bg-white/5 dark:hover:bg-white/5
    text-gray-600 dark:text-gray-300
    border border-transparent hover:border-white/10
  `,
  success: `
    bg-gradient-to-r from-emerald-600 to-emerald-500
    hover:from-emerald-500 hover:to-emerald-400
    text-white shadow-lg shadow-emerald-500/25
    border border-emerald-500/50
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      className={`
        relative inline-flex items-center justify-center
        font-semibold tracking-wide
        backdrop-blur-sm
        transition-all duration-300
        cursor-pointer
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${isDisabled ? 'opacity-50 cursor-not-allowed saturate-50' : ''}
        ${className}
      `}
      {...rest}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
        <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span className="relative">{children}</span>
    </motion.button>
  );
};

export default Button;
