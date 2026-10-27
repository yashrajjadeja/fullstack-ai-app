# Full-Stack Practical: Remaining Steps (Experiments 8 to 12)

Project: **Intelligent Web Dashboard** (React + Flask + MongoDB)
Based on your note: *Full Stack Development: React, Flask, MongoDB (Beginner Notes)*

---

## 1. Progress Tracker

| Part | What it is | Status |
|---|---|---|
| Setup | Node, Python, Git, MongoDB, VS Code, Postman | Done |
| Git | Repository, `.gitignore` | Done (commit regularly) |
| Exp 5 | Flask sentiment API + MongoDB | Done |
| Exp 6 | React connected to Flask | Done |
| Exp 7 | Dashboard with charts (`/api/stats`) | Done (assuming your charts show) |
| **Exp 8** | **Image classification upload** | **Remaining** |
| **Exp 9** | **Web Speech API (voice input)** | **Remaining** |
| **Exp 10** | **Integrated app (navigation + History page)** | **Remaining** |
| **Exp 11** | **Docker** | **Remaining** |
| **Exp 12** | **Deployment + final documentation** | **Remaining** |

**Golden rule from your notes:** every feature follows the same cycle:
`User action → React state → HTTP request → Flask route → database/model → JSON response → React UI`

**Before starting each experiment:** make sure Flask (port 5000), React (`npm run dev`, port 5173) and MongoDB are running. Commit your work after each experiment.

---

## 2. Experiment 8: Image Classification Interface

**Goal:** React uploads an image → Flask receives it (`multipart/form-data`) → Pillow validates it → a model gives a label and confidence → JSON returns to React.

### Note about the "model"
Your notes use a placeholder model. For a beginner practical, this guide uses a **simple Pillow-based demo classifier** that labels an image by its dominant colour (red, green or blue). It teaches the full upload pipeline without installing heavy libraries like TensorFlow. If your teacher requires a real deep-learning model (for example MobileNetV2), the upload and API flow stays exactly the same. You would only replace the "classifier" part of the route.

### Step 1: Backend route

Open `backend/app.py`. Add these imports at the top with the others:

```python
from PIL import Image, ImageStat, UnidentifiedImageError
```

Right after `predictions = db["predictions"]`, add:

```python
image_predictions = db["image_predictions"]

ALLOWED_TYPES = {"image/jpeg", "image/png"}
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB limit
```

Add these routes above the `if __name__ == "__main__":` line:

```python
@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "Image too large (max 5 MB)"}), 413


@app.post("/api/classify")
def classify():
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "image is required"}), 400

    if file.mimetype not in ALLOWED_TYPES:
        return jsonify({"error": "Only JPEG or PNG images are allowed"}), 400

    try:
        image = Image.open(file.stream).convert("RGB")
    except (UnidentifiedImageError, OSError):
        return jsonify({"error": "Invalid or corrupted image"}), 400

    # Demo classifier: find the dominant colour channel
    small = image.resize((50, 50))
    r, g, b = ImageStat.Stat(small).mean
    total = (r + g + b) or 1
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
```

Save the file. Flask restarts by itself.

### Step 2: Frontend page

Create `frontend/src/pages/ImageClassifier.jsx`:

```jsx
import { useState } from 'react';
import api from '../services/api';

export default function ImageClassifier() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const chosen = e.target.files[0];
    setResult(null);
    setError('');
    setFile(chosen || null);
    setPreview(chosen ? URL.createObjectURL(chosen) : '');
  }

  async function handleUpload() {
    if (!file) {
      setError('Please choose an image first');
      return;
    }
    const formData = new FormData();
    formData.append('image', file); // key must match request.files.get('image')

    setLoading(true);
    setError('');
    setResult(null);
    try {
      // axios sets the multipart header (with boundary) automatically
      const res = await api.post('/classify', formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Is Flask running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 16 }}>
      <h2>Image Classifier</h2>
      <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />

      {preview && (
        <div style={{ marginTop: 12 }}>
          <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 250 }} />
        </div>
      )}

      <button onClick={handleUpload} disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Classifying...' : 'Upload & Classify'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <p>
          Class: <b>{result.label}</b> | Confidence: <b>{result.confidence}</b>
        </p>
      )}
    </div>
  );
}
```

### Step 3: Add it to the router

In `frontend/src/App.jsx`:
1. Add `import ImageClassifier from './pages/ImageClassifier';`
2. Add `<Link to="/image">Image</Link>` in the navbar.
3. Add `<Route path="/image" element={<ImageClassifier />} />` in `<Routes>`.

### Step 4: Test

1. Open `http://localhost:5173/image`.
2. Choose a JPEG or PNG. A preview should appear.
3. Click **Upload & Classify**. You should see a class and confidence.
4. Test the safety checks:
   - Upload a `.txt` file renamed to `.png`. You should get "Invalid or corrupted image".
   - Upload an image larger than 5 MB. You should get "Image too large".

### Common errors
| Problem | Fix |
|---|---|
| "image is required" | The key in `formData.append('image', ...)` must equal `request.files.get('image')` |
| 415 / 400 errors | Check the file is really JPEG or PNG |
| Network Error | Flask isn't running |

**Screenshots for the practical:** preview with result, Postman upload (Body → form-data, key `image`, type File), and the Network tab showing the multipart request.

**Commit:** `git add .` then `git commit -m "Add image classification upload"`

---

## 3. Experiment 9: Web Speech API (Voice Input)

**Goal:** a microphone button uses the **browser's** speech recognition to fill the text box. No backend change is needed. The text then goes through the same sentiment API.

**Browser note:** works in **Chrome and Edge**. Firefox does not support it, so always keep the text box as a fallback. It works on `localhost` and needs microphone permission.

### Step 1: Replace `frontend/src/pages/Sentiment.jsx` with the version below

```jsx
import { useState, useRef } from 'react';
import api from '../services/api';

export default function Sentiment() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  function toggleMic() {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const spoken = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setText(spoken);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError('Microphone error. Check browser permission.');
    };

    recognitionRef.current = recognition;
    setError('');
    recognition.start();
    setListening(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/sentiment', { text });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed. Is Flask running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 16 }}>
      <h2>Sentiment Analysis</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={4}
          style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or use the microphone"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={toggleMic}>
            {listening ? 'Stop listening' : '🎤 Speak'}
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <p>
          Result: <b>{result.label}</b> (score {result.score})
        </p>
      )}
    </div>
  );
}
```

### Step 2: Test

1. Open the Sentiment page in **Chrome or Edge**.
2. Click **🎤 Speak**. Allow the microphone when the browser asks.
3. Say "I really love this project". The words should appear in the box while you speak.
4. Click **Stop listening**, then **Analyze**. You should get **positive**.

**Viva answer:** *"Speech-to-text happens inside the browser, so no audio is sent to Flask. Only the final text goes to `/api/sentiment`."*

**Commit:** `git commit -am "Add speech input"` (use `git add .` first if there are new files)

---

## 4. Experiment 10: Integrated Application

**Goal:** one complete app with navigation, a consistent layout, and a **History page** that reads saved predictions from MongoDB. You already have most of the parts.

### Step 1: Create `frontend/src/pages/History.jsx`

```jsx
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function History() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/predictions')
      .then((res) => setItems(res.data))
      .catch(() => setError('Backend unavailable'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;
  if (error) return <p style={{ color: 'red', padding: 16 }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
      <h2>Prediction History</h2>
      {items.length === 0 ? (
        <p>No predictions yet. Analyze some text first.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
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
```

### Step 2: Final `frontend/src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sentiment from './pages/Sentiment';
import Dashboard from './pages/Dashboard';
import ImageClassifier from './pages/ImageClassifier';
import History from './pages/History';

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 'bold' : 'normal',
  textDecoration: isActive ? 'underline' : 'none',
});

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #888', flexWrap: 'wrap' }}>
        <NavLink to="/" style={linkStyle} end>Sentiment</NavLink>
        <NavLink to="/image" style={linkStyle}>Image</NavLink>
        <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/history" style={linkStyle}>History</NavLink>
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
```

### Step 3: End-to-end test

Run through the full cycle from your notes: **form → API → DB → response → chart/UI**.

1. **Sentiment page:** type or speak text → Analyze → see result.
2. **History page:** the new entry appears at the top.
3. **Dashboard page:** the bar chart count increased.
4. **Image page:** upload an image → see class and confidence.
5. Test on a **narrow browser window** (drag the edge) to check the layout is usable on small screens.

**Commit:** `git add .` then `git commit -m "Integrate all pages with navigation and history"`

---

## 5. Experiment 11: Docker

**Goal:** package the app so it runs the same way anywhere.

**Concept to remember:** an **image** is the package/template; a **container** is a running instance of that image.

### Step 0: Prepare

1. Install **Docker Desktop** and open it (wait until it says Docker is running).
2. Check it works: `docker --version`
3. Update `frontend/src/services/api.js` so the API address can change without editing code:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000,
});

export default api;
```

### Step 1: Backend files

**`backend/Dockerfile`**
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["flask", "--app", "app", "run", "--host=0.0.0.0", "--port=5000"]
```
(Your notes use `python:3.12-slim`. Either works. 3.13 matches the Python on your PC.)

**`backend/.dockerignore`**
```
.venv
__pycache__
*.pyc
.env
```

### Step 2: Frontend files

**`frontend/Dockerfile`** (multi-stage build, as described in your notes)
```dockerfile
# Stage 1: build the React app
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve the built files with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

**`frontend/nginx.conf`** (makes page refresh work with React Router)
```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri /index.html;
  }
}
```

**`frontend/.dockerignore`**
```
node_modules
dist
```

### Step 3: `docker-compose.yml` (in the project root, next to `frontend` and `backend`)

```yaml
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongo:27017
      DB_NAME: ai_fullstack
      FRONTEND_ORIGIN: http://localhost:8080
    depends_on:
      - mongo

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:5000/api
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Inside Docker, the database address is `mongo` (the service name), not `localhost`.

### Step 4: Run

Stop your normal Flask and `npm run dev` first, so ports 5000 stays free. Then, in the project root:

```
docker build -t fullstack-backend ./backend
docker run --rm -p 5000:5000 fullstack-backend
```
(This is the exact command from your notes. The backend alone starts but can't reach MongoDB. That's fine for showing the image builds and runs. Stop it with Ctrl + C.)

Now run the full stack with Compose:

```
docker compose up --build
```

Open `http://localhost:8080`. The whole app should work, with MongoDB also running in a container.

Useful commands:
```
docker images          # list images
docker ps              # list running containers
docker compose down    # stop everything
```

**Never put secrets in Dockerfiles or in Git.** Passwords and keys go in environment variables.

**Screenshots:** `docker images`, `docker ps`, and the app running at `localhost:8080`.

**Commit:** `git add .` then `git commit -m "Add Docker setup"`

---

## 6. Experiment 12: Deployment and Final Project

**Architecture:** React on **Vercel** → Flask on **Render** → MongoDB on **Atlas**. Deploy in this order: database, backend, frontend.

### Step 1: Push your code to GitHub

```
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```
Check on GitHub that `.env` and `.venv` are **not** uploaded. Create the repository on github.com first, if you haven't.

### Step 2: MongoDB Atlas (cloud database)

1. Create a free account at mongodb.com/atlas and create a free cluster.
2. **Database Access:** create a database user (username and password). Save the password.
3. **Network Access:** add an IP address. For a practical, "Allow access from anywhere" (`0.0.0.0/0`) is the easy option, since hosting platforms change IPs. Tighten this for real projects.
4. Click **Connect → Drivers** and copy the connection string. It looks like `mongodb+srv://user:<password>@cluster0.xxxx.mongodb.net/`. Replace `<password>` with your real password. If the password has special characters, URL-encode them.

### Step 3: Prepare the backend

1. Install a production server and update the requirements:
   ```
   cd backend
   .venv\Scripts\activate
   python -m pip install gunicorn
   python -m pip freeze > requirements.txt
   ```
2. Commit and push. Flask's `debug=True` server is for development only. Gunicorn is the production server.

### Step 4: Deploy the backend on Render

1. Sign in at render.com with GitHub. Click **New → Web Service** and select your repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
3. Add **Environment Variables:**
   - `MONGO_URI` = your Atlas connection string
   - `DB_NAME` = `ai_fullstack`
   - `FRONTEND_ORIGIN` = (put a temporary value now; update after Step 5)
4. Deploy. Render gives a URL like `https://your-backend.onrender.com`.
5. **Test it:** open `https://your-backend.onrender.com/api/health`.

Free Render services go to sleep when unused, so the first request can take around a minute.

### Step 5: Deploy the frontend on Vercel

1. Add a file `frontend/vercel.json` (so refreshing `/dashboard` doesn't give a 404):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
2. Commit and push.
3. Sign in at vercel.com with GitHub. Click **Add New → Project** and select your repository.
4. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Vite (usually detected automatically)
   - **Environment Variable:** `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Deploy. Vercel gives a URL like `https://your-app.vercel.app`.

### Step 6: Lock down CORS

Go back to Render → Environment and set `FRONTEND_ORIGIN` to your exact Vercel URL (`https://your-app.vercel.app`, no trailing slash). Redeploy the backend. This makes CORS allow **only** your deployed frontend.

### Step 7: Test end to end on the live URL

Sentiment → Image → Dashboard → History. Fix anything with the troubleshooting table below.

### Development vs production (viva point)

| Development | Production |
|---|---|
| localhost URLs | HTTPS public URLs |
| Flask `debug=True` | Gunicorn |
| Local MongoDB | MongoDB Atlas |
| `.env` file on your PC | Variables in Render/Vercel settings |
| Open CORS | CORS limited to your frontend |

---

## 7. README.md for your project (required by the final checklist)

Create `README.md` in the project root and fill in your details:

```markdown
# Intelligent Web Dashboard

A full-stack app: React (Vite) + Flask + MongoDB.

## Features
- Sentiment analysis (typed or voice input)
- Image classification (upload)
- Model performance dashboard (Chart.js)
- Prediction history stored in MongoDB

## Setup
### Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
(create .env with MONGO_URI, DB_NAME, FRONTEND_ORIGIN)
flask --app app run --debug --port 5000

### Frontend
cd frontend
npm install
npm run dev

## API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Server check |
| POST | /api/sentiment | Sentiment prediction |
| POST | /api/classify | Image classification |
| GET | /api/predictions | Saved predictions |
| GET | /api/stats | Dashboard statistics |

## Docker
docker compose up --build   (app at http://localhost:8080)

## Live Demo
Frontend: <your Vercel URL>
Backend: <your Render URL>

## Screenshots
(add screenshots here)
```

---

## 8. Troubleshooting Quick Table

| Problem | Likely reason | First fix |
|---|---|---|
| CORS error in browser | Origin not allowed | Check `FRONTEND_ORIGIN` matches the frontend URL exactly |
| `ERR_CONNECTION_REFUSED` | Flask not running / wrong port | Check the Flask terminal and `baseURL` |
| 404 on API | Wrong endpoint path | Compare the React URL with the Flask route |
| 500 from Flask | Backend exception | Read the Flask traceback |
| Mongo connection refused | MongoDB not running / wrong URI | Start the MongoDB service, check `MONGO_URI` |
| Atlas timeout | IP or user issue | Check Atlas Network Access and the database user |
| Image upload empty | FormData key mismatch | Key must be `image` on both sides |
| Chart doesn't render | Chart.js not registered | Check the `ChartJS.register(...)` call |
| Docker: backend can't reach Mongo | Using `localhost` inside a container | Use `mongodb://mongo:27017` in Compose |
| Page refresh gives 404 after deploy | SPA routing | Add `vercel.json` / `nginx.conf` rewrites |
| GitHub push rejected | History mismatch / auth | `git pull origin main`, then verify the remote URL |

---

## 9. Final Project Checklist (from your notes, Section 24)

- [ ] **Environment ready:** Node.js, npm, Python, Git, MongoDB, VS Code
- [ ] **Git ready:** repository initialized, `.gitignore` created, GitHub remote connected
- [ ] **Frontend ready:** React/Vite pages, reusable components, responsive layout
- [ ] **Backend ready:** Flask app, REST routes, validation, error handling
- [ ] **Database ready:** MongoDB connection and saved records
- [ ] **API connection ready:** React calls Flask and displays JSON
- [ ] **Experiments ready:** sentiment, charts, image upload/classification, speech input
- [ ] **Container ready:** Docker image builds and runs locally
- [ ] **Deployment ready:** frontend and backend deployed with correct environment variables and restricted CORS
- [ ] **Documentation ready:** README with setup, commands, API endpoints and screenshots

---

## 10. Screenshot Checklist for Submission

1. Postman: `/api/health`, `/api/sentiment` (success and 400 error)
2. React Sentiment page with a result
3. Browser Network tab showing the `sentiment` request
4. Dashboard with line and bar charts
5. Image page with preview and result
6. Speech input filling the text box
7. History page with MongoDB data
8. `docker images`, `docker ps`, app at `localhost:8080`
9. Live Vercel URL working
10. GitHub repository page and commit history

---

## 11. Likely Viva Questions

- **Why doesn't React connect directly to MongoDB?** Flask validates input, runs the logic/model and protects the database. React only knows the API contract.
- **What is CORS and why is it needed?** The browser blocks requests between different origins (ports). Flask-CORS tells the browser which frontend origin is allowed.
- **Why use a `.env` file?** To keep secrets and settings out of source code and out of Git.
- **Image vs container?** An image is the template; a container is a running instance of it.
- **Why Gunicorn in production?** Flask's built-in server is for development only.
- **What does `useEffect` do?** It runs code (like an API call) after the component renders; with `[]` it runs once on load.
- **Where does speech recognition happen?** In the browser, not on the server.
