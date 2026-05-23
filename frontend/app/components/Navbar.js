"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser({
        name: localStorage.getItem("name") || "",
        email: localStorage.getItem("email") || "",
        role: localStorage.getItem("role") || "",
      });

      const storedImage = localStorage.getItem("image");
      if (storedImage && storedImage !== "null") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setImage(storedImage);
      }
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setImage("");
    setOpen(false);
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center relative z-50">
      {/* LEFT */}
      <div className="flex gap-6">
        <Link href="/" className="text-blue-600 font-bold hover:text-blue-800">TalentUp</Link>
        <Link href="/jobs" className="hover:text-blue-500">Jobs</Link>
        {user?.role === "recruiter" && (
          <Link href="/recruiter-dashboard" className="hover:text-blue-500">Dashboard</Link>
        )}
      </div>

      {/* RIGHT */}
      {user ? (
        <div className="flex items-center gap-4 relative">
          
          <div className="text-xl cursor-pointer">🔔</div>

          {/* 🔥 AVATAR */}
          <div 
            onClick={() => setOpen(!open)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`http://localhost:5000${image}`}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                alt="Avatar"
                onError={(e) => { e.target.onerror = null; setImage(""); }}
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold uppercase">
                {user.name?.charAt(0)}
              </div>
            )}
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-12 bg-white shadow-lg border border-gray-100 rounded-md w-48 p-2">
              <div className="px-3 py-2">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <hr className="my-2" />
              <button onClick={() => { setOpen(false); router.push("/recruiter-profile"); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">
                Profile
              </button>
              {user.role === "recruiter" && (
                <button onClick={() => { setOpen(false); router.push("/recruiter-dashboard"); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">
                  Dashboard
                </button>
              )}
              <button onClick={logout} className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium pt-2">Login</Link>
          <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Sign Up</Link>
        </div>
      )}
    </nav>
  );
}