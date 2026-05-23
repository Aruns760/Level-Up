"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export default function ResultPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!id || !token) return;

    axios
      .get(`http://localhost:5000/api/tests/result/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [id, token]);

  if (!data) return <p>Loading result...</p>;

  const { result, questions } = data;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>📊 Test Result</h1>

      {/* SCORE */}
      <div style={{ marginBottom: "20px" }}>
        <h2>
          Score: {result.score} / {result.total}
        </h2>
        <p>Percentage: {result.percentage.toFixed(1)}%</p>
      </div>

      {/* QUESTIONS */}
      {questions.map((q, index) => {
        const userAnswer = result.answers?.[q.id]; // optional future

        return (
          <div
            key={q.id}
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <p>
              <b>Q{index + 1}:</b> {q.question}
            </p>

            {["A", "B", "C", "D"].map((opt) => {
              const isCorrect = q.correct === opt;
              const isUser = userAnswer === opt;

              return (
                <div
                  key={opt}
                  style={{
                    padding: "5px",
                    background: isCorrect
                      ? "#4caf50"
                      : isUser
                      ? "#f44336"
                      : "#eee",
                    margin: "4px 0",
                    borderRadius: "5px",
                  }}
                >
                  {opt}
                </div>
              );
            })}

            <p>
              ✅ Correct Answer: <b>{q.correct}</b>
            </p>

            {q.explanation && (
              <p>💡 {q.explanation}</p>
            )}
          </div>
        );
      })}

      <button onClick={() => router.push("/candidate/tests")}>
        Back to Tests
      </button>
    </div>
  );
}