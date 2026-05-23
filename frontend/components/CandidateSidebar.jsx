"use client";

import { useRouter } from "next/navigation";

export default function CandidateSidebar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="w-64 bg-black text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Candidate</h2>

      <ul className="space-y-4">
        <li onClick={() => router.push("/candidate/dashboard")} className="cursor-pointer">Dashboard</li>
        <li onClick={() => router.push("/candidate/profile")} className="cursor-pointer">Profile</li>
        <li onClick={() => router.push("/candidate/applied-jobs")} className="cursor-pointer">Applied Jobs</li>
        <li onClick={() => router.push("/candidate/tests")} className="cursor-pointer">Tests</li>
        <li onClick={() => router.push("/candidate/resume")} className="cursor-pointer">Resume</li>
        <li onClick={logout} className="text-red-400 cursor-pointer">Logout</li>
      </ul>
    </div>
  );
}