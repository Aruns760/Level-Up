"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import api from "../../lib/api";

/* ─────────────────────────────────────────────
   Global CSS
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn     { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
  @keyframes shimmer     { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes countUp     { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulseRing   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.04)} }

  .rd-nav-item:hover        { background:#1E293B !important; color:#F1F5F9 !important; }
  .rd-hamburger:hover       { background:#1E293B !important; }
  .rd-bottom-nav-btn:hover  { color:#6366F1 !important; }
  .rd-post-btn:hover        { background:#4F46E5 !important; transform:translateY(-1px) !important; }
  .rd-logout-top:hover      { background:#FEE2E2 !important; }
  .rd-action-btn:hover      { filter:brightness(0.95) !important; transform:translateY(-2px) !important; }
  .rd-edit-btn:hover        { background:#E2E8F0 !important; }
  .rd-logout-side:hover     { background:#1E293B !important; }
  .rd-stat-card:hover       { transform:translateY(-4px) !important; box-shadow:0 16px 32px rgba(0,0,0,0.1) !important; }
  .rd-activity-row:hover    { background:#F8FAFC !important; }
  .rd-quick-link:hover      { transform:translateX(4px) !important; }

  a { text-decoration:none; }

  @media (max-width:767px) {
    .rd-stats-grid    { grid-template-columns:1fr 1fr !important; }
    .rd-two-col       { grid-template-columns:1fr !important; }
    .rd-topbar        { padding:12px 16px !important; }
    .rd-content       { padding:16px !important; gap:14px !important; }
    .rd-banner        { flex-direction:column !important; align-items:flex-start !important; }
    .rd-banner-divider{ display:none !important; }
  }
  @media (max-width:400px) {
    .rd-stats-grid    { grid-template-columns:1fr !important; }
  }
`;

function useGlobalStyles() {
  useEffect(() => {
    const id = "rd-global";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, []);
}

/* ── useIsMobile ── */
function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${bp - 1}px)`).matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const h = (e) => setMob(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return mob;
}

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

const STAT_CONFIG = [
  { key: "totalJobs",         label: "Active Jobs",      accent: "#6366F1", bg: "#EEF2FF", icon: "◈",  desc: "open positions"    },
  { key: "totalApplications", label: "Applications",     accent: "#10B981", bg: "#ECFDF5", icon: "◉",  desc: "total received"    },
  { key: "shortlisted",       label: "Shortlisted",      accent: "#F59E0B", bg: "#FFFBEB", icon: "★",  desc: "candidates"        },
  { key: "hiredThisMonth",    label: "Hired This Month", accent: "#3B82F6", bg: "#EFF6FF", icon: "✓",  desc: "new hires"         },
];

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
const I = {
  menu:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout:   (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  post:     (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:     (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ok:       (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  err:      (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  arrow:    (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  globe:    (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  trend:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  bell:     (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  briefcase:(s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  users:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bar:      (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

/* ─────────────────────────────────────────────
   Skeleton Loader
───────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)",
      backgroundSize: "400px 100%",
      animation: "shimmer 1.4s infinite linear",
    }} />
  );
}

/* ─────────────────────────────────────────────
   Mini Bar Chart (no library needed)
───────────────────────────────────────────── */
function MiniBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            height: `${Math.round((d.value / max) * 52)}px`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.4,
            transition: "height 0.6s ease",
            minHeight: 4,
          }} />
          <span style={{ fontSize: 9, color: "#94A3B8" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Donut Chart
───────────────────────────────────────────── */
function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;

  // Pre-compute cumulative offsets without mutating a variable inside render
  const segmentsWithOffset = segments.reduce((acc, s) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : null;
    const cumOffset = prev ? prev.cumOffset + prev.len : 0;
    const len = (s.value / total) * circ;
    return [...acc, { ...s, len, cumOffset }];
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="#F1F5F9" strokeWidth={12} />
        {segmentsWithOffset.map((s, i) => (
          <circle
            key={i}
            cx={45} cy={45} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={12}
            strokeDasharray={`${s.len} ${circ - s.len}`}
            strokeDashoffset={-s.cumOffset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }}
          />
        ))}
        <text x={45} y={49} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0F172A">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#64748B" }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginLeft: "auto" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sidebar Content (shared desktop + drawer)
───────────────────────────────────────────── */
function SidebarContent({ pathname, router, user, onClose, onLogout }) {
  const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "R";
  return (
    <>
      {/* Logo row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logoMark}>R</div>
          <span style={S.logoText}>RΣCRUITER</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4 }}>
            {I.close(22)}
          </button>
        )}
      </div>

      <p style={S.navSection}>Main Menu</p>
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path;
          return (
            <div key={item.path} className="rd-nav-item"
              onClick={() => { router.push(item.path); onClose?.(); }}
              style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}
            >
              <span style={S.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {active && <div style={S.activeDot} />}
            </div>
          );
        })}
      </nav>

      {/* User block + Logout */}
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div style={S.sidebarUser}>
          <div style={S.sidebarAvatar}>{initials(user.name)}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={S.sidebarName}>{user.name}</p>
            <p style={S.sidebarEmail}>{user.email}</p>
          </div>
        </div>
        <button className="rd-logout-side" onClick={onLogout} style={S.logoutSideBtn}>
          {I.logout()} Sign out
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
function StatCard({ cfg, value, trend, loading }) {
  return (
    <div className="rd-stat-card" style={{ ...S.statCard, background: cfg.bg, transition: "transform 0.2s, box-shadow 0.2s" }}>
      <div style={{ height: 3, background: cfg.accent, borderRadius: "8px 8px 0 0", margin: "-16px -16px 14px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.accent + "22", color: cfg.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {cfg.icon}
        </div>
        {trend !== undefined && !loading && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trend >= 0 ? "#10B981" : "#EF4444", background: trend >= 0 ? "#ECFDF5" : "#FEF2F2", padding: "3px 8px", borderRadius: 20 }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        {loading ? (
          <><Skeleton h={28} w={60} r={6} /><div style={{ marginTop: 6 }}><Skeleton h={11} w={80} r={4} /></div></>
        ) : (
          <>
            <p style={{ fontSize: 30, fontWeight: 800, color: cfg.accent, lineHeight: 1, animation: "countUp 0.5s ease" }}>{value}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{cfg.desc}</p>
          </>
        )}
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: cfg.accent, marginTop: 6 }}>{cfg.label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function RecruiterDashboard() {
  useGlobalStyles();
  const isMobile = useIsMobile();
  const router   = useRouter();
  const pathname = usePathname();
  const { toasts, add: toast } = useToast();

  const [stats,       setStats]       = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [user,        setUser]        = useState({ name: "", email: "" });
  const [image,       setImage]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [statsLoad,   setStatsLoad]   = useState(true);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [greeting,    setGreeting]    = useState("Hello");
  const [currentTime, setCurrentTime] = useState("");
  const [recentJobs,  setRecentJobs]  = useState([]);

  /* ── Greeting based on time ── */
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  /* ── Fetch all data ── */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const role  = localStorage.getItem("role");
      if (!token || role !== "recruiter") { router.push("/login"); return; }

      setUser({
        name:  localStorage.getItem("name")  || "Recruiter",
        email: localStorage.getItem("email") || "",
      });
      const img = localStorage.getItem("image");
      if (img && img !== "null") setImage(img);

      try {
        /* Profile + user image */
        const [profRes, userRes] = await Promise.all([
          api.get("/recruiter/profile", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/user/me",           { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!profRes.data) { router.push("/recruiter-profile"); return; }
        setProfile(profRes.data);
        if (userRes.data?.image) { setImage(userRes.data.image); localStorage.setItem("image", userRes.data.image); }

        setLoading(false);

        /* Stats — separate so cards animate in */
        const [statsRes, jobsRes] = await Promise.all([
          api.get("/jobs/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/jobs/my-jobs",         { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setRecentJobs((jobsRes.data || []).slice(0, 5));
      } catch (err) {
        if (err.response?.status === 401) { localStorage.clear(); router.push("/login"); return; }
        if (err.response?.status === 404) { router.push("/recruiter-profile"); return; }
        toast("Could not load dashboard data", "error");
        setLoading(false);
      } finally {
        setStatsLoad(false);
      }
    })();
  }, [router, toast]);

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };
  const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "R";
  const firstName = user.name.split(" ")[0] || "there";

  const statValues = {
    totalJobs:         stats?.totalJobs         ?? 0,
    totalApplications: stats?.totalApplications ?? 0,
    shortlisted:       stats?.shortlisted       ?? 0,
    hiredThisMonth:    stats?.hiredThisMonth    ?? 0,
  };

  /* Mock weekly application data for chart */
  const weeklyData = [
    { label: "Mon", value: Math.max(1, (statValues.totalApplications * 0.10) | 0) },
    { label: "Tue", value: Math.max(1, (statValues.totalApplications * 0.14) | 0) },
    { label: "Wed", value: Math.max(1, (statValues.totalApplications * 0.18) | 0) },
    { label: "Thu", value: Math.max(1, (statValues.totalApplications * 0.12) | 0) },
    { label: "Fri", value: Math.max(1, (statValues.totalApplications * 0.20) | 0) },
    { label: "Sat", value: Math.max(1, (statValues.totalApplications * 0.09) | 0) },
    { label: "Sun", value: Math.max(1, (statValues.totalApplications * 0.17) | 0) },
  ];

  const donutSegments = [
    { label: "Active Jobs",   value: statValues.totalJobs,         color: "#6366F1" },
    { label: "Shortlisted",   value: statValues.shortlisted,       color: "#F59E0B" },
    { label: "Hired",         value: statValues.hiredThisMonth,    color: "#10B981" },
  ];

  const ACTIVITY_ITEMS = [
    { text: "3 new applications on Senior Dev",  time: "2m ago",    dot: "#10B981", icon: "◉" },
    { text: "Job 'UX Designer' approved",        time: "1h ago",    dot: "#6366F1", icon: "◈" },
    { text: "Candidate shortlisted for PM role", time: "3h ago",    dot: "#F59E0B", icon: "★" },
    { text: "New message from candidate",        time: "Yesterday", dot: "#3B82F6", icon: "✉" },
    { text: "Job 'Data Engineer' going live",    time: "Yesterday", dot: "#8B5CF6", icon: "◈" },
  ];

  /* ── Loading screen ── */
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter',sans-serif" }}>
      <div style={S.spinner} />
      <p style={{ color: "#6B7280", marginTop: 14, fontSize: 14, fontWeight: 500 }}>Loading your dashboard…</p>
    </div>
  );

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter',sans-serif" }}>

      {/* ════ TOASTS ════ */}
      <div style={{ position: "fixed", bottom: isMobile ? 80 : 24, right: 24, left: isMobile ? 12 : "auto", display: "flex", flexDirection: "column", gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...S.toast, borderLeftColor: t.type === "error" ? "#EF4444" : "#10B981", animation: "toastIn 0.3s ease" }}>
            <span style={{ color: t.type === "error" ? "#EF4444" : "#10B981" }}>
              {t.type === "error" ? I.err() : I.ok()}
            </span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ════ MOBILE OVERLAY ════ */}
      {isMobile && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
      )}

      {/* ════ MOBILE DRAWER ════ */}
      {isMobile && (
        <aside style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 270,
          background: "#0F172A", zIndex: 300, padding: "24px 16px",
          display: "flex", flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          overflowY: "auto",
        }}>
          <SidebarContent pathname={pathname} router={router} user={user} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
        </aside>
      )}

      {/* ════ DESKTOP SIDEBAR ════ */}
      {!isMobile && (
        <aside style={S.sidebar}>
          <SidebarContent pathname={pathname} router={router} user={user} onLogout={handleLogout} />
        </aside>
      )}

      {/* ════ MAIN ════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, paddingBottom: isMobile ? 72 : 0 }}>

        {/* ── Top Bar ── */}
        <header className="rd-topbar" style={S.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {isMobile && (
              <button className="rd-hamburger" onClick={() => setDrawerOpen(true)}
                style={{ background: "none", border: "none", color: "#0F172A", cursor: "pointer", padding: "6px 8px", borderRadius: 8, transition: "background 0.15s", flexShrink: 0 }}>
                {I.menu(22)}
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#0F172A" }}>Dashboard</h1>
              {!isMobile && (
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {greeting}, {firstName}! Here&apos;s what&apos;s happening.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live clock */}
            {!isMobile && currentTime && (
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, padding: "4px 10px", background: "#F1F5F9", borderRadius: 20 }}>
                🕐 {currentTime}
              </span>
            )}
            <button className="rd-post-btn" onClick={() => router.push("/post-job")}
              style={{ ...S.postBtn, padding: isMobile ? "7px 12px" : "8px 16px", fontSize: isMobile ? 12 : 13, display: "flex", alignItems: "center", gap: 5 }}>
              {I.post()} {isMobile ? "Post" : "Post a Job"}
            </button>
            {!isMobile && (
              <button className="rd-logout-top" onClick={handleLogout} style={S.logoutTopBtn}>
                {I.logout()} Logout
              </button>
            )}
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="rd-content" style={{
          padding: isMobile ? 14 : "24px 32px",
          display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20,
          backgroundImage: "radial-gradient(#E2E8F0 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}>

          {/* ── Profile Banner ── */}
          <div className="rd-banner" style={{
            ...S.card,
            display: "flex", alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 16 : 20, padding: isMobile ? "16px" : "18px 24px",
            animation: "fadeSlideUp 0.3s ease",
          }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {image ? (
                  <Image
                    src={`http://localhost:3000${image}`}
                    alt="Profile"
                    width={52}
                    height={52}
                    style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #E2E8F0" }}
                    onError={() => setImage("")}
                  />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF2FF", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {initials(user.name)}
                  </div>
                )}
                <span style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10, background: "#10B981", borderRadius: "50%", border: "2px solid #fff" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#EEF2FF", color: "#6366F1", marginTop: 4 }}>
                  ✓ Verified Recruiter
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="rd-banner-divider" style={{ width: 1, height: 52, background: "#E2E8F0", flexShrink: 0 }} />

            {/* Company info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Company</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile?.companyName || "—"}
              </p>
              {profile?.companyWebsite && (
                <a href={profile.companyWebsite} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#6366F1", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  {I.globe()} {profile.companyWebsite.replace(/^https?:\/\//, "")}
                </a>
              )}
              {profile?.location && (
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>📍 {profile.location}</p>
              )}
            </div>

            {/* Edit Profile button */}
            <button className="rd-edit-btn" onClick={() => router.push("/recruiter-profile")}
              style={{ ...S.editBtn, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
              {I.edit()} Edit Profile
            </button>
          </div>

          {/* ── Greeting banner (mobile) ── */}
          {isMobile && (
            <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 14, padding: "14px 18px", color: "#fff", animation: "fadeSlideUp 0.35s ease" }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{greeting}, {firstName}! 👋</p>
              <p style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>Here&apos;s your recruiting snapshot for today.</p>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className="rd-stats-grid" style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
            gap: isMobile ? 12 : 16,
            animation: "fadeSlideUp 0.4s ease",
          }}>
            {STAT_CONFIG.map((cfg, i) => (
              <StatCard
                key={cfg.key}
                cfg={cfg}
                value={statValues[cfg.key]}
                trend={[12, 8, -3, 25][i]}
                loading={statsLoad}
              />
            ))}
          </div>

          {/* ── Two column row ── */}
          <div className="rd-two-col" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 20 }}>

            {/* Quick Actions */}
            <div style={{ ...S.card, animation: "fadeSlideUp 0.45s ease" }}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderIcon}>{I.briefcase(14)}</span>
                <p style={S.cardTitle}>Quick Actions</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "📋 My Jobs",      path: "/recruiter-jobs",    color: "#6366F1", bg: "#EEF2FF" },
                  { label: "➕ Post a Job",   path: "/post-job",          color: "#10B981", bg: "#ECFDF5" },
                  { label: "🔍 Browse Jobs",  path: "/jobs",              color: "#3B82F6", bg: "#EFF6FF" },
                  { label: "👤 My Profile",   path: "/recruiter-profile", color: "#F59E0B", bg: "#FFFBEB" },
                ].map(a => (
                  <button key={a.path} className="rd-action-btn"
                    onClick={() => router.push(a.path)}
                    style={{ padding: "13px 10px", borderRadius: 10, background: a.bg, color: a.color,
                      border: `1px solid ${a.color}30`, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s", textAlign: "center", lineHeight: 1.4 }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ marginTop: 16, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", marginBottom: 10 }}>Jump to</p>
                {[
                  { label: "View all applications", path: "/recruiter-jobs" },
                  { label: "Shortlisted candidates", path: "/recruiter-jobs" },
                  { label: "Manage job listings",    path: "/recruiter-jobs" },
                ].map(l => (
                  <div key={l.label} className="rd-quick-link"
                    onClick={() => router.push(l.path)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0",
                      borderBottom: "1px solid #F8FAFC", cursor: "pointer", color: "#374151", fontSize: 13,
                      transition: "transform 0.15s" }}>
                    <span>{l.label}</span>
                    {I.arrow(13)}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ ...S.card, animation: "fadeSlideUp 0.5s ease" }}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderIcon}>{I.bell(14)}</span>
                <p style={S.cardTitle}>Recent Activity</p>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, background: "#EEF2FF", color: "#6366F1", padding: "3px 8px", borderRadius: 20 }}>
                  {ACTIVITY_ITEMS.length} new
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {ACTIVITY_ITEMS.map((item, i) => (
                  <div key={i} className="rd-activity-row"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 8,
                      borderBottom: i < ACTIVITY_ITEMS.length - 1 ? "1px solid #F8FAFC" : "none",
                      cursor: "pointer", transition: "background 0.15s" }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: item.dot + "22", color: item.dot,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: 12, color: "#374151", flex: 1, lineHeight: 1.4 }}>{item.text}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Analytics row ── */}
          <div className="rd-two-col" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: isMobile ? 14 : 20 }}>

            {/* Weekly Applications Bar Chart */}
            <div style={{ ...S.card, animation: "fadeSlideUp 0.55s ease" }}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderIcon}>{I.bar(14)}</span>
                <p style={S.cardTitle}>Applications This Week</p>
                {!statsLoad && (
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}>
                    {I.trend(12)} +12% vs last week
                  </span>
                )}
              </div>
              {statsLoad ? (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
                  {[...Array(7)].map((_, i) => <Skeleton key={i} w="100%" h={Math.random() * 50 + 20} r={4} />)}
                </div>
              ) : (
                <>
                  <MiniBarChart data={weeklyData} color="#6366F1" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                    {[
                      { label: "Total",    value: statValues.totalApplications, color: "#6366F1" },
                      { label: "Reviewed", value: Math.floor(statValues.totalApplications * 0.6), color: "#10B981" },
                      { label: "Pending",  value: Math.floor(statValues.totalApplications * 0.4), color: "#F59E0B" },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Donut Chart */}
            <div style={{ ...S.card, animation: "fadeSlideUp 0.6s ease" }}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderIcon}>{I.users(14)}</span>
                <p style={S.cardTitle}>Hiring Breakdown</p>
              </div>
              {statsLoad ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Skeleton w={90} h={90} r={45} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <Skeleton h={12} /><Skeleton h={12} /><Skeleton h={12} />
                  </div>
                </div>
              ) : (
                <DonutChart segments={donutSegments} />
              )}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6 }}>
                  Hire rate: <strong style={{ color: "#10B981" }}>
                    {statValues.totalApplications > 0
                      ? `${Math.round((statValues.hiredThisMonth / statValues.totalApplications) * 100)}%`
                      : "—"}
                  </strong> of total applicants
                </p>
              </div>
            </div>
          </div>

          {/* ── Recent Jobs Table ── */}
          {(recentJobs.length > 0 || statsLoad) && (
            <div style={{ ...S.card, animation: "fadeSlideUp 0.65s ease" }}>
              <div style={S.cardHeader}>
                <span style={S.cardHeaderIcon}>{I.briefcase(14)}</span>
                <p style={S.cardTitle}>Recent Job Listings</p>
                <button onClick={() => router.push("/recruiter-jobs")}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#6366F1", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  View all {I.arrow(12)}
                </button>
              </div>
              {statsLoad ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <Skeleton w={36} h={36} r={8} />
                      <div style={{ flex: 1 }}><Skeleton h={12} w="60%" /><div style={{ marginTop: 6 }}><Skeleton h={10} w="40%" /></div></div>
                      <Skeleton w={60} h={22} r={20} />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {recentJobs.map((job, i) => (
                    <div key={job._id || i}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                        borderBottom: i < recentJobs.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EEF2FF", color: "#6366F1",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                        ◈
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {job.title}
                        </p>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {job.location} · {job.jobType || "Full-time"}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                        background: job.status === "approved" ? "#ECFDF5" : "#FFFBEB",
                        color: job.status === "approved" ? "#10B981" : "#F59E0B",
                        flexShrink: 0 }}>
                        {job.status === "approved" ? "Live" : "Pending"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0, display: isMobile ? "none" : "block" }}>
                        {job.applications ?? 0} apps
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: "#fff",
          borderTop: "1px solid #E2E8F0", display: "flex", zIndex: 100, boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.path;
            return (
              <button key={item.path} className="rd-bottom-nav-btn"
                onClick={() => router.push(item.path)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  border: "none", background: "none", cursor: "pointer", padding: "6px 0",
                  color: active ? "#6366F1" : "#94A3B8", transition: "color 0.15s" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, marginTop: 3 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const S = {
  /* Sidebar */
  sidebar:      { width: 240, minWidth: 240, background: "#0F172A", color: "#CBD5E1", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, height: "100vh", zIndex: 100, overflowY: "auto" },
  logoMark:     { width: 34, height: 34, borderRadius: 8, background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  logoText:     { fontSize: 16, fontWeight: 600, color: "#F1F5F9" },
  navSection:   { fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#475569", marginBottom: 8 },
  navItem:      { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#94A3B8", marginBottom: 3, position: "relative", transition: "background 0.15s,color 0.15s" },
  navItemActive:{ background: "#1E293B", color: "#F1F5F9" },
  navIcon:      { fontSize: 14, width: 18, textAlign: "center" },
  activeDot:    { width: 6, height: 6, borderRadius: "50%", background: "#6366F1", marginLeft: "auto" },
  sidebarUser:  { display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "#1E293B", borderRadius: 8, marginBottom: 8, overflow: "hidden" },
  sidebarAvatar:{ width: 32, height: 32, borderRadius: "50%", background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 },
  sidebarName:  { fontSize: 12, fontWeight: 600, color: "#F1F5F9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sidebarEmail: { fontSize: 11, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 },
  logoutSideBtn:{ width: "100%", background: "transparent", border: "1px solid #334155", color: "#94A3B8", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8, transition: "background 0.15s" },

  /* Topbar */
  topbar:       { background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50, gap: 10 },
  postBtn:      { background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" },
  logoutTopBtn: { padding: "8px 14px", borderRadius: 8, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s" },

  /* Cards */
  card:         { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  cardHeader:   { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 },
  cardHeaderIcon:{ width: 28, height: 28, borderRadius: 7, background: "#EEF2FF", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" },
  cardTitle:    { fontSize: 14, fontWeight: 700, color: "#0F172A" },

  /* Stat card */
  statCard:     { borderRadius: 14, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid transparent", overflow: "hidden" },

  editBtn:      { padding: "8px 16px", borderRadius: 8, background: "#F8FAFC", color: "#374151", border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.15s" },

  /* Toast */
  toast:        { display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500, background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", borderLeft: "4px solid" },

  /* Spinner */
  spinner:      { width: 36, height: 36, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};