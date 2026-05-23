"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../lib/api";
import { useRouter } from "next/navigation";

/* ══ MATRIX RAIN CANVAS ════════════════════════════════════════ */
function MatrixRain() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const cols = Math.floor(window.innerWidth / 18);
    const drops = Array(cols).fill(1);
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ∑∆∇⊕⊗∞≠±√∫SYSTEMROOT";
    let id;
    const draw = () => {
      ctx.fillStyle = "rgba(8,0,0,0.06)";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 18;
        const y = drops[i] * 18;
        // Head glow
        if (Math.random() > 0.9) {
          ctx.fillStyle = "#ff6666";
          ctx.shadowBlur = 8; ctx.shadowColor = "#ff0000";
        } else {
          const fade = Math.random();
          ctx.fillStyle = fade > 0.85
            ? `rgba(255,80,80,${0.8 + Math.random() * 0.2})`
            : `rgba(180,0,0,${0.2 + Math.random() * 0.4})`;
          ctx.shadowBlur = 0;
        }
        ctx.font = `${12 + Math.random() * 4}px 'Share Tech Mono', monospace`;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
        if (y > cvs.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }} />;
}

/* ══ ROBOTIC HEX SCANNER ═══════════════════════════════════════ */
function HexScanner() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    let t = 0; let id;
    const draw = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const cx = cvs.width / 2, cy = cvs.height / 2;

      // Rotating outer rings
      for (let ring = 0; ring < 3; ring++) {
        const r = 280 + ring * 90;
        const rot = t * (ring % 2 === 0 ? 0.003 : -0.002) + ring;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = `rgba(200,0,0,${0.06 - ring * 0.015})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 20 + ring * 10]);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Scanning line
      const scanAngle = (t * 0.015) % (Math.PI * 2);
      const gradient = ctx.createConicalGradient
        ? null
        : ctx.createLinearGradient(cx, cy, cx + Math.cos(scanAngle) * 400, cy + Math.sin(scanAngle) * 400);
      ctx.save(); ctx.translate(cx, cy);
      ctx.strokeStyle = `rgba(255,30,30,${0.25 + 0.1 * Math.sin(t * 0.05)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 12; ctx.shadowColor = "#ff0000";
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(scanAngle) * 260, Math.sin(scanAngle) * 260);
      ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

      // Corner HUD brackets
      const corners = [[0,0,1,1],[cvs.width,0,-1,1],[0,cvs.height,1,-1],[cvs.width,cvs.height,-1,-1]];
      corners.forEach(([x,y,dx,dy]) => {
        ctx.strokeStyle = `rgba(220,0,0,${0.35 + 0.15 * Math.sin(t*0.03)})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6; ctx.shadowColor = "#ff0000";
        ctx.beginPath(); ctx.moveTo(x + dx*30, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy*30);
        ctx.stroke(); ctx.shadowBlur = 0;
      });

      // Cross-hair center
      ctx.strokeStyle = `rgba(255,0,0,${0.12 + 0.05 * Math.sin(t*0.04)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + 200, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200); ctx.stroke();

      // Side data bars (HUD style)
      for (let b = 0; b < 8; b++) {
        const bx = 24, by = 120 + b * 44;
        const bw = 60 + Math.sin(t * 0.04 + b) * 30;
        ctx.fillStyle = `rgba(180,0,0,0.15)`;
        ctx.fillRect(bx, by, 100, 8);
        ctx.fillStyle = `rgba(255,${30+b*10},${30+b*10},${0.5+0.2*Math.sin(t*0.03+b)})`;
        ctx.fillRect(bx, by, bw, 8);
      }
      // Right side bars
      for (let b = 0; b < 8; b++) {
        const bx = cvs.width - 124, by = 120 + b * 44;
        const bw = 60 + Math.sin(t * 0.035 + b + 3) * 30;
        ctx.fillStyle = `rgba(180,0,0,0.12)`;
        ctx.fillRect(bx, by, 100, 8);
        ctx.fillStyle = `rgba(255,${20+b*8},${20+b*8},${0.4+0.2*Math.sin(t*0.03+b)})`;
        ctx.fillRect(bx + 100 - bw, by, bw, 8);
      }
      t++; id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none" }} />;
}

/* ══ ROBOTIC TEXT GLITCH ═══════════════════════════════════════ */
function GlitchText({ text }) {
  const [glitched, setGlitched] = useState(text);
  const chars = "!@#$%∑∆⊕⊗∞≠01アイウエ";
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const idx = Math.floor(Math.random() * text.length);
        const arr = text.split("");
        arr[idx] = chars[Math.floor(Math.random() * chars.length)];
        setGlitched(arr.join(""));
        setTimeout(() => setGlitched(text), 80);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{glitched}</span>;
}

/* ══ OTP INPUT ═════════════════════════════════════════════════ */
function OtpInput({ value, onChange }) {
  const r0=useRef(null),r1=useRef(null),r2=useRef(null);
  const r3=useRef(null),r4=useRef(null),r5=useRef(null);
  const refs=[r0,r1,r2,r3,r4,r5];
  const digits=value.split("").concat(Array(6).fill("")).slice(0,6);
  const handleKey=(i,e)=>{
    if(e.key==="Backspace"){
      const n=digits.slice();n[i]="";onChange(n.join(""));
      if(i>0) refs[i-1].current?.focus();
    } else if(/^[0-9]$/.test(e.key)){
      const n=digits.slice();n[i]=e.key;onChange(n.join(""));
      if(i<5) refs[i+1].current?.focus();
    }
  };
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
      {digits.map((d,i)=>(
        <input key={i} ref={refs[i]} maxLength={1} value={d}
          onChange={()=>{}} onKeyDown={e=>handleKey(i,e)}
          onFocus={e=>e.target.select()}
          style={{
            width:46,height:54,textAlign:"center",fontSize:22,
            fontFamily:"'Orbitron',sans-serif",fontWeight:700,
            background:d?"rgba(180,0,0,0.2)":"rgba(255,255,255,0.03)",
            border:`1px solid ${d?"rgba(255,40,40,0.7)":"rgba(255,255,255,0.08)"}`,
            borderRadius:8,color:"#ff4444",outline:"none",
            boxShadow:d?"0 0 14px rgba(255,0,0,0.4)":"none",
            transition:"all 0.2s",caretColor:"transparent",
          }}
        />
      ))}
    </div>
  );
}

/* ══ PASSWORD STRENGTH ══════════════════════════════════════════ */
function pwStrength(pw){
  let s=0;
  if(pw.length>=8) s++;
  if(/[A-Z]/.test(pw)) s++;
  if(/[0-9]/.test(pw)) s++;
  if(/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const PW_LABELS=["","Weak","Fair","Strong","MAXIMUM"];
const PW_COLORS=["","#ff4444","#f59e0b","#ff6b35","#ff0000"];

const STEPS=[
  {id:1,icon:"◈",label:"AGENT"},
  {id:2,icon:"⚔",label:"CIPHER"},
  {id:3,icon:"▲",label:"VERIFY"},
];

/* ══ MAIN ══════════════════════════════════════════════════════ */
export default function SupportRegister() {
  const router = useRouter();
  const [step,setStep]       = useState(1);
  const [form,setForm]       = useState({name:"",email:"",password:"",confirmPassword:""});
  const [otp,setOtp]         = useState("");
  const [genOtp,setGenOtp]   = useState("");
  const [showPw,setShowPw]   = useState(false);
  const [showCpw,setShowCpw] = useState(false);
  const [loading,setLoading] = useState(false);
  const [otpTimer,setOtpTimer]= useState(0);
  const [toast,setToast]     = useState(null);
  const [bootSeq,setBootSeq] = useState(true);
  const [bootLine,setBootLine]= useState(0);
  const cardRef = useRef(null);
  const [tilt,setTilt] = useState({x:0,y:0});

  const strength = pwStrength(form.password);

  const BOOT_LINES = [
    "> INITIALIZING ADMIN KERNEL...",
    "> LOADING SECURITY PROTOCOLS...",
    "> CONNECTING TO NEXUS MAINFRAME...",
    "> ENCRYPTION LAYER: ACTIVE",
    "> BIOMETRIC SCAN: BYPASSED",
    "> CLEARANCE LEVEL: OMEGA",
    "> ACCESS TERMINAL READY.",
  ];

  /* ── Boot sequence ── */
  useEffect(() => {
    if (!bootSeq) return;
    if (bootLine < BOOT_LINES.length) {
      const t = setTimeout(() => setBootLine(v => v + 1), 280);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setBootSeq(false), 400);
      return () => clearTimeout(t);
    }
  }, [bootLine, bootSeq]);

  /* ── Toast ── */
  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3800);
  };

  /* ── OTP timer ── */
  useEffect(() => {
    if(otpTimer<=0) return;
    const t=setTimeout(()=>setOtpTimer(v=>v-1),1000);
    return ()=>clearTimeout(t);
  },[otpTimer]);

  /* ── 3D tilt ── */
  const onMouseMove=(e)=>{
    const rect=cardRef.current?.getBoundingClientRect();
    if(!rect) return;
    setTilt({
      x: ((e.clientY-rect.top)/rect.height-0.5)*14,
      y:-((e.clientX-rect.left)/rect.width-0.5)*14,
    });
  };

  /* ── Send OTP ── */
  const sendOtp=()=>{
    if(!form.email.includes("@")){showToast("Enter valid email.","error");return;}
    const code=String(Math.floor(100000+Math.random()*900000));
    setGenOtp(code); setOtpTimer(60);
    showToast(`TRANSMISSION SENT → ${form.email} · KEY: ${code}`,"info");
  };

  /* ── Validation ── */
  const canNext1=form.name.trim().length>=2 && /\S+@\S+\.\S+/.test(form.email);
  const canNext2=strength>=2 && form.password===form.confirmPassword;

  /* ── Submit ── */
  const handleRegister=async()=>{
    if(otp!==genOtp){showToast("INVALID ACCESS CODE. DENIED.","error");return;}
    setLoading(true);
    try{
      await api.post("/auth/register",{...form,role:"admin"});
      showToast("ADMIN NODE ACTIVATED. ROUTING...","success");
      setTimeout(()=>router.push("/login"),1800);
    }catch(err){
      showToast(err?.response?.data?.message||"SYSTEM BREACH DETECTED.","error");
    }finally{setLoading(false);}
  };

  /* ── Boot screen ── */
  if(bootSeq) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .boot{min-height:100vh;background:#080000;display:flex;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;}
        .boot-inner{max-width:600px;width:100%;padding:40px;}
        .boot-line{color:#cc0000;font-size:13px;letter-spacing:0.08em;line-height:2;opacity:0;animation:bootFade 0.25s ease forwards;}
        @keyframes bootFade{to{opacity:1}}
        .boot-cursor{display:inline-block;width:10px;height:14px;background:#ff0000;animation:blink 0.7s infinite;vertical-align:middle;margin-left:6px;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .boot-logo{font-family:'Orbitron',sans-serif;font-size:28px;font-weight:900;color:#ff0000;letter-spacing:0.2em;margin-bottom:32px;text-shadow:0 0 20px rgba(255,0,0,0.6);}
      `}</style>
      <div className="boot">
        <div className="boot-inner">
          <div className="boot-logo">⬡ LEVELUP://ADMIN</div>
          {BOOT_LINES.slice(0,bootLine).map((l,i)=>(
            <div key={i} className="boot-line" style={{animationDelay:`${i*0.05}s`}}>{l}</div>
          ))}
          {bootLine < BOOT_LINES.length && <div className="boot-cursor" />}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .ar-root{
          min-height:100vh; background:#080000;
          font-family:'Exo 2',sans-serif; color:#e2e8f0;
          display:flex; align-items:center; justify-content:center;
          padding:24px; position:relative; overflow:hidden;
        }

        /* Blood vignette */
        .ar-root::before{
          content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(ellipse 100% 100% at 50% 0%,   rgba(180,0,0,0.18) 0%,transparent 60%),
            radial-gradient(ellipse 100% 100% at 0%   50%,  rgba(120,0,0,0.12) 0%,transparent 50%),
            radial-gradient(ellipse 100% 100% at 100% 50%,  rgba(120,0,0,0.12) 0%,transparent 50%),
            radial-gradient(ellipse 100% 60%  at 50% 100%,  rgba(160,0,0,0.15) 0%,transparent 60%);
        }

        /* ── Card ── */
        .ar-card{
          position:relative; z-index:10;
          width:100%; max-width:490px;
          background:rgba(8,0,0,0.94);
          border:1px solid rgba(200,0,0,0.25);
          border-radius:4px; padding:40px 36px;
          backdrop-filter:blur(24px);
          box-shadow:
            0 0 0 1px rgba(200,0,0,0.08),
            0 0 80px rgba(180,0,0,0.15),
            0 40px 100px rgba(0,0,0,0.8),
            inset 0 0 60px rgba(180,0,0,0.03);
          will-change:transform;
          transition:transform 0.08s ease;
          animation:cardIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
          clip-path:polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px);
        }
        @keyframes cardIn{
          from{opacity:0;transform:translateY(30px) scale(0.95)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }

        /* Corner brackets */
        .c-tl,.c-tr,.c-bl,.c-br{position:absolute;width:20px;height:20px;}
        .c-tl{top:0;left:0;border-top:2px solid #cc0000;border-left:2px solid #cc0000;}
        .c-tr{top:0;right:0;border-top:2px solid #cc0000;border-right:2px solid #cc0000;}
        .c-bl{bottom:0;left:0;border-bottom:2px solid #cc0000;border-left:2px solid #cc0000;}
        .c-br{bottom:0;right:0;border-bottom:2px solid #cc0000;border-right:2px solid #cc0000;}

        /* Scan strip */
        .scan-strip{
          position:absolute;top:0;left:0;right:0;height:2px;overflow:hidden;
        }
        .scan-strip::after{
          content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
          background:linear-gradient(90deg,transparent,#ff0000,#ff6666,#ff0000,transparent);
          animation:stripScan 2.2s linear infinite;
          box-shadow:0 0 8px #ff0000;
        }
        @keyframes stripScan{to{left:200%}}

        /* Side scanlines */
        .side-scan{
          position:absolute;top:0;bottom:0;width:2px;overflow:hidden;
        }
        .side-scan.left{left:0;}
        .side-scan.right{right:0;}
        .side-scan::after{
          content:'';position:absolute;top:-50%;left:0;width:100%;height:40%;
          background:linear-gradient(180deg,transparent,#880000,transparent);
          animation:sideScan 3s linear infinite;
        }
        .side-scan.right::after{animation-delay:-1.5s;}
        @keyframes sideScan{to{top:150%}}

        /* ── Logo ── */
        .ar-logo{text-align:center;margin-bottom:24px;}
        .ar-logo-icon{
          width:64px;height:64px;border-radius:4px;margin:0 auto 12px;
          background:linear-gradient(135deg,rgba(180,0,0,0.2),rgba(100,0,0,0.3));
          border:1px solid rgba(200,0,0,0.4);
          display:flex;align-items:center;justify-content:center;font-size:28px;
          box-shadow:0 0 30px rgba(200,0,0,0.3),inset 0 0 20px rgba(180,0,0,0.08);
          animation:redPulse 2.5s ease-in-out infinite;
          clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
        }
        @keyframes redPulse{
          0%,100%{box-shadow:0 0 30px rgba(200,0,0,0.3)}
          50%    {box-shadow:0 0 55px rgba(255,0,0,0.6),0 0 100px rgba(180,0,0,0.2)}
        }
        .ar-logo-title{
          font-family:'Orbitron',sans-serif;font-size:17px;font-weight:900;
          color:#ff0000;letter-spacing:0.15em;
          text-shadow:0 0 20px rgba(255,0,0,0.5);
        }
        .ar-logo-sub{
          font-family:'Share Tech Mono',monospace;font-size:9px;
          color:rgba(255,60,60,0.4);letter-spacing:0.3em;
          text-transform:uppercase;margin-top:4px;
        }

        /* Clearance badge */
        .ar-badge{
          display:flex;align-items:center;justify-content:center;gap:8px;
          margin-bottom:22px;
        }
        .ar-badge-inner{
          display:inline-flex;align-items:center;gap:8px;
          padding:5px 14px;border-radius:2px;
          background:rgba(180,0,0,0.12);border:1px solid rgba(200,0,0,0.3);
          font-family:'Share Tech Mono',monospace;font-size:9px;
          color:rgba(255,80,80,0.8);letter-spacing:0.18em;
          animation:badgePulse 2s ease-in-out infinite;
        }
        @keyframes badgePulse{0%,100%{border-color:rgba(200,0,0,0.3)}50%{border-color:rgba(255,0,0,0.6)}}
        .ar-badge-dot{
          width:6px;height:6px;border-radius:50%;background:#ff0000;
          box-shadow:0 0 6px #ff0000;animation:dotBlink 1s infinite;
        }
        @keyframes dotBlink{0%,100%{opacity:1}50%{opacity:0.3}}

        /* ── Stepper ── */
        .ar-stepper{display:flex;align-items:flex-start;margin-bottom:28px;}
        .ar-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;position:relative;}
        .ar-step-circle{
          width:38px;height:38px;
          clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
          display:flex;align-items:center;justify-content:center;
          font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;
          border:1px solid;transition:all 0.4s;
        }
        .ar-step-label{
          font-family:'Share Tech Mono',monospace;font-size:8px;
          letter-spacing:0.15em;text-transform:uppercase;transition:color 0.3s;
        }
        .ar-step-line{
          position:absolute;top:19px;left:calc(50% + 19px);
          width:calc(100% - 38px);height:1px;transition:background 0.4s;
        }

        /* ── Input ── */
        .ar-field{margin-bottom:16px;}
        .ar-label{
          font-family:'Share Tech Mono',monospace;font-size:9px;
          letter-spacing:0.2em;text-transform:uppercase;
          color:rgba(255,60,60,0.4);margin-bottom:7px;display:block;
        }
        .ar-input-wrap{position:relative;}
        .ar-input{
          width:100%;padding:11px 15px;border-radius:2px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(200,0,0,0.15);
          color:#ffcccc;font-size:13px;font-family:'Exo 2',sans-serif;
          outline:none;transition:all 0.25s;
          clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);
        }
        .ar-input::placeholder{color:rgba(255,100,100,0.25);}
        .ar-input:focus{
          border-color:rgba(255,0,0,0.5);
          background:rgba(180,0,0,0.06);
          box-shadow:0 0 0 2px rgba(200,0,0,0.1),0 0 16px rgba(180,0,0,0.15);
        }
        .ar-input.has-icon{padding-right:44px;}
        .ar-icon-btn{
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;
          color:rgba(255,80,80,0.4);font-size:15px;padding:4px;
          transition:color 0.2s;
        }
        .ar-icon-btn:hover{color:#ff4444;}

        /* PW strength */
        .pw-bars{display:flex;gap:4px;margin-top:7px;}
        .pw-bar{flex:1;height:3px;border-radius:1px;background:rgba(255,255,255,0.06);transition:background 0.3s;}
        .pw-hint{font-family:'Share Tech Mono',monospace;font-size:10px;margin-top:5px;transition:color 0.3s;}
        .pw-rules{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
        .pw-rule{
          font-family:'Share Tech Mono',monospace;font-size:9px;
          padding:2px 9px;border-radius:1px;border:1px solid;
          letter-spacing:0.07em;transition:all 0.25s;
        }

        /* ── Buttons ── */
        .ar-btn{
          width:100%;padding:13px;border:none;
          font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;
          letter-spacing:0.18em;text-transform:uppercase;
          cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;
          clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
        }
        .ar-btn-row{display:flex;gap:10px;margin-top:6px;}
        .ar-btn-primary{
          background:linear-gradient(135deg,#8b0000,#cc0000,#ff2222);
          color:#fff;
          box-shadow:0 0 24px rgba(200,0,0,0.45);
        }
        .ar-btn-primary:hover:not(:disabled){
          box-shadow:0 0 40px rgba(255,0,0,0.7),0 0 80px rgba(180,0,0,0.3);
          transform:translateY(-1px);
        }
        .ar-btn-primary:disabled{opacity:0.35;cursor:not-allowed;transform:none;}
        .ar-btn-primary::before{
          content:'';position:absolute;top:0;left:0;right:0;bottom:0;
          background:repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(255,255,255,0.03) 4px,rgba(255,255,255,0.03) 5px);
        }
        .ar-btn-primary::after{
          content:'';position:absolute;top:-50%;left:-70%;width:35%;height:200%;
          background:rgba(255,255,255,0.1);transform:skewX(-20deg);
          animation:btnShimmer 2.4s infinite;
        }
        @keyframes btnShimmer{0%{left:-70%}100%{left:170%}}

        .ar-btn-ghost{
          background:transparent;color:rgba(255,100,100,0.5);
          border:1px solid rgba(200,0,0,0.2)!important;font-size:10px;
        }
        .ar-btn-ghost:hover{border-color:rgba(255,0,0,0.4)!important;color:rgba(255,140,140,0.8);}

        /* OTP */
        .ar-otp-meta{
          font-family:'Share Tech Mono',monospace;font-size:10px;
          color:rgba(255,60,60,0.4);text-align:center;margin-top:10px;
        }
        .ar-otp-resend{
          color:#ff4444;cursor:pointer;background:none;border:none;
          font-family:'Share Tech Mono',monospace;font-size:10px;
          text-decoration:underline;padding:0;
        }
        .ar-otp-resend:disabled{opacity:0.3;cursor:not-allowed;text-decoration:none;}

        /* Divider */
        .ar-divider{height:1px;background:rgba(200,0,0,0.12);margin:16px 0;}

        /* Toast */
        .ar-toast{
          position:fixed;bottom:24px;right:24px;z-index:9999;
          padding:13px 18px;border-radius:2px;min-width:290px;
          font-family:'Share Tech Mono',monospace;font-size:11px;
          display:flex;align-items:flex-start;gap:10px;
          backdrop-filter:blur(20px);border:1px solid;
          animation:toastIn 0.3s ease;
          box-shadow:0 8px 40px rgba(0,0,0,0.6);line-height:1.6;
          clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
        }
        .ar-toast-success{background:rgba(20,80,20,0.3);border-color:rgba(74,222,128,0.4);color:#4ade80;}
        .ar-toast-error  {background:rgba(120,0,0,0.3);border-color:rgba(255,60,60,0.5);color:#ff6666;}
        .ar-toast-info   {background:rgba(80,0,0,0.3);border-color:rgba(200,0,0,0.4);color:#ff9999;}
        @keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

        /* Footer */
        .ar-footer{
          text-align:center;margin-top:20px;
          font-family:'Share Tech Mono',monospace;font-size:10px;
          color:rgba(255,60,60,0.3);
        }
        .ar-footer a{color:#ff4444;cursor:pointer;text-decoration:none;}
        .ar-footer a:hover{text-decoration:underline;}

        /* Dev box */
        .ar-dev{
          margin-top:14px;padding:10px 14px;border-radius:2px;
          background:rgba(180,60,0,0.08);border:1px solid rgba(200,80,0,0.2);
          font-family:'Share Tech Mono',monospace;font-size:10px;
          color:rgba(251,191,36,0.6);text-align:center;
        }

        /* Step anim */
        @keyframes stepSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .step-in{animation:stepSlide 0.32s ease forwards;}

        /* Step title */
        .ar-step-title{
          font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;
          letter-spacing:0.16em;color:rgba(255,60,60,0.5);
          margin-bottom:18px;text-transform:uppercase;
          display:flex;align-items:center;gap:8px;
        }
        .ar-step-title::before{
          content:'';display:inline-block;width:4px;height:14px;
          background:#cc0000;box-shadow:0 0 6px #ff0000;
        }

        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(200,0,0,0.25);border-radius:1px;}
      `}</style>

      <div className="ar-root">
        <MatrixRain />
        <HexScanner />

        <div
          ref={cardRef}
          className="ar-card"
          onMouseMove={onMouseMove}
          onMouseLeave={()=>setTilt({x:0,y:0})}
          style={{transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`}}
        >
          <div className="c-tl"/><div className="c-tr"/>
          <div className="c-bl"/><div className="c-br"/>
          <div className="scan-strip"/>
          <div className="side-scan left"/><div className="side-scan right"/>

          {/* Logo */}
          <div className="ar-logo">
            <div className="ar-logo-icon">☠</div>
            <div className="ar-logo-title"><GlitchText text="LEVELUP://ADMIN" /></div>
            <div className="ar-logo-sub">Command Tier · Omega Clearance</div>
          </div>

          {/* Badge */}
          <div className="ar-badge">
            <div className="ar-badge-inner">
              <div className="ar-badge-dot"/>
              ADMIN UPLINK · CLASSIFIED
            </div>
          </div>

          {/* Stepper */}
          <div className="ar-stepper">
            {STEPS.map((s,i)=>{
              const done=step>s.id, active=step===s.id;
              return (
                <div key={s.id} className="ar-step">
                  <div className="ar-step-circle" style={{
                    borderColor: done?"#4ade80":active?"#ff2222":"rgba(255,255,255,0.08)",
                    background:  done?"rgba(74,222,128,0.1)":active?"rgba(200,0,0,0.15)":"transparent",
                    color:       done?"#4ade80":active?"#ff4444":"rgba(255,255,255,0.2)",
                    boxShadow:   active?"0 0 20px rgba(255,0,0,0.4)":"none",
                  }}>
                    {done?"✓":s.icon}
                  </div>
                  <div className="ar-step-label" style={{
                    color:done?"#4ade80":active?"#ff4444":"rgba(255,255,255,0.18)",
                  }}>{s.label}</div>
                  {i<STEPS.length-1&&(
                    <div className="ar-step-line" style={{
                      background:done?"#cc0000":"rgba(255,255,255,0.06)",
                    }}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* ══ STEP 1: Agent Identity ══ */}
          {step===1&&(
            <div className="step-in">
              <div className="ar-step-title">01 · Agent Identification</div>

              <div className="ar-field">
                <label className="ar-label">Agent Name</label>
                <input className="ar-input" placeholder="Full designation"
                  value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})} />
              </div>

              <div className="ar-field">
                <label className="ar-label">Secure Email</label>
                <input className="ar-input" placeholder="agent@nexus.sys" type="email"
                  value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} />
              </div>

              <button className="ar-btn ar-btn-primary" disabled={!canNext1}
                onClick={()=>setStep(2)}>
                AUTHENTICATE →
              </button>

              <div className="ar-footer">
                <a onClick={()=>router.push("/login")}>Return to Login Terminal</a>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Cipher / Password ══ */}
          {step===2&&(
            <div className="step-in">
              <div className="ar-step-title">02 · Cipher Protocol</div>

              <div className="ar-field">
                <label className="ar-label">Access Cipher</label>
                <div className="ar-input-wrap">
                  <input className="ar-input has-icon"
                    type={showPw?"text":"password"}
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={e=>setForm({...form,password:e.target.value})} />
                  <button className="ar-icon-btn" type="button" onClick={()=>setShowPw(v=>!v)}>
                    {showPw?"🙈":"👁️"}
                  </button>
                </div>
                {form.password&&(
                  <>
                    <div className="pw-bars">
                      {[1,2,3,4].map(n=>(
                        <div key={n} className="pw-bar"
                          style={{background:n<=strength?PW_COLORS[strength]:undefined}} />
                      ))}
                    </div>
                    <div className="pw-hint" style={{color:PW_COLORS[strength]}}>
                      {PW_LABELS[strength]} CIPHER
                    </div>
                    <div className="pw-rules">
                      {[
                        {label:"8+ chars", ok:form.password.length>=8},
                        {label:"Uppercase",ok:/[A-Z]/.test(form.password)},
                        {label:"Number",   ok:/[0-9]/.test(form.password)},
                        {label:"Symbol",   ok:/[^A-Za-z0-9]/.test(form.password)},
                      ].map(r=>(
                        <div key={r.label} className="pw-rule" style={{
                          color:      r.ok?"#4ade80":"rgba(255,80,80,0.25)",
                          borderColor:r.ok?"rgba(74,222,128,0.4)":"rgba(255,0,0,0.1)",
                          background: r.ok?"rgba(74,222,128,0.07)":"transparent",
                        }}>
                          {r.ok?"✓":"○"} {r.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="ar-field">
                <label className="ar-label">Confirm Cipher</label>
                <div className="ar-input-wrap">
                  <input className="ar-input has-icon"
                    type={showCpw?"text":"password"}
                    placeholder="Re-enter cipher"
                    value={form.confirmPassword}
                    onChange={e=>setForm({...form,confirmPassword:e.target.value})}
                    style={{
                      borderColor:form.confirmPassword
                        ?(form.confirmPassword===form.password?"rgba(74,222,128,0.5)":"rgba(255,0,0,0.5)")
                        :undefined,
                    }} />
                  <button className="ar-icon-btn" type="button" onClick={()=>setShowCpw(v=>!v)}>
                    {showCpw?"🙈":"👁️"}
                  </button>
                </div>
                {form.confirmPassword&&(
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,marginTop:5,
                    color:form.confirmPassword===form.password?"#4ade80":"#ff4444"}}>
                    {form.confirmPassword===form.password?"✓ CIPHER MATCH":"✕ CIPHER MISMATCH"}
                  </div>
                )}
              </div>

              <div className="ar-btn-row">
                <button className="ar-btn ar-btn-ghost" style={{flex:"0 0 80px"}}
                  onClick={()=>setStep(1)}>← BACK</button>
                <button className="ar-btn ar-btn-primary" style={{flex:1}}
                  disabled={!canNext2}
                  onClick={()=>{setStep(3);sendOtp();}}>
                  TRANSMIT OTP →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: Verify OTP ══ */}
          {step===3&&(
            <div className="step-in">
              <div className="ar-step-title">03 · Signal Verification</div>

              <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,
                color:"rgba(255,80,80,0.4)",marginBottom:22,lineHeight:1.8}}>
                ONE-TIME ACCESS KEY TRANSMITTED TO<br/>
                <span style={{color:"#ff4444"}}>{form.email}</span>
              </p>

              <div className="ar-field">
                <label className="ar-label">Access Key</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <div className="ar-otp-meta">
                {otpTimer>0?(
                  <>RESEND IN <span style={{color:"#ff4444"}}>00:{String(otpTimer).padStart(2,"0")}</span></>
                ):(
                  <button className="ar-otp-resend" onClick={sendOtp}>↺ RETRANSMIT</button>
                )}
              </div>

              <div className="ar-divider" style={{marginTop:18}}/>

              <div className="ar-btn-row">
                <button className="ar-btn ar-btn-ghost" style={{flex:"0 0 80px"}}
                  onClick={()=>setStep(2)}>← BACK</button>
                <button className="ar-btn ar-btn-primary" style={{flex:1}}
                  disabled={otp.length<6||loading}
                  onClick={handleRegister}>
                  {loading?"INITIALIZING...":"ACTIVATE NODE ⚡"}
                </button>
              </div>

              {genOtp&&(
                <div className="ar-dev">
                  🔧 DEV OVERRIDE · KEY:&nbsp;
                  <span style={{color:"#fbbf24",fontWeight:700,fontSize:14}}>{genOtp}</span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {toast&&(
        <div className={`ar-toast ar-toast-${toast.type}`}>
          <span>{toast.type==="success"?"✓":toast.type==="error"?"✕":"⚠"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}