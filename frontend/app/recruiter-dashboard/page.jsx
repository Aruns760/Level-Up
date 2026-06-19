"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../lib/api";
import AnalyticsChart from "../components/AnalyticsChart";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

const STAT_CONFIG = [
  { key: "totalJobs",         label: "Active Jobs",       accent: "#6366F1", bg: "#EEF2FF", icon: "◈" },
  { key: "totalApplications", label: "Applications",      accent: "#10B981", bg: "#ECFDF5", icon: "◉" },
  { key: "shortlisted",       label: "Shortlisted",       accent: "#F59E0B", bg: "#FFFBEB", icon: "★" },
  { key: "hiredThisMonth",    label: "Hired This Month",  accent: "#3B82F6", bg: "#EFF6FF", icon: "✓" },
];

export default function RecruiterDashboard() {
  const router   = useRouter();
  const pathname = usePathname();

  const [stats,   setStats]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState({ name: "", email: "" });
  const [image,   setImage]   = useState("");
  const [activeNav, setActiveNav] = useState("/recruiter-dashboard");

  useEffect(() => {
  const loadData = async () => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    // 🔒 Check auth
    if (!token || role !== "recruiter") {
      router.push("/login");
      return;
    }

    // 👤 Set user info
    setUser({
      name: localStorage.getItem("name") || "Recruiter",
      email: localStorage.getItem("email") || "",
    });

    const storedImage = localStorage.getItem("image");
    if (storedImage && storedImage !== "null") {
      setImage(storedImage);
    }

    try {
      // ✅ FIXED API URL
          const profileRes = await api.get("/recruiter/profile", {
          headers: { Authorization: `Bearer ${token}` },
      });

      // ⚠️ If profile not created
      if (!profileRes.data) {
        router.push("/recruiter-profile");
        return;
      }

      setProfile(profileRes.data);
            const userRes = await api.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userRes.data?.image) {
        setImage(userRes.data.image);
        localStorage.setItem("image", userRes.data.image);
      }
      // 📊 Load dashboard stats
      const statsRes = await api.get("/jobs/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(statsRes.data);

    } catch (error) {
      console.error("DASHBOARD ERROR:", error);

      // 🔁 Handle profile missing or 404
      if (error.response?.status === 404) {
        router.push("/recruiter-profile");
      }

      // 🔒 Unauthorized
      if (error.response?.status === 401) {
        localStorage.clear();
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [router]);

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const initials = (name = "") =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "R";

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={{ color: "#6B7280", marginTop: 12, fontSize: 14 }}>Loading dashboard…</p>
    </div>
  );

  const firstName = user.name.split(" ")[0];
  const statValues = {
    totalJobs:         stats?.totalJobs         ?? 0,
    totalApplications: stats?.totalApplications ?? 0,
    shortlisted:       stats?.shortlisted        ?? 0,
    hiredThisMonth:    stats?.hiredThisMonth     ?? 0,
  };

  return (
    <div style={S.layout}>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}>R</div>
          <span style={S.logoText}>RΣCRUITER</span>
        </div>

        <p style={S.navSection}>Main Menu</p>
        <nav>
          {NAV_ITEMS.map(item => {
            const isActive = activeNav === item.path;
            return (
              <div
                key={item.path}
                onClick={() => { setActiveNav(item.path); router.push(item.path); }}
                style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}
              >
                <span style={S.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <div style={S.activeDot} />}
              </div>
            );
          })}
        </nav>

        <div style={S.sidebarFooter}>
          <div style={S.sidebarUser}>
            <div style={S.sidebarAvatar}>{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <p style={S.sidebarName}>{user.name}</p>
              <p style={S.sidebarEmail}>{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={S.logoutBtn}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* Topbar */}
        <header style={S.topbar}>
          <div>
            <h1 style={S.pageTitle}>Dashboard</h1>
            <p style={S.pageSub}>Welcome back, {firstName}! Heres whats happening.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/post-job")}
              style={S.postJobBtn}
            >
              + Post a Job
            </button>
            <button onClick={handleLogout} style={S.topbarLogout}>
              ⎋ Logout
            </button>
          </div>
        </header>

        <div style={S.content}>

          {/* Profile Banner */}
          <div style={S.profileBanner}>
            <div style={S.bannerLeft}>
              {image ? (
                <img
                  src={`http://localhost:3000${image}`}
                  alt="Profile"
                  style={S.profileImg}
                  onError={() => setImage("")}
                />
              ) : (
                <div style={S.profileInitials}>{initials(user.name)}</div>
              )}
              <div>
                <p style={S.profileName}>{user.name}</p>
                <p style={S.profileEmail}>{user.email}</p>
                <span style={S.roleBadge}>Recruiter</span>
              </div>
            </div>
            <div style={S.bannerDivider} />
            <div style={S.companyBlock}>
              <p style={S.companyLabel}>Company</p>
              <p style={S.companyName}>{profile?.companyName || "—"}</p>
              <a
                href={profile?.companyWebsite || "#"}
                target="_blank"
                rel="noreferrer"
                style={S.companyLink}
              >
                {profile?.companyWebsite || "No website"}
              </a>
            </div>
            <button
              onClick={() => router.push("/recruiter-profile")}
              style={S.editProfileBtn}
            >
              Edit Profile
            </button>
          </div>

          {/* Stat Cards */}
          <div style={S.statsGrid}>
            {STAT_CONFIG.map(cfg => (
              <div key={cfg.key} style={{ ...S.statCard, background: cfg.bg }}>
                <div style={{ ...S.statBar, background: cfg.accent }} />
                <div style={{ ...S.statIconWrap, background: cfg.accent + "22", color: cfg.accent }}>
                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                </div>
                <p style={{ ...S.statLabel, color: cfg.accent }}>{cfg.label}</p>
                <p style={{ ...S.statVal, color: cfg.accent }}>{statValues[cfg.key]}</p>
              </div>
            ))}
          </div>

          {/* Two-column row: Quick Actions + Activity */}
          <div style={S.twoCol}>

            {/* Quick Actions */}
            <div style={S.card}>
              <p style={S.cardTitle}>Quick actions</p>
              <div style={S.actionGrid}>
                {[
                  { label: "My Jobs",      path: "/recruiter-jobs",     color: "#6366F1", bg: "#EEF2FF" },
                  { label: "Post a Job",   path: "/post-job",           color: "#10B981", bg: "#ECFDF5" },
                  { label: "Browse Jobs",  path: "/jobs",               color: "#3B82F6", bg: "#EFF6FF" },
                  { label: "Edit Profile", path: "/recruiter-profile",  color: "#F59E0B", bg: "#FFFBEB" },
                ].map(a => (
                  <button
                    key={a.path}
                    onClick={() => router.push(a.path)}
                    style={{ ...S.actionBtn, background: a.bg, color: a.color, border: `1px solid ${a.color}33` }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={S.card}>
              <p style={S.cardTitle}>Recent activity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { text: "3 new applications on Senior Dev",  time: "2m ago",  dot: "#10B981" },
                  { text: "Job 'UX Designer' approved",        time: "1h ago",  dot: "#6366F1" },
                  { text: "Candidate shortlisted for PM role", time: "3h ago",  dot: "#F59E0B" },
                  { text: "New message from candidate",        time: "Yesterday", dot: "#3B82F6" },
                ].map((item, i) => (
                  <div key={i} style={S.activityRow}>
                    <span style={{ ...S.activityDot, background: item.dot }} />
                    <span style={S.activityText}>{item.text}</span>
                    <span style={S.activityTime}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Analytics Chart */}
          <div style={S.card}>
            <p style={S.cardTitle}>Analytics overview</p>
            <AnalyticsChart
              jobs={statValues.totalJobs}
              applications={statValues.totalApplications}
            />
          </div>

        </div>
      </main>
    </div>
  );
}

/* ── Styles ── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh",
    background: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#F8FAFC",
  },
  spinner: {
    width: 36, height: 36, borderRadius: "50%",
    border: "3px solid #E5E7EB", borderTopColor: "#6366F1",
    animation: "spin 0.8s linear infinite",
  },

  /* Sidebar */
  sidebar: {
    width: 240, background: "#0F172A", color: "#CBD5E1",
    display: "flex", flexDirection: "column",
    padding: "24px 16px", boxSizing: "border-box",
    minHeight: "100vh", position: "sticky", top: 0, alignSelf: "flex-start",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoMark: {
    width: 34, height: 34, borderRadius: 8, background: "#6366F1",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 16,
  },
  logoText: { fontSize: 16, fontWeight: 600, color: "#F1F5F9" },
  navSection: {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "#475569", marginBottom: 8,
  },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 8,
    cursor: "pointer", fontSize: 13, color: "#94A3B8",
    marginBottom: 3, position: "relative",
  },
  navItemActive: { background: "#1E293B", color: "#F1F5F9" },
  navIcon: { fontSize: 14, width: 18, textAlign: "center" },
  activeDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#6366F1", marginLeft: "auto",
  },
  sidebarFooter: { marginTop: "auto", paddingTop: 16 },
  sidebarUser: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 10px", background: "#1E293B",
    borderRadius: 8, marginBottom: 10, overflow: "hidden",
  },
  sidebarAvatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: "#6366F1", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 600, flexShrink: 0,
  },
  sidebarName:  { fontSize: 12, fontWeight: 600, color: "#F1F5F9", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sidebarEmail: { fontSize: 11, color: "#64748B", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  logoutBtn: {
    width: "100%", background: "transparent",
    border: "1px solid #334155", color: "#94A3B8",
    padding: "8px 14px", borderRadius: 8,
    cursor: "pointer", fontSize: 13, textAlign: "left",
  },

  /* Main */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: {
    background: "#fff", borderBottom: "1px solid #E2E8F0",
    padding: "16px 28px", display: "flex",
    justifyContent: "space-between", alignItems: "center",
    position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap", gap: 10,
  },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 },
  pageSub:   { fontSize: 12, color: "#94A3B8", margin: "2px 0 0" },
  postJobBtn: {
    padding: "8px 16px", borderRadius: 8,
    background: "#6366F1", color: "#fff",
    border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  topbarLogout: {
    padding: "8px 14px", borderRadius: 8,
    background: "#FEF2F2", color: "#DC2626",
    border: "1px solid #FECACA", fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  content: { padding: 24, display: "flex", flexDirection: "column", gap: 20 },

  /* Profile Banner */
  profileBanner: {
    background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 12, padding: "20px 24px",
    display: "flex", alignItems: "center",
    gap: 20, flexWrap: "wrap",
  },
  bannerLeft: { display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 200 },
  profileImg: { width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #E2E8F0" },
  profileInitials: {
    width: 56, height: 56, borderRadius: "50%",
    background: "#EEF2FF", color: "#6366F1",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 700, flexShrink: 0,
  },
  profileName:  { fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 },
  profileEmail: { fontSize: 13, color: "#64748B", margin: "2px 0 6px" },
  roleBadge: {
    fontSize: 11, fontWeight: 600, padding: "2px 10px",
    borderRadius: 20, background: "#EEF2FF", color: "#6366F1",
  },
  bannerDivider: { width: 1, height: 52, background: "#E2E8F0", flexShrink: 0 },
  companyBlock: { flex: 1, minWidth: 160 },
  companyLabel: { fontSize: 10, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" },
  companyName:  { fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" },
  companyLink:  { fontSize: 12, color: "#6366F1", textDecoration: "none" },
  editProfileBtn: {
    padding: "8px 16px", borderRadius: 8,
    background: "#F8FAFC", color: "#374151",
    border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 500, cursor: "pointer",
    whiteSpace: "nowrap",
  },

  /* Stats */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
  },
  statCard: {
    borderRadius: 12, padding: "16px 18px 14px",
    position: "relative", overflow: "hidden",
    border: "1px solid transparent",
  },
  statBar: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: 3, borderRadius: "12px 12px 0 0",
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 10, marginTop: 6,
  },
  statLabel: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 4px" },
  statVal:   { fontSize: 32, fontWeight: 700, margin: 0 },

  /* Two-column row */
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
  },

  /* Card */
  card: {
    background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 12, padding: "20px 22px",
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" },

  /* Quick Actions */
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionBtn: {
    padding: "10px 14px", borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    textAlign: "center",
  },

  /* Activity */
  activityRow: {
    display: "flex", alignItems: "center",
    gap: 10, padding: "8px 0",
    borderBottom: "1px solid #F1F5F9",
  },
  activityDot:  { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  activityText: { fontSize: 13, color: "#374151", flex: 1 },
  activityTime: { fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" },
};