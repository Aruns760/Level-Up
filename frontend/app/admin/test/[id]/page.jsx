"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";

export default function AdminTestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  /* ================= FETCH TEST ================= */
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${id}`);
        setTest(res.data);
        setTimeLeft(res.data.duration * 60);
      } catch (err) {
        console.error("FETCH TEST ERROR:", err);
      }
    };

    if (id) fetchTest();
  }, [id]);

  /* ================= SUBMIT ================= */
  const submitTest = useCallback(() => {
    if (submitted || !test) return;

    let score = 0;

    test.questions.forEach((q) => {
      if (answers[q.id] === q.correct) {
        score += q.marks || 1;
      }
    });

    const total = test.questions.length;
    const percentage = ((score / total) * 100).toFixed(1);

    setResult({ score, total, percentage });
    setSubmitted(true);
  }, [answers, submitted, test]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!test || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitTest();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, submitted, submitTest]);

  const handleAnswer = (qid, value) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  if (!test) return <p style={S.loading}>Initializing System...</p>;

  return (
    <div style={S.container}>
      <h1 style={S.title}>⚡ ADMIN TEST ENGINE</h1>
      <h2 style={S.subtitle}>{test.title}</h2>

      {/* TIMER */}
      <div style={S.timer}>
        ⏳ {Math.floor(timeLeft / 60)}:
        {String(timeLeft % 60).padStart(2, "0")}
      </div>

      {/* QUESTIONS */}
      {test.questions.map((q, index) => (
        <div key={q.id} style={S.card}>
          <div style={S.qHeader}>
            Q{index + 1}
          </div>

          <p style={S.question}>{q.question}</p>

          {/* MCQ */}
          {q.type === "mcq" && (
            <div style={S.options}>
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(q.id, opt)}
                  style={{
                    ...S.optionBtn,
                    background:
                      answers[q.id] === opt
                        ? "#00D4FF"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* CODING */}
          {q.type === "coding" && (
            <textarea
              placeholder="// Write your solution..."
              value={answers[q.id] || ""}
              onChange={(e) =>
                handleAnswer(q.id, e.target.value)
              }
              style={S.textarea}
            />
          )}

          {submitted && (
            <div style={S.correct}>
              ✔ Correct: {q.correct}
            </div>
          )}
        </div>
      ))}

      {/* SUBMIT */}
      {!submitted ? (
        <button style={S.submitBtn} onClick={submitTest}>
          SUBMIT TEST
        </button>
      ) : (
        <div style={S.result}>
          <h2>📊 RESULT</h2>
          <p>Score: {result.score} / {result.total}</p>
          <p>{result.percentage}%</p>
        </div>
      )}

      <button
        style={S.backBtn}
        onClick={() => router.push("/admin/tests/manage")}
      >
        ← BACK
      </button>
    </div>
  );
}

/* ================= STYLES ================= */
const S = {
  container: {
    minHeight: "100vh",
    background: "#0A0F1C",
    color: "#fff",
    padding: "30px",
    fontFamily: "JetBrains Mono, monospace",
  },
  title: {
    color: "#00D4FF",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "20px",
  },
  timer: {
    textAlign: "center",
    fontSize: "20px",
    marginBottom: "20px",
    color: "#00FF9D",
  },
  card: {
    border: "1px solid rgba(0,212,255,0.2)",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.02)",
  },
  qHeader: {
    color: "#00D4FF",
    marginBottom: "10px",
  },
  question: {
    marginBottom: "10px",
  },
  options: {
    display: "flex",
    gap: "10px",
  },
  optionBtn: {
    padding: "10px",
    border: "1px solid #00D4FF",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#fff",
  },
  textarea: {
    width: "100%",
    height: "120px",
    background: "#111",
    color: "#fff",
    border: "1px solid #00D4FF",
    borderRadius: "6px",
    padding: "10px",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "#00D4FF",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  result: {
    textAlign: "center",
    marginTop: "20px",
    color: "#00FF9D",
  },
  correct: {
    marginTop: "10px",
    color: "#00FF9D",
  },
  backBtn: {
    marginTop: "20px",
    background: "#222",
    color: "#fff",
    padding: "10px",
    border: "none",
    cursor: "pointer",
  },
  loading: {
    color: "#00D4FF",
    textAlign: "center",
    marginTop: "50px",
  },
};