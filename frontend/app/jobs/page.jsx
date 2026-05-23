"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

export default function Jobs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs?search=${search}`);
        setJobs(res.data.jobs || res.data);
      } catch (error) {
        console.error("FETCH ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [search]);

  const handleSearch = () => {
    router.push(`/jobs?search=${search}`);
  };

  return (
    <div style={S.layout}>
      {/* ── Sidebar (Matched) ── */}
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
            <h1 style={S.pageTitle}>Browse Available Jobs</h1>
            <p style={S.pageSub}>Explore all active listings across the platform.</p>
          </div>
          <div style={S.searchContainer}>
            <input
              type="text"
              placeholder="Search by title or keyword..."
              style={S.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch} style={S.searchBtn}>
              Search
            </button>
          </div>
        </header>

        <div style={S.content}>
          {loading ? (
            <div style={S.loadingState}>
              <div style={S.spinner} />
              <p>Finding the best roles for you...</p>
            </div>
          ) : (
            <>
              <div style={S.grid}>
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} style={S.jobCard}>
                      <div style={S.cardTop}>
                        <div style={S.jobIcon}>⊹</div>
                        <span style={S.jobType}>Full-Time</span>
                      </div>
                      <h3 style={S.jobTitle}>{job.title}</h3>
                      <p style={S.jobDesc}>{job.description?.substring(0, 120)}...</p>
                      
                      <div style={S.metaRow}>
                        <span style={S.metaLabel}>📍 {job.location}</span>
                        <span style={S.metaLabel}>💰 {job.salary || "N/A"}</span>
                      </div>

                      <button 
                        style={S.viewBtn}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        Details
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={S.emptyState}>No jobs found matching your search.</div>
                )}
              </div>

              {/* Pagination UI */}
              <div style={S.pagination}>
                <button onClick={() => router.push(`/jobs?page=1`)} style={S.pageBtn}>1</button>
                <button onClick={() => router.push(`/jobs?page=2`)} style={S.pageBtn}>2</button>
                <button style={{...S.pageBtn, background: 'transparent', cursor: 'default'}}>...</button>
              </div>
            </>
          )}
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

  /* Main Content Styles */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: {
    background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 28px",
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
  },
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 },
  pageSub: { fontSize: 12, color: "#94A3B8", margin: "2px 0 0" },
  
  searchContainer: { display: "flex", gap: 8, flex: 1, maxWidth: 400 },
  searchInput: {
    flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid #E2E8F0",
    fontSize: 13, outline: "none", background: "#F9FAFB"
  },
  searchBtn: {
    padding: "8px 16px", borderRadius: 8, background: "#6366F1", 
    color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer"
  },

  content: { padding: 32 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  jobCard: {
    background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20,
    transition: "transform 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column"
  },
  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: 16 },
  jobIcon: { width: 34, height: 34, background: "#EEF2FF", color: "#6366F1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  jobType: { fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "4px 8px", borderRadius: 4 },
  jobTitle: { fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 },
  jobDesc: { fontSize: 13, color: "#64748B", lineHeight: 1.5, marginBottom: 20, flex: 1 },
  metaRow: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 },
  metaLabel: { fontSize: 12, color: "#94A3B8" },
  viewBtn: { width: "100%", padding: "10px", borderRadius: 8, background: "#F1F5F9", border: "none", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" },

  pagination: { display: "flex", gap: 8, marginTop: 40, justifyContent: "center" },
  pageBtn: { padding: "8px 14px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  
  loadingState: { textAlign: "center", padding: "100px 0", color: "#94A3B8" },
  spinner: { width: 30, height: 30, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" },
  emptyState: { gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "#94A3B8" }
};