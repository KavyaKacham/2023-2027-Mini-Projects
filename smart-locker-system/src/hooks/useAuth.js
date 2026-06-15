// ============================================================
// useAuth — Convenience hook for AuthContext
// ============================================================
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Access the current authentication state and actions.
 *
 * @returns {{ user: object|null, loading: boolean, login: Function, logout: Function, register: Function, resetPassword: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an <AuthProvider>. ' +
        'Wrap your component tree with <AuthProvider> in main.jsx.'
    );
  }

  return context;
}

export default useAuth;
