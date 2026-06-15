import { useState, useEffect } from "react";

// ── Minimal nav ──────────────────────────────────────────────────────────────
function Navbar({ dark, toggleDark }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: "rgba(10,12,28,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 2L4 7v7c0 6.075 4.477 11.742 10 13 5.523-1.258 10-6.925 10-13V7L14 2z" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5"/>
          <path d="M10 14l3 3 5-5" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#e2e8f0", letterSpacing: "-0.02em" }}>SecureVault</span>
      </div>

      <div className="flex items-center gap-6">
        <a href="#features" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}
          onMouseEnter={e => e.target.style.color = "#e2e8f0"} onMouseLeave={e => e.target.style.color = "#94a3b8"}>Features</a>
        <a href="#how-it-works" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}
          onMouseEnter={e => e.target.style.color = "#e2e8f0"} onMouseLeave={e => e.target.style.color = "#94a3b8"}>How It Works</a>
        <a href="#contact" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none" }}
          onMouseEnter={e => e.target.style.color = "#e2e8f0"} onMouseLeave={e => e.target.style.color = "#94a3b8"}>Contact</a>
      </div>

      <div className="flex items-center gap-3">
        <a href="/login" style={{ color: "#94a3b8", fontSize: "0.9rem", textDecoration: "none", padding: "6px 16px" }}
          onMouseEnter={e => e.target.style.color = "#e2e8f0"} onMouseLeave={e => e.target.style.color = "#94a3b8"}>Login</a>
        <a href="/register" style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          color: "#fff", fontSize: "0.9rem", textDecoration: "none",
          padding: "7px 20px", borderRadius: "8px", fontWeight: 600,
          boxShadow: "0 0 20px rgba(99,102,241,0.3)"
        }}>Register</a>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "100px 6vw 60px", gap: "40px", flexWrap: "wrap" }}>

      {/* Left copy */}
      <div style={{ maxWidth: "540px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", display: "inline-block" }}></span>
          <span style={{ color: "#94a3b8", fontSize: "0.8rem", letterSpacing: "0.05em" }}>Next-gen locker security</span>
        </div>

        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.1,
          color: "#f1f5f9", marginBottom: "20px", letterSpacing: "-0.03em" }}>
          Your locker,<br />
          <span style={{ background: "linear-gradient(90deg, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            always secure.
          </span>
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "36px", maxWidth: "420px" }}>
          Unlock your locker from anywhere with a one-time code. No keys, no hassle — just tap, verify, and you're in.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <a href="/register" style={{
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            color: "#fff", textDecoration: "none", padding: "14px 32px",
            borderRadius: "10px", fontWeight: 700, fontSize: "1rem",
            boxShadow: "0 0 30px rgba(99,102,241,0.4)", display: "flex", alignItems: "center", gap: "8px"
          }}>
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="/login" style={{
            color: "#94a3b8", textDecoration: "none", padding: "14px 28px",
            borderRadius: "10px", fontWeight: 600, fontSize: "1rem",
            border: "1px solid rgba(148,163,184,0.2)", display: "flex", alignItems: "center", gap: "8px"
          }}>
            Login
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        <div style={{ display: "flex", gap: "32px", marginTop: "40px" }}>
          {[["99.9%", "Uptime"], ["2FA", "Security"], ["<1s", "Response"]].map(([val, label]) => (
            <div key={label}>
              <div style={{ color: "#22d3ee", fontWeight: 800, fontSize: "1.3rem" }}>{val}</div>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — animated locker illustration */}
      <LockerIllustration />
    </section>
  );
}

function LockerIllustration() {
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setLocked(l => !l), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", width: 320, height: 360, flexShrink: 0 }}>
      {/* Glow */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "24px",
        background: locked ? "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 70%)"
                           : "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15) 0%, transparent 70%)",
        transition: "background 1s ease" }} />

      {/* Locker body */}
      <div style={{ position: "absolute", inset: "30px 20px 20px", borderRadius: "16px",
        background: "rgba(15,17,35,0.8)", border: `2px solid ${locked ? "rgba(239,68,68,0.4)" : "rgba(34,211,238,0.4)"}`,
        transition: "border-color 0.8s ease", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "20px", padding: "30px" }}>

        {/* Lock icon */}
        <div style={{ transition: "transform 0.5s ease", transform: locked ? "none" : "rotate(-15deg)" }}>
          {locked ? (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="10" y="26" width="36" height="26" rx="6" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="2"/>
              <path d="M18 26v-8a10 10 0 0120 0v8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="40" r="3" fill="#ef4444"/>
              <line x1="28" y1="43" x2="28" y2="47" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect x="10" y="26" width="36" height="26" rx="6" fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeWidth="2"/>
              <path d="M18 26v-8a10 10 0 0120 0" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="28" cy="40" r="3" fill="#22d3ee"/>
              <line x1="28" y1="43" x2="28" y2="47" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.15em",
            color: locked ? "#ef4444" : "#22d3ee", transition: "color 0.8s ease" }}>
            {locked ? "LOCKED" : "UNLOCKED"}
          </div>
          <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "6px" }}>
            {locked ? "Enter OTP to access" : "Access granted"}
          </div>
        </div>

        {/* OTP dots */}
        <div style={{ display: "flex", gap: "10px" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%",
              background: locked ? "rgba(239,68,68,0.3)" : "#22d3ee",
              border: `1.5px solid ${locked ? "#ef4444" : "#22d3ee"}`,
              transition: `background 0.8s ease ${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      {/* Status badge top */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        background: "rgba(15,17,35,0.9)", border: `1px solid ${locked ? "rgba(239,68,68,0.4)" : "rgba(34,211,238,0.4)"}`,
        borderRadius: "20px", padding: "5px 16px", fontSize: "0.75rem",
        color: locked ? "#ef4444" : "#22d3ee", fontWeight: 600, transition: "all 0.8s ease" }}>
        {locked ? "🔴 Secured" : "🟢 Access Granted"}
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="12" width="20" height="14" rx="4" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1.5"/>
          <path d="M9 12V9a5 5 0 0110 0v3" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="14" cy="20" r="2" fill="#6366f1"/>
        </svg>
      ),
      title: "Secure Login",
      desc: "Your account is protected by a username, password, and a one-time code every time you sign in."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="5" width="14" height="18" rx="3" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="1.5"/>
          <path d="M20 10h2a2 2 0 012 2v8a2 2 0 01-2 2h-2" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="10" cy="14" r="2" fill="#22d3ee"/>
          <path d="M10 16v3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: "One-Time Code Access",
      desc: "Request a 4-digit code on your dashboard. Enter it on the keypad — the locker opens instantly."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" fill="rgba(129,140,248,0.1)" stroke="#818cf8" strokeWidth="1.5"/>
          <path d="M8 14h3l2 4 3-8 2 4h2" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Live Monitoring",
      desc: "See who accessed your locker and when, from anywhere. All activity is logged and available on your dashboard."
    },
  ];

  return (
    <section id="features" style={{ padding: "80px 6vw" }}>
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f1f5f9",
          letterSpacing: "-0.03em", marginBottom: "12px" }}>Everything you need</h2>
        <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "400px", margin: "0 auto" }}>
          Simple to use, hard to break into.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: "rgba(15,17,35,0.6)", border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "16px", padding: "32px 28px",
            transition: "border-color 0.3s ease, transform 0.3s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; e.currentTarget.style.transform = "none"; }}>
            <div style={{ width: 52, height: 52, borderRadius: "12px",
              background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center",
              justifyContent: "center", marginBottom: "20px" }}>
              {f.icon}
            </div>
            <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.05rem", marginBottom: "10px" }}>{f.title}</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "1", title: "Create your account", desc: "Sign up with your name and email. Takes under a minute." },
    { n: "2", title: "Request a code", desc: "Open your dashboard and tap 'Unlock'. A 4-digit code appears instantly." },
    { n: "3", title: "Enter it on the keypad", desc: "Type the code on the locker's keypad. It opens right away." },
    { n: "4", title: "Done", desc: "Your access is logged. Lock it back when you're finished." },
  ];

  return (
    <section id="how-it-works" style={{ padding: "80px 6vw", background: "rgba(99,102,241,0.03)" }}>
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#f1f5f9",
          letterSpacing: "-0.03em", marginBottom: "12px" }}>How it works</h2>
        <p style={{ color: "#64748b", fontSize: "1rem" }}>Four steps from signup to open.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", maxWidth: "900px", margin: "0 auto" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ position: "relative" }}>
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", top: "24px", right: "-8px", width: "16px", height: "2px",
                background: "rgba(99,102,241,0.25)", zIndex: 1, display: "none" }} className="step-connector" />
            )}
            <div style={{ background: "rgba(15,17,35,0.6)", border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: "14px", padding: "28px 22px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.95rem", color: "#fff", marginBottom: "16px" }}>
                {s.n}
              </div>
              <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.95rem", marginBottom: "8px" }}>{s.title}</h3>
              <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: "10px", fontSize: "0.95rem",
    background: "rgba(15,17,35,0.6)", border: "1px solid rgba(99,102,241,0.2)",
    color: "#e2e8f0", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s ease"
  };

  return (
    <section id="contact" style={{ padding: "80px 6vw" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.03em", marginBottom: "10px" }}>Get in touch</h2>
          <p style={{ color: "#64748b", fontSize: "1rem" }}>Questions? We'll get back to you quickly.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <input value={form.name} placeholder="Your name" style={inputStyle}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"} />
            <input value={form.email} placeholder="your@email.com" style={inputStyle}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"} />
          </div>
          <textarea value={form.message} placeholder="Your message..." rows={5}
            style={{...inputStyle, resize: "vertical"}}
            onChange={e => setForm(f => ({...f, message: e.target.value}))}
            onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
            onBlur={e => e.target.style.borderColor = "rgba(99,102,241,0.2)"} />
          <button onClick={handleSubmit} style={{
            background: sent ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #6366f1, #818cf8)",
            color: sent ? "#22c55e" : "#fff", border: sent ? "1px solid #22c55e" : "none",
            padding: "14px", borderRadius: "10px", fontWeight: 700, fontSize: "0.95rem",
            cursor: "pointer", transition: "all 0.3s ease"
          }}>
            {sent ? "✓ Message sent!" : "Send Message"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(99,102,241,0.12)", padding: "40px 6vw" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: "32px", marginBottom: "32px" }}>

        {/* Brand */}
        <div style={{ maxWidth: "260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 7v7c0 6.075 4.477 11.742 10 13 5.523-1.258 10-6.925 10-13V7L14 2z" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.5"/>
              <path d="M10 14l3 3 5-5" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontWeight: 700, color: "#e2e8f0" }}>SecureVault</span>
          </div>
          <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Smart locker management with military-grade security. Protect what matters most.
          </p>
        </div>

        {/* Links — only things a new user would care about */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.85rem",
              letterSpacing: "0.08em", marginBottom: "14px" }}>COMPANY</div>
            {["Our Mission", "Team", "Blog"].map(l => (
              <div key={l} style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "#475569", fontSize: "0.85rem", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "#94a3b8"}
                  onMouseLeave={e => e.target.style.color = "#475569"}>{l}</a>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.85rem",
              letterSpacing: "0.08em", marginBottom: "14px" }}>LEGAL</div>
            {["Privacy Policy", "Terms of Service", "Report a Bug"].map(l => (
              <div key={l} style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "#475569", fontSize: "0.85rem", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "#94a3b8"}
                  onMouseLeave={e => e.target.style.color = "#475569"}>{l}</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(99,102,241,0.08)", paddingTop: "20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ color: "#334155", fontSize: "0.8rem" }}>© 2026 SecureVault. Crafted with ♥ for security.</span>
        <div style={{ display: "flex", gap: "20px" }}>
          <span style={{ color: "#334155", fontSize: "0.8rem" }}>Bangalore, India</span>
          <a href="mailto:contact@securevault.dev" style={{ color: "#334155", fontSize: "0.8rem", textDecoration: "none" }}>contact@securevault.dev</a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0c1c 0%, #0d1025 50%, #0a1120 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Contact />
      <Footer />
    </div>
  );
}