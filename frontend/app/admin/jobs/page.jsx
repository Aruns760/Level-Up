"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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


const STATUS_META = {
  pending:  { color: "#FBBF24", glow: "rgba(251,191,36,0.3)",   bg: "rgba(251,191,36,0.08)",  label: "PENDING"  },
  approved: { color: "#00FF9D", glow: "rgba(0,255,157,0.3)",    bg: "rgba(0,255,157,0.08)",   label: "APPROVED" },
  rejected: { color: "#FF4D6D", glow: "rgba(255,77,109,0.3)",   bg: "rgba(255,77,109,0.08)",  label: "REJECTED" },
};

const BASE_URL = "http://localhost:5000";

export default function AdminJobs() {
  const router = useRouter();
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [activeNav,  setActiveNav]  = useState("/admin/jobs");
  const [profile,    setProfile]    = useState(null);
  const [filter,     setFilter]     = useState("all"); // all | pending | approved | rejected
  const [search,     setSearch]     = useState("");
  const [tick,       setTick]       = useState(0);
  const [expandedJob, setExpandedJob] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* fetch profile */
  useEffect(() => {
    if (!token) return;
    api.get("/admin/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setProfile(r.data)).catch(() => {});
  }, [token]);

  /* fetch jobs */
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err.message);
      showToast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* action handler */
  const handleAction = async (id, type) => {
    try {
      if (type === "approve") {
        await api.put(`/admin/jobs/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Job approved successfully");
      } else if (type === "reject") {
        await api.put(`/admin/jobs/reject/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Job rejected", "warn");
      } else if (type === "delete") {
        await api.delete(`/admin/jobs/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setDeleteConfirm(null);
        showToast("Job removed from registry", "error");
      }
      fetchJobs();
    } catch (err) {
      console.error("ACTION ERROR:", err.response?.data || err.message);
      showToast("Action failed — please retry", "error");
    }
  };

  /* save edit */
  const saveEdit = async () => {
    try {
      await api.put(`/admin/jobs/edit/${editingJob.id}`, editingJob, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingJob(null);
      fetchJobs();
      showToast("Job record updated");
    } catch (err) {
      console.error("EDIT ERROR:", err.response?.data || err.message);
      showToast("Update failed", "error");
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const filtered = jobs.filter(j => {
    const matchesFilter = filter === "all" || j.status === filter;
    const matchesSearch =
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.recruiter?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all:      jobs.length,
    pending:  jobs.filter(j => j.status === "pending").length,
    approved: jobs.filter(j => j.status === "approved").length,
    rejected: jobs.filter(j => j.status === "rejected").length,
  };

  /* ── LOADING ── */
  if (loading) return (
    <div style={S.loadingWrap}>
      <style>{CSS}</style>
      <div style={S.loadingInner}>
        <div style={S.loadingRing} />
        <div style={S.loadingRingInner} />
        <span style={S.loadingText}>LOADING JOB REGISTRY</span>
        <span style={S.loadingSubtext}>Fetching all records…</span>
      </div>
    </div>
  );

  return (
    <div style={S.layout}>
      <style>{CSS}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          ...S.toast,
          ...(toast.type === "error" ? S.toastError : toast.type === "warn" ? S.toastWarn : {}),
        }} className="toast-in">
          <span>{toast.type === "error" ? "✕" : toast.type === "warn" ? "⚠" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarGlowLine} />

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

        <div style={S.clockBox}>
          <div style={S.clockTime}>{timeStr}</div>
          <div style={S.clockDate}>{dateStr}</div>
        </div>

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

        <div style={S.systemStatus}>
          <div style={S.statusRow}><span style={S.statusDot} />SYS ONLINE</div>
          <div style={S.statusRow}><span style={{ ...S.statusDot, background: "#00FF9D" }} />DB CONNECTED</div>
        </div>

        <button onClick={handleLogout} style={S.logoutBtn} className="logout-btn">
          <span>⏻</span> LOGOUT
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>

        {/* Topbar */}
        <header style={S.topbar}>
          <div>
            <div style={S.breadcrumb}>
              <span style={S.breadcrumbRoot}>SYSTEM</span>
              <span style={S.breadcrumbSep}>/</span>
              <span style={S.breadcrumbCurrent}>JOB REGISTRY</span>
            </div>
            <h1 style={S.pageTitle}>Job Approval Console</h1>
          </div>
          <div style={S.topbarRight}>
            <div style={S.searchWrap}>
              <span style={S.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search jobs, companies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={S.searchInput}
              />
            </div>
            <div style={S.topbarAvatarWrap}>
              {profile?.image
                ? <img src={`${BASE_URL}${profile.image}`} style={S.topbarAvatar} alt="admin" />
                : <div style={S.topbarAvatarFallback}>{(profile?.name || "A")[0].toUpperCase()}</div>
              }
              <div style={S.topbarOnline} />
            </div>
          </div>
        </header>

        <div style={S.content}>

          {/* ── Stats Row ── */}
          <div style={S.statsRow}>
            {[
              { key: "all",      label: "TOTAL",    color: "#A78BFA" },
              { key: "pending",  label: "PENDING",  color: "#FBBF24" },
              { key: "approved", label: "APPROVED", color: "#00FF9D" },
              { key: "rejected", label: "REJECTED", color: "#FF4D6D" },
            ].map(s => (
              <div
                key={s.key}
                style={{ ...S.statPill, ...(filter === s.key ? { ...S.statPillActive, borderColor: s.color, color: s.color } : {}) }}
                onClick={() => setFilter(s.key)}
                className="stat-pill"
              >
                <span style={{ ...S.statPillDot, background: s.color, boxShadow: filter === s.key ? `0 0 6px ${s.color}` : "none" }} />
                <span style={S.statPillLabel}>{s.label}</span>
                <span style={{ ...S.statPillCount, color: filter === s.key ? s.color : "#4A5568" }}>{counts[s.key]}</span>
              </div>
            ))}
          </div>

          {/* ── Jobs List ── */}
          {filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>◈</div>
              <div style={S.emptyTitle}>NO JOBS FOUND</div>
              <div style={S.emptyDesc}>No records match current filter parameters</div>
            </div>
          ) : (
            <div style={S.jobsList}>
              {filtered.map((job, idx) => {
                const sm = STATUS_META[job.status] || STATUS_META.pending;
                const isEditing  = editingJob?.id === job.id;
                const isExpanded = expandedJob === job.id;
                const isDeletingThis = deleteConfirm === job.id;

                return (
                  <div
                    key={job.id}
                    style={{ ...S.jobCard, "--status-color": sm.color, "--status-glow": sm.glow }}
                    className="job-card"
                  >
                    {/* Top glow bar colored by status */}
                    <div style={{ ...S.jobCardBar, background: sm.color, boxShadow: `0 0 12px ${sm.glow}` }} />

                    {isEditing ? (
                      /* ── Edit Mode ── */
                      <div style={S.editMode}>
                        <div style={S.editModeHeader}>
                          <span style={S.editModeTitle}>EDITING RECORD</span>
                          <span style={S.editModeId}>ID: {job.id}</span>
                        </div>

                        <div style={S.editGrid}>
                          {[
                            { key: "title",    label: "JOB TITLE",   icon: "◈", type: "text"   },
                            { key: "location", label: "LOCATION",    icon: "⊕", type: "text"   },
                            { key: "salary",   label: "SALARY (₹)",  icon: "◎", type: "text"   },
                          ].map(field => (
                            <div key={field.key} style={S.editField}>
                              <label style={S.editLabel}>
                                <span style={S.editLabelIcon}>{field.icon}</span>
                                {field.label}
                              </label>
                              <div style={S.editInputWrap} className="input-wrap">
                                <input
                                  type={field.type}
                                  value={editingJob[field.key] || ""}
                                  onChange={e => setEditingJob({ ...editingJob, [field.key]: e.target.value })}
                                  style={S.editInput}
                                />
                              </div>
                            </div>
                          ))}

                          <div style={S.editField}>
                            <label style={S.editLabel}>
                              <span style={S.editLabelIcon}>≡</span>
                              DESCRIPTION
                            </label>
                            <div style={{ ...S.editInputWrap, padding: 0 }} className="input-wrap">
                              <textarea
                                value={editingJob.description || ""}
                                onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                                style={{ ...S.editInput, minHeight: 80, padding: "10px 14px", resize: "vertical" }}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={S.editActions}>
                          <button onClick={saveEdit} style={S.editSaveBtn} className="save-btn">
                            ⊕ COMMIT CHANGES
                          </button>
                          <button onClick={() => setEditingJob(null)} style={S.editCancelBtn} className="cancel-btn">
                            ✕ ABORT
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <>
                        <div style={S.jobCardMain}>
                          {/* Index + Status */}
                          <div style={S.jobCardMeta}>
                            <span style={S.jobCardIndex}>{String(idx + 1).padStart(2, "0")}</span>
                            <span style={{
                              ...S.statusBadge,
                              color: sm.color,
                              borderColor: sm.color,
                              background: sm.bg,
                              boxShadow: `0 0 8px ${sm.glow}`,
                            }}>
                              <span style={{ ...S.statusDotSmall, background: sm.color, boxShadow: `0 0 4px ${sm.color}` }} />
                              {sm.label}
                            </span>
                          </div>

                          {/* Title + Company */}
                          <div style={S.jobCardInfo}>
                            <h3 style={S.jobTitle}>{job.title}</h3>
                            <div style={S.jobCompany}>
                              <span style={S.jobCompanyIcon}>⊞</span>
                              {job.recruiter?.companyName || "Unknown Company"}
                            </div>
                          </div>

                          {/* Details row */}
                          <div style={S.jobDetails}>
                            <div style={S.jobDetailItem}>
                              <span style={S.jobDetailIcon}>⊕</span>
                              <span>{job.location || "Remote"}</span>
                            </div>
                            <div style={S.jobDetailItem}>
                              <span style={S.jobDetailIcon}>◎</span>
                              <span>₹{job.salary || "Negotiable"}</span>
                            </div>
                          </div>

                          {/* Description (expandable) */}
                          {job.description && (
                            <div style={S.descriptionBox}>
                              <p style={{
                                ...S.descriptionText,
                                ...(isExpanded ? {} : S.descriptionClamped),
                              }}>
                                {job.description}
                              </p>
                              <button
                                style={S.expandBtn}
                                onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                              >
                                {isExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
                              </button>
                            </div>
                          )}

                          {/* Actions */}
                          <div style={S.actionRow}>
                            {job.status === "pending" && (
                              <>
                                <button
                                  style={S.approveBtn}
                                  className="approve-btn"
                                  onClick={() => handleAction(job.id, "approve")}
                                >
                                  ✓ APPROVE
                                </button>
                                <button
                                  style={S.rejectBtn}
                                  className="reject-btn"
                                  onClick={() => handleAction(job.id, "reject")}
                                >
                                  ✕ REJECT
                                </button>
                              </>
                            )}

                            <button
                              style={S.editBtn}
                              className="edit-btn"
                              onClick={() => setEditingJob(job)}
                            >
                              ✎ EDIT
                            </button>

                            {isDeletingThis ? (
                              <div style={S.confirmRow}>
                                <span style={S.confirmLabel}>CONFIRM DELETE?</span>
                                <button
                                  style={S.confirmYes}
                                  onClick={() => handleAction(job.id, "delete")}
                                >YES</button>
                                <button
                                  style={S.confirmNo}
                                  onClick={() => setDeleteConfirm(null)}
                                >NO</button>
                              </div>
                            ) : (
                              <button
                                style={S.deleteBtn}
                                className="delete-btn"
                                onClick={() => setDeleteConfirm(job.id)}
                              >
                                ⊘ REMOVE
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.footer}>
            <span style={S.footerText}>
              END OF REGISTRY // {filtered.length}/{jobs.length} RECORDS DISPLAYED
            </span>
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

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes spin-rev { to { transform: rotate(-360deg); } }
  @keyframes glow-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes toast-in   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes card-in    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .toast-in { animation: toast-in 0.25s ease; }
  .job-card { animation: card-in 0.3s ease both; }

  .nav-item:hover    { background: rgba(0,212,255,0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover  { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .stat-pill:hover   { border-color: rgba(0,212,255,0.3) !important; background: rgba(0,212,255,0.04) !important; }
  .job-card:hover    { border-color: rgba(0,212,255,0.15) !important; }
  .approve-btn:hover { background: #00FF9D !important; color: #0A0E1A !important; box-shadow: 0 0 16px rgba(0,255,157,0.4) !important; }
  .reject-btn:hover  { background: #FBBF24 !important; color: #0A0E1A !important; box-shadow: 0 0 16px rgba(251,191,36,0.4) !important; }
  .edit-btn:hover    { background: rgba(0,212,255,0.15) !important; border-color: #00D4FF !important; color: #00D4FF !important; }
  .delete-btn:hover  { background: rgba(255,77,109,0.15) !important; border-color: #FF4D6D !important; color: #FF4D6D !important; }
  .save-btn:hover    { background: #00D4FF !important; color: #0A0E1A !important; box-shadow: 0 0 20px rgba(0,212,255,0.35) !important; }
  .cancel-btn:hover  { background: rgba(255,255,255,0.06) !important; color: #CBD5E1 !important; }
  .input-wrap:focus-within { border-color: rgba(0,212,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important; }
`;

/* ─── Styles ─── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh",
    background: "#060912",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: "#CBD5E1",
  },

  loadingWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#060912",
  },
  loadingInner: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12, position: "relative",
  },
  loadingRing: {
    width: 60, height: 60, borderRadius: "50%",
    border: "2px solid rgba(0,212,255,0.15)", borderTopColor: "#00D4FF",
    animation: "spin 0.9s linear infinite",
  },
  loadingRingInner: {
    position: "absolute", top: 10, left: 10,
    width: 40, height: 40, borderRadius: "50%",
    border: "2px solid rgba(167,139,250,0.15)", borderBottomColor: "#A78BFA",
    animation: "spin-rev 0.6s linear infinite",
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#00D4FF", marginTop: 16, letterSpacing: "0.18em",
  },
  loadingSubtext: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#4A5568", letterSpacing: "0.1em",
  },

  /* Toast */
  toast: {
    position: "fixed", top: 20, right: 20, zIndex: 999,
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(0,255,157,0.12)",
    border: "1px solid rgba(0,255,157,0.3)",
    borderRadius: 8, padding: "12px 18px",
    fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
    color: "#00FF9D", letterSpacing: "0.06em",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  toastError: {
    background: "rgba(255,77,109,0.12)",
    border: "1px solid rgba(255,77,109,0.3)",
    color: "#FF4D6D",
  },
  toastWarn: {
    background: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.3)",
    color: "#FBBF24",
  },

  /* Sidebar */
  sidebar: {
    width: 260, minHeight: "100vh",
    background: "linear-gradient(180deg, #0D1117 0%, #0A0E1A 100%)",
    borderRight: "1px solid rgba(0,212,255,0.1)",
    display: "flex", flexDirection: "column",
    padding: "24px 16px 20px",
    position: "relative", overflow: "hidden", flexShrink: 0,
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
  logoName: { fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", color: "#E2E8F0" },
  logoAccent: { color: "#00D4FF" },
  logoVersion: {
    fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
    color: "#2D3748", letterSpacing: "0.1em", marginTop: 2,
  },
  clockBox: {
    background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: 6, padding: "8px 12px", marginBottom: 16,
  },
  clockTime: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 22, fontWeight: 700, color: "#00D4FF", letterSpacing: "0.05em",
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
    position: "relative", transition: "all 0.15s ease", letterSpacing: "0.04em",
  },
  navItemActive: {
    background: "rgba(0,212,255,0.08)", color: "#00D4FF",
    borderLeft: "2px solid #00D4FF",
  },
  navGlyph: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2D3748", minWidth: 16 },
  navIcon:  { fontSize: 14, minWidth: 16, textAlign: "center" },
  navLabel: { flex: 1 },
  navActiveBar: {
    position: "absolute", right: 12,
    width: 5, height: 5, borderRadius: "50%",
    background: "#00D4FF", boxShadow: "0 0 6px #00D4FF",
  },
  systemStatus: {
    margin: "12px 0", padding: "10px 12px",
    background: "rgba(0,255,157,0.03)", border: "1px solid rgba(0,255,157,0.08)", borderRadius: 6,
  },
  statusRow: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
    color: "#2D4A38", letterSpacing: "0.08em", marginBottom: 4,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#00D4FF", display: "inline-block", flexShrink: 0,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
    color: "#4A5568", padding: "9px 14px", borderRadius: 6,
    cursor: "pointer", fontSize: 11, fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "0.1em", transition: "all 0.15s", width: "100%",
  },

  /* Main */
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    background: "rgba(10,14,26,0.95)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,212,255,0.08)",
    padding: "14px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    position: "sticky", top: 0, zIndex: 50,
  },
  breadcrumb: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
    letterSpacing: "0.1em", marginBottom: 4,
  },
  breadcrumbRoot:    { color: "#2D3748" },
  breadcrumbSep:     { color: "#1A2535" },
  breadcrumbCurrent: { color: "#00D4FF" },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.01em" },
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
  topbarAvatarWrap: { position: "relative" },
  topbarAvatar: {
    width: 38, height: 38, borderRadius: "50%", objectFit: "cover",
    border: "1px solid rgba(0,212,255,0.3)",
  },
  topbarAvatarFallback: {
    width: 38, height: 38, borderRadius: "50%",
    background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#00D4FF", fontWeight: 700, fontSize: 14,
  },
  topbarOnline: {
    position: "absolute", bottom: 1, right: 1,
    width: 8, height: 8, borderRadius: "50%",
    background: "#00FF9D", border: "1.5px solid #060912", boxShadow: "0 0 5px #00FF9D",
  },

  /* Content */
  content: { padding: "24px 28px", flex: 1, overflowY: "auto" },

  /* Stats filter row */
  statsRow: {
    display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap",
  },
  statPill: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer", transition: "all 0.15s",
  },
  statPillActive: {
    background: "rgba(0,212,255,0.04)",
  },
  statPillDot: {
    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
  },
  statPillLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, letterSpacing: "0.1em", color: "#4A5568",
  },
  statPillCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, fontWeight: 700,
  },

  /* Empty state */
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 20px", gap: 10,
  },
  emptyIcon:  { fontSize: 40, color: "#1E2D3D" },
  emptyTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13, color: "#2D3748", letterSpacing: "0.14em",
  },
  emptyDesc: { fontSize: 13, color: "#1E2D3D" },

  /* Jobs list */
  jobsList: { display: "flex", flexDirection: "column", gap: 12 },

  jobCard: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10, overflow: "hidden",
    position: "relative", transition: "border-color 0.2s",
  },
  jobCardBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
  },

  jobCardMain: { padding: "18px 22px 16px" },

  jobCardMeta: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
  },
  jobCardIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#2D3748", letterSpacing: "0.06em",
  },
  statusBadge: {
    display: "inline-flex", alignItems: "center",
    padding: "3px 10px", borderRadius: 4,
    fontSize: 9, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    border: "1px solid", letterSpacing: "0.1em",
  },
  statusDotSmall: {
    width: 4, height: 4, borderRadius: "50%",
    display: "inline-block", marginRight: 5, flexShrink: 0,
  },

  jobCardInfo: { marginBottom: 12 },
  jobTitle: {
    fontSize: 17, fontWeight: 700, color: "#E2E8F0", marginBottom: 5,
    letterSpacing: "-0.01em",
  },
  jobCompany: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#4A5568",
    fontFamily: "'JetBrains Mono', monospace",
  },
  jobCompanyIcon: { fontSize: 11 },

  jobDetails: {
    display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap",
  },
  jobDetailItem: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "#4A5568",
    fontFamily: "'JetBrains Mono', monospace",
  },
  jobDetailIcon: { fontSize: 11, color: "#2D3748" },

  descriptionBox: { marginBottom: 16 },
  descriptionText: {
    fontSize: 13, color: "#4A5568", lineHeight: 1.6,
  },
  descriptionClamped: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  expandBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.1em",
    padding: "4px 0", marginTop: 4,
  },

  actionRow: {
    display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
    paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.03)",
  },

  approveBtn: {
    padding: "7px 14px", borderRadius: 6,
    border: "1px solid rgba(0,255,157,0.3)",
    background: "rgba(0,255,157,0.06)",
    color: "#00FF9D",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  rejectBtn: {
    padding: "7px 14px", borderRadius: 6,
    border: "1px solid rgba(251,191,36,0.3)",
    background: "rgba(251,191,36,0.05)",
    color: "#FBBF24",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  editBtn: {
    padding: "7px 14px", borderRadius: 6,
    border: "1px solid rgba(0,212,255,0.15)",
    background: "rgba(0,212,255,0.03)",
    color: "#00D4FF55",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  deleteBtn: {
    padding: "7px 14px", borderRadius: 6,
    border: "1px solid rgba(255,77,109,0.15)",
    background: "rgba(255,77,109,0.03)",
    color: "#FF4D6D44",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  confirmRow: {
    display: "flex", alignItems: "center", gap: 6, marginLeft: 4,
  },
  confirmLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#FF4D6D", letterSpacing: "0.08em",
  },
  confirmYes: {
    padding: "5px 10px", borderRadius: 4,
    border: "1px solid #FF4D6D",
    background: "rgba(255,77,109,0.15)", color: "#FF4D6D",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
  },
  confirmNo: {
    padding: "5px 10px", borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#4A5568",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
  },

  /* Edit mode */
  editMode: { padding: "18px 22px 20px" },
  editModeHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  editModeTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#00D4FF", letterSpacing: "0.14em",
  },
  editModeId: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.06em",
  },
  editGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16, marginBottom: 20,
  },
  editField: { display: "flex", flexDirection: "column", gap: 7 },
  editLabel: {
    display: "flex", alignItems: "center", gap: 7,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#4A5568", letterSpacing: "0.12em",
  },
  editLabelIcon: { fontSize: 11, color: "#2D3748" },
  editInputWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0 14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  editInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#CBD5E1", fontSize: 13, padding: "11px 0",
    fontFamily: "'Space Grotesk', sans-serif", width: "100%",
  },
  editActions: { display: "flex", gap: 10 },
  editSaveBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 7,
    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.3)",
    color: "#00D4FF", fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
    transition: "all 0.2s",
  },
  editCancelBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 7,
    background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
    color: "#4A5568", fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
    transition: "all 0.2s",
  },

  footer: {
    marginTop: 24, paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.03)",
  },
  footerText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#1E2D3D", letterSpacing: "0.1em",
  },
};