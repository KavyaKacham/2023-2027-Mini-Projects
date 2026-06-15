import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Contact', href: '/#contact' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/5 dark:bg-gray-900/50 bg-white/70 backdrop-blur-xl border-b border-white/10 dark:border-white/10 border-gray-200/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Shield className="w-8 h-8 text-indigo-500" />
              <div className="absolute inset-0 w-8 h-8 bg-indigo-500/20 blur-lg rounded-full group-hover:bg-indigo-500/30 transition-colors" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              SecureVault
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              /* User Dropdown */
              <div className="relative">
                <motion.button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 border border-white/10 dark:border-white/10 border-gray-200/30 transition-all duration-200 cursor-pointer"
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.displayName?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/10 dark:border-white/10 border-gray-200/50 shadow-xl shadow-black/20 z-20 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-white/5 dark:border-white/5 border-gray-200/30">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.displayName || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/dashboard/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </Link>
                          <Link
                            to="/dashboard/security"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                        </div>

                        <div className="border-t border-white/5 dark:border-white/5 border-gray-200/30 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Auth Buttons */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all duration-300"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <motion.button
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobile}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-gray-100/95 dark:bg-[#0d1220]/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 dark:border-white/5 border-gray-200/30">
                <Link to="/" onClick={closeMobile} className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    SecureVault
                  </span>
                </Link>
                <motion.button
                  onClick={closeMobile}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={link.href}
                      onClick={closeMobile}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-400 hover:bg-white/5 transition-all"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile Auth Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 dark:border-white/5 border-gray-200/30">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {user.displayName?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        closeMobile();
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobile}
                      className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 border border-white/10 dark:border-white/10 border-gray-300/30 hover:bg-white/5 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobile}
                      className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/50"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
