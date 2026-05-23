"use client";

import { useState, useEffect } from "react";
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

const LEVEL_META = {
  Beginner:     { color: "#00FF9D", glow: "rgba(0,255,157,0.25)",   icon: "▲" },
  Intermediate: { color: "#FBBF24", glow: "rgba(251,191,36,0.25)",  icon: "▲▲" },
  Advanced:     { color: "#FF4D6D", glow: "rgba(255,77,109,0.25)",  icon: "▲▲▲" },
};

const DIFFICULTY_META = {
  easy:   { color: "#00FF9D", label: "EASY",   bar: 1 },
  medium: { color: "#FBBF24", label: "MEDIUM", bar: 2 },
  hard:   { color: "#FF4D6D", label: "HARD",   bar: 3 },
};

const CATEGORY_META = {
  aptitude:  { icon: "◈", label: "APTITUDE",  color: "#A78BFA" },
  reasoning: { icon: "⌗", label: "REASONING", color: "#00D4FF" },
  maths:     { icon: "∑", label: "MATHS",     color: "#FBBF24" },
  coding:    { icon: "⌨", label: "CODING",    color: "#00FF9D" },
};

const BASE_URL = "http://localhost:5000";

const DEFAULT_FORM = {
  title: "",
  duration: "",
  level: "Beginner",
  difficulty: "easy",
  category: "aptitude",
};

export default function CreateTestPage() {
  const router = useRouter();
  const [form,      setForm]      = useState(DEFAULT_FORM);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [activeNav, setActiveNav] = useState("/admin/create-test");
  const [profile,   setProfile]   = useState(null);
  const [mounted,   setMounted]   = useState(false);
  const [time,      setTime]      = useState({ timeStr: "", dateStr: "" });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [testId,    setTestId]    = useState("");

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* live clock — only runs client-side after mount, avoiding SSR mismatch */
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
    setTestId(`TEST-${Date.now().toString(36).toUpperCase().slice(-6)}`);
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  /* toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  /* fetch profile for avatar */
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    axios.get(`${BASE_URL}/api/admin/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const validate = () => {
    const e = {};
    if (!form.title.trim())    e.title    = "Title is required";
    if (!form.duration)        e.duration = "Duration is required";
    else if (Number(form.duration) <= 0) e.duration = "Must be > 0";
    return e;
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const createTest = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    try {
      setLoading(true);
      const token = getToken();
      await axios.post(
        `${BASE_URL}/api/tests/create`,
        { ...form, duration: Number(form.duration) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      showToast("Test created successfully");
      setTimeout(() => {
        setForm(DEFAULT_FORM);
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      showToast("Creation failed — please retry", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const { timeStr, dateStr } = time;
  const lm = LEVEL_META[form.level]           || LEVEL_META.Beginner;
  const dm = DIFFICULTY_META[form.difficulty] || DIFFICULTY_META.easy;
  const cm = CATEGORY_META[form.category]  || CATEGORY_META.aptitude;

  return (
    <div style={S.layout}>
      <style>{CSS}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...S.toast, ...(toast.type === "error" ? S.toastError : {}) }}
          className="toast-in">
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
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
              <span style={S.breadcrumbCurrent}>CREATE TEST</span>
            </div>
            <h1 style={S.pageTitle}>Test Configuration</h1>
          </div>
          <div style={S.topbarRight}>
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
          <div style={S.twoCol}>

            {/* ── LEFT: Form ── */}
            <div style={S.formCard}>
              <div style={S.formCardGlowTop} />

              <div style={S.formHeader}>
                <span style={S.formHeaderLabel}>NEW TEST RECORD</span>
                <span style={S.formHeaderId}>{testId || "TEST-??????"}</span>
              </div>

              <div style={S.fields}>

                {/* Title */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldTag}>01</span>TEST TITLE
                    <span style={S.fieldRequired}>*</span>
                  </label>
                  <div style={{ ...S.inputWrap, ...(errors.title ? S.inputWrapError : {}) }}
                    className="input-wrap">
                    <span style={S.inputIcon}>◈</span>
                    <input
                      placeholder="e.g. Quantitative Aptitude — Set 1"
                      value={form.title}
                      onChange={e => handleChange("title", e.target.value)}
                      style={S.input}
                    />
                  </div>
                  {errors.title && <span style={S.errorMsg}>{errors.title}</span>}
                </div>

                {/* Duration */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldTag}>02</span>DURATION
                    <span style={S.fieldRequired}>*</span>
                  </label>
                  <div style={{ ...S.inputWrap, ...(errors.duration ? S.inputWrapError : {}) }}
                    className="input-wrap">
                    <span style={S.inputIcon}>⏱</span>
                    <input
                      type="number"
                      placeholder="Minutes"
                      min="1"
                      value={form.duration}
                      onChange={e => handleChange("duration", e.target.value)}
                      style={S.input}
                    />
                    <span style={S.inputSuffix}>MIN</span>
                  </div>
                  {errors.duration && <span style={S.errorMsg}>{errors.duration}</span>}
                </div>

                {/* Level */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldTag}>03</span>LEVEL
                  </label>
                  <div style={S.segmentRow}>
                    {["Beginner", "Intermediate", "Advanced"].map(lv => {
                      const m = LEVEL_META[lv];
                      const active = form.level === lv;
                      return (
                        <div
                          key={lv}
                          onClick={() => handleChange("level", lv)}
                          style={{
                            ...S.segment,
                            ...(active ? {
                              ...S.segmentActive,
                              borderColor: m.color,
                              color: m.color,
                              background: `${m.color}11`,
                              boxShadow: `0 0 10px ${m.glow}`,
                            } : {}),
                          }}
                          className="segment"
                        >
                          <span style={S.segmentIcon}>{m.icon}</span>
                          {lv.toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldTag}>04</span>DIFFICULTY
                  </label>
                  <div style={S.segmentRow}>
                    {["easy", "medium", "hard"].map(d => {
                      const m = DIFFICULTY_META[d];
                      const active = form.difficulty === d;
                      return (
                        <div
                          key={d}
                          onClick={() => handleChange("difficulty", d)}
                          style={{
                            ...S.segment,
                            ...(active ? {
                              ...S.segmentActive,
                              borderColor: m.color,
                              color: m.color,
                              background: `${m.color}11`,
                              boxShadow: `0 0 10px rgba(0,0,0,0.2)`,
                            } : {}),
                          }}
                          className="segment"
                        >
                          <div style={S.diffBars}>
                            {[1, 2, 3].map(i => (
                              <div key={i} style={{
                                ...S.diffBar,
                                height: 4 + i * 3,
                                background: active && i <= m.bar ? m.color : "rgba(255,255,255,0.08)",
                              }} />
                            ))}
                          </div>
                          {m.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldTag}>05</span>CATEGORY
                  </label>
                  <div style={S.categoryGrid}>
                    {Object.entries(CATEGORY_META).map(([key, m]) => {
                      const active = form.category === key;
                      return (
                        <div
                          key={key}
                          onClick={() => handleChange("category", key)}
                          style={{
                            ...S.categoryCard,
                            ...(active ? {
                              borderColor: m.color,
                              background: `${m.color}0D`,
                              boxShadow: `0 0 14px ${m.color}22`,
                            } : {}),
                          }}
                          className="category-card"
                        >
                          <span style={{ ...S.categoryIcon, color: active ? m.color : "#2D3748" }}>
                            {m.icon}
                          </span>
                          <span style={{ ...S.categoryLabel, color: active ? m.color : "#4A5568" }}>
                            {m.label}
                          </span>
                          {active && <div style={{ ...S.categoryDot, background: m.color, boxShadow: `0 0 5px ${m.color}` }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div style={S.submitRow}>
                <button
                  onClick={createTest}
                  disabled={loading || submitted}
                  style={{
                    ...S.submitBtn,
                    ...(submitted ? S.submitBtnSuccess : {}),
                  }}
                  className="submit-btn"
                >
                  {loading ? (
                    <><span style={S.spinner} />INITIALIZING…</>
                  ) : submitted ? (
                    <>✓ TEST CREATED</>
                  ) : (
                    <>⊕ CREATE TEST</>
                  )}
                </button>
                <button
                  onClick={() => { setForm(DEFAULT_FORM); setErrors({}); }}
                  style={S.resetBtn}
                  className="reset-btn"
                >
                  ↺ RESET
                </button>
              </div>
            </div>

            {/* ── RIGHT: Live Preview ── */}
            <div style={S.previewCol}>
              <div style={S.previewCard}>
                <div style={{ ...S.previewCardBar, background: cm.color, boxShadow: `0 0 10px ${cm.color}55` }} />

                <div style={S.previewHeader}>
                  <span style={S.previewHeaderLabel}>LIVE PREVIEW</span>
                  <span style={S.previewLiveDot} className="pulse-dot" />
                </div>

                <div style={S.previewTitle}>
                  {form.title || <span style={{ color: "#2D3748" }}>Untitled Test</span>}
                </div>

                <div style={S.previewMeta}>
                  <div style={S.previewMetaItem}>
                    <span style={{ ...S.previewMetaIcon, color: cm.color }}>{cm.icon}</span>
                    <span style={{ color: cm.color }}>{cm.label}</span>
                  </div>
                  <div style={S.previewMetaItem}>
                    <span style={S.previewMetaIcon}>⏱</span>
                    <span>{form.duration ? `${form.duration} MIN` : "-- MIN"}</span>
                  </div>
                </div>

                <div style={S.previewDivider} />

                <div style={S.previewBadges}>
                  <div style={{
                    ...S.previewBadge,
                    color: lm.color, borderColor: lm.color,
                    background: `${lm.color}0D`,
                    boxShadow: `0 0 8px ${lm.glow}`,
                  }}>
                    <span style={{ ...S.previewBadgeDot, background: lm.color }} />
                    {form.level.toUpperCase()}
                  </div>
                  <div style={{
                    ...S.previewBadge,
                    color: dm.color, borderColor: dm.color,
                    background: `${dm.color}0D`,
                  }}>
                    <span style={{ ...S.previewBadgeDot, background: dm.color }} />
                    {dm.label}
                  </div>
                </div>

                <div style={S.previewDivider} />

                {/* Difficulty visual meter */}
                <div style={S.meterSection}>
                  <span style={S.meterLabel}>DIFFICULTY LEVEL</span>
                  <div style={S.meterTrack}>
                    <div style={{
                      ...S.meterFill,
                      width: `${(dm.bar / 3) * 100}%`,
                      background: `linear-gradient(90deg, ${dm.color}88, ${dm.color})`,
                      boxShadow: `0 0 8px ${dm.color}55`,
                    }} />
                  </div>
                  <span style={{ ...S.meterValue, color: dm.color }}>{dm.label}</span>
                </div>

                {/* Duration visual */}
                {form.duration > 0 && (
                  <div style={S.durationVisual}>
                    <span style={S.durationLabel}>DURATION</span>
                    <div style={S.durationDisplay}>
                      <span style={S.durationNum}>{form.duration}</span>
                      <span style={S.durationUnit}>MIN</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Info card */}
              <div style={S.infoCard}>
                <div style={S.infoRow}>
                  <span style={S.infoIcon}>ℹ</span>
                  <span style={S.infoText}>
                    Tests can be assigned questions after creation from the Questions panel.
                  </span>
                </div>
              </div>
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

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0A0E1A; }
  ::-webkit-scrollbar-thumb { background: #1E2D3D; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #00D4FF; }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes spin-rev { to { transform: rotate(-360deg); } }
  @keyframes glow-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes toast-in   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse-ring { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }

  .toast-in   { animation: toast-in 0.25s ease; }
  .pulse-dot  { animation: pulse-ring 1.5s ease-in-out infinite; }
  .nav-item:hover      { background: rgba(0,212,255,0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover    { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .input-wrap:focus-within { border-color: rgba(0,212,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important; }
  .segment:hover       { border-color: rgba(0,212,255,0.2) !important; cursor: pointer; }
  .category-card:hover { border-color: rgba(0,212,255,0.2) !important; cursor: pointer; }
  .submit-btn:hover:not(:disabled) { background: #00D4FF !important; color: #060912 !important; box-shadow: 0 0 24px rgba(0,212,255,0.4) !important; }
  .reset-btn:hover     { border-color: rgba(255,255,255,0.15) !important; color: #CBD5E1 !important; }
`;

/* ─── Styles ─── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh",
    background: "#060912",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: "#CBD5E1",
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
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
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
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 20, alignItems: "start",
    maxWidth: 1100,
  },

  /* Form card */
  formCard: {
    background: "#0D1117",
    border: "1px solid rgba(0,212,255,0.08)",
    borderRadius: 10, overflow: "hidden",
    position: "relative",
  },
  formCardGlowTop: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)",
  },
  formHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  formHeaderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#00D4FF", letterSpacing: "0.14em",
  },
  formHeaderId: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.08em",
  },

  fields: { padding: "22px 24px", display: "flex", flexDirection: "column", gap: 22 },

  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: {
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#4A5568", letterSpacing: "0.14em",
  },
  fieldTag: { color: "#1E2D3D" },
  fieldRequired: { color: "#FF4D6D", marginLeft: 2 },

  inputWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0 14px",
    transition: "border-color 0.2s, box-shadow 0.2s", gap: 10,
  },
  inputWrapError: {
    borderColor: "rgba(255,77,109,0.4)",
    boxShadow: "0 0 0 3px rgba(255,77,109,0.07)",
  },
  inputIcon: {
    fontSize: 14, color: "#2D3748", flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
  },
  input: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#CBD5E1", fontSize: 14, padding: "12px 0",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  inputSuffix: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.1em", flexShrink: 0,
  },
  errorMsg: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#FF4D6D", letterSpacing: "0.06em",
  },

  /* Segments */
  segmentRow: { display: "flex", gap: 8 },
  segment: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, padding: "10px 8px",
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 8, background: "rgba(255,255,255,0.02)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 700, color: "#2D3748",
    letterSpacing: "0.08em", transition: "all 0.15s",
  },
  segmentActive: {},
  segmentIcon: { fontSize: 10 },

  /* Difficulty bars */
  diffBars: { display: "flex", alignItems: "flex-end", gap: 2 },
  diffBar: { width: 3, borderRadius: 2, transition: "background 0.2s" },

  /* Category grid */
  categoryGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  categoryCard: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px",
    borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 8, background: "rgba(255,255,255,0.02)",
    transition: "all 0.15s", position: "relative", overflow: "hidden",
  },
  categoryIcon: { fontSize: 18, transition: "color 0.2s" },
  categoryLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    transition: "color 0.2s",
  },
  categoryDot: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    width: 5, height: 5, borderRadius: "50%",
  },

  /* Submit row */
  submitRow: {
    padding: "16px 24px 20px",
    borderTop: "1px solid rgba(255,255,255,0.03)",
    display: "flex", gap: 10,
  },
  submitBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 24px", borderRadius: 8,
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.3)",
    color: "#00D4FF",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.2s",
  },
  submitBtnSuccess: {
    background: "rgba(0,255,157,0.1)",
    border: "1px solid rgba(0,255,157,0.3)",
    color: "#00FF9D",
  },
  resetBtn: {
    padding: "13px 18px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "transparent", color: "#4A5568",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.15s",
  },
  spinner: {
    width: 12, height: 12, borderRadius: "50%",
    border: "1.5px solid rgba(0,212,255,0.2)", borderTopColor: "#00D4FF",
    animation: "spin 0.7s linear infinite", display: "inline-block",
  },

  /* Preview col */
  previewCol: { display: "flex", flexDirection: "column", gap: 12 },
  previewCard: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10, padding: "18px 20px",
    position: "relative", overflow: "hidden",
  },
  previewCardBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  previewHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  previewHeaderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#4A5568", letterSpacing: "0.14em",
  },
  previewLiveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#00FF9D", display: "inline-block",
    boxShadow: "0 0 5px #00FF9D",
  },
  previewTitle: {
    fontSize: 16, fontWeight: 700, color: "#E2E8F0",
    marginBottom: 14, lineHeight: 1.4, minHeight: 24,
  },
  previewMeta: { display: "flex", gap: 16, marginBottom: 14 },
  previewMetaItem: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#4A5568",
  },
  previewMetaIcon: { fontSize: 12 },
  previewDivider: {
    height: 1, background: "rgba(255,255,255,0.03)", margin: "14px 0",
  },
  previewBadges: { display: "flex", gap: 8, flexWrap: "wrap" },
  previewBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 4,
    borderWidth: 1, borderStyle: "solid", borderColor: "transparent",
    fontSize: 9, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
  },
  previewBadgeDot: {
    width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
  },

  meterSection: { display: "flex", flexDirection: "column", gap: 7 },
  meterLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.12em",
  },
  meterTrack: {
    height: 4, borderRadius: 4,
    background: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%", borderRadius: 4, transition: "width 0.4s ease",
  },
  meterValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
  },

  durationVisual: {
    marginTop: 14,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  durationLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.12em",
  },
  durationDisplay: { display: "flex", alignItems: "baseline", gap: 4 },
  durationNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 28, fontWeight: 700, color: "#00D4FF", lineHeight: 1,
  },
  durationUnit: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#4A5568", letterSpacing: "0.1em",
  },

  infoCard: {
    background: "rgba(0,212,255,0.03)",
    border: "1px solid rgba(0,212,255,0.08)",
    borderRadius: 8, padding: "12px 14px",
  },
  infoRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  infoIcon: { color: "#2D3748", fontSize: 13, flexShrink: 0, marginTop: 1 },
  infoText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#2D3748", letterSpacing: "0.04em", lineHeight: 1.6,
  },
};