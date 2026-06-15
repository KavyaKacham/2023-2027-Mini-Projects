import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import {
  collection, query, orderBy, limit, onSnapshot,
  where, getDocs
} from "firebase/firestore";

const NAV = [
  { label: "Dashboard",   icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",                                                                                                        path: "/dashboard" },
  { label: "Book Slot",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",                                                             path: "/booking"   },
  { label: "OTP",         icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",                        path: "/otp"       },
  { label: "Access Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",                path: "/logs"      },
  { label: "Profile",     icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                                path: "/profile"   },
];

function StatCard({ label, value, sub, accent }) {
  const colors = {
    indigo: { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.3)",  text: "#818cf8" },
    cyan:   { bg: "rgba(34,211,238,0.1)",  border: "rgba(34,211,238,0.3)",  text: "#22d3ee" },
    green:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  text: "#34d399" },
    red:    { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   text: "#f87171" },
  };
  const c = colors[accent] || colors.indigo;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: c.text, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: "#475569", fontSize: "0.72rem", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [time, setTime]             = useState(new Date());
  const [activeSlot, setActiveSlot] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [slotTimeLeft, setSlotTimeLeft] = useState(null);
  const [stats, setStats]           = useState({ total: 0, success: 0, mine: 0, failed: 0 });

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch today's active slot from bookings collection ──────────────
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      where("date",   "==", today)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // pick the slot that is currently active (now is between start and end)
        const now = new Date();
        let found = null;
        snap.docs.forEach(d => {
          const data = d.data();
          const start = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
          const end   = data.endTime?.toDate   ? data.endTime.toDate()   : new Date(data.endTime);
          // show slot if it hasn't ended yet (upcoming or active)
          if (end > now) found = { id: d.id, ...data };
        });
        setActiveSlot(found);
      } else {
        setActiveSlot(null);
      }
    });
    return () => unsub();
  }, [user]);

  // ── Slot countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSlot) { setSlotTimeLeft(null); return; }
    const tick = () => {
      const end  = activeSlot.endTime?.toDate ? activeSlot.endTime.toDate() : new Date(activeSlot.endTime);
      const diff = Math.max(0, Math.floor((end - new Date()) / 1000));
      const m    = Math.floor(diff / 60);
      const s    = diff % 60;
      setSlotTimeLeft(diff > 0 ? `${m}m ${s}s` : "Expired");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeSlot]);

  // ── Recent access logs ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "accessLogs"),
      where("userId", "==", user.uid),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentLogs(logs);
      setStats({
        total:   logs.length,
        success: logs.filter(l => l.success).length,
        failed:  logs.filter(l => !l.success).length,
        mine:    logs.filter(l => l.userId === user?.uid || l.userId === user?.userId).length,
      });
    });
    return () => unsub();
  }, [user]);

  const formatTime = (ts) => {
    if (!ts) return "--";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg,#0a0c1c 0%,#0d1025 60%,#0a1120 100%)", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#e2e8f0" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 220, flexShrink: 0, background: "rgba(10,12,28,0.8)", borderRight: "1px solid rgba(99,102,241,0.15)", display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div style={{ padding: "0 20px 28px", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>SecureVault</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(n => {
            const active = window.location.pathname === n.path;
            return (
              <button key={n.path} onClick={() => navigate(n.path)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "rgba(99,102,241,0.18)" : "transparent", color: active ? "#818cf8" : "#64748b", fontSize: "0.85rem", fontWeight: active ? 600 : 400, textAlign: "left", width: "100%", transition: "all 0.15s" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(user?.fullName || user?.email || "U")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.fullName || "User"}</div>
              <div style={{ fontSize: "0.72rem", color: "#475569" }}>{user?.role || "user"}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ color: "#475569", fontSize: "0.82rem", marginBottom: 4 }}>
              {time.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", margin: 0 }}>
              {greeting}, {user?.fullName?.split(" ")[0] || "there"}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }}/>
            <span style={{ color: "#475569", fontSize: "0.8rem" }}>
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard accent="indigo" label="Total Events"  value={stats.total}   sub="From access logs" />
          <StatCard accent="cyan"   label="Successful"    value={stats.success} sub="Access granted"   />
          <StatCard accent="green"  label="My Accesses"   value={stats.mine}    sub="Your entries"     />
          <StatCard accent="red"    label="Failed"        value={stats.failed}  sub="Access denied"    />
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Locker Status */}
          <div style={{ background: "rgba(15,17,35,0.75)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#94a3b8", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>Locker Status</h2>
              <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.78rem", fontWeight: 600 }}>
                Locked
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="36" height="36" viewBox="0 0 56 56" fill="none">
                  <rect x="10" y="26" width="36" height="26" rx="6" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="2"/>
                  <path d="M18 26v-8a10 10 0 0120 0v8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="28" cy="40" r="3" fill="#ef4444"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "1rem", marginBottom: 4 }}>Locker is secured</div>
                <div style={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  {activeSlot ? "You have an active slot. Generate OTP to unlock." : "No active slot. Book a slot to gain access."}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {[
                { label: "Last Access", value: recentLogs[0] ? formatTime(recentLogs[0].timestamp) : "--" },
                { label: "Today's Opens", value: recentLogs.filter(l => { if (!l.timestamp) return false; const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp); return d.toDateString() === new Date().toDateString(); }).length },
                { label: "2FA", value: "Active" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(99,102,241,0.1)" }}>
                  <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{s.value}</div>
                  <div style={{ color: "#475569", fontSize: "0.72rem", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* My Active Slot */}
          <div style={{ background: "rgba(15,17,35,0.75)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#94a3b8", margin: "0 0 20px", letterSpacing: "0.05em", textTransform: "uppercase" }}>My Active Slot</h2>

            {activeSlot ? (
              <div>
                <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                  <div style={{ color: "#818cf8", fontSize: "0.78rem", fontWeight: 600, marginBottom: 6 }}>BOOKED</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem" }}>
                    {activeSlot.slotLabel || `${formatTime(activeSlot.startTime)} → ${formatTime(activeSlot.endTime)}`}
                  </div>
                  <div style={{ color: "#475569", fontSize: "0.8rem", marginTop: 4 }}>{activeSlot.date || "Today"}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ color: "#22d3ee", fontWeight: 700, fontSize: "1.2rem" }}>{slotTimeLeft || "--"}</div>
                    <div style={{ color: "#475569", fontSize: "0.72rem", marginTop: 2 }}>Time remaining</div>
                  </div>
                  <button onClick={() => navigate("/otp")} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                    Get OTP →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 14 }}>No active slot right now</div>
                <button onClick={() => navigate("/booking")} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.1)", color: "#818cf8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                  Book a Slot
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div style={{ background: "rgba(15,17,35,0.75)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#94a3b8", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>Recent Activity</h2>
            <button onClick={() => navigate("/logs")} style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500 }}>View all →</button>
          </div>

          {recentLogs.length === 0 ? (
            <div style={{ color: "#475569", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
              No access logs yet. Add a test document in Firestore → accessLogs collection.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentLogs.map(log => (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", borderRadius: 10, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.08)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: log.success ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${log.success ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={log.success ? "#34d399" : "#f87171"} strokeWidth="2.2" strokeLinecap="round">
                      {log.success ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></> : <path d="M18 6L6 18M6 6l12 12"/>}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 500 }}>{log.userName || log.userId || "Unknown"}</div>
                    <div style={{ color: "#475569", fontSize: "0.75rem" }}>{log.method || "PIN+OTP"} · {log.success ? "Access granted" : "Access denied"}</div>
                  </div>
                  <div style={{ color: "#475569", fontSize: "0.78rem", flexShrink: 0 }}>{formatTime(log.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}