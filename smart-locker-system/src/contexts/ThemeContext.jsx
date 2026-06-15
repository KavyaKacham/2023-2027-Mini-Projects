// ============================================================
// ThemeContext — Dark / Light Mode Provider
// ============================================================
import { createContext, useState, useEffect, useMemo, useCallback } from 'react';

const THEME_KEY = 'securevault-theme';

/**
 * Detect the user's OS-level colour-scheme preference.
 * Falls back to 'dark' when the API is unavailable.
 */
function getSystemPreference() {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    return 'light';
  }
  return 'dark';
}

/**
 * Read persisted theme from localStorage, or fall back to system preference.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage may be blocked (e.g. incognito in some browsers)
  }
  return getSystemPreference();
}

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Sync the `dark` / `light` class on <html> and persist choice
  useEffect(() => {
    const root = document.documentElement;

    // Briefly add a transition-suppressing class so the first paint
    // doesn't flash a transition animation.
    root.classList.add('theme-transition');

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore write errors
    }

    // Remove the transition class after a tick so subsequent changes animate
    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 350);

    return () => clearTimeout(timer);
  }, [theme]);

  // Listen for OS-level theme changes
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(e) {
      // Only auto-switch if the user hasn't explicitly chosen a theme
      const stored = localStorage.getItem(THEME_KEY);
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export default ThemeContext;
