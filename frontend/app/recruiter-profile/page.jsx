"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../lib/api";
import { useRouter, usePathname } from "next/navigation";

/* ─────────────────────────────────────────────
   Global CSS  (injected once into <head>)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn     { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
  @keyframes drawerIn    { from { transform:translateX(-100%); } to { transform:translateX(0); } }
  @keyframes overlayIn   { from { opacity:0; } to { opacity:1; } }

  input::placeholder, textarea::placeholder { color:#CBD5E1; }
  input:focus, textarea:focus, select:focus  { outline:none; }
  select { -webkit-appearance:none; appearance:none; }

  /* Hover states (can't do :hover with inline styles) */
  .rp-nav-item:hover          { background:#1E293B !important; color:#F1F5F9 !important; }
  .rp-upload-btn:hover        { background:#E2E8F0 !important; }
  .rp-edit-badge:hover        { background:#E0E7FF !important; }
  .rp-cancel-btn:hover        { background:#F1F5F9 !important; }
  .rp-save-btn:hover          { background:#4F46E5 !important; }
  .rp-stat-card:hover         { transform:translateY(-3px) !important; box-shadow:0 12px 24px rgba(0,0,0,0.08) !important; }
  .rp-avatar-ring:hover .rp-avatar-overlay { opacity:1 !important; }
  .rp-bottom-nav-item:hover   { color:#6366F1 !important; }
  .rp-hamburger:hover         { background:#1E293B !important; }

  /* Responsive helpers */
  @media (max-width: 767px) {
    .rp-fields-grid   { grid-template-columns: 1fr !important; }
    .rp-stats-row     { grid-template-columns: 1fr 1fr !important; }
    .rp-avatar-row    { flex-direction: column !important; align-items: flex-start !important; }
    .rp-action-row    { flex-direction: column !important; gap: 12px !important; align-items: stretch !important; }
    .rp-action-btns   { justify-content: flex-end !important; }
    .rp-card-header   { flex-wrap: wrap !important; gap: 10px !important; }
    .rp-topbar        { padding: 12px 16px !important; }
    .rp-content       { padding: 16px !important; }
    .rp-card-body     { padding: 20px 16px !important; }
  }
  @media (max-width: 400px) {
    .rp-stats-row     { grid-template-columns: 1fr !important; }
    .rp-toast         { left: 12px !important; right: 12px !important; }
  }
`;

function useGlobalStyles() {
  useEffect(() => {
    const id = "rp-global-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, []);
}

/* ─────────────────────────────────────────────
   useIsMobile hook
───────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setMobile(mq.matches);
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return mobile;
}

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
   Constants
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

const INDUSTRY_OPTIONS = [
  "Technology","Finance & Banking","Healthcare","Education","E-Commerce",
  "Manufacturing","Media & Entertainment","Consulting","Logistics","Government","Other",
];
const COMPANY_SIZE_OPTIONS = [
  "1–10 employees","11–50 employees","51–200 employees",
  "201–500 employees","501–1000 employees","1000+ employees",
];

/* ─────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────── */
const I = {
  edit:      (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  save:      (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  cancel:    (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  upload:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  globe:     (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  building:  (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  location:  (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  users:     (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  calendar:  (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  industry:  (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  text:      (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  linkedin:  (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  briefcase: (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  ok:        (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  err:       (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  shield:    (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:      (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  menu:      (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye:       (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

/* ─────────────────────────────────────────────
   Small reusable components
───────────────────────────────────────────── */
function Field({ icon, label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <label style={S.label}><span style={S.labelIcon}>{icon}</span>{label}</label>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
      <span style={S.sectionIcon}>{icon}</span>
      <div>
        <p style={S.sectionTitle}>{title}</p>
        {subtitle && <p style={S.sectionSub}>{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, color, sub }) {
  return (
    <div className="rp-stat-card" style={{ background:bg, borderLeft:`4px solid ${color}`, ...S.statCard, transition:"transform 0.2s, box-shadow 0.2s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={S.statLabel}>{label}</p>
          <p style={{ ...S.statValue, color }}>{value}</p>
          {sub && <p style={S.statSub}>{sub}</p>}
        </div>
        <span style={{ color, opacity:0.7 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sidebar (shared between desktop & drawer)
───────────────────────────────────────────── */
function SidebarContent({ pathname, router, completeness, onClose }) {
  return (
    <>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={S.logoMark}>R</div>
          <span style={S.logoText}>RΣCRUITER</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#94A3B8", cursor:"pointer", padding:4 }}>
            {I.close(22)}
          </button>
        )}
      </div>

      <p style={S.navSection}>Main Menu</p>
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path;
          return (
            <div
              key={item.path}
              className="rp-nav-item"
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

      {/* Profile strength meter */}
      <div style={S.sidebarMeter}>
        <p style={{ fontSize:11, fontWeight:600, color:"#475569", marginBottom:8 }}>PROFILE STRENGTH</p>
        <div style={S.progressTrack}>
          <div style={{
            ...S.progressFill,
            width:`${completeness}%`,
            background: completeness >= 80 ? "#10B981" : completeness >= 50 ? "#F59E0B" : "#6366F1"
          }} />
        </div>
        <p style={{ fontSize:12, color:"#94A3B8", marginTop:6 }}>{completeness}% complete</p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function RecruiterProfile() {
  useGlobalStyles();
  const isMobile = useIsMobile();

  const router   = useRouter();
  const pathname = usePathname();
  const fileRef  = useRef();
  const { toasts, add: toast } = useToast();

  const EMPTY = {
    companyName:"", companyWebsite:"", companyDescription:"",
    industry:"", companySize:"", location:"", foundedYear:"", linkedinUrl:"",
  };

  const [image,      setImage]      = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [original,   setOriginal]   = useState(EMPTY);
  const [editMode,   setEditMode]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [dragOver,   setDragOver]   = useState(false);
  const [userName,   setUserName]   = useState("Recruiter");
  const [userEmail,  setUserEmail]  = useState("");
  const [jobCount,   setJobCount]   = useState(0);
  const [tilt,       setTilt]       = useState({ x:0, y:0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        setUserName(localStorage.getItem("name")  || "Recruiter");
        setUserEmail(localStorage.getItem("email") || "");
        const [profRes, userRes] = await Promise.all([
          api.get("/recruiter/profile", { headers:{ Authorization:`Bearer ${token}` } }),
          api.get("/user/me",           { headers:{ Authorization:`Bearer ${token}` } }),
        ]);
        if (profRes.data) {
          const merged = { ...EMPTY, ...profRes.data };
          setForm(merged); setOriginal(merged);
          setJobCount(profRes.data.jobCount ?? 0);
        }
        if (userRes.data?.image) setImage(userRes.data.image);
      } catch (err) {
        if (err.response?.status === 401) { localStorage.clear(); router.push("/login"); return; }
        toast("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, toast]);

  /* ── 3D tilt (desktop only) ── */
  const handleMouseMove = (e) => {
    if (isMobile) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top  - r.height/2) / r.height) * -5,
      y: ((e.clientX - r.left - r.width /2) / r.width ) *  5,
    });
  };
  const handleMouseLeave = () => setTilt({ x:0, y:0 });

  /* ── Upload ── */
  const processUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) { toast("Please select a valid image file","error"); return; }
    if (file.size > 5*1024*1024)                  { toast("Image must be under 5 MB","error");         return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("token");
      const res = await api.post("/user/upload", fd, { headers:{ Authorization:`Bearer ${token}` } });
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
  const handleDrop       = (e) => { e.preventDefault(); setDragOver(false); processUpload(e.dataTransfer.files[0]); };

  /* ── Save ── */
  const handleSave = async () => {
    if (!form.companyName.trim()) { toast("Company name is required","error"); return; }
    if (form.foundedYear && (isNaN(form.foundedYear) || form.foundedYear < 1800 || form.foundedYear > new Date().getFullYear())) {
      toast("Enter a valid founded year","error"); return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await api.put("/recruiter/profile", form, { headers:{ Authorization:`Bearer ${token}` } });
      setOriginal({ ...form });
      setEditMode(false);
      toast("Profile saved successfully!", "success");
    } catch { toast("Failed to save. Try again.", "error"); }
    finally   { setSaving(false); }
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    setForm({ ...original });
    setEditMode(false);
    toast("Changes discarded","error");
  };

  /* ── Helpers ── */
  const field      = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const initials   = (n="") => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "R";
  const imgSrc     = preview || (image ? `http://localhost:3000${image}` : null);
  const hasChanges = JSON.stringify(form) !== JSON.stringify(original);

  const completeness = (() => {
    const keys = ["companyName","companyWebsite","companyDescription","industry","companySize","location","foundedYear","linkedinUrl"];
    return Math.round(keys.filter(k => form[k]?.toString().trim()).length / keys.length * 100);
  })();

  /* ── Shared input style helper ── */
  const inp = (active) => ({ ...S.input, ...(active ? S.inputActive : S.inputDisabled) });

  /* ── Loading screen ── */
  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={{ color:"#6B7280", marginTop:12, fontSize:14 }}>Loading profile…</p>
    </div>
  );

  /* ── RENDER ── */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Inter',sans-serif" }}>

      {/* ════ TOAST STACK ════ */}
      <div style={{ position:"fixed", bottom:isMobile?80:24, right:24, left:isMobile?12:"auto", display:"flex", flexDirection:"column", gap:10, zIndex:9999 }}>
        {toasts.map(t => (
          <div key={t.id} className="rp-toast" style={{
            ...S.toast,
            ...(t.type==="error" ? { borderLeftColor:"#EF4444" } : { borderLeftColor:"#10B981" }),
            animation:"toastIn 0.3s ease",
          }}>
            <span style={{ color: t.type==="error"?"#EF4444":"#10B981" }}>
              {t.type==="error" ? I.err() : I.ok()}
            </span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ════ MOBILE DRAWER OVERLAY ════ */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, animation:"overlayIn 0.2s ease" }}
        />
      )}

      {/* ════ MOBILE DRAWER ════ */}
      {isMobile && (
        <aside style={{
          position:"fixed", top:0, left:0, bottom:0, width:260,
          background:"#0F172A", zIndex:300, padding:"24px 16px",
          display:"flex", flexDirection:"column",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <SidebarContent pathname={pathname} router={router} completeness={completeness} onClose={() => setDrawerOpen(false)} />
        </aside>
      )}

      {/* ════ DESKTOP SIDEBAR ════ */}
      {!isMobile && (
        <aside style={S.sidebar}>
          <SidebarContent pathname={pathname} router={router} completeness={completeness} />
        </aside>
      )}

      {/* ════ MAIN ════ */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"auto", paddingBottom: isMobile ? 72 : 0 }}>

        {/* ── Top Bar ── */}
        <header className="rp-topbar" style={S.topbar}>
          {isMobile && (
            <button
              className="rp-hamburger"
              onClick={() => setDrawerOpen(true)}
              style={{ background:"none", border:"none", color:"#0F172A", cursor:"pointer", padding:"6px 8px", borderRadius:8, marginRight:10, transition:"background 0.15s" }}
            >
              {I.menu(22)}
            </button>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ ...S.pageTitle, fontSize: isMobile ? 16 : 20 }}>Profile Settings</h1>
            {!isMobile && <p style={S.pageSub}>Manage your recruiter identity and company presence</p>}
          </div>
          {/* Completeness badge — only show on desktop */}
          {!isMobile && (
            <div style={{
              display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20,
              fontSize:12, fontWeight:600, border:"1px solid", flexShrink:0,
              background: completeness>=80?"#ECFDF5":"#FEF3C7",
              color:      completeness>=80?"#059669":"#D97706",
              borderColor:completeness>=80?"#A7F3D0":"#FDE68A",
            }}>
              {I.star()} {completeness>=80 ? "Strong Profile" : `${completeness}% complete`}
            </div>
          )}
          {/* Mobile: inline strength pill */}
          {isMobile && (
            <div style={{ fontSize:11, fontWeight:700, color: completeness>=80?"#059669":"#D97706", background: completeness>=80?"#ECFDF5":"#FEF3C7", padding:"4px 10px", borderRadius:20, border:"1px solid", borderColor: completeness>=80?"#A7F3D0":"#FDE68A", flexShrink:0 }}>
              {completeness}%
            </div>
          )}
        </header>

        {/* ── Content ── */}
        <div
          className="rp-content"
          style={{ padding: isMobile ? 16 : "32px 40px", flex:1, display:"flex", flexDirection:"column", gap:20,
            backgroundImage:"radial-gradient(#E2E8F0 1px,transparent 1px)", backgroundSize:"24px 24px" }}
        >

          {/* ── Stat Cards ── */}
          <div className="rp-stats-row" style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:12, animation:"fadeSlideUp 0.4s ease" }}>
            <StatCard icon={I.briefcase()} label="Active Jobs"      value={jobCount||"—"}    sub="posted jobs"       bg="#EEF2FF" color="#6366F1" />
            <StatCard icon={I.shield()}    label="Account"          value="Verified"          sub="recruiter"         bg="#ECFDF5" color="#10B981" />
            <StatCard icon={I.star()}      label="Strength"         value={`${completeness}%`} sub="profile"         bg="#FEF3C7" color="#F59E0B" />
            <StatCard icon={I.eye()}       label="Profile Views"    value="—"                 sub="this month"        bg="#F0FDF4" color="#22C55E" />
          </div>

          {/* ── 3D Card ── */}
          <div style={{ perspective: isMobile ? "none" : "1500px", width:"100%", animation:"fadeSlideUp 0.5s ease" }}>
            <div
              style={{
                ...S.card,
                transform: isMobile ? "none" : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                boxShadow: (!isMobile && (tilt.x!==0||tilt.y!==0))
                  ? `${-tilt.y*2}px ${tilt.x*2+20}px 40px rgba(99,102,241,0.15)`
                  : "0 4px 20px rgba(0,0,0,0.06)",
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >

              {/* Card Header */}
              <div className="rp-card-header" style={S.cardHeader}>
                <div style={S.cardDecor} />
                <h2 style={S.cardTitle}>Company Identity</h2>
                {!editMode ? (
                  <button className="rp-edit-badge" onClick={() => setEditMode(true)} style={S.editBadge}>
                    {I.edit()} {isMobile ? "Edit" : "Edit Profile"}
                  </button>
                ) : (
                  <span style={S.editingPill}>● Editing</span>
                )}
              </div>

              <div className="rp-card-body" style={S.cardBody}>

                {/* ── Photo Section ── */}
                <SectionHeader icon={I.upload()} title="Profile Photo" subtitle="Click or drag-and-drop to update (max 5 MB)" />
                <div className="rp-avatar-row" style={{ display:"flex", alignItems: isMobile?"flex-start":"center", flexDirection: isMobile?"column":"row", gap: isMobile?16:24, marginBottom:4 }}>
                  <div
                    className="rp-avatar-ring"
                    style={{ ...S.avatarRing, ...(dragOver ? { borderColor:"#6366F1", transform:"scale(1.05)" } : {}) }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    {imgSrc
                      ? <img src={imgSrc} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>{ setPreview(null); setImage(null); }} />
                      : <div style={S.avatarInitials}>{initials(userName)}</div>
                    }
                    <div className="rp-avatar-overlay" style={S.avatarOverlay}>
                      {I.upload(20)}
                      <span style={{ fontSize:11, marginTop:4 }}>Change</span>
                    </div>
                    {uploading && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={S.spinner} />
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:"none" }} />

                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <p style={S.avatarName}>{userName}</p>
                    <p style={S.avatarEmail}>{userEmail}</p>
                    <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                      <button className="rp-upload-btn" onClick={() => fileRef.current?.click()} style={S.uploadBtn} disabled={uploading}>
                        {uploading ? "Uploading…" : "Upload Photo"}
                      </button>
                      {(preview || image) && (
                        <button onClick={() => { setPreview(null); setImage(null); }} style={S.removeBtn}>Remove</button>
                      )}
                    </div>
                    <p style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>JPG · PNG · WEBP · Max 5 MB</p>
                  </div>
                </div>

                <div style={S.divider} />

                {/* ── Company Details ── */}
                <SectionHeader icon={I.building()} title="Company Details" subtitle="Core info about your organisation" />
                <div className="rp-fields-grid" style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:18, marginBottom:4 }}>
                  <Field icon={I.building()} label="Company Name *">
                    <input value={form.companyName} disabled={!editMode} placeholder="e.g. Acme Corp" style={inp(editMode)} onChange={field("companyName")} />
                  </Field>
                  <Field icon={I.globe()} label="Company Website">
                    <input value={form.companyWebsite} disabled={!editMode} placeholder="https://example.com" style={inp(editMode)} onChange={field("companyWebsite")} />
                  </Field>
                  <Field icon={I.industry()} label="Industry">
                    <select value={form.industry} disabled={!editMode} onChange={field("industry")} style={{ ...inp(editMode), cursor: editMode?"pointer":"default" }}>
                      <option value="">Select industry…</option>
                      {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field icon={I.users()} label="Company Size">
                    <select value={form.companySize} disabled={!editMode} onChange={field("companySize")} style={{ ...inp(editMode), cursor: editMode?"pointer":"default" }}>
                      <option value="">Select size…</option>
                      {COMPANY_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field icon={I.location()} label="Location / HQ">
                    <input value={form.location} disabled={!editMode} placeholder="e.g. Chennai, Tamil Nadu" style={inp(editMode)} onChange={field("location")} />
                  </Field>
                  <Field icon={I.calendar()} label="Founded Year">
                    <input type="number" value={form.foundedYear} disabled={!editMode} placeholder={`e.g. ${new Date().getFullYear()-5}`} min="1800" max={new Date().getFullYear()} style={inp(editMode)} onChange={field("foundedYear")} />
                  </Field>
                </div>

                <div style={S.divider} />

                {/* ── About & Social ── */}
                <SectionHeader icon={I.text()} title="About & Social" subtitle="Help candidates learn more about your company" />
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  <Field icon={I.text()} label="Company Description">
                    <textarea
                      value={form.companyDescription}
                      disabled={!editMode}
                      rows={isMobile ? 3 : 4}
                      maxLength={500}
                      placeholder="Describe your company's mission, culture, and work…"
                      style={{ ...inp(editMode), resize:"vertical", minHeight:90, lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}
                      onChange={field("companyDescription")}
                    />
                    <p style={{ fontSize:11, color:"#94A3B8", textAlign:"right", marginTop:4 }}>
                      {(form.companyDescription||"").length} / 500
                    </p>
                  </Field>
                  <Field icon={I.linkedin()} label="LinkedIn URL">
                    <input value={form.linkedinUrl} disabled={!editMode} placeholder="https://linkedin.com/company/your-company" style={inp(editMode)} onChange={field("linkedinUrl")} />
                  </Field>
                </div>

                {/* ── Action Bar ── */}
                {editMode && (
                  <div className="rp-action-row" style={{ ...S.actionRow, flexDirection: isMobile?"column":"row", gap: isMobile?12:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:"#475569" }}>
                      <span style={{ color: hasChanges?"#F59E0B":"#94A3B8" }}>●</span>
                      {" "}{hasChanges ? "Unsaved changes" : "No changes yet"}
                    </div>
                    <div className="rp-action-btns" style={{ display:"flex", gap:10, justifyContent: isMobile?"stretch":"flex-end" }}>
                      <button className="rp-cancel-btn" onClick={handleCancel} style={{ ...S.cancelBtn, flex: isMobile?1:"none" }}>
                        {I.cancel()} Cancel
                      </button>
                      <button
                        className="rp-save-btn"
                        onClick={handleSave}
                        style={{ ...S.saveBtn, flex: isMobile?1:"none", opacity: (saving||!hasChanges)?0.6:1 }}
                        disabled={saving || !hasChanges}
                      >
                        {saving ? "Saving…" : <>{I.save()} Save Changes</>}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      {isMobile && (
        <nav style={S.bottomNav}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                className="rp-bottom-nav-item"
                onClick={() => router.push(item.path)}
                style={{ ...S.bottomNavItem, color: active?"#6366F1":"#94A3B8", transition:"color 0.15s" }}
              >
                <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:10, fontWeight: active?700:500, marginTop:3 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Styles Object
───────────────────────────────────────────── */
const S = {
  /* Sidebar (desktop) */
  sidebar:      { width:240, minWidth:240, background:"#0F172A", color:"#CBD5E1", display:"flex", flexDirection:"column", padding:"24px 16px", position:"sticky", top:0, height:"100vh", zIndex:100, overflowY:"auto" },
  logoMark:     { width:34, height:34, borderRadius:8, background:"#6366F1", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16, flexShrink:0 },
  logoText:     { fontSize:16, fontWeight:600, color:"#F1F5F9" },
  navSection:   { fontSize:10, fontWeight:600, textTransform:"uppercase", color:"#475569", marginBottom:8 },
  navItem:      { display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#94A3B8", marginBottom:3, position:"relative", transition:"background 0.15s, color 0.15s" },
  navItemActive:{ background:"#1E293B", color:"#F1F5F9" },
  navIcon:      { fontSize:14, width:18, textAlign:"center" },
  activeDot:    { width:6, height:6, borderRadius:"50%", background:"#6366F1", marginLeft:"auto" },
  sidebarMeter: { marginTop:"auto", padding:"16px", background:"#1E293B", borderRadius:12 },
  progressTrack:{ height:6, background:"#334155", borderRadius:99 },
  progressFill: { height:"100%", borderRadius:99, transition:"width 0.5s ease" },

  /* Top bar */
  topbar:     { background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"14px 28px", display:"flex", alignItems:"center", position:"sticky", top:0, zIndex:50 },
  pageTitle:  { fontWeight:700, color:"#0F172A", lineHeight:1.2 },
  pageSub:    { fontSize:12, color:"#94A3B8", margin:"2px 0 0" },

  /* Stat cards */
  statCard:   { padding:"14px 16px", borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", cursor:"default" },
  statLabel:  { fontSize:10, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 },
  statValue:  { fontSize:20, fontWeight:700, marginBottom:2 },
  statSub:    { fontSize:10, color:"#94A3B8" },

  /* Card */
  card:       { background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)", borderRadius:20, border:"1px solid #E2E8F0", transformStyle:"preserve-3d", transition:"transform 0.12s ease-out, box-shadow 0.12s ease-out" },
  cardHeader: { padding:"20px 24px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", overflow:"hidden", borderTopLeftRadius:20, borderTopRightRadius:20 },
  cardDecor:  { position:"absolute", top:-50, right:-50, width:160, height:160, background:"radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none" },
  cardTitle:  { fontWeight:700, color:"#0F172A", fontSize:16 },
  cardBody:   { padding:"24px 28px", display:"flex", flexDirection:"column", gap:0 },
  editBadge:  { display:"flex", alignItems:"center", gap:6, background:"#EEF2FF", color:"#6366F1", border:"1px solid #E0E7FF", padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", transition:"background 0.15s", flexShrink:0 },
  editingPill:{ fontSize:12, fontWeight:600, color:"#F59E0B", background:"#FEF3C7", padding:"5px 14px", borderRadius:20, border:"1px solid #FDE68A" },

  /* Section headers */
  sectionIcon:  { width:32, height:32, borderRadius:8, background:"#EEF2FF", color:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  sectionTitle: { fontSize:14, fontWeight:700, color:"#0F172A" },
  sectionSub:   { fontSize:11, color:"#94A3B8", marginTop:2 },

  /* Avatar */
  avatarRing:    { width:90, height:90, borderRadius:"50%", border:"3px solid #EEF2FF", position:"relative", cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s, transform 0.2s", flexShrink:0 },
  avatarInitials:{ width:"100%", height:"100%", background:"#EEF2FF", color:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:700 },
  avatarOverlay: { position:"absolute", inset:0, background:"rgba(15,23,42,0.65)", color:"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s" },
  avatarName:    { fontSize:17, fontWeight:700, color:"#0F172A" },
  avatarEmail:   { fontSize:13, color:"#64748B" },
  uploadBtn:     { padding:"8px 14px", borderRadius:8, background:"#F1F5F9", border:"1px solid #E2E8F0", fontSize:12, fontWeight:600, color:"#475569", cursor:"pointer", transition:"background 0.15s" },
  removeBtn:     { padding:"8px 14px", borderRadius:8, background:"#FEF2F2", border:"1px solid #FCA5A5", fontSize:12, fontWeight:600, color:"#EF4444", cursor:"pointer" },

  /* Fields */
  label:       { display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#475569", marginBottom:7 },
  labelIcon:   { color:"#6366F1" },
  input:       { width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid", fontSize:14, transition:"all 0.2s", fontFamily:"'Inter',sans-serif", WebkitAppearance:"none" },
  inputActive: { borderColor:"#6366F1", background:"#fff", color:"#0F172A", boxShadow:"0 0 0 3px rgba(99,102,241,0.1)" },
  inputDisabled:{ borderColor:"#E2E8F0", background:"#F8FAFC", color:"#64748B" },

  divider:     { height:1, background:"#F1F5F9", margin:"24px 0" },

  /* Action row */
  actionRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:24, padding:"14px 18px", background:"#F8FAFC", borderRadius:12, border:"1px solid #E2E8F0" },
  cancelBtn:   { display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 18px", borderRadius:8, background:"#fff", border:"1px solid #E2E8F0", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer", transition:"background 0.15s" },
  saveBtn:     { display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 18px", borderRadius:8, background:"#6366F1", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 12px rgba(99,102,241,0.3)", transition:"background 0.15s" },

  /* Toast */
  toast:       { display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderRadius:12, fontSize:13, fontWeight:500, background:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", borderLeft:"4px solid" },

  /* Bottom nav (mobile) */
  bottomNav:      { position:"fixed", bottom:0, left:0, right:0, height:64, background:"#fff", borderTop:"1px solid #E2E8F0", display:"flex", alignItems:"stretch", zIndex:100, boxShadow:"0 -4px 16px rgba(0,0,0,0.06)" },
  bottomNavItem:  { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"none", background:"none", cursor:"pointer", padding:"6px 0" },

  /* Loading */
  loadingWrap: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F8FAFC" },
  spinner:     { width:34, height:34, border:"3px solid #E2E8F0", borderTopColor:"#6366F1", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
};