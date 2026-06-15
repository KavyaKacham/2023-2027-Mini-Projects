import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { db, auth } from "../config/firebase";
import {
  doc, getDoc, updateDoc, collection, query, where,
  orderBy, limit, getDocs, serverTimestamp
} from "firebase/firestore";
import {
  updatePassword, reauthenticateWithCredential, EmailAuthProvider
} from "firebase/auth";

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

// ── Reusable field ─────────────────────────────────────────
function Field({ label, type="text", placeholder, value, onChange, right, readOnly }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:"block",color:"#94a3b8",fontSize:"0.8rem",fontWeight:500,marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input type={type} placeholder={placeholder} value={value||""} onChange={onChange}
          readOnly={readOnly} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:"100%",padding:"10px 14px",boxSizing:"border-box",borderRadius:10,fontSize:"0.9rem",
            background: readOnly ? "rgba(99,102,241,0.04)" : "rgba(10,12,28,0.6)",
            border:`1.5px solid ${focused && !readOnly ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.15)"}`,
            color: readOnly ? "#64748b" : "#e2e8f0",outline:"none",
            transition:"border-color 0.2s",paddingRight:right?"44px":"14px",
            cursor: readOnly ? "default" : "text"
          }}
        />
        {right && (
          <div style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",color:"#475569" }}>
            {right}
          </div>
        )}
      </div>
    </div>
  );
}

function parsePassError(code) {
  switch(code) {
    case "auth/wrong-password":       return "Current password is incorrect.";
    case "auth/weak-password":        return "New password must be at least 6 characters.";
    case "auth/requires-recent-login":return "Please log out and log back in, then try again.";
    default:                          return "Failed to update password. Try again.";
  }
}

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm]   = useState({ fullName:"", mobileNumber:"" });
  const [saving, setSaving]       = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [passForm, setPassForm]   = useState({ current:"", newPass:"", confirm:"" });
  const [showPass, setShowPass]   = useState({ current:false, newPass:false, confirm:false });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg]     = useState(null);

  const [accessLogs, setAccessLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // ── Load profile from Firestore ──
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      const data = snap.exists() ? snap.data() : {};
      const merged = { ...user, ...data };
      setProfile(merged);
      setEditForm({ fullName: merged.fullName||"", mobileNumber: merged.mobileNumber||"" });
    });
  }, [user]);

  // ── Load access logs ──
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "accessLogs"),
      where("userId","==",user.uid),
      orderBy("timestamp","desc"),
      limit(8)
    );
    getDocs(q).then(snap => {
      setAccessLogs(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLogsLoading(false);
    }).catch(() => setLogsLoading(false));
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true); setProfileMsg(null);
    try {
      await updateDoc(doc(db,"users",user.uid), {
        fullName: editForm.fullName,
        mobileNumber: editForm.mobileNumber,
        updatedAt: serverTimestamp()
      });
      setProfile(p => ({ ...p, ...editForm }));
      setIsEditing(false);
      setProfileMsg({ type:"success", text:"Profile updated!" });
    } catch {
      setProfileMsg({ type:"error", text:"Update failed. Try again." });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPassMsg(null);
    if (!passForm.current || !passForm.newPass || !passForm.confirm) {
      setPassMsg({ type:"error", text:"Please fill in all fields." }); return;
    }
    if (passForm.newPass !== passForm.confirm) {
      setPassMsg({ type:"error", text:"Passwords don't match." }); return;
    }
    if (passForm.newPass.length < 6) {
      setPassMsg({ type:"error", text:"New password must be at least 6 characters." }); return;
    }
    setPassLoading(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passForm.newPass);
      setPassMsg({ type:"success", text:"Password changed successfully!" });
      setPassForm({ current:"", newPass:"", confirm:"" });
    } catch(err) {
      setPassMsg({ type:"error", text: parsePassError(err.code) });
    } finally { setPassLoading(false); }
  };

  const getStrength = (p) => {
    if (!p) return null;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const labels = ["Weak","Weak","Fair","Good","Strong","Very Strong"];
    const colors = ["#ef4444","#f97316","#f59e0b","#22c55e","#10b981","#22d3ee"];
    return { score:s, label:labels[s], color:colors[s], pct:`${(s/5)*100}%` };
  };
  const strength = getStrength(passForm.newPass);

  const memberSince = (() => {
    if (!profile?.createdAt) return "—";
    const d = profile.createdAt?.toDate?.() || new Date(profile.createdAt);
    return d.toLocaleDateString([], { year:"numeric", month:"long", day:"numeric" });
  })();

  const EyeIcon = ({ open }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open
        ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
      }
    </svg>
  );

  if (!profile) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0a0c1c,#0d1025)" }}>
      <div style={{ color:"#475569" }}>Loading profile…</div>
    </div>
  );

  const initials = (profile.fullName||profile.email||"U").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  const card = (children, style={}) => (
    <div style={{ background:"rgba(15,17,35,0.75)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:16,padding:24,...style }}>
      {children}
    </div>
  );

  const sectionLabel = (text) => (
    <div style={{ color:"#94a3b8",fontSize:"0.75rem",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:16 }}>{text}</div>
  );

  const msgBanner = (msg) => msg && (
    <div style={{ padding:"10px 14px",borderRadius:9,fontSize:"0.83rem",marginTop:12,
      background: msg.type==="success" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
      border:`1px solid ${msg.type==="success" ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`,
      color: msg.type==="success" ? "#34d399" : "#f87171"
    }}>{msg.text}</div>
  );

  return (
    <div style={{ minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#0a0c1c 0%,#0d1025 60%,#0a1120 100%)",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:"#e2e8f0" }}>
      <NavSidebar active="/profile" />

      <div style={{ flex:1,overflow:"auto",padding:"32px 36px" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ color:"#475569",fontSize:"0.82rem",marginBottom:4 }}>Account</div>
          <h1 style={{ fontSize:"1.6rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.03em",margin:0 }}>Profile</h1>
        </div>

        {/* Header card */}
        {card(
          <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
            <div style={{ width:72,height:72,borderRadius:18,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem",fontWeight:700,color:"#fff",flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"1.3rem",fontWeight:800,color:"#f1f5f9" }}>{profile.fullName||"—"}</div>
              <div style={{ color:"#64748b",fontSize:"0.85rem",marginTop:2 }}>@{profile.username||profile.email}</div>
              <div style={{ display:"flex",gap:16,marginTop:8,flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.78rem",color:"#475569" }}>📅 Member since {memberSince}</span>
                <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:"0.78rem",
                  color: profile.isActive ? "#34d399" : "#f87171" }}>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:profile.isActive?"#34d399":"#f87171" }}/>
                  {profile.role?.charAt(0).toUpperCase()+profile.role?.slice(1)||"User"}
                </span>
              </div>
            </div>
            <button onClick={() => { setIsEditing(e => !e); setProfileMsg(null); }} style={{
              padding:"9px 18px",borderRadius:10,fontSize:"0.85rem",fontWeight:600,cursor:"pointer",
              border:`1px solid ${isEditing ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`,
              background: isEditing ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.08)",
              color: isEditing ? "#f87171" : "#818cf8"
            }}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        , { marginBottom:20 })}

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20 }}>

          {/* User info / edit */}
          {card(
            <>
              {sectionLabel("User Information")}
              {isEditing ? (
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  <Field label="Full Name" value={editForm.fullName} onChange={e => setEditForm(f=>({...f,fullName:e.target.value}))} placeholder="Your full name"/>
                  <Field label="Mobile Number" value={editForm.mobileNumber} onChange={e => setEditForm(f=>({...f,mobileNumber:e.target.value}))} placeholder="10-digit number"/>
                  <div style={{ display:"flex",gap:10,marginTop:4 }}>
                    <button onClick={handleSaveProfile} disabled={saving} style={{ flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#6366f1,#818cf8)",color:"#fff",fontWeight:700,fontSize:"0.88rem",cursor:saving?"not-allowed":"pointer" }}>
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button onClick={() => setIsEditing(false)} style={{ flex:1,padding:"10px",borderRadius:9,border:"1px solid rgba(99,102,241,0.2)",background:"transparent",color:"#64748b",fontWeight:600,fontSize:"0.88rem",cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                  {msgBanner(profileMsg)}
                </div>
              ) : (
                <div>
                  {[
                    { label:"User ID",    value:profile.userId||"—" },
                    { label:"Full Name",  value:profile.fullName||"—" },
                    { label:"Username",   value:`@${profile.username||"—"}` },
                    { label:"Email",      value:profile.email||"—" },
                    { label:"Mobile",     value:profile.mobileNumber||"—" },
                    { label:"Role",       value:profile.role?.charAt(0).toUpperCase()+profile.role?.slice(1)||"User" },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(99,102,241,0.08)" }}>
                      <span style={{ color:"#64748b",fontSize:"0.83rem" }}>{r.label}</span>
                      <span style={{ color:"#e2e8f0",fontSize:"0.83rem",fontWeight:500,maxWidth:"55%",textAlign:"right",wordBreak:"break-all" }}>{r.value}</span>
                    </div>
                  ))}
                  {msgBanner(profileMsg)}
                </div>
              )}
            </>
          )}

          {/* Change password */}
          {card(
            <>
              {sectionLabel("Change Password")}
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <Field label="Current Password" type={showPass.current?"text":"password"} value={passForm.current}
                  onChange={e => setPassForm(f=>({...f,current:e.target.value}))} placeholder="Current password"
                  right={<span onClick={()=>setShowPass(p=>({...p,current:!p.current}))}><EyeIcon open={showPass.current}/></span>}
                />
                <div>
                  <Field label="New Password" type={showPass.newPass?"text":"password"} value={passForm.newPass}
                    onChange={e => setPassForm(f=>({...f,newPass:e.target.value}))} placeholder="New password"
                    right={<span onClick={()=>setShowPass(p=>({...p,newPass:!p.newPass}))}><EyeIcon open={showPass.newPass}/></span>}
                  />
                  {strength && (
                    <div style={{ marginTop:6,display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ flex:1,height:4,borderRadius:4,background:"rgba(99,102,241,0.1)",overflow:"hidden" }}>
                        <div style={{ height:"100%",borderRadius:4,background:strength.color,width:strength.pct,transition:"width 0.3s" }}/>
                      </div>
                      <span style={{ fontSize:"0.72rem",color:strength.color,fontWeight:600,whiteSpace:"nowrap" }}>{strength.label}</span>
                    </div>
                  )}
                </div>
                <Field label="Confirm Password" type={showPass.confirm?"text":"password"} value={passForm.confirm}
                  onChange={e => setPassForm(f=>({...f,confirm:e.target.value}))} placeholder="Confirm new password"
                  right={<span onClick={()=>setShowPass(p=>({...p,confirm:!p.confirm}))}><EyeIcon open={showPass.confirm}/></span>}
                />
                {passForm.confirm && passForm.newPass !== passForm.confirm && (
                  <div style={{ color:"#f87171",fontSize:"0.78rem",marginTop:-6 }}>Passwords don't match</div>
                )}
                <button onClick={handleChangePassword} disabled={passLoading} style={{
                  padding:"11px",borderRadius:10,border:"none",marginTop:4,
                  background: passLoading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#818cf8)",
                  color:"#fff",fontWeight:700,fontSize:"0.88rem",cursor:passLoading?"not-allowed":"pointer"
                }}>
                  {passLoading ? "Updating…" : "Update Password"}
                </button>
                {msgBanner(passMsg)}
              </div>
            </>
          )}
        </div>

        {/* Access logs */}
        {card(
          <>
            {sectionLabel("Recent Access Logs")}
            {logsLoading ? (
              <div style={{ color:"#475569",fontSize:"0.85rem",textAlign:"center",padding:"20px 0" }}>Loading…</div>
            ) : accessLogs.length === 0 ? (
              <div style={{ color:"#475569",fontSize:"0.85rem",textAlign:"center",padding:"20px 0" }}>No access logs yet.</div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Date & Time","Action","OTP Used","Status"].map(h => (
                        <th key={h} style={{ padding:"8px 12px",textAlign:"left",color:"#475569",fontSize:"0.75rem",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",borderBottom:"1px solid rgba(99,102,241,0.1)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom:"1px solid rgba(99,102,241,0.06)" }}>
                        <td style={{ padding:"10px 12px",color:"#94a3b8",fontSize:"0.82rem" }}>
                          {log.timestamp?.toDate?.()?.toLocaleString() || "—"}
                        </td>
                        <td style={{ padding:"10px 12px",color:"#e2e8f0",fontSize:"0.82rem" }}>{log.action||"Locker Access"}</td>
                        <td style={{ padding:"10px 12px",color:"#818cf8",fontSize:"0.82rem",fontFamily:"monospace" }}>{log.otpUsed||"—"}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <span style={{
                            padding:"3px 10px",borderRadius:20,fontSize:"0.73rem",fontWeight:600,
                            background: log.status==="success" ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)",
                            color: log.status==="success" ? "#34d399" : "#f87171",
                            border:`1px solid ${log.status==="success" ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`
                          }}>
                            {log.status==="success" ? "✓ Success" : "✕ Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}