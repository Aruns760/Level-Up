"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ══ PARTICLE EXPLOSION on click ═══════════════════════════════ */
function explode(canvas, x, y, color) {
  const ctx = canvas.getContext("2d");
  const particles = Array.from({ length: 40 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.8) * 14,
    r: Math.random() * 5 + 2,
    life: 1,
    decay: Math.random() * 0.04 + 0.025,
    color,
  }));
  let id;
  const draw = () => {
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.35;
      p.r *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) return;
      const radius = Math.max(0, p.r * p.life);
      if (radius === 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowBlur = 12; ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    if (particles.some(p => p.life > 0)) {
      id = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(id);
    }
  };
  draw();
}

/* ══ MAIN ══════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const rippleId = useRef(0);
  const [hovered, setHovered] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [ripples, setRipples] = useState([]);

  /* ── resize canvas ── */
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ── click handler: explosion + transition ── */
  const handleSelect = (role, href, color, e) => {
    if (transitioning) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (canvasRef.current) explode(canvasRef.current, cx, cy, color);

    // ripple
    const id = ++rippleId.current;
    setRipples(r => [...r, { id, x: e.clientX, y: e.clientY, color }]);
    setTimeout(() => setRipples(r => r.filter(p => p.id !== id)), 900);

    setSelectedRole(role);
    setTransitioning(true);
    setTimeout(() => router.push(href), 900);
  };

  const ROLES = [
    {
      id: "candidate",
      label: "CANDIDATE",
      sub: "Apply for positions",
      icon: "◈",
      href: "/register/candidate",
      color: "#00e5ff",
      glow: "rgba(0,229,255,0.5)",
      grad: "linear-gradient(135deg,#003344,#006688,#00aacc)",
      hoverGrad: "linear-gradient(135deg,#004455,#0088aa,#00d4f5)",
      border: "rgba(0,229,255,0.4)",
      particle: "#00e5ff",
      scanColor: "rgba(0,229,255,0.6)",
      rank: "LEVEL 01",
    },
    {
      id: "recruiter",
      label: "RECRUITER",
      sub: "Post jobs & hire talent",
      icon: "⬡",
      href: "/register/recruiter",
      color: "#a855f7",
      glow: "rgba(168,85,247,0.5)",
      grad: "linear-gradient(135deg,#1a0533,#4a1570,#7c3aed)",
      hoverGrad: "linear-gradient(135deg,#220040,#5a1888,#9333ea)",
      border: "rgba(168,85,247,0.4)",
      particle: "#c084fc",
      scanColor: "rgba(168,85,247,0.6)",
      rank: "LEVEL 02",
    },
    {
      id: "support",
      label: "SUPPORT",
      sub: "Admin & system control",
      icon: "☠",
      href: "/register/support",
      color: "#ff2222",
      glow: "rgba(255,34,34,0.5)",
      grad: "linear-gradient(135deg,#1a0000,#660000,#cc0000)",
      hoverGrad: "linear-gradient(135deg,#220000,#880000,#ff0000)",
      border: "rgba(255,34,34,0.4)",
      particle: "#ff6666",
      scanColor: "rgba(255,34,34,0.6)",
      rank: "OMEGA",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { overflow: hidden; }

        .rp-root {
          min-height: 100vh; height: 100vh;
          background: #020508;
          font-family: 'Exo 2', sans-serif;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          transition: opacity 0.9s ease, transform 0.9s ease;
        }

        /* ── Deep space background ── */
        .rp-bg {
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 120% 80% at 50% -10%, rgba(0,40,80,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 10% 90%, rgba(20,0,60,0.4) 0%, transparent 55%),
            radial-gradient(ellipse 60% 60% at 90% 80%, rgba(60,0,0,0.35) 0%, transparent 55%),
            #020508;
        }

        /* Animated star field */
        .rp-stars {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 25% 55%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 75%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 85% 60%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 90%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 40%, rgba(255,255,255,0.3) 0%, transparent 100%);
          animation: twinkle 4s ease-in-out infinite alternate;
        }
        @keyframes twinkle {
          0%   { opacity: 0.6; }
          100% { opacity: 1; }
        }

        /* Grid overlay */
        .rp-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridDrift 20s linear infinite;
        }
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }

        /* Scanline overlay */
        .rp-scanlines {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
          );
        }

        /* ── Header ── */
        .rp-header {
          position: relative; z-index: 10;
          text-align: center; margin-bottom: 52px;
          animation: fadeDown 0.8s ease forwards;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rp-header-tag {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px; letter-spacing: 0.4em;
          color: rgba(255,255,255,0.2); margin-bottom: 12px;
          text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .rp-header-tag::before, .rp-header-tag::after {
          content: ''; flex: 1; max-width: 60px; height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .rp-title {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(24px, 5vw, 44px);
          font-weight: 900; letter-spacing: 0.1em;
          color: #fff; line-height: 1;
          text-shadow: 0 0 40px rgba(255,255,255,0.1);
        }
        .rp-title span {
          background: linear-gradient(135deg, #00e5ff, #a855f7, #ff4444);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-size: 200% 200%;
          animation: gradShift 4s ease infinite;
        }
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .rp-subtitle {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px; letter-spacing: 0.25em;
          color: rgba(255,255,255,0.25); margin-top: 10px;
          text-transform: uppercase;
        }

        /* ── Cards row ── */
        .rp-cards {
          display: flex; gap: 24px; position: relative; z-index: 10;
          animation: fadeUp 0.8s ease 0.2s forwards; opacity: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 860px) {
          .rp-cards { flex-direction: column; gap: 16px; }
        }

        /* ── Role card ── */
        .rp-card {
          position: relative;
          width: 220px; height: 300px;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
          transform-style: preserve-3d;
          will-change: transform;
        }
        .rp-card:hover { transform: translateY(-12px) scale(1.04) rotateX(4deg); }
        .rp-card.firing { animation: cardFire 0.25s ease forwards; }
        @keyframes cardFire {
          0%   { transform: scale(1.04); }
          30%  { transform: scale(1.12) translateY(-16px); filter: brightness(2); }
          100% { transform: scale(0) translateY(-40px) rotate(10deg); opacity: 0; filter: brightness(3); }
        }

        /* Card inner */
        .rp-card-inner {
          position: absolute; inset: 0; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
          transition: border-color 0.3s;
        }

        /* Card bg gradient */
        .rp-card-bg {
          position: absolute; inset: 0;
          transition: opacity 0.3s;
        }
        .rp-card-bg-hover {
          position: absolute; inset: 0; opacity: 0;
          transition: opacity 0.3s;
        }
        .rp-card:hover .rp-card-bg { opacity: 0; }
        .rp-card:hover .rp-card-bg-hover { opacity: 1; }

        /* Animated scan line on card */
        .rp-card-scan {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          overflow: hidden;
        }
        .rp-card-scan::after {
          content: ''; position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, var(--scan-color), transparent);
          box-shadow: 0 0 8px var(--scan-color);
          animation: cardScan 2s linear infinite;
        }
        @keyframes cardScan { to { left: 200%; } }

        /* Card corner */
        .rp-card-corner {
          position: absolute; width: 16px; height: 16px;
        }
        .rp-card-corner.tl { top: 0; left: 0; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); }
        .rp-card-corner.br { bottom: 0; right: 0; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); }

        /* Card content */
        .rp-card-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 28px 20px; gap: 0;
        }

        /* Rank chip */
        .rp-rank {
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 2px;
          border: 1px solid var(--accent);
          background: rgba(255,255,255,0.04);
          color: var(--accent); margin-bottom: 18px;
          transition: box-shadow 0.3s;
        }
        .rp-card:hover .rp-rank {
          box-shadow: 0 0 10px var(--accent);
        }

        /* Icon */
        .rp-card-icon {
          font-size: 46px; margin-bottom: 14px;
          filter: drop-shadow(0 0 8px var(--glow));
          transition: transform 0.3s, filter 0.3s;
          line-height: 1;
        }
        .rp-card:hover .rp-card-icon {
          transform: scale(1.15) translateY(-4px);
          filter: drop-shadow(0 0 20px var(--glow)) drop-shadow(0 0 40px var(--glow));
        }

        /* Label */
        .rp-card-label {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px; font-weight: 900;
          letter-spacing: 0.2em; color: #fff;
          margin-bottom: 6px;
          transition: text-shadow 0.3s;
        }
        .rp-card:hover .rp-card-label {
          text-shadow: 0 0 20px var(--glow);
        }

        /* Sub */
        .rp-card-sub {
          font-family: 'Share Tech Mono', monospace; font-size: 10px;
          color: rgba(255,255,255,0.3); letter-spacing: 0.1em;
          text-align: center; margin-bottom: 24px;
          transition: color 0.3s;
        }
        .rp-card:hover .rp-card-sub { color: rgba(255,255,255,0.55); }

        /* CTA button on card */
        .rp-card-btn {
          width: 100%; padding: 10px;
          background: transparent;
          border: 1px solid var(--accent);
          border-radius: 2px; color: var(--accent);
          font-family: 'Orbitron', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          cursor: pointer;
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .rp-card-btn::after {
          content: ''; position: absolute;
          top: -50%; left: -70%; width: 30%; height: 200%;
          background: rgba(255,255,255,0.15); transform: skewX(-20deg);
          animation: btnShimmer 2.5s infinite;
        }
        @keyframes btnShimmer { 0% { left: -70%; } 100% { left: 170%; } }
        .rp-card:hover .rp-card-btn {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow);
        }

        /* Glow orb behind card on hover */
        .rp-card-glow {
          position: absolute; inset: -30px; border-radius: 50%;
          opacity: 0; pointer-events: none;
          transition: opacity 0.4s;
          filter: blur(40px);
        }
        .rp-card:hover .rp-card-glow { opacity: 0.15; }

        /* Floating particles on card hover */
        .rp-card-particles {
          position: absolute; inset: 0; pointer-events: none;
          overflow: hidden; border-radius: 6px;
        }
        .rp-card-particle {
          position: absolute; width: 2px; height: 2px; border-radius: 50%;
          animation: floatUp 2.5s ease-in infinite;
          opacity: 0;
        }
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) translateX(0); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-120px) translateX(var(--dx)); }
        }

        /* ── Transition overlay ── */
        .rp-transition {
          position: fixed; inset: 0; z-index: 100;
          pointer-events: none; opacity: 0;
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .rp-transition.active {
          opacity: 1; pointer-events: all;
        }
        .rp-transition-inner {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .rp-transition-msg {
          font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900;
          letter-spacing: 0.3em; text-transform: uppercase;
          animation: msgPulse 0.5s ease-in-out infinite alternate;
        }
        @keyframes msgPulse {
          from { opacity: 0.6; transform: scale(0.98); }
          to   { opacity: 1;   transform: scale(1.02); }
        }

        /* Page exit */
        .rp-root.exiting {
          opacity: 0;
          transform: scale(1.06);
          transition: opacity 0.75s ease, transform 0.75s ease;
        }

        /* ── Ripple ── */
        .rp-ripple {
          position: fixed; z-index: 50; pointer-events: none;
          border-radius: 50%; width: 8px; height: 8px;
          transform: translate(-50%, -50%);
          animation: rippleOut 0.85s ease-out forwards;
        }
        @keyframes rippleOut {
          0%   { width: 8px; height: 8px; opacity: 0.9; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }

        /* ── Login link ── */
        .rp-login {
          position: relative; z-index: 10; margin-top: 36px;
          font-family: 'Share Tech Mono', monospace; font-size: 11px;
          color: rgba(255,255,255,0.22); letter-spacing: 0.1em;
          animation: fadeUp 0.8s ease 0.4s forwards; opacity: 0;
        }
        .rp-login a {
          color: rgba(255,255,255,0.5); cursor: pointer;
          text-decoration: none; transition: color 0.2s;
        }
        .rp-login a:hover { color: #fff; }

        /* ── Number counter bottom ── */
        .rp-counter {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          z-index: 10; display: flex; gap: 8px; align-items: center;
          font-family: 'Share Tech Mono', monospace; font-size: 9px;
          color: rgba(255,255,255,0.15); letter-spacing: 0.2em;
        }
        .rp-counter-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          transition: background 0.3s, box-shadow 0.3s;
        }
        .rp-counter-dot.active {
          background: #fff;
          box-shadow: 0 0 6px #fff;
        }

        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Ripples */}
      {ripples.map(r => (
        <div key={r.id} className="rp-ripple"
          style={{
            left: r.x, top: r.y,
            background: r.color,
            boxShadow: `0 0 20px ${r.color}`,
          }} />
      ))}

      {/* Transition overlay */}
      {transitioning && selectedRole && (() => {
        const role = ROLES.find(r => r.id === selectedRole);
        if (!role) return null;
        return (
          <div className="rp-transition active"
            style={{ background: `radial-gradient(ellipse at center, ${role.color}22 0%, #020508 60%), #020508` }}>
            <div className="rp-transition-inner">
              <div className="rp-transition-msg" style={{ color: role.color, textShadow: `0 0 30px ${role.color}` }}>
                LOADING {role.label}...
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`rp-root${transitioning ? " exiting" : ""}`}>
        <div className="rp-bg" />
        <div className="rp-stars" />
        <div className="rp-grid" />
        <div className="rp-scanlines" />

        {/* Explosion canvas */}
        <canvas ref={canvasRef} style={{
          position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none",
          width: "100%", height: "100%",
        }} />

        {/* Header */}
        <div className="rp-header">
          <div className="rp-header-tag">LEVEL UP · BOOT SEQUENCE</div>
          <div className="rp-title">
            SELECT YOUR <span>CLASS</span>
          </div>
          <div className="rp-subtitle">Choose your role to begin the uplink</div>
        </div>

        {/* Cards */}
        <div className="rp-cards">
          {ROLES.map((role, idx) => (
            <div
              key={role.id}
              className={`rp-card${selectedRole === role.id ? " firing" : ""}`}
              style={{
                "--accent": role.color,
                "--glow": role.glow,
                "--scan-color": role.scanColor,
                animationDelay: `${idx * 0.1}s`,
              }}
              onClick={e => handleSelect(role.id, role.href, role.particle, e)}
              onMouseEnter={() => setHovered(role.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Glow orb */}
              <div className="rp-card-glow" style={{ background: role.color }} />

              {/* Inner */}
              <div className="rp-card-inner"
                style={{ borderColor: hovered === role.id ? role.border : "rgba(255,255,255,0.06)" }}>
                <div className="rp-card-bg" style={{ background: role.grad }} />
                <div className="rp-card-bg-hover" style={{ background: role.hoverGrad }} />

                {/* Scan line */}
                <div className="rp-card-scan" style={{ "--scan-color": role.scanColor }} />

                {/* Corner accents */}
                <div className="rp-card-corner tl" style={{ "--accent": role.color }} />
                <div className="rp-card-corner br" style={{ "--accent": role.color }} />

                {/* Floating particles */}
                <div className="rp-card-particles">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="rp-card-particle"
                      style={{
                        background: role.color,
                        boxShadow: `0 0 4px ${role.color}`,
                        left: `${15 + i * 14}%`,
                        bottom: "10%",
                        animationDelay: `${i * 0.4}s`,
                        "--dx": `${(Math.random() - 0.5) * 40}px`,
                        opacity: hovered === role.id ? 1 : 0,
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="rp-card-content">
                  <div className="rp-rank" style={{ "--accent": role.color }}>{role.rank}</div>
                  <div className="rp-card-icon" style={{ "--glow": role.glow }}>{role.icon}</div>
                  <div className="rp-card-label">{role.label}</div>
                  <div className="rp-card-sub">{role.sub}</div>
                  <button className="rp-card-btn" style={{ "--accent": role.color, "--glow": role.glow }}>
                    Initialize →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Login link */}
        <div className="rp-login">
          Already registered? &nbsp;
          <a onClick={() => {
            setTransitioning(true);
            setTimeout(() => router.push("/login"), 700);
          }}>
            Access Terminal →
          </a>
        </div>

        {/* Bottom dots */}
        <div className="rp-counter">
          {ROLES.map(r => (
            <div key={r.id} className={`rp-counter-dot${hovered === r.id ? " active" : ""}`}
              style={hovered === r.id ? { background: r.color, boxShadow: `0 0 6px ${r.color}` } : {}} />
          ))}
        </div>
      </div>
    </>
  );
}