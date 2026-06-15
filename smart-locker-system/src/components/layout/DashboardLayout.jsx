import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import AnimatedBackground from '../ui/AnimatedBackground';
import { useAuth } from '../../hooks/useAuth';

const DashboardLayout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a] transition-colors duration-300">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen relative z-10">
        {/* Top Header Bar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-0 z-30 bg-white/5 dark:bg-gray-900/40 bg-white/60 backdrop-blur-xl border-b border-white/5 dark:border-white/5 border-gray-200/20"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Greeting (shown on mobile instead of toggle) */}
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5 hidden sm:block">
                  {getGreeting()},{' '}
                  <span className="text-indigo-400 font-medium">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </span>
                </p>

                {/* Page Title */}
                {title && (
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {title}
                  </h1>
                )}

                {/* Subtitle / Breadcrumb */}
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Right side - optional status indicators */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">
                    System Secure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
