"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function BarChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  return (
    <div className="relative h-56">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Eventos",
              data: values,
              backgroundColor: "#1d4ed8cc",
              borderRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { font: { size: 10 }, maxRotation: 45 },
              grid: { display: false },
            },
            y: {
              ticks: { font: { size: 11 }, stepSize: 1 },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
