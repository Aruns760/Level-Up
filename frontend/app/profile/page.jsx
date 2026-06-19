"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function ProfilePage() {

  const [form, setForm] = useState({
    skills: "",
    education: "",
    experience: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");

    const fetchProfile = async () => {
      try {

        const res = await api.get("/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data) {
          setForm(res.data);
        }

      } catch (error) {
        console.log("No profile yet");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

  }, []);

  const handleSubmit = async () => {
    try {

      const token = localStorage.getItem("token");

      await api.post("/profile", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Profile Saved Successfully");

    } catch (error) {
      console.error(error);
      alert("Error saving profile");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-10">

      <h1 className="text-2xl mb-4">My Profile</h1>

      <input
        placeholder="Skills"
        className="border p-2 mb-2 w-full"
        value={form.skills}
        onChange={(e)=>setForm({...form,skills:e.target.value})}
      />

      <input
        placeholder="Education"
        className="border p-2 mb-2 w-full"
        value={form.education}
        onChange={(e)=>setForm({...form,education:e.target.value})}
      />

      <input
        placeholder="Experience"
        className="border p-2 mb-2 w-full"
        value={form.experience}
        onChange={(e)=>setForm({...form,experience:e.target.value})}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Save Profile
      </button>

    </div>
  );
}