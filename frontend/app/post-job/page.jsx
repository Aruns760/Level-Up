"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../lib/api";

/* ─────────────────────────────────────────────
   Global CSS
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes toastIn     { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulse       { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

  input::placeholder, textarea::placeholder, select::placeholder { color:#CBD5E1; }
  input:focus, textarea:focus, select:focus { outline:none; }
  select { -webkit-appearance:none; appearance:none; }

  .pj-nav-item:hover        { background:#1E293B !important; color:#F1F5F9 !important; }
  .pj-back-btn:hover        { background:#E2E8F0 !important; }
  .pj-submit-btn:hover:not(:disabled) { background:#4F46E5 !important; transform:translateY(-1px) !important; }
  .pj-input:focus           { border-color:#6366F1 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.12) !important; }
  .pj-tag-remove:hover      { background:#FEE2E2 !important; color:#DC2626 !important; }
  .pj-preset-tag:hover      { background:#EEF2FF !important; border-color:#6366F1 !important; color:#6366F1 !important; }
  .pj-hamburger:hover       { background:#1E293B !important; }
  .pj-bottom-nav-item:hover { color:#6366F1 !important; }
`;

/* ─────────────────────────────────────────────
   FIX 1 — useGlobalStyles
   Problem: useEffect had missing deps 'id' and 'css'.
   Fix: Since id & css are module-level constants that
   never change, we pass them as refs so they're stable
   across renders and the dep array can safely be [].
   Using useRef captures them once without triggering
   re-runs, satisfying exhaustive-deps without lint noise.
───────────────────────────────────────────── */
function useGlobalStyles(id, css) {
  const idRef  = useRef(id);
  const cssRef = useRef(css);

  useEffect(() => {
    const styleId  = idRef.current;
    const styleCSS = cssRef.current;
    if (document.getElementById(styleId)) return;
    const el = document.createElement("style");
    el.id = styleId;
    el.textContent = styleCSS;
    document.head.appendChild(el);
    return () => document.getElementById(styleId)?.remove();
  }, []); // ✅ empty dep array is now correct — values captured via refs
}

/* ─────────────────────────────────────────────
   FIX 2 — useIsMobile
   Problem: setMob(mq.matches) was called synchronously
   inside the effect body, causing cascading renders.
   Fix: Use a lazy useState initializer to read the
   initial value before the first render. The effect
   then only registers the "change" listener — it never
   calls setState synchronously itself.
───────────────────────────────────────────── */
function useIsMobile(bp = 768) {
  const [mob, setMob] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${bp - 1}px)`).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp - 1}px)`);
    const h  = (e) => setMob(e.matches); // ✅ setState only in callback, not in body
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);

  return mob;
}

/* ─────────────────────────────────────────────
   Toast
───────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
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

const JOB_TYPES     = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Remote"];
const EXP_LEVELS    = ["Entry Level (0–1 yrs)", "Junior (1–3 yrs)", "Mid-Level (3–5 yrs)", "Senior (5–8 yrs)", "Lead / Principal (8+ yrs)"];
const DEPT_OPTIONS  = ["Engineering", "Design", "Product", "Marketing", "Sales", "Finance", "HR", "Operations", "Data & Analytics", "Other"];
const SKILL_PRESETS = ["React", "Node.js", "Python", "Java", "SQL", "AWS", "TypeScript", "Docker", "Figma", "MongoDB"];

/* ─────────────────────────────────────────────
   Icons
───────────────────────────────────────────── */
const I = {
  menu:     (s=20)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:    (s=20)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:     (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  briefcase:(s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  location: (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  money:    (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  clock:    (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users:    (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  text:     (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  tag:      (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  star:     (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  check:    (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  err:      (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  info:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  send:     (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function SidebarContent({ pathname, router, onClose }) {
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
      <nav>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path;
          return (
            <div
              key={item.path}
              className="pj-nav-item"
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

      {/* Tips box */}
      <div style={{ marginTop:"auto", background:"#1E293B", borderRadius:12, padding:14 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#6366F1", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          💡 Quick Tips
        </p>
        {[
          "Be specific in the title",
          "Add salary range to get 3× more applicants",
          "List top 5 required skills only",
        ].map((t, i) => (
          <p key={i} style={{ fontSize:11, color:"#64748B", marginBottom:5, paddingLeft:10, borderLeft:"2px solid #334155", lineHeight:1.5 }}>
            {t}
          </p>
        ))}
      </div>
    </>
  );
}

function Field({ icon, label, required, hint, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <label style={S.label}>
        <span style={S.labelIcon}>{icon}</span>
        {label}
        {required && <span style={{ color:"#EF4444", marginLeft:2 }}>*</span>}
      </label>
      {hint && <p style={S.hint}>{hint}</p>}
      {children}
    </div>
  );
}

function ProgressBar({ value }) {
  const color = value < 40 ? "#EF4444" : value < 75 ? "#F59E0B" : "#10B981";
  const label = value < 40 ? "Incomplete" : value < 75 ? "Almost there" : "Ready to publish";
  return (
    <div style={{ background:"#F1F5F9", borderRadius:12, padding:"14px 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <p style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Form completion</p>
        <span style={{ fontSize:12, fontWeight:700, color }}>{label} · {value}%</span>
      </div>
      <div style={{ height:6, background:"#E2E8F0", borderRadius:99 }}>
        <div style={{ height:"100%", width:`${value}%`, background:color, borderRadius:99, transition:"width 0.4s ease" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function PostJob() {
  useGlobalStyles("pj-styles", GLOBAL_CSS);
  const isMobile = useIsMobile();
  const router   = useRouter();
  const pathname = usePathname();
  const { toasts, add: toast } = useToast();

  const EMPTY = {
    title:"", description:"", location:"", salary:"",
    jobType:"", experienceLevel:"", department:"",
    openings:"1", deadline:"", benefits:"",
  };

  const [form,       setForm]       = useState(EMPTY);
  const [skills,     setSkills]     = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(false);

  const field = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  /* ── Skills tag input ── */
  const addSkill = (s) => {
    const trimmed = (s || skillInput).trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 15) return;
    setSkills(sk => [...sk, trimmed]);
    setSkillInput("");
  };
  const removeSkill = (s) => setSkills(sk => sk.filter(x => x !== s));
  const handleSkillKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
    if (e.key === "Backspace" && !skillInput && skills.length) removeSkill(skills[skills.length - 1]);
  };

  /* ── Completion % ── */
  const completion = (() => {
    const keys   = ["title","description","location","salary","jobType","experienceLevel","department"];
    const filled = keys.filter(k => form[k]?.trim()).length;
    const skillPt = skills.length > 0 ? 1 : 0;
    return Math.round(((filled + skillPt) / (keys.length + 1)) * 100);
  })();

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (!form.title.trim())            e.title           = "Job title is required";
    if (!form.description.trim())      e.description     = "Description is required";
    if (form.description.length < 80)  e.description     = "Description should be at least 80 characters";
    if (!form.location.trim())         e.location        = "Location is required";
    if (!form.salary.trim())           e.salary          = "Salary range is required";
    if (!form.jobType)                 e.jobType         = "Select a job type";
    if (!form.experienceLevel)         e.experienceLevel = "Select experience level";
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast("Please fix the errors below", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const role  = localStorage.getItem("role");
      if (!token || role !== "recruiter") {
        toast("Please login as a recruiter", "error");
        router.push("/login");
        return;
      }
      await api.post("/jobs/create", { ...form, skills }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmitted(true);
      toast("Job published successfully!", "success");
      setTimeout(() => router.push("/recruiter-jobs"), 1800);
    } catch (err) {
      toast(err.response?.data?.message || "Server error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#F8FAFC", fontFamily:"'Inter',sans-serif" }}>

      {/* ── Toasts ── */}
      <div style={{ position:"fixed", bottom: isMobile?80:24, right:24, left: isMobile?12:"auto", display:"flex", flexDirection:"column", gap:10, zIndex:9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...S.toast, borderLeftColor: t.type==="error"?"#EF4444":"#10B981", animation:"toastIn 0.3s ease" }}>
            <span style={{ color: t.type==="error"?"#EF4444":"#10B981" }}>
              {t.type==="error" ? I.err() : I.check()}
            </span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Mobile overlay ── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200 }}
        />
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <aside style={{
          position:"fixed", top:0, left:0, bottom:0, width:260,
          background:"#0F172A", zIndex:300, padding:"24px 16px",
          display:"flex", flexDirection:"column",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <SidebarContent pathname={pathname} router={router} onClose={() => setDrawerOpen(false)} />
        </aside>
      )}

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside style={S.sidebar}>
          <SidebarContent pathname={pathname} router={router} />
        </aside>
      )}

      {/* ── Main ── */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, paddingBottom: isMobile?72:0 }}>

        {/* Topbar */}
        <header className="pj-topbar" style={S.topbar}>
          {isMobile && (
            <button
              className="pj-hamburger"
              onClick={() => setDrawerOpen(true)}
              style={{ background:"none", border:"none", color:"#0F172A", cursor:"pointer", padding:"6px 8px", borderRadius:8, marginRight:10, transition:"background 0.15s" }}
            >
              {I.menu(22)}
            </button>
          )}
          <div style={{ flex:1 }}>
            <h1 style={{ ...S.pageTitle, fontSize: isMobile?16:20 }}>Post a Job</h1>
            {!isMobile && <p style={S.pageSub}>Create a listing to find your next great hire</p>}
          </div>
          <button
            className="pj-back-btn"
            onClick={() => router.back()}
            style={{ ...S.backBtn, display:"flex", alignItems:"center", gap:5 }}
          >
            {I.back()} {!isMobile && "Back"}
          </button>
        </header>

        {/* Content */}
        <div
          className="pj-content"
          style={{ padding: isMobile?16:"28px 40px", flex:1, display:"flex", flexDirection:"column", gap:20,
            backgroundImage:"radial-gradient(#E2E8F0 1px,transparent 1px)", backgroundSize:"24px 24px" }}
        >

          {/* Progress bar */}
          <div style={{ animation:"fadeSlideUp 0.35s ease" }}>
            <ProgressBar value={completion} />
          </div>

          {/* ── Form Card ── */}
          <div style={{ ...S.card, animation:"fadeSlideUp 0.4s ease" }}>

            {/* Card header */}
            <div style={{ padding: isMobile?"16px 16px 0":"20px 28px 0", display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"#EEF2FF", color:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {I.briefcase(18)}
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0F172A" }}>Job Details</p>
                <p style={{ fontSize:12, color:"#94A3B8" }}>Fields marked * are required</p>
              </div>
            </div>

            <div style={{ padding: isMobile?"16px":"20px 28px 28px" }}>

              {/* Row 1 — Title + Department */}
              <div className="pj-form-grid" style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:18, marginBottom:18 }}>
                <Field icon={I.briefcase()} label="Job Title" required hint="Be specific — &apos;Senior React Developer&apos; beats &apos;Developer&apos;">
                  <input
                    className="pj-input"
                    value={form.title}
                    onChange={field("title")}
                    placeholder="e.g. Senior Frontend Developer"
                    style={{ ...S.input, ...(errors.title ? S.inputErr : {}) }}
                  />
                  {errors.title && <p style={S.errMsg}>{errors.title}</p>}
                </Field>
                <Field icon={I.users()} label="Department">
                  <select className="pj-input" value={form.department} onChange={field("department")} style={S.input}>
                    <option value="">Select department…</option>
                    {DEPT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              {/* Row 2 — Location + Job Type */}
              <div className="pj-form-grid" style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:18, marginBottom:18 }}>
                <Field icon={I.location()} label="Location" required hint="City, country or Remote">
                  <input
                    className="pj-input"
                    value={form.location}
                    onChange={field("location")}
                    placeholder="e.g. Chennai, India · Remote"
                    style={{ ...S.input, ...(errors.location ? S.inputErr : {}) }}
                  />
                  {errors.location && <p style={S.errMsg}>{errors.location}</p>}
                </Field>
                <Field icon={I.clock()} label="Job Type" required>
                  <select
                    className="pj-input"
                    value={form.jobType}
                    onChange={field("jobType")}
                    style={{ ...S.input, ...(errors.jobType ? S.inputErr : {}) }}
                  >
                    <option value="">Select type…</option>
                    {JOB_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.jobType && <p style={S.errMsg}>{errors.jobType}</p>}
                </Field>
              </div>

              {/* Row 3 — Salary + Experience */}
              <div className="pj-form-grid" style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:18, marginBottom:18 }}>
                <Field icon={I.money()} label="Salary Range" required hint="Listings with salary get 3x more applicants">
                  <input
                    className="pj-input"
                    value={form.salary}
                    onChange={field("salary")}
                    placeholder="e.g. ₹12L–₹18L / yr  or  $80k–$100k"
                    style={{ ...S.input, ...(errors.salary ? S.inputErr : {}) }}
                  />
                  {errors.salary && <p style={S.errMsg}>{errors.salary}</p>}
                </Field>
                <Field icon={I.star()} label="Experience Level" required>
                  <select
                    className="pj-input"
                    value={form.experienceLevel}
                    onChange={field("experienceLevel")}
                    style={{ ...S.input, ...(errors.experienceLevel ? S.inputErr : {}) }}
                  >
                    <option value="">Select level…</option>
                    {EXP_LEVELS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.experienceLevel && <p style={S.errMsg}>{errors.experienceLevel}</p>}
                </Field>
              </div>

              {/* Row 4 — Openings + Deadline */}
              <div className="pj-form-grid" style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:18, marginBottom:18 }}>
                <Field icon={I.users()} label="Number of Openings">
                  <input
                    className="pj-input"
                    type="number"
                    min="1"
                    max="999"
                    value={form.openings}
                    onChange={field("openings")}
                    placeholder="1"
                    style={S.input}
                  />
                </Field>
                <Field icon={I.clock()} label="Application Deadline" hint="Leave blank to keep it open">
                  <input
                    className="pj-input"
                    type="date"
                    value={form.deadline}
                    onChange={field("deadline")}
                    min={new Date().toISOString().split("T")[0]}
                    style={S.input}
                  />
                </Field>
              </div>

              <div style={S.divider} />

              {/* Skills tag input */}
              <div style={{ marginBottom:18 }}>
                <label style={S.label}>
                  <span style={S.labelIcon}>{I.tag()}</span>
                  Required Skills
                </label>
                <p style={S.hint}>Press Enter or comma to add · Max 15 skills</p>

                {/* Preset chips */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {SKILL_PRESETS.map(s => (
                    <button
                      key={s}
                      className="pj-preset-tag"
                      disabled={skills.includes(s) || skills.length >= 15}
                      onClick={() => addSkill(s)}
                      style={{
                        padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                        border:"1px solid #E2E8F0",
                        background: skills.includes(s) ? "#EEF2FF" : "#F8FAFC",
                        color:      skills.includes(s) ? "#6366F1" : "#64748B",
                        cursor: skills.includes(s) || skills.length >= 15 ? "default" : "pointer",
                        transition:"all 0.15s",
                      }}
                    >
                      {skills.includes(s) ? "✓ " : "+ "}{s}
                    </button>
                  ))}
                </div>

                {/* Tag input box */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"10px 12px", borderRadius:10,
                  border:`1px solid ${skills.length >= 15 ? "#FCA5A5" : "#E2E8F0"}`,
                  background:"#fff", minHeight:48, alignItems:"center" }}>
                  {skills.map(s => (
                    <span key={s} style={{ display:"inline-flex", alignItems:"center", gap:5,
                      background:"#EEF2FF", color:"#6366F1", fontSize:12, fontWeight:600,
                      padding:"4px 10px", borderRadius:20 }}>
                      {s}
                      <button
                        className="pj-tag-remove"
                        onClick={() => removeSkill(s)}
                        style={{ background:"none", border:"none", color:"#94A3B8", cursor:"pointer",
                          padding:"0 2px", borderRadius:4, fontSize:13, lineHeight:1, transition:"all 0.15s" }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKey}
                    onBlur={() => skillInput.trim() && addSkill()}
                    placeholder={skills.length ? "" : "Type a skill and press Enter…"}
                    disabled={skills.length >= 15}
                    style={{ border:"none", outline:"none", fontSize:13, color:"#0F172A",
                      flex:1, minWidth:140, background:"transparent", fontFamily:"'Inter',sans-serif" }}
                  />
                </div>
                {skills.length >= 15 && (
                  <p style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>Maximum 15 skills reached</p>
                )}
              </div>

              <div style={S.divider} />

              {/* Description */}
              <div style={{ marginBottom:18 }}>
                <Field
                  icon={I.text()}
                  label="Job Description"
                  required
                  hint="Responsibilities, requirements, team info — aim for 150–500 words"
                >
                  <textarea
                    className="pj-input"
                    value={form.description}
                    onChange={field("description")}
                    rows={isMobile ? 6 : 9}
                    placeholder={"Responsibilities:\n• Lead frontend architecture decisions\n• Collaborate with designers and PMs\n\nRequirements:\n• 3+ years React experience\n• Strong TypeScript skills\n\nBenefits:\n• Flexible WFH policy\n• Health insurance"}
                    style={{ ...S.input, resize:"vertical", lineHeight:1.65, fontFamily:"'Inter',sans-serif", ...(errors.description ? S.inputErr : {}) }}
                  />
                </Field>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                  {errors.description ? <p style={S.errMsg}>{errors.description}</p> : <span />}
                  <p style={{ fontSize:11, color: form.description.length > 50 ? "#10B981" : "#94A3B8" }}>
                    {form.description.length} chars
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <Field icon={I.star()} label="Perks & Benefits" hint="What makes this role stand out? Health, WFH, equity, etc.">
                <textarea
                  className="pj-input"
                  value={form.benefits}
                  onChange={field("benefits")}
                  rows={3}
                  placeholder="e.g. Health insurance, 30 days leave, Work from home, Stock options…"
                  style={{ ...S.input, resize:"vertical", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}
                />
              </Field>

              <div style={S.divider} />

              {/* Submit row */}
              <div style={{ display:"flex", flexDirection: isMobile?"column":"row", gap:12,
                alignItems: isMobile?"stretch":"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, color:"#64748B", fontSize:13 }}>
                  {I.info()} Your job goes live after admin review (usually &lt;2 hrs)
                </div>
                <button
                  className="pj-submit-btn"
                  onClick={handleSubmit}
                  disabled={loading || submitted}
                  style={{
                    ...S.submitBtn,
                    opacity:   loading || submitted ? 0.7 : 1,
                    cursor:    loading || submitted ? "not-allowed" : "pointer",
                    animation: loading ? "pulse 1.2s ease infinite" : "none",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    minWidth: isMobile ? "100%" : 200,
                  }}
                >
                  {submitted ? <>{I.check()} Published!</> : loading ? "Publishing…" : <>{I.send()} Publish Job</>}
                </button>
              </div>

            </div>
          </div>

          {/* ── Tips cards (desktop only) ── */}
          {!isMobile && (
            <div
              className="pj-tips-grid"
              style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, animation:"fadeSlideUp 0.5s ease" }}
            >
              {[
                { icon:"🎯", title:"Write a clear title",         body:"Use the exact role name candidates search for. Avoid internal codes or abbreviations." },
                { icon:"💰", title:"Show the salary",             body:"Roles with a salary range listed receive up to 3x more qualified applications." },
                { icon:"📋", title:"Keep description scannable",  body:"Use bullet points for responsibilities and requirements. Candidates skim before they read." },
              ].map(tip => (
                <div key={tip.title} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"16px 18px", boxShadow:"0 2px 8px rgba(0,0,0,0.03)" }}>
                  <p style={{ fontSize:20, marginBottom:8 }}>{tip.icon}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", marginBottom:5 }}>{tip.title}</p>
                  <p style={{ fontSize:12, color:"#64748B", lineHeight:1.6 }}>{tip.body}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <nav style={S.bottomNav}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                className="pj-bottom-nav-item"
                onClick={() => router.push(item.path)}
                style={{ ...S.bottomNavItem, color: active ? "#6366F1" : "#94A3B8" }}
              >
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span style={{ fontSize:9, fontWeight: active?700:500, marginTop:2 }}>{item.label}</span>
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
  sidebar:      { width:240, minWidth:240, background:"#0F172A", color:"#CBD5E1", display:"flex", flexDirection:"column", padding:"24px 16px", position:"sticky", top:0, height:"100vh", zIndex:100, overflowY:"auto" },
  logoMark:     { width:34, height:34, borderRadius:8, background:"#6366F1", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16, flexShrink:0 },
  logoText:     { fontSize:16, fontWeight:600, color:"#F1F5F9" },
  navSection:   { fontSize:10, fontWeight:600, textTransform:"uppercase", color:"#475569", marginBottom:8 },
  navItem:      { display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", fontSize:13, color:"#94A3B8", marginBottom:3, position:"relative", transition:"background 0.15s,color 0.15s" },
  navItemActive:{ background:"#1E293B", color:"#F1F5F9" },
  navIcon:      { fontSize:14, width:18, textAlign:"center" },
  activeDot:    { width:6, height:6, borderRadius:"50%", background:"#6366F1", marginLeft:"auto" },

  topbar:   { background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"14px 28px", display:"flex", alignItems:"center", position:"sticky", top:0, zIndex:50 },
  pageTitle:{ fontWeight:700, color:"#0F172A" },
  pageSub:  { fontSize:12, color:"#94A3B8", marginTop:2 },
  backBtn:  { padding:"8px 14px", borderRadius:8, background:"#F1F5F9", border:"1px solid #E2E8F0", color:"#475569", fontSize:13, fontWeight:500, cursor:"pointer", transition:"background 0.15s", flexShrink:0 },

  card:    { background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.04)" },
  divider: { height:1, background:"#F1F5F9", margin:"20px 0" },

  label:    { display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#475569", marginBottom:5 },
  labelIcon:{ color:"#6366F1" },
  hint:     { fontSize:11, color:"#94A3B8", marginBottom:6, marginTop:-2, lineHeight:1.5 },
  input:    { width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, color:"#0F172A", background:"#fff", transition:"all 0.2s", fontFamily:"'Inter',sans-serif" },
  inputErr: { borderColor:"#FCA5A5", background:"#FFF5F5" },
  errMsg:   { fontSize:11, color:"#EF4444", marginTop:4 },

  submitBtn:{ padding:"13px 28px", borderRadius:10, background:"#6366F1", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 8px 20px rgba(99,102,241,0.3)", transition:"all 0.2s" },
  toast:    { display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderRadius:12, fontSize:13, fontWeight:500, background:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", borderLeft:"4px solid" },

  bottomNav:    { position:"fixed", bottom:0, left:0, right:0, height:64, background:"#fff", borderTop:"1px solid #E2E8F0", display:"flex", zIndex:100, boxShadow:"0 -4px 16px rgba(0,0,0,0.06)" },
  bottomNavItem:{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"none", background:"none", cursor:"pointer", padding:"6px 0", transition:"color 0.15s" },
};