"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";

/* ══ GOLD PARTICLE CANVAS ══════════════════════════════════════ */
function GoldParticles() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.2),
      o: Math.random() * 0.6 + 0.1,
      gold: Math.random() > 0.5,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(255,${180 + Math.floor(Math.random()*40)},0,${p.o})`
          : `rgba(255,215,0,${p.o * 0.6})`;
        ctx.shadowBlur = 6; ctx.shadowColor = "#ffd700";
        ctx.fill(); ctx.shadowBlur = 0;
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = cvs.height + 10; p.x = Math.random() * cvs.width; }
        if (p.x < 0 || p.x > cvs.width) p.vx *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

/* ══ GLITCH TEXT ═══════════════════════════════════════════════ */
function GlitchText({ text, color = "#ffd700" }) {
  const [g, setG] = useState(text);
  const chars = "!@#$%∑∆⊕01アイウエ";
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.75) {
        const i = Math.floor(Math.random() * text.length);
        const a = text.split(""); a[i] = chars[Math.floor(Math.random() * chars.length)];
        setG(a.join(""));
        setTimeout(() => setG(text), 90);
      }
    }, 500);
    return () => clearInterval(t);
  }, [text]);
  return <span style={{ color }}>{g}</span>;
}

/* ══ VIDEO INTRO SCREEN ════════════════════════════════════════ */
const ROLE_VIDEOS = {
  candidate: {
    src: "/videos/candidate-intro.mp4",
    label: "CANDIDATE",
    color: "#00e5ff",
    glow: "rgba(0,229,255,0.5)",
    icon: "◈",
    redirect: "/candidate/dashboard",
    msg: "WELCOME, CANDIDATE",
  },
  recruiter: {
    src: "/videos/recruiter-intro.mp4",
    label: "RECRUITER",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.5)",
    icon: "⬡",
    redirect: "/recruiter-dashboard",
    msg: "WELCOME, RECRUITER",
  },
  admin: {
    src: "/videos/admin-intro.mp4",
    label: "ADMIN",
    color: "#ff2222",
    glow: "rgba(255,34,34,0.5)",
    icon: "☠",
    redirect: "/admin/dashboard",
    msg: "ACCESS GRANTED, ADMIN",
  },
};

function VideoIntro({ role, onSkip }) {
  const videoRef = useRef(null);
  const cfg = ROLE_VIDEOS[role];
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const update = () => setProgress((v.currentTime / v.duration) * 100 || 0);
    v.addEventListener("timeupdate", update);
    v.addEventListener("ended", onSkip);
    v.addEventListener("error", () => setVideoError(true));
    v.play().catch(() => setVideoError(true));
    return () => { v.removeEventListener("timeupdate", update); v.removeEventListener("ended", onSkip); };
  }, [onSkip]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200, background:"#000",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      animation:"videoFadeIn 0.6s ease forwards",
    }}>
      <style>{`
        @keyframes videoFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes videoFadeOut { from{opacity:1} to{opacity:0} }
      `}</style>

      {/* Video or fallback */}
      {!videoError ? (
        <video
          ref={videoRef}
          src={cfg.src}
          muted
          playsInline
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", zIndex:0 }}
        />
      ) : (
        /* Fallback animated screen when no video file present */
        <div style={{
          position:"absolute", inset:0, zIndex:0,
          background: `radial-gradient(ellipse at center, ${cfg.color}15 0%, #000 70%)`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24,
        }}>
          <div style={{
            fontSize:120, lineHeight:1, filter:`drop-shadow(0 0 40px ${cfg.color})`,
            animation:"iconBounce 1.5s ease-in-out infinite",
          }}>{cfg.icon}</div>
          <div style={{
            fontFamily:"'Orbitron',sans-serif", fontSize:"clamp(20px,4vw,40px)",
            fontWeight:900, color:cfg.color, letterSpacing:"0.2em",
            textShadow:`0 0 30px ${cfg.color}`,
            animation:"textGlow 1s ease-in-out infinite alternate",
          }}>{cfg.msg}</div>
          <div style={{
            fontFamily:"'Share Tech Mono',monospace", fontSize:13,
            color:"rgba(255,255,255,0.3)", letterSpacing:"0.25em",
          }}>INITIALIZING PORTAL...</div>
          <style>{`
            @keyframes iconBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
            @keyframes textGlow   { from{text-shadow:0 0 20px ${cfg.color}} to{text-shadow:0 0 60px ${cfg.color}, 0 0 100px ${cfg.color}} }
          `}</style>
        </div>
      )}

      {/* Overlay gradient */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)",
      }} />

      {/* Corner accents */}
      {[["top:0;left:0","border-top:2px solid;border-left:2px solid"],
        ["top:0;right:0","border-top:2px solid;border-right:2px solid"],
        ["bottom:0;left:0","border-bottom:2px solid;border-left:2px solid"],
        ["bottom:0;right:0","border-bottom:2px solid;border-right:2px solid"],
      ].map(([pos, brd], i) => (
        <div key={i} style={{
          position:"absolute", width:40, height:40, zIndex:2,
          ...Object.fromEntries(pos.split(";").filter(Boolean).map(s => s.split(":"))),
          ...Object.fromEntries(brd.split(";").filter(Boolean).map(s => {
            const [k,...v] = s.split(":");
            return [k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()), v.join(":").trim()];
          })),
          borderColor: cfg.color,
          opacity:0.7,
        }} />
      ))}

      {/* Role badge */}
      <div style={{
        position:"absolute", top:28, left:"50%", transform:"translateX(-50%)",
        zIndex:3, display:"flex", alignItems:"center", gap:10,
        padding:"6px 20px", borderRadius:2,
        background:"rgba(0,0,0,0.6)", border:`1px solid ${cfg.color}`,
        fontFamily:"'Share Tech Mono',monospace", fontSize:11,
        color:cfg.color, letterSpacing:"0.25em",
        boxShadow:`0 0 16px ${cfg.glow}`,
      }}>
        <span style={{ fontSize:16 }}>{cfg.icon}</span>
        {cfg.label} ACCESS PORTAL
      </div>

      {/* Progress bar */}
      <div style={{
        position:"absolute", bottom:70, left:"10%", right:"10%", zIndex:3,
        height:3, background:"rgba(255,255,255,0.1)", borderRadius:99,
      }}>
        <div style={{
          height:"100%", borderRadius:99, width:`${progress}%`,
          background:`linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
          boxShadow:`0 0 10px ${cfg.color}`,
          transition:"width 0.3s linear",
        }} />
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        style={{
          position:"absolute", bottom:24, right:28, zIndex:10,
          background:"rgba(0,0,0,0.6)", border:`1px solid ${cfg.color}`,
          color:cfg.color, padding:"8px 22px", borderRadius:2,
          fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:700,
          letterSpacing:"0.2em", cursor:"pointer",
          clipPath:"polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)",
          transition:"all 0.2s",
          boxShadow:`0 0 10px ${cfg.glow}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = cfg.color; e.currentTarget.style.color = "#000"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.color = cfg.color; }}
      >
        SKIP ▶▶
      </button>
    </div>
  );
}

/* ══ MAIN LOGIN PAGE ═══════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]         = useState({ email:"", password:"" });
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [videoRole, setVideoRole] = useState(null);
  const [redirectPath, setRedirectPath] = useState("");

  const showToast = (msg, type="error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const canSubmit = /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 4;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      const token = res.data.token;
      const user  = res.data.user;
      const role  = user.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("userId", user.id);

      showToast(`Welcome back, ${user.name}!`, "success");

      // Determine redirect
      const dest = role === "candidate" ? "/candidate/dashboard"
        : role === "recruiter" ? "/recruiter-dashboard"
        : role === "admin"     ? "/admin/dashboard"
        : "/";

      setRedirectPath(dest);

      // Show video intro after brief delay
      setTimeout(() => setVideoRole(role), 600);

    } catch (err) {
      showToast(err?.response?.data?.message || "Authentication failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setVideoRole(null);
    router.push(redirectPath);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Cinzel:wght@400;600;700&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lg-root {
          min-height: 100vh;
          background: #0a0700;
          font-family: 'Exo 2', sans-serif;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }

        /* ── Deep gold background ── */
        .lg-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 100% 80% at 50% 0%,   rgba(180,120,0,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 80%  60% at 0%   60%,  rgba(120,80,0,0.12)  0%, transparent 55%),
            radial-gradient(ellipse 80%  60% at 100% 40%,  rgba(120,80,0,0.12)  0%, transparent 55%),
            radial-gradient(ellipse 60%  60% at 50% 100%,  rgba(100,60,0,0.15)  0%, transparent 60%),
            #0a0700;
        }

        /* Animated gold grid */
        .lg-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,215,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,215,0,0.025) 1px, transparent 1px);
          background-size: 55px 55px;
          animation: gridPan 25s linear infinite;
        }
        @keyframes gridPan { 100% { background-position: 55px 55px; } }

        /* Scanlines */
        .lg-scan {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px,
            rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
        }

        /* ── Card ── */
        .lg-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 460px;
          background: rgba(10,7,0,0.95);
          border: 1px solid rgba(255,215,0,0.2);
          border-radius: 4px; padding: 44px 38px;
          backdrop-filter: blur(28px);
          box-shadow:
            0 0 0 1px rgba(255,215,0,0.06),
            0 0 80px rgba(180,130,0,0.15),
            0 40px 100px rgba(0,0,0,0.8),
            inset 0 0 60px rgba(180,130,0,0.03);
          clip-path: polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);
          animation: cardIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(32px) scale(0.95); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }

        /* Corner accents */
        .c { position:absolute; width:22px; height:22px; }
        .c-tl { top:0; left:0; border-top:2px solid #b8860b; border-left:2px solid #b8860b; }
        .c-tr { top:0; right:0; border-top:2px solid #b8860b; border-right:2px solid #b8860b; }
        .c-bl { bottom:0; left:0; border-bottom:2px solid #b8860b; border-left:2px solid #b8860b; }
        .c-br { bottom:0; right:0; border-bottom:2px solid #b8860b; border-right:2px solid #b8860b; }

        /* Gold scan strip */
        .lg-strip {
          position:absolute; top:0; left:0; right:0; height:2px; overflow:hidden;
        }
        .lg-strip::after {
          content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
          background:linear-gradient(90deg,transparent,#ffd700,#fffacd,#ffd700,transparent);
          box-shadow:0 0 10px #ffd700;
          animation:goldScan 3s linear infinite;
        }
        @keyframes goldScan { to { left:200%; } }

        /* ── Logo ── */
        .lg-logo { text-align:center; margin-bottom:30px; }
        .lg-logo-icon {
          width:68px; height:68px; margin:0 auto 14px;
          background:linear-gradient(135deg,rgba(180,130,0,0.2),rgba(100,70,0,0.3));
          border:1px solid rgba(255,215,0,0.35);
          border-radius:4px; display:flex; align-items:center; justify-content:center;
          font-size:30px; font-family:'Cinzel',serif;
          box-shadow:0 0 30px rgba(255,215,0,0.2),inset 0 0 20px rgba(180,130,0,0.07);
          animation:goldPulse 3s ease-in-out infinite;
          clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
        }
        @keyframes goldPulse {
          0%,100% { box-shadow:0 0 30px rgba(255,215,0,0.2); }
          50%      { box-shadow:0 0 55px rgba(255,215,0,0.5),0 0 100px rgba(180,130,0,0.2); }
        }
        .lg-logo-title {
          font-family:'Orbitron',sans-serif; font-size:20px; font-weight:900;
          letter-spacing:0.15em;
          background:linear-gradient(135deg,#b8860b,#ffd700,#fffacd,#ffd700,#b8860b);
          background-size:200% 200%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:goldShift 4s ease infinite;
          text-shadow:none;
        }
        @keyframes goldShift { 0%{background-position:0%} 100%{background-position:200%} }
        .lg-logo-sub {
          font-family:'Share Tech Mono',monospace; font-size:9px;
          color:rgba(255,215,0,0.3); letter-spacing:0.3em;
          text-transform:uppercase; margin-top:5px;
        }

        /* ── Divider ── */
        .lg-divider {
          height:1px; margin:20px 0;
          background:linear-gradient(90deg,transparent,rgba(255,215,0,0.2),transparent);
        }

        /* ── Field ── */
        .lg-field { margin-bottom:16px; }
        .lg-label {
          font-family:'Share Tech Mono',monospace; font-size:9px;
          letter-spacing:0.22em; text-transform:uppercase;
          color:rgba(255,215,0,0.35); margin-bottom:7px; display:block;
        }
        .lg-input-wrap { position:relative; }
        .lg-input {
          width:100%; padding:12px 16px; border-radius:2px;
          background:rgba(255,215,0,0.04);
          border:1px solid rgba(255,215,0,0.12);
          color:#ffe88a; font-size:13px; font-family:'Exo 2',sans-serif;
          outline:none; transition:all 0.25s;
          clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);
        }
        .lg-input::placeholder { color:rgba(255,215,0,0.2); }
        .lg-input:focus {
          border-color:rgba(255,215,0,0.5);
          background:rgba(255,215,0,0.07);
          box-shadow:0 0 0 2px rgba(255,215,0,0.08),0 0 16px rgba(180,130,0,0.1);
        }
        .lg-input.has-icon { padding-right:44px; }
        .lg-eye-btn {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer;
          color:rgba(255,215,0,0.3); font-size:15px; padding:4px;
          transition:color 0.2s;
        }
        .lg-eye-btn:hover { color:#ffd700; }

        /* ── Button ── */
        .lg-btn {
          width:100%; padding:14px; border:none; border-radius:2px;
          font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700;
          letter-spacing:0.2em; text-transform:uppercase;
          cursor:pointer; transition:all 0.3s; position:relative; overflow:hidden;
          clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);
          margin-top:8px;
        }
        .lg-btn-primary {
          background:linear-gradient(135deg,#7a5200,#b8860b,#ffd700,#b8860b,#7a5200);
          background-size:200% 200%; color:#1a0e00;
          box-shadow:0 0 24px rgba(255,215,0,0.35);
          animation:btnGold 4s ease infinite;
        }
        @keyframes btnGold { 0%{background-position:0%} 100%{background-position:200%} }
        .lg-btn-primary:hover:not(:disabled) {
          box-shadow:0 0 44px rgba(255,215,0,0.65),0 0 80px rgba(180,130,0,0.3);
          transform:translateY(-2px);
        }
        .lg-btn-primary:disabled { opacity:0.35; cursor:not-allowed; transform:none; }
        .lg-btn-primary::after {
          content:''; position:absolute; top:-50%; left:-70%; width:30%; height:200%;
          background:rgba(255,255,255,0.2); transform:skewX(-20deg);
          animation:shimmer 2.5s infinite;
        }
        @keyframes shimmer { 0%{left:-70%} 100%{left:170%} }

        /* Loading spinner inside button */
        .lg-spinner {
          display:inline-block; width:14px; height:14px; border-radius:50%;
          border:2px solid rgba(0,0,0,0.3); border-top-color:#000;
          animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:8px;
        }
        @keyframes spin { to{ transform:rotate(360deg) } }

        /* ── Footer links ── */
        .lg-footer {
          text-align:center; margin-top:22px;
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(255,215,0,0.25); letter-spacing:0.08em;
        }
        .lg-footer a {
          color:rgba(255,215,0,0.6); cursor:pointer;
          text-decoration:none; transition:color 0.2s;
        }
        .lg-footer a:hover { color:#ffd700; text-shadow:0 0 8px #ffd700; }

        /* ── Status badge ── */
        .lg-status {
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-bottom:22px;
        }
        .lg-status-inner {
          display:inline-flex; align-items:center; gap:7px;
          padding:4px 14px; border-radius:2px;
          background:rgba(255,215,0,0.07); border:1px solid rgba(255,215,0,0.2);
          font-family:'Share Tech Mono',monospace; font-size:9px;
          color:rgba(255,215,0,0.6); letter-spacing:0.15em;
          animation:statusPulse 2.5s ease-in-out infinite;
        }
        @keyframes statusPulse { 0%,100%{border-color:rgba(255,215,0,0.2)} 50%{border-color:rgba(255,215,0,0.5)} }
        .lg-status-dot {
          width:6px; height:6px; border-radius:50%; background:#ffd700;
          box-shadow:0 0 6px #ffd700; animation:dotBlink 1.2s infinite;
        }
        @keyframes dotBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── Toast ── */
        .lg-toast {
          position:fixed; bottom:26px; right:26px; z-index:999;
          padding:13px 18px; border-radius:2px; min-width:280px;
          font-family:'Share Tech Mono',monospace; font-size:11px;
          display:flex; align-items:flex-start; gap:10px;
          backdrop-filter:blur(20px); border:1px solid;
          animation:toastIn 0.3s ease;
          clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
          box-shadow:0 8px 40px rgba(0,0,0,0.6); line-height:1.55;
        }
        .lg-toast-success { background:rgba(20,14,0,0.9); border-color:rgba(255,215,0,0.4); color:#ffd700; }
        .lg-toast-error   { background:rgba(60,0,0,0.9);  border-color:rgba(255,60,60,0.4);  color:#ff6666; }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,215,0,0.15); border-radius:1px; }
      `}</style>

      {/* Video intro */}
      {videoRole && <VideoIntro role={videoRole} onSkip={handleSkip} />}

      <div className="lg-root">
        <div className="lg-bg" />
        <div className="lg-grid" />
        <div className="lg-scan" />
        <GoldParticles />

        <div className="lg-card">
          <div className="c c-tl" /><div className="c c-tr" />
          <div className="c c-bl" /><div className="c c-br" />
          <div className="lg-strip" />

          {/* Logo */}
          <div className="lg-logo">
            <div className="lg-logo-icon">⚜</div>
            <div className="lg-logo-title">
              <GlitchText text="LEVEL UP" />
            </div>
            <div className="lg-logo-sub">Secure Authentication Terminal</div>
          </div>

          {/* Status badge */}
          <div className="lg-status">
            <div className="lg-status-inner">
              <div className="lg-status-dot" />
              SYSTEM ONLINE · ENCRYPTED
            </div>
          </div>

          <div className="lg-divider" />

          {/* Email */}
          <div className="lg-field">
            <label className="lg-label">Email Address</label>
            <input
              className="lg-input"
              type="email"
              placeholder="player@lvl.up"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={handleKey}
            />
          </div>

          {/* Password */}
          <div className="lg-field">
            <label className="lg-label">Access Cipher</label>
            <div className="lg-input-wrap">
              <input
                className="lg-input has-icon"
                type={showPw ? "text" : "password"}
                placeholder="Enter your cipher"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKey}
              />
              <button className="lg-eye-btn" type="button" onClick={() => setShowPw(v => !v)}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className="lg-btn lg-btn-primary"
            disabled={!canSubmit || loading}
            onClick={handleLogin}
          >
            {loading && <span className="lg-spinner" />}
            {loading ? "AUTHENTICATING..." : "⚜ AUTHENTICATE"}
          </button>

          <div className="lg-divider" />

          {/* Footer */}
          <div className="lg-footer">
            No account?&nbsp;
            <a onClick={() => router.push("/register")}>Register Terminal</a>
            &nbsp;·&nbsp;
            <a onClick={() => router.push("/register/candidate")}>Candidate</a>
            &nbsp;·&nbsp;
            <a onClick={() => router.push("/register/recruiter")}>Recruiter</a>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`lg-toast lg-toast-${toast.type}`}>
          <span>{toast.type === "success" ? "⚜" : "✕"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}