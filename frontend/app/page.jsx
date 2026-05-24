"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════
   TIME-BASED SLOGANS  (20 + entries, 6 time buckets)
═══════════════════════════════════════════════════════════════ */
const SLOGANS = {
  night: [
    { text: "The gates crack open at <em>midnight</em>. Will you answer when they call?", tag: "01:00 — 04:59 · DEAD HOURS" },
    { text: "In the <em>darkest abyss</em>, the chosen hunter carves their own light.", tag: "01:00 — 04:59 · SHADOW HOUR" },
    { text: "The shadows <em>whisper your name</em>. Do not make them wait.", tag: "01:00 — 04:59 · ARISE HOUR" },
    { text: "While the world sleeps, <em>hunters grind</em>. Rank won't climb itself.", tag: "01:00 — 04:59 · GRIND HOUR" },
  ],
  earlyMorn: [
    { text: "Before dawn, the <em>strongest arise</em>. Today you level up.", tag: "05:00 — 07:59 · PRE-DAWN" },
    { text: "First light. The gate <em>tears open</em>. Step through — rank awaits.", tag: "05:00 — 07:59 · GATE OPEN" },
    { text: "Dawn is when <em>S-rank legends</em> are forged. You are not ordinary.", tag: "05:00 — 07:59 · EARLY RISE" },
    { text: "Every titan started <em>exactly here</em>. Rise. Arise. Conquer.", tag: "05:00 — 07:59 · AWAKENING" },
  ],
  morning: [
    { text: "The system <em>chose you</em>. Do not dishonour the morning.", tag: "08:00 — 11:59 · MORNING HUNT" },
    { text: "Morning gates overflow with <em>opportunity</em>. Claim your rank first.", tag: "08:00 — 11:59 · HUNT BEGINS" },
    { text: "Every new day is a <em>new dungeon</em>. Clear it. Leave nothing standing.", tag: "08:00 — 11:59 · NEW QUEST" },
    { text: "The weak scroll feeds. The <em>strong check rank</em>. Choose your path.", tag: "08:00 — 11:59 · SYSTEM CHECK" },
    { text: "<em>Your stats don't lie.</em> This morning — become what they feared.", tag: "08:00 — 11:59 · STATUS WINDOW" },
  ],
  afternoon: [
    { text: "Midday heat breaks the weak. <em>Hunters adapt</em> and push forward.", tag: "12:00 — 16:59 · MIDDAY RAID" },
    { text: "Half the day gone. <em>How many levels</em> did you climb since dawn?", tag: "12:00 — 16:59 · PROGRESS CHECK" },
    { text: "The boss waits for <em>no lunch break</em>. Neither should your ambition.", tag: "12:00 — 16:59 · RAID TIME" },
    { text: "Afternoon slumps are for <em>E-ranks</em>. You were built for more.", tag: "12:00 — 16:59 · POWER SURGE" },
    { text: "The dungeon has <em>no clock</em>. Neither do champions. Keep moving.", tag: "12:00 — 16:59 · RELENTLESS" },
  ],
  evening: [
    { text: "Darkness rises. So does <em>your power</em>. Evening belongs to shadows.", tag: "17:00 — 20:59 · TWILIGHT HUNT" },
    { text: "The day's battles are tallied. <em>Did you earn</em> your rank today?", tag: "17:00 — 20:59 · RECKONING" },
    { text: "Most hunters rest at dusk. You <em>gear up</em>. That gap is your throne.", tag: "17:00 — 20:59 · DUSK PROTOCOL" },
    { text: "Evening gates are the <em>most deadly</em>. Only the prepared return.", tag: "17:00 — 20:59 · DANGER ZONE" },
  ],
  lateNight: [
    { text: "The world quiets. The <em>system never does</em>. Your next quest waits.", tag: "21:00 — 00:59 · LATE SHIFT" },
    { text: "Night raids separate <em>true hunters</em> from those who only dream.", tag: "21:00 — 00:59 · NIGHT RAID" },
    { text: "Under these stars, <em>shadows gather</em>. Command them or be consumed.", tag: "21:00 — 00:59 · SHADOW DOMAIN" },
    { text: "Midnight seals the gate. <em>Make your move</em> before it closes forever.", tag: "21:00 — 00:59 · FINAL WINDOW" },
  ],
};

function getTimeSlot() {
  const h = new Date().getHours();
  if (h >= 1 && h < 5) return "night";
  if (h >= 5 && h < 8) return "earlyMorn";
  if (h >= 8 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "lateNight";
}
function pickSlogan() {
  const list = SLOGANS[getTimeSlot()];
  return list[Math.floor(Math.random() * list.length)];
}

/* ═══════════════════════════════════════════════════════════════
   BOOT LINES
═══════════════════════════════════════════════════════════════ */
const BOOT_LINES = [
  { t: "> SYSTEM INITIALIZING...",              c: "rgba(220,30,30,0.8)"  },
  { t: "> SCANNING HUNTER REGISTRY...",         c: "rgba(200,30,30,0.7)"  },
  { t: "> GATE ANOMALY: CLASS UNKNOWN ██████",  c: "rgba(255,60,20,0.95)" },
  { t: "> SHADOW ARMY: ON STANDBY",             c: "rgba(180,20,20,0.7)"  },
  { t: "> BLOOD CONTRACT: SEALED",              c: "rgba(220,30,30,0.85)" },
  { t: "> ARISE PROTOCOL: ARMED",               c: "rgba(255,80,0,1)"     },
  { t: "> ████████████ 100% — WELCOME, HUNTER.",c: "rgba(255,200,0,1)"    },
];

/* ═══════════════════════════════════════════════════════════════
   ANIMATED SHADOW EYE  (canvas-drawn, interactive)
═══════════════════════════════════════════════════════════════ */
function ShadowEye({ onWake }) {
  const ref = useRef(null);
  const stateRef = useRef({ open: 0, target: 0, blink: 0, awake: false, mx: 0, my: 0 });

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const S = stateRef.current;
    let raf;

    const handleMove = (e) => {
      const r = cvs.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX || e.touches?.[0]?.clientX || cx) - cx;
      const dy = (e.clientY || e.touches?.[0]?.clientY || cy) - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        S.target = Math.min(1, S.target + 0.04);
        if (!S.awake && S.open > 0.7) { S.awake = true; onWake?.(); }
        S.mx = dx / 200; S.my = dy / 200;
      } else {
        S.target = Math.max(0, S.target - 0.01);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

    // Auto-blink every 4–7s when closed
    const schedBlink = () => {
      const d = 4000 + Math.random() * 3000;
      setTimeout(() => { S.blink = 1; schedBlink(); }, d);
    };
    schedBlink();

    // Slow auto-open over 3s
    setTimeout(() => { S.target = 0.35; }, 1200);

    const W = 220, H = 110;
    cvs.width = W; cvs.height = H;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (S.blink > 0 && !S.awake) {
        S.blink = Math.max(0, S.blink - 0.05);
        S.open = Math.max(0, S.open - 0.08);
      } else {
        S.open += (S.target - S.open) * 0.04;
      }

      const cx = W / 2, cy = H / 2;
      const ew = 90, eh = 28 * S.open;

      // Outer glow aura
      if (S.open > 0.05) {
        const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        aura.addColorStop(0, `rgba(180,0,0,${S.open * 0.18})`);
        aura.addColorStop(0.4, `rgba(120,0,0,${S.open * 0.09})`);
        aura.addColorStop(1, "transparent");
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, W, H);
      }

      // Shadow lid — top
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - ew, cy);
      ctx.bezierCurveTo(cx - ew * 0.5, cy - eh * 2.2, cx + ew * 0.5, cy - eh * 2.2, cx + ew, cy);
      ctx.bezierCurveTo(cx + ew * 0.5, cy - eh * 0.3, cx - ew * 0.5, cy - eh * 0.3, cx - ew, cy);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.98)";
      ctx.fill();

      // Shadow lid — bottom
      ctx.beginPath();
      ctx.moveTo(cx - ew, cy);
      ctx.bezierCurveTo(cx - ew * 0.5, cy + eh * 1.8, cx + ew * 0.5, cy + eh * 1.8, cx + ew, cy);
      ctx.bezierCurveTo(cx + ew * 0.5, cy + eh * 0.3, cx - ew * 0.5, cy + eh * 0.3, cx - ew, cy);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.98)";
      ctx.fill();
      ctx.restore();

      if (S.open > 0.08) {
        // Eye whites (dark red)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ew * 0.85, eh * 0.88, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15,0,0,${Math.min(1, S.open * 1.5)})`;
        ctx.fill();
        ctx.restore();

        // Iris
        const ir = eh * 0.72;
        const px = cx + S.mx * 6, py = cy + S.my * 4;
        const irisg = ctx.createRadialGradient(px, py, 0, px, py, ir);
        irisg.addColorStop(0, `rgba(255,40,0,${S.open})`);
        irisg.addColorStop(0.35, `rgba(200,0,0,${S.open * 0.9})`);
        irisg.addColorStop(0.7, `rgba(100,0,0,${S.open * 0.7})`);
        irisg.addColorStop(1, `rgba(30,0,0,${S.open * 0.4})`);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ew * 0.85, eh * 0.88, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.ellipse(px, py, ir, ir, 0, 0, Math.PI * 2);
        ctx.fillStyle = irisg;
        ctx.fill();

        // Pupil
        const pupilg = ctx.createRadialGradient(px, py, 0, px, py, ir * 0.42);
        pupilg.addColorStop(0, "rgba(0,0,0,1)");
        pupilg.addColorStop(0.6, "rgba(5,0,0,0.95)");
        pupilg.addColorStop(1, "rgba(80,0,0,0.4)");
        ctx.beginPath();
        ctx.ellipse(px, py, ir * 0.42, ir * 0.42, 0, 0, Math.PI * 2);
        ctx.fillStyle = pupilg;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.ellipse(px - ir * 0.18, py - ir * 0.22, ir * 0.09, ir * 0.07, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,180,${S.open * 0.55})`;
        ctx.fill();
        ctx.restore();

        // Eyelid edge glow
        const edgeg = ctx.createLinearGradient(cx - ew, cy, cx + ew, cy);
        edgeg.addColorStop(0, "transparent");
        edgeg.addColorStop(0.3, `rgba(220,0,0,${S.open * 0.7})`);
        edgeg.addColorStop(0.7, `rgba(220,0,0,${S.open * 0.7})`);
        edgeg.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.moveTo(cx - ew, cy);
        ctx.bezierCurveTo(cx - ew * 0.5, cy - eh * 2.2, cx + ew * 0.5, cy - eh * 2.2, cx + ew, cy);
        ctx.strokeStyle = edgeg;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Lash spikes top
        for (let i = 0; i < 9; i++) {
          const t2 = i / 8;
          const lx = cx - ew * 0.8 + t2 * ew * 1.6;
          const baseY = cy - Math.sqrt(Math.max(0, 1 - ((lx - cx) / ew) ** 2)) * eh * 2;
          const len = (4 + Math.sin(t2 * Math.PI) * 8) * S.open;
          ctx.beginPath();
          ctx.moveTo(lx, baseY);
          ctx.lineTo(lx + (t2 - 0.5) * 3, baseY - len);
          ctx.strokeStyle = `rgba(180,0,0,${S.open * 0.7})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Eye outline
      ctx.beginPath();
      ctx.moveTo(cx - ew, cy);
      ctx.bezierCurveTo(cx - ew * 0.5, cy - eh * 2.2, cx + ew * 0.5, cy - eh * 2.2, cx + ew, cy);
      ctx.bezierCurveTo(cx + ew * 0.5, cy + eh * 1.8, cx - ew * 0.5, cy + eh * 1.8, cx - ew, cy);
      ctx.strokeStyle = `rgba(180,0,0,${0.15 + S.open * 0.4})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Dark crack lines radiating from eye
      if (S.open > 0.3) {
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const len2 = (20 + Math.random() * 15) * S.open;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * ew * 0.9, cy + Math.sin(ang) * eh * 0.9);
          ctx.lineTo(cx + Math.cos(ang) * (ew * 0.9 + len2), cy + Math.sin(ang) * (eh * 0.9 + len2));
          ctx.strokeStyle = `rgba(120,0,0,${S.open * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [onWake]);

  return (
    <canvas
      ref={ref}
      style={{ width: 220, height: 110, cursor: "none", display: "block" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND CANVAS — particles, blood wisps, grid
═══════════════════════════════════════════════════════════════ */
function BgCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let W, H, raf;
    const resize = () => { cvs.width = W = window.innerWidth; cvs.height = H = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Gold particles
    const GOLD = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.8 + 0.2),
      r: Math.random() * 2 + 0.4,
      o: Math.random() * 0.5 + 0.1,
      gold: Math.random() > 0.4,
      life: Math.random() * 280 + 120, age: Math.random() * 200,
    }));

    // Blood wisps
    const BLOOD = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.05),
      r: Math.random() * 3 + 0.8,
      o: Math.random() * 0.35 + 0.05,
      phase: Math.random() * Math.PI * 2,
      life: Math.random() * 220 + 80, age: Math.random() * 150,
    }));

    // Static blood drops (floor)
    const DROPS = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.3,
      o: Math.random() * 0.1 + 0.02,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // deep void bg
      ctx.fillStyle = "#040000";
      ctx.fillRect(0, 0, W, H);
      const rg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
      rg.addColorStop(0, "rgba(20,0,0,0)");
      rg.addColorStop(1, "rgba(0,0,0,0.94)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(180,0,0,0.04)"; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      // accent cross
      ctx.strokeStyle = "rgba(180,0,0,0.1)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();

      // drops
      DROPS.forEach(d => {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(160,0,0,${d.o})`; ctx.fill();
      });

      // gold particles
      GOLD.forEach(p => {
        p.x += p.vx + Math.sin(t * 0.012 + p.phase || 0) * 0.2;
        p.y += p.vy; p.age++;
        if (p.age > p.life) { p.age = 0; p.x = Math.random()*W; p.y = H + 5; }
        const lf = p.age / p.life;
        const a = p.o * (lf < 0.12 ? lf/0.12 : lf > 0.82 ? (1-lf)/0.18 : 1);
        if (p.gold) {
          const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.2);
          g.addColorStop(0, `rgba(255,200,40,${a})`);
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = p.gold ? `rgba(255,210,60,${a})` : `rgba(255,80,0,${a*0.6})`; ctx.fill();
      });

      // blood wisps
      BLOOD.forEach(w => {
        w.x += w.vx + Math.sin(t*0.018 + w.phase)*0.25;
        w.y += w.vy; w.age++; w.phase += 0.03;
        if (w.age > w.life) { w.age=0; w.x=Math.random()*W; w.y=H+5; }
        const lf = w.age/w.life;
        const a = w.o*(lf<0.1?lf/0.1:lf>0.8?(1-lf)/0.2:1);
        const g = ctx.createRadialGradient(w.x,w.y,0,w.x,w.y,w.r*2.5);
        g.addColorStop(0, `rgba(200,0,0,${a})`);
        g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(w.x,w.y,w.r*2.5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      });

      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0 }} />;
}

/* ═══════════════════════════════════════════════════════════════
   FX CANVAS — rings, blood blinks, gold sparks
═══════════════════════════════════════════════════════════════ */
function FxCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let W, H, raf;
    const resize = () => { cvs.width = W = window.innerWidth; cvs.height = H = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    let rings = [], sparks = [], bloodBlinks = [];

    const spawnRing = () => {
      rings.push({ r:0, maxR: Math.random()*160+80, cx: W/2+(Math.random()-0.5)*160, cy: H/2+(Math.random()-0.5)*100, speed: Math.random()*2+1.2, isGold: Math.random()>0.6 });
      setTimeout(spawnRing, Math.random()*3000+1500);
    };
    spawnRing();

    const spawnSpark = () => {
      const n = Math.floor(Math.random()*8+4);
      const ox=W/2+(Math.random()-0.5)*250, oy=H/2+(Math.random()-0.5)*150;
      for (let i=0;i<n;i++){
        const ang=Math.random()*Math.PI*2, spd=Math.random()*4+1;
        sparks.push({x:ox,y:oy,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:70,age:0,isGold:Math.random()>0.5});
      }
      setTimeout(spawnSpark, Math.random()*2000+1000);
    };
    spawnSpark();

    // Blood blink flashes
    const spawnBlink = () => {
      bloodBlinks.push({ alpha: 0.18+Math.random()*0.12, age:0, life:25 });
      setTimeout(spawnBlink, Math.random()*6000+3000);
    };
    setTimeout(spawnBlink, 2000);

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      // blood screen blink
      bloodBlinks = bloodBlinks.filter(b => {
        b.age++;
        const p = b.age/b.life;
        const a = b.alpha * (p<0.35? p/0.35 : (1-p)/0.65);
        if (a>0) { ctx.fillStyle=`rgba(140,0,0,${a})`; ctx.fillRect(0,0,W,H); }
        return b.age < b.life;
      });
      rings = rings.filter(r => {
        r.r += r.speed;
        const a = (1 - r.r/r.maxR) * 0.35;
        if (a<=0) return false;
        ctx.beginPath(); ctx.arc(r.cx,r.cy,r.r,0,Math.PI*2);
        ctx.strokeStyle = r.isGold ? `rgba(255,200,40,${a})` : `rgba(200,0,0,${a})`;
        ctx.lineWidth = 1; ctx.stroke();
        return true;
      });
      sparks = sparks.filter(s => {
        s.x+=s.vx; s.y+=s.vy; s.vx*=0.95; s.vy*=0.95; s.age++;
        if (s.age>s.life) return false;
        const a = (1-s.age/s.life)*0.8;
        ctx.beginPath(); ctx.arc(s.x,s.y,1.4,0,Math.PI*2);
        ctx.fillStyle = s.isGold ? `rgba(255,210,60,${a})` : `rgba(220,30,0,${a})`; ctx.fill();
        return true;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:5, pointerEvents:"none" }} />;
}

/* ═══════════════════════════════════════════════════════════════
   COUNT-UP ANIMATION
═══════════════════════════════════════════════════════════════ */
function useCountUp(target, dur=1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts-start)/dur, 1);
      const e = 1-Math.pow(1-p,3);
      setVal(Math.floor(e*target));
      if (p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, dur]);
  return val;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState("boot"); // boot | main | exit
  const [bootIdx, setBootIdx] = useState(0);
  const [slogan] = useState(() => pickSlogan());
  const [eyeWoke, setEyeWoke] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const hunters = useCountUp(phase==="main" ? 2847 : 0, 1400);
  const gates   = useCountUp(phase==="main" ? 412 : 0, 1600);

  // Boot sequence
  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(v=>v+1), bootIdx===0?300:230);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setPhase("main"); setTimeout(()=>setShowStats(true),500); }, 400);
    return () => clearTimeout(t);
  }, [bootIdx, phase]);

  // Auto-redirect after boot + display
const goLogin = useCallback(() => {
  if (phase === "exit") return;

  setPhase("exit");

  setTimeout(() => {
    router.push("/login");
  }, 800);
}, [phase, router]);

useEffect(() => {
  if (phase !== "main") return;

  const t = setTimeout(() => {
    goLogin();
  }, 9000);

  return () => clearTimeout(t);
}, [phase, goLogin]);

  const handleEyeWake = useCallback(() => setEyeWoke(true), []);

  const styles = getStyles();

  return (
    <>
      <style>{CSS}</style>
      <div style={styles.root} className={phase==="exit" ? "sl-exit" : ""}>
        <BgCanvas />
        <FxCanvas />

        {/* Overlays */}
        <div style={styles.scanlines} />
        <div style={styles.vignette} />

        {/* HUD corners */}
        {["tl","tr","bl","br"].map(p2=>(
          <div key={p2} style={styles[`hud${p2.toUpperCase()}`]} />
        ))}

        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.topDot} /><div style={styles.topDot} /><div style={styles.topDot} />
          <span style={styles.topLabel}>NEXUS SYSTEM · ONLINE</span>
          <div style={styles.topDot} /><div style={styles.topDot} /><div style={styles.topDot} />
        </div>

        {/* Rank badge */}
        <div style={styles.rankBadge}>
          <span style={styles.rankLetter}>S</span>
          <span style={styles.rankLabel}>RANK HUNTER</span>
        </div>

        {/* ── BOOT ── */}
        {phase === "boot" && (
          <div style={styles.bootBox}>
            {BOOT_LINES.slice(0, bootIdx).map((l,i)=>(
              <div key={i} style={{...styles.bootLine, color:l.c, animationDelay:`${i*0.04}s`}}>{l.t}</div>
            ))}
            {bootIdx < BOOT_LINES.length && <span style={styles.cursor} />}
          </div>
        )}

        {/* ── MAIN ── */}
        {phase === "main" && (
          <div style={styles.mainWrap} className="sl-rise">

            {/* Shadow eye */}
            <div style={styles.eyeWrap}>
              <div style={styles.eyeGlowRing} />
              <ShadowEye onWake={handleEyeWake} />
              {eyeWoke && (
                <div style={styles.eyeWakeText} className="sl-fadein">
                  ◆ IT SEES YOU ◆
                </div>
              )}
              <div style={styles.eyeHint}>[ MOVE CURSOR TO AWAKEN ]</div>
            </div>

            {/* Title */}
            <div style={styles.titleWrap}>
              <div style={styles.titleSmall}>GO TO ATTACK</div>
              <div style={styles.titleMain}>
                <span style={styles.t1}>TALENT</span>
                <span style={styles.t2}> LEVEL UP</span>
              </div>
              <div style={styles.titleSub}>WAKE UP · AWAKEN · TIME FOR YOU</div>
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.divLine} />
              <span style={styles.divGem}>◆</span>
              <div style={styles.divLine} />
            </div>

            {/* Slogan */}
            <div style={styles.sloganBox}>
              <div style={styles.sloganTag}>{slogan.tag}</div>
              <div
                style={styles.sloganText}
                dangerouslySetInnerHTML={{ __html: slogan.text }}
              />
            </div>

            {/* Stats */}
            {showStats && (
              <div style={styles.statsRow} className="sl-statsin">
                {[
                  {val: hunters.toLocaleString(), lbl:"PLAYERS ACTIVE", c:"#e83030"},
                  {val: gates.toLocaleString(),   lbl:"BOUNTIES CLEARED",  c:"#ffd700"},
                  {val: "S",                       lbl:"PEAK RANK",      c:"#e83030"},
                ].map((s,i)=>(
                  <div key={i} style={styles.statCard}>
                    <div style={{...styles.statVal, color:s.c, textShadow:`0 0 16px ${s.c}88`}}>{s.val}</div>
                    <div style={styles.statLbl}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {/* XP */}
            {showStats && (
              <div style={styles.xpWrap}>
                <div style={styles.xpTop}><span>EXPERIENCE</span><span>84,200 / 100,000</span></div>
                <div style={styles.xpTrack}>
                  <div style={styles.xpFill} className="sl-xp" />
                </div>
              </div>
            )}

            {/* Enter button */}
            <button style={styles.enterBtn} className="sl-enterbtn" onClick={goLogin}>
              <span style={styles.btnCorner} data-pos="tl" />
              <span style={styles.btnCorner} data-pos="tr" />
              <span style={styles.btnCorner} data-pos="bl" />
              <span style={styles.btnCorner} data-pos="br" />
              ENTER SYSTEM
            </button>

            <div style={styles.autoHint}>AUTO-ENTERING IN 9 SECONDS · OR CLICK ABOVE</div>
          </div>
        )}

        {/* Bottom bar */}
        {phase !== "boot" && (
          <div style={styles.bottomBar}>
            ◆ SHADOW ENERGY STABLE · BLOOD CONTRACT ACTIVE · GATE STATUS: SEALED ◆
          </div>
        )}

        {/* Progress line */}
        {phase === "main" && <div style={styles.progressLine} className="sl-progress" />}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const getStyles = () => ({
  root:{
    width:"100%", height:"100vh", position:"relative", overflow:"hidden",
    background:"#040000", fontFamily:"'Rajdhani',sans-serif",
    transition:"opacity 0.8s ease, transform 0.8s ease",
  },
  scanlines:{
    position:"fixed", inset:0, zIndex:8, pointerEvents:"none",
    background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.045) 2px,rgba(0,0,0,0.045) 4px)",
  },
  vignette:{
    position:"fixed", inset:0, zIndex:9, pointerEvents:"none",
    background:"radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.92) 100%)",
  },

  hudTL:{position:"absolute",top:18,left:18,width:55,height:55,borderTop:"1.5px solid rgba(200,0,0,0.6)",borderLeft:"1.5px solid rgba(200,0,0,0.6)",zIndex:20},
  hudTR:{position:"absolute",top:18,right:18,width:55,height:55,borderTop:"1.5px solid rgba(200,0,0,0.6)",borderRight:"1.5px solid rgba(200,0,0,0.6)",zIndex:20},
  hudBL:{position:"absolute",bottom:18,left:18,width:55,height:55,borderBottom:"1.5px solid rgba(200,0,0,0.6)",borderLeft:"1.5px solid rgba(200,0,0,0.6)",zIndex:20},
  hudBR:{position:"absolute",bottom:18,right:18,width:55,height:55,borderBottom:"1.5px solid rgba(200,0,0,0.6)",borderRight:"1.5px solid rgba(200,0,0,0.6)",zIndex:20},

  topBar:{
    position:"absolute",top:22,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"center",gap:10,
    zIndex:20, animation:"slFadeIn 0.6s 0.3s both",
  },
  topDot:{width:5,height:5,borderRadius:"50%",background:"rgba(220,30,30,0.8)",animation:"slPulse 1.4s ease-in-out infinite"},
  topLabel:{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"rgba(200,50,50,0.55)",letterSpacing:"0.32em",textTransform:"uppercase"},

  rankBadge:{
    position:"absolute",top:52,right:28,textAlign:"right",zIndex:20,
    animation:"slFadeIn 0.5s 0.8s both",
  },
  rankLetter:{fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:"#e83030",display:"block",lineHeight:1,textShadow:"0 0 22px rgba(220,0,0,0.8)"},
  rankLabel:{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"rgba(200,50,50,0.45)",letterSpacing:"0.2em"},

  bootBox:{
    position:"absolute",inset:0,zIndex:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    gap:0, padding:"0 30px",
  },
  bootLine:{fontFamily:"'Share Tech Mono',monospace",fontSize:13,lineHeight:2.1,letterSpacing:"0.08em",animation:"slFadeIn 0.22s ease forwards",opacity:0},
  cursor:{display:"inline-block",width:9,height:14,background:"#e83030",verticalAlign:"middle",marginLeft:5,animation:"slBlink 0.7s step-end infinite",boxShadow:"0 0 7px #e83030"},

  mainWrap:{
    position:"absolute",inset:0,zIndex:15,display:"flex",flexDirection:"column",
    alignItems:"center",justifyContent:"center",gap:0,
  },

  eyeWrap:{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",marginBottom:8},
  eyeGlowRing:{
    position:"absolute",inset:-30,borderRadius:"50%",
    background:"radial-gradient(circle, rgba(180,0,0,0.12) 0%, transparent 70%)",
    animation:"slPulse 2.5s ease-in-out infinite",
    pointerEvents:"none",zIndex:-1,
  },
  eyeWakeText:{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"rgba(220,30,30,0.7)",letterSpacing:"0.4em",marginTop:4,animation:"slFadeIn 0.5s ease forwards"},
  eyeHint:{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"rgba(180,30,30,0.3)",letterSpacing:"0.3em",marginTop:6},

  titleWrap:{textAlign:"center",marginBottom:6},
  titleSmall:{fontFamily:"'Cinzel',serif",fontSize:"clamp(10px,1.4vw,16px)",fontWeight:400,color:"rgba(200,50,50,0.45)",letterSpacing:"0.55em",textTransform:"uppercase",display:"block",marginBottom:8},
  titleMain:{fontFamily:"'Cinzel',serif",fontSize:"clamp(28px,5vw,66px)",fontWeight:900,display:"block",lineHeight:0.92,letterSpacing:"0.04em"},
  t1:{color:"#fff",textShadow:"0 0 50px rgba(200,0,0,0.25)"},
  t2:{color:"#e83030",textShadow:"0 0 35px rgba(220,0,0,0.85), 0 0 70px rgba(220,0,0,0.4)"},
  titleSub:{fontFamily:"'Share Tech Mono',monospace",fontSize:"clamp(7px,1vw,12px)",color:"rgba(255,255,255,0.12)",letterSpacing:"0.5em",display:"block",marginTop:10},

  divider:{display:"flex",alignItems:"center",gap:14,width:340,margin:"18px 0"},
  divLine:{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(200,0,0,0.7),transparent)"},
  divGem:{color:"#e83030",fontSize:8,textShadow:"0 0 10px #e83030"},

  sloganBox:{textAlign:"center",maxWidth:480,minHeight:68,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6},
  sloganTag:{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"rgba(200,50,50,0.45)",letterSpacing:"0.35em",textTransform:"uppercase"},
  sloganText:{fontFamily:"'Rajdhani',sans-serif",fontSize:"clamp(14px,1.9vw,19px)",fontWeight:600,color:"rgba(255,255,255,0.82)",letterSpacing:"0.07em",lineHeight:1.35},

  statsRow:{display:"flex",gap:18,marginTop:18,flexWrap:"wrap",justifyContent:"center"},
  statCard:{textAlign:"center",padding:"10px 22px",border:"1px solid rgba(180,0,0,0.15)",background:"rgba(180,0,0,0.04)",position:"relative"},
  statVal:{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:700,display:"block"},
  statLbl:{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"rgba(255,255,255,0.22)",letterSpacing:"0.25em",textTransform:"uppercase",display:"block",marginTop:2},

  xpWrap:{width:360,marginTop:16},
  xpTop:{display:"flex",justifyContent:"space-between",fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"rgba(200,50,50,0.4)",letterSpacing:"0.15em",marginBottom:5},
  xpTrack:{height:3,background:"rgba(255,255,255,0.05)",position:"relative",overflow:"hidden"},
  xpFill:{height:"100%",width:"0%",background:"linear-gradient(90deg,rgba(180,0,0,0.5),#e83030,rgba(255,180,0,0.8))",boxShadow:"0 0 10px rgba(220,0,0,0.7)"},

  enterBtn:{
    marginTop:28,padding:"14px 56px",border:"1px solid rgba(200,0,0,0.55)",
    background:"rgba(180,0,0,0.07)",fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:600,
    color:"#fff",letterSpacing:"0.28em",textTransform:"uppercase",cursor:"pointer",
    position:"relative",transition:"all 0.25s",
  },
  btnCorner:{position:"absolute",width:8,height:8},
  autoHint:{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"rgba(180,30,30,0.3)",letterSpacing:"0.25em",marginTop:14},

  bottomBar:{
    position:"absolute",bottom:16,left:0,right:0,textAlign:"center",zIndex:20,
    fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"rgba(180,30,30,0.22)",letterSpacing:"0.35em",
  },
  progressLine:{position:"absolute",bottom:0,left:0,height:2,background:"linear-gradient(90deg,#800,#e83030,#ffd700,#e83030,#800)"},
});

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;height:100%}

.sl-exit{opacity:0!important;transform:scale(1.08)!important}

.sl-rise{animation:slRise 1s 0.1s cubic-bezier(0.16,1,0.3,1) both}
.sl-fadein{animation:slFadeIn 0.6s ease forwards}
.sl-statsin{animation:slRise 0.6s 0.1s ease both}
.sl-xp{animation:slXP 1.5s 0.4s cubic-bezier(0.16,1,0.3,1) both!important;width:84%!important}
.sl-progress{animation:slProgress 9s linear both}

.sl-enterbtn:hover{
  border-color:rgba(220,0,0,0.9)!important;
  background:rgba(180,0,0,0.15)!important;
  color:#e83030!important;
  text-shadow:0 0 16px rgba(220,0,0,0.9)!important;
  box-shadow:0 0 35px rgba(200,0,0,0.25),inset 0 0 20px rgba(180,0,0,0.06)!important;
}
.sl-enterbtn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,transparent 30%,rgba(220,0,0,0.07) 50%,transparent 70%);
  transform:translateX(-100%);transition:transform 0.4s;
}
.sl-enterbtn:hover::before{transform:translateX(100%)}

/* btn corners */
.sl-enterbtn [data-pos=tl]{top:-1px;left:-1px;border-top:2px solid #e83030;border-left:2px solid #e83030}
.sl-enterbtn [data-pos=tr]{top:-1px;right:-1px;border-top:2px solid #e83030;border-right:2px solid #e83030}
.sl-enterbtn [data-pos=bl]{bottom:-1px;left:-1px;border-bottom:2px solid #e83030;border-left:2px solid #e83030}
.sl-enterbtn [data-pos=br]{bottom:-1px;right:-1px;border-bottom:2px solid #e83030;border-right:2px solid #e83030}
.sl-enterbtn span{position:absolute;width:8px;height:8px}

/* slogan em */
.slogan-text em,.sl-rise em{font-style:normal;color:#e83030}

@keyframes slFadeIn{from{opacity:0}to{opacity:1}}
@keyframes slRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes slBlink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes slPulse{0%,100%{opacity:0.55}50%{opacity:1}}
@keyframes slXP{from{width:0%}to{width:84%}}
@keyframes slProgress{from{width:0%}to{width:100%}}
`;