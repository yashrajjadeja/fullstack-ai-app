/**
 * History.jsx  (Experiment 10)
 * Fetches the last 20 sentiment predictions from GET /api/predictions
 * and shows them in a table with loading, error, and empty states.
 */
import { useEffect, useState } from "react";
import api from "../services/api";

export default function History() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load predictions once when the component first renders
  useEffect(() => {
    api
      .get("/predictions")
      .then((res) => setItems(res.data))
      .catch(() => setError("Backend unavailable. Is Flask running?"))
      .finally(() => setLoading(false));
  }, []);

  // -- Loading state --
  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;

  // -- Error state --
  if (error) return <p style={{ color: "red", padding: 16 }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 16 }}>
      <h2>Prediction History</h2>

      {/* -- Empty state -- */}
      {items.length === 0 ? (
        <p>No predictions yet. Analyze some text on the Sentiment page first.</p>
      ) : (
        // overflowX allows the table to scroll horizontally on small screens
        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>Text</th>
                <th>Label</th>
                <th>Score</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i}>
                  <td>{p.text}</td>
                  <td>{p.label}</td>
                  <td>{p.score}</td>
                  {/* toLocaleString formats the ISO date into a readable local time */}
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
