"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import api from "../../lib/api";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/recruiter-dashboard", icon: "⊞" },
  { label: "My Jobs",      path: "/recruiter-jobs",      icon: "◈" },
  { label: "Post a Job",   path: "/post-job",            icon: "+" },
  { label: "Browse Jobs",  path: "/jobs",                icon: "⊹" },
  { label: "Edit Profile", path: "/recruiter-profile",   icon: "◯" },
];

const FILTER_CHIPS = ["All", "Remote", "Full-Time", "Part-Time", "Contract"];

function SkeletonCard() {
  return (
    <div style={S.skeletonCard}>
      <div style={{ ...S.skeleton, width: 40, height: 40, borderRadius: 10, marginBottom: 16 }} />
      <div style={{ ...S.skeleton, width: "70%", height: 14, borderRadius: 4, marginBottom: 10 }} />
      <div style={{ ...S.skeleton, width: "90%", height: 10, borderRadius: 4, marginBottom: 6 }} />
      <div style={{ ...S.skeleton, width: "80%", height: 10, borderRadius: 4, marginBottom: 24 }} />
      <div style={{ ...S.skeleton, width: "50%", height: 10, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ ...S.skeleton, width: "40%", height: 10, borderRadius: 4, marginBottom: 24 }} />
      <div style={{ ...S.skeleton, width: "100%", height: 36, borderRadius: 8 }} />
    </div>
  );
}

function JobCard({ job, onClick }) {
  const [hovered, setHovered] = useState(false);
  const initials = job.company?.slice(0, 2).toUpperCase() || "JB";

  return (
    <div
      style={{ ...S.jobCard, ...(hovered ? S.jobCardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Header */}
      <div style={S.cardHeader}>
        <div style={S.companyAvatar}>{initials}</div>
        <span style={S.jobTypeBadge}>Full-Time</span>
      </div>

      {/* Job Info */}
      <h3 style={S.jobTitle}>{job.title}</h3>
      {job.company && <p style={S.companyName}>{job.company}</p>}
      <p style={S.jobDesc}>{job.description?.substring(0, 110)}…</p>

      {/* Meta Tags */}
      <div style={S.tagRow}>
        {job.location && (
          <span style={S.tag}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {job.location}
          </span>
        )}
        {job.salary && (
          <span style={S.tag}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {job.salary}
          </span>
        )}
      </div>

      {/* CTA */}
      <button style={S.viewBtn} onClick={onClick}>
        View Details
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 6 }}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(5); // replace with API response

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs?search=${search}&page=${page}`);
      setJobs(res.data.jobs || res.data);
    } catch (error) {
      console.error("FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = () => {
    setPage(1);
    router.push(`/jobs?search=${search}`);
    fetchJobs();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div style={S.layout}>
      {/* ── Sidebar ── */}
      <aside style={{ ...S.sidebar, ...(sidebarOpen ? {} : S.sidebarCollapsed) }}>
        <div style={S.sidebarInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>R</div>
            {sidebarOpen && <span style={S.logoText}>RΣCRUITER</span>}
          </div>

          {sidebarOpen && <p style={S.navSection}>Navigation</p>}

          <nav>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <div
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  title={!sidebarOpen ? item.label : ""}
                  style={{
                    ...S.navItem,
                    ...(isActive ? S.navItemActive : {}),
                    ...(sidebarOpen ? {} : S.navItemCollapsed),
                  }}
                >
                  <span style={S.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span style={S.navLabel}>{item.label}</span>}
                  {isActive && sidebarOpen && <div style={S.activePill} />}
                </div>
              );
            })}
          </nav>

          <div style={S.sidebarFooter}>
            <button onClick={() => setSidebarOpen((v) => !v)} style={S.collapseBtn} title="Toggle sidebar">
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>
        {/* Top Bar */}
        <header style={S.topbar}>
          <div style={S.topbarLeft}>
            <h1 style={S.pageTitle}>Browse Jobs</h1>
            <p style={S.pageSub}>Discover active roles across the platform</p>
          </div>

          <div style={S.searchWrap}>
            <div style={S.searchBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by title or keyword…"
                style={S.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {search && (
                <button style={S.clearBtn} onClick={() => { setSearch(""); setPage(1); }}>✕</button>
              )}
            </div>
            <button onClick={handleSearch} style={S.searchBtn}>Search</button>
          </div>
        </header>

        {/* Filter Chips */}
        <div style={S.filterBar}>
          {FILTER_CHIPS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ ...S.chip, ...(activeFilter === f ? S.chipActive : {}) }}
            >
              {f}
            </button>
          ))}
          <span style={S.resultCount}>
            {!loading && `${jobs.length} result${jobs.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Content */}
        <div style={S.content}>
          {loading ? (
            <div style={S.grid}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div style={S.grid}>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div style={S.pagination}>
                <button
                  style={{ ...S.pageBtn, ...(page === 1 ? S.pageBtnDisabled : {}) }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    style={{ ...S.pageBtn, ...(page === n ? S.pageBtnActive : {}) }}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                <button
                  style={{ ...S.pageBtn, ...(page === totalPages ? S.pageBtnDisabled : {}) }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>⊹</div>
              <h3 style={S.emptyTitle}>No jobs found</h3>
              <p style={S.emptySub}>Try adjusting your search or clearing filters.</p>
              <button style={S.emptyAction} onClick={() => { setSearch(""); setActiveFilter("All"); }}>
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────── Styles ─────────────────── */
const S = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#F1F5F9",
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  /* Sidebar */
  sidebar: {
    width: 240,
    background: "#0F172A",
    color: "#CBD5E1",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
    transition: "width 0.25s ease",
    overflow: "hidden",
  },
  sidebarCollapsed: { width: 68 },
  sidebarInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "20px 12px",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28, paddingLeft: 4 },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(135deg, #6366F1, #818CF8)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 15, flexShrink: 0,
  },
  logoText: { fontSize: 15, fontWeight: 700, color: "#F1F5F9", letterSpacing: "0.04em" },
  navSection: {
    fontSize: 9, fontWeight: 700, textTransform: "uppercase",
    color: "#334155", marginBottom: 6, letterSpacing: "0.1em", paddingLeft: 4,
  },
  navItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 12px", borderRadius: 8,
    cursor: "pointer", fontSize: 13, color: "#64748B",
    marginBottom: 2, position: "relative", transition: "background 0.15s, color 0.15s",
  },
  navItemCollapsed: { justifyContent: "center", padding: "10px" },
  navItemActive: { background: "#1E293B", color: "#E2E8F0" },
  navIcon: { fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 },
  navLabel: { flex: 1, whiteSpace: "nowrap" },
  activePill: {
    width: 5, height: 5, borderRadius: "50%",
    background: "#6366F1", marginLeft: "auto",
  },
  sidebarFooter: { marginTop: "auto", display: "flex", justifyContent: "center" },
  collapseBtn: {
    background: "#1E293B", border: "none", color: "#64748B",
    width: 32, height: 32, borderRadius: 8,
    cursor: "pointer", fontSize: 14, display: "flex",
    alignItems: "center", justifyContent: "center",
  },

  /* Main */
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },

  topbar: {
    background: "#fff",
    borderBottom: "1px solid #E2E8F0",
    padding: "18px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  topbarLeft: {},
  pageTitle: { fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0, lineHeight: 1.2 },
  pageSub: { fontSize: 12, color: "#94A3B8", margin: "3px 0 0" },

  searchWrap: { display: "flex", gap: 8, flexShrink: 0 },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 14px", borderRadius: 10,
    border: "1.5px solid #E2E8F0", background: "#F8FAFC",
    width: 280, transition: "border-color 0.15s",
  },
  searchInput: {
    flex: 1, background: "transparent", border: "none",
    outline: "none", fontSize: 13, color: "#0F172A",
    minWidth: 0,
  },
  clearBtn: {
    background: "none", border: "none", color: "#94A3B8",
    cursor: "pointer", padding: 0, fontSize: 11, lineHeight: 1,
  },
  searchBtn: {
    padding: "9px 18px", borderRadius: 10,
    background: "#6366F1", color: "#fff",
    border: "none", fontWeight: 600, fontSize: 13,
    cursor: "pointer", whiteSpace: "nowrap",
    transition: "background 0.15s",
  },

  /* Filter bar */
  filterBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "14px 28px", background: "#fff",
    borderBottom: "1px solid #F1F5F9",
  },
  chip: {
    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
    border: "1.5px solid #E2E8F0", background: "transparent",
    color: "#64748B", cursor: "pointer", transition: "all 0.15s",
  },
  chipActive: {
    background: "#EEF2FF", borderColor: "#A5B4FC", color: "#4F46E5", fontWeight: 600,
  },
  resultCount: {
    marginLeft: "auto", fontSize: 12, color: "#94A3B8", fontWeight: 500,
  },

  /* Grid + cards */
  content: { padding: "28px 28px 48px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: 18,
  },

  jobCard: {
    background: "#fff",
    border: "1.5px solid #E2E8F0",
    borderRadius: 14,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },
  jobCardHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 12px 32px rgba(99,102,241,0.10)",
    borderColor: "#C7D2FE",
  },

  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  companyAvatar: {
    width: 40, height: 40, borderRadius: 10,
    background: "linear-gradient(135deg, #EEF2FF, #C7D2FE)",
    color: "#4F46E5", fontWeight: 800, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center",
    letterSpacing: "0.05em",
  },
  jobTypeBadge: {
    fontSize: 10, fontWeight: 700, color: "#059669",
    background: "#ECFDF5", padding: "4px 9px",
    borderRadius: 20, letterSpacing: "0.04em",
  },

  jobTitle: { fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 3px", lineHeight: 1.3 },
  companyName: { fontSize: 12, color: "#6366F1", fontWeight: 600, margin: "0 0 10px" },
  jobDesc: { fontSize: 12.5, color: "#64748B", lineHeight: 1.65, margin: "0 0 16px", flex: 1 },

  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 },
  tag: {
    display: "inline-flex", alignItems: "center",
    fontSize: 11, color: "#64748B",
    background: "#F1F5F9", padding: "4px 10px",
    borderRadius: 20, fontWeight: 500,
  },

  viewBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "10px",
    borderRadius: 9, border: "1.5px solid #E2E8F0",
    background: "#F8FAFC", color: "#475569",
    fontWeight: 600, fontSize: 12.5,
    cursor: "pointer", transition: "all 0.15s",
    marginTop: "auto",
  },

  /* Skeleton */
  skeletonCard: {
    background: "#fff", border: "1.5px solid #F1F5F9",
    borderRadius: 14, padding: 20,
  },
  skeleton: {
    background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    display: "block",
  },

  /* Pagination */
  pagination: {
    display: "flex", alignItems: "center", gap: 6,
    marginTop: 40, justifyContent: "center",
  },
  pageBtn: {
    padding: "7px 13px", borderRadius: 8,
    border: "1.5px solid #E2E8F0",
    background: "#fff", color: "#475569",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    transition: "all 0.15s",
  },
  pageBtnActive: {
    background: "#6366F1", borderColor: "#6366F1",
    color: "#fff", fontWeight: 700,
  },
  pageBtnDisabled: {
    opacity: 0.4, cursor: "not-allowed",
  },

  /* Empty state */
  emptyState: {
    textAlign: "center", padding: "80px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  emptyIcon: {
    fontSize: 36, color: "#C7D2FE",
    background: "#EEF2FF", width: 72, height: 72,
    borderRadius: 20, display: "flex", alignItems: "center",
    justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 },
  emptySub: { fontSize: 13, color: "#94A3B8", margin: 0 },
  emptyAction: {
    marginTop: 12, padding: "9px 20px", borderRadius: 9,
    background: "#6366F1", color: "#fff",
    border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
};

/* Global keyframes injected once */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  if (!document.head.querySelector("[data-jobs-styles]")) {
    style.setAttribute("data-jobs-styles", "1");
    document.head.appendChild(style);
  }
}

export default function Jobs() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F1F5F9", color: "#94A3B8", fontSize: 14 }}>
        Loading…
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}