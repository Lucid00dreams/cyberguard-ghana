import axios from "axios";

const defaultBaseUrl = import.meta.env.PROD
  ? "https://cyberguard-ghana.onrender.com/api"
  : "http://localhost:4000/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  timeout: 30000, // 30s timeout handles Render cold starts gracefully
});

let isWarmedUp = false;

/**
 * Fires a fast non-blocking background ping to wake up the backend server immediately
 * when the frontend opens, eliminating cold-start delays before the user takes action.
 */
export function warmupBackend() {
  if (isWarmedUp || typeof window === "undefined") return;
  isWarmedUp = true;
  const baseUrl = import.meta.env.VITE_API_URL || defaultBaseUrl;
  const healthUrl = baseUrl.replace(/\/api\/?$/, "") + "/health";
  fetch(healthUrl, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem("cg_token");
      if (token) {
        localStorage.removeItem("cg_token");
        localStorage.removeItem("cg_user");
        window.dispatchEvent(new Event("cg-session-expired"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
