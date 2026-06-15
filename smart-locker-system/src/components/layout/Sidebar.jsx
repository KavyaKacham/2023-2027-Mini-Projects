import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LayoutDashboard,
  KeyRound,
  ScrollText,
  UserCircle,
  ShieldAlert,
  Settings,
  LogOut,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'OTP Management', icon: KeyRound, path: '/otp' },
  { label: 'Access Logs', icon: ScrollText, path: '/logs' },
  { label: 'Profile', icon: UserCircle, path: '/profile' },
  { label: 'Security Center', icon: ShieldAlert, path: '/security' },
];

const adminItems = [
  { label: 'Admin Panel', icon: Settings, path: '/admin' },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 dark:border-white/5 border-gray-200/20">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="relative">
            <Shield className="w-7 h-7 text-indigo-500" />
            <div className="absolute inset-0 w-7 h-7 bg-indigo-500/20 blur-md rounded-full" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            SecureVault
          </span>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-300 transition-colors lg:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-600">
          Navigation
        </p>
        {allItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
            >
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle?.();
                }}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500 ml-0'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 border-l-2 border-transparent'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-[18px] h-[18px] transition-colors ${
                        isActive
                          ? 'text-indigo-400'
                          : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>

                    {/* Active indicator glow */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-indigo-500/10 -z-10"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-4 border-t border-white/5 dark:border-white/5 border-gray-200/20">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 dark:bg-white/5 bg-gray-100/60 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() ||
              'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate capitalize">
              {user?.role || 'user'}
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 z-40 bg-white/5 dark:bg-gray-900/60 bg-white/80 backdrop-blur-xl border-r border-white/10 dark:border-white/10 border-gray-200/30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-64 z-50 bg-gray-50/95 dark:bg-[#0d1220]/95 backdrop-blur-xl border-r border-white/10 dark:border-white/10 border-gray-200/30 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button (floating) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onToggle}
          className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white/10 dark:bg-gray-900/60 backdrop-blur-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 transition-all lg:hidden shadow-lg cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </motion.button>
      )}
    </>
  );
};

export default Sidebar;
