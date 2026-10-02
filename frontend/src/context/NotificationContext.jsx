import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "./AuthContext";
import { MessageSquare, UserPlus, X, Bell, Shield } from "lucide-react";

const NotificationContext = createContext(null);

/**
 * Web Audio API gentle synthesizer sound effect
 * Zero external mp3 dependencies, 100% reliable across browsers
 */
function playChime(type = "message") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === "message") {
      // Crisp 2-tone ping (C5 -> E5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Friendly ascending chime (A4 -> C#5 -> E5)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.09);
      osc.frequency.setValueAtTime(659.25, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (_) {}
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toasts, setToasts] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [permission, setPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  // Cached tracking IDs so notifications only fire on genuinely NEW events
  const knownMessageTimestampsRef = useRef({});
  const knownFriendRequestIdsRef = useRef(new Set());
  const initialFetchDoneRef = useRef(false);

  // Request native desktop notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch (_) {
      return "denied";
    }
  }, []);

  // Dismiss a specific toast
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Show a notification toast + optional native alert + sound
  const addNotification = useCallback(
    ({ type = "message", title, message, avatarUrl, link, convId }) => {
      // Play sound
      playChime(type);

      // Desktop HTML5 Notification if granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          const n = new Notification(title, {
            body: message,
            icon: avatarUrl || "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
            if (link) navigate(link);
          };
        } catch (_) {}
      }

      // In-app Toast Banner
      const toastId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newToast = {
        id: toastId,
        type,
        title,
        message,
        avatarUrl,
        link,
        convId,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        dismissToast(toastId);
      }, 6000);
    },
    [navigate, dismissToast]
  );

  // Poll for background messages & friend requests
  useEffect(() => {
    if (!user?.id) {
      setUnreadMessagesCount(0);
      setPendingRequestsCount(0);
      knownMessageTimestampsRef.current = {};
      knownFriendRequestIdsRef.current = new Set();
      initialFetchDoneRef.current = false;
      return;
    }

    let isMounted = true;

    async function checkUpdates() {
      try {
        // 1. Check Conversations
        const convRes = await api.get("/cyberchat/conversations").catch(() => null);
        if (convRes?.data && isMounted) {
          const conversations = Array.isArray(convRes.data)
            ? convRes.data
            : convRes.data.conversations || [];

          let unreadTotal = 0;

          conversations.forEach((c) => {
            const peer = c.peer || {};
            const lastMsg = c.lastMessage;

            if (lastMsg) {
              const msgTime = new Date(lastMsg.createdAt).getTime();
              const prevTime = knownMessageTimestampsRef.current[c.id];

              // Check if new message arrived from peer (not sent by me)
              if (
                initialFetchDoneRef.current &&
                prevTime &&
                msgTime > prevTime &&
                lastMsg.senderId !== user.id
              ) {
                addNotification({
                  type: "message",
                  title: peer.displayName || "Cyber Guard",
                  message: "Sent you an encrypted message",
                  avatarUrl: peer.avatarUrl,
                  link: `/cyberchat?conv=${c.id}`,
                  convId: c.id,
                });
                unreadTotal += 1;
              }

              knownMessageTimestampsRef.current[c.id] = msgTime;
            }
          });

          setUnreadMessagesCount(unreadTotal);
        }

        // 2. Check Friend Requests
        const reqRes = await api.get("/cyberchat/friend-requests").catch(() => null);
        if (reqRes?.data && isMounted) {
          const incoming = reqRes.data.incoming || [];
          setPendingRequestsCount(incoming.length);

          incoming.forEach((r) => {
            if (initialFetchDoneRef.current && !knownFriendRequestIdsRef.current.has(r.id)) {
              addNotification({
                type: "friend_request",
                title: "Friend Request",
                message: `${r.sender?.displayName || "A cyber guard"} wants to connect on CyberChat`,
                avatarUrl: r.sender?.avatarUrl,
                link: "/cyberchat?tab=requests",
              });
            }
            knownFriendRequestIdsRef.current.add(r.id);
          });
        }

        initialFetchDoneRef.current = true;
      } catch (_) {}
    }

    // Initial check immediately
    checkUpdates();

    // Poll every 6 seconds
    const interval = setInterval(checkUpdates, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id, addNotification]);

  // Update document title with unread badge counter
  useEffect(() => {
    const total = unreadMessagesCount + pendingRequestsCount;
    if (total > 0) {
      document.title = `(${total}) CyberGuard Ghana`;
    } else {
      document.title = "CyberGuard Ghana";
    }
  }, [unreadMessagesCount, pendingRequestsCount]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        unreadCount: unreadMessagesCount + pendingRequestsCount,
        unreadMessagesCount,
        pendingRequestsCount,
        permission,
        requestPermission,
        addNotification,
        dismissToast,
        playChime,
      }}
    >
      {children}

      {/* Floating In-App Notifications Toast Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              if (toast.link) navigate(toast.link);
              dismissToast(toast.id);
            }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer hover:border-[#0056D2] hover:shadow-blue-500/10 transition-all duration-200 transform animate-in fade-in slide-in-from-top-3"
          >
            {/* Avatar / Icon */}
            <div className="relative shrink-0">
              {toast.avatarUrl ? (
                <img
                  src={toast.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0056D2] flex items-center justify-center text-xl border border-blue-100">
                  <i className="fa-solid fa-circle-user"></i>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0056D2] text-white flex items-center justify-center text-[9px] shadow-xs">
                {toast.type === "friend_request" ? (
                  <UserPlus className="w-2.5 h-2.5" />
                ) : (
                  <MessageSquare className="w-2.5 h-2.5" />
                )}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 truncate">{toast.title}</p>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">Just now</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#0056D2]">
                <span>Open in CyberChat</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
