/**
 * Sentiment.jsx  (Experiment 5 + Experiment 9)
 * Sends text to POST /api/sentiment and shows the label and score.
 * Experiment 9 adds a microphone button using the Web Speech API.
 * Falls back to the text box if the browser doesn't support speech.
 */
import { useState, useRef } from "react";
import api from "../services/api";

export default function Sentiment() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // We keep the recognition object in a ref so we can stop it from toggleMic
  const recognitionRef = useRef(null);

  // Chrome/Edge expose SpeechRecognition; older Chrome uses the webkit prefix
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  // Toggle the microphone on/off
  function toggleMic() {
    if (!SpeechRecognition) {
      // Friendly message — the text box still works as a fallback
      setError("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    // If already listening, stop
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";          // Indian English accent
    recognition.interimResults = true;   // show words as they are spoken

    // Update the text box in real time with interim + final results
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(spoken);
    };

    recognition.onend = () => setListening(false);

    recognition.onerror = () => {
      setListening(false);
      setError("Microphone error. Check that the browser has microphone permission.");
    };

    recognitionRef.current = recognition;
    setError("");
    recognition.start();
    setListening(true);
  }

  // Submit the text (typed or spoken) to Flask
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/sentiment", { text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Request failed. Is Flask running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h2>Sentiment Analysis</h2>

      <form onSubmit={handleSubmit}>
        {/* Text box — always visible as a fallback when speech is unavailable */}
        <textarea
          rows={4}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or use the microphone below"
        />

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {/* Microphone button */}
          <button type="button" onClick={toggleMic}>
            {listening ? "⏹ Stop listening" : "🎤 Speak"}
          </button>

          {/* Analyze button */}
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </form>

      {/* Show error or result below the form */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <p>
          Result: <b>{result.label}</b> (score {result.score})
        </p>
      )}
    </div>
  );
}