/**
 * App.jsx  (Experiment 10 — integrated navigation)
 * Sets up React Router with four pages and a responsive NavLink navbar.
 */
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Sentiment from "./pages/Sentiment";
import Dashboard from "./pages/Dashboard";
import ImageClassifier from "./pages/ImageClassifier";
import History from "./pages/History";

/**
 * linkStyle applies bold + underline to the currently active link.
 * React Router calls this function with { isActive } for each NavLink.
 */
const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? "bold" : "normal",
  textDecoration: isActive ? "underline" : "none",
  color: "inherit",        // keep the colour from the parent element
});

export default function App() {
  return (
    <BrowserRouter>
      {/* flexWrap lets links wrap onto a second line on small screens */}
      <nav
        style={{
          display: "flex",
          gap: 16,
          padding: 16,
          borderBottom: "1px solid #888",
          flexWrap: "wrap",
        }}
      >
        {/* "end" makes the Sentiment link active only on "/" not on "/image" etc. */}
        <NavLink to="/" style={linkStyle} end>
          Sentiment
        </NavLink>
        <NavLink to="/image" style={linkStyle}>
          Image
        </NavLink>
        <NavLink to="/dashboard" style={linkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/history" style={linkStyle}>
          History
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Sentiment />} />
        <Route path="/image" element={<ImageClassifier />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}