import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  delay = 0,
  hover = true,
  onClick,
  padding = 'p-6',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }
          : undefined
      }
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/5 dark:bg-white/5 bg-gray-100/80
        backdrop-blur-xl
        border border-white/10 dark:border-white/10 border-gray-200/50
        shadow-lg shadow-black/5
        transition-colors duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${padding}
        ${className}
      `}
    >
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      {children}
    </motion.div>
  );
};

export default GlassCard;
