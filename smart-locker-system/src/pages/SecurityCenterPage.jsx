import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  KeyRound,
  Clock,
  Activity,
  Calendar,
  Shield,
  Lock,
  XCircle,
  AlertCircle,
  Eye,
  Wifi,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';

// ── Mock Data ────────────────────────────────────────────────
const dailyData = [
  { day: 'Mon', successful: 8, failed: 1 },
  { day: 'Tue', successful: 12, failed: 2 },
  { day: 'Wed', successful: 6, failed: 0 },
  { day: 'Thu', successful: 15, failed: 3 },
  { day: 'Fri', successful: 10, failed: 1 },
  { day: 'Sat', successful: 4, failed: 0 },
  { day: 'Sun', successful: 3, failed: 1 },
];

const weeklyData = [
  { week: 'Week 1', successful: 42, failed: 5 },
  { week: 'Week 2', successful: 38, failed: 3 },
  { week: 'Week 3', successful: 51, failed: 7 },
  { week: 'Week 4', successful: 45, failed: 4 },
];

const monthlyData = [
  { month: 'Jan', successful: 120, failed: 15 },
  { month: 'Feb', successful: 145, failed: 12 },
  { month: 'Mar', successful: 132, failed: 18 },
  { month: 'Apr', successful: 168, failed: 10 },
  { month: 'May', successful: 155, failed: 14 },
  { month: 'Jun', successful: 98, failed: 8 },
];

const securityAlerts = [
  {
    id: 1,
    type: 'Failed Login',
    severity: 'high',
    description: 'Multiple failed login attempts from IP 192.168.1.110',
    timestamp: '2026-06-13 09:45:00',
    icon: ShieldX,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    id: 2,
    type: 'Failed OTP',
    severity: 'medium',
    description: 'Invalid OTP entered 3 consecutive times by user U1003',
    timestamp: '2026-06-13 08:30:00',
    icon: KeyRound,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    id: 3,
    type: 'Unauthorized Access',
    severity: 'critical',
    description: 'Attempt to access locker without valid credentials',
    timestamp: '2026-06-12 22:15:00',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    id: 4,
    type: 'Suspicious Activity',
    severity: 'medium',
    description: 'Login from new geographic location detected',
    timestamp: '2026-06-12 18:00:00',
    icon: Eye,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    id: 5,
    type: 'Brute Force',
    severity: 'high',
    description: 'Rate limit triggered - 10 requests in 1 minute from IP 10.0.0.99',
    timestamp: '2026-06-12 14:20:00',
    icon: ShieldAlert,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    id: 6,
    type: 'Session Expired',
    severity: 'low',
    description: 'Auto logout triggered due to 30-minute inactivity',
    timestamp: '2026-06-12 11:00:00',
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
  },
];

const activityTimeline = [
  { id: 1, action: 'User johndoe logged in', time: '10 min ago', icon: Activity, color: 'text-emerald-400' },
  { id: 2, action: 'OTP generated for user janedoe', time: '25 min ago', icon: KeyRound, color: 'text-cyan-400' },
  { id: 3, action: 'Locker opened by user U1001', time: '30 min ago', icon: Lock, color: 'text-indigo-400' },
  { id: 4, action: 'Failed login attempt detected', time: '1 hour ago', icon: XCircle, color: 'text-red-400' },
  { id: 5, action: 'System security scan completed', time: '2 hours ago', icon: Shield, color: 'text-emerald-400' },
  { id: 6, action: 'New user alicewong registered', time: '3 hours ago', icon: Activity, color: 'text-cyan-400' },
  { id: 7, action: 'Daily backup completed successfully', time: '5 hours ago', icon: Shield, color: 'text-emerald-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ── Custom Tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function SecurityCenterPage() {
  const [chartRange, setChartRange] = useState('daily');

  const chartData = chartRange === 'daily' ? dailyData : chartRange === 'weekly' ? weeklyData : monthlyData;
  const xKey = chartRange === 'daily' ? 'day' : chartRange === 'weekly' ? 'week' : 'month';

  return (
    <DashboardLayout title="Security Center" subtitle="Monitor security events and analytics">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Alert Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={ShieldX}
            label="Failed Login Attempts"
            value={3}
            color="rose"
            delay={0}
            change="+1 today"
            changeType="increase"
          />
          <StatCard
            icon={KeyRound}
            label="Failed OTP Attempts"
            value={2}
            color="amber"
            delay={1}
            change="Same as yesterday"
            changeType="neutral"
          />
          <StatCard
            icon={AlertTriangle}
            label="Unauthorized Access"
            value={1}
            color="rose"
            delay={2}
            change="-2 this week"
            changeType="decrease"
          />
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Access Analytics
              </h3>
              <div className="flex items-center gap-2">
                {['daily', 'weekly', 'monthly'].map((range) => (
                  <motion.button
                    key={range}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      chartRange === range
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Line Chart */}
              <div className="lg:col-span-1">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {chartRange === 'daily' ? 'Daily' : chartRange === 'weekly' ? 'Weekly' : 'Monthly'} Trend
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="successful"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={{ fill: '#818cf8', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                      name="Successful"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ fill: '#f87171', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, stroke: '#f87171', strokeWidth: 2 }}
                      name="Failed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="lg:col-span-1">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Comparison
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="successful" fill="#818cf8" radius={[4, 4, 0, 0]} name="Successful" />
                    <Bar dataKey="failed" fill="#f87171" radius={[4, 4, 0, 0]} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Area Chart */}
              <div className="lg:col-span-1">
                <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Volume
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="successful"
                      stroke="#818cf8"
                      fill="url(#successGradient)"
                      strokeWidth={2}
                      name="Successful"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#f87171"
                      fill="url(#failGradient)"
                      strokeWidth={2}
                      name="Failed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400" />
                <span className="text-sm text-gray-400">Successful Access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-sm text-gray-400">Failed Attempts</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Security Alerts */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <GlassCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Security Alerts
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-400 text-xs font-medium">{securityAlerts.length} alerts</span>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {securityAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`flex items-start gap-4 p-4 rounded-xl ${alert.bgColor} border ${alert.borderColor} hover:bg-opacity-20 transition-all group`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${alert.bgColor} border ${alert.borderColor} flex items-center justify-center flex-shrink-0`}>
                      <alert.icon className={`w-5 h-5 ${alert.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${alert.color}`}>{alert.type}</span>
                        <StatusBadge
                          status={alert.severity === 'critical' ? 'failed' : alert.severity === 'high' ? 'locked' : alert.severity === 'medium' ? 'pending' : 'expired'}
                          size="sm"
                        />
                      </div>
                      <p className="text-sm text-gray-300">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <GlassCard className="p-6 h-full">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Activity Timeline
              </h3>
              <div className="space-y-1">
                {activityTimeline.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative flex items-start gap-4 py-3 group"
                  >
                    {/* Connecting line */}
                    {index < activityTimeline.length - 1 && (
                      <div className="absolute left-5 top-[3.25rem] w-px h-[calc(100%-1.5rem)] bg-white/5" />
                    )}

                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/20 transition-colors">
                      <event.icon className={`w-5 h-5 ${event.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{event.action}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-400" />
              System Status
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Firebase Auth', status: 'Operational', color: 'emerald' },
                { label: 'Firestore DB', status: 'Operational', color: 'emerald' },
                { label: 'ESP32 Connection', status: 'Connected', color: 'emerald' },
                { label: 'Rate Limiter', status: 'Active', color: 'cyan' },
              ].map((sys, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{sys.label}</p>
                    <p className={`text-xs text-${sys.color}-400`}>{sys.status}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full bg-${sys.color}-400 shadow-lg shadow-${sys.color}-400/30`} />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
