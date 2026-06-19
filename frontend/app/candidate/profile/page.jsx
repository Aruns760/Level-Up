"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

/* ─── Hexagon SVG bg ─────────────────────────────────────────── */
function HexGrid({ color }) {
  return (
    <svg className="hex-grid" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
          <polygon points="28,2 54,16 54,44 28,58 2,44 2,16" fill="none" stroke={color} strokeWidth="0.6" />
          <polygon points="28,52 54,66 54,94 28,108 2,94 2,66" fill="none" stroke={color} strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

/* ─── Particle canvas ────────────────────────────────────────── */
function Particles({ color }) {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight;
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * cvs.width, y: Math.random() * cvs.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.2,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${p.o})`; // Defaulting to cyan opacity
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cvs.width) p.vx *= -1;
        if (p.y < 0 || p.y > cvs.height) p.vy *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [color]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ─── Radial gauge ───────────────────────────────────────────── */
function Gauge({ pct, color, size = 64, thick = 5 }) {
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thick} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thick} strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PROFILE
═══════════════════════════════════════════════════════════════ */
export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Start with loading true to avoid hydration mismatch
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState("cyan");

  /* ── Themes ── */
  const THEMES = {
    cyan:   { name: "NEXUS",    primary: "#00e5ff", secondary: "#0072ff", bg: "#020b18", card: "rgba(0,229,255,0.04)",   glow: "rgba(0,229,255,0.35)",  muted: "rgba(0,229,255,0.12)" },
    violet: { name: "PHANTOM",  primary: "#b347ff", secondary: "#6600ff", bg: "#0d0415", card: "rgba(179,71,255,0.04)",  glow: "rgba(179,71,255,0.35)", muted: "rgba(179,71,255,0.12)" },
    amber:  { name: "INFERNO",  primary: "#ffaa00", secondary: "#ff4400", bg: "#140a00", card: "rgba(255,170,0,0.04)",   glow: "rgba(255,170,0,0.35)",  muted: "rgba(255,170,0,0.12)" },
    emerald:{ name: "MATRIX",   primary: "#00ff87", secondary: "#00c2a8", bg: "#011209", card: "rgba(0,255,135,0.04)",   glow: "rgba(0,255,135,0.35)",  muted: "rgba(0,255,135,0.12)" },
  };
  const T = THEMES[activeTheme];

  /* ── Fetch ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/candidate/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.log("Profile error:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ── Calculate Completion ── */
  const calculateCompletion = (usr) => {
    let total = 5;
    let filled = 0;
    if (usr?.name) filled++;
    if (usr?.email) filled++;
    if (usr?.image) filled++;
    if (usr?.profile?.skills?.length) filled++;
    if (usr?.profile?.education) filled++;
    return Math.round((filled / total) * 100);
  };

  /* ── Loading State ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#020b18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 56, height: 56, border: "3px solid rgba(0,229,255,0.15)", borderTop: "3px solid #00e5ff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ fontFamily: "'Share Tech Mono', monospace", color: "#00e5ff", letterSpacing: "0.3em", fontSize: 13 }}>GATHERING INTEL...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const completion = calculateCompletion(user);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .profile-root {
          min-height: 100vh;
          background: ${T.bg};
          font-family: 'Exo 2', sans-serif;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          transition: background 0.6s ease;
          position: relative;
        }

        .hex-grid {
          position: fixed; inset: 0;
          width: 100%; height: 100%;
          pointer-events: none; z-index: 0;
          opacity: 0.4;
        }

        /* ── Topbar ── */
        .topbar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .topbar-brand {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px; font-weight: 900; letter-spacing: 0.25em;
          background: linear-gradient(135deg, ${T.primary}, ${T.secondary});
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .theme-switcher { display: flex; gap: 8px; align-items: center; }
        .theme-dot {
          width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
          border: 2px solid transparent; transition: all 0.2s;
        }
        .theme-dot:hover { transform: scale(1.25); }
        .theme-dot.active { border-color: #fff; box-shadow: 0 0 10px currentColor; }

        /* ── Content Wrapper ── */
        .content {
          position: relative; z-index: 5;
          flex: 1; display: flex; flex-direction: column;
          align-items: center; padding: 40px 20px;
        }

        /* ── 3D Profile Card Layout ── */
        .profile-container {
          width: 100%; max-width: 900px;
          display: flex; flex-direction: column; gap: 24px;
          perspective: 1200px; /* enables 3d space for children */
        }

        .card-3d {
          background: ${T.card}; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 32px;
          backdrop-filter: blur(12px); position: relative;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .card-3d:hover {
          border-color: ${T.primary};
          transform: translateY(-4px) rotateX(2deg) rotateY(-2deg);
          box-shadow: -10px 20px 40px rgba(0,0,0,0.6), inset 0 0 20px ${T.muted};
        }
        .card-3d::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, ${T.primary}, transparent);
          animation: scanline 4s infinite linear; opacity: 0.5;
        }
        @keyframes scanline { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

        /* ── Hero Avatar Section ── */
        .hero-section {
          display: flex; align-items: center; gap: 40px;
          transform: translateZ(30px); /* Pops out in 3D */
        }
        @media (max-width: 768px) {
          .hero-section { flex-direction: column; text-align: center; }
        }

        .avatar-wrapper {
          position: relative; width: 160px; height: 160px;
          flex-shrink: 0; transform-style: preserve-3d;
        }
        .avatar-ring {
          position: absolute; inset: -10px; border-radius: 50%;
          border: 2px dashed ${T.primary}; opacity: 0.6;
          animation: spinRing 12s linear infinite;
          transform: translateZ(-10px);
        }
        .avatar-ring-2 {
          position: absolute; inset: -20px; border-radius: 50%;
          border: 1px solid ${T.secondary}; opacity: 0.3;
          animation: spinRing 20s linear infinite reverse;
          transform: translateZ(-20px);
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }
        
        .avatar-img {
          width: 100%; height: 100%; border-radius: 50%;
          object-fit: cover; border: 3px solid ${T.primary};
          box-shadow: 0 0 30px ${T.glow};
          transform: translateZ(20px); /* Avatar floats higher */
          background: #000;
        }
        .avatar-level-badge {
          position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%) translateZ(40px);
          background: ${T.bg}; border: 1px solid ${T.primary}; color: ${T.primary};
          padding: 4px 16px; border-radius: 20px; font-family: 'Orbitron', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5); white-space: nowrap;
        }

        .hero-info { flex: 1; transform: translateZ(20px); }
        .hero-title {
          font-family: 'Orbitron', sans-serif; font-size: 32px; font-weight: 800;
          color: #fff; margin-bottom: 4px; text-shadow: 0 0 10px ${T.glow};
        }
        .hero-subtitle {
          font-family: 'Share Tech Mono', monospace; font-size: 14px;
          color: rgba(255,255,255,0.5); margin-bottom: 16px;
        }
        
        /* ── Chips & Stats ── */
        .status-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .chip {
          font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 0.1em;
          padding: 6px 14px; border-radius: 20px; border: 1px solid; text-transform: uppercase;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .chip-primary { color: ${T.primary}; border-color: ${T.primary}; background: ${T.muted}; box-shadow: 0 0 10px ${T.glow}; }
        .chip-secondary { color: #fff; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }

        /* ── Completion Gauge Section ── */
        .completion-box {
          display: flex; align-items: center; gap: 20px;
          background: rgba(0,0,0,0.4); padding: 16px 20px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .comp-text-title { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
        .comp-text-sub { font-family: 'Share Tech Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 4px; }

        /* ── Two Column Details ── */
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; transform: translateZ(15px); }
        @media (max-width: 768px) { .details-grid { grid-template-columns: 1fr; } }
        
        .section-title {
          font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.15em;
          color: ${T.primary}; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
        }
        .section-title::before { content: '◈'; font-size: 16px; }
        
        .detail-text { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6; }

        /* ── Skills Matrix ── */
        .skills-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag {
          font-family: 'Exo 2', sans-serif; font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 6px;
          background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          transition: all 0.3s;
        }
        .skill-tag:hover { border-color: ${T.primary}; color: ${T.primary}; transform: translateY(-2px); box-shadow: 0 5px 15px ${T.glow}; }

        /* ── Buttons ── */
        .actions { margin-top: 10px; display: flex; gap: 16px; transform: translateZ(25px); }
        .btn {
          font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 8px; border: 1px solid;
          cursor: pointer; transition: all 0.3s; white-space: nowrap; flex: 1; text-align: center;
          clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
        }
        .btn-primary { background: ${T.primary}; border-color: ${T.primary}; color: #000; box-shadow: 0 0 20px ${T.glow}; }
        .btn-primary:hover { box-shadow: 0 0 35px ${T.glow}; transform: scale(1.02); }
        .btn-outline { background: transparent; border-color: rgba(255,255,255,0.2); color: #fff; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: ${T.primary}; color: ${T.primary}; }

        /* ── Corner Accents ── */
        .corner-tl { position: absolute; top: 0; left: 0; width: 30px; height: 30px; border-top: 2px solid ${T.primary}; border-left: 2px solid ${T.primary}; border-radius: 16px 0 0 0; opacity: 0.5; }
        .corner-br { position: absolute; bottom: 0; right: 0; width: 30px; height: 30px; border-bottom: 2px solid ${T.primary}; border-right: 2px solid ${T.primary}; border-radius: 0 0 16px 0; opacity: 0.5; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px) translateZ(0); } to { opacity: 1; transform: translateY(0) translateZ(0); } }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="profile-root">
        <HexGrid color={T.primary} />
        <Particles color={T.primary} />

        {/* ── TOPBAR ── */}
        <div className="topbar">
          <div className="topbar-brand">LEVEL UP <span style={{color: '#fff', fontSize: '12px', fontWeight: 400, opacity: 0.5}}>IDENTITY</span></div>
          <div className="theme-switcher">
            {Object.entries(THEMES).map(([key, th]) => (
              <div key={key} className={`theme-dot${activeTheme === key ? " active" : ""}`}
                style={{ background: th.primary, color: th.primary, boxShadow: activeTheme === key ? `0 0 12px ${th.primary}` : "none" }}
                onClick={() => setActiveTheme(key)} title={th.name} />
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="content">
          {user && (
            <div className="profile-container">
              
              {/* HERO CARD */}
              <div className="card-3d fade-up">
                <div className="corner-tl" />
                <div className="corner-br" />
                
                <div className="hero-section">
                  <div className="avatar-wrapper">
                    <div className="avatar-ring" />
                    <div className="avatar-ring-2" />
                    <img 
                      src={user.image ? `http://localhost:3000${user.image}` : "https://via.placeholder.com/300"} 
                      alt="Avatar" 
                      className="avatar-img" 
                    />
                    <div className="avatar-level-badge">{user.level || "Beginner"}</div>
                  </div>
                  
                  <div className="hero-info">
                    <div className="hero-title">{user.name}</div>
                    <div className="hero-subtitle">{user.email}</div>
                    
                    <div className="status-bar">
                      <div className="chip chip-primary">
                        <span>⚡</span> XP: {user.xp || 0}
                      </div>
                      <div className="chip chip-secondary">
                        <span>🛡</span> ID: {user._id ? user._id.slice(-6).toUpperCase() : "UNKNOWN"}
                      </div>
                      <div className="chip chip-secondary" style={{borderColor: '#4ade80', color: '#4ade80', background: 'rgba(74,222,128,0.05)'}}>
                        <span>●</span> ONLINE
                      </div>
                    </div>

                    <div className="completion-box">
                      <Gauge pct={completion} color={T.primary} size={50} thick={4} />
                      <div>
                        <div className="comp-text-title">Profile Integrity: {completion}%</div>
                        <div className="comp-text-sub">System recommends 100% for maximum yield</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="details-grid">
                
                {/* Left Column */}
                <div className="card-3d fade-up" style={{ animationDelay: '0.1s' }}>
                  <div className="section-title">Combat Skills</div>
                  <div className="skills-container">
                    {user.profile?.skills?.length ? (
                      user.profile.skills.map((skill, i) => (
                        <div key={i} className="skill-tag">{skill}</div>
                      ))
                    ) : (
                      <span className="detail-text" style={{ fontStyle: 'italic', opacity: 0.5 }}>No skills documented in databanks.</span>
                    )}
                  </div>

                  <div className="section-title" style={{ marginTop: '32px' }}>Education</div>
                  <div className="detail-text">
                    {user.profile?.education || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Academic records classified.</span>}
                  </div>
                </div>

                {/* Right Column */}
                <div className="card-3d fade-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column' }}>
                  <div className="section-title">Field Experience</div>
                  <div className="detail-text" style={{ flex: 1 }}>
                    {user.profile?.experience || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No previous deployments recorded.</span>}
                  </div>
                  
                  <div className="actions">
                    <button className="btn btn-outline" onClick={() => router.push("/candidate/dashboard")}>
                      ◂ Dashboard
                    </button>
                    <button className="btn btn-primary" onClick={() => router.push("/candidate/profile/edit")}>
                      Edit Profile ◈
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}