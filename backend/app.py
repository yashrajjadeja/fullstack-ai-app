import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageStat, UnidentifiedImageError
from pymongo import MongoClient
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Load variables from .env (only needed locally; use server env vars in production)
load_dotenv()

app = Flask(__name__)

# CORS: read allowed origin from environment so we never hard-code production URLs
CORS(app, origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")])

# ── Database ─────────────────────────────────────────────────────────────────
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = client[os.getenv("DB_NAME", "ai_fullstack")]
predictions = db["predictions"]              # sentiment results
image_predictions = db["image_predictions"]  # image classification results

# ── Image upload config ───────────────────────────────────────────────────────
ALLOWED_TYPES = {"image/jpeg", "image/png"}
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # Flask enforces 5 MB limit

# ── Sentiment analyser ────────────────────────────────────────────────────────
analyzer = SentimentIntensityAnalyzer()


# ── Error handlers ────────────────────────────────────────────────────────────

@app.errorhandler(413)
def too_large(e):
    """Return a JSON error when the upload exceeds MAX_CONTENT_LENGTH."""
    return jsonify({"error": "Image too large (max 5 MB)"}), 413


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    """Liveness check — confirms Flask is running."""
    return jsonify({"status": "ok", "message": "Flask API is running"})


@app.post("/api/sentiment")
def sentiment():
    """
    Receive { text } JSON, run VADER sentiment analysis, save to MongoDB.
    Returns { text, label, score }.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "text is required"}), 400

    # VADER compound: >= 0.05 → positive, <= -0.05 → negative, else neutral
    score = analyzer.polarity_scores(text)["compound"]
    if score >= 0.05:
        label = "positive"
    elif score <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    record = {
        "text": text,
        "label": label,
        "score": round(score, 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Use .copy() so insert_one's _id mutation doesn't modify record
    predictions.insert_one(record.copy())

    return jsonify({"text": text, "label": label, "score": record["score"]})


@app.get("/api/predictions")
def list_predictions():
    """Return the 20 most-recent sentiment predictions (newest first)."""
    items = list(predictions.find({}, {"_id": 0}).sort("created_at", -1).limit(20))
    return jsonify(items)


@app.get("/api/stats")
def stats():
    """
    Aggregate sentiment label counts for the Dashboard charts.
    Returns { labels: [...], counts: [...] }.
    """
    pipeline = [
        {"$group": {"_id": "$label", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = list(predictions.aggregate(pipeline))
    labels = [r["_id"] for r in results]
    counts = [r["count"] for r in results]
    return jsonify({"labels": labels, "counts": counts})


@app.post("/api/classify")
def classify():
    """
    Accept multipart/form-data with field 'image' (JPEG or PNG, max 5 MB).
    Uses a Pillow demo classifier: labels by dominant colour channel.
    Saves result to 'image_predictions' MongoDB collection.
    Returns { label, confidence }.
    """
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "image is required"}), 400

    # Check MIME type reported by the browser
    if file.mimetype not in ALLOWED_TYPES:
        return jsonify({"error": "Only JPEG or PNG images are allowed"}), 400

    # Open with Pillow to catch corrupted or fake image files
    try:
        image = Image.open(file.stream).convert("RGB")
    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "Invalid or corrupted image"}), 400

    # ── Demo classifier ───────────────────────────────────────────────────────
    # Resize to 50×50 for speed, then compare the average R, G, B values
    small = image.resize((50, 50))
    r, g, b = ImageStat.Stat(small).mean
    total = (r + g + b) or 1   # avoid division by zero for all-black images
    channels = {"red-dominant": r, "green-dominant": g, "blue-dominant": b}
    label = max(channels, key=channels.get)
    confidence = round(channels[label] / total, 2)

    image_predictions.insert_one({
        "label": label,
        "confidence": confidence,
        "width": image.width,
        "height": image.height,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return jsonify({"label": label, "confidence": confidence})


if __name__ == "__main__":
    app.run(debug=True, port=5000)