import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

function LockerIllustration() {
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setLocked(l => !l), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", width: 260, height: 300 }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: "20px",
        background: locked
          ? "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 70%)"
          : "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15) 0%, transparent 70%)",
        transition: "background 1s ease"
      }} />
      <div style={{
        position: "absolute", inset: "28px 18px 18px", borderRadius: "14px",
        background: "rgba(10,12,28,0.85)",
        border: `2px solid ${locked ? "rgba(239,68,68,0.35)" : "rgba(34,211,238,0.35)"}`,
        transition: "border-color 0.8s ease",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "16px"
      }}>
        <div style={{ transition: "transform 0.5s ease", transform: locked ? "none" : "rotate(-15deg)" }}>
          {locked ? (
            <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
              <rect x="10" y="26" width="36" height="26" rx="6" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="2"/>
              <path d="M18 26v-8a10 10 0 0120 0v8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="40" r="3" fill="#ef4444"/>
              <line x1="28" y1="43" x2="28" y2="47" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 56 56" fill="none">
              <rect x="10" y="26" width="36" height="26" rx="6" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="2"/>
              <path d="M18 26v-8a10 10 0 0120 0" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="40" r="3" fill="#22d3ee"/>
              <line x1="28" y1="43" x2="28" y2="47" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.15em",
            color: locked ? "#ef4444" : "#22d3ee", transition: "color 0.8s ease"
          }}>
            {locked ? "LOCKED" : "UNLOCKED"}
          </div>
          <div style={{ color: "#475569", fontSize: "0.7rem", marginTop: "4px" }}>
            {locked ? "Awaiting verification" : "Access granted"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: locked ? "rgba(239,68,68,0.25)" : "#22d3ee",
              border: `1.5px solid ${locked ? "#ef4444" : "#22d3ee"}`,
              transition: `background 0.8s ease ${i * 0.1}s`
            }} />
          ))}
        </div>
      </div>
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        background: "rgba(10,12,28,0.9)",
        border: `1px solid ${locked ? "rgba(239,68,68,0.35)" : "rgba(34,211,238,0.35)"}`,
        borderRadius: "16px", padding: "4px 14px",
        fontSize: "0.7rem", color: locked ? "#ef4444" : "#22d3ee",
        fontWeight: 600, transition: "all 0.8s ease", whiteSpace: "nowrap"
      }}>
        {locked ? "🔴 Secured" : "🟢 Access Granted"}
      </div>
    </div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, onKeyDown, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", color: "#94a3b8", fontSize: "0.82rem",
        fontWeight: 500, marginBottom: "7px" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={onChange} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "11px 16px", boxSizing: "border-box",
            borderRadius: "10px", fontSize: "0.92rem",
            background: "rgba(10,12,28,0.6)",
            border: `1.5px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.18)"}`,
            color: "#e2e8f0", outline: "none", transition: "border-color 0.2s ease",
            paddingRight: right ? "44px" : "16px"
          }}
        />
        {right && (
          <div style={{ position: "absolute", right: "14px", top: "50%",
            transform: "translateY(-50%)", cursor: "pointer", color: "#475569" }}>
            {right}
          </div>
        )}
      </div>
    </div>
  );
}

function parseFirebaseError(code) {
  switch (code) {
    case "auth/user-not-found":     return "No account found with that email.";
    case "auth/wrong-password":     return "Incorrect password. Please try again.";
    case "auth/invalid-email":      return "That doesn't look like a valid email.";
    case "auth/invalid-credential": return "Email or password is incorrect.";
    case "auth/too-many-requests":  return "Too many failed attempts. Try again later.";
    case "auth/user-disabled":      return "This account has been disabled.";
    default:                        return "Something went wrong. Please try again.";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm]         = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {open ? (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      )}
    </svg>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0c1c 0%, #0d1025 50%, #0a1120 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: "24px"
    }}>
      <div style={{ display: "flex", gap: "60px", alignItems: "center",
        maxWidth: "880px", width: "100%", flexWrap: "wrap", justifyContent: "center" }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
          <LockerIllustration />
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f1f5f9",
              letterSpacing: "-0.03em", marginBottom: "8px" }}>Welcome back</h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "210px", lineHeight: 1.6 }}>
              Sign in to access your locker dashboard.
            </p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(15,17,35,0.75)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px",
          padding: "40px 36px", width: "100%", maxWidth: "380px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)"
        }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9",
              letterSpacing: "-0.03em", marginBottom: "4px" }}>Sign in</h1>
            <p style={{ color: "#64748b", fontSize: "0.88rem" }}>Access your dashboard</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Field
              label="Email" type="email" placeholder="your@email.com"
              value={form.email} onChange={set("email")} onKeyDown={handleKeyDown}
            />
            <Field
              label="6-Digit PIN" type={showPass ? "text" : "password"}
              placeholder="Your 6-digit PIN"
              value={form.password} onChange={set("password")} onKeyDown={handleKeyDown}
              right={<span onClick={() => setShowPass(p => !p)}><EyeIcon open={showPass} /></span>}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginTop: "14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px",
              cursor: "pointer", color: "#64748b", fontSize: "0.84rem" }}>
              <div onClick={() => setRemember(r => !r)} style={{
                width: 16, height: 16, borderRadius: "4px", flexShrink: 0,
                border: `1.5px solid ${remember ? "#6366f1" : "rgba(99,102,241,0.3)"}`,
                background: remember ? "#6366f1" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease", cursor: "pointer"
              }}>
                {remember && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              Remember me
            </label>
            <a href="/forgot-password" style={{ color: "#818cf8", fontSize: "0.84rem",
              textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = "#a5b4fc"}
              onMouseLeave={e => e.target.style.color = "#818cf8"}>
              Forgot password?
            </a>
          </div>

          {error && (
            <div style={{
              marginTop: "14px", padding: "10px 14px", borderRadius: "8px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171", fontSize: "0.84rem",
              display: "flex", gap: "8px", alignItems: "flex-start"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171"
                strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", marginTop: "20px", padding: "13px",
            borderRadius: "10px", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff", fontWeight: 700, fontSize: "0.95rem",
            boxShadow: loading ? "none" : "0 0 24px rgba(99,102,241,0.35)",
            transition: "all 0.3s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>

          <p style={{ textAlign: "center", color: "#475569", fontSize: "0.85rem", marginTop: "18px" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={e => e.target.style.color = "#a5b4fc"}
              onMouseLeave={e => e.target.style.color = "#818cf8"}>
              Register
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}