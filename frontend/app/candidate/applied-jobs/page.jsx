"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AppliedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔥 FETCH APPLIED JOBS
  const fetchAppliedJobs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/jobs/my-applications",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setJobs(res.data);
    } catch (err) {
      console.log("Applied jobs error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAppliedJobs();
  }, [token]);

  // 🔥 WITHDRAW APPLICATION
  const withdrawJob = async (jobId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/jobs/withdraw/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Application withdrawn ❌");

      // refresh list
      fetchAppliedJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Error ❌");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Applied Jobs</h1>

      {jobs.length === 0 ? (
        <p>No jobs applied yet</p>
      ) : (
        jobs.map((app) => (
          <div
            key={app.id}
            className="bg-white p-4 mb-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">
                {app.job.title}
              </h3>
              <p className="text-gray-500">
                {app.job.location}
              </p>
            </div>

            <div className="flex gap-2">
              {/* EDIT (future feature) */}
              <button className="bg-yellow-400 px-3 py-1 rounded">
                Edit
              </button>

              {/* WITHDRAW */}
              <button
                onClick={() => withdrawJob(app.jobId)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Withdraw
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}