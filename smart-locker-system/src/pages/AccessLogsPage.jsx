import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

function NavSidebar({ active }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const NAV = [
    { label:"Dashboard", icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", path:"/dashboard" },
    { label:"Book Slot",  icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", path:"/booking" },
    { label:"OTP",        icon:"M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z", path:"/otp" },
    { label:"Access Logs",icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", path:"/logs" },
    { label:"Profile",    icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", path:"/profile" },
  ];
  return (
    <div style={{ width:220,flexShrink:0,background:"rgba(10,12,28,0.8)",borderRight:"1px solid rgba(99,102,241,0.15)",display:"flex",flexDirection:"column",padding:"24px 0" }}>
      <div style={{ padding:"0 20px 28px",borderBottom:"1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <span style={{ fontWeight:700,fontSize:"1rem",color:"#f1f5f9",letterSpacing:"-0.02em" }}>SecureVault</span>
        </div>
      </div>
      <nav style={{ flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4 }}>
        {NAV.map(n => {
          const isActive = n.path === active;
          return (
            <button key={n.path} onClick={() => navigate(n.path)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",background:isActive?"rgba(99,102,241,0.18)":"transparent",color:isActive?"#818cf8":"#64748b",fontSize:"0.85rem",fontWeight:isActive?600:400,textAlign:"left",width:"100%",transition:"all 0.15s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>
              {n.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"16px 12px",borderTop:"1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"0 4px 12px" }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.8rem",fontWeight:700,color:"#fff",flexShrink:0 }}>
            {(user?.fullName||user?.email||"U")[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:"0.82rem",fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.fullName||"User"}</div>
            <div style={{ fontSize:"0.72rem",color:"#475569" }}>{user?.role||"user"}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }} style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(239,68,68,0.25)",background:"rgba(239,68,68,0.06)",color:"#f87171",fontSize:"0.82rem",cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AccessLogsPage() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [myOnly, setMyOnly] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "accessLogs"),
      where("userId", "==", user.uid),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          success: data.success === true || data.success === "true" || data.success === 1,
        };
      }));
    });
    return () => unsub();
  }, []);

  const fmt = (ts) => {
    if (!ts) return "--";
    try {
      const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
      if (isNaN(d)) return "--";
      return d.toLocaleString([], { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
    } catch { return "--"; }
  };

  const filtered = logs
    .filter(l => filter === "all" ? true : filter === "success" ? l.success : !l.success)
    .filter(l => myOnly ? l.userId === user?.uid : true);

  const successCount = logs.filter(l=>l.success).length;
  const failCount    = logs.filter(l=>!l.success).length;
  const myCount      = logs.filter(l=>l.userId===user?.uid).length;

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0a0c1c 0%,#0d1025 60%,#0a1120 100%)",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:"#e2e8f0" }}>
      <NavSidebar active="/logs" />

      <div style={{ flex:1,overflow:"auto",padding:"32px 36px" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ color:"#475569",fontSize:"0.82rem",marginBottom:4 }}>Security</div>
          <h1 style={{ fontSize:"1.6rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.03em",margin:0 }}>Access Logs</h1>
        </div>

        {/* Stats */}
        <div style={{ display:"flex",gap:14,marginBottom:24,flexWrap:"wrap" }}>
          {[
            { label:"Total Events",  value:logs.length,    accent:"indigo" },
            { label:"Successful",    value:successCount,   accent:"green" },
            { label:"Failed",        value:failCount,      accent:"red" },
            { label:"My Accesses",   value:myCount,        accent:"cyan" },
          ].map(s => {
            const colors = {
              indigo:{ bg:"rgba(99,102,241,0.1)",  border:"rgba(99,102,241,0.3)",  text:"#818cf8" },
              green: { bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.3)",  text:"#34d399" },
              red:   { bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.3)",   text:"#f87171" },
              cyan:  { bg:"rgba(34,211,238,0.1)",  border:"rgba(34,211,238,0.3)",  text:"#22d3ee" },
            }[s.accent];
            return (
              <div key={s.label} style={{ background:colors.bg,border:`1px solid ${colors.border}`,borderRadius:14,padding:"18px 20px",flex:1,minWidth:130 }}>
                <div style={{ fontSize:"1.8rem",fontWeight:700,color:colors.text,lineHeight:1 }}>{s.value}</div>
                <div style={{ color:"#94a3b8",fontSize:"0.78rem",marginTop:6,fontWeight:500 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:18,flexWrap:"wrap" }}>
          {["all","success","failed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"7px 16px",borderRadius:20,border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:500,
              background: filter===f ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.06)",
              color: filter===f ? "#818cf8" : "#475569",
              border: filter===f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(99,102,241,0.1)"
            }}>
              {f==="all" ? "All events" : f==="success" ? "Granted" : "Denied"}
            </button>
          ))}
          <button onClick={() => setMyOnly(v => !v)} style={{
            padding:"7px 16px",borderRadius:20,border:"none",cursor:"pointer",fontSize:"0.82rem",fontWeight:500,
            background: myOnly ? "rgba(34,211,238,0.15)" : "rgba(99,102,241,0.06)",
            color: myOnly ? "#22d3ee" : "#475569",
            border: myOnly ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(99,102,241,0.1)"
          }}>
            {myOnly ? "My logs ✓" : "My logs only"}
          </button>
          <span style={{ color:"#334155",fontSize:"0.78rem",marginLeft:"auto" }}>{filtered.length} events</span>
        </div>

        {/* Table */}
        <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,overflow:"hidden" }}>
          <div style={{ display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.5fr",padding:"12px 20px",borderBottom:"1px solid rgba(99,102,241,0.1)" }}>
            {["User","Time","Method","Result","Duration"].map(h => (
              <div key={h} style={{ color:"#475569",fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding:"48px 20px",textAlign:"center",color:"#334155",fontSize:"0.85rem" }}>
              No access events yet. Logs appear here when the ESP32 records an access attempt.
            </div>
          ) : (
            filtered.map((log, i) => (
              <div key={log.id} style={{
                display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.5fr",
                padding:"13px 20px",
                borderBottom: i < filtered.length-1 ? "1px solid rgba(99,102,241,0.06)" : "none",
                background: log.userId===user?.uid ? "rgba(99,102,241,0.04)" : "transparent"
              }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:700,color:"#818cf8",flexShrink:0 }}>
                    {(log.userName||"?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color:"#e2e8f0",fontSize:"0.85rem",fontWeight:500 }}>{log.userName||"Unknown"}</div>
                    <div style={{ color:"#334155",fontSize:"0.72rem" }}>{log.userId?.slice(0,8)||"--"}…</div>
                  </div>
                </div>
                <div style={{ color:"#94a3b8",fontSize:"0.82rem",display:"flex",alignItems:"center" }}>{fmt(log.timestamp)}</div>
                <div style={{ display:"flex",alignItems:"center" }}>
                  <span style={{ padding:"3px 10px",borderRadius:20,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8",fontSize:"0.72rem",fontWeight:500 }}>
                    {log.method||"PIN+OTP"}
                  </span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:log.success?"#34d399":"#f87171",flexShrink:0 }}/>
                  <span style={{ color:log.success?"#34d399":"#f87171",fontSize:"0.82rem",fontWeight:500 }}>
                    {log.success ? "Granted" : "Denied"}
                  </span>
                </div>
                <div style={{ color:"#475569",fontSize:"0.82rem",display:"flex",alignItems:"center" }}>
                  {log.duration ? `${log.duration} min` : "--"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}