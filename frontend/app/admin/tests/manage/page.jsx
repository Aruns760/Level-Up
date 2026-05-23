"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⊞", glyph: "01" },
  { label: "Profile", path: "/admin/profile", icon: "◯", glyph: "02" },
  { label: "Job Approval", path: "/admin/jobs", icon: "✓", glyph: "03" },
  { label: "Create Test", path: "/admin/tests/create", icon: "+", glyph: "04" },
  { label: "Manage Tests", path: "/admin/tests/manage", icon: "≡", glyph: "05" },
  { label: "Questions", path: "/admin/questions", icon: "?", glyph: "06" },
];

const DIFFICULTY_META = {
  easy:   { color: "#00FF9D", label: "EASY"   },
  medium: { color: "#FBBF24", label: "MEDIUM" },
  hard:   { color: "#FF4D6D", label: "HARD"   },
};

const CATEGORY_META = {
  aptitude:  { icon: "◈", color: "#A78BFA" },
  reasoning: { icon: "⌗", color: "#00D4FF" },
  maths:     { icon: "∑", color: "#FBBF24" },
  coding:    { icon: "⌨", color: "#00FF9D" },
};

const BASE_URL = "http://localhost:5000";

export default function ManageTestsPage() {
  const router = useRouter();
  const [tests,     setTests]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all"); // all | active | inactive
  const [profile,   setProfile]   = useState(null);
  const [activeNav, setActiveNav] = useState("/admin/tests");
  const [mounted,   setMounted]   = useState(false);
  const [time,      setTime]      = useState({ timeStr: "", dateStr: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* live clock */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        timeStr: now.toLocaleTimeString("en-US", { hour12: false }),
        dateStr: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    update();
    setMounted(true);
    const id = setInterval(update, 1000);
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
    const token = getToken();
    if (!token) return;
    axios.get(`${BASE_URL}/api/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setProfile(r.data)).catch(() => {});
  }, []);

  /* fetch tests */
  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/api/tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(res.data);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err);
      showToast("Failed to load tests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const token = getToken();
    if (!token) return;
    axios.get(`${BASE_URL}/api/tests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!ignore) { setTests(r.data); setLoading(false); } })
      .catch(err => { console.error(err); setLoading(false); });
    return () => { ignore = true; };
  }, []);

  /* update */
  const updateTest = async () => {
    try {
      const token = getToken();
      await axios.put(`${BASE_URL}/api/tests/edit/${editDraft.id}`, editDraft, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Test record updated");
      setEditingId(null);
      setEditDraft({});
      fetchTests();
    } catch (err) {
      console.error(err);
      showToast("Update failed", "error");
    }
  };

  /* toggle active */
  const toggleTest = async (id, isActive) => {
    try {
      const token = getToken();
      await axios.put(`${BASE_URL}/api/tests/toggle/${id}`, { isActive: !isActive }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(isActive ? "Test deactivated" : "Test activated", isActive ? "warn" : "success");
      fetchTests();
    } catch (err) {
      console.error(err);
      showToast("Toggle failed", "error");
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditDraft({ ...t });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const { timeStr, dateStr } = time;

  const filtered = tests.filter(t => {
    const matchFilter =
      filter === "all" ||
      (filter === "active" && t.isActive) ||
      (filter === "inactive" && !t.isActive);
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:      tests.length,
    active:   tests.filter(t => t.isActive).length,
    inactive: tests.filter(t => !t.isActive).length,
  };

  /* ── LOADING ── */
  if (loading) return (
    <div style={S.loadingWrap}>
      <style>{CSS}</style>
      <div style={S.loadingInner}>
        <div style={S.loadingRing} />
        <div style={S.loadingRingInner} />
        <span style={S.loadingText}>LOADING TEST REGISTRY</span>
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
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#00D4FF" strokeWidth="1.5"/>
            <polygon points="18,8 26,13 26,23 18,28 10,23 10,13" fill="rgba(0,212,255,0.12)" stroke="#00D4FF" strokeWidth="0.8"/>
            <text x="18" y="22" textAnchor="middle" fill="#00D4FF" fontSize="11" fontWeight="700" fontFamily="monospace">A</text>
          </svg>
          <div>
            <div style={S.logoName}>ADMIN<span style={S.logoAccent}>HUB</span></div>
            <div style={S.logoVersion}>v3.0.1 // SECURE</div>
          </div>
        </div>

        <div style={S.clockBox}>
          <div style={S.clockTime}>{mounted ? timeStr : "--:--:--"}</div>
          <div style={S.clockDate}>{mounted ? dateStr : "--- --- --"}</div>
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
              <span style={S.breadcrumbCurrent}>TEST REGISTRY</span>
            </div>
            <h1 style={S.pageTitle}>Manage Mock Tests</h1>
          </div>
          <div style={S.topbarRight}>
            <div style={S.searchWrap}>
              <span style={S.searchIcon}>⌕</span>
              <input
                type="text"
                placeholder="Search title, category…"
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

          {/* ── Filter pills + quick create ── */}
          <div style={S.controlRow}>
            <div style={S.filterPills}>
              {[
                { key: "all",      label: "ALL",      color: "#A78BFA" },
                { key: "active",   label: "ACTIVE",   color: "#00FF9D" },
                { key: "inactive", label: "INACTIVE", color: "#FF4D6D" },
              ].map(f => (
                <div
                  key={f.key}
                  style={{
                    ...S.pill,
                    ...(filter === f.key ? { ...S.pillActive, borderColor: f.color, color: f.color } : {}),
                  }}
                  onClick={() => setFilter(f.key)}
                  className="pill"
                >
                  <span style={{ ...S.pillDot, background: f.color, boxShadow: filter === f.key ? `0 0 6px ${f.color}` : "none" }} />
                  {f.label}
                  <span style={{ ...S.pillCount, color: filter === f.key ? f.color : "#4A5568" }}>
                    {counts[f.key]}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/admin/tests/create")}
              style={S.createBtn}
              className="create-btn"
            >
              ⊕ NEW TEST
            </button>
          </div>

          {/* ── Empty state ── */}
          {filtered.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>◈</div>
              <div style={S.emptyTitle}>NO TESTS FOUND</div>
              <div style={S.emptyDesc}>No records match your current filter</div>
            </div>
          ) : (
            <div style={S.testList}>
              {filtered.map((t, idx) => {
                const dm = DIFFICULTY_META[t.difficulty] || DIFFICULTY_META.easy;
                const cm = CATEGORY_META[t.category]    || CATEGORY_META.aptitude;
                const isEditing = editingId === t.id;

                return (
                  <div
                    key={t.id}
                    style={{ ...S.testCard, ...(isEditing ? S.testCardEditing : {}) }}
                    className="test-card"
                  >
                    {/* status bar */}
                    <div style={{
                      ...S.testCardBar,
                      background: t.isActive ? "#00FF9D" : "#FF4D6D",
                      boxShadow: t.isActive ? "0 0 10px rgba(0,255,157,0.4)" : "0 0 10px rgba(255,77,109,0.3)",
                    }} />

                    {isEditing ? (
                      /* ─── EDIT MODE ─── */
                      <div style={S.editMode}>
                        <div style={S.editHeader}>
                          <span style={S.editHeaderLabel}>EDITING // {t.id}</span>
                          <button onClick={cancelEdit} style={S.editCloseBtn} className="close-btn">✕</button>
                        </div>

                        <div style={S.editGrid}>
                          <div style={S.editField}>
                            <label style={S.editLabel}><span style={S.editLabelTag}>01</span> TITLE</label>
                            <div style={S.editInputWrap} className="input-wrap">
                              <input
                                value={editDraft.title || ""}
                                onChange={e => setEditDraft(p => ({ ...p, title: e.target.value }))}
                                style={S.editInput}
                                placeholder="Test title"
                              />
                            </div>
                          </div>

                          <div style={S.editField}>
                            <label style={S.editLabel}><span style={S.editLabelTag}>02</span> DURATION (MIN)</label>
                            <div style={S.editInputWrap} className="input-wrap">
                              <input
                                type="number"
                                value={editDraft.duration || ""}
                                onChange={e => setEditDraft(p => ({ ...p, duration: e.target.value }))}
                                style={S.editInput}
                                placeholder="Minutes"
                              />
                            </div>
                          </div>

                          <div style={S.editField}>
                            <label style={S.editLabel}><span style={S.editLabelTag}>03</span> DIFFICULTY</label>
                            <div style={S.editSelectWrap} className="input-wrap">
                              <select
                                value={editDraft.difficulty || "easy"}
                                onChange={e => setEditDraft(p => ({ ...p, difficulty: e.target.value }))}
                                style={S.editSelect}
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                          </div>

                          <div style={S.editField}>
                            <label style={S.editLabel}><span style={S.editLabelTag}>04</span> CATEGORY</label>
                            <div style={S.editSelectWrap} className="input-wrap">
                              <select
                                value={editDraft.category || "aptitude"}
                                onChange={e => setEditDraft(p => ({ ...p, category: e.target.value }))}
                                style={S.editSelect}
                              >
                                <option value="aptitude">Aptitude</option>
                                <option value="reasoning">Reasoning</option>
                                <option value="maths">Maths</option>
                                <option value="coding">Coding</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div style={S.editActions}>
                          <button onClick={updateTest} style={S.saveBtn} className="save-btn">
                            ⊕ COMMIT CHANGES
                          </button>
                          <button onClick={cancelEdit} style={S.cancelBtn} className="cancel-btn">
                            ✕ ABORT
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ─── VIEW MODE ─── */
                      <div style={S.viewMode}>
                        {/* Left: meta */}
                        <div style={S.viewLeft}>
                          <div style={S.viewMeta}>
                            <span style={S.viewIndex}>{String(idx + 1).padStart(2, "0")}</span>
                            <span style={{
                              ...S.statusBadge,
                              color:       t.isActive ? "#00FF9D" : "#FF4D6D",
                              borderColor: t.isActive ? "#00FF9D" : "#FF4D6D",
                              background:  t.isActive ? "rgba(0,255,157,0.06)" : "rgba(255,77,109,0.06)",
                              boxShadow:   t.isActive ? "0 0 8px rgba(0,255,157,0.2)" : "none",
                            }}>
                              <span style={{
                                ...S.statusDotSmall,
                                background: t.isActive ? "#00FF9D" : "#FF4D6D",
                                boxShadow:  t.isActive ? "0 0 4px #00FF9D" : "none",
                              }} />
                              {t.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>

                          <h3 style={S.testTitle}>{t.title}</h3>

                          <div style={S.testDetails}>
                            <div style={S.testDetailItem}>
                              <span style={{ ...S.testDetailIcon, color: cm.color }}>{cm.icon}</span>
                              <span style={{ color: cm.color }}>
                                {(t.category || "aptitude").toUpperCase()}
                              </span>
                            </div>
                            <div style={S.testDetailItem}>
                              <span style={S.testDetailIcon}>◎</span>
                              <span style={{ color: dm.color }}>{dm.label}</span>
                            </div>
                            {t.duration && (
                              <div style={S.testDetailItem}>
                                <span style={S.testDetailIcon}>⏱</span>
                                <span>{t.duration} MIN</span>
                              </div>
                            )}
                            {t.level && (
                              <div style={S.testDetailItem}>
                                <span style={S.testDetailIcon}>▲</span>
                                <span>{t.level.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: actions */}
                        <div style={S.viewRight}>
                          <button
                            onClick={() => startEdit(t)}
                            style={S.editBtn}
                            className="edit-btn"
                          >
                            ✎ EDIT
                          </button>

                          <button
                            onClick={() => window.open(`/admin/test/${t.id}`, "_blank")}
                            style={S.takeBtn}
                            className="take-btn"
                          >
                            ▶ TAKE TEST
                          </button>

                          <button
                            onClick={() => toggleTest(t.id, t.isActive)}
                            style={{
                              ...S.toggleBtn,
                              ...(t.isActive ? S.toggleBtnActive : S.toggleBtnInactive),
                            }}
                            className={t.isActive ? "deactivate-btn" : "activate-btn"}
                          >
                            {t.isActive ? "⊘ DEACTIVATE" : "⊙ ACTIVATE"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.footer}>
            <span style={S.footerText}>
              END OF REGISTRY // {filtered.length}/{tests.length} RECORDS DISPLAYED
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

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes spin-rev  { to { transform: rotate(-360deg); } }
  @keyframes glow-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes toast-in  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes card-in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .toast-in  { animation: toast-in 0.25s ease; }
  .test-card { animation: card-in 0.25s ease both; }

  .nav-item:hover       { background: rgba(0,212,255,0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover     { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .pill:hover           { border-color: rgba(0,212,255,0.2) !important; cursor: pointer; }
  .create-btn:hover     { background: #00D4FF !important; color: #060912 !important; box-shadow: 0 0 20px rgba(0,212,255,0.35) !important; }
  .test-card:hover      { border-color: rgba(0,212,255,0.12) !important; }
  .edit-btn:hover       { background: rgba(0,212,255,0.12) !important; border-color: #00D4FF !important; color: #00D4FF !important; }
  .take-btn:hover       { background: rgba(167,139,250,0.12) !important; border-color: #A78BFA !important; color: #A78BFA !important; }
  .activate-btn:hover   { background: rgba(0,255,157,0.12) !important; border-color: #00FF9D !important; color: #00FF9D !important; }
  .deactivate-btn:hover { background: rgba(255,77,109,0.12) !important; border-color: #FF4D6D !important; color: #FF4D6D !important; }
  .save-btn:hover       { background: #00D4FF !important; color: #060912 !important; box-shadow: 0 0 20px rgba(0,212,255,0.35) !important; }
  .cancel-btn:hover     { background: rgba(255,255,255,0.05) !important; color: #CBD5E1 !important; }
  .close-btn:hover      { color: #FF4D6D !important; }
  .input-wrap:focus-within { border-color: rgba(0,212,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important; }

  select option { background: #0D1117; color: #CBD5E1; }
`;

/* ─── Styles ─── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh",
    background: "#060912",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: "#CBD5E1",
  },

  /* Loading */
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
    border: "1px solid rgba(255,77,109,0.3)", color: "#FF4D6D",
  },
  toastWarn: {
    background: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24",
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

  /* Controls row */
  controlRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap",
  },
  filterPills: { display: "flex", gap: 8, flexWrap: "wrap" },
  pill: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "7px 14px", borderRadius: 8,
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    color: "#4A5568", transition: "all 0.15s",
  },
  pillActive: { background: "rgba(0,212,255,0.04)" },
  pillDot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },
  pillCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12, fontWeight: 700,
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 18px", borderRadius: 8,
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.3)",
    color: "#00D4FF",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.2s",
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

  /* Test list */
  testList: { display: "flex", flexDirection: "column", gap: 10 },

  testCard: {
    background: "#0D1117",
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 10, overflow: "hidden",
    position: "relative", transition: "border-color 0.2s",
  },
  testCardEditing: {
    borderColor: "rgba(0,212,255,0.15)",
    boxShadow: "0 0 20px rgba(0,212,255,0.05)",
  },
  testCardBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
  },

  /* View mode */
  viewMode: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "16px 22px",
    gap: 16, flexWrap: "wrap",
  },
  viewLeft:  { flex: 1, minWidth: 0 },
  viewRight: {
    display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap",
  },

  viewMeta: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  viewIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#2D3748", letterSpacing: "0.06em",
  },
  statusBadge: {
    display: "inline-flex", alignItems: "center",
    padding: "3px 10px", borderRadius: 4,
    fontSize: 9, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    borderWidth: 1, borderStyle: "solid", letterSpacing: "0.1em",
  },
  statusDotSmall: {
    width: 4, height: 4, borderRadius: "50%",
    display: "inline-block", marginRight: 5, flexShrink: 0,
  },
  testTitle: {
    fontSize: 16, fontWeight: 700, color: "#E2E8F0",
    marginBottom: 8, letterSpacing: "-0.01em",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  testDetails: { display: "flex", gap: 16, flexWrap: "wrap" },
  testDetailItem: {
    display: "flex", alignItems: "center", gap: 5,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#4A5568",
  },
  testDetailIcon: { fontSize: 10, color: "#2D3748" },

  /* Action buttons */
  editBtn: {
    padding: "6px 12px", borderRadius: 6,
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(0,212,255,0.15)",
    background: "rgba(0,212,255,0.03)",
    color: "#00D4FF55",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  takeBtn: {
    padding: "6px 12px", borderRadius: 6,
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(167,139,250,0.15)",
    background: "rgba(167,139,250,0.03)",
    color: "#A78BFA55",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  toggleBtn: {
    padding: "6px 12px", borderRadius: 6,
    borderWidth: 1, borderStyle: "solid",
    fontSize: 9, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  toggleBtnActive: {
    borderColor: "rgba(255,77,109,0.15)",
    background: "rgba(255,77,109,0.03)",
    color: "#FF4D6D55",
  },
  toggleBtnInactive: {
    borderColor: "rgba(0,255,157,0.15)",
    background: "rgba(0,255,157,0.03)",
    color: "#00FF9D55",
  },

  /* Edit mode */
  editMode: { padding: "18px 22px 20px" },
  editHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 18,
  },
  editHeaderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#00D4FF", letterSpacing: "0.14em",
  },
  editCloseBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#4A5568", fontSize: 14, transition: "color 0.15s",
    fontFamily: "'JetBrains Mono', monospace",
  },
  editGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 14, marginBottom: 18,
  },
  editField: { display: "flex", flexDirection: "column", gap: 7 },
  editLabel: {
    display: "flex", alignItems: "center", gap: 7,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#4A5568", letterSpacing: "0.12em",
  },
  editLabelTag: { color: "#2D3748" },
  editInputWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0 14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  editInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#CBD5E1", fontSize: 13, padding: "10px 0",
    fontFamily: "'Space Grotesk', sans-serif", width: "100%",
  },
  editSelectWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0 14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  editSelect: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#CBD5E1", fontSize: 13, padding: "10px 0",
    fontFamily: "'Space Grotesk', sans-serif", width: "100%",
    cursor: "pointer", appearance: "none",
  },
  editActions: { display: "flex", gap: 10 },
  saveBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 7,
    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.3)",
    color: "#00D4FF", fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
    transition: "all 0.2s",
  },
  cancelBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 7,
    background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
    color: "#4A5568", fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
    transition: "all 0.2s",
  },

  /* Footer */
  footer: {
    marginTop: 24, paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.03)",
  },
  footerText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#1E2D3D", letterSpacing: "0.1em",
  },
};