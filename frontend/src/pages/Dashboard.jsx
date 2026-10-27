/**
 * Dashboard.jsx
 * Shows sentiment statistics as a bar chart and a line chart.
 * Data comes from GET /api/stats which returns { labels, counts }.
 */
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import api from "../services/api";

// Chart.js components must be registered before use
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [labels, setLabels] = useState([]);
  const [counts, setCounts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load stats once when the component mounts
  useEffect(() => {
    api
      .get("/stats")
      .then((res) => {
        setLabels(res.data.labels);
        setCounts(res.data.counts);
      })
      .catch(() => setError("Could not load stats. Is Flask running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;
  if (error) return <p style={{ color: "red", padding: 16 }}>{error}</p>;
  if (labels.length === 0)
    return (
      <p style={{ padding: 16 }}>
        No data yet. Analyze some text on the Sentiment page first.
      </p>
    );

  // Shared dataset used by both charts
  const chartData = {
    labels,
    datasets: [
      {
        label: "Predictions",
        data: counts,
        backgroundColor: ["#4caf50", "#f44336", "#2196f3"], // green/red/blue for pos/neg/neu
        borderColor: "#555",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
  };

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 16 }}>
      <h2>Dashboard — Sentiment Statistics</h2>

      <h3 style={{ marginTop: 24 }}>Bar Chart</h3>
      <Bar data={chartData} options={options} />

      <h3 style={{ marginTop: 32 }}>Line Chart</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}
