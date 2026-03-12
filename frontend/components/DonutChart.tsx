"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#1d4ed8", "#059669", "#dc2626", "#d97706", "#7c3aed",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#6366f1",
];

export default function DonutChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  return (
    <div className="relative h-56 flex items-center justify-center">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: COLORS.slice(0, values.length),
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 11 }, padding: 12, boxWidth: 12 },
            },
          },
        }}
      />
    </div>
  );
}
