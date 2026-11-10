import { useState, useEffect } from "react";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  isPushSupported,
  subscribeToPushNotifications,
  syncPushSubscriptionIfPermitted,
} from "../utils/pushManager";
import api from "../utils/api";

const DISMISSED_KEY = "cyberguard_push_banner_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PushNotificationBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("7:00 AM");

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }

    if (!isPushSupported()) {
      return;
    }

    // If permission was already granted previously, automatically sync device subscription
    if (Notification.permission === "granted") {
      syncPushSubscriptionIfPermitted();
      return;
    }

    // If already denied, do not annoy user
    if (Notification.permission === "denied") {
      return;
    }

    // Check dismissal cooldown
    const lastDismissed = localStorage.getItem(DISMISSED_KEY);
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < DISMISS_COOLDOWN_MS) {
      return;
    }

    // Fetch dynamic schedule time
    api
      .get("/daily-tips/schedule")
      .then((res) => {
        if (res.data?.displayTime) {
          setScheduleTime(res.data.displayTime);
        }
      })
      .catch(() => {});

    // Delay showing banner slightly so initial page load feels calm
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user]);

  async function handleEnablePush() {
    setSubscribing(true);
    try {
      await subscribeToPushNotifications();
      setSubscribed(true);
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    } catch (err) {
      console.warn("[PushBanner] User dismissed or error:", err.message);
      handleDismiss();
    } finally {
      setSubscribing(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        role="region"
        aria-label="Push notifications subscription"
        className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/90 shadow-xl p-4 text-slate-800"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[#0056D2]">
            {subscribed ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <Bell className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {subscribed ? "Daily Safety Alerts Active" : "Get Daily Cyber Safety Tips"}
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              {subscribed
                ? `You'll receive daily security tips right on your lock screen at ${scheduleTime} GMT.`
                : `Receive free lock-screen safety briefings every morning at ${scheduleTime} GMT. Zero SMS charges.`}
            </p>

            {!subscribed && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={subscribing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                >
                  {subscribing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  <span>Enable Push Alerts</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
