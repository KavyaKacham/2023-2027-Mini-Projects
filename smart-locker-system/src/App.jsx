// ============================================================
// App.jsx — Root Application Component with Routing
// ============================================================
import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';

// ── Lazy-loaded Pages ──────────────────────────────────────
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const OTPPage            = lazy(() => import('./pages/OTPPage'));
const AccessLogsPage     = lazy(() => import('./pages/AccessLogsPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));
const SecurityCenterPage = lazy(() => import('./pages/SecurityCenterPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const BookingPage        = lazy(() => import('./pages/BookingPage'));   // ← ADDED

// ── Page Transition Variants ───────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  in:      { opacity: 1, y: 0  },
  out:     { opacity: 0, y: -16 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// ── Animated Page Wrapper ──────────────────────────────────
function AnimatedPage({ children }) {
  return (
    <motion.div
      className="motion-page"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

// ── Loading Fallback ───────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
        <p className="text-sm text-dark-400 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

// ── Protected Route Wrapper ────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

// ── Background Blobs ───────────────────────────────────────
function BackgroundBlobs() {
  return (
    <div className="blob-bg" aria-hidden="true">
      <div className="blob blob-indigo" />
      <div className="blob blob-cyan" />
      <div className="blob blob-purple" />
    </div>
  );
}

// ── App Component ──────────────────────────────────────────
function App() {
  const location = useLocation();

  return (
    <>
      <BackgroundBlobs />

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* ── Public Routes ── */}
            <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
            <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
            <Route path="/login"    element={<AnimatedPage><LoginPage /></AnimatedPage>} />

            {/* ── Protected Routes ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute><AnimatedPage><DashboardPage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/booking" element={
              <ProtectedRoute><AnimatedPage><BookingPage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/otp" element={
              <ProtectedRoute><AnimatedPage><OTPPage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/logs" element={
              <ProtectedRoute><AnimatedPage><AccessLogsPage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/profile" element={
              <ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/security" element={
              <ProtectedRoute><AnimatedPage><SecurityCenterPage /></AnimatedPage></ProtectedRoute>
            }/>

            <Route path="/admin" element={
              <ProtectedRoute><AnimatedPage><AdminDashboardPage /></AnimatedPage></ProtectedRoute>
            }/>

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;