import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

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
        window.dispatchEvent(new Event("cg-session-expired"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
