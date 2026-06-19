"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⊞", glyph: "01" },
  { label: "Profile", path: "/admin/profile", icon: "◯", glyph: "02" },
  { label: "Job Approval", path: "/admin/jobs", icon: "✓", glyph: "03" },
  { label: "Create Test", path: "/admin/tests/create", icon: "+", glyph: "04" },
  { label: "Manage Tests", path: "/admin/tests/manage", icon: "≡", glyph: "05" },
  { label: "Questions", path: "/admin/questions", icon: "?", glyph: "06" },
];

const ROLE_META = {
  admin:     { label: "ADMIN",     color: "#FF4D6D", glow: "rgba(255,77,109,0.35)",     dot: "#FF4D6D" },
  recruiter: { label: "RECRUITER", color: "#00D4FF", glow: "rgba(0,212,255,0.35)",      dot: "#00D4FF" },
  candidate: { label: "CANDIDATE", color: "#00FF9D", glow: "rgba(0,255,157,0.35)",      dot: "#00FF9D" },
};

const BASE_URL = "http://localhost:3000";

export default function AdminDashboard() {
  const router = useRouter();
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [activeNav, setActiveNav] = useState("/admin/dashboard");
  const [profile,  setProfile]  = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // userId pending delete
  const dropdownRef = useRef(null);
  const tickRef = useRef(null);
  const [tick, setTick] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0, recruiters: 0, candidates: 0, admins: 0,
  });

  /* live clock tick */
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    if (!token || role !== "admin") { router.push("/login"); return; }

    const fetchAll = async () => {
      try {
        const [usersRes, profileRes] = await Promise.all([
          api.get("/admin/users",   { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/admin/profile", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const data = usersRes.data;
        setUsers(data);
        setProfile(profileRes.data);
        setStats({
          totalUsers: data.length,
          recruiters: data.filter(u => u.role === "recruiter").length,
          candidates: data.filter(u => u.role === "candidate").length,
          admins:     data.filter(u => u.role === "admin").length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const deleteUser = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.filter(u => u._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name = "") =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (loading) return (
    <div style={S.loadingWrap}>
      <style>{CSS}</style>
      <div style={S.loadingInner}>
        <div style={S.loadingRing} />
        <div style={S.loadingRingInner} />
        <span style={S.loadingText}>INITIALIZING SYSTEM</span>
        <span style={S.loadingSubtext}>Authenticating admin session…</span>
      </div>
    </div>
  );

  return (
    <div style={S.layout}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        {/* Sidebar top glow line */}
        <div style={S.sidebarGlowLine} />

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoHex}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#00D4FF" strokeWidth="1.5"/>
              <polygon points="18,8 26,13 26,23 18,28 10,23 10,13" fill="rgba(0,212,255,0.12)" stroke="#00D4FF" strokeWidth="0.8"/>
              <text x="18" y="22" textAnchor="middle" fill="#00D4FF" fontSize="11" fontWeight="700" fontFamily="monospace">A</text>
            </svg>
          </div>
          <div>
            <div style={S.logoName}>ADMIN<span style={S.logoAccent}>HUB</span></div>
            <div style={S.logoVersion}>v3.0.1 // SECURE</div>
          </div>
        </div>

        {/* Live clock */}
        <div style={S.clockBox}>
          <div style={S.clockTime}>{timeStr}</div>
          <div style={S.clockDate}>{dateStr}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, marginTop: 8 }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.path;
            return (
              <div
                key={item.path}
                onClick={() => { setActiveNav(item.path); router.push(item.path); }}
                style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}
                className="nav-item"
              >
                <span style={S.navGlyph}>{item.glyph}</span>
                <span style={S.navIcon}>{item.icon}</span>
                <span style={S.navLabel}>{item.label}</span>
                {isActive && <div style={S.navActiveBar} />}
              </div>
            );
          })}
        </nav>

        {/* System status */}
        <div style={S.systemStatus}>
          <div style={S.statusRow}><span style={S.statusDot} />SYS ONLINE</div>
          <div style={S.statusRow}><span style={{...S.statusDot, background: "#00FF9D"}} />DB CONNECTED</div>
        </div>

        <button onClick={handleLogout} style={S.logoutBtn} className="logout-btn">
          <span style={S.logoutIcon}>⏻</span>LOGOUT
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* Topbar */}
        <header style={S.topbar}>
          <div style={S.topbarLeft}>
            <div style={S.breadcrumb}>
              <span style={S.breadcrumbRoot}>SYSTEM</span>
              <span style={S.breadcrumbSep}>/</span>
              <span style={S.breadcrumbCurrent}>DASHBOARD</span>
            </div>
            <h1 style={S.pageTitle}>Command Center</h1>
          </div>

          <div style={S.topbarRight}>
            {/* Search */}
            <div style={S.searchWrap}>
              <span style={S.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={S.searchInput}
              />
            </div>

            {/* Avatar dropdown */}
            <div style={S.avatarWrap} ref={dropdownRef}>
              <div style={S.avatarBtn} onClick={() => setShowDropdown(v => !v)} className="avatar-btn">
                <img
                  src={profile?.image ? `${BASE_URL}${profile.image}` : "https://via.placeholder.com/36"}
                  alt="admin"
                  style={S.avatarImg}
                />
                <div style={S.avatarOnline} />
              </div>

              {showDropdown && (
                <div style={S.dropdown} className="dropdown-enter">
                  <div style={S.dropdownHeader}>
                    <img
                      src={profile?.image ? `${BASE_URL}${profile.image}` : "https://via.placeholder.com/48"}
                      style={S.dropdownAvatar}
                    />
                    <div>
                      <div style={S.dropdownName}>{profile?.name || "Admin"}</div>
                      <div style={S.dropdownEmail}>{profile?.email || ""}</div>
                      <div style={S.dropdownRole}>● ADMIN ACCESS</div>
                    </div>
                  </div>
                  <div style={S.dropdownDivider} />
                  {[
                    { label: "View Profile",   icon: "◯", path: "/admin/profile" },
                    { label: "Settings",       icon: "⚙", path: "/admin/settings" },
                    { label: "Notifications",  icon: "⏺", path: "/admin/notifications" },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={S.dropdownItem}
                      className="dropdown-item"
                      onClick={() => { setShowDropdown(false); router.push(item.path); }}
                    >
                      <span style={S.dropdownItemIcon}>{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                  <div style={S.dropdownDivider} />
                  <div
                    style={{ ...S.dropdownItem, color: "#FF4D6D" }}
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <span style={S.dropdownItemIcon}>⏻</span>
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={S.content}>

          {/* ── Stat Cards ── */}
          <div style={S.statsGrid}>
            {[
              { label: "TOTAL USERS",  value: stats.totalUsers,  color: "#A78BFA", glow: "rgba(167,139,250,0.2)", icon: "◈" },
              { label: "RECRUITERS",   value: stats.recruiters,  color: "#00D4FF", glow: "rgba(0,212,255,0.2)",   icon: "⌗" },
              { label: "CANDIDATES",   value: stats.candidates,  color: "#00FF9D", glow: "rgba(0,255,157,0.2)",   icon: "⊕" },
              { label: "ADMINS",       value: stats.admins,      color: "#FF4D6D", glow: "rgba(255,77,109,0.2)",  icon: "⚿" },
            ].map((card, i) => (
              <div
                key={card.label}
                style={{ ...S.statCard, "--card-color": card.color, "--card-glow": card.glow }}
                className="stat-card"
              >
                <div style={{ ...S.statCardGlow, background: card.glow }} />
                <div style={S.statCardTop}>
                  <span style={{ ...S.statCardIcon, color: card.color }}>{card.icon}</span>
                  <span style={S.statCardIndex}>0{i + 1}</span>
                </div>
                <div style={{ ...S.statValue, color: card.color }}>{card.value}</div>
                <div style={{ ...S.statLabel, color: card.color }}>{card.label}</div>
                <div style={{ ...S.statBar, background: card.color }} />
              </div>
            ))}
          </div>

          {/* ── Users Table ── */}
          <div style={S.tableCard}>
            <div style={S.tableGlowTop} />

            <div style={S.tableHeader}>
              <div>
                <h2 style={S.tableTitle}>USER REGISTRY</h2>
                <p style={S.tableSubtitle}>
                  <span style={S.tableCount}>{filtered.length}</span>
                  <span style={{ color: "#4A5568" }}>/{users.length} RECORDS LOADED</span>
                </p>
              </div>
              <div style={S.tableHeaderRight}>
                <div style={S.liveIndicator}>
                  <span style={S.liveDot} className="pulse-dot" />LIVE
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["#", "USER", "EMAIL", "ROLE", "ACTIONS"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => {
                    const rm = ROLE_META[user.role] || ROLE_META.candidate;
                    const isHovered = hoveredRow === user._id;
                    return (
                      <tr
                        key={user._id || user.email}
                        style={{ ...S.tr, ...(isHovered ? S.trHovered : {}) }}
                        onMouseEnter={() => setHoveredRow(user._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={{ ...S.td, ...S.tdIndex }}>{String(idx + 1).padStart(2, "0")}</td>

                        <td style={S.td}>
                          <div style={S.userCell}>
                            <div style={{ ...S.avatar, "--av-color": rm.color }}>
                              <span style={{ color: rm.color }}>{initials(user.name)}</span>
                              <div style={{ ...S.avatarRing, borderColor: rm.color }} />
                            </div>
                            <div>
                              <div style={S.userName}>{user.name}</div>
                              <div style={S.userSub}>ID: {user._id?.slice(-6) || "------"}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ ...S.td, ...S.tdEmail }}>{user.email}</td>

                        <td style={S.td}>
                          <span style={{ ...S.badge, color: rm.color, borderColor: rm.color, boxShadow: `0 0 8px ${rm.glow}` }}>
                            <span style={{ ...S.badgeDot, background: rm.color, boxShadow: `0 0 4px ${rm.color}` }} />
                            {rm.label}
                          </span>
                        </td>

                        <td style={S.td}>
                          {deleteConfirm === user._id ? (
                            <div style={S.confirmWrap}>
                              <span style={S.confirmText}>CONFIRM?</span>
                              <button onClick={() => deleteUser(user._id)} style={S.confirmYes}>YES</button>
                              <button onClick={() => setDeleteConfirm(null)} style={S.confirmNo}>NO</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user._id)}
                              style={S.deleteBtn}
                              className="delete-btn"
                            >
                              ✕ REMOVE
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={S.emptyCell}>
                        <div style={S.emptyInner}>
                          <div style={S.emptyIcon}>◈</div>
                          <div>NO RECORDS FOUND</div>
                          <div style={{ fontSize: 11, color: "#4A5568", marginTop: 4 }}>Try adjusting your search parameters</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={S.tableFooter}>
              <span style={S.tableFooterText}>END OF RECORDS // {filtered.length} ENTRIES DISPLAYED</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0A0E1A; }
  ::-webkit-scrollbar-thumb { background: #1E2D3D; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #00D4FF; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spin-rev { to { transform: rotate(-360deg); } }
  @keyframes pulse-ring {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.5); }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes scan-line {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }

  .nav-item:hover { background: rgba(0, 212, 255, 0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 0 30px var(--card-glow) !important; }
  .avatar-btn:hover { box-shadow: 0 0 0 2px #00D4FF !important; }
  .dropdown-enter { animation: slide-in 0.18s ease; }
  .dropdown-item:hover { background: rgba(0,212,255,0.08) !important; color: #00D4FF !important; }
  .delete-btn:hover { background: rgba(255,77,109,0.15) !important; border-color: #FF4D6D !important; color: #FF4D6D !important; }
  .pulse-dot { animation: pulse-ring 1.5s ease-in-out infinite; }
`;

/* ─── Styles ─── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh",
    background: "#060912",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: "#CBD5E1",
    position: "relative",
    overflow: "hidden",
  },

  /* Loading */
  loadingWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#060912",
    fontFamily: "'Space Grotesk', monospace",
  },
  loadingInner: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12, position: "relative",
  },
  loadingRing: {
    width: 60, height: 60, borderRadius: "50%",
    border: "2px solid rgba(0,212,255,0.15)",
    borderTopColor: "#00D4FF",
    animation: "spin 0.9s linear infinite",
  },
  loadingRingInner: {
    position: "absolute", top: 10, left: 10,
    width: 40, height: 40, borderRadius: "50%",
    border: "2px solid rgba(167,139,250,0.15)",
    borderBottomColor: "#A78BFA",
    animation: "spin-rev 0.6s linear infinite",
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, letterSpacing: "0.18em",
    color: "#00D4FF", marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 11, color: "#4A5568", fontFamily: "'JetBrains Mono', monospace",
  },

  /* Sidebar */
  sidebar: {
    width: 260, minHeight: "100vh",
    background: "linear-gradient(180deg, #0D1117 0%, #0A0E1A 100%)",
    borderRight: "1px solid rgba(0,212,255,0.1)",
    display: "flex", flexDirection: "column",
    padding: "24px 16px 20px",
    position: "relative", overflow: "hidden",
    flexShrink: 0,
  },
  sidebarGlowLine: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
    animation: "glow-pulse 3s ease-in-out infinite",
  },

  logo: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
    paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  logoHex: { flexShrink: 0 },
  logoName: {
    fontSize: 17, fontWeight: 700, letterSpacing: "0.06em",
    color: "#E2E8F0",
  },
  logoAccent: { color: "#00D4FF" },
  logoVersion: {
    fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
    color: "#2D3748", letterSpacing: "0.1em", marginTop: 2,
  },

  clockBox: {
    background: "rgba(0,212,255,0.04)",
    border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: 6, padding: "8px 12px",
    marginBottom: 16,
  },
  clockTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 22, fontWeight: 700, color: "#00D4FF",
    letterSpacing: "0.05em",
  },
  clockDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#4A5568", letterSpacing: "0.08em", marginTop: 2,
  },

  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 6,
    cursor: "pointer", fontSize: 13, fontWeight: 500,
    color: "#4A5568", marginBottom: 2,
    position: "relative", transition: "all 0.15s ease",
    letterSpacing: "0.04em",
  },
  navItemActive: {
    background: "rgba(0,212,255,0.08)",
    color: "#00D4FF",
    borderLeft: "2px solid #00D4FF",
  },
  navGlyph: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", minWidth: 16,
  },
  navIcon: { fontSize: 14, minWidth: 16, textAlign: "center" },
  navLabel: { flex: 1 },
  navActiveBar: {
    position: "absolute", right: 12,
    width: 5, height: 5, borderRadius: "50%",
    background: "#00D4FF", boxShadow: "0 0 6px #00D4FF",
  },

  systemStatus: {
    margin: "12px 0",
    padding: "10px 12px",
    background: "rgba(0,255,157,0.03)",
    border: "1px solid rgba(0,255,157,0.08)",
    borderRadius: 6,
  },
  statusRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
    color: "#2D4A38", letterSpacing: "0.08em", marginBottom: 4,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#00D4FF", display: "inline-block",
    flexShrink: 0,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#4A5568", padding: "9px 14px", borderRadius: 6,
    cursor: "pointer", fontSize: 11, fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.1em", transition: "all 0.15s",
    width: "100%",
  },
  logoutIcon: { fontSize: 14 },

  /* Main */
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

  topbar: {
    background: "rgba(10,14,26,0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,212,255,0.08)",
    padding: "14px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    position: "sticky", top: 0, zIndex: 50,
  },
  topbarLeft: {},
  breadcrumb: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
    letterSpacing: "0.1em", marginBottom: 4,
  },
  breadcrumbRoot: { color: "#2D3748" },
  breadcrumbSep:  { color: "#1A2535" },
  breadcrumbCurrent: { color: "#00D4FF" },
  pageTitle: {
    fontSize: 20, fontWeight: 700, color: "#E2E8F0",
    letterSpacing: "-0.01em",
  },
  topbarRight: { display: "flex", alignItems: "center", gap: 14 },

  searchWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: 8, padding: "7px 12px", gap: 8,
  },
  searchIcon: { color: "#4A5568", fontSize: 16 },
  searchInput: {
    background: "transparent", border: "none", outline: "none",
    color: "#CBD5E1", fontSize: 13, width: 200,
    fontFamily: "'Space Grotesk', sans-serif",
  },

  avatarWrap: { position: "relative" },
  avatarBtn: {
    width: 38, height: 38, borderRadius: "50%",
    cursor: "pointer", position: "relative",
    transition: "box-shadow 0.2s",
    boxShadow: "0 0 0 1px rgba(0,212,255,0.3)",
  },
  avatarImg: {
    width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover",
  },
  avatarOnline: {
    position: "absolute", bottom: 1, right: 1,
    width: 8, height: 8, borderRadius: "50%",
    background: "#00FF9D", border: "1.5px solid #0A0E1A",
    boxShadow: "0 0 5px #00FF9D",
  },

  dropdown: {
    position: "absolute", top: "calc(100% + 10px)", right: 0,
    background: "#0D1117",
    border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: 10, padding: "6px",
    minWidth: 240, zIndex: 100,
    boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,212,255,0.05)",
  },
  dropdownHeader: {
    display: "flex", gap: 12, padding: "10px 10px 12px",
    alignItems: "center",
  },
  dropdownAvatar: {
    width: 44, height: 44, borderRadius: "50%", objectFit: "cover",
    border: "1px solid rgba(0,212,255,0.2)",
  },
  dropdownName: { fontSize: 14, fontWeight: 600, color: "#E2E8F0" },
  dropdownEmail: { fontSize: 11, color: "#4A5568", marginTop: 2 },
  dropdownRole: {
    fontSize: 10, color: "#00FF9D", fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.06em", marginTop: 3,
  },
  dropdownDivider: { height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" },
  dropdownItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 10px", borderRadius: 6,
    fontSize: 13, color: "#94A3B8",
    cursor: "pointer", transition: "all 0.12s",
  },
  dropdownItemIcon: { fontSize: 13, width: 16, textAlign: "center" },

  /* Content */
  content: { padding: "24px 28px", flex: 1, overflowY: "auto" },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16, marginBottom: 24,
  },
  statCard: {
    background: "linear-gradient(135deg, #0D1117 0%, #0A0E1A 100%)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10, padding: "20px",
    position: "relative", overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  statCardGlow: {
    position: "absolute", top: -20, right: -20,
    width: 80, height: 80, borderRadius: "50%",
    filter: "blur(24px)", pointerEvents: "none",
  },
  statCardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  statCardIcon: { fontSize: 20 },
  statCardIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#1E2D3D", letterSpacing: "0.06em",
  },
  statValue: {
    fontSize: 40, fontWeight: 700, lineHeight: 1,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10, fontWeight: 600,
    letterSpacing: "0.12em",
    fontFamily: "'JetBrains Mono', monospace",
  },
  statBar: {
    position: "absolute", bottom: 0, left: 0,
    width: "100%", height: 2,
  },

  /* Table */
  tableCard: {
    background: "#0D1117",
    border: "1px solid rgba(0,212,255,0.08)",
    borderRadius: 10, overflow: "hidden",
    position: "relative",
  },
  tableGlowTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)",
  },
  tableHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)",
    flexWrap: "wrap", gap: 10,
  },
  tableTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, fontWeight: 700, color: "#CBD5E1", letterSpacing: "0.14em",
  },
  tableSubtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, marginTop: 4, letterSpacing: "0.08em",
  },
  tableCount: { color: "#00D4FF", marginRight: 4 },
  tableHeaderRight: { display: "flex", alignItems: "center", gap: 12 },
  liveIndicator: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#00FF9D", letterSpacing: "0.1em",
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#00FF9D", display: "inline-block",
    boxShadow: "0 0 6px #00FF9D",
  },

  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 20px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 600,
    color: "#2D3748", letterSpacing: "0.14em",
    textAlign: "left", background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.12s" },
  trHovered: { background: "rgba(0,212,255,0.03)" },
  td: { padding: "13px 20px", fontSize: 13, verticalAlign: "middle" },
  tdIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#2D3748", letterSpacing: "0.06em",
  },
  tdEmail: { color: "#4A5568", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },

  userCell: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "rgba(255,255,255,0.04)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700,
    position: "relative", flexShrink: 0,
  },
  avatarRing: {
    position: "absolute", inset: -2,
    borderRadius: "50%", border: "1px solid",
    opacity: 0.4,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "#CBD5E1" },
  userSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", marginTop: 2, letterSpacing: "0.04em",
  },

  badge: {
    display: "inline-flex", alignItems: "center",
    padding: "3px 9px", borderRadius: 4,
    fontSize: 9, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    background: "transparent", border: "1px solid",
    letterSpacing: "0.1em",
  },
  badgeDot: {
    width: 4, height: 4, borderRadius: "50%",
    display: "inline-block", marginRight: 5, flexShrink: 0,
  },

  deleteBtn: {
    padding: "5px 12px", borderRadius: 4,
    border: "1px solid rgba(255,77,109,0.2)",
    background: "rgba(255,77,109,0.05)",
    color: "#FF4D6D55",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  confirmWrap: { display: "flex", alignItems: "center", gap: 6 },
  confirmText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#FF4D6D", letterSpacing: "0.08em",
  },
  confirmYes: {
    padding: "4px 10px", borderRadius: 4, border: "1px solid #FF4D6D",
    background: "rgba(255,77,109,0.15)", color: "#FF4D6D",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
  },
  confirmNo: {
    padding: "4px 10px", borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#4A5568",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
  },

  emptyCell: { textAlign: "center", padding: "48px 20px" },
  emptyInner: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#2D3748", letterSpacing: "0.1em",
  },
  emptyIcon: { fontSize: 28, color: "#1E2D3D", marginBottom: 4 },

  tableFooter: {
    padding: "10px 24px",
    borderTop: "1px solid rgba(255,255,255,0.02)",
    background: "rgba(0,0,0,0.2)",
  },
  tableFooterText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#1E2D3D", letterSpacing: "0.1em",
  },
};