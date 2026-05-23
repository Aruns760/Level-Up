"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";

/* ══ Animated Grid Canvas ══════════════════════════════════════ */
function GridCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    let t = 0;
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const spacing = 56;
      ctx.strokeStyle = "rgba(168,85,247,0.06)";
      ctx.lineWidth = 0.7;
      for (let x = 0; x < cvs.width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cvs.height); ctx.stroke();
      }
      for (let y = 0; y < cvs.height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cvs.width, y); ctx.stroke();
      }
      // Floating particles
      const pts = 55;
      for (let i = 0; i < pts; i++) {
        const x = ((Math.sin(t * 0.0008 + i * 2.4) + 1) / 2) * cvs.width;
        const y = ((Math.cos(t * 0.0006 + i * 1.9) + 1) / 2) * cvs.height;
        const r = 0.8 + Math.sin(t * 0.002 + i) * 0.5;
        const o = 0.15 + Math.sin(t * 0.001 + i * 0.7) * 0.1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,85,247,${o})`; ctx.fill();
      }
      t++;
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
  if (pw.length >= 8)        s++;
  if (/[A-Z]/.test(pw))     s++;
  if (/[0-9]/.test(pw))     s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const PW_COLORS = ["", "#ef4444", "#f59e0b", "#4ade80", "#a855f7"];

/* ══ OTP Input ═════════════════════════════════════════════════ */
function OtpInput({ value, onChange }) {
  const r0=useRef(null),r1=useRef(null),r2=useRef(null);
  const r3=useRef(null),r4=useRef(null),r5=useRef(null);
  const refs = [r0,r1,r2,r3,r4,r5];
  const digits = value.split("").concat(Array(6).fill("")).slice(0,6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = digits.slice(); next[i] = "";
      onChange(next.join(""));
      if (i > 0) refs[i-1].current?.focus();
    } else if (/^[0-9]$/.test(e.key)) {
      const next = digits.slice(); next[i] = e.key;
      onChange(next.join(""));
      if (i < 5) refs[i+1].current?.focus();
    }
  };

  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} maxLength={1} value={d}
          onChange={() => {}} onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          style={{
            width:46, height:54, textAlign:"center", fontSize:22,
            fontFamily:"'Orbitron',sans-serif", fontWeight:700,
            background: d ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
            border:`1px solid ${d ? "rgba(168,85,247,0.7)" : "rgba(255,255,255,0.1)"}`,
            borderRadius:10, color:"#c084fc", outline:"none",
            boxShadow: d ? "0 0 14px rgba(168,85,247,0.35)" : "none",
            transition:"all 0.2s", caretColor:"transparent",
          }}
        />
      ))}
    </div>
  );
}

/* ══ Steps config ══════════════════════════════════════════════ */
const STEPS = [
  { id:1, icon:"◈", label:"Identity"  },
  { id:2, icon:"⬡", label:"Company"   },
  { id:3, icon:"⚔", label:"Security"  },
  { id:4, icon:"▲", label:"Verify"    },
];

/* ══ MAIN ══════════════════════════════════════════════════════ */
export default function RecruiterRegister() {
  const router = useRouter();

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState({
    name:"", email:"", password:"", confirmPassword:"",
    companyName:"", companyWebsite:"", companySize:"", industry:"",
  });
  const [otp, setOtp]         = useState("");
  const [genOtp, setGenOtp]   = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [toast, setToast]     = useState(null);
  const cardRef               = useRef(null);
  const [tilt, setTilt]       = useState({ x:0, y:0 });

  const strength = pwStrength(form.password);

  /* ── Toast ── */
  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3600);
  };

  /* ── OTP timer ── */
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(v => v-1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  /* ── Card 3-D tilt ── */
  const onMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTilt({
      x:  ((e.clientY - rect.top)  / rect.height - 0.5) * 12,
      y: -((e.clientX - rect.left) / rect.width  - 0.5) * 12,
    });
  };

  /* ── Send OTP ── */
  const sendOtp = () => {
    if (!form.email.includes("@")) { showToast("Enter a valid email first.", "error"); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGenOtp(code);
    setOtpTimer(60);
    showToast(`OTP dispatched to ${form.email} · DEV: ${code}`, "info");
  };

  /* ── Validation ── */
  const canNext1 = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email);
  const canNext2 = form.companyName.trim().length >= 2;
  const canNext3 = strength >= 2 && form.password === form.confirmPassword;

  /* ── Submit ── */
  const handleRegister = async () => {
    if (otp !== genOtp) { showToast("Invalid OTP. Try again.", "error"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
        companyName: form.companyName, companyWebsite: form.companyWebsite,
        role: "recruiter",
      });
      showToast("Recruiter account activated! Redirecting...", "success");
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      showToast(err?.response?.data?.message || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const P = "#a855f7"; // primary purple

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .rr-root {
          min-height: 100vh;
          background: #0d0415;
          font-family: 'Exo 2', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }

        /* Deep space bg */
        .rr-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(168,85,247,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 90%, rgba(99,102,241,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Scanlines */
        .rr-root::after {
          content: '';
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
          );
        }

        /* ── Card ── */
        .rr-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 500px;
          background: rgba(13,4,21,0.95);
          border: 1px solid rgba(168,85,247,0.2);
          border-radius: 24px; padding: 40px 38px;
          backdrop-filter: blur(28px);
          box-shadow:
            0 0 0 1px rgba(168,85,247,0.06),
            0 0 60px rgba(168,85,247,0.1),
            0 40px 80px rgba(0,0,0,0.7);
          will-change: transform;
          transition: transform 0.08s ease;
          animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(28px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }

        /* Corner cuts */
        .rr-card .corner-tl {
          position:absolute; top:0; left:0; width:22px; height:22px;
          border-top:2px solid ${P}; border-left:2px solid ${P};
          border-radius:3px 0 0 0; opacity:0.7;
        }
        .rr-card .corner-tr {
          position:absolute; top:0; right:0; width:22px; height:22px;
          border-top:2px solid ${P}; border-right:2px solid ${P};
          border-radius:0 3px 0 0; opacity:0.7;
        }
        .rr-card .corner-bl {
          position:absolute; bottom:0; left:0; width:22px; height:22px;
          border-bottom:2px solid ${P}; border-left:2px solid ${P};
          border-radius:0 0 0 3px; opacity:0.7;
        }
        .rr-card .corner-br {
          position:absolute; bottom:0; right:0; width:22px; height:22px;
          border-bottom:2px solid ${P}; border-right:2px solid ${P};
          border-radius:0 0 3px 0; opacity:0.7;
        }

        /* Scrolling top border */
        .rr-card .top-scan {
          position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent 0%, ${P} 50%, transparent 100%);
          animation: scanLine 3s linear infinite; opacity:0.6;
        }
        @keyframes scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* ── Logo ── */
        .rr-logo { text-align:center; margin-bottom:26px; }
        .rr-logo-icon {
          width:60px; height:60px; border-radius:16px; margin:0 auto 12px;
          background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.25));
          border:1px solid rgba(168,85,247,0.4);
          display:flex; align-items:center; justify-content:center; font-size:26px;
          box-shadow:0 0 28px rgba(168,85,247,0.25), inset 0 0 20px rgba(168,85,247,0.05);
          animation:iconGlow 3s ease-in-out infinite;
        }
        @keyframes iconGlow {
          0%,100% { box-shadow:0 0 28px rgba(168,85,247,0.25); }
          50%      { box-shadow:0 0 48px rgba(168,85,247,0.55); }
        }
        .rr-logo-title {
          font-family:'Orbitron',sans-serif; font-size:18px; font-weight:900;
          background:linear-gradient(135deg, #c084fc, #818cf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          letter-spacing:0.1em;
        }
        .rr-logo-sub {
          font-family:'Share Tech Mono',monospace; font-size:9px;
          color:rgba(255,255,255,0.22); letter-spacing:0.25em;
          text-transform:uppercase; margin-top:4px;
        }

        /* ── Stepper ── */
        .rr-stepper { display:flex; align-items:flex-start; gap:0; margin-bottom:30px; }
        .rr-step { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; position:relative; }
        .rr-step-circle {
          width:38px; height:38px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-family:'Orbitron',sans-serif; font-size:13px; font-weight:700;
          border:2px solid; transition:all 0.4s; position:relative; z-index:2;
        }
        .rr-step-label {
          font-family:'Share Tech Mono',monospace; font-size:8px;
          letter-spacing:0.12em; text-transform:uppercase; transition:color 0.3s;
        }
        .rr-step-line {
          position:absolute; top:19px; left:calc(50% + 19px);
          width:calc(100% - 38px); height:1px; transition:background 0.4s;
        }

        /* ── Input ── */
        .rr-field { margin-bottom:16px; }
        .rr-label {
          font-family:'Share Tech Mono',monospace; font-size:9px;
          letter-spacing:0.2em; text-transform:uppercase;
          color:rgba(255,255,255,0.3); margin-bottom:7px; display:block;
        }
        .rr-input-wrap { position:relative; }
        .rr-input {
          width:100%; padding:11px 15px; border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          color:#e2e8f0; font-size:13px; font-family:'Exo 2',sans-serif;
          outline:none; transition:all 0.25s;
        }
        .rr-input:focus {
          border-color:rgba(168,85,247,0.5);
          background:rgba(168,85,247,0.04);
          box-shadow:0 0 0 3px rgba(168,85,247,0.08);
        }
        .rr-input.has-icon { padding-right:44px; }
        .rr-input-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .rr-icon-btn {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer;
          color:rgba(255,255,255,0.3); font-size:15px; padding:4px;
          transition:color 0.2s;
        }
        .rr-icon-btn:hover { color:${P}; }

        /* ── Select ── */
        .rr-select {
          width:100%; padding:11px 15px; border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          color:#e2e8f0; font-size:13px; font-family:'Exo 2',sans-serif;
          outline:none; transition:all 0.25s; appearance:none; cursor:pointer;
        }
        .rr-select:focus {
          border-color:rgba(168,85,247,0.5);
          box-shadow:0 0 0 3px rgba(168,85,247,0.08);
        }
        .rr-select option { background:#1a0930; color:#e2e8f0; }

        /* ── PW strength ── */
        .pw-bars { display:flex; gap:4px; margin-top:7px; }
        .pw-bar  { flex:1; height:3px; border-radius:99px; background:rgba(255,255,255,0.07); transition:background 0.3s; }
        .pw-hint { font-family:'Share Tech Mono',monospace; font-size:10px; margin-top:5px; transition:color 0.3s; }
        .pw-rules { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
        .pw-rule {
          font-family:'Share Tech Mono',monospace; font-size:9px;
          padding:2px 9px; border-radius:20px; border:1px solid; letter-spacing:0.07em;
          transition:all 0.25s;
        }

        /* ── Buttons ── */
        .rr-btn {
          width:100%; padding:13px; border-radius:10px; border:none;
          font-family:'Orbitron',sans-serif; font-size:11px; font-weight:700;
          letter-spacing:0.15em; text-transform:uppercase;
          cursor:pointer; transition:all 0.3s;
          clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
          position:relative; overflow:hidden;
        }
        .rr-btn-row { display:flex; gap:10px; margin-top:6px; }
        .rr-btn-primary {
          background:linear-gradient(135deg, #7c3aed, #a855f7);
          color:#fff;
          box-shadow:0 0 20px rgba(168,85,247,0.35);
        }
        .rr-btn-primary:hover:not(:disabled) {
          box-shadow:0 0 36px rgba(168,85,247,0.65); transform:translateY(-1px);
        }
        .rr-btn-primary:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
        .rr-btn-primary::after {
          content:''; position:absolute; top:-50%; left:-60%; width:30%; height:200%;
          background:rgba(255,255,255,0.12); transform:skewX(-20deg);
          animation:shimmer 2.6s infinite;
        }
        @keyframes shimmer { 0%{left:-60%} 100%{left:160%} }
        .rr-btn-ghost {
          background:transparent; color:rgba(255,255,255,0.4);
          border:1px solid rgba(255,255,255,0.1) !important;
          font-size:10px;
        }
        .rr-btn-ghost:hover { border-color:rgba(255,255,255,0.25)!important; color:rgba(255,255,255,0.7); }

        /* ── OTP ── */
        .otp-meta {
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(255,255,255,0.3); text-align:center; margin-top:10px;
        }
        .otp-resend {
          color:${P}; cursor:pointer; background:none; border:none;
          font-family:'Share Tech Mono',monospace; font-size:10px;
          text-decoration:underline; padding:0;
        }
        .otp-resend:disabled { opacity:0.35; cursor:not-allowed; text-decoration:none; }

        /* ── Divider ── */
        .rr-divider { height:1px; background:rgba(255,255,255,0.06); margin:16px 0; }

        /* ── Toast ── */
        .rr-toast {
          position:fixed; bottom:26px; right:26px; z-index:999;
          padding:13px 18px; border-radius:12px; min-width:280px;
          font-family:'Share Tech Mono',monospace; font-size:11px;
          display:flex; align-items:flex-start; gap:10px;
          backdrop-filter:blur(20px); border:1px solid;
          animation:toastIn 0.3s ease;
          box-shadow:0 8px 32px rgba(0,0,0,0.5);
          line-height:1.55;
        }
        .rr-toast-success { background:rgba(74,222,128,0.1);  border-color:rgba(74,222,128,0.3);  color:#4ade80; }
        .rr-toast-error   { background:rgba(239,68,68,0.1);   border-color:rgba(239,68,68,0.3);   color:#f87171; }
        .rr-toast-info    { background:rgba(168,85,247,0.1);  border-color:rgba(168,85,247,0.3);  color:#c084fc; }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ── Footer ── */
        .rr-footer {
          text-align:center; margin-top:20px;
          font-family:'Share Tech Mono',monospace; font-size:11px;
          color:rgba(255,255,255,0.27);
        }
        .rr-footer a { color:${P}; cursor:pointer; text-decoration:none; }
        .rr-footer a:hover { text-decoration:underline; }

        /* ── Section title ── */
        .rr-step-title {
          font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:0.14em; color:rgba(255,255,255,0.5);
          margin-bottom:18px; text-transform:uppercase;
        }

        /* ── Dev box ── */
        .dev-box {
          margin-top:14px; padding:10px 14px; border-radius:8px;
          background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.18);
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(251,191,36,0.65); text-align:center;
        }

        /* ── Recruiter badge ── */
        .recruiter-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:4px 12px; border-radius:20px;
          background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.25);
          font-family:'Share Tech Mono',monospace; font-size:9px;
          color:#c084fc; letter-spacing:0.12em; margin-bottom:20px;
        }
        .recruiter-badge-dot {
          width:6px; height:6px; border-radius:50%; background:#a855f7;
          box-shadow:0 0 6px #a855f7; animation:blip 2s infinite;
        }
        @keyframes blip { 0%,100%{opacity:1}50%{opacity:0.4} }

        /* ── Step anim ── */
        @keyframes stepIn {
          from{opacity:0;transform:translateX(18px)}
          to  {opacity:1;transform:translateX(0)}
        }
        .step-in { animation:stepIn 0.32s ease forwards; }

        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.25); border-radius:99px; }
      `}</style>

      <div className="rr-root">
        <GridCanvas />

        <div
          ref={cardRef}
          className="rr-card"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setTilt({ x:0, y:0 })}
          style={{ transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {/* Corner accents */}
          <div className="corner-tl" /><div className="corner-tr" />
          <div className="corner-bl" /><div className="corner-br" />
          <div className="top-scan" />

          {/* Logo */}
          <div className="rr-logo">
            <div className="rr-logo-icon">🏢</div>
            <div className="rr-logo-title">LEVELUP</div>
            <div className="rr-logo-sub">Recruiter Command · Registration</div>
          </div>

          {/* Recruiter badge */}
          <div style={{ display:"flex", justifyContent:"center" }}>
            <div className="recruiter-badge">
              <div className="recruiter-badge-dot" />
              RECRUITER UPLINK PROTOCOL
            </div>
          </div>

          {/* Stepper */}
          <div className="rr-stepper">
            {STEPS.map((s, i) => {
              const done   = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="rr-step">
                  <div className="rr-step-circle" style={{
                    borderColor: done ? "#4ade80" : active ? P : "rgba(255,255,255,0.1)",
                    background:  done ? "rgba(74,222,128,0.12)" : active ? "rgba(168,85,247,0.12)" : "transparent",
                    color:       done ? "#4ade80" : active ? P : "rgba(255,255,255,0.2)",
                    boxShadow:   active ? `0 0 18px rgba(168,85,247,0.35)` : "none",
                  }}>
                    {done ? "✓" : s.icon}
                  </div>
                  <div className="rr-step-label" style={{
                    color: done ? "#4ade80" : active ? P : "rgba(255,255,255,0.2)",
                  }}>{s.label}</div>
                  {i < STEPS.length-1 && (
                    <div className="rr-step-line" style={{
                      background: done ? "#4ade80" : "rgba(255,255,255,0.07)",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ══ STEP 1 : Identity ══════════════════════════════ */}
          {step === 1 && (
            <div className="step-in">
              <div className="rr-step-title">01 · Recruiter Identity</div>

              <div className="rr-field">
                <label className="rr-label">Full Name</label>
                <input className="rr-input" placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})} />
              </div>

              <div className="rr-field">
                <label className="rr-label">Work Email</label>
                <input className="rr-input" placeholder="recruiter@company.com" type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})} />
              </div>

              <button className="rr-btn rr-btn-primary" disabled={!canNext1}
                onClick={() => setStep(2)}>
                Continue →
              </button>

              <div className="rr-footer">
                Already registered? <a onClick={() => router.push("/login")}>Sign In</a>
                &nbsp;·&nbsp;
                <a onClick={() => router.push("/register/candidate")}>Candidate Sign Up</a>
              </div>
            </div>
          )}

          {/* ══ STEP 2 : Company ═══════════════════════════════ */}
          {step === 2 && (
            <div className="step-in">
              <div className="rr-step-title">02 · Company Details</div>

              <div className="rr-field">
                <label className="rr-label">Company Name</label>
                <input className="rr-input" placeholder="Acme Corp"
                  value={form.companyName}
                  onChange={e => setForm({...form, companyName:e.target.value})} />
              </div>

              <div className="rr-field">
                <label className="rr-label">Company Website</label>
                <input className="rr-input" placeholder="https://company.com" type="url"
                  value={form.companyWebsite}
                  onChange={e => setForm({...form, companyWebsite:e.target.value})} />
              </div>

              <div className="rr-input-row" style={{ marginBottom:16 }}>
                <div className="rr-field" style={{ marginBottom:0 }}>
                  <label className="rr-label">Company Size</label>
                  <select className="rr-select"
                    value={form.companySize}
                    onChange={e => setForm({...form, companySize:e.target.value})}>
                    <option value="">Select size</option>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–50</option>
                    <option value="51-200">51–200</option>
                    <option value="201-500">201–500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div className="rr-field" style={{ marginBottom:0 }}>
                  <label className="rr-label">Industry</label>
                  <select className="rr-select"
                    value={form.industry}
                    onChange={e => setForm({...form, industry:e.target.value})}>
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="rr-btn-row">
                <button className="rr-btn rr-btn-ghost" style={{ flex:"0 0 80px" }}
                  onClick={() => setStep(1)}>← Back</button>
                <button className="rr-btn rr-btn-primary" style={{ flex:1 }}
                  disabled={!canNext2} onClick={() => setStep(3)}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3 : Security ══════════════════════════════ */}
          {step === 3 && (
            <div className="step-in">
              <div className="rr-step-title">03 · Security Protocol</div>

              {/* Password */}
              <div className="rr-field">
                <label className="rr-label">Create Password</label>
                <div className="rr-input-wrap">
                  <input className="rr-input has-icon"
                    type={showPw ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={e => setForm({...form, password:e.target.value})} />
                  <button className="rr-icon-btn" type="button" onClick={() => setShowPw(v=>!v)}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {form.password && (
                  <>
                    <div className="pw-bars">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="pw-bar"
                          style={{ background: n<=strength ? PW_COLORS[strength] : undefined }} />
                      ))}
                    </div>
                    <div className="pw-hint" style={{ color:PW_COLORS[strength] }}>
                      {PW_LABELS[strength]} password
                    </div>
                    <div className="pw-rules">
                      {[
                        { label:"8+ chars",  ok: form.password.length >= 8 },
                        { label:"Uppercase", ok: /[A-Z]/.test(form.password) },
                        { label:"Number",    ok: /[0-9]/.test(form.password) },
                        { label:"Symbol",    ok: /[^A-Za-z0-9]/.test(form.password) },
                      ].map(r => (
                        <div key={r.label} className="pw-rule" style={{
                          color:       r.ok ? "#4ade80" : "rgba(255,255,255,0.22)",
                          borderColor: r.ok ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)",
                          background:  r.ok ? "rgba(74,222,128,0.07)" : "transparent",
                        }}>
                          {r.ok ? "✓" : "○"} {r.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Confirm */}
              <div className="rr-field">
                <label className="rr-label">Confirm Password</label>
                <div className="rr-input-wrap">
                  <input className="rr-input has-icon"
                    type={showCpw ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword:e.target.value})}
                    style={{
                      borderColor: form.confirmPassword
                        ? form.confirmPassword === form.password
                          ? "rgba(74,222,128,0.5)"
                          : "rgba(239,68,68,0.5)"
                        : undefined,
                    }} />
                  <button className="rr-icon-btn" type="button" onClick={() => setShowCpw(v=>!v)}>
                    {showCpw ? "🙈" : "👁️"}
                  </button>
                </div>
                {form.confirmPassword && (
                  <div style={{
                    fontFamily:"'Share Tech Mono',monospace", fontSize:10, marginTop:5,
                    color: form.confirmPassword === form.password ? "#4ade80" : "#f87171",
                  }}>
                    {form.confirmPassword === form.password ? "✓ Passwords match" : "✕ Passwords do not match"}
                  </div>
                )}
              </div>

              <div className="rr-btn-row">
                <button className="rr-btn rr-btn-ghost" style={{ flex:"0 0 80px" }}
                  onClick={() => setStep(2)}>← Back</button>
                <button className="rr-btn rr-btn-primary" style={{ flex:1 }}
                  disabled={!canNext3}
                  onClick={() => { setStep(4); sendOtp(); }}>
                  Send OTP →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 4 : Verify OTP ════════════════════════════ */}
          {step === 4 && (
            <div className="step-in">
              <div className="rr-step-title">04 · Verification</div>

              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11,
                color:"rgba(255,255,255,0.32)", marginBottom:22, lineHeight:1.75 }}>
                A 6-digit code was dispatched to<br />
                <span style={{ color:P }}>{form.email}</span>
              </p>

              <div className="rr-field">
                <label className="rr-label">Enter OTP Code</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <div className="otp-meta">
                {otpTimer > 0 ? (
                  <>Resend in <span style={{ color:P }}>00:{String(otpTimer).padStart(2,"0")}</span></>
                ) : (
                  <button className="otp-resend" onClick={sendOtp}>↺ Resend OTP</button>
                )}
              </div>

              <div className="rr-divider" style={{ marginTop:18 }} />

              <div className="rr-btn-row">
                <button className="rr-btn rr-btn-ghost" style={{ flex:"0 0 80px" }}
                  onClick={() => setStep(3)}>← Back</button>
                <button className="rr-btn rr-btn-primary" style={{ flex:1 }}
                  disabled={otp.length < 6 || loading}
                  onClick={handleRegister}>
                  {loading ? "Activating..." : "Activate Account ⚡"}
                </button>
              </div>

              {genOtp && (
                <div className="dev-box">
                  🔧 DEV MODE · OTP:&nbsp;
                  <span style={{ color:"#fbbf24", fontWeight:700, fontSize:14 }}>{genOtp}</span>
                </div>
              )}
            </div>
          )}

        </div>{/* end card */}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rr-toast rr-toast-${toast.type}`}>
          <span>{toast.type==="success" ? "✓" : toast.type==="error" ? "✕" : "ℹ"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}