"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";

/* ══ Particle canvas ═══════════════════════════════════════════ */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * cvs.width, y: Math.random() * cvs.height,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.45 + 0.05,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.o})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cvs.width)  p.vx *= -1;
        if (p.y < 0 || p.y > cvs.height) p.vy *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }} />;
}

/* ══ Password strength ═════════════════════════════════════════ */
function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-4
}
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const PW_COLORS = ["", "#ef4444", "#f59e0b", "#4ade80", "#00e5ff"];

/* ══ OTP input ═════════════════════════════════════════════════ */
function OtpInput({ value, onChange }) {
  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null);
  const r3 = useRef(null), r4 = useRef(null), r5 = useRef(null);
  const refs = [r0, r1, r2, r3, r4, r5];
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = digits.slice(); next[i] = "";
      onChange(next.join(""));
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^[0-9]$/.test(e.key)) {
      const next = digits.slice(); next[i] = e.key;
      onChange(next.join(""));
      if (i < 5) refs[i + 1].current?.focus();
    }
  };

  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} maxLength={1} value={d}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          style={{
            width:44, height:52, textAlign:"center", fontSize:22,
            fontFamily:"'Orbitron',sans-serif", fontWeight:700,
            background: d ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${d ? "rgba(0,229,255,0.6)" : "rgba(255,255,255,0.1)"}`,
            borderRadius:10, color:"#00e5ff", outline:"none",
            boxShadow: d ? "0 0 12px rgba(0,229,255,0.3)" : "none",
            transition:"all 0.2s", caretColor:"transparent",
          }}
        />
      ))}
    </div>
  );
}

/* ══ STEPS config ══════════════════════════════════════════════ */
const STEPS = [
  { id: 1, icon: "◈", label: "Identity",   sub: "Who are you?" },
  { id: 2, icon: "⬡", label: "Security",   sub: "Lock it down" },
  { id: 3, icon: "▲", label: "Verify",     sub: "Confirm OTP"  },
];

/* ══ MAIN COMPONENT ════════════════════════════════════════════ */
export default function CandidateRegister() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [toast, setToast] = useState(null);

  const strength = pwStrength(form.password);

  /* ── Toast helper ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── OTP countdown ── */
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  /* ── Generate & "send" OTP ── */
  const sendOtp = () => {
    if (!form.email.includes("@")) { showToast("Enter a valid email first.", "error"); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpTimer(60);
    showToast(`OTP sent to ${form.email} → [DEV: ${code}]`, "info");
  };

  /* ── Step validation ── */
  const canNext1 = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email);
  const canNext2 = strength >= 2 && form.password === form.confirmPassword;

  /* ── Final submit ── */
  const handleRegister = async () => {
    if (otp !== generatedOtp) { showToast("Invalid OTP. Try again.", "error"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { name: form.name, email: form.email, password: form.password, role: "candidate" });
      showToast("Account created! Redirecting...", "success");
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      showToast(err?.response?.data?.message || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .rg-root {
          min-height: 100vh;
          background: #020b18;
          font-family: 'Exo 2', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }

        /* Grid bg */
        .rg-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Ambient orbs */
        .orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
        }

        /* ── Card ── */
        .rg-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 480px;
          background: rgba(2,11,24,0.92);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 24px; padding: 40px 36px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 60px rgba(0,229,255,0.08), 0 40px 80px rgba(0,0,0,0.6);
          animation: cardIn 0.5s ease forwards;
        }
        @keyframes cardIn {
          from { opacity:0; transform: translateY(24px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }

        /* Corner accents */
        .rg-card::before {
          content: '';
          position: absolute; top: 0; left: 0;
          width: 24px; height: 24px;
          border-top: 2px solid #00e5ff; border-left: 2px solid #00e5ff;
          border-radius: 2px 0 0 0;
        }
        .rg-card::after {
          content: '';
          position: absolute; bottom: 0; right: 0;
          width: 24px; height: 24px;
          border-bottom: 2px solid #00e5ff; border-right: 2px solid #00e5ff;
          border-radius: 0 0 2px 0;
        }

        /* ── Logo ── */
        .rg-logo {
          text-align: center; margin-bottom: 28px;
        }
        .rg-logo-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,114,255,0.2));
          border: 1px solid rgba(0,229,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin: 0 auto 12px;
          box-shadow: 0 0 20px rgba(0,229,255,0.2);
          animation: iconPulse 3s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%,100% { box-shadow: 0 0 20px rgba(0,229,255,0.2); }
          50%      { box-shadow: 0 0 36px rgba(0,229,255,0.45); }
        }
        .rg-logo-title {
          font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900;
          background: linear-gradient(135deg, #00e5ff, #0072ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          letter-spacing: 0.1em;
        }
        .rg-logo-sub {
          font-family: 'Share Tech Mono', monospace; font-size: 10px;
          color: rgba(255,255,255,0.25); letter-spacing: 0.25em;
          text-transform: uppercase; margin-top: 4px;
        }

        /* ── Stepper ── */
        .rg-stepper {
          display: flex; align-items: center; gap: 0; margin-bottom: 32px;
        }
        .rg-step {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
          position: relative;
        }
        .rg-step-circle {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700;
          border: 2px solid; transition: all 0.4s; position: relative; z-index: 2;
        }
        .rg-step-label {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: color 0.3s;
        }
        .rg-step-line {
          position: absolute; top: 20px; left: calc(50% + 20px);
          width: calc(100% - 40px); height: 1px;
          transition: background 0.4s;
        }

        /* ── Field ── */
        .rg-field { margin-bottom: 18px; }
        .rg-label {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(255,255,255,0.35); margin-bottom: 8px; display: block;
        }
        .rg-input-wrap { position: relative; }
        .rg-input {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #e2e8f0; font-size: 14px; font-family: 'Exo 2', sans-serif;
          outline: none; transition: all 0.25s;
        }
        .rg-input:focus {
          border-color: rgba(0,229,255,0.5);
          background: rgba(0,229,255,0.04);
          box-shadow: 0 0 0 3px rgba(0,229,255,0.08);
        }
        .rg-input.has-icon { padding-right: 44px; }
        .rg-input-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); font-size: 16px;
          transition: color 0.2s; padding: 4px;
        }
        .rg-input-btn:hover { color: #00e5ff; }

        /* ── Password strength ── */
        .pw-bars { display: flex; gap: 4px; margin-top: 8px; }
        .pw-bar {
          flex: 1; height: 3px; border-radius: 99px;
          background: rgba(255,255,255,0.08); transition: background 0.3s;
        }
        .pw-hint {
          font-family: 'Share Tech Mono', monospace; font-size: 10px;
          margin-top: 5px; transition: color 0.3s;
        }
        .pw-rules { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
        .pw-rule {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid; letter-spacing: 0.08em; transition: all 0.25s;
        }

        /* ── CTA button ── */
        .rg-btn {
          width: 100%; padding: 14px; border-radius: 10px; border: none;
          font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer; transition: all 0.3s; margin-top: 6px;
          clip-path: polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
          position: relative; overflow: hidden;
        }
        .rg-btn-primary {
          background: linear-gradient(135deg, #0072ff, #00e5ff);
          color: #000;
          box-shadow: 0 0 20px rgba(0,229,255,0.35);
        }
        .rg-btn-primary:hover:not(:disabled) {
          box-shadow: 0 0 36px rgba(0,229,255,0.6); transform: translateY(-1px);
        }
        .rg-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .rg-btn-primary::after {
          content: ''; position: absolute; top: -50%; left: -60%; width: 30%; height: 200%;
          background: rgba(255,255,255,0.15); transform: skewX(-20deg);
          animation: shimmer 2.8s infinite;
        }
        @keyframes shimmer { 0% { left: -60%; } 100% { left: 160%; } }

        .rg-btn-ghost {
          background: transparent; color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.1) !important;
          font-size: 11px;
        }
        .rg-btn-ghost:hover { border-color: rgba(255,255,255,0.25) !important; color: rgba(255,255,255,0.7); }

        /* ── OTP section ── */
        .otp-timer {
          font-family: 'Share Tech Mono', monospace; font-size: 11px;
          color: rgba(255,255,255,0.35); text-align: center; margin-top: 10px;
        }
        .otp-resend {
          color: #00e5ff; cursor: pointer; background: none; border: none;
          font-family: 'Share Tech Mono', monospace; font-size: 11px;
          text-decoration: underline; padding: 0;
        }
        .otp-resend:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: none; }

        /* ── Toast ── */
        .rg-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 999;
          padding: 14px 20px; border-radius: 12px; min-width: 280px;
          font-family: 'Share Tech Mono', monospace; font-size: 12px;
          display: flex; align-items: flex-start; gap: 10px;
          backdrop-filter: blur(20px); border: 1px solid;
          animation: toastIn 0.3s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .rg-toast-success { background:rgba(74,222,128,0.1); border-color:rgba(74,222,128,0.3); color:#4ade80; }
        .rg-toast-error   { background:rgba(239,68,68,0.1);  border-color:rgba(239,68,68,0.3);  color:#f87171; }
        .rg-toast-info    { background:rgba(0,229,255,0.08); border-color:rgba(0,229,255,0.3);  color:#67e8f9; }
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        /* ── Divider ── */
        .rg-divider { height:1px; background:rgba(255,255,255,0.06); margin:20px 0; }

        /* ── Bottom link ── */
        .rg-footer {
          text-align: center; margin-top: 22px;
          font-size: 12px; color: rgba(255,255,255,0.3);
          font-family: 'Share Tech Mono', monospace;
        }
        .rg-footer a { color:#00e5ff; cursor:pointer; text-decoration:none; }
        .rg-footer a:hover { text-decoration:underline; }

        /* ── Step content animation ── */
        @keyframes stepIn {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .step-in { animation: stepIn 0.35s ease forwards; }

        /* ── Success screen ── */
        .success-icon {
          width:72px; height:72px; border-radius:50%; margin:0 auto 20px;
          background:rgba(74,222,128,0.1); border:2px solid rgba(74,222,128,0.4);
          display:flex; align-items:center; justify-content:center;
          font-size:30px; animation:iconPulse 2s ease-in-out infinite;
          box-shadow:0 0 24px rgba(74,222,128,0.2);
        }
      `}</style>

      <div className="rg-root">
        {/* Ambient orbs */}
        <div className="orb" style={{ width:500, height:500, right:-150, top:-150,
          background:"radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)" }} />
        <div className="orb" style={{ width:400, height:400, left:-100, bottom:-100,
          background:"radial-gradient(circle,rgba(0,114,255,0.07) 0%,transparent 70%)" }} />
        <Particles />

        <div className="rg-card">

          {/* Logo */}
          <div className="rg-logo">
            <div className="rg-logo-icon">⚡</div>
            <div className="rg-logo-title">LEVEL UP</div>
            <div className="rg-logo-sub">Candidate Uplink · Registration</div>
          </div>

          {/* Stepper */}
          <div className="rg-stepper">
            {STEPS.map((s, i) => {
              const done    = step > s.id;
              const active  = step === s.id;
              const circleStyle = {
                borderColor: done ? "#4ade80" : active ? "#00e5ff" : "rgba(255,255,255,0.1)",
                background:  done ? "rgba(74,222,128,0.15)" : active ? "rgba(0,229,255,0.1)" : "transparent",
                color:       done ? "#4ade80" : active ? "#00e5ff" : "rgba(255,255,255,0.25)",
                boxShadow:   active ? "0 0 16px rgba(0,229,255,0.3)" : "none",
              };
              const labelColor = done ? "#4ade80" : active ? "#00e5ff" : "rgba(255,255,255,0.25)";
              const lineColor  = done ? "#4ade80" : "rgba(255,255,255,0.08)";
              return (
                <div key={s.id} className="rg-step">
                  <div className="rg-step-circle" style={circleStyle}>
                    {done ? "✓" : s.icon}
                  </div>
                  <div className="rg-step-label" style={{ color: labelColor }}>{s.label}</div>
                  {i < STEPS.length - 1 && (
                    <div className="rg-step-line" style={{ background: lineColor }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ══ STEP 1 : Identity ══════════════════════════════ */}
          {step === 1 && (
            <div className="step-in">
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700,
                letterSpacing:"0.12em", color:"rgba(255,255,255,0.6)", marginBottom:20,
                textTransform:"uppercase" }}>
                01 · Identity Protocol
              </div>

              {/* Name */}
              <div className="rg-field">
                <label className="rg-label">Full Name</label>
                <div className="rg-input-wrap">
                  <input className="rg-input" placeholder="Enter your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rg-field">
                <label className="rg-label">Email Address</label>
                <div className="rg-input-wrap">
                  <input className="rg-input" placeholder="you@domain.com" type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <button className="rg-btn rg-btn-primary" disabled={!canNext1}
                onClick={() => setStep(2)}>
                Continue →
              </button>

              <div className="rg-footer">
                Already have an account? <a onClick={() => router.push("/login")}>Login</a>
              </div>
            </div>
          )}

          {/* ══ STEP 2 : Security ══════════════════════════════ */}
          {step === 2 && (
            <div className="step-in">
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700,
                letterSpacing:"0.12em", color:"rgba(255,255,255,0.6)", marginBottom:20,
                textTransform:"uppercase" }}>
                02 · Security Protocol
              </div>

              {/* Password */}
              <div className="rg-field">
                <label className="rg-label">Create Password</label>
                <div className="rg-input-wrap">
                  <input className="rg-input has-icon" placeholder="Min 8 characters"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button className="rg-input-btn" type="button" onClick={() => setShowPw(v => !v)}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Strength bars */}
                {form.password && (
                  <>
                    <div className="pw-bars">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="pw-bar"
                          style={{ background: n <= strength ? PW_COLORS[strength] : undefined }} />
                      ))}
                    </div>
                    <div className="pw-hint" style={{ color: PW_COLORS[strength] }}>
                      {PW_LABELS[strength]} password
                    </div>
                    <div className="pw-rules">
                      {[
                        { label:"8+ chars", ok: form.password.length >= 8 },
                        { label:"Uppercase", ok: /[A-Z]/.test(form.password) },
                        { label:"Number",    ok: /[0-9]/.test(form.password) },
                        { label:"Symbol",    ok: /[^A-Za-z0-9]/.test(form.password) },
                      ].map(r => (
                        <div key={r.label} className="pw-rule" style={{
                          color:       r.ok ? "#4ade80" : "rgba(255,255,255,0.25)",
                          borderColor: r.ok ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)",
                          background:  r.ok ? "rgba(74,222,128,0.08)" : "transparent",
                        }}>
                          {r.ok ? "✓" : "○"} {r.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Confirm password */}
              <div className="rg-field">
                <label className="rg-label">Confirm Password</label>
                <div className="rg-input-wrap">
                  <input className="rg-input has-icon"
                    placeholder="Re-enter password"
                    type={showCpw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    style={{
                      borderColor: form.confirmPassword
                        ? form.confirmPassword === form.password
                          ? "rgba(74,222,128,0.5)"
                          : "rgba(239,68,68,0.5)"
                        : undefined,
                    }}
                  />
                  <button className="rg-input-btn" type="button" onClick={() => setShowCpw(v => !v)}>
                    {showCpw ? "🙈" : "👁️"}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                    color:"#f87171", marginTop:6 }}>
                    ✕ Passwords do not match
                  </div>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                    color:"#4ade80", marginTop:6 }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button className="rg-btn rg-btn-ghost" style={{ flex:"0 0 80px" }}
                  onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button className="rg-btn rg-btn-primary" style={{ flex:1 }}
                  disabled={!canNext2}
                  onClick={() => { setStep(3); sendOtp(); }}>
                  Send OTP →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3 : Verify OTP ════════════════════════════ */}
          {step === 3 && (
            <div className="step-in">
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700,
                letterSpacing:"0.12em", color:"rgba(255,255,255,0.6)", marginBottom:8,
                textTransform:"uppercase" }}>
                03 · Verification
              </div>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11,
                color:"rgba(255,255,255,0.35)", marginBottom:24, lineHeight:1.7 }}>
                A 6-digit code was sent to<br />
                <span style={{ color:"#00e5ff" }}>{form.email}</span>
              </p>

              <div className="rg-field">
                <label className="rg-label">Enter OTP</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <div className="otp-timer">
                {otpTimer > 0 ? (
                  <>Resend in <span style={{ color:"#00e5ff" }}>00:{String(otpTimer).padStart(2,"0")}</span></>
                ) : (
                  <button className="otp-resend" onClick={sendOtp}>Resend OTP</button>
                )}
              </div>

              <div className="rg-divider" style={{ marginTop:20 }} />

              <div style={{ display:"flex", gap:10 }}>
                <button className="rg-btn rg-btn-ghost" style={{ flex:"0 0 80px" }}
                  onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button className="rg-btn rg-btn-primary" style={{ flex:1 }}
                  disabled={otp.length < 6 || loading}
                  onClick={handleRegister}>
                  {loading ? "Creating Account..." : "Activate Account ⚡"}
                </button>
              </div>

              {/* Dev hint */}
              {generatedOtp && (
                <div style={{ marginTop:14, padding:"10px 14px", borderRadius:8,
                  background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)",
                  fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                  color:"rgba(251,191,36,0.7)", textAlign:"center" }}>
                  🔧 DEV MODE · OTP: <span style={{ color:"#fbbf24", fontWeight:700, fontSize:13 }}>{generatedOtp}</span>
                </div>
              )}
            </div>
          )}

        </div>{/* end card */}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rg-toast rg-toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}</span>
          <span style={{ lineHeight:1.5 }}>{toast.msg}</span>
        </div>
      )}
    </>
  );
}