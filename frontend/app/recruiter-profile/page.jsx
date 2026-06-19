"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../lib/api";
import { useRouter, usePathname } from "next/navigation";

/* ─────────────────────────────────────────────
   Toast Hook
───────────────────────────────────────────── */
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
   Navigation & Icons
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

const Icon = {
  edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  cancel: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  upload: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  globe: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  building: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  success: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  error: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function RecruiterProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const fileRef = useRef();
  const { toasts, add: toast } = useToast();

  const [image,     setImage]     = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [form,      setForm]      = useState({ companyName: "", companyWebsite: "" });
  const [original,  setOriginal]  = useState({ companyName: "", companyWebsite: "" });
  const [editMode,  setEditMode]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [dragOver,  setDragOver]  = useState(false);
  const [userName,  setUserName]  = useState("Recruiter");
  const [userEmail, setUserEmail] = useState("");
  
  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        setUserName(localStorage.getItem("name") || "Recruiter");
        setUserEmail(localStorage.getItem("email") || "");

        const [profileRes, userRes] = await Promise.all([
          api.get("/recruiter/profile", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/user/me", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profileRes.data) {
          setForm(profileRes.data);
          setOriginal(profileRes.data);
        }
        if (userRes.data?.image) {
          setImage(userRes.data.image);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        toast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, toast]);

  /* ── 3D Tilt Logic ── */
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (max 6 degrees for smooth subtle effect)
    const rotateX = ((y - centerY) / centerY) * -6; 
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 }); // Reset to flat
  };

  /* ── Upload Logic ── */
  const processUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast("Please select a valid image file", "error"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5 MB", "error"); return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("token");
      const res = await api.post("/user/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImage(res.data.image);
      localStorage.setItem("image", res.data.image);
      toast("Profile photo updated!", "success");
    } catch {
      setPreview(null);
      toast("Upload failed. Try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => processUpload(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processUpload(e.dataTransfer.files[0]); };

  /* ── Save Logic ── */
  const handleSave = async () => {
    if (!form.companyName.trim()) { toast("Company name is required", "error"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.put("/recruiter/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOriginal(form);
      setEditMode(false);
      toast("Profile saved successfully!", "success");
    } catch (err) {
      toast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "R";
  const imgSrc = preview || (image ? `http://localhost:3000${image}` : null);
  const hasChanges = JSON.stringify(form) !== JSON.stringify(original);

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={{ color: "#6B7280", marginTop: 12, fontSize: 14 }}>Loading profile data...</p>
    </div>
  );

  return (
    <div style={S.layout}>
      
      {/* ── Toast Notifications ── */}
      <div style={S.toastStack}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...S.toast, ...(t.type === "error" ? S.toastError : S.toastSuccess) }}>
            <span style={{ color: t.type === "error" ? "#EF4444" : "#10B981" }}>
              {t.type === "error" ? <Icon.error /> : <Icon.success />}
            </span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Sidebar (Matched perfectly to platform) ── */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}>R</div>
          <span style={S.logoText}>RΣCRUITER</span>
        </div>
        <p style={S.navSection}>Main Menu</p>
        <nav>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{ ...S.navItem, ...(isActive ? S.navItemActive : {}) }}
              >
                <span style={S.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <div style={S.activeDot} />}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h1 style={S.pageTitle}>Profile Settings</h1>
            <p style={S.pageSub}>Manage your recruiter identity and company presence</p>
          </div>
        </header>

        <div style={S.contentWrapper}>
          
          {/* 3D Perspective Container */}
          <div style={S.perspectiveContainer}>
            
            {/* The 3D Card */}
            <div 
              style={{
                ...S.card3D,
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                boxShadow: tilt.x === 0 && tilt.y === 0 
                  ? "0 10px 30px rgba(0,0,0,0.05)" 
                  : `${-tilt.y * 2}px ${tilt.x * 2 + 20}px 40px rgba(99, 102, 241, 0.15)`
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              
              {/* Card Header */}
              <div style={S.cardHeader}>
                <div style={S.cardDecor} />
                <h2 style={{...S.cardTitle, transform: "translateZ(30px)"}}>Company Identity</h2>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} style={{...S.editBadge, transform: "translateZ(20px)"}}>
                    <Icon.edit /> Edit Mode
                  </button>
                )}
              </div>

              <div style={S.cardBody}>
                
                {/* Avatar Section popping out */}
                <section style={{...S.section, transform: "translateZ(40px)"}}>
                  <div style={S.avatarRow}>
                    <div 
                      style={{ ...S.avatarRing, ...(dragOver ? S.avatarRingActive : {}) }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt="Profile" style={S.avatarImg} onError={() => { setPreview(null); setImage(null); }} />
                      ) : (
                        <div style={S.avatarInitials}>{initials(userName)}</div>
                      )}
                      <div style={S.avatarOverlay}>
                        <Icon.upload />
                        <span style={{ fontSize: 11, marginTop: 4 }}>Change</span>
                      </div>
                      {uploading && <div style={S.avatarUploading}><div style={S.spinner} /></div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                    
                    <div style={S.avatarInfo}>
                      <p style={S.avatarName}>{userName}</p>
                      <p style={S.avatarEmail}>{userEmail}</p>
                      <button onClick={() => fileRef.current?.click()} style={S.uploadBtn} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload New Photo"}
                      </button>
                    </div>
                  </div>
                </section>

                <div style={S.divider} />

                {/* Forms Section pushing into the Z-axis slightly */}
                <section style={{...S.section, transform: "translateZ(25px)"}}>
                  <div style={S.fieldsGrid}>
                    <div style={S.fieldWrap}>
                      <label style={S.label}><span style={S.labelIcon}><Icon.building /></span> Company Name</label>
                      <input
                        value={form.companyName}
                        disabled={!editMode}
                        placeholder="e.g. Acme Corp"
                        style={{ ...S.input, ...(editMode ? S.inputActive : S.inputDisabled) }}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      />
                    </div>
                    <div style={S.fieldWrap}>
                      <label style={S.label}><span style={S.labelIcon}><Icon.globe /></span> Company Website</label>
                      <input
                        value={form.companyWebsite}
                        disabled={!editMode}
                        placeholder="https://example.com"
                        style={{ ...S.input, ...(editMode ? S.inputActive : S.inputDisabled) }}
                        onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div style={{...S.actionRow, transform: "translateZ(35px)"}}>
                      <div style={S.changeNote}>
                        <span style={{ color: hasChanges ? "#F59E0B" : "#94A3B8" }}>●</span> 
                        {hasChanges ? " Unsaved changes" : " No changes yet"}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleCancel} style={S.cancelBtn}><Icon.cancel /> Cancel</button>
                        <button onClick={handleSave} style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                          {saving ? "Saving..." : <><Icon.save /> Save</>}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3D Floating Overview Cards */}
                <div style={{...S.overviewGrid, transform: "translateZ(50px)", marginTop: 40}}>
                  {[
                    { label: "Account Status", value: "Verified Recruiter", bg: "#EEF2FF", color: "#6366F1" },
                    { label: "Active Jobs", value: "Linked to Dashboard", bg: "#ECFDF5", color: "#10B981" }
                  ].map(item => (
                    <div key={item.label} style={{...S.overviewCard, background: item.bg, borderLeft: `4px solid ${item.color}`}}>
                      <p style={S.overviewLabel}>{item.label}</p>
                      <p style={{...S.overviewVal, color: item.color}}>{item.value}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const S = {
  layout: { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, sans-serif" },
  
  /* Sidebar */
  sidebar: { width: 240, background: "#0F172A", color: "#CBD5E1", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, height: "100vh", zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoMark: { width: 34, height: 34, borderRadius: 8, background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  logoText: { fontSize: 16, fontWeight: 600, color: "#F1F5F9" },
  navSection: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#475569", marginBottom: 8 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#94A3B8", marginBottom: 3, position: "relative" },
  navItemActive: { background: "#1E293B", color: "#F1F5F9" },
  navIcon: { fontSize: 14, width: 18, textAlign: "center" },
  activeDot: { width: 6, height: 6, borderRadius: "50%", background: "#6366F1", marginLeft: "auto" },

  /* Main Area */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },
  topbar: { background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 },
  pageSub: { fontSize: 12, color: "#94A3B8", margin: "2px 0 0" },
  
  /* Content & 3D Environment */
  contentWrapper: { padding: 40, flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "24px 24px" },
  perspectiveContainer: { perspective: "1500px", width: "100%", maxWidth: 750 },
  
  /* 3D Card */
  card3D: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    border: "1px solid #E2E8F0",
    transformStyle: "preserve-3d", // Crucial for inner 3D pop
    transition: "transform 0.1s ease-out, box-shadow 0.1s ease-out",
    position: "relative",
  },
  cardHeader: { padding: "28px 32px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardDecor: { position: "absolute", top: -50, right: -50, width: 150, height: 150, background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%" },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" },
  cardBody: { padding: "32px", transformStyle: "preserve-3d" },

  /* Avatars & Inputs (Adapted to light mode) */
  avatarRow: { display: "flex", alignItems: "center", gap: 24 },
  avatarRing: { width: 90, height: 90, borderRadius: "50%", border: "3px solid #EEF2FF", position: "relative", cursor: "pointer", overflow: "hidden", transition: "0.2s" },
  avatarRingActive: { borderColor: "#6366F1", transform: "scale(1.05)" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { width: "100%", height: "100%", background: "#EEF2FF", color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 },
  avatarOverlay: { position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.6)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0, transition: "0.2s" },
  avatarUploading: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" },
  avatarInfo: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  avatarName: { fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" },
  avatarEmail: { fontSize: 13, color: "#64748B", margin: "0 0 12px" },
  uploadBtn: { padding: "8px 16px", borderRadius: 8, background: "#F1F5F9", border: "none", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "background 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },

  fieldsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  fieldWrap: { transformStyle: "preserve-3d" },
  label: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 },
  labelIcon: { color: "#6366F1" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid", outline: "none", fontSize: 14, transition: "all 0.2s", boxSizing: "border-box", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" },
  inputActive: { borderColor: "#6366F1", background: "#fff", color: "#0F172A", boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)" },
  inputDisabled: { borderColor: "#E2E8F0", background: "#F8FAFC", color: "#94A3B8" },

  divider: { height: 1, background: "#F1F5F9", margin: "32px 0" },
  editBadge: { display: "flex", alignItems: "center", gap: 6, background: "#EEF2FF", color: "#6366F1", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer" },
  
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" },
  changeNote: { fontSize: 13, fontWeight: 500 },
  cancelBtn: { padding: "8px 16px", borderRadius: 8, background: "#fff", border: "1px solid #E2E8F0", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  saveBtn: { padding: "8px 16px", borderRadius: 8, background: "#6366F1", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" },

  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  overviewCard: { padding: "16px", borderRadius: 12, boxShadow: "0 4px 10px rgba(0,0,0,0.03)" },
  overviewLabel: { fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", marginBottom: 4 },
  overviewVal: { fontSize: 15, fontWeight: 700, margin: 0 },

  /* Utilities */
  toastStack: { position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, zIndex: 9999 },
  toast: { display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, background: "#fff", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", borderLeft: "4px solid" },
  toastSuccess: { borderLeftColor: "#10B981" },
  toastError: { borderLeftColor: "#EF4444" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC" },
  spinner: { width: 36, height: 36, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }
};

export const globalStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  div:hover > .avatarOverlay { opacity: 1 !important; }
`;