// ============================================================
// useTheme — Convenience hook for ThemeContext
// ============================================================
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Access the current theme state and toggle function.
 *
 * @returns {{ theme: 'dark'|'light', isDark: boolean, toggleTheme: Function }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a <ThemeProvider>. ' +
        'Wrap your component tree with <ThemeProvider> in main.jsx.'
    );
  }

  return context;
}

export default useTheme;
