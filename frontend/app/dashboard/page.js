"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function Dashboard() {

  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "candidate") {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get("/jobs/candidate/dashboard");
        setData(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();

  }, [router]);

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Candidate Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-lg font-semibold">
            Total Applications
          </h2>
          <p className="text-3xl">{data.totalApplications}</p>
        </div>

        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-lg font-semibold">
            Profile Completed
          </h2>
          <p className="text-3xl">
            {data.profileCompleted ? "Yes" : "No"}
          </p>
        </div>

      </div>

    </div>
  );
}