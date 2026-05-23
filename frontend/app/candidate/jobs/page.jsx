"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/api";

export default function CandidateJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Wrap fetchJobs in useCallback to fix the ESLint warning
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs"); 
      setJobs(res.data);
      setError(null);
    } catch (err) {
      console.error("Fetch Jobs Error:", err);
      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Add fetchJobs to the dependency array safely
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) return <div style={styles.center}>Loading available jobs...</div>;
  if (error) return <div style={{ ...styles.center, color: "red" }}>{error}</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>Available Jobs</h2>
        <p>{jobs.length} opportunities found</p>
      </header>

      {jobs.length === 0 ? (
        <div style={styles.center}>No jobs available at the moment.</div>
      ) : (
        <div style={styles.grid}>
          {jobs.map((job) => (
            <div key={job.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.title}>{job.title}</h3>
                <span style={styles.companyBadge}>
                  {job.recruiter?.companyName || "Verified Company"}
                </span>
              </div>
              
              <p style={styles.description}>{job.description}</p>
              
              <div style={styles.detailsRow}>
                <span>📍 {job.location}</span>
                <span>💰 ₹{job.salary}</span>
              </div>

              <button 
                style={styles.applyBtn}
                onClick={() => alert(`Redirecting to apply for ${job.title}...`)}
              >
                View Details & Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1000px",
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif"
  },
  header: {
    marginBottom: "25px",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "10px"
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  card: {
    border: "1px solid #e1e4e8",
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  title: {
    margin: 0,
    color: "#1a1a1a",
    fontSize: "1.2rem"
  },
  companyBadge: {
    backgroundColor: "#f0f7ff",
    color: "#0070f3",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600"
  },
  description: {
    color: "#444",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    marginBottom: "15px"
  },
  detailsRow: {
    display: "flex",
    gap: "20px",
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "15px"
  },
  applyBtn: {
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    width: "100%"
  },
  center: {
    textAlign: "center",
    padding: "50px",
    color: "#666"
  }
};