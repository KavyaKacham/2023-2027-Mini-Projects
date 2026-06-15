import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(
  (
    {
      label,
      icon: Icon,
      rightIcon: RightIcon,
      onRightIconClick,
      error,
      success,
      type = 'text',
      className = '',
      id,
      ...rest
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const borderColor = error
      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500'
      : success
      ? 'border-emerald-500/50 focus:ring-emerald-500/30 focus:border-emerald-500'
      : 'border-white/10 dark:border-white/10 border-gray-300/50 focus:ring-indigo-500/30 focus:border-indigo-500/50';

    return (
      <motion.div
        className={`w-full ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Left icon */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Icon className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-200" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full rounded-xl
              bg-white/5 dark:bg-white/5 bg-gray-50/80
              backdrop-blur-md
              border ${borderColor}
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              focus:outline-none focus:ring-2
              transition-all duration-300
              ${Icon ? 'pl-11' : 'pl-4'}
              ${RightIcon ? 'pr-11' : 'pr-4'}
              py-3 text-sm
            `}
            {...rest}
          />

          {/* Right icon */}
          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10 cursor-pointer"
              tabIndex={-1}
            >
              <RightIcon className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500 hover:text-gray-300 transition-colors duration-200" />
            </button>
          )}

          {/* Focus glow */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-md bg-indigo-500/10" />
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
          >
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 00-2 0v4a1 1 0 002 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.p>
        )}

        {/* Success message */}
        {success && typeof success === 'string' && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-emerald-400"
          >
            {success}
          </motion.p>
        )}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
