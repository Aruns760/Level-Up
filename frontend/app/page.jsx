"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ══ DOMAIN EXPANSION CANVAS ═══════════════════════════════════
   Gojo-style hollow purple void: red + blue orbs collide → purple
════════════════════════════════════════════════════════════════ */
function DomainCanvas({ active, onComplete }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    const W = cvs.width, H = cvs.height;
    const cx = W / 2, cy = H / 2;
    let t = 0;
    const DURATION = 370;

    const voidStars = Array.from({ length: 280 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.7 + 0.15,
      tw: Math.random() * Math.PI * 2,
    }));

    let id;
    const draw = () => {
      const p = t / DURATION;

      // Base void fill
      const bgA = Math.min(1, p * 5);
      ctx.fillStyle = `rgba(0,0,4,${bgA})`;
      ctx.fillRect(0, 0, W, H);

      // Stars
      if (p > 0.04) {
        const sA = Math.min(1, (p - 0.04) * 8) * (p > 0.88 ? Math.max(0, (1 - p) * 8) : 1);
        voidStars.forEach(s => {
          s.tw += 0.025;
          const a = s.o * (0.5 + 0.5 * Math.sin(s.tw)) * sA;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
        });
      }

      // Infinite void grid floor
      if (p > 0.08) {
        const gA = Math.min(1, (p - 0.08) * 6) * (p > 0.88 ? Math.max(0, (1 - p) * 7) : 1);
        ctx.save();
        const horizon = cy + 60;
        ctx.strokeStyle = `rgba(90,0,140,${0.18 * gA})`;
        ctx.lineWidth = 0.6;
        for (let i = -24; i <= 24; i++) {
          ctx.beginPath(); ctx.moveTo(cx + i * 75, horizon);
          ctx.lineTo(cx + i * 9000, H + 300); ctx.stroke();
        }
        for (let j = 0; j < 22; j++) {
          const yp = j / 22;
          const yy = horizon + yp * yp * (H - horizon + 300);
          const sp = 75 + yp * yp * 9000;
          ctx.beginPath(); ctx.moveTo(cx - sp, yy); ctx.lineTo(cx + sp, yy); ctx.stroke();
        }
        ctx.restore();
      }

      // Rotating wireframe cube
      if (p > 0.12) {
        const cA = Math.min(1, (p - 0.12) * 5) * (p > 0.78 ? Math.max(0, (0.88 - p) * 9) : 1);
        const rot = t * 0.009;
        ctx.save(); ctx.translate(cx, cy);
        const SZ = 155 + p * 50;
        const c1 = Math.cos(rot), s1 = Math.sin(rot);
        const c2 = Math.cos(rot * 0.65), s2 = Math.sin(rot * 0.65);
        const proj = (x, y, z) => {
          const xr = x * c1 - z * s1, zr = x * s1 + z * c1;
          const yr = y * c2 - zr * s2, zr2 = y * s2 + zr * c2;
          const sc = 580 / (580 + zr2 + 380);
          return { x: xr * sc, y: yr * sc };
        };
        const vs = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
          .map(([x,y,z]) => proj(x*SZ, y*SZ, z*SZ));
        const es = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
        ctx.strokeStyle = `rgba(110,0,200,${0.32 * cA})`; ctx.lineWidth = 0.9;
        es.forEach(([a,b]) => {
          ctx.beginPath(); ctx.moveTo(vs[a].x, vs[a].y); ctx.lineTo(vs[b].x, vs[b].y); ctx.stroke();
        });
        ctx.restore();
      }

      // RED ORB
      if (p > 0.22 && p < 0.84) {
        const op = Math.min(1, (p - 0.22) / 0.38);
        const rx = cx - (1 - op) * W * 0.58;
        const ry = cy + Math.sin(op * Math.PI * 1.8) * 45;
        const rr = 28 + op * 24;
        [3,2,1].forEach(l => {
          const g = ctx.createRadialGradient(rx,ry,0,rx,ry,rr*l*2.2);
          g.addColorStop(0, `rgba(255,20,20,${0.38/l})`);
          g.addColorStop(0.4, `rgba(200,0,0,${0.18/l})`);
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(rx,ry,rr*l*2.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        });
        const rg = ctx.createRadialGradient(rx,ry,0,rx,ry,rr);
        rg.addColorStop(0,"#fff"); rg.addColorStop(0.25,"#ff5555"); rg.addColorStop(1,"#660000");
        ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2);
        ctx.fillStyle=rg; ctx.shadowBlur=45; ctx.shadowColor="#ff0000"; ctx.fill(); ctx.shadowBlur=0;
        ctx.strokeStyle=`rgba(255,40,40,${0.25*op})`; ctx.lineWidth=1.5;
        ctx.setLineDash([6,14]);
        ctx.beginPath(); ctx.moveTo(cx-W*0.58,cy); ctx.lineTo(rx,ry); ctx.stroke();
        ctx.setLineDash([]);
      }

      // BLUE ORB
      if (p > 0.22 && p < 0.84) {
        const op = Math.min(1, (p - 0.22) / 0.38);
        const bx = cx + (1 - op) * W * 0.58;
        const by = cy - Math.sin(op * Math.PI * 1.8) * 45;
        const br = 28 + op * 24;
        [3,2,1].forEach(l => {
          const g = ctx.createRadialGradient(bx,by,0,bx,by,br*l*2.2);
          g.addColorStop(0, `rgba(20,80,255,${0.38/l})`);
          g.addColorStop(0.4, `rgba(0,50,220,${0.18/l})`);
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(bx,by,br*l*2.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        });
        const bg2 = ctx.createRadialGradient(bx,by,0,bx,by,br);
        bg2.addColorStop(0,"#fff"); bg2.addColorStop(0.25,"#4488ff"); bg2.addColorStop(1,"#001466");
        ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2);
        ctx.fillStyle=bg2; ctx.shadowBlur=45; ctx.shadowColor="#0044ff"; ctx.fill(); ctx.shadowBlur=0;
        ctx.strokeStyle=`rgba(30,80,255,${0.25*op})`; ctx.lineWidth=1.5;
        ctx.setLineDash([6,14]);
        ctx.beginPath(); ctx.moveTo(cx+W*0.58,cy); ctx.lineTo(bx,by); ctx.stroke();
        ctx.setLineDash([]);
      }

      // COLLISION FLASH
      if (p > 0.59 && p < 0.67) {
        const fp = (p - 0.59) / 0.08;
        const fl = fp < 0.5 ? fp*2 : (1-fp)*2;
        ctx.fillStyle = `rgba(255,255,255,${fl * 0.92})`; ctx.fillRect(0,0,W,H);
      }

      // HOLLOW PURPLE EXPLOSION
      if (p > 0.61) {
        const ep = Math.min(1, (p - 0.61) / 0.28);
        const pr = ep * Math.max(W, H) * 1.25;
        const pa = ep < 0.65 ? ep * 1.5 : Math.max(0, (1 - ep) * 3.2);

        const pg = ctx.createRadialGradient(cx,cy,0,cx,cy,pr);
        pg.addColorStop(0,   `rgba(220,0,255,${Math.max(0,pa)*0.95})`);
        pg.addColorStop(0.18,`rgba(160,0,230,${Math.max(0,pa)*0.75})`);
        pg.addColorStop(0.45,`rgba(80,0,160,${Math.max(0,pa)*0.45})`);
        pg.addColorStop(0.75,`rgba(35,0,70,${Math.max(0,pa)*0.18})`);
        pg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(cx,cy,pr,0,Math.PI*2); ctx.fillStyle=pg; ctx.fill();

        // Void hole
        if (ep > 0.18) {
          const vr = Math.max(0, (ep - 0.18) * 0.85 * 200);
          if (vr > 0) {
            const vg = ctx.createRadialGradient(cx,cy,0,cx,cy,vr);
            vg.addColorStop(0, `rgba(0,0,0,${Math.min(1,ep*2.2)})`);
            vg.addColorStop(0.55, `rgba(5,0,15,${Math.min(0.85,ep*1.6)})`);
            vg.addColorStop(1, "transparent");
            ctx.beginPath(); ctx.arc(cx,cy,vr,0,Math.PI*2); ctx.fillStyle=vg; ctx.fill();
          }
        }

        // Tendrils
        if (ep > 0.08 && ep < 0.92) {
          for (let i = 0; i < 18; i++) {
            const ang = (i/18)*Math.PI*2 + t*0.018;
            const len = pr * (0.35 + Math.sin(t*0.09+i*1.3)*0.18);
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);
            ctx.strokeStyle = `rgba(180,0,255,${Math.max(0,pa)*0.55})`;
            ctx.lineWidth = 1.2 + Math.sin(t*0.07+i)*0.8;
            ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(len,0); ctx.stroke();
            ctx.restore();
          }
        }
      }

      // "DOMAIN EXPANSION" label
      if (p > 0.3 && p < 0.63) {
        const tp = Math.min(1,(p-0.3)/0.1);
        ctx.save(); ctx.textAlign="center";
        ctx.font=`bold ${Math.floor(13+tp*7)}px 'Orbitron',sans-serif`;
        ctx.fillStyle=`rgba(255,255,255,${tp*0.85})`;
        ctx.shadowBlur=18; ctx.shadowColor="#aa00ff";
        ctx.fillText("DOMAIN EXPANSION", cx, cy-190);
        ctx.font=`900 ${Math.floor(22+tp*14)}px 'Orbitron',sans-serif`;
        ctx.fillStyle=`rgba(210,80,255,${tp})`;
        ctx.shadowBlur=28; ctx.shadowColor="#ff00ff";
        ctx.fillText("∞  INFINITE VOID  ∞", cx, cy-155);
        ctx.restore();
      }

      // "NAH I'D WIN" — Gojo's iconic line
      if (p > 0.68) {
        const np = Math.min(1,(p-0.68)/0.14);
        const fl2 = 0.75 + 0.25 * Math.sin(t*0.4);
        ctx.save(); ctx.textAlign="center";
        // Glow backing
        ctx.font=`900 ${Math.floor(30+np*32)}px 'Orbitron',sans-serif`;
        ctx.shadowBlur=60; ctx.shadowColor="#cc00ff";
        ctx.fillStyle=`rgba(180,80,255,${np*0.35*fl2})`;
        ctx.fillText("NAH, I'D WIN.", cx, cy+8);
        // Main text
        ctx.shadowBlur=25; ctx.shadowColor="#ee88ff";
        ctx.fillStyle=`rgba(255,255,255,${np*fl2})`;
        ctx.fillText("NAH, I'D WIN.", cx, cy+8);
        // Sub
        ctx.font=`600 ${Math.floor(11+np*5)}px 'Share Tech Mono',monospace`;
        ctx.fillStyle=`rgba(200,140,255,${np*0.75*fl2})`;
        ctx.shadowBlur=12;
        ctx.fillText("— I'M THE STRONGEST", cx, cy+52);
        ctx.restore();
      }

      // Fade out at end
      if (p > 0.92) {
        const fa = (p - 0.92) / 0.08;
        ctx.fillStyle = `rgba(0,0,0,${fa})`; ctx.fillRect(0,0,W,H);
      }

      t++;
      if (t < DURATION) { id = requestAnimationFrame(draw); }
      else { onComplete?.(); }
    };

    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [active, onComplete]);

  return (
    <canvas ref={ref} style={{
      position:"fixed", inset:0, zIndex:50, pointerEvents:"none",
      display: active ? "block" : "none",
    }} />
  );
}

/* ══ STAR FIELD ════════════════════════════════════════════════ */
function StarField() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => {
      cvs.width = window.innerWidth; cvs.height = window.innerHeight;
    };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 260 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 1.3 + 0.2, o: Math.random() * 0.65 + 0.1,
      speed: Math.random() * 0.55 + 0.1, drift: (Math.random() - 0.5) * 0.12,
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0,0,cvs.width,cvs.height);
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${s.o})`; ctx.fill();
        s.y -= s.speed; s.x += s.drift;
        if (s.y < -5) { s.y = cvs.height+5; s.x = Math.random()*cvs.width; }
        if (s.x < 0 || s.x > cvs.width) s.drift *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

/* ══ LEVEL COUNTER ═════════════════════════════════════════════ */
function LevelCounter({ target, duration = 1000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}</>;
}

/* ══ CYCLING PLAYER AVATARS ════════════════════════════════════ */
const PLAYERS = [
  { icon:"⚡", label:"CANDIDATE", color:"#00e5ff", glow:"rgba(0,229,255,0.7)" },
  { icon:"🏢", label:"RECRUITER", color:"#a855f7", glow:"rgba(168,85,247,0.7)" },
  { icon:"☠",  label:"ADMIN",     color:"#ff2222", glow:"rgba(255,34,34,0.7)"  },
  { icon:"⚔",  label:"WARRIOR",   color:"#ffd700", glow:"rgba(255,215,0,0.7)"  },
  { icon:"◈",  label:"PHANTOM",   color:"#4ade80", glow:"rgba(74,222,128,0.7)" },
  { icon:"∞",  label:"INFINITE",  color:"#c084fc", glow:"rgba(192,132,252,0.7)"},
];

function PlayerCycle({ active }) {
  const [idx, setIdx] = useState(0);
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => { setIdx(v => (v+1) % PLAYERS.length); setBlink(false); }, 100);
    }, 850);
    return () => clearInterval(t);
  }, [active]);
  const pl = PLAYERS[idx];
  return (
    <div style={{
      width:112, height:112, borderRadius:"50%", position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center",
      background:`radial-gradient(circle, ${pl.color}18 0%, rgba(0,0,0,0.55) 70%)`,
      border:`2px solid ${pl.color}`,
      boxShadow:`0 0 28px ${pl.glow}, 0 0 60px ${pl.glow}55, inset 0 0 20px ${pl.color}12`,
      transition:"border-color 0.08s, box-shadow 0.08s",
      opacity: blink ? 0 : 1,
      animation: blink ? "none" : "playerFloat 2.2s ease-in-out infinite",
    }}>
      <span style={{ fontSize:48, filter:`drop-shadow(0 0 14px ${pl.glow})`, lineHeight:1 }}>{pl.icon}</span>
      <div style={{ position:"absolute", inset:-7, borderRadius:"50%",
        border:`1px solid ${pl.color}35`, animation:"ringRot 3.5s linear infinite" }} />
      <div style={{ position:"absolute", inset:-15, borderRadius:"50%",
        border:`1px dashed ${pl.color}18`, animation:"ringRot 6s linear infinite reverse" }} />
      {/* Label */}
      <div style={{
        position:"absolute", bottom:-28,
        fontFamily:"'Share Tech Mono',monospace", fontSize:9,
        color:pl.color, letterSpacing:"0.18em", whiteSpace:"nowrap",
        textShadow:`0 0 8px ${pl.glow}`,
        opacity: blink ? 0 : 1, transition:"opacity 0.08s",
      }}>{pl.label}</div>
    </div>
  );
}

/* ══ BOOT LINES ════════════════════════════════════════════════ */
const BOOT_LINES = [
  { text:"> NEXUS OS v5.0.0 INITIALIZING...", color:"rgba(0,229,255,0.85)" },
  { text:"> TALENT COMBAT MATRIX: LOADED",    color:"rgba(0,229,255,0.7)"  },
  { text:"> SKILL ENGINE: CALIBRATED",         color:"rgba(0,229,255,0.6)"  },
  { text:"> CURSED ENERGY: DETECTED ∞",        color:"rgba(168,85,247,0.9)" },
  { text:"> SIX EYES: ACTIVE",                 color:"rgba(120,160,255,0.9)" },
  { text:"> DOMAIN EXPANSION: ARMED",          color:"rgba(200,80,255,0.95)" },
  { text:"> ALL SYSTEMS READY.",               color:"rgba(255,215,0,1)"     },
];

/* ══ MAIN ══════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [phase, setPhase]         = useState("boot");
  const [bootLine, setBootLine]   = useState(0);
  const [domainActive, setDomainActive] = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [showStats, setShowStats] = useState(false);

  /* ── Boot ── */
  useEffect(() => {
    if (phase !== "boot") return;
    if (bootLine < BOOT_LINES.length) {
      const t = setTimeout(() => setBootLine(v => v+1), 210);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("logo"), 320);
      return () => clearTimeout(t);
    }
  }, [bootLine, phase]);

  /* ── Logo → Domain ── */
  useEffect(() => {
    if (phase !== "logo") return;
    const t1 = setTimeout(() => setShowStats(true), 480);
    const t2 = setTimeout(() => { setPhase("domain"); setDomainActive(true); }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  /* ── Domain complete → exit ── */
  const handleDomainComplete = useCallback(() => {
    setDomainActive(false);
    setExiting(true);
    setTimeout(() => router.push("/login"), 850);
  }, [router]);

  const skip = () => {
    setExiting(true);
    setTimeout(() => router.push("/login"), 650);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body, html { overflow:hidden; height:100%; }

        .h-root {
          min-height:100vh; height:100vh;
          background:#020408;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          position:relative; overflow:hidden;
          font-family:'Exo 2',sans-serif;
          transition:opacity 0.9s ease, transform 0.9s ease;
        }
        .h-root.exiting { opacity:0; transform:scale(1.1) rotateX(3deg); }

        .h-root::before {
          content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(ellipse 120% 70% at 50% -10%, rgba(0,30,80,0.4)  0%, transparent 55%),
            radial-gradient(ellipse 80%  60% at 5%  80%,  rgba(60,0,100,0.2) 0%, transparent 50%),
            radial-gradient(ellipse 60%  50% at 95% 70%,  rgba(0,60,100,0.2) 0%, transparent 50%);
        }

        .h-grid {
          position:fixed; inset:0; z-index:1; pointer-events:none;
          background-image:
            linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
          background-size:58px 58px;
          animation:gridDrift 22s linear infinite;
        }
        @keyframes gridDrift { 100%{background-position:58px 58px} }
        .h-scan {
          position:fixed; inset:0; z-index:2; pointer-events:none;
          background:repeating-linear-gradient(0deg,transparent,transparent 3px,
            rgba(0,0,0,0.032) 3px,rgba(0,0,0,0.032) 4px);
        }

        /* Boot */
        .boot-box { position:relative; z-index:10; width:100%; max-width:560px; padding:0 28px; }
        .boot-line {
          font-family:'Share Tech Mono',monospace; font-size:13px;
          line-height:2.1; opacity:0; letter-spacing:0.07em;
          animation:lineAppear 0.22s ease forwards;
        }
        @keyframes lineAppear { to{opacity:1} }
        .boot-cursor {
          display:inline-block; width:10px; height:15px;
          background:#00e5ff; animation:cur 0.7s step-end infinite;
          vertical-align:middle; margin-left:6px; box-shadow:0 0 8px #00e5ff;
        }
        @keyframes cur { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Logo */
        .logo-wrap {
          display:flex; flex-direction:column; align-items:center;
          gap:30px; position:relative; z-index:10;
          animation:logoIn 0.85s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0;
        }
        @keyframes logoIn {
          from{opacity:0;transform:scale(0.6) translateY(28px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        .logo-title {
          font-family:'Orbitron',sans-serif; font-weight:900;
          font-size:clamp(22px,5vw,48px); letter-spacing:0.1em;
          background:linear-gradient(135deg,#ffd700 0%,#fffacd 22%,#ffd700 50%,#b8860b 78%,#ffd700 100%);
          background-size:400% 400%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:goldFlow 2.8s ease infinite; line-height:1.1;
        }
        @keyframes goldFlow { 0%{background-position:0%} 100%{background-position:400%} }
        .logo-sub {
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(255,255,255,0.26); letter-spacing:0.35em;
          text-transform:uppercase; margin-top:6px; text-align:center;
        }

        /* Level badge */
        .lvl-badge {
          display:flex; align-items:center; gap:14px;
          padding:10px 30px; border-radius:4px;
          background:rgba(255,215,0,0.07);
          border:1px solid rgba(255,215,0,0.28);
          box-shadow:0 0 28px rgba(255,215,0,0.12);
          animation:levelPop 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.25s both;
        }
        @keyframes levelPop {
          from{opacity:0;transform:scale(0.35)} to{opacity:1;transform:scale(1)}
        }

        /* Stats */
        .stats-row {
          display:flex; gap:14px; flex-wrap:wrap; justify-content:center;
          animation:statsIn 0.55s ease 0.15s both; opacity:0;
        }
        @keyframes statsIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .stat-card {
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
          border-radius:10px; padding:12px 20px; text-align:center; min-width:88px;
          position:relative; overflow:hidden;
        }
        .stat-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,215,0,0.35),transparent);
          animation:scanCard 2.8s linear infinite;
        }
        @keyframes scanCard { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        /* XP */
        .xp-wrap { width:100%; max-width:370px; }
        .xp-labels {
          display:flex; justify-content:space-between;
          font-family:'Share Tech Mono',monospace; font-size:9px;
          color:rgba(255,215,0,0.38); letter-spacing:0.12em; margin-bottom:5px;
        }
        .xp-track { height:5px; background:rgba(255,255,255,0.05); border-radius:99px; overflow:hidden; }
        .xp-fill {
          height:100%; border-radius:99px;
          background:linear-gradient(90deg,#7a5200,#ffd700);
          box-shadow:0 0 10px rgba(255,215,0,0.5);
          animation:xpFill 1.3s ease 0.3s both;
        }
        @keyframes xpFill { from{width:0%} }

        /* Skip */
        .skip-btn {
          position:fixed; bottom:22px; right:22px; z-index:200;
          background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.3); font-family:'Share Tech Mono',monospace;
          font-size:10px; letter-spacing:0.15em; padding:8px 18px;
          cursor:pointer; border-radius:3px; transition:all 0.2s;
        }
        .skip-btn:hover { border-color:rgba(255,215,0,0.5); color:#ffd700; }

        /* Progress */
        .prog-bar { position:fixed; bottom:0; left:0; right:0; z-index:15; height:2px; background:rgba(255,255,255,0.05); }
        .prog-fill {
          height:100%;
          background:linear-gradient(90deg,#a855f7,#ffd700,#00e5ff,#ff4444);
          box-shadow:0 0 8px rgba(168,85,247,0.8);
          animation:progFill 10s linear both;
        }
        @keyframes progFill { from{width:0%} to{width:100%} }

        @keyframes playerFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ringRot { to{transform:rotate(360deg)} }

        ::-webkit-scrollbar { display:none; }
      `}</style>

      <DomainCanvas active={domainActive} onComplete={handleDomainComplete} />

      <div className={`h-root${exiting ? " exiting" : ""}`}>
        <StarField />
        <div className="h-grid" />
        <div className="h-scan" />

        {/* BOOT */}
        {phase === "boot" && (
          <div className="boot-box">
            {BOOT_LINES.slice(0, bootLine).map((l, i) => (
              <div key={i} className="boot-line"
                style={{ color:l.color, animationDelay:`${i*0.04}s` }}>
                {l.text}
              </div>
            ))}
            {bootLine < BOOT_LINES.length && <div className="boot-cursor" />}
          </div>
        )}

        {/* LOGO */}
        {phase === "logo" && (
          <div className="logo-wrap">
            {/* Cycling player with extra margin for label */}
            <div style={{ marginBottom:20 }}>
              <PlayerCycle active={true} />
            </div>

            {/* Title */}
            <div style={{ textAlign:"center" }}>
              <div className="logo-title">TALENT LEVEL UP</div>
              <div className="logo-sub">NEXUS OS · CAREER COMBAT PLATFORM</div>
            </div>

            {/* Level badge */}
            <div className="lvl-badge">
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13,
                fontWeight:900, color:"#ffd700", letterSpacing:"0.25em" }}>⬆ LEVEL</span>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:36,
                fontWeight:900, color:"#ffd700",
                textShadow:"0 0 30px rgba(255,215,0,0.9),0 0 60px rgba(255,215,0,0.4)" }}>
                <LevelCounter target={42} duration={900} />
              </span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9,
                color:"rgba(255,215,0,0.45)", letterSpacing:"0.15em" }}>UNLOCKED</span>
            </div>

            {/* XP */}
            {showStats && (
              <div className="xp-wrap">
                <div className="xp-labels"><span>XP PROGRESS</span><span>8,400 / 10,000</span></div>
                <div className="xp-track">
                  <div className="xp-fill" style={{ width:"84%" }} />
                </div>
              </div>
            )}

            {/* Stats */}
            {showStats && (
              <div className="stats-row">
                {[
                  { val:"1,248", lbl:"CANDIDATES", c:"#00e5ff" },
                  { val:"342",   lbl:"RECRUITERS", c:"#a855f7" },
                  { val:"98%",   lbl:"UPTIME",      c:"#4ade80" },
                ].map((s,i) => (
                  <div key={i} className="stat-card">
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20,
                      fontWeight:700, color:s.c, textShadow:`0 0 12px ${s.c}` }}>{s.val}</div>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8,
                      color:"rgba(255,255,255,0.28)", letterSpacing:"0.18em",
                      textTransform:"uppercase", marginTop:3 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase !== "boot" && (
          <div className="prog-bar"><div className="prog-fill" /></div>
        )}
        <button className="skip-btn" onClick={skip}>SKIP ▶▶</button>
      </div>
    </>
  );
}