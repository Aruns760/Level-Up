"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../lib/api";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

export default function PostJob() {
  const router = useRouter();
  const pathname = usePathname();

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "recruiter") {
        alert("Please login as recruiter");
        router.push("/login");
        return;
      }

      if (!form.title || !form.description || !form.location || !form.salary) {
        alert("All fields are required");
        return;
      }

      await api.post("/jobs/create", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("🚀 Job Created Successfully!");
      router.push("/recruiter-jobs");
    } catch (error) {
      alert(error.response?.data?.message || "Server error while creating job");
    } finally {
      setLoading(false);
    }
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

      {/* ── Main Content ── */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h1 style={S.pageTitle}>Create Job Listing</h1>
            <p style={S.pageSub}>Fill in the details to find your next great hire.</p>
          </div>
          <button onClick={() => router.back()} style={S.backBtn}>
            ← Back
          </button>
        </header>

        <div style={S.content}>
          <div style={S.formCard}>
            <div style={S.formGrid}>
              <div style={S.inputGroup}>
                <label style={S.label}>Job Title</label>
                <input
                  style={S.input}
                  placeholder="e.g. Senior Frontend Developer"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={S.inputGroup}>
                <label style={S.label}>Location</label>
                <input
                  style={S.input}
                  placeholder="e.g. Remote or New York, NY"
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div style={S.inputGroup}>
                <label style={S.label}>Salary Range</label>
                <input
                  style={S.input}
                  placeholder="e.g. ₹12L - ₹18L per annum"
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
              </div>

              <div style={{ ...S.inputGroup, gridColumn: "1 / -1" }}>
                <label style={S.label}>Job Description</label>
                <textarea
                  style={{ ...S.input, height: 140, resize: "none" }}
                  placeholder="Detailed requirements, benefits, and responsibilities..."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <button 
              onClick={handleSubmit} 
              style={loading ? {...S.submitBtn, opacity: 0.7} : S.submitBtn}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Job Opening"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  layout: { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, sans-serif" },
  
  /* Sidebar Styles */
  sidebar: {
    width: 240, background: "#0F172A", color: "#CBD5E1",
    display: "flex", flexDirection: "column", padding: "24px 16px",
    position: "sticky", top: 0, height: "100vh",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoMark: {
    width: 34, height: 34, borderRadius: 8, background: "#6366F1",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 16,
  },
  logoText: { fontSize: 16, fontWeight: 600, color: "#F1F5F9" },
  navSection: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#475569", marginBottom: 8 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", 
    borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#94A3B8", marginBottom: 3, position: "relative"
  },
  navItemActive: { background: "#1E293B", color: "#F1F5F9" },
  navIcon: { fontSize: 14, width: 18, textAlign: "center" },
  activeDot: { width: 6, height: 6, borderRadius: "50%", background: "#6366F1", marginLeft: "auto" },

  /* Main Content */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: {
    background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 },
  pageSub: { fontSize: 12, color: "#94A3B8", margin: "2px 0 0" },
  backBtn: {
    padding: "8px 16px", borderRadius: 8, background: "#F1F5F9", 
    border: "none", color: "#475569", fontSize: 13, fontWeight: 500, cursor: "pointer"
  },

  content: { padding: 40, display: "flex", justifyContent: "center" },
  formCard: {
    width: "100%", maxWidth: 800, background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 16, padding: 32, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#334155" },
  input: {
    padding: "12px 16px", borderRadius: 8, border: "1px solid #E2E8F0",
    fontSize: 14, outline: "none", transition: "border 0.2s",
    fontFamily: "inherit"
  },
  submitBtn: {
    marginTop: 32, width: "100%", padding: "14px", borderRadius: 8,
    background: "#6366F1", color: "#fff", border: "none", fontSize: 15,
    fontWeight: 600, cursor: "pointer", transition: "transform 0.1s",
    boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.3)"
  }
};