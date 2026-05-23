"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsChart({ jobs, applications }) {

  const data = {
    labels: ["Jobs Posted", "Applications"],
    datasets: [
      {
        label: "Recruiter Stats",
        data: [jobs, applications],
        backgroundColor: ["#3b82f6", "#10b981"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Recruiter Analytics",
      },
    },
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Bar data={data} options={options} />
    </div>
  );
}