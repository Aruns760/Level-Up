"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

const BASE_URL = "http://localhost:5000";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⊞", glyph: "01" },
  { label: "Profile", path: "/admin/profile", icon: "◯", glyph: "02" },
  { label: "Job Approval", path: "/admin/jobs", icon: "✓", glyph: "03" },
  { label: "Create Test", path: "/admin/tests/create", icon: "+", glyph: "04" },
  { label: "Manage Tests", path: "/admin/tests/manage", icon: "≡", glyph: "05" },
  { label: "Questions", path: "/admin/questions", icon: "?", glyph: "06" },
];


export default function AdminProfile() {
  const router = useRouter();

  const [profile,  setProfile]  = useState(null);
  const [form,     setForm]     = useState({ name: "", email: "" });
  const [image,    setImage]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState(null);
  const [activeNav,setActiveNav]= useState("/admin/profile");
  const [dragOver, setDragOver] = useState(false);
  const [tick,     setTick]     = useState(0);

  const fileInputRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setForm({ name: res.data.name || "", email: res.data.email || "" });
    } catch (err) {
      if (err.response?.status === 403) setError("Access Denied — Admin only");
      else setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      await api.put("/admin/profile/update", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Profile updated successfully");
      fetchProfile();
    } catch {
      showToast("Update failed — please try again", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!image) { showToast("Select an image first", "warn"); return; }
    const formData = new FormData();
    formData.append("image", image);
    try {
      setUploading(true);
      await api.put("/admin/profile/upload", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      showToast("Avatar updated successfully");
      setImage(null); setPreview(null);
      fetchProfile();
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFileChange(file);
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const avatarSrc = preview
    ? preview
    : profile?.image
    ? `${BASE_URL}${profile.image}`
    : null;

  /* ── LOADING ── */
  if (loading) return (
    <div style={S.loadingWrap}>
      <style>{CSS}</style>
      <div style={S.loadingInner}>
        <div style={S.loadingRing} />
        <div style={S.loadingRingInner} />
        <span style={S.loadingText}>LOADING PROFILE</span>
      </div>
    </div>
  );

  /* ── ERROR ── */
  if (error) return (
    <div style={S.loadingWrap}>
      <style>{CSS}</style>
      <div style={S.errorBox}>
        <span style={S.errorIcon}>⚠</span>
        <span style={S.errorText}>{error}</span>
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
          <span style={S.logoutIcon}>⏻</span>LOGOUT
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
              <span style={S.breadcrumbCurrent}>PROFILE</span>
            </div>
            <h1 style={S.pageTitle}>Identity Config</h1>
          </div>
          <div style={S.topbarRight}>
            <div style={S.topbarAvatarWrap}>
              {avatarSrc
                ? <img src={avatarSrc} style={S.topbarAvatar} alt="admin" />
                : <div style={S.topbarAvatarFallback}>{(profile?.name || "A")[0].toUpperCase()}</div>
              }
              <div style={S.topbarOnline} />
            </div>
          </div>
        </header>

        <div style={S.content}>
          <div style={S.grid}>

            {/* ── LEFT: Avatar Panel ── */}
            <div style={S.leftPanel}>

              {/* Avatar upload zone */}
              <div
                style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}) }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="drop-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={e => handleFileChange(e.target.files[0])}
                />

                {avatarSrc ? (
                  <div style={S.avatarPreviewWrap}>
                    <img src={avatarSrc} style={S.avatarPreviewImg} alt="preview" />
                    <div style={S.avatarOverlay}>
                      <span style={S.avatarOverlayText}>CHANGE</span>
                    </div>
                    {/* ring decorations */}
                    <div style={S.ringDeco1} />
                    <div style={S.ringDeco2} />
                  </div>
                ) : (
                  <div style={S.avatarPlaceholder}>
                    <span style={S.avatarPlaceholderIcon}>⊕</span>
                    <span style={S.avatarPlaceholderText}>DROP IMAGE</span>
                    <span style={S.avatarPlaceholderSub}>or click to browse</span>
                  </div>
                )}
              </div>

              {/* Upload button */}
              {image && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={S.uploadBtn}
                  className="upload-btn"
                >
                  {uploading ? (
                    <>
                      <span style={S.uploadSpinner} />
                      UPLOADING…
                    </>
                  ) : (
                    <>⇪ UPLOAD AVATAR</>
                  )}
                </button>
              )}

              {/* Identity card */}
              <div style={S.idCard}>
                <div style={S.idCardGlow} />
                <div style={S.idCardTop}>
                  <span style={S.idCardLabel}>IDENTITY RECORD</span>
                  <span style={S.idCardBadge}>VERIFIED</span>
                </div>
                <div style={S.idCardName}>{profile?.name || "—"}</div>
                <div style={S.idCardEmail}>{profile?.email || "—"}</div>
                <div style={S.idCardRow}>
                  <div style={S.idCardField}>
                    <span style={S.idCardFieldLabel}>ROLE</span>
                    <span style={{ ...S.idCardFieldValue, color: "#FF4D6D" }}>{(profile?.role || "ADMIN").toUpperCase()}</span>
                  </div>
                  <div style={S.idCardField}>
                    <span style={S.idCardFieldLabel}>STATUS</span>
                    <span style={{ ...S.idCardFieldValue, color: "#00FF9D" }}>● ACTIVE</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Form Panel ── */}
            <div style={S.rightPanel}>

              {/* Section header */}
              <div style={S.sectionHeader}>
                <div style={S.sectionHeaderLine} />
                <span style={S.sectionHeaderLabel}>PROFILE CONFIGURATION</span>
              </div>

              {/* Form fields */}
              <div style={S.fieldsGrid}>

                {/* Name */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldLabelTag}>01</span>
                    DISPLAY NAME
                  </label>
                  <div style={S.inputWrap} className="input-wrap">
                    <span style={S.inputIcon}>◈</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      style={S.input}
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldLabelTag}>02</span>
                    EMAIL ADDRESS
                  </label>
                  <div style={S.inputWrap} className="input-wrap">
                    <span style={S.inputIcon}>@</span>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="admin@example.com"
                      style={S.input}
                      type="email"
                    />
                  </div>
                </div>

                {/* Role (disabled) */}
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>
                    <span style={S.fieldLabelTag}>03</span>
                    ACCESS ROLE
                  </label>
                  <div style={{ ...S.inputWrap, ...S.inputWrapDisabled }}>
                    <span style={{ ...S.inputIcon, color: "#FF4D6D" }}>⚿</span>
                    <input
                      value={(profile?.role || "admin").toUpperCase()}
                      disabled
                      style={{ ...S.input, ...S.inputDisabled }}
                    />
                    <span style={S.inputLock}>LOCKED</span>
                  </div>
                </div>

              </div>

              {/* Divider */}
              <div style={S.formDivider} />

              {/* Save button */}
              <div style={S.formActions}>
                <div style={S.formHint}>
                  Last modified: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  style={S.saveBtn}
                  className="save-btn"
                >
                  {saving ? (
                    <>
                      <span style={S.saveBtnSpinner} />
                      SAVING…
                    </>
                  ) : (
                    <>⊕ SAVE CHANGES</>
                  )}
                </button>
              </div>

              {/* Danger zone */}
              <div style={S.dangerZone}>
                <div style={S.dangerHeader}>
                  <span style={S.dangerTag}>DANGER ZONE</span>
                  <div style={S.dangerLine} />
                </div>
                <div style={S.dangerBody}>
                  <div>
                    <div style={S.dangerTitle}>Terminate Session</div>
                    <div style={S.dangerDesc}>End all active admin sessions immediately.</div>
                  </div>
                  <button onClick={handleLogout} style={S.dangerBtn} className="danger-btn">
                    LOGOUT ALL
                  </button>
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

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes spin-rev { to { transform: rotate(-360deg); } }
  @keyframes glow-pulse  { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes toast-in    { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes toast-out   { from{opacity:1} to{opacity:0} }
  @keyframes pulse-ring  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }

  .nav-item:hover    { background: rgba(0,212,255,0.07) !important; color: #00D4FF !important; }
  .logout-btn:hover  { background: rgba(255,77,109,0.12) !important; color: #FF4D6D !important; border-color: #FF4D6D !important; }
  .drop-zone:hover   { border-color: rgba(0,212,255,0.5) !important; }
  .input-wrap:focus-within { border-color: rgba(0,212,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,212,255,0.07) !important; }
  .save-btn:hover    { background: #00D4FF !important; color: #0A0E1A !important; box-shadow: 0 0 20px rgba(0,212,255,0.35) !important; }
  .upload-btn:hover  { background: rgba(0,255,157,0.12) !important; border-color: #00FF9D !important; color: #00FF9D !important; }
  .danger-btn:hover  { background: rgba(255,77,109,0.15) !important; border-color: #FF4D6D !important; color: #FF4D6D !important; }
  .toast-in { animation: toast-in 0.25s ease; }
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
    fontFamily: "'JetBrains Mono', monospace",
  },
  loadingInner: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12, position: "relative",
  },
  loadingRing: {
    width: 56, height: 56, borderRadius: "50%",
    border: "2px solid rgba(0,212,255,0.15)", borderTopColor: "#00D4FF",
    animation: "spin 0.9s linear infinite",
  },
  loadingRingInner: {
    position: "absolute", top: 8, left: 8,
    width: 40, height: 40, borderRadius: "50%",
    border: "2px solid rgba(167,139,250,0.15)", borderBottomColor: "#A78BFA",
    animation: "spin-rev 0.6s linear infinite",
  },
  loadingText: {
    fontSize: 11, color: "#00D4FF", marginTop: 16,
    letterSpacing: "0.18em",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.3)",
    borderRadius: 8, padding: "16px 24px",
  },
  errorIcon: { color: "#FF4D6D", fontSize: 18 },
  errorText: { color: "#FF4D6D", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" },

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

  /* Sidebar (same as dashboard) */
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
    background: "rgba(0,212,255,0.04)",
    border: "1px solid rgba(0,212,255,0.1)",
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
  logoutIcon: { fontSize: 14 },

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
    background: "#00FF9D", border: "1.5px solid #060912",
    boxShadow: "0 0 5px #00FF9D",
  },

  /* Content */
  content: { padding: "24px 28px", flex: 1, overflowY: "auto" },
  grid: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: 24, alignItems: "start",
    maxWidth: 1100,
  },

  /* Left panel */
  leftPanel: { display: "flex", flexDirection: "column", gap: 16 },

  dropZone: {
    border: "1px dashed rgba(0,212,255,0.2)",
    borderRadius: 12, padding: "30px 20px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "border-color 0.2s",
    background: "rgba(0,212,255,0.02)", position: "relative",
    minHeight: 280,
  },
  dropZoneActive: { borderColor: "#00D4FF", background: "rgba(0,212,255,0.05)" },

  avatarPreviewWrap: {
    position: "relative", width: 160, height: 160,
  },
  avatarPreviewImg: {
    width: 160, height: 160, borderRadius: "50%", objectFit: "cover",
    border: "2px solid rgba(0,212,255,0.3)",
  },
  avatarOverlay: {
    position: "absolute", inset: 0, borderRadius: "50%",
    background: "rgba(0,0,0,0.5)", display: "flex",
    alignItems: "center", justifyContent: "center", opacity: 0,
    transition: "opacity 0.2s",
  },
  avatarOverlayText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#00D4FF", letterSpacing: "0.14em",
  },
  ringDeco1: {
    position: "absolute", inset: -8, borderRadius: "50%",
    border: "1px solid rgba(0,212,255,0.15)",
    animation: "spin 12s linear infinite",
  },
  ringDeco2: {
    position: "absolute", inset: -16, borderRadius: "50%",
    border: "1px dashed rgba(0,212,255,0.08)",
    animation: "spin-rev 20s linear infinite",
  },

  avatarPlaceholder: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  avatarPlaceholderIcon: { fontSize: 32, color: "#1E2D3D" },
  avatarPlaceholderText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#2D3748", letterSpacing: "0.12em",
  },
  avatarPlaceholderSub: { fontSize: 11, color: "#1E2D3D" },

  uploadBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "10px",
    background: "rgba(0,255,157,0.05)",
    border: "1px solid rgba(0,255,157,0.2)",
    borderRadius: 8, cursor: "pointer",
    color: "#00FF9D77",
    fontSize: 10, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.15s",
  },
  uploadSpinner: {
    width: 12, height: 12, borderRadius: "50%",
    border: "1.5px solid rgba(0,255,157,0.2)", borderTopColor: "#00FF9D",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },

  idCard: {
    background: "linear-gradient(135deg, #0D1117 0%, #0A0E1A 100%)",
    border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: 10, padding: "18px 20px",
    position: "relative", overflow: "hidden",
  },
  idCardGlow: {
    position: "absolute", top: -30, right: -30,
    width: 100, height: 100, borderRadius: "50%",
    background: "rgba(0,212,255,0.06)", filter: "blur(30px)",
    pointerEvents: "none",
  },
  idCardTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  idCardLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.14em",
  },
  idCardBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8, color: "#00FF9D", letterSpacing: "0.1em",
    border: "1px solid rgba(0,255,157,0.2)",
    padding: "2px 6px", borderRadius: 3,
  },
  idCardName: {
    fontSize: 18, fontWeight: 700, color: "#E2E8F0", marginBottom: 4,
  },
  idCardEmail: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, color: "#4A5568", marginBottom: 14,
  },
  idCardRow: { display: "flex", gap: 20 },
  idCardField: { display: "flex", flexDirection: "column", gap: 3 },
  idCardFieldLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8, color: "#2D3748", letterSpacing: "0.12em",
  },
  idCardFieldValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
  },

  /* Right panel */
  rightPanel: {
    background: "#0D1117",
    border: "1px solid rgba(0,212,255,0.08)",
    borderRadius: 10, padding: "24px",
    position: "relative", overflow: "hidden",
  },

  sectionHeader: {
    display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
  },
  sectionHeaderLine: {
    width: 24, height: 1, background: "#00D4FF",
  },
  sectionHeaderLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, color: "#00D4FF", letterSpacing: "0.14em",
  },

  fieldsGrid: { display: "flex", flexDirection: "column", gap: 20 },

  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: {
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#4A5568", letterSpacing: "0.14em",
  },
  fieldLabelTag: {
    color: "#1E2D3D", fontSize: 9,
  },

  inputWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0 14px",
    transition: "border-color 0.2s, box-shadow 0.2s", gap: 10,
  },
  inputWrapDisabled: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.03)",
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
  inputDisabled: { color: "#4A5568", cursor: "not-allowed" },
  inputLock: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8, color: "#FF4D6D44", letterSpacing: "0.1em",
    border: "1px solid rgba(255,77,109,0.15)",
    padding: "2px 6px", borderRadius: 3,
  },

  formDivider: {
    height: 1, background: "rgba(255,255,255,0.03)", margin: "24px 0",
  },
  formActions: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  formHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#2D3748", letterSpacing: "0.06em",
  },

  saveBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "11px 24px", borderRadius: 8,
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.3)",
    color: "#00D4FF",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.2s",
  },
  saveBtnSpinner: {
    width: 12, height: 12, borderRadius: "50%",
    border: "1.5px solid rgba(0,212,255,0.2)", borderTopColor: "#00D4FF",
    animation: "spin 0.7s linear infinite", display: "inline-block",
  },

  dangerZone: {
    border: "1px solid rgba(255,77,109,0.12)",
    borderRadius: 8, overflow: "hidden",
  },
  dangerHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 16px", background: "rgba(255,77,109,0.04)",
  },
  dangerTag: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, color: "#FF4D6D55", letterSpacing: "0.14em",
    flexShrink: 0,
  },
  dangerLine: { flex: 1, height: 1, background: "rgba(255,77,109,0.08)" },
  dangerBody: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", flexWrap: "wrap", gap: 12,
  },
  dangerTitle: { fontSize: 13, fontWeight: 600, color: "#CBD5E1", marginBottom: 3 },
  dangerDesc:  { fontSize: 12, color: "#4A5568" },
  dangerBtn: {
    padding: "8px 16px", borderRadius: 6,
    border: "1px solid rgba(255,77,109,0.2)",
    background: "transparent", color: "#FF4D6D44",
    fontSize: 10, fontWeight: 700, cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em", transition: "all 0.15s",
  },
};