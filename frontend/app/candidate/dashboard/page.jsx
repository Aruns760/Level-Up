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
          <polygon points="28,2 54,16 54,44 28,58 2,44 2,16"
            fill="none" stroke={color} strokeWidth="0.6" />
          <polygon points="28,52 54,66 54,94 28,108 2,94 2,66"
            fill="none" stroke={color} strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

/* ─── Animated counter ───────────────────────────────────────── */
function Counter({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

/* ─── Mini sparkline ─────────────────────────────────────────── */
function Spark({ data, color }) {
  const W = 80, H = 28;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / rng) * (H - 4) - 2}`
  ).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Radial gauge ───────────────────────────────────────────── */
function Gauge({ pct, color, size = 64, thick = 5 }) {
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thick} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={thick}
        strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 1.2s ease" }} />
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
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * cvs.width, y: Math.random() * cvs.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.4 + 0.1,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(")", `,${p.o})`).replace("rgb(", "rgba(").replace("#", "rgba(").replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/, (_, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`);
        // simpler approach
        ctx.fillStyle = `rgba(99,202,255,${p.o})`;
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

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTheme, setActiveTheme] = useState("cyan");
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);

  // Initialize loading to true so server and client always match on first render
  const [loading, setLoading] = useState(true);

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
    // Safely access token inside the effect
    const token = localStorage.getItem("token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [profileRes, jobsRes, appliedRes] = await Promise.all([
          axios.get("http://localhost:3000/api/candidate/profile", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:3000/api/jobs"),
          axios.get("http://localhost:3000/api/jobs/applied-ids", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUser(profileRes.data);
        setJobs(jobsRes.data);
        setAppliedJobs(appliedRes.data);
        try { const r = await axios.get("http://localhost:3000/api/tests/my-tests", { headers: { Authorization: `Bearer ${token}` } }); setTests(r.data); } catch {}
        try { const r = await axios.get("http://localhost:3000/api/tests/my-results", { headers: { Authorization: `Bearer ${token}` } }); setResults(r.data); } catch {}
      } catch (e) { 
        console.error(e); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, []);

  /* ── Helpers ── */
  const getResult = (tid) => results.find(r => r.testId === tid);
  const isLocked = (i) => i !== 0 && !getResult(tests[i - 1]?.id);

  const levelStats = useCallback((xp = 0) => {
    let lvl = 1, next = 100, prev = 0;
    if (xp >= 100 && xp < 500) { lvl = 2; next = 500; prev = 100; }
    else if (xp >= 500 && xp < 1000) { lvl = 3; next = 1000; prev = 500; }
    else if (xp >= 1000) { lvl = Math.floor(xp / 1000) + 3; next = (lvl - 2) * 1000; prev = (lvl - 3) * 1000; }
    return { lvl, next, prev, pct: Math.min(100, Math.max(0, ((xp - prev) / (next - prev)) * 100)) };
  }, []);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3200);
  };

  const applyJob = async (jobId) => {
    try {
      // Re-fetch token here so this function always has the correct scope
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:3000/api/jobs/apply/${jobId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setAppliedJobs(p => [...p, jobId]);
      notify("Mission accepted — application sent!");
    } catch (e) { 
      notify(e.response?.data?.message || "Connection intercepted.", "error"); 
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#020b18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 56, height: 56, border: "3px solid rgba(0,229,255,0.15)", borderTop: "3px solid #00e5ff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ fontFamily: "'Share Tech Mono', monospace", color: "#00e5ff", letterSpacing: "0.3em", fontSize: 13 }}>INITIALIZING SYSTEM...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const stats = user ? levelStats(user.xp || 0) : null;
  const MOCK_SPARK = [30, 45, 28, 60, 52, 70, 48, 65, 80, 74, 90, 85];
  const NAV = [
    { id: "overview", icon: "⬡", label: "Overview" },
    { id: "missions", icon: "⚔", label: "Missions" },
    { id: "bounties", icon: "◎", label: "Bounties" },
    { id: "analytics", icon: "▲", label: "Analytics" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          min-height: 100vh;
          background: ${T.bg};
          font-family: 'Exo 2', sans-serif;
          color: #e2e8f0;
          display: flex;
          overflow: hidden;
          transition: background 0.6s ease;
          position: relative;
        }

        .hex-grid {
          position: fixed; inset: 0;
          width: 100%; height: 100%;
          pointer-events: none; z-index: 0;
          opacity: 0.4;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: ${sidebarOpen ? "220px" : "64px"};
          min-height: 100vh;
          background: rgba(0,0,0,0.7);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          transition: width 0.3s ease;
          position: relative; z-index: 30; flex-shrink: 0;
          backdrop-filter: blur(20px);
        }
        .sidebar::after {
          content: '';
          position: absolute; top: 0; right: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, ${T.primary}, transparent);
          opacity: 0.4;
        }
        .sb-logo {
          padding: 20px 16px 16px;
          font-family: 'Orbitron', sans-serif;
          font-size: ${sidebarOpen ? "16px" : "0px"};
          font-weight: 900; letter-spacing: 0.15em;
          background: linear-gradient(135deg, ${T.primary}, ${T.secondary});
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          white-space: nowrap; overflow: hidden;
          transition: font-size 0.3s;
        }
        .sb-icon-logo {
          font-size: 20px; text-align: center; padding: ${sidebarOpen ? "0" : "20px 0 16px"};
          display: ${sidebarOpen ? "none" : "block"};
          color: ${T.primary};
          filter: drop-shadow(0 0 6px ${T.primary});
        }
        .sb-toggle {
          position: absolute; top: 18px; right: -12px;
          width: 24px; height: 24px; border-radius: 50%;
          background: ${T.bg}; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); font-size: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 40;
          transition: border-color 0.2s, color 0.2s;
        }
        .sb-toggle:hover { border-color: ${T.primary}; color: ${T.primary}; }
        .sb-section {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px; letter-spacing: 0.2em; color: rgba(255,255,255,0.2);
          padding: ${sidebarOpen ? "16px 16px 6px" : "16px 0 6px"}; text-align: ${sidebarOpen ? "left" : "center"};
          text-transform: uppercase; white-space: nowrap; overflow: hidden;
        }
        .sb-item {
          display: flex; align-items: center;
          gap: ${sidebarOpen ? "10px" : "0px"};
          justify-content: ${sidebarOpen ? "flex-start" : "center"};
          padding: ${sidebarOpen ? "10px 16px" : "10px 0"};
          cursor: pointer; transition: all 0.2s;
          color: rgba(255,255,255,0.4);
          font-size: 13px; font-weight: 500;
          border-left: 2px solid transparent;
          position: relative;
        }
        .sb-item:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.03); }
        .sb-item.active {
          color: ${T.primary}; border-left-color: ${T.primary};
          background: ${T.muted};
        }
        .sb-item.active .sb-icon { filter: drop-shadow(0 0 4px ${T.primary}); }
        .sb-icon { font-size: 16px; flex-shrink: 0; }
        .sb-label { white-space: nowrap; overflow: hidden; font-size: ${sidebarOpen ? "13px" : "0px"}; transition: font-size 0.3s; }
        .sb-badge {
          margin-left: auto; background: ${T.muted}; border: 1px solid ${T.primary};
          border-radius: 20px; padding: 1px 7px; font-size: 9px;
          color: ${T.primary}; font-family: 'Share Tech Mono', monospace;
          display: ${sidebarOpen ? "block" : "none"};
        }
        .sb-footer {
          margin-top: auto; padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        /* ── Main ── */
        .main { flex: 1; overflow-y: auto; position: relative; z-index: 5; }
        .main::-webkit-scrollbar { width: 3px; }
        .main::-webkit-scrollbar-thumb { background: ${T.muted}; border-radius: 99px; }

        /* ── Topbar ── */
        .topbar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; gap: 12px;
          padding: 12px 24px;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .topbar-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 0.25em;
          color: rgba(255,255,255,0.4); text-transform: uppercase;
        }
        .topbar-search {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 7px 14px; color: #fff;
          font-size: 12px; font-family: 'Exo 2', sans-serif; outline: none;
          max-width: 240px; flex: 1;
          transition: border-color 0.2s;
        }
        .topbar-search:focus { border-color: ${T.primary}; }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .topbar-avatar {
          width: 34px; height: 34px; border-radius: 8px;
          background: linear-gradient(135deg, ${T.primary}, ${T.secondary});
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 900; color: #000;
          cursor: pointer; box-shadow: 0 0 12px ${T.glow};
        }
        .topbar-meta { text-align: right; }
        .topbar-name { font-size: 13px; font-weight: 600; color: #fff; }
        .topbar-xp { font-size: 10px; font-family: 'Share Tech Mono', monospace; color: ${T.primary}; }

        /* ── Theme switcher ── */
        .theme-switcher { display: flex; gap: 6px; align-items: center; }
        .theme-dot {
          width: 14px; height: 14px; border-radius: 50%; cursor: pointer;
          border: 2px solid transparent; transition: all 0.2s;
        }
        .theme-dot:hover { transform: scale(1.25); }
        .theme-dot.active { border-color: #fff; box-shadow: 0 0 8px currentColor; }

        /* ── Section content ── */
        .content { padding: 24px; }

        /* ── Cards ── */
        .card {
          background: ${T.card}; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px;
          backdrop-filter: blur(10px); position: relative; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          border-color: rgba(255,255,255,0.14); transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, ${T.primary}, transparent);
          animation: scanline 3s infinite linear;
        }
        @keyframes scanline { 0% { opacity: 0.2 } 50% { opacity: 0.8 } 100% { opacity: 0.2 } }

        .card-accent {
          position: absolute; top: 0; right: 0;
          width: 80px; height: 80px;
          border-radius: 0 14px 0 80px;
          opacity: 0.07;
        }

        /* ── Stat grid ── */
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .stat-label { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
        .stat-val { font-family: 'Orbitron', sans-serif; font-size: 26px; font-weight: 700; color: #fff; line-height: 1; }
        .stat-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; display: flex; align-items: center; gap: 6px; }
        .stat-up { color: #4ade80; }
        .stat-down { color: #f87171; }

        /* ── XP/Level bar ── */
        .xp-bar-track { height: 8px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; margin-top: 6px; }
        .xp-bar-fill { height: 100%; border-radius: 99px; position: relative; transition: width 1.2s ease; }
        .xp-bar-fill::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 16px; background: rgba(255,255,255,0.5); filter: blur(4px); border-radius: 99px; }

        /* ── Section header ── */
        .sec-head {
          display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
        }
        .sec-icon {
          width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
          border: 1px solid; position: relative;
        }
        .sec-title { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #fff; }
        .sec-count { font-family: 'Share Tech Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); margin-left: auto; }

        /* ── Mission / Job items ── */
        .item-card {
          background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 16px 18px; margin-bottom: 10px;
          display: flex; align-items: center; gap: 14px;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .item-card:hover { border-color: rgba(255,255,255,0.12); background: rgba(0,0,0,0.7); }
        .item-card.locked { opacity: 0.45; pointer-events: none; }
        .item-index {
          font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.2); width: 24px; flex-shrink: 0; text-align: center;
        }
        .item-body { flex: 1; min-width: 0; }
        .item-title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-meta { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 10px; }
        .item-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

        /* ── Status chips ── */
        .chip { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 20px; border: 1px solid; text-transform: uppercase; display: inline-flex; align-items: center; gap: 5px; }
        .chip-green { color: #4ade80; border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.08); }
        .chip-blue { border-color: ${T.primary}; background: ${T.muted}; }
        .chip-red { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.08); }
        .chip-gray { color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }

        /* ── CTA buttons ── */
        .btn {
          font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 9px 18px; border-radius: 8px; border: 1px solid;
          cursor: pointer; transition: all 0.25s; white-space: nowrap; flex-shrink: 0;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
        }
        .btn-primary { background: ${T.primary}; border-color: ${T.primary}; color: #000; box-shadow: 0 0 16px ${T.glow}; }
        .btn-primary:hover { box-shadow: 0 0 28px ${T.glow}; transform: translateY(-1px); }
        .btn-outline { background: transparent; border-color: ${T.primary}; color: ${T.primary}; }
        .btn-outline:hover { background: ${T.muted}; }
        .btn-ghost { background: transparent; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); cursor: not-allowed; }

        /* ── Two-column layout ── */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

        /* ── Hero profile card ── */
        .hero-card {
          background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; padding: 28px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 28px;
          position: relative; overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .hero-glow {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, ${T.glow} 0%, transparent 70%);
          right: -80px; top: -80px; pointer-events: none; opacity: 0.4;
        }
        .hero-avatar {
          width: 72px; height: 72px; border-radius: 16px; flex-shrink: 0;
          background: linear-gradient(135deg, ${T.primary}22, ${T.secondary}44);
          border: 2px solid ${T.primary};
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif; font-size: 26px; font-weight: 900;
          color: ${T.primary}; box-shadow: 0 0 24px ${T.glow}, inset 0 0 20px ${T.muted};
          position: relative;
        }
        .hero-level-ring {
          position: absolute; inset: -6px; border-radius: 22px;
          border: 2px solid transparent;
          background: linear-gradient(135deg, ${T.primary}, ${T.secondary}) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out; mask-composite: exclude;
          animation: spinRing 6s linear infinite;
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        /* ── Analytics area ── */
        .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 900px) { .analytics-grid { grid-template-columns: 1fr; } }
        .ring-stat { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .ring-label { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.15em; text-transform: uppercase; text-align: center; }
        .ring-val { font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 700; color: #fff; }

        /* ── Notification toast ── */
        .toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 999;
          padding: 14px 20px; border-radius: 12px; min-width: 260px;
          font-family: 'Share Tech Mono', monospace; font-size: 12px;
          display: flex; align-items: center; gap: 10px;
          backdrop-filter: blur(20px); border: 1px solid;
          animation: toastIn 0.3s ease;
        }
        .toast-success { background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.3); color: #4ade80; }
        .toast-error { background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.3); color: #f87171; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Progress bar ── */
        .prog-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .prog-label { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); width: 80px; flex-shrink: 0; }
        .prog-track { flex: 1; height: 5px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; }
        .prog-fill { height: 100%; border-radius: 99px; position: relative; }
        .prog-val { font-family: 'Orbitron', monospace; font-size: 10px; color: rgba(255,255,255,0.4); width: 36px; text-align: right; }

        /* ── Activity feed ── */
        .feed-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .feed-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .feed-text { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; }
        .feed-time { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.25); margin-top: 2px; }

        /* ── Corner accent ── */
        .corner-tl { position: absolute; top: 0; left: 0; width: 20px; height: 20px; border-top: 2px solid; border-left: 2px solid; border-radius: 2px 0 0 0; }
        .corner-br { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; border-bottom: 2px solid; border-right: 2px solid; border-radius: 0 0 2px 0; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.1s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.2s; }
      `}</style>

      <div className="db-root">
        <HexGrid color={T.primary} />
        <Particles color={T.primary} />

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sb-icon-logo">⬡</div>
          <div className="sb-logo">LEVEL UP</div>
          <div className="sb-toggle" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? "◂" : "▸"}
          </div>

          <div className="sb-section">{sidebarOpen ? "Navigation" : "·"}</div>
          {NAV.map(n => (
            <div key={n.id} className={`sb-item${activeSection === n.id ? " active" : ""}`}
              onClick={() => setActiveSection(n.id)}>
              <span className="sb-icon">{n.icon}</span>
              <span className="sb-label">{n.label}</span>
              {n.id === "bounties" && jobs.length > 0 && <span className="sb-badge">{jobs.length}</span>}
              {n.id === "missions" && tests.length > 0 && <span className="sb-badge">{tests.length}</span>}
            </div>
          ))}

          <div className="sb-section">{sidebarOpen ? "Account" : "·"}</div>
          <div className="sb-item" onClick={() => router.push("/candidate/profile")}>
            <span className="sb-icon">◈</span>
            <span className="sb-label">Profile</span>
          </div>
          <div className="sb-item">
            <span className="sb-icon">◉</span>
            <span className="sb-label">Settings</span>
          </div>

          {sidebarOpen && (
            <div className="sb-footer">
              <div style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 8 }}>SYSTEM STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "'Share Tech Mono', monospace" }}>Online</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-title">
              {NAV.find(n => n.id === activeSection)?.label || "Dashboard"}
            </div>
            <input className="topbar-search" placeholder="⌕  Search..." />
            <div className="topbar-right">
              {/* Theme switcher */}
              <div className="theme-switcher">
                {Object.entries(THEMES).map(([key, th]) => (
                  <div key={key} className={`theme-dot${activeTheme === key ? " active" : ""}`}
                    style={{ background: th.primary, color: th.primary, boxShadow: activeTheme === key ? `0 0 8px ${th.primary}` : "none" }}
                    onClick={() => setActiveTheme(key)} title={th.name} />
                ))}
              </div>
              {user && (
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onClick={() => router.push("/candidate/profile")}>
                  <div className="topbar-meta">
                    <div className="topbar-name">{user.name}</div>
                    <div className="topbar-xp">⚡ {(user.xp || 0).toLocaleString()} XP</div>
                  </div>
                <div className="topbar-avatar" style={{ overflow: "hidden" }}>
                  {user.image ? (
                    <img 
                      src={`http://localhost:3000${user.image}`} 
                      alt="avatar" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>       
                 </div>
              )}
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="content">

            {/* ══ OVERVIEW ══════════════════════════════════════════ */}
            {activeSection === "overview" && (
              <div>
                {/* Hero profile strip */}
                {user && stats && (
                  <div className="hero-card fade-up">
                    <div className="hero-glow" />
                    <div className="hero-avatar">
                  {user.image ? (
                    <img 
                      src={`http://localhost:3000${user.image}`} 
                      alt="avatar" 
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} 
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                  <div className="hero-level-ring" />
                </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{user.name}</span>
                        <span className="chip chip-green"><span>●</span> Online</span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: T.primary, marginLeft: "auto" }}>
                          LVL {stats.lvl} &nbsp;·&nbsp; {user.level || "Pro"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{user.email}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>XP PROGRESS</span>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: T.primary, marginLeft: "auto" }}>
                          {user.xp || 0} / {stats.next}
                        </span>
                      </div>
                      <div className="xp-bar-track">
                        <div className="xp-bar-fill"
                          style={{ width: `${stats.pct}%`, background: `linear-gradient(90deg, ${T.secondary}, ${T.primary})` }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-primary" onClick={() => router.push("/candidate/profile")}>Edit Profile</button>
                      <button className="btn btn-outline" onClick={() => setActiveSection("missions")}>View Missions</button>
                    </div>
                    <div className="corner-tl" style={{ borderColor: T.primary }} />
                    <div className="corner-br" style={{ borderColor: T.primary }} />
                  </div>
                )}

                {/* Stat cards */}
                <div className="stat-grid">
                  {[
                    { label: "Tests Cleared", val: results.length, sub: "+2 this week", trend: "up", spark: [1,2,1,3,2,4,3,5,4,results.length] },
                    { label: "Jobs Applied", val: appliedJobs.length, sub: "Active applications", trend: "up", spark: [0,1,1,2,1,3,2,3,2,appliedJobs.length] },
                    { label: "Total XP", val: user?.xp || 0, sub: `Level ${stats?.lvl || 1}`, trend: "up", spark: [200,400,350,600,550,700,650,800,750,user?.xp||0] },
                    { label: "Open Bounties", val: jobs.length - appliedJobs.length, sub: "Unclaimed", trend: "neutral", spark: [5,4,6,5,7,6,5,6,5,jobs.length-appliedJobs.length] },
                  ].map((s, i) => (
                    <div key={i} className={`card fade-up fade-up-${i+1}`}>
                      <div className="card-accent" style={{ background: T.primary }} />
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-val"><Counter to={s.val} /></div>
                      <div className="stat-sub">
                        <span className={s.trend === "up" ? "stat-up" : ""}>{s.trend === "up" ? "↑" : "→"}</span>
                        {s.sub}
                        <span style={{ marginLeft: "auto" }}><Spark data={s.spark} color={T.primary} /></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom two-col */}
                <div className="two-col">
                  {/* Activity feed */}
                  <div className="card fade-up">
                    <div className="sec-head">
                      <div className="sec-icon" style={{ borderColor: T.primary, color: T.primary, background: T.muted }}>◎</div>
                      <div className="sec-title">Activity Feed</div>
                    </div>
                    {[
                      { text: `Applied to ${jobs[0]?.title || "Frontend Dev"} position`, time: "2m ago", color: T.primary },
                      { text: "Profile completion reached 80%", time: "1h ago", color: "#4ade80" },
                      { text: "Completed Combat Module #1", time: "3h ago", color: "#a855f7" },
                      { text: "Joined the platform", time: "1d ago", color: "#f59e0b" },
                      { text: "XP milestone unlocked: Level 2", time: "2d ago", color: T.primary },
                    ].map((f, i) => (
                      <div key={i} className="feed-item">
                        <div className="feed-dot" style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }} />
                        <div>
                          <div className="feed-text">{f.text}</div>
                          <div className="feed-time">{f.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills progress */}
                  <div className="card fade-up">
                    <div className="sec-head">
                      <div className="sec-icon" style={{ borderColor: T.primary, color: T.primary, background: T.muted }}>▲</div>
                      <div className="sec-title">Skill Matrix</div>
                    </div>
                    {(user?.profile?.skills?.length ? user.profile.skills : ["React", "Node.js", "Python", "Solidity", "TypeScript"])
                      .slice(0, 5).map((skill, i) => (
                        <div key={i} className="prog-row">
                          <div className="prog-label">{skill}</div>
                          <div className="prog-track">
                            <div className="prog-fill"
                              style={{ width: `${[88,74,65,55,48][i]}%`, background: `linear-gradient(90deg, ${T.secondary}, ${T.primary})`, boxShadow: `0 0 6px ${T.glow}` }} />
                          </div>
                          <div className="prog-val">{[88,74,65,55,48][i]}%</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ MISSIONS (TESTS) ══════════════════════════════════ */}
            {activeSection === "missions" && (
              <div>
                <div className="sec-head fade-up">
                  <div className="sec-icon" style={{ borderColor: T.primary, color: T.primary, background: T.muted, width: 40, height: 40 }}>⚔</div>
                  <div>
                    <div className="sec-title">Combat Modules</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      Complete tests to unlock higher clearance
                    </div>
                  </div>
                  <div className="sec-count">{results.length}/{tests.length} CLEARED</div>
                </div>

                {/* Progress overview */}
                <div className="card fade-up" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <Gauge pct={tests.length ? (results.length / tests.length) * 100 : 0} color={T.primary} size={72} thick={6} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {tests.length ? Math.round((results.length / tests.length) * 100) : 0}% Complete
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {results.length} of {tests.length} modules cleared · {tests.length - results.length} remaining
                      </div>
                    </div>
                  </div>
                </div>

                {tests.length === 0 && (
                  <div className="card" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", color: "rgba(255,255,255,0.2)", fontSize: 12, letterSpacing: "0.2em" }}>
                      NO ACTIVE MODULES
                    </div>
                  </div>
                )}
                {tests.map((test, i) => {
                  const result = getResult(test.id);
                  const locked = isLocked(i);
                  return (
                    <div key={test.id} className={`item-card fade-up${locked ? " locked" : ""}`}>
                      <div className="item-index">{String(i + 1).padStart(2, "0")}</div>
                      <div className="item-dot" style={{ background: result ? "#4ade80" : locked ? "#f87171" : T.primary, boxShadow: `0 0 6px ${result ? "#4ade80" : locked ? "#f87171" : T.primary}` }} />
                      <div className="item-body">
                        <div className="item-title">{test.title}</div>
                        <div className="item-meta">
                          {result && <span className="chip chip-green">✓ CLEARED · {result.score}/{result.total}</span>}
                          {!result && locked && <span className="chip chip-red">⊘ LOCKED</span>}
                          {!result && !locked && <span className="chip chip-blue" style={{ color: T.primary }}>● READY</span>}
                        </div>
                      </div>
                      <button
                        className={`btn ${result ? "btn-ghost" : locked ? "btn-ghost" : "btn-primary"}`}
                        disabled={!!result || locked}
                        onClick={() => router.push(`/candidate/test/${test.id}`)}
                      >
                        {result ? "Archived" : locked ? "Locked" : "Engage"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ BOUNTIES (JOBS) ═══════════════════════════════════ */}
            {activeSection === "bounties" && (
              <div>
                <div className="sec-head fade-up">
                  <div className="sec-icon" style={{ borderColor: T.primary, color: T.primary, background: T.muted, width: 40, height: 40 }}>◎</div>
                  <div>
                    <div className="sec-title">Active Bounties</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      Accept missions to earn XP and rewards
                    </div>
                  </div>
                  <div className="sec-count">{appliedJobs.length} ACCEPTED</div>
                </div>

                {/* Filter chips */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {["All", "Applied", "Open"].map(f => (
                    <div key={f} className="chip chip-blue" style={{ cursor: "pointer", color: T.primary }}>
                      {f}
                    </div>
                  ))}
                </div>

                {jobs.length === 0 && (
                  <div className="card" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", color: "rgba(255,255,255,0.2)", fontSize: 12, letterSpacing: "0.2em" }}>
                      SCANNING NETWORK FOR TARGETS...
                    </div>
                  </div>
                )}
                {jobs.map((job, i) => {
                  const applied = appliedJobs.includes(job.id);
                  return (
                    <div key={job.id} className="item-card fade-up" style={{ opacity: 1 }}>
                      <div className="item-index">{String(i + 1).padStart(2, "0")}</div>
                      <div className="item-dot" style={{ background: applied ? "#4ade80" : T.primary, boxShadow: `0 0 6px ${applied ? "#4ade80" : T.primary}` }} />
                      <div className="item-body">
                        <div className="item-title">{job.title}</div>
                        <div className="item-meta">
                          <span>📍 {job.location?.toUpperCase()}</span>
                          {job.company && <span>· {job.company}</span>}
                          {applied && <span className="chip chip-green">✓ APPLIED</span>}
                        </div>
                      </div>
                      <button
                        className={`btn ${applied ? "btn-ghost" : "btn-outline"}`}
                        disabled={applied}
                        onClick={() => applyJob(job.id)}
                      >
                        {applied ? "Acquired" : "Accept"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ ANALYTICS ════════════════════════════════════════ */}
            {activeSection === "analytics" && (
              <div>
                <div className="sec-head fade-up">
                  <div className="sec-icon" style={{ borderColor: T.primary, color: T.primary, background: T.muted, width: 40, height: 40 }}>▲</div>
                  <div className="sec-title">Performance Analytics</div>
                </div>

                <div className="analytics-grid" style={{ marginBottom: 20 }}>
                  {[
                    { label: "Completion Rate", pct: tests.length ? Math.round((results.length/tests.length)*100) : 0, color: T.primary },
                    { label: "Application Rate", pct: jobs.length ? Math.round((appliedJobs.length/jobs.length)*100) : 0, color: "#4ade80" },
                    { label: "Profile Score", pct: 80, color: "#a855f7" },
                  ].map((r, i) => (
                    <div key={i} className="card fade-up" style={{ textAlign: "center", padding: 24 }}>
                      <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                        <Gauge pct={r.pct} color={r.color} size={90} thick={7} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>{r.pct}%</span>
                        </div>
                      </div>
                      <div className="ring-label">{r.label}</div>
                    </div>
                  ))}
                </div>

                <div className="two-col">
                  <div className="card fade-up">
                    <div className="sec-head">
                      <div className="sec-title" style={{ fontSize: 11 }}>XP History</div>
                    </div>
                    <div style={{ height: 80, position: "relative" }}>
                      <Spark data={MOCK_SPARK} color={T.primary} />
                      <svg viewBox={`0 0 80 28`} width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.primary} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={T.primary} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      {["Jan","Feb","Mar","Apr","May","Jun"].map(m => (
                        <span key={m} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className="card fade-up">
                    <div className="sec-head">
                      <div className="sec-title" style={{ fontSize: 11 }}>Skill Breakdown</div>
                    </div>
                    {(user?.profile?.skills?.length ? user.profile.skills : ["React","Node.js","Python","Solidity","TypeScript"])
                      .slice(0, 5).map((skill, i) => (
                        <div key={i} className="prog-row">
                          <div className="prog-label">{skill}</div>
                          <div className="prog-track">
                            <div className="prog-fill"
                              style={{ width: `${[88,74,65,55,48][i]}%`, background: `linear-gradient(90deg, ${T.secondary}, ${T.primary})` }} />
                          </div>
                          <div className="prog-val">{[88,74,65,55,48][i]}%</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          <span>{notification.type === "success" ? "✓" : "✕"}</span>
          {notification.msg}
        </div>
      )}
    </>
  );
}