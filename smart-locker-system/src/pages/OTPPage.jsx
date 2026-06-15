import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import { ref, set } from "firebase/database";
import { rtdb } from "../config/firebase";
import {
  doc, setDoc, onSnapshot, serverTimestamp, Timestamp,
  collection, query, where, getDocs
} from "firebase/firestore";

const OTP_TTL = 60;

function NavSidebar({ active }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const NAV = [
    { label:"Dashboard",   icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",                                                                                                 path:"/dashboard" },
    { label:"Book Slot",   icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",                                                     path:"/booking"   },
    { label:"OTP",         icon:"M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",                 path:"/otp"       },
    { label:"Access Logs", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",           path:"/logs"      },
    { label:"Profile",     icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                          path:"/profile"   },
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

export default function OTPPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [otp, setOtp]             = useState(null);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const timerRef = useRef(null);

  // ── Fetch today's booking using imports (not require) ──
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      where("date", "==", today)
    );
    getDocs(q).then(snap => {
      const docs = snap.docs.filter(d => d.data().status !== "extension");
      if (docs.length > 0) setActiveSlot({ id: docs[0].id, ...docs[0].data() });
      setLoadingSlot(false);
    }).catch(() => setLoadingSlot(false));
  }, [user]);

  // ── Listen to OTP doc in real-time ──
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "otps", user.uid), snap => {
      if (snap.exists()) {
        const data = snap.data();
        const expiry = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        const left = Math.max(0, Math.floor((expiry - new Date()) / 1000));
        if (left > 0) { setOtp(data.code); setTimeLeft(left); }
        else { setOtp(null); setTimeLeft(0); }
      }
    });
    return () => unsub();
  }, [user]);

  // ── Countdown ticker ──
  useEffect(() => {
    clearInterval(timerRef.current);
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setOtp(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

const generateOTP = async () => {
  if (!user || generating) return;
  setGenerating(true);
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + OTP_TTL * 1000));
  const expiresAtMs = Date.now() + OTP_TTL * 1000;
  try {
    // Write to Firestore (for web app display)
    await setDoc(doc(db, "otps", user.uid), {
      code, userId: user.uid,
      userName: user.fullName || user.email,
      expiresAt, createdAt: serverTimestamp(), used: false,
    });

    // Write to Realtime Database (for ESP32 to read)
    await set(ref(rtdb, `otps/${user.uid}`), {
      code,
      expiresAt: expiresAtMs,
      used: false,
    });
  } catch(e) { console.error(e); }
  setGenerating(false);
};

  const copyOTP = () => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - (timeLeft / OTP_TTL));
  const digits = otp ? otp.split("") : ["–","–","–","–"];
  const timerColor = timeLeft > 20 ? "#6366f1" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0a0c1c 0%,#0d1025 60%,#0a1120 100%)",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:"#e2e8f0" }}>
      <NavSidebar active="/otp" />

      <div style={{ flex:1,overflow:"auto",padding:"32px 36px",display:"flex",flexDirection:"column" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ color:"#475569",fontSize:"0.82rem",marginBottom:4 }}>2FA Verification</div>
          <h1 style={{ fontSize:"1.6rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.03em",margin:0 }}>One-Time Password</h1>
        </div>

        {/* Slot status banner */}
        {!loadingSlot && (
          activeSlot ? (
            <div style={{ marginBottom:20,padding:"12px 18px",borderRadius:12,background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",display:"flex",alignItems:"center",gap:12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <span style={{ color:"#818cf8",fontSize:"0.85rem",fontWeight:500 }}>
                Active slot: <strong>{activeSlot.slotLabel}</strong> today
              </span>
            </div>
          ) : (
            <div style={{ marginBottom:20,padding:"12px 18px",borderRadius:12,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
              <span style={{ color:"#f87171",fontSize:"0.85rem" }}>No slot booked today. Book one first to use the locker.</span>
              <button onClick={() => navigate("/booking")} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.1)",color:"#f87171",fontSize:"0.8rem",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap" }}>
                Book Slot
              </button>
            </div>
          )
        )}

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,flex:1 }}>

          {/* OTP Panel */}
          <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:32,display:"flex",flexDirection:"column",alignItems:"center",gap:28 }}>

            {/* Circular countdown */}
            <div style={{ position:"relative",width:120,height:120 }}>
              <svg width="120" height="120" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="6"/>
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={timerColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={otp ? dashOffset : circumference}
                  style={{ transition:"stroke-dashoffset 1s linear, stroke 0.5s" }}
                />
              </svg>
              <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <div style={{ fontSize:"1.6rem",fontWeight:700,color:otp ? timerColor : "#334155",lineHeight:1 }}>
                  {otp ? timeLeft : "–"}
                </div>
                <div style={{ fontSize:"0.68rem",color:"#475569",marginTop:2 }}>seconds</div>
              </div>
            </div>

            {/* 4 digit boxes */}
            <div style={{ display:"flex",gap:12 }}>
              {digits.map((d, i) => (
                <div key={i} style={{
                  width:58,height:72,borderRadius:12,
                  background: otp ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.04)",
                  border:`1.5px solid ${otp ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.12)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"2rem",fontWeight:700,
                  color: otp ? "#f1f5f9" : "#334155",
                  fontVariantNumeric:"tabular-nums",transition:"all 0.3s"
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Status pill */}
            <div style={{ textAlign:"center" }}>
              {otp && timeLeft > 0 ? (
                <div style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",fontSize:"0.8rem",fontWeight:600 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:"#34d399" }}/>
                  Active — enter on keypad
                </div>
              ) : (
                <div style={{ color:"#475569",fontSize:"0.82rem" }}>
                  {timeLeft === 0 && otp !== null ? "OTP expired" : "No OTP generated yet"}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display:"flex",gap:12,width:"100%" }}>
              <button onClick={generateOTP} disabled={generating || !activeSlot} style={{
                flex:2,padding:"12px",borderRadius:10,border:"none",
                background: !activeSlot ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                color:"#fff",fontWeight:700,fontSize:"0.9rem",
                cursor:(!activeSlot||generating)?"not-allowed":"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                opacity:!activeSlot?0.5:1
              }}>
                {generating ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation:"spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                )}
                {otp && timeLeft > 0 ? "Regenerate OTP" : "Generate OTP"}
              </button>
              <button onClick={copyOTP} disabled={!otp || timeLeft === 0} style={{
                flex:1,padding:"12px",borderRadius:10,
                border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.08)",
                color:copied?"#34d399":"#818cf8",fontWeight:600,fontSize:"0.85rem",
                cursor:(!otp||timeLeft===0)?"not-allowed":"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                opacity:(!otp||timeLeft===0)?0.4:1
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {copied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}
                </svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:24 }}>
              <div style={{ color:"#94a3b8",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:16 }}>How to use</div>
              {[
                { n:"1", title:"Book your slot",       desc:"Reserve a time slot on the Booking page." },
                { n:"2", title:"Generate OTP",         desc:"Tap Generate OTP here. A 4-digit code appears." },
                { n:"3", title:"Go to the locker",     desc:"Walk to the locker and enter your PIN on the keypad." },
                { n:"4", title:"Enter OTP on keypad",  desc:"Type the 4-digit OTP when prompted. ESP32 verifies it with Firebase." },
                { n:"5", title:"Locker opens",         desc:"If PIN and OTP both match, the solenoid unlocks and access is logged." },
              ].map(s => (
                <div key={s.n} style={{ display:"flex",gap:14,marginBottom:14 }}>
                  <div style={{ width:26,height:26,borderRadius:8,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:700,color:"#818cf8",flexShrink:0 }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ color:"#e2e8f0",fontWeight:600,fontSize:"0.85rem" }}>{s.title}</div>
                    <div style={{ color:"#475569",fontSize:"0.78rem",marginTop:2,lineHeight:1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:20 }}>
              <div style={{ color:"#94a3b8",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:12 }}>Security notes</div>
              {[
                "OTP is valid for 60 seconds only",
                "Each OTP can only be used once",
                "Generating a new OTP invalidates the old one",
                "ESP32 reads your OTP directly from Firebase in real-time",
              ].map(n => (
                <div key={n} style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink:0,marginTop:2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ color:"#64748b",fontSize:"0.8rem",lineHeight:1.5 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}