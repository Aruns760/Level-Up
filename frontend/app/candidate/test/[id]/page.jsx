"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

/* ══ 1. MEMOIZED EXTERNAL COMPONENTS (Prevents FPS drops) ══ */

const LoadScreen = memo(({ msg }) => (
  <div style={{ 
    minHeight: "100vh", background: "#020b18", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Share+Tech+Mono&display=swap');
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
    <div style={{ 
      width: 48, height: 48, border: "3px solid rgba(0,229,255,0.15)",
      borderTop: "3px solid #00e5ff", borderRadius: "50%", animation: "spin 0.7s linear infinite" 
    }} />
    <p style={{ 
      fontFamily: "'Share Tech Mono', monospace", color: "#00e5ff",
      letterSpacing: "0.3em", fontSize: 12 
    }}>{msg}</p>
  </div>
));
LoadScreen.displayName = "LoadScreen";

const BgCanvas = memo(() => {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.4 + 0.1,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.o})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cvs.width)  p.vx *= -1;
        if (p.y < 0 || p.y > cvs.height) p.vy *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
});
BgCanvas.displayName = "BgCanvas";

const CircleTimer = memo(({ timeLeft, totalTime, warning }) => {
  const r = 54, circ = 2 * Math.PI * r;
  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const color = warning ? "#ef4444" : timeLeft < totalTime * 0.3 ? "#f59e0b" : "#00e5ff";
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");
  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1s linear, stroke 0.5s" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ 
          fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700,
          color, lineHeight: 1, transition: "color 0.5s",
          animation: warning ? "timerPulse 0.5s ease-in-out infinite alternate" : "none",
        }}>{mins}:{secs}</span>
        <span style={{ 
          fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
          color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginTop: 3 
        }}>TIME LEFT</span>
      </div>
    </div>
  );
});
CircleTimer.displayName = "CircleTimer";

const ResultScreen = memo(({ score, total, onRedirect, countDown }) => {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const grade = pct >= 80 ? "S" : pct >= 60 ? "A" : pct >= 40 ? "B" : "C";
  const gradeColor = pct >= 80 ? "#ffd700" : pct >= 60 ? "#00e5ff" : pct >= 40 ? "#4ade80" : "#f87171";
  const msg = pct >= 80 ? "LEGENDARY" : pct >= 60 ? "EXCELLENT" : pct >= 40 ? "CLEARED" : "SYSTEM FAILURE";
  const r = 70, circ = 2 * Math.PI * r;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(2,11,24,0.97)", backdropFilter: "blur(10px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 0, animation: "resultFadeIn 0.6s ease forwards",
    }}>
      <style>{`
        @keyframes resultFadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes gradeIn { 0%{opacity:0;transform:scale(0.4) rotate(-10deg)} 60%{transform:scale(1.15) rotate(3deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes scoreRing { from{stroke-dasharray:0 ${circ}} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
      <div style={{
        fontFamily: "'Orbitron',sans-serif", fontSize: 96, fontWeight: 900,
        color: gradeColor, lineHeight: 1, marginBottom: 8,
        textShadow: `0 0 40px ${gradeColor}, 0 0 80px ${gradeColor}`,
        animation: "gradeIn 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards, floatY 3s ease-in-out 1s infinite",
        opacity: 0,
      }}>{grade}</div>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace", fontSize: 13, letterSpacing: "0.3em",
        color: gradeColor, marginBottom: 32, textTransform: "uppercase",
        textShadow: `0 0 16px ${gradeColor}`,
      }}>{msg}</div>
      <div style={{ position: "relative", width: 160, height: 160, marginBottom: 28 }}>
        <svg width={160} height={160} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <circle cx={80} cy={80} r={r} fill="none" stroke={gradeColor} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            style={{ filter: `drop-shadow(0 0 10px ${gradeColor})`, animation: `scoreRing 1.5s ease 0.5s both` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 700, color: "#fff" }}>{score}/{total}</span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginTop: 4 }}>{pct}% SCORE</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
        {[ { label: "CORRECT", val: score, c: "#4ade80" }, { label: "WRONG", val: total - score, c: "#f87171" }, { label: "ACCURACY", val: `${pct}%`, c: gradeColor } ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700, color: s.c, marginBottom: 4 }}>{s.val}</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 16 }}>
        Returning to Command Center in <span style={{ color: "#00e5ff", fontWeight: 700 }}>{countDown}s</span>
      </div>
      <button onClick={onRedirect} style={{
        padding: "12px 32px", border: "1px solid rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.08)", color: "#00e5ff",
        fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer", borderRadius: 4,
        clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)", transition: "all 0.25s",
      }}>FORCE UPLINK →</button>
    </div>
  );
});
ResultScreen.displayName = "ResultScreen";


/* ══ 2. MAIN ADVANCED TEST PAGE ════════════════════════════════ */
export default function TestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState(null);
  const [countDown, setCountDown] = useState(6);
  const [current, setCurrent] = useState(0);
  const [toast, setToast] = useState(null);
  const [warning, setWarning] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const goToDashboard = useCallback(() => router.push("/candidate/dashboard"), [router]);

  /* ── Core Submission Engine ── */
  const submitTest = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/tests/submit/${id}`, { answers }, { headers: { Authorization: `Bearer ${token}` } });
      setResult({ score: res.data.score, total: res.data.total });
    } catch (err) {
      console.error(err);
      setResult({ score: 0, total: test?.questions?.length || 0 });
    }
  }, [id, answers, token, submitted, test]);

  /* ── SECURITY: Fetching & Verification ── */
  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;

    axios.get("http://localhost:3000/api/tests/my-results", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!isMounted) return;
        const already = res.data.some(r => r.testId === Number(id));
        if (already) { 
          showToast("Access Denied: Module Already Cleared", "error"); 
          setTimeout(() => router.push("/candidate/dashboard"), 2000); 
        } else {
          setChecking(false);
        }
      }).catch(() => { if(isMounted) setChecking(false); });
      
    return () => { isMounted = false; };
  }, [id, token, router, showToast]);

  useEffect(() => {
    if (!id || !token || checking) return;
    axios.get(`http://localhost:3000/api/tests/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setTest(res.data);
        const secs = (res.data.duration || 10) * 60;
        setTimeLeft(secs); setTotalTime(secs);
      });
  }, [id, token, checking]);

  /* ── Anti-Cheat: Tab Visibility Tracker ── */
  useEffect(() => {
    if (!test || submitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        showToast("WARNING: Unauthorized environment breach detected. Activity logged.", "error");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [test, submitted, showToast]);


  /* ✅ FIX: Moved handleAnswer UP and wrapped in useCallback */
  const handleAnswer = useCallback((qid, opt) => {
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  }, []);


  /* ── Advanced Keyboard Navigation ── */
  useEffect(() => {
    if (!test || submitted || result) return;
    
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      const totalQs = test.questions?.length || 0;
      
      if (['A', 'B', 'C', 'D'].includes(key)) {
        // Now handleAnswer is safely declared before this runs!
        handleAnswer(test.questions[current].id, key);
      } else if (e.key === "ArrowRight" && current < totalQs - 1) {
        setCurrent(prev => prev + 1);
      } else if (e.key === "ArrowLeft" && current > 0) {
        setCurrent(prev => prev - 1);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [test, submitted, result, current, handleAnswer]); // ✅ Added handleAnswer to dependencies

  /* ── Timers ── */
  useEffect(() => {
    if (!test || submitted) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); submitTest(); return 0; }
        if (prev <= 30) setWarning(true);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [test, submitted, submitTest]);

  useEffect(() => {
    if (!result) return;
    const t = setInterval(() => {
      setCountDown(v => {
        if (v <= 1) { clearInterval(t); goToDashboard(); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [result, goToDashboard]);


  const answered = Object.keys(answers).length;
  const total = test?.questions?.length || 0;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const q = test?.questions?.[current];

  if (checking) return <LoadScreen msg="VERIFYING SECURITY CLEARANCE..." />;
  if (!test) return <LoadScreen msg="DOWNLOADING COMBAT MODULE..." />;

  const OPTS = ["A", "B", "C", "D"];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .tp-root {
          min-height: 100vh; background: #020b18; font-family: 'Exo 2', sans-serif; color: #e2e8f0;
          position: relative; overflow-x: hidden;
        }
        .tp-root::before {
          content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .tp-top {
          position: sticky; top: 0; z-index: 50; background: rgba(2,11,24,0.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06); padding: 12px 24px; display: flex; align-items: center; gap: 16px;
        }
        .tp-title {
          font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.18em;
          color: #fff; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
        }
        .tp-badge { font-family: 'Share Tech Mono', monospace; font-size: 9px; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.12em; white-space: nowrap; }

        .tp-body { display: grid; grid-template-columns: 280px 1fr; gap: 0; min-height: calc(100vh - 57px); }
        @media (max-width: 820px) { .tp-body { grid-template-columns: 1fr; } }

        .tp-sidebar {
          border-right: 1px solid rgba(255,255,255,0.05); padding: 24px 18px; background: rgba(0,0,0,0.3);
          display: flex; flex-direction: column; gap: 20px; position: sticky; top: 57px; height: calc(100vh - 57px); overflow-y: auto;
        }

        .tp-prog-label { display: flex; justify-content: space-between; font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.12em; margin-bottom:6px; }
        .tp-prog-track { height: 5px; background: rgba(255,255,255,0.06); border-radius: 99px; overflow: hidden; }
        .tp-prog-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #0072ff, #00e5ff); box-shadow: 0 0 8px rgba(0,229,255,0.5); transition: width 0.4s ease; }

        .tp-qmap { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .tp-qmap-btn {
          aspect-ratio: 1; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          font-family: 'Orbitron', monospace; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35);
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .tp-qmap-btn:hover { border-color: rgba(0,229,255,0.4); color: #00e5ff; }
        .tp-qmap-btn.answered { background: rgba(0,229,255,0.12); border-color: rgba(0,229,255,0.35); color: #00e5ff; }
        .tp-qmap-btn.current { background: rgba(0,229,255,0.2); border-color: rgba(0,229,255,0.7); color: #fff; box-shadow: 0 0 10px rgba(0,229,255,0.3); }

        .tp-submit-btn {
          width: 100%; padding: 12px; border: none; border-radius: 6px; font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: all 0.3s; margin-top: auto;
          clip-path: polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
          background: linear-gradient(135deg, #0072ff, #00e5ff); color: #000; box-shadow: 0 0 18px rgba(0,229,255,0.35); position: relative; overflow: hidden;
        }
        .tp-submit-btn:hover:not(:disabled) { box-shadow: 0 0 32px rgba(0,229,255,0.6); transform: translateY(-1px); }
        .tp-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .tp-submit-btn::after {
          content: ''; position: absolute; top:-50%; left:-70%; width:30%; height:200%; background: rgba(255,255,255,0.15); transform: skewX(-20deg); animation: shimmer 2.5s infinite;
        }
        @keyframes shimmer { 0%{left:-70%} 100%{left:170%} }

        .tp-qpanel { padding: 32px 36px; display: flex; flex-direction: column; gap: 0; max-width: 780px; }
        @media (max-width: 820px) { .tp-qpanel { padding: 20px; } }

        .tp-qnum { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: rgba(0,229,255,0.5); letter-spacing: 0.2em; margin-bottom: 10px; }
        .tp-qtext { font-size: 17px; font-weight: 600; color: #fff; line-height: 1.65; margin-bottom: 28px; border-left: 3px solid rgba(0,229,255,0.4); padding-left: 14px; }

        .tp-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .tp-option {
          display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;
        }
        .tp-option:hover { border-color: rgba(0,229,255,0.3); background: rgba(0,229,255,0.06); transform: translateX(4px); }
        .tp-option.selected { border-color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.12); box-shadow: 0 0 16px rgba(0,229,255,0.15); }
        .tp-option.selected::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #00e5ff; box-shadow: 0 0 8px #00e5ff; }
        
        .tp-opt-key {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); transition: all 0.25s;
        }
        .tp-option.selected .tp-opt-key { background: rgba(0,229,255,0.2); border-color: rgba(0,229,255,0.5); color: #00e5ff; box-shadow: 0 0 8px rgba(0,229,255,0.3); }
        .tp-opt-text { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.5; transition: color 0.25s; }
        .tp-option.selected .tp-opt-text { color: #fff; font-weight: 500; }

        .tp-nav { display: flex; align-items: center; gap: 12px; }
        .tp-nav-btn {
          padding: 10px 22px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
          font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; cursor: pointer; transition: all 0.2s;
          clip-path: polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
        }
        .tp-nav-btn:hover:not(:disabled) { border-color: rgba(0,229,255,0.4); color: #00e5ff; background: rgba(0,229,255,0.06); }
        .tp-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .tp-nav-count { flex: 1; text-align: center; font-family: 'Share Tech Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; }

        .tp-toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 999; padding: 14px 20px; border-radius: 8px; min-width: 260px;
          font-family: 'Share Tech Mono', monospace; font-size: 12px; display: flex; align-items: center; gap: 12px;
          backdrop-filter: blur(20px); border: 1px solid; animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tp-toast-error { background:rgba(239,68,68,0.15); border-color:rgba(239,68,68,0.4); color:#fca5a5; box-shadow: 0 0 20px rgba(239,68,68,0.2); }
        .tp-toast-info { background:rgba(0,229,255,0.1); border-color:rgba(0,229,255,0.3); color:#67e8f9; }
        .tp-toast-success { background:rgba(74,222,128,0.15); border-color:rgba(74,222,128,0.4); color:#86efac; }
        @keyframes toastIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes timerPulse { from { opacity:1; transform:scale(1); } to { opacity:0.6; transform:scale(0.95); } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 99px; }
      `}</style>

      {result && (
        <ResultScreen score={result.score} total={result.total} onRedirect={goToDashboard} countDown={countDown} />
      )}

      <div className="tp-root">
        <BgCanvas />

        <div className="tp-top">
          <div className="tp-title">{test.title}</div>
          <div className="tp-badge" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00e5ff" }}>
            {answered}/{total} DATA SYNCED
          </div>
          {tabSwitches > 0 && (
            <div className="tp-badge" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
              WARNINGS: {tabSwitches}
            </div>
          )}
          <div className="tp-badge" style={{
            background: warning ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${warning ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: warning ? "#f87171" : "rgba(255,255,255,0.4)",
          }}>
            MODULE {id}
          </div>
        </div>

        <div className="tp-body">
          <aside className="tp-sidebar">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <CircleTimer timeLeft={timeLeft} totalTime={totalTime} warning={warning} />
            </div>

            <div className="tp-prog-wrap">
              <div className="tp-prog-label">
                <span>COMPLETION</span><span>{Math.round(progress)}%</span>
              </div>
              <div className="tp-prog-track">
                <div className="tp-prog-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div>
              <div style={{ 
                fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", 
                letterSpacing: "0.18em", marginBottom: 10, textTransform: "uppercase" 
              }}>Sector Map Grid</div>
              <div className="tp-qmap">
                {test.questions.map((qq, i) => (
                  <button key={qq.id}
                    className={`tp-qmap-btn${answers[qq.id] ? " answered" : ""}${i === current ? " current" : ""}`}
                    onClick={() => setCurrent(i)}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[
                { label:"ACTIVE", color:"rgba(0,229,255,0.7)", bg:"rgba(0,229,255,0.2)" },
                { label:"STORED", color:"rgba(0,229,255,0.35)", bg:"rgba(0,229,255,0.12)" },
                { label:"EMPTY",  color:"rgba(255,255,255,0.08)", bg:"rgba(255,255,255,0.03)" },
              ].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:2, border:`1px solid ${l.color}`, background:l.bg }} />
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em" }}>{l.label}</span>
                </div>
              ))}
            </div>

            <button className="tp-submit-btn" disabled={submitted} onClick={submitTest}>
              ⚡ EXECUTE UPLINK
            </button>
          </aside>

          {q && (
            <main className="tp-qpanel" key={current}>
              <div className="tp-qnum">DATABLOCK {current + 1} OF {total}</div>
              <div className="tp-qtext">{q.question}</div>

              <div className="tp-options">
                {OPTS.map(opt => {
                  const optText = q[`option${opt}`] || q.options?.[opt] || q[opt.toLowerCase()] || opt;
                  const isSelected = answers[q.id] === opt;
                  return (
                    <div key={opt} className={`tp-option${isSelected ? " selected" : ""}`} onClick={() => handleAnswer(q.id, opt)}>
                      <div className="tp-opt-key">{opt}</div>
                      <div className="tp-opt-text">{optText}</div>
                    </div>
                  );
                })}
              </div>

              <div className="tp-nav">
                <button className="tp-nav-btn" disabled={current === 0} onClick={() => setCurrent(v => Math.max(0, v - 1))}>
                  ← PREV [🡄]
                </button>
                <div className="tp-nav-count">PRESS A, B, C, D TO SELECT</div>
                <button className="tp-nav-btn" disabled={current === total - 1} onClick={() => setCurrent(v => Math.min(total - 1, v + 1))}>
                  NEXT [🡆] →
                </button>
              </div>
            </main>
          )}
        </div>
      </div>

      {toast && (
        <div className={`tp-toast tp-toast-${toast.type}`}>
          <span style={{ fontSize: 16 }}>{toast.type === "error" ? "⚠️" : toast.type === "success" ? "✓" : "ℹ"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}