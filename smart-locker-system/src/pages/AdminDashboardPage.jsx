import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  KeyRound,
  Unlock,
  ShieldAlert,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Settings,
  Lock,
  Eye,
  RefreshCw,
  AlertTriangle,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import LockerAnimation from '../components/features/LockerAnimation';

// ── Mock Data ────────────────────────────────────────────────
const mockUsers = [
  { userId: 'U1001', fullName: 'John Doe', username: 'johndoe', email: 'john@example.com', mobileNumber: '9876543210', role: 'admin', isActive: true, createdAt: '2026-01-15' },
  { userId: 'U1002', fullName: 'Jane Doe', username: 'janedoe', email: 'jane@example.com', mobileNumber: '9876543211', role: 'user', isActive: true, createdAt: '2026-02-10' },
  { userId: 'U1003', fullName: 'Bob Smith', username: 'bobsmith', email: 'bob@example.com', mobileNumber: '9876543212', role: 'user', isActive: false, createdAt: '2026-02-20' },
  { userId: 'U1004', fullName: 'Alice Wong', username: 'alicewong', email: 'alice@example.com', mobileNumber: '9876543213', role: 'user', isActive: true, createdAt: '2026-03-05' },
  { userId: 'U1005', fullName: 'Charlie Brown', username: 'charlie_b', email: 'charlie@example.com', mobileNumber: '9876543214', role: 'user', isActive: true, createdAt: '2026-03-15' },
  { userId: 'U1006', fullName: 'David Kim', username: 'david_k', email: 'david@example.com', mobileNumber: '9876543215', role: 'user', isActive: true, createdAt: '2026-04-01' },
  { userId: 'U1007', fullName: 'Eve Martin', username: 'eve_martin', email: 'eve@example.com', mobileNumber: '9876543216', role: 'user', isActive: true, createdAt: '2026-04-20' },
  { userId: 'U1008', fullName: 'Frank Zhang', username: 'frank_z', email: 'frank@example.com', mobileNumber: '9876543217', role: 'user', isActive: false, createdAt: '2026-05-01' },
  { userId: 'U1009', fullName: 'Grace Hill', username: 'grace_h', email: 'grace@example.com', mobileNumber: '9876543218', role: 'user', isActive: true, createdAt: '2026-05-10' },
  { userId: 'U1010', fullName: 'Henry Lee', username: 'henry_l', email: 'henry@example.com', mobileNumber: '9876543219', role: 'user', isActive: true, createdAt: '2026-05-25' },
];

const mockRecentLogs = [
  { logId: 'LOG-001', userId: 'U1001', username: 'johndoe', action: 'Locker Opened', status: 'success', timestamp: '2026-06-13 10:30:15' },
  { logId: 'LOG-002', userId: 'U1002', username: 'janedoe', action: 'OTP Generated', status: 'success', timestamp: '2026-06-13 10:25:30' },
  { logId: 'LOG-003', userId: 'U1003', username: 'bobsmith', action: 'Login Failed', status: 'failed', timestamp: '2026-06-13 10:20:45' },
  { logId: 'LOG-004', userId: 'U1004', username: 'alicewong', action: 'Locker Opened', status: 'success', timestamp: '2026-06-13 09:55:00' },
  { logId: 'LOG-005', userId: 'U1005', username: 'charlie_b', action: 'OTP Expired', status: 'failed', timestamp: '2026-06-13 09:30:12' },
  { logId: 'LOG-006', userId: 'U1006', username: 'david_k', action: 'Locker Opened', status: 'success', timestamp: '2026-06-13 09:15:00' },
  { logId: 'LOG-007', userId: 'U1001', username: 'johndoe', action: 'OTP Generated', status: 'success', timestamp: '2026-06-13 08:45:30' },
  { logId: 'LOG-008', userId: 'U1007', username: 'eve_martin', action: 'Login Success', status: 'success', timestamp: '2026-06-12 16:30:00' },
  { logId: 'LOG-009', userId: 'U1008', username: 'frank_z', action: 'Login Failed', status: 'failed', timestamp: '2026-06-12 15:20:00' },
  { logId: 'LOG-010', userId: 'U1009', username: 'grace_h', action: 'Locker Opened', status: 'success', timestamp: '2026-06-12 14:10:00' },
];

const mockOTPRecords = [
  { otpId: 'OTP-001', userId: 'U1001', username: 'johndoe', otp: '7284', generatedAt: '2026-06-13 10:30:00', status: 'Used' },
  { otpId: 'OTP-002', userId: 'U1002', username: 'janedoe', otp: '3951', generatedAt: '2026-06-13 10:25:00', status: 'Active' },
  { otpId: 'OTP-003', userId: 'U1004', username: 'alicewong', otp: '6427', generatedAt: '2026-06-13 09:50:00', status: 'Used' },
  { otpId: 'OTP-004', userId: 'U1005', username: 'charlie_b', otp: '1893', generatedAt: '2026-06-13 09:25:00', status: 'Expired' },
  { otpId: 'OTP-005', userId: 'U1006', username: 'david_k', otp: '5016', generatedAt: '2026-06-13 09:10:00', status: 'Used' },
  { otpId: 'OTP-006', userId: 'U1001', username: 'johndoe', otp: '8342', generatedAt: '2026-06-13 08:40:00', status: 'Used' },
  { otpId: 'OTP-007', userId: 'U1007', username: 'eve_martin', otp: '2759', generatedAt: '2026-06-12 16:25:00', status: 'Used' },
  { otpId: 'OTP-008', userId: 'U1009', username: 'grace_h', otp: '4681', generatedAt: '2026-06-12 14:05:00', status: 'Used' },
  { otpId: 'OTP-009', userId: 'U1010', username: 'henry_l', otp: '9134', generatedAt: '2026-06-12 12:30:00', status: 'Expired' },
  { otpId: 'OTP-010', userId: 'U1002', username: 'janedoe', otp: '3578', generatedAt: '2026-06-12 10:15:00', status: 'Used' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(mockUsers);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // In demo mode, admin role is always granted via mockUser
  const isAdmin = true;

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.userId.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.userId !== userId));
    setDeleteConfirm(null);
    toast.success(`User ${userId} deleted successfully`);
  };

  const handleToggleStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
    const user = users.find((u) => u.userId === userId);
    toast.success(`User ${userId} ${user?.isActive ? 'disabled' : 'enabled'}`);
  };

  // Access denied for non-admin
  if (!isAdmin) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6"
          >
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">You don't have admin privileges to access this page.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            Go to Dashboard
          </motion.button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'logs', label: 'Access Logs', icon: Activity },
    { id: 'otp', label: 'OTP Records', icon: KeyRound },
    { id: 'locker', label: 'Locker Monitor', icon: Lock },
  ];

  const activeUsers = users.filter((u) => u.isActive).length;
  const otpToday = mockOTPRecords.filter((o) => o.generatedAt.startsWith('2026-06-13')).length;

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System administration and monitoring">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Total Users" value={users.length} color="indigo" delay={0} />
          <StatCard icon={UserCheck} label="Active Users" value={activeUsers} color="emerald" delay={1} />
          <StatCard icon={KeyRound} label="OTP Today" value={otpToday} color="cyan" delay={2} />
          <StatCard icon={Unlock} label="Successful Unlocks" value={156} color="emerald" delay={3} />
          <StatCard icon={ShieldAlert} label="Failed Attempts" value={12} color="rose" delay={4} />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    User Management
                    <span className="text-sm font-normal text-gray-500">({filteredUsers.length})</span>
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['User ID', 'Full Name', 'Username', 'Email', 'Mobile', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-mono text-indigo-400">{user.userId}</td>
                          <td className="px-4 py-3 text-sm text-white">{user.fullName}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">@{user.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.mobileNumber}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={user.isActive ? 'active' : 'expired'} size="sm" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleStatus(user.userId)}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                  user.isActive
                                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title={user.isActive ? 'Disable User' : 'Enable User'}
                              >
                                {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setDeleteConfirm(user.userId)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <UserX className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No users found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Access Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Recent Access Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Log ID', 'User ID', 'Username', 'Action', 'Status', 'Timestamp'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mockRecentLogs.map((log, idx) => (
                        <motion.tr
                          key={log.logId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-mono text-indigo-400">{log.logId}</td>
                          <td className="px-4 py-3 text-sm font-mono text-cyan-400">{log.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">@{log.username}</td>
                          <td className="px-4 py-3 text-sm text-white">{log.action}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={log.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {log.timestamp}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* OTP Records Tab */}
          {activeTab === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  OTP Records
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['OTP ID', 'User ID', 'Username', 'OTP Code', 'Generated At', 'Status'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mockOTPRecords.map((otp, idx) => (
                        <motion.tr
                          key={otp.otpId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-mono text-indigo-400">{otp.otpId}</td>
                          <td className="px-4 py-3 text-sm font-mono text-cyan-400">{otp.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">@{otp.username}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-lg font-bold tracking-widest text-white">
                              {otp.status === 'Active' ? otp.otp : '••••'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">{otp.generatedAt}</td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={otp.status === 'Active' ? 'active' : otp.status === 'Used' ? 'used' : 'expired'}
                              size="sm"
                            />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Locker Monitor Tab */}
          {activeTab === 'locker' && (
            <motion.div
              key="locker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  Locker Monitor
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Locker Animation */}
                  <div className="flex flex-col items-center justify-center">
                    <LockerAnimation status="locked" size="lg" />
                    <div className="mt-6 text-center">
                      <StatusBadge status="locked" size="lg" />
                      <p className="text-sm text-gray-400 mt-3">Last updated: 2 minutes ago</p>
                    </div>
                  </div>

                  {/* Locker Info */}
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-white mb-4">Locker Information</h4>
                    {[
                      { label: 'Locker ID', value: 'LCK-001', mono: true },
                      { label: 'Current Status', value: 'Locked', color: 'text-red-400' },
                      { label: 'Last Accessed By', value: 'U1001 (johndoe)' },
                      { label: 'Last Access Time', value: '2026-06-13 10:30:15' },
                      { label: 'Total Accesses Today', value: '8' },
                      { label: 'Security Level', value: '2FA Enabled', color: 'text-emerald-400' },
                      { label: 'ESP32 Status', value: 'Connected', color: 'text-emerald-400' },
                      { label: 'Firmware Version', value: 'v2.1.4', mono: true },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                      >
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className={`text-sm ${item.color || 'text-white'} ${item.mono ? 'font-mono text-indigo-400' : ''}`}>
                          {item.value}
                        </span>
                      </motion.div>
                    ))}

                    {/* Quick actions */}
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Unlock className="w-4 h-4" />
                        Force Unlock
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Status
                      </motion.button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Delete User</h3>
                    <p className="text-sm text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-6">
                  Are you sure you want to delete user <span className="font-mono text-indigo-400">{deleteConfirm}</span>? All associated data including OTP records and access logs will be permanently removed.
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDeleteConfirm(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteUser(deleteConfirm)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/25 hover:from-red-500 hover:to-red-400 transition-all cursor-pointer"
                  >
                    Delete User
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
