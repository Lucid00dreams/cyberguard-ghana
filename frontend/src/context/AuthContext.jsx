import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api from "../utils/api";
import { initializeUserE2EE } from "../utils/e2eeCrypto";

const AuthContext = createContext(null);

// 15 minutes session timeout in milliseconds (15 * 60 * 1000)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const LAST_ACTIVITY_KEY = "cg_last_activity";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const logout = useCallback(() => {
    localStorage.removeItem("cg_token");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  }, []);

  const triggerSessionTimeout = useCallback(() => {
    logout();
    setSessionTimedOut(true);
  }, [logout]);

  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Throttle writing to localStorage to at most once every 3 seconds
    if (now - lastActivityRef.current > 3000) {
      lastActivityRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }
  }, []);

  const checkInactivity = useCallback(() => {
    if (!user) return;
    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const lastActivity = storedLastActivity ? parseInt(storedLastActivity, 10) : lastActivityRef.current;
    const timeElapsed = Date.now() - lastActivity;

    if (timeElapsed >= SESSION_TIMEOUT_MS) {
      triggerSessionTimeout();
    }
  }, [user, triggerSessionTimeout]);

  // Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem("cg_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Check if session was already expired prior to mount
    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (storedLastActivity) {
      const lastActivity = parseInt(storedLastActivity, 10);
      if (Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
        triggerSessionTimeout();
        setLoading(false);
        return;
      }
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        const now = Date.now();
        lastActivityRef.current = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      })
      .catch(() => {
        localStorage.removeItem("cg_token");
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      })
      .finally(() => setLoading(false));
  }, [triggerSessionTimeout]);
 
  // Background E2EE Cryptographic Key Sync for CyberChat
  useEffect(() => {
    if (!user?.id) return;
    initializeUserE2EE(user.id)
      .then(({ publicPayload }) => {
        api.post("/cyberchat/keys", publicPayload).catch(() => {});
      })
      .catch(() => {});
  }, [user?.id]);

  // Activity event listeners & Periodic background checking
  useEffect(() => {
    if (!user) return;

    // Track user interaction events
    const activityEvents = ["mousemove", "keydown", "mousedown", "click", "scroll", "touchstart", "pointermove"];
    activityEvents.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    // Listen for custom session-expired event from API 401 interceptor
    const handleExpiredEvent = () => triggerSessionTimeout();
    window.addEventListener("cg-session-expired", handleExpiredEvent);

    // Periodically check elapsed inactivity (every 10 seconds)
    const intervalId = setInterval(checkInactivity, 10000);

    // Check immediately on tab re-focus or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
      window.removeEventListener("cg-session-expired", handleExpiredEvent);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [user, updateActivity, checkInactivity, triggerSessionTimeout]);

  function login(token, userData) {
    localStorage.setItem("cg_token", token);
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    setUser(userData);
    setSessionTimedOut(false);
  }

  function updateUser(updatedData) {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  }

  function dismissSessionTimeoutModal() {
    setSessionTimedOut(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        sessionTimedOut,
        dismissSessionTimeoutModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
