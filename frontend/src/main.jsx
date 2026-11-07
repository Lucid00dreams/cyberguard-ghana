import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Ensure PWA & Web Push service worker is registered immediately
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const registerSw = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        reg.update();
      })
      .catch((err) => {
        console.warn("[ServiceWorker] Registration skipped:", err.message);
      });
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    registerSw();
  } else {
    window.addEventListener("load", registerSw, { once: true });
  }
}

