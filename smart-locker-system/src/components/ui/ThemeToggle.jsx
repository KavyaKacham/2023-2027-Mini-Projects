import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        bg-white/10 dark:bg-white/5
        backdrop-blur-md
        border border-white/10 dark:border-white/10 border-gray-300/50
        hover:bg-white/20 dark:hover:bg-white/10
        transition-colors duration-300
        cursor-pointer
        shadow-lg shadow-black/5
      `}
      whileTap={{ scale: 0.9, rotate: 15 }}
      whileHover={{ scale: 1.1 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Sun className="w-5 h-5 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Moon className="w-5 h-5 text-indigo-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle glow ring */}
      <div
        className={`
          absolute inset-0 rounded-full opacity-0 hover:opacity-100
          transition-opacity duration-300
          ${isDark ? 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'}
        `}
      />
    </motion.button>
  );
};

export default ThemeToggle;
