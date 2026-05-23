"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

/* ─── Hexagon SVG bg ─────────────────────────────────────────── */
function HexGrid({ color }) {
  return (
    <svg className="hex-grid" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
          <polygon points="28,2 54,16 54,44 28,58 2,44 2,16" fill="none" stroke={color} strokeWidth="0.5" />
          <polygon points="28,52 54,66 54,94 28,108 2,94 2,66" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

/* ─── Particle canvas ────────────────────────────────────────── */
function Particles({ color }) {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight;
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * cvs.width, y: Math.random() * cvs.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.6 + 0.2,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${p.o})`; 
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cvs.width) p.vx *= -1;
        if (p.y < 0 || p.y > cvs.height) p.vy *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [color]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EDIT PROFILE (HOLOGRAM EDITION)
═══════════════════════════════════════════════════════════════ */
export default function EditProfile() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    skills: [],
    education: "",
    experience: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [image, setImage] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState("cyan");
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Themes ── */
  const THEMES = {
    cyan:   { name: "NEXUS",    primary: "#00e5ff", secondary: "#0072ff", bg: "#010812", card: "rgba(0,229,255,0.03)",   glow: "rgba(0,229,255,0.4)" },
    violet: { name: "PHANTOM",  primary: "#b347ff", secondary: "#6600ff", bg: "#090310", card: "rgba(179,71,255,0.03)",  glow: "rgba(179,71,255,0.4)" },
    amber:  { name: "INFERNO",  primary: "#ffaa00", secondary: "#ff4400", bg: "#0d0600", card: "rgba(255,170,0,0.03)",   glow: "rgba(255,170,0,0.4)" },
    emerald:{ name: "MATRIX",   primary: "#00ff87", secondary: "#00c2a8", bg: "#010d06", card: "rgba(0,255,135,0.03)",   glow: "rgba(0,255,135,0.4)" },
  };
  const T = THEMES[activeTheme];

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  /* ── Fetch Existing Data ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/candidate/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data;
        setForm({
          name: user.name || "",
          skills: user.profile?.skills || [],
          education: user.profile?.education || "",
          experience: user.profile?.experience || "",
        });
      } catch (err) {
        notify("Failed to retrieve databanks.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ── Handlers ── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (form.skills.includes(skillInput.trim())) {
      notify("Skill already logged.", "error");
      return;
    }
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput("");
  };

  const removeSkill = (index) => {
    const newSkills = form.skills.filter((_, i) => i !== index);
    setForm({ ...form, skills: newSkills });
  };

  const handleImageUpload = async (token) => {
    if (!image) return;
    const formData = new FormData();
    formData.append("image", image);
    await axios.post("http://localhost:5000/api/user/upload", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      if (image) await handleImageUpload(token);

      await axios.put("http://localhost:5000/api/candidate/profile", {
        name: form.name,
        skills: form.skills,
        education: form.education,
        experience: form.experience,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      notify("Identity parameters synced globally.");
      
      setTimeout(() => {
        // 🔥 CRITICAL: Force Next.js to dump the old cache so the new name shows immediately
        router.refresh(); 
        router.push("/candidate/profile");
      }, 1500);
    } catch (err) {
      console.log(err);
      notify("Sync sequence failed.", "error");
      setIsSubmitting(false);
    }
  };

  /* ── Loading State ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#010812", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 64, height: 64, border: "2px dashed rgba(0,229,255,0.3)", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ fontFamily: "'Share Tech Mono', monospace", color: "#00e5ff", letterSpacing: "0.4em", fontSize: 12, textShadow: "0 0 10px #00e5ff" }}>ESTABLISHING UPLINK...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .holo-root {
          min-height: 100vh;
          background: radial-gradient(circle at center, ${T.bg} 0%, #000 100%);
          font-family: 'Exo 2', sans-serif;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          transition: background 0.8s ease;
          position: relative;
        }

        .hex-grid {
          position: fixed; inset: 0;
          width: 100%; height: 100%;
          pointer-events: none; z-index: 0;
          opacity: 0.25;
        }

        /* ── Topbar ── */
        .topbar {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }
        .topbar-brand {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px; font-weight: 900; letter-spacing: 0.3em;
          color: #fff; text-shadow: 0 0 10px ${T.glow}, 2px 0 0 rgba(255,0,0,0.5), -2px 0 0 rgba(0,0,255,0.5);
          cursor: pointer; transition: all 0.3s;
        }
        .topbar-brand:hover { text-shadow: 0 0 20px ${T.primary}; letter-spacing: 0.35em; }
        
        .theme-switcher { display: flex; gap: 10px; align-items: center; }
        .theme-dot {
          width: 14px; height: 14px; border-radius: 50%; cursor: pointer;
          border: 2px solid rgba(255,255,255,0.1); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .theme-dot:hover { transform: scale(1.5); border-color: #fff; }
        .theme-dot.active { border-color: #fff; box-shadow: 0 0 15px currentColor, inset 0 0 5px #fff; transform: scale(1.2); }

        /* ── Content Wrapper ── */
        .content {
          position: relative; z-index: 5;
          flex: 1; display: flex; flex-direction: column;
          align-items: center; padding: 60px 20px;
          perspective: 1500px; 
        }

        /* ── 3D Holographic Form Card ── */
        .form-container {
          width: 100%; max-width: 700px;
          transform-style: preserve-3d;
          animation: floatHolo 8s ease-in-out infinite;
        }

        @keyframes floatHolo {
          0%, 100% { transform: translateY(0) rotateX(1deg) rotateY(-1deg); }
          50% { transform: translateY(-15px) rotateX(-2deg) rotateY(2deg); }
        }

        .card-holo {
          background: linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 48px;
          backdrop-filter: blur(20px); position: relative;
          transform-style: preserve-3d;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px ${T.card};
          transition: border-color 0.4s ease;
          overflow: hidden;
        }
        .card-holo:hover { border-color: rgba(255,255,255,0.2); }
        
        /* Sweeping Hologram Scanline */
        .card-holo::after {
          content: ''; position: absolute; top: -100%; left: 0; right: 0; height: 200%;
          background: linear-gradient(to bottom, transparent 0%, ${T.primary} 50%, transparent 100%);
          opacity: 0.05; pointer-events: none;
          animation: scan 6s linear infinite;
        }
        @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(100%); } }

        .section-header {
          font-family: 'Orbitron', sans-serif; font-size: 26px; font-weight: 900;
          color: #fff; text-transform: uppercase; letter-spacing: 0.15em;
          text-align: center; margin-bottom: 40px;
          transform: translateZ(40px); /* Extreme 3D Pop */
          text-shadow: 0 0 20px ${T.glow};
        }

        /* ── Holographic Inputs ── */
        .form-group {
          margin-bottom: 28px; transform: translateZ(20px); transform-style: preserve-3d;
        }
        .form-label {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Share Tech Mono', monospace; font-size: 12px;
          color: ${T.primary}; text-transform: uppercase; letter-spacing: 0.2em;
          margin-bottom: 10px; text-shadow: 0 0 8px ${T.glow};
        }
        .form-label::before { content: '▰'; font-size: 10px; }

        .form-input {
          width: 100%; 
          background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4));
          border: none; border-bottom: 2px solid rgba(255,255,255,0.1);
          color: #fff; font-family: 'Exo 2', sans-serif; font-size: 15px;
          padding: 14px 18px; border-radius: 8px 8px 0 0; outline: none;
          transition: all 0.3s;
        }
        .form-input:focus {
          border-bottom: 2px solid ${T.primary};
          background: linear-gradient(to top, rgba(0,229,255,0.05), rgba(0,0,0,0.6));
          box-shadow: 0 10px 20px -10px ${T.glow};
          transform: translateZ(5px);
        }
        .form-textarea { min-height: 120px; resize: vertical; }

        /* ── Image Upload ── */
        .file-upload-box {
          border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px;
          padding: 24px; text-align: center; background: rgba(0,0,0,0.4);
          transition: all 0.3s; cursor: pointer; position: relative;
        }
        .file-upload-box:hover { border-color: ${T.primary}; background: rgba(0,229,255,0.05); box-shadow: inset 0 0 20px rgba(0,229,255,0.1); }
        .file-upload-text { font-family: 'Share Tech Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.6); letter-spacing: 0.1em; }
        .file-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

        /* ── Skills Inputs ── */
        .skill-input-row { display: flex; gap: 12px; }
        .btn-add {
          font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 800;
          letter-spacing: 0.15em; text-transform: uppercase; color: #000;
          background: ${T.primary}; border: none; padding: 0 24px; border-radius: 8px;
          cursor: pointer; transition: all 0.3s; box-shadow: 0 0 15px ${T.glow};
        }
        .btn-add:hover { transform: scale(1.05) translateZ(10px); box-shadow: 0 0 25px ${T.glow}, 0 0 10px #fff; }

        .skills-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .skill-tag {
          font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 0.05em;
          padding: 6px 12px 6px 16px; border-radius: 4px;
          background: rgba(0,0,0,0.6); border-left: 3px solid ${T.primary}; color: #fff;
          display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          transition: all 0.2s;
        }
        .skill-tag:hover { transform: translateY(-2px); border-color: #fff; }
        .skill-remove {
          background: none; border: none; color: rgba(255,255,255,0.3); font-size: 16px;
          cursor: pointer; transition: color 0.2s, transform 0.2s;
        }
        .skill-remove:hover { color: #f87171; transform: scale(1.2) rotate(90deg); text-shadow: 0 0 10px #f87171; }

        /* ── Submit Button ── */
        .submit-wrapper { transform: translateZ(35px); margin-top: 48px; }
        .btn-submit {
          width: 100%; font-family: 'Orbitron', sans-serif; font-size: 15px; font-weight: 800;
          letter-spacing: 0.25em; text-transform: uppercase;
          padding: 20px 24px; border: 1px solid ${T.primary}; background: rgba(0,229,255,0.1); color: ${T.primary};
          cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;
          clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
          backdrop-filter: blur(10px);
        }
        .btn-submit:hover:not(:disabled) {
          background: ${T.primary}; color: #000; box-shadow: 0 0 50px ${T.glow}; transform: scale(1.02); letter-spacing: 0.3em;
        }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; clip-path: none; border-radius: 8px; border-color: rgba(255,255,255,0.2); color: #fff; }

        /* ── Toast Notification ── */
        .toast {
          position: fixed; bottom: 40px; right: 40px; z-index: 999;
          padding: 16px 28px; border-radius: 4px; min-width: 300px;
          font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
          display: flex; align-items: center; gap: 14px;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
          border-left: 4px solid;
          animation: toastGlitch 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .toast-success { border-color: ${T.primary}; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,229,255,0.1); }
        .toast-error { border-color: #f87171; color: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(248,113,113,0.2); }
        
        @keyframes toastGlitch { 
          0% { transform: translateX(100%) skewX(-20deg); opacity: 0; } 
          70% { transform: translateX(-10px) skewX(10deg); opacity: 1; }
          100% { transform: translateX(0) skewX(0); }
        }

        /* ── Corner Crosshairs ── */
        .crosshair-tl { position: absolute; top: 20px; left: 20px; width: 15px; height: 15px; border-top: 2px solid ${T.primary}; border-left: 2px solid ${T.primary}; opacity: 0.6; }
        .crosshair-br { position: absolute; bottom: 20px; right: 20px; width: 15px; height: 15px; border-bottom: 2px solid ${T.primary}; border-right: 2px solid ${T.primary}; opacity: 0.6; }
      `}</style>

      <div className="holo-root">
        <HexGrid color={T.primary} />
        <Particles color={T.primary} />

        {/* ── TOPBAR ── */}
        <div className="topbar">
          <div className="topbar-brand" onClick={() => router.push("/candidate/dashboard")}>
            NEXUS OS <span style={{color: '#fff', fontSize: '11px', fontWeight: 500, opacity: 0.4, letterSpacing: '0.1em'}}>[ OVERRIDE ]</span>
          </div>
          <div className="theme-switcher">
            {Object.entries(THEMES).map(([key, th]) => (
              <div key={key} className={`theme-dot${activeTheme === key ? " active" : ""}`}
                style={{ background: th.primary }}
                onClick={() => setActiveTheme(key)} title={th.name} />
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="content">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="card-holo">
              <div className="crosshair-tl" />
              <div className="crosshair-br" />

              <div className="section-header">Identity Parameters</div>

              {/* NAME */}
              <div className="form-group">
                <label className="form-label">Operative Designation</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange} 
                  placeholder="Enter classification name..."
                  className="form-input"
                  required
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div className="form-group">
                <label className="form-label">Visual Identifier (Holo-Avatar)</label>
                <div className="file-upload-box" style={{ borderColor: image ? T.primary : "" }}>
                  <div className="file-upload-text">
                    {image ? `File locked: ${image.name}` : "Click or drag to uplink image file"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="file-input"
                  />
                </div>
              </div>

              {/* SKILLS */}
              <div className="form-group">
                <label className="form-label">Combat Skills Array</label>
                <div className="skill-input-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    className="form-input"
                    placeholder="Enter skill protocol..."
                  />
                  <button type="button" onClick={addSkill} className="btn-add">
                    Inject
                  </button>
                </div>

                <div className="skills-grid">
                  {form.skills.map((skill, i) => (
                    <span key={i} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => removeSkill(i)} className="skill-remove">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* EDUCATION */}
              <div className="form-group">
                <label className="form-label">Academic Archives</label>
                <textarea
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="Detail your educational programming..."
                  className="form-input form-textarea"
                />
              </div>

              {/* EXPERIENCE */}
              <div className="form-group">
                <label className="form-label">Field Deployments</label>
                <textarea
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="Detail your past mission experience..."
                  className="form-input form-textarea"
                />
              </div>

              {/* SUBMIT */}
              <div className="submit-wrapper">
                <button type="submit" disabled={isSubmitting} className="btn-submit">
                  {isSubmitting ? "UPLOADING TO MAINFRAME..." : "SYNC DATABANKS"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          <span style={{ color: notification.type === 'error' ? '#f87171' : T.primary, fontSize: '18px' }}>
            {notification.type === "success" ? "◈" : "⚠"}
          </span>
          {notification.msg}
        </div>
      )}
    </>
  );
}