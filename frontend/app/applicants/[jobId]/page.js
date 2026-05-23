"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useParams } from "next/navigation";

export default function Applicants() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    const fetchApplicants = async () => {
      const res = await api.get(`/jobs/applicants/${jobId}`);
      setApplicants(res.data);
    };

    fetchApplicants();
  }, [jobId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        }
        }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">Applicants (Ranked)</h1>

      {applicants.map((app) => (
        <div key={app.id} className="border p-4 mb-2">
          <p>Name: {app.user.name}</p>
          <p>Average Score: {app.averageScore?.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}

