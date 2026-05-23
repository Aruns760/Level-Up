"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, Play, CheckCircle, Shield, Zap } from "lucide-react";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [testsRes, resultsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/tests/my-tests", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/tests/my-results", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setTests(testsRes.data);
        setResults(resultsRes.data);
      } catch (err) {
        console.error("Connection Intercepted:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const getResult = (testId) => results.find((r) => r.testId === testId);
  const isLocked = (index) => index !== 0 && !getResult(tests[index - 1]?.id);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>SYNCING MISSION DATA...</p>
    </div>
  );

  return (
    <div className="mission-root">
      <style>{`
        .mission-root {
          min-height: 100vh;
          background: #020b18;
          color: #e2e8f0;
          font-family: 'Exo 2', sans-serif;
          padding: 40px 20px;
        }
        .header-box {
          max-width: 900px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .mission-grid {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          gap: 16px;
        }
        .test-card {
          background: rgba(0, 229, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 20px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .test-card:hover:not(.is-locked) {
          border-color: #00e5ff;
          background: rgba(0, 229, 255, 0.08);
          transform: translateY(-2px);
        }
        .is-locked { opacity: 0.5; cursor: not-allowed; }
        .is-done { border-color: rgba(74, 222, 128, 0.2); }
        
        .info-group h3 { font-family: 'Orbitron', sans-serif; font-size: 18px; margin-bottom: 5px; color: #fff; }
        .status-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-action {
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
          font-size: 12px;
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.3s;
          clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
        }
        .btn-start { background: #00e5ff; color: #000; box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
        .btn-start:hover { background: #fff; box-shadow: 0 0 25px rgba(0, 229, 255, 0.6); }
        .btn-locked { background: #1e293b; color: #64748b; cursor: not-allowed; }
        .btn-done { background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid #4ade80; }

        .loading-screen { height: 100vh; background: #020b18; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #00e5ff; }
        .spinner { width: 40px; height: 40px; border: 3px solid rgba(0, 229, 255, 0.1); border-top-color: #00e5ff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="header-box">
        <Shield size={32} color="#00e5ff" />
        <div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '24px', letterSpacing: '2px' }}>COMBAT MISSIONS</h1>
          <p style={{ fontFamily: 'Share Tech Mono', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
            Complete sequential modules to increase Clearance Level
          </p>
        </div>
      </div>

      <div className="mission-grid">
        {tests.length === 0 ? (
          <div className="test-card" style={{ justifyContent: 'center' }}>
            <p>NO ACTIVE MISSIONS FOUND IN SECTOR</p>
          </div>
        ) : (
          tests.map((test, index) => {
            const result = getResult(test.id);
            const locked = isLocked(index);

            return (
              <div 
                key={test.id} 
                className={`test-card ${locked ? 'is-locked' : ''} ${result ? 'is-done' : ''}`}
              >
                <div className="info-group">
                  <h3>{test.title}</h3>
                  <div className="status-badge">
                    {result ? (
                      <span style={{ color: '#4ade80' }}><CheckCircle size={14} /> SCORE: {result.score}/{result.total}</span>
                    ) : locked ? (
                      <span style={{ color: '#64748b' }}><Lock size={14} /> ENCRYPTED - COMPLETE PREVIOUS</span>
                    ) : (
                      <span style={{ color: '#00e5ff' }}><Zap size={14} /> SYSTEM READY</span>
                    )}
                  </div>
                </div>

                {result ? (
                  <button className="btn-action btn-done">ARCHIVED</button>
                ) : locked ? (
                  <button className="btn-action btn-locked"><Lock size={14} /> LOCKED</button>
                ) : (
                  <button 
                    className="btn-action btn-start"
                    onClick={() => router.push(`/candidate/test/${test.id}`)}
                  >
                    <Play size={14} fill="currentColor" /> ENGAGE
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}