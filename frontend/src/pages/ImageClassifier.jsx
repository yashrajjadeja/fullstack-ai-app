/**
 * ImageClassifier.jsx  (Experiment 8)
 * Lets the user pick a JPEG or PNG, shows a preview, then uploads it to
 * POST /api/classify and displays the returned label and confidence.
 */
import { useState } from "react";
import api from "../services/api";

export default function ImageClassifier() {
  // Track the chosen File object, its preview URL, and the API result
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Called every time the user picks a file
  function handleFileChange(e) {
    const chosen = e.target.files[0];
    setResult(null);   // clear previous result
    setError("");
    setFile(chosen || null);
    // createObjectURL creates a temporary URL so we can show a preview
    setPreview(chosen ? URL.createObjectURL(chosen) : "");
  }

  // Upload the file using FormData (multipart/form-data)
  async function handleUpload() {
    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    const formData = new FormData();
    // The key "image" must match request.files.get("image") in Flask
    formData.append("image", file);

    setLoading(true);
    setError("");
    setResult(null);
    try {
      // axios sets the correct Content-Type header (including boundary) automatically
      const res = await api.post("/classify", formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Is Flask running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h2>Image Classifier</h2>

      {/* Only accept JPEG and PNG files */}
      <input
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
      />

      {/* Show a preview once the user picks a file */}
      {preview && (
        <div style={{ marginTop: 12 }}>
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: "100%", maxHeight: 250, display: "block" }}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{ marginTop: 12 }}
      >
        {loading ? "Classifying..." : "Upload & Classify"}
      </button>

      {/* Error message (red) */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Success result */}
      {result && (
        <p>
          Class: <b>{result.label}</b> | Confidence: <b>{result.confidence}</b>
        </p>
      )}
    </div>
  );
}
