import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { db } from "../config/firebase";
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp, Timestamp, updateDoc
} from "firebase/firestore";

const SLOT_DURATION = 60;
const SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 6 + i;
  const start = `${String(h).padStart(2,"0")}:00`;
  const end   = `${String(h+1).padStart(2,"0")}:00`;
  return { id: i, label: `${start} – ${end}`, startHour: h };
});

// ── Local date helper (avoids UTC "yesterday" bug) ─────────
function getLocalDateString(d = new Date()) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Sidebar ───────────────────────────────────────────────
function NavSidebar({ active }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const NAV = [
    { label: "Dashboard",   icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",                                                                                                  path: "/dashboard" },
    { label: "Book Slot",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",                                                      path: "/booking"   },
    { label: "OTP",         icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",                  path: "/otp"       },
    { label: "Access Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",            path: "/logs"      },
    { label: "Profile",     icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                           path: "/profile"   },
  ];
  return (
    <div style={{ width:220,flexShrink:0,background:"rgba(10,12,28,0.8)",borderRight:"1px solid rgba(99,102,241,0.15)",display:"flex",flexDirection:"column",padding:"24px 0" }}>
      <div style={{ padding:"0 20px 28px",borderBottom:"1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <span style={{ fontWeight:700,fontSize:"1rem",color:"#f1f5f9",letterSpacing:"-0.02em" }}>SecureVault</span>
        </div>
      </div>
      <nav style={{ flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4 }}>
        {NAV.map(n => {
          const isActive = n.path === active;
          return (
            <button key={n.path} onClick={() => navigate(n.path)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,
              border:"none",cursor:"pointer",background:isActive?"rgba(99,102,241,0.18)":"transparent",
              color:isActive?"#818cf8":"#64748b",fontSize:"0.85rem",fontWeight:isActive?600:400,
              textAlign:"left",width:"100%",transition:"all 0.15s"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon}/>
              </svg>
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

// ── Toast Notification ────────────────────────────────────
function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isWarning = toast.type === "warning";
  const isInfo    = toast.type === "info";
  return (
    <div style={{
      position:"fixed", top:24, right:24, zIndex:9999,
      maxWidth:360, padding:"16px 20px", borderRadius:14,
      background: isWarning ? "rgba(251,191,36,0.12)" : isInfo ? "rgba(99,102,241,0.12)" : "rgba(52,211,153,0.12)",
      border: `1px solid ${isWarning ? "rgba(251,191,36,0.4)" : isInfo ? "rgba(99,102,241,0.4)" : "rgba(52,211,153,0.4)"}`,
      boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
      backdropFilter:"blur(12px)",
      display:"flex", gap:12, alignItems:"flex-start",
      animation:"slideIn 0.3s ease"
    }}>
      <span style={{ fontSize:"1.2rem", flexShrink:0 }}>
        {isWarning ? "⏰" : isInfo ? "ℹ️" : "✅"}
      </span>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:"0.88rem",
          color: isWarning ? "#fbbf24" : isInfo ? "#818cf8" : "#34d399",
          marginBottom:4 }}>
          {toast.title}
        </div>
        <div style={{ color:"#94a3b8", fontSize:"0.82rem", lineHeight:1.5 }}>{toast.message}</div>
        {toast.action && (
          <button onClick={toast.action.fn} style={{
            marginTop:10, padding:"7px 16px", borderRadius:8, border:"none",
            background: isWarning ? "rgba(251,191,36,0.2)" : "rgba(99,102,241,0.2)",
            color: isWarning ? "#fbbf24" : "#818cf8",
            fontWeight:600, fontSize:"0.82rem", cursor:"pointer"
          }}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={onDismiss} style={{ background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:"1rem",padding:0,flexShrink:0 }}>✕</button>
    </div>
  );
}

// ── Countdown Timer ───────────────────────────────────────
function SlotCountdown({ myBooking, onExtend, nextSlotFree }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [phase, setPhase] = useState(null); // "active" | "ending" | "expired"

  useEffect(() => {
    if (!myBooking) { setTimeLeft(null); setPhase(null); return; }

    const tick = () => {
      const now = Date.now();
      const end = myBooking.endTime?.toDate?.()?.getTime();
      const start = myBooking.startTime?.toDate?.()?.getTime();
      if (!end || !start) return;

      const msLeft = end - now;
      const msTotal = end - start;
      const msElapsed = now - start;

      if (msLeft <= 0) {
        setTimeLeft(0); setPhase("expired"); return;
      }
      if (msElapsed < 0) {
        setPhase(null); setTimeLeft(null); return; // not started yet
      }

      setTimeLeft(msLeft);
      setPhase(msLeft <= 10 * 60 * 1000 ? "ending" : "active");
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [myBooking]);

  if (!timeLeft && phase !== "expired") return null;

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);

  const color = phase === "expired" ? "#f87171" : phase === "ending" ? "#fbbf24" : "#34d399";
  const bg    = phase === "expired" ? "rgba(239,68,68,0.1)" : phase === "ending" ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)";
  const border= phase === "expired" ? "rgba(239,68,68,0.3)" : phase === "ending" ? "rgba(251,191,36,0.3)" : "rgba(52,211,153,0.3)";

  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ color:"#94a3b8", fontSize:"0.75rem", fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:6 }}>
            {phase === "expired" ? "Slot Expired" : phase === "ending" ? "⏰ Slot Ending Soon" : "Active Slot"}
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            {phase === "expired" ? (
              <span style={{ color:"#f87171", fontWeight:700, fontSize:"1.1rem" }}>Your slot has ended. Please clear the locker.</span>
            ) : (
              <>
                <span style={{ color, fontWeight:800, fontSize:"2rem", fontVariantNumeric:"tabular-nums" }}>
                  {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
                </span>
                <span style={{ color:"#64748b", fontSize:"0.82rem" }}>remaining</span>
              </>
            )}
          </div>
          {phase === "ending" && (
            <div style={{ color:"#94a3b8", fontSize:"0.8rem", marginTop:4 }}>
              {nextSlotFree
                ? "Next slot is free — you can extend your booking."
                : "Next slot is taken — please wrap up and clear the locker."}
            </div>
          )}
        </div>

        {phase === "ending" && nextSlotFree && (
          <button onClick={onExtend} style={{
            padding:"10px 20px", borderRadius:10, border:"none",
            background:"linear-gradient(135deg,#6366f1,#818cf8)",
            color:"#fff", fontWeight:700, fontSize:"0.88rem", cursor:"pointer",
            boxShadow:"0 0 20px rgba(99,102,241,0.3)", flexShrink:0
          }}>
            Extend by 1 hr
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function BookingPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const today = getLocalDateString();
  const [selectedDate, setSelectedDate]   = useState(today);
  const [bookedSlots, setBookedSlots]     = useState([]);
  const [myBooking, setMyBooking]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [msg, setMsg]                     = useState(null);
  const [toast, setToast]                 = useState(null);
  const [notifiedEnding, setNotifiedEnding] = useState(false);

 const fetchBookings = useCallback(async () => {
  const q = query(collection(db, "bookings"), where("date", "==", selectedDate));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("user.uid:", user?.uid, "all bookings:", all);
  setBookedSlots(all);
  const mine = all.filter(b => b.userId === user?.uid);
  setMyBooking(mine.find(b => b.status !== "extension") || mine[0] || null);
}, [selectedDate, user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Check if next slot after myBooking is free ──
  const nextSlotFree = (() => {
    if (!myBooking) return false;
    const nextSlotId = myBooking.slotId + 1;
    if (nextSlotId >= SLOTS.length) return false;
    return !bookedSlots.find(b => b.slotId === nextSlotId && b.date === selectedDate);
  })();

  // ── 10-min warning notification ──
  useEffect(() => {
    if (!myBooking || notifiedEnding) return;
    const end = myBooking.endTime?.toDate?.()?.getTime();
    if (!end) return;

    const t = setInterval(() => {
      const msLeft = end - Date.now();
      if (msLeft <= 10 * 60 * 1000 && msLeft > 0) {
        setNotifiedEnding(true);
        setToast({
          type: "warning",
          title: "Your slot ends in 10 minutes",
          message: nextSlotFree
            ? "The next slot is free. You can extend your booking."
            : "The next slot is taken. Please clear the locker on time.",
          action: nextSlotFree ? { label: "Extend by 1 hr", fn: () => { handleExtend(); setToast(null); } } : null
        });
      }
    }, 10000);

    return () => clearInterval(t);
  }, [myBooking, notifiedEnding, nextSlotFree]);

  const handleBook = async (slot) => {
    if (!user) return;
    if (myBooking) { setMsg({ type:"error", text:"You already have a booking on this date. Cancel it first." }); return; }
    setLoading(true); setMsg(null);
    try {
      const startDate = new Date(`${selectedDate}T${String(slot.startHour).padStart(2,"0")}:00:00`);
      const endDate   = new Date(startDate.getTime() + SLOT_DURATION * 60000);
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        userName: user.fullName || user.email,
        date: selectedDate,
        slotId: slot.id,
        slotLabel: slot.label,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        status: "confirmed",
        createdAt: serverTimestamp(),
      });
      setMsg({ type:"success", text:`Slot ${slot.label} booked!` });
      setNotifiedEnding(false);
      fetchBookings();
    } catch {
      setMsg({ type:"error", text:"Booking failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!myBooking) return;
    setLoading(true); setMsg(null);
    try {
      await deleteDoc(doc(db, "bookings", myBooking.id));
      setMsg({ type:"success", text:"Booking cancelled." });
      setNotifiedEnding(false);
      fetchBookings();
    } catch {
      setMsg({ type:"error", text:"Cancel failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!myBooking || !nextSlotFree) return;
    const nextSlot = SLOTS[myBooking.slotId + 1];
    if (!nextSlot) return;
    setLoading(true); setMsg(null);
    try {
      // Extend endTime by 1 hour and update slotLabel
      const newEnd = new Date(myBooking.endTime.toDate().getTime() + SLOT_DURATION * 60000);
      await updateDoc(doc(db, "bookings", myBooking.id), {
        endTime: Timestamp.fromDate(newEnd),
        slotLabel: `${myBooking.slotLabel.split("–")[0].trim()} – ${SLOTS[myBooking.slotId + 1].label.split("–")[1].trim()}`,
        slotId: myBooking.slotId, // keep original slot id
        extended: true,
      });
      // Also block next slot so no one else books it
      const extStart = myBooking.endTime.toDate();
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        userName: user.fullName || user.email,
        date: selectedDate,
        slotId: nextSlot.id,
        slotLabel: nextSlot.label,
        startTime: Timestamp.fromDate(extStart),
        endTime: Timestamp.fromDate(newEnd),
        status: "extension",
        createdAt: serverTimestamp(),
      });
      setMsg({ type:"success", text:"Slot extended by 1 hour!" });
      setNotifiedEnding(false);
      fetchBookings();
    } catch {
      setMsg({ type:"error", text:"Extend failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const isSlotPast = (slot) => {
    if (selectedDate > today) return false;
    if (selectedDate < today) return true;
    return new Date().getHours() >= slot.startHour + 1;
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0a0c1c 0%,#0d1025 60%,#0a1120 100%)",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:"#e2e8f0" }}>
      <NavSidebar active="/booking" />

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div style={{ flex:1,overflow:"auto",padding:"32px 36px" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ color:"#475569",fontSize:"0.82rem",marginBottom:4 }}>Locker Access</div>
          <h1 style={{ fontSize:"1.6rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.03em",margin:0 }}>Book a Slot</h1>
        </div>

        {/* Active slot countdown */}
        {myBooking && selectedDate === today && (
          <SlotCountdown
            myBooking={myBooking}
            onExtend={handleExtend}
            nextSlotFree={nextSlotFree}
          />
        )}

        {/* Date + My Booking cards */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24 }}>
          <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:24 }}>
            <div style={{ color:"#94a3b8",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14 }}>Select Date</div>
            <input type="date" value={selectedDate} min={today}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width:"100%",padding:"11px 14px",boxSizing:"border-box",borderRadius:10,background:"rgba(10,12,28,0.6)",border:"1.5px solid rgba(99,102,241,0.25)",color:"#e2e8f0",fontSize:"0.92rem",outline:"none" }}
            />
            <div style={{ marginTop:14,color:"#475569",fontSize:"0.8rem" }}>
              {bookedSlots.filter(b => b.status !== "extension").length} of {SLOTS.length} slots booked on this date
            </div>
            <div style={{ marginTop:8,height:6,borderRadius:6,background:"rgba(99,102,241,0.1)",overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:6,background:"linear-gradient(90deg,#6366f1,#818cf8)",width:`${(bookedSlots.filter(b=>b.status!=="extension").length/SLOTS.length)*100}%`,transition:"width 0.4s" }} />
            </div>
          </div>

          <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:24 }}>
            <div style={{ color:"#94a3b8",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14 }}>My Booking</div>
            {myBooking && myBooking.status !== "extension" ? (
              <div>
                <div style={{ background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:10,padding:"14px 16px",marginBottom:14 }}>
                  <div style={{ color:"#818cf8",fontSize:"0.78rem",fontWeight:600,marginBottom:4 }}>
                    {myBooking.extended ? "EXTENDED ✓" : "CONFIRMED"}
                  </div>
                  <div style={{ color:"#f1f5f9",fontWeight:700,fontSize:"1rem" }}>{myBooking.slotLabel}</div>
                  <div style={{ color:"#475569",fontSize:"0.78rem",marginTop:2 }}>{myBooking.date}</div>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={() => navigate("/otp")} style={{ flex:1,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6366f1,#818cf8)",color:"#fff",fontWeight:600,fontSize:"0.83rem",cursor:"pointer" }}>
                    Get OTP
                  </button>
                  <button onClick={handleCancel} disabled={loading} style={{ flex:1,padding:"9px",borderRadius:9,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#f87171",fontWeight:600,fontSize:"0.83rem",cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
                {nextSlotFree && selectedDate === today && (
                  <button onClick={handleExtend} disabled={loading} style={{ width:"100%",marginTop:10,padding:"9px",borderRadius:9,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.08)",color:"#818cf8",fontWeight:600,fontSize:"0.83rem",cursor:"pointer" }}>
                    + Extend by 1 hour (next slot is free)
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color:"#475569",fontSize:"0.85rem",paddingTop:8 }}>
                No booking on this date. Pick a slot below.
              </div>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ marginBottom:18,padding:"11px 16px",borderRadius:10,
            background:msg.type==="success"?"rgba(52,211,153,0.1)":"rgba(239,68,68,0.1)",
            border:`1px solid ${msg.type==="success"?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"}`,
            color:msg.type==="success"?"#34d399":"#f87171",fontSize:"0.85rem"
          }}>
            {msg.text}
          </div>
        )}

        {/* Slot grid */}
        <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:24 }}>
          <div style={{ color:"#94a3b8",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:18 }}>
            Available Slots — {new Date(selectedDate+"T12:00:00").toLocaleDateString([],{weekday:"long",day:"numeric",month:"long"})}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
            {SLOTS.map(slot => {
              const booked  = bookedSlots.find(b => b.slotId === slot.id);
              const isMe    = booked?.userId === user?.uid;
              const past    = isSlotPast(slot);

              let bg, border, color, label, clickable;
              if (past) {
                bg="rgba(99,102,241,0.03)"; border="rgba(99,102,241,0.08)"; color="#334155"; label="Past"; clickable=false;
              } else if (isMe) {
                bg="rgba(99,102,241,0.15)"; border="rgba(99,102,241,0.4)"; color="#818cf8"; label="Your slot"; clickable=false;
              } else if (booked) {
                bg="rgba(239,68,68,0.06)"; border="rgba(239,68,68,0.2)"; color="#f87171"; label="Taken"; clickable=false;
              } else {
                bg="rgba(52,211,153,0.06)"; border="rgba(52,211,153,0.25)"; color="#34d399"; label="Available"; clickable=!loading;
              }

              return (
                <button key={slot.id} disabled={!clickable}
                  onClick={() => clickable && handleBook(slot)}
                  style={{ padding:"14px 12px",borderRadius:12,border:`1px solid ${border}`,background:bg,color:"#e2e8f0",cursor:clickable?"pointer":"default",textAlign:"left",transition:"all 0.15s",opacity:past?0.4:1 }}>
                  <div style={{ fontWeight:600,fontSize:"0.85rem",marginBottom:4 }}>{slot.label}</div>
                  <div style={{ fontSize:"0.72rem",color,fontWeight:500 }}>{label}</div>
                  {booked && !isMe && (
                    <div style={{ fontSize:"0.68rem",color:"#475569",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {booked.status === "extension" ? "Extended slot" : booked.userName || "Someone"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex",gap:20,marginTop:18,paddingTop:16,borderTop:"1px solid rgba(99,102,241,0.1)" }}>
            {[
              { color:"#34d399", border:"rgba(52,211,153,0.25)", label:"Available"     },
              { color:"#818cf8", border:"rgba(99,102,241,0.4)",  label:"Your booking"  },
              { color:"#f87171", border:"rgba(239,68,68,0.2)",   label:"Taken"         },
              { color:"#334155", border:"rgba(99,102,241,0.08)", label:"Past"          },
            ].map(l => (
              <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:10,height:10,borderRadius:3,border:`1px solid ${l.border}` }} />
                <span style={{ fontSize:"0.75rem",color:"#475569" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
}