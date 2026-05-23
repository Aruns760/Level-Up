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

const BASE_URL = "http://localhost:5000";

export default function QuestionsPage() {
  const router = useRouter();

  // Layout State
  const [activeNav, setActiveNav] = useState("/admin/questions");
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const dropdownRef = useRef(null);
  const tickRef = useRef(null);
  const [tick, setTick] = useState(0);

  // Questions State
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [type, setType] = useState("mcq");
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ================= CLOCK & LAYOUT ================= */
  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= TOKEN ================= */
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  /* ================= FETCH DATA ================= */
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      // ✅ Fetch profile (using api)
      try {
        const profileRes = await api.get("/admin/profile");
        setProfile(profileRes.data);
      } catch (e) {
        console.warn("Profile fetch failed:", e.message);
      }

      // ✅ Fetch tests
      const res = await api.get("/tests");

      setTests(res.data || []);

      if (res.data && res.data.length > 0) {
        setSelectedTest(res.data[0].id);
      }

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  fetchData();
}, [router]);

  /* ================= API ACTIONS ================= */
// ✅ Generate Questions
const generateQuestions = async () => {
  if (!category) return alert("System requires a category selection.");

  try {
    setLoading(true);

    const res = await api.post("/tests/generate-questions", {
      category,
      difficulty,
    });

    const updated = (res.data.questions || []).map((q) => ({
      ...q,
      type,
    }));

    setQuestions(updated);

  } catch (err) {
    console.error("GENERATION ERROR:", err);
    alert("Generation protocol failed.");
  } finally {
    setLoading(false);
  }
};


// ✅ Update Question
const updateQuestion = (i, field, value) => {
  setQuestions((prev) => {
    const updated = [...prev];
    updated[i][field] = value;
    return updated;
  });
};


// ✅ Delete Question
const deleteQuestion = (i) => {
  setQuestions((prev) => prev.filter((_, index) => index !== i));
};


// ✅ Save Questions
const saveQuestions = async () => {
  if (!selectedTest) return alert("Target test not selected.");
  if (questions.length === 0) return alert("No questions to process.");

  try {
    setSaving(true);

    await Promise.all(
      questions.map((q) =>
      api.post(`/tests/add-question/${selectedTest}`, {
          ...q,
          marks: q.marks || 1,
          category,
        })
      )
    );

    alert("Data successfully committed to the database.");
    setQuestions([]);

  } catch (err) {
    console.error("SAVE ERROR:", err);
    alert("Save operation failed.");
  } finally {
    setSaving(false);
  }
};
  /* ================= UTILS ================= */
const [timeStr, setTimeStr] = useState("");
const [dateStr, setDateStr] = useState("");
useEffect(() => {
  const updateClock = () => {
    const now = new Date();
    setTimeStr(now.toLocaleTimeString("en-US", { hour12: false }));
    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );
  };

  updateClock(); // initial run
  const interval = setInterval(updateClock, 1000);

  return () => clearInterval(interval);
}, []);

  return (
    <div style={S.layout}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarGlowLine} />

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoHex}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
              <polygon points="18,8 26,13 26,23 18,28 10,23 10,13" fill="rgba(0,212,255,0.12)" stroke="#00D4FF" strokeWidth="0.8" />
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
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.path;
            return (
              <div
                key={item.path}
                onClick={() => {
                  setActiveNav(item.path);
                  router.push(item.path);
                }}
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
          <div style={S.statusRow}><span style={{ ...S.statusDot, background: "#00FF9D" }} />AI ENGINE READY</div>
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
              <span style={S.breadcrumbCurrent}>QUESTIONS ENGINE</span>
            </div>
            <h1 style={S.pageTitle}>Question Generator</h1>
          </div>

          <div style={S.topbarRight}>
            <div style={S.avatarWrap} ref={dropdownRef}>
              <div style={S.avatarBtn} onClick={() => setShowDropdown((v) => !v)}>
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
                      <div style={S.dropdownRole}>● ADMIN ACCESS</div>
                    </div>
                  </div>
                  <div style={S.dropdownDivider} />
                  <div style={{ ...S.dropdownItem, color: "#FF4D6D" }} className="dropdown-item" onClick={handleLogout}>
                    <span style={S.dropdownItemIcon}>⏻</span> Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={S.content}>
          {/* ── Command Panels ── */}
          <div style={S.controlsGrid}>
            
            {/* Generate Panel */}
            <div style={S.controlCard}>
              <div style={S.cardHeader}>
                <span style={S.cardIcon}>⚡</span>
                <h3 style={S.cardTitle}>GENERATION PARAMETERS</h3>
              </div>
              <div style={S.formRow}>
                <div style={S.inputGroup}>
                  <label style={S.label}>CATEGORY</label>
                  <select className="cyber-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">-- SELECT --</option>
                    <option value="aptitude">APTITUDE</option>
                    <option value="reasoning">REASONING</option>
                    <option value="maths">MATHS</option>
                    <option value="coding">CODING</option>
                  </select>
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>DIFFICULTY</label>
                  <select className="cyber-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">EASY (L1)</option>
                    <option value="medium">MEDIUM (L2)</option>
                    <option value="hard">HARD (L3)</option>
                  </select>
                </div>
                <div style={S.inputGroup}>
                  <label style={S.label}>FORMAT</label>
                  <select className="cyber-input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="mcq">MULTIPLE CHOICE</option>
                    <option value="coding">CODE SNIPPET</option>
                  </select>
                </div>
              </div>
              <button 
                className="cyber-btn primary-btn" 
                onClick={generateQuestions} 
                disabled={loading}
              >
                {loading ? "INITIALIZING..." : "GENERATE PROTOCOL"}
              </button>
            </div>

            {/* Save Panel */}
            <div style={S.controlCard}>
              <div style={S.cardHeader}>
                <span style={{...S.cardIcon, color: "#00FF9D"}}>💾</span>
                <h3 style={S.cardTitle}>DATA COMMIT</h3>
              </div>
              <div style={S.formRow}>
                <div style={{ ...S.inputGroup, flex: 1 }}>
                  <label style={S.label}>TARGET TEST ASSIGNMENT</label>
                  <select className="cyber-input" value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}>
                    <option value="">-- SELECT TARGET TEST --</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                className="cyber-btn success-btn" 
                onClick={saveQuestions} 
                disabled={saving || questions.length === 0}
              >
                {saving ? "COMMITTING..." : "COMMIT TO DATABASE"}
              </button>
            </div>
          </div>

          {/* ── Generated Questions Feed ── */}
          {questions.length > 0 && (
            <div style={S.feedHeader}>
              <h2 style={S.feedTitle}>OUTPUT BUFFER <span style={S.countBadge}>{questions.length}</span></h2>
              <div style={S.liveIndicator}><span className="pulse-dot" style={S.liveDot} />UNSAVED DATA</div>
            </div>
          )}

          <div style={S.questionsList}>
            {questions.map((q, i) => (
              <div key={i} style={S.qCard}>
                <div style={S.qCardGlow} />
                <div style={S.qHeader}>
                  <div style={S.qIndex}>Q{String(i + 1).padStart(2, "0")}</div>
                  <button className="cyber-icon-btn danger-btn" onClick={() => deleteQuestion(i)}>
                    ✕ REMOVE
                  </button>
                </div>

                <div style={S.qBody}>
                  <label style={S.label}>QUESTION STATEMENT</label>
                  <input
                    className="cyber-input q-text"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, "question", e.target.value)}
                    placeholder="Enter question text..."
                  />

                  {q.type === "mcq" && (
                    <div style={S.optionsGrid}>
                      {["A", "B", "C", "D"].map((opt) => (
                        <div key={opt} style={S.optionRow}>
                          <span style={S.optionLabel}>[{opt}]</span>
                          <input
                            className="cyber-input option-input"
                            value={q[`option${opt}`] || ""}
                            onChange={(e) => updateQuestion(i, `option${opt}`, e.target.value)}
                            placeholder={`Option ${opt}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "coding" && (
                    <div style={S.codingGrid}>
                      <div style={S.codeBlock}>
                        <label style={{...S.label, color: "#A78BFA"}}>CODE TEMPLATE</label>
                        <textarea
                          className="cyber-input cyber-textarea"
                          placeholder="// Initial code wrapper..."
                          value={q.codeTemplate || ""}
                          onChange={(e) => updateQuestion(i, "codeTemplate", e.target.value)}
                        />
                      </div>
                      <div style={S.codeBlock}>
                        <label style={{...S.label, color: "#A78BFA"}}>EXPECTED STDOUT</label>
                        <input
                          className="cyber-input"
                          placeholder="Terminal output expected..."
                          value={q.expectedOutput || ""}
                          onChange={(e) => updateQuestion(i, "expectedOutput", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {questions.length === 0 && !loading && (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>⚡</div>
                <div style={S.emptyTitle}>SYSTEM IDLE</div>
                <div style={S.emptySub}>Set parameters and run generator to populate buffer.</div>
              </div>
            )}
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

  @keyframes pulse-ring {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.5); }
  }
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nav-item:hover { background: rgba(0, 212, 255, 0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .pulse-dot { animation: pulse-ring 1.5s ease-in-out infinite; }
  .dropdown-enter { animation: slide-in 0.18s ease; }

  /* Forms */
  .cyber-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #CBD5E1;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 6px;
    transition: all 0.2s ease;
    outline: none;
  }
  .cyber-input:focus {
    border-color: #00D4FF;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.15);
    background: rgba(0, 212, 255, 0.02);
  }
  select.cyber-input {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23CBD5E1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px top 50%;
    background-size: 10px auto;
  }
  select.cyber-input option {
    background: #0D1117;
    color: #CBD5E1;
  }
  
  .cyber-textarea {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    min-height: 100px;
    resize: vertical;
    color: #A78BFA;
  }

  .cyber-btn {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    border: 1px solid transparent;
  }
  .cyber-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .primary-btn {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.4);
    color: #00D4FF;
  }
  .primary-btn:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  }

  .success-btn {
    background: rgba(0, 255, 157, 0.1);
    border-color: rgba(0, 255, 157, 0.4);
    color: #00FF9D;
  }
  .success-btn:hover:not(:disabled) {
    background: rgba(0, 255, 157, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
  }

  .cyber-icon-btn {
    background: transparent;
    border: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .danger-btn {
    color: #FF4D6D;
    border: 1px solid rgba(255, 77, 109, 0.2);
    background: rgba(255, 77, 109, 0.05);
  }
  .danger-btn:hover {
    background: rgba(255, 77, 109, 0.15);
    box-shadow: 0 0 10px rgba(255, 77, 109, 0.2);
  }
`;

/* ─── Styles ─── */
const S = {
  layout: {
    display: "flex", minHeight: "100vh", background: "#060912",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: "#CBD5E1", position: "relative", overflow: "hidden",
  },
  
  /* Sidebar */
  sidebar: {
    width: 260, minHeight: "100vh",
    background: "linear-gradient(180deg, #0D1117 0%, #0A0E1A 100%)",
    borderRight: "1px solid rgba(0,212,255,0.1)",
    display: "flex", flexDirection: "column", padding: "24px 16px 20px",
    position: "relative", overflow: "hidden", flexShrink: 0,
  },
  sidebarGlowLine: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
    animation: "glow-pulse 3s ease-in-out infinite",
  },
  logo: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  logoHex: { flexShrink: 0 },
  logoName: { fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", color: "#E2E8F0" },
  logoAccent: { color: "#00D4FF" },
  logoVersion: { fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#2D3748", letterSpacing: "0.1em", marginTop: 2 },
  clockBox: { background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 6, padding: "8px 12px", marginBottom: 16 },
  clockTime: { fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#00D4FF", letterSpacing: "0.05em" },
  clockDate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4A5568", letterSpacing: "0.08em", marginTop: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#4A5568", marginBottom: 2, position: "relative", transition: "all 0.15s ease", letterSpacing: "0.04em" },
  navItemActive: { background: "rgba(0,212,255,0.08)", color: "#00D4FF", borderLeft: "2px solid #00D4FF" },
  navGlyph: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2D3748", minWidth: 16 },
  navIcon: { fontSize: 14, minWidth: 16, textAlign: "center" },
  navLabel: { flex: 1 },
  navActiveBar: { position: "absolute", right: 12, width: 5, height: 5, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 6px #00D4FF" },
  systemStatus: { margin: "12px 0", padding: "10px 12px", background: "rgba(0,255,157,0.03)", border: "1px solid rgba(0,255,157,0.08)", borderRadius: 6 },
  statusRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#2D4A38", letterSpacing: "0.08em", marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: "50%", background: "#00D4FF", display: "inline-block", flexShrink: 0 },
  logoutBtn: { display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#4A5568", padding: "9px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.1em", transition: "all 0.15s", width: "100%" },
  logoutIcon: { fontSize: 14 },

  /* Main & Topbar */
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { background: "rgba(10,14,26,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,212,255,0.08)", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 },
  breadcrumbRoot: { color: "#2D3748" }, breadcrumbSep: { color: "#1A2535" }, breadcrumbCurrent: { color: "#00D4FF" },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#E2E8F0", letterSpacing: "-0.01em" },
  topbarRight: { display: "flex", alignItems: "center", gap: 14 },
  avatarWrap: { position: "relative" },
  avatarBtn: { width: 38, height: 38, borderRadius: "50%", cursor: "pointer", position: "relative", boxShadow: "0 0 0 1px rgba(0,212,255,0.3)" },
  avatarImg: { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" },
  avatarOnline: { position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#00FF9D", border: "1.5px solid #0A0E1A", boxShadow: "0 0 5px #00FF9D" },
  dropdown: { position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#0D1117", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 10, padding: "6px", minWidth: 240, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,212,255,0.05)" },
  dropdownHeader: { display: "flex", gap: 12, padding: "10px 10px 12px", alignItems: "center" },
  dropdownAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0,212,255,0.2)" },
  dropdownName: { fontSize: 14, fontWeight: 600, color: "#E2E8F0" },
  dropdownRole: { fontSize: 10, color: "#00FF9D", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", marginTop: 3 },
  dropdownDivider: { height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0" },
  dropdownItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 6, fontSize: 13, color: "#94A3B8", cursor: "pointer", transition: "all 0.12s" },
  dropdownItemIcon: { fontSize: 13, width: 16, textAlign: "center" },

  /* Content & App Specific Styles */
  content: { padding: "24px 28px", flex: 1, overflowY: "auto" },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  controlCard: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "20px",
    position: "relative",
  },
  cardHeader: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
    paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.04)"
  },
  cardIcon: { fontSize: 16, color: "#00D4FF" },
  cardTitle: { 
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, 
    fontWeight: 700, letterSpacing: "0.1em", color: "#E2E8F0" 
  },
  formRow: {
    display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap"
  },
  inputGroup: { flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", gap: 6 },
  label: { 
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, 
    color: "#64748B", letterSpacing: "0.08em", fontWeight: 600
  },

  /* Feed / Results Header */
  feedHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16, padding: "0 4px"
  },
  feedTitle: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
    color: "#CBD5E1", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 10
  },
  countBadge: {
    background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.3)",
    padding: "2px 8px", borderRadius: 12, fontSize: 11
  },
  liveIndicator: {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#FF4D6D", letterSpacing: "0.1em"
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#FF4D6D", display: "inline-block", boxShadow: "0 0 6px #FF4D6D"
  },

  /* Questions Feed */
  questionsList: {
    display: "flex", flexDirection: "column", gap: 16, paddingBottom: 40
  },
  qCard: {
    background: "linear-gradient(180deg, #0D1117 0%, rgba(13,17,23,0.5) 100%)",
    border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: 8, padding: "20px", position: "relative", overflow: "hidden"
  },
  qCardGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
    background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)"
  },
  qHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16
  },
  qIndex: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700,
    color: "#00D4FF", textShadow: "0 0 10px rgba(0,212,255,0.3)"
  },
  qBody: {
    display: "flex", flexDirection: "column", gap: 16
  },
  optionsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12,
    marginTop: 8, padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 6,
    border: "1px dashed rgba(255,255,255,0.05)"
  },
  optionRow: { display: "flex", alignItems: "center", gap: 10 },
  optionLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8", fontWeight: 700
  },
  codingGrid: {
    display: "flex", flexDirection: "column", gap: 16, marginTop: 8,
    padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: 6,
    border: "1px dashed rgba(167,139,250,0.2)"
  },
  codeBlock: { display: "flex", flexDirection: "column", gap: 8 },

  /* Empty State */
  emptyState: {
    textAlign: "center", padding: "60px 20px",
    background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(255,255,255,0.05)",
    borderRadius: 10, marginTop: 20
  },
  emptyIcon: { fontSize: 32, marginBottom: 12, opacity: 0.3 },
  emptyTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4A5568", letterSpacing: "0.2em", fontWeight: 700 },
  emptySub: { fontSize: 12, color: "#334155", marginTop: 6 }
};