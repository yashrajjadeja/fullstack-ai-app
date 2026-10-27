import axios from 'axios';

// VITE_API_URL is injected at build time (set it in Docker args or Vercel env).
// Falls back to localhost for local development.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000,
});

export default api;