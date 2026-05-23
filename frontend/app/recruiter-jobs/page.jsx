"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../lib/api";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchJobs = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await api.get("/jobs/my-jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const deleteJob = async (id) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/jobs/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJobs();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
    </div>
  );

  return (
    <div style={S.layout}>
      {/* ── Sidebar (Perfectly Matched) ── */}
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
            <h1 style={S.pageTitle}>My Job Listings</h1>
            <p style={S.pageSub}>Manage and track your active job postings</p>
          </div>
          <button 
            onClick={() => router.push("/post-job")}
            style={S.postBtn}
          >
            + Post New Job
          </button>
        </header>

        <div style={S.content}>
          <div style={S.grid}>
            {jobs.length === 0 ? (
              <div style={S.emptyState}>
                <p>No jobs posted yet. Start by creating your first listing!</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} style={S.jobCard}>
                  <div style={S.cardHeader}>
                    <div style={S.jobIcon}>◈</div>
                    <div style={S.statusBadge(job.status)}>
                      {job.status || "Pending"}
                    </div>
                  </div>

                  <h3 style={S.jobTitle}>{job.title}</h3>
                  <p style={S.jobDesc}>{job.description?.substring(0, 100)}...</p>

                  <div style={S.metaRow}>
                    <span style={S.metaItem}>📍 {job.location}</span>
                    <span style={S.metaItem}>💰 {job.salary}</span>
                  </div>

                  <div style={S.cardActions}>
                    <button
                      onClick={() => router.push(`/applicants/${job.id}`)}
                      style={S.viewBtn}
                    >
                      View Applicants
                    </button>
                    <button
                      onClick={() => deleteJob(job.id)}
                      style={S.deleteBtn}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  layout: { display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, sans-serif" },
  
  /* Sidebar Styles - Matched to PostJob & Dashboard */
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

  /* Main Content Layout */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: {
    background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 },
  pageSub: { fontSize: 12, color: "#94A3B8", margin: "2px 0 0" },
  postBtn: { 
    background: "#6366F1", color: "#fff", padding: "10px 20px", borderRadius: 8, 
    border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13,
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
  },

  content: { padding: 32 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 },
  
  jobCard: { 
    background: "#fff", borderRadius: 16, padding: 24, 
    border: "1px solid #E2E8F0", display: "flex", flexDirection: "column",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  jobIcon: { 
    width: 38, height: 38, background: "#EEF2FF", color: "#6366F1", 
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 
  },
  
  statusBadge: (status) => ({
    padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: status === "approved" ? "#DCFCE7" : status === "rejected" ? "#FEE2E2" : "#FEF3C7",
    color: status === "approved" ? "#15803D" : status === "rejected" ? "#B91C1C" : "#B45309",
  }),

  jobTitle: { fontSize: 17, fontWeight: 700, color: "#0F172A", marginBottom: 8 },
  jobDesc: { fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 20, flex: 1 },
  metaRow: { display: "flex", gap: 16, marginBottom: 24 },
  metaItem: { fontSize: 12, color: "#94A3B8", fontWeight: 500 },

  cardActions: { display: "flex", gap: 10, borderTop: "1px solid #F1F5F9", paddingTop: 18 },
  viewBtn: { 
    flex: 1, background: "#F1F5F9", color: "#0F172A", padding: "9px", 
    borderRadius: 8, border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 
  },
  deleteBtn: { 
    width: 38, background: "#FFF1F2", color: "#EF4444", borderRadius: 8, 
    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" 
  },

  loadingWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
  spinner: { width: 30, height: 30, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 1s linear infinite" },
  emptyState: { textAlign: "center", gridColumn: "1 / -1", padding: "60px 0", color: "#94A3B8", fontSize: 14 }
};