# Intelligent Web Dashboard

A full-stack university practical project: **React (Vite)** frontend + **Flask** backend + **MongoDB** database.

---

## Features

| Feature | Description |
|---|---|
| **Sentiment Analysis** | Type or speak text; Flask returns positive / negative / neutral using VADER |
| **Voice Input** | Web Speech API (Chrome/Edge) fills the text box in real time |
| **Image Classification** | Upload a JPEG/PNG; Flask labels it by dominant colour using Pillow |
| **Dashboard** | Bar and line charts showing label counts (Chart.js) |
| **Prediction History** | Table of the 20 most-recent sentiment predictions from MongoDB |

---

## Local Setup

### Prerequisites
- Python 3.13, Node.js 22, Git, MongoDB running on `localhost:27017`

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create backend/.env (do NOT commit this file):
# MONGO_URI=mongodb://localhost:27017
# DB_NAME=ai_fullstack
# FRONTEND_ORIGIN=http://localhost:5173

flask --app app run --debug --port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # opens http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Body / Params | Returns |
|---|---|---|---|
| `GET` | `/api/health` | — | `{ status, message }` |
| `POST` | `/api/sentiment` | `{ text }` JSON | `{ text, label, score }` |
| `POST` | `/api/classify` | `image` file (multipart) | `{ label, confidence }` |
| `GET` | `/api/predictions` | — | Array of last 20 records |
| `GET` | `/api/stats` | — | `{ labels, counts }` for charts |

Error responses are always JSON with an `error` key and the correct HTTP status code (400, 413, 500).

---

## Docker

Make sure Docker Desktop is running, then from the project root:

```bash
# Build and start all three services (MongoDB, Flask, Nginx+React)
docker compose up --build

# App is at http://localhost:8080
# Flask API is at http://localhost:5000

# Useful commands
docker images          # list built images
docker ps              # list running containers
docker compose down    # stop and remove containers
```

> **Note:** Secrets are never stored in Docker files. The `backend/.env` file is excluded via `.dockerignore`.

---

## Deployment (Render + Vercel + MongoDB Atlas)

Deploy in this order: **1. Atlas → 2. Render → 3. Vercel**

### 1. MongoDB Atlas
- Create a free cluster at mongodb.com/atlas
- Add a database user and copy the connection string

### 2. Backend on Render
- New → Web Service → select your repo
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Environment Variables:
  - `MONGO_URI` = your Atlas connection string
  - `DB_NAME` = `ai_fullstack`
  - `FRONTEND_ORIGIN` = your Vercel URL (set after step 3)

### 3. Frontend on Vercel
- New Project → select your repo
- Root Directory: `frontend`
- Framework: Vite
- Environment Variable:
  - `VITE_API_URL` = `https://your-backend.onrender.com/api`

---

## Live Demo

- **Frontend:** `<your Vercel URL>`
- **Backend:** `<your Render URL>`

---

## Screenshots

_(Add screenshots here for your practical report)_

1. Sentiment page with result
2. Speech input filling the text box
3. Image Classifier with preview and result
4. Dashboard with bar and line charts
5. History table
6. `docker images` and `docker ps` output
7. App running at `localhost:8080`
8. Live Vercel URL
