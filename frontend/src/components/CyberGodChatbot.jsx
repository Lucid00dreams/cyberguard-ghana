import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useDragControls } from "framer-motion";
import {
  Sparkles,
  Send,
  MessageSquare,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Lock,
  LogIn,
  UserPlus,
  Loader2,
  Bot,
  Zap,
  History,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  Shield,
  HelpCircle,
  Move,
  GripVertical
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import FormattedLessonContent from "./FormattedLessonContent";

/**
 * 3D Robot Avatar Component for CyberGod (Elevated for White & Multi-Theme)
 */
function Robot3DAvatar({ size = "md", online = true }) {
  const dimMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-13 h-13",
    xl: "w-18 h-18",
  };

  return (
    <div className={`relative ${dimMap[size] || dimMap.md} shrink-0 group rounded-full`}>
      {/* Soft emerald/cyan glow ring */}
      <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-slate-900 rounded-full blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
      
      {/* Sleek Chassis */}
      <div className="relative w-full h-full bg-slate-950 rounded-full border border-slate-700/80 flex flex-col items-center justify-center shadow-md overflow-hidden p-1">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px] opacity-25" />
        
        {/* Face: Glowing Eyes + Smile */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-eye-blink" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-eye-blink" />
          </div>
          <svg viewBox="0 0 24 10" className="w-4 h-2 overflow-visible animate-smile-pulse mt-0.5">
            <path d="M 2 2 Q 12 9 22 2" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" fill="none" className="drop-shadow-[0_0_6px_#34d399]" />
          </svg>
        </div>
      </div>

      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
      )}
    </div>
  );
}

export default function CyberGodChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dragConstraintsRef = useRef(null);
  const isDraggingRef = useRef(false);
  const windowDragControls = useDragControls();

  const [isOpen, setIsOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const loadingSteps = [
    "Reviewing safety question...",
    "Consulting protection guidelines...",
    "Formulating response...",
  ];

  // Progressive contextual loading indicator when waiting for assistant response
  useEffect(() => {
    if (!loading) {
      setLoadingPhase(0);
      return;
    }
    const timer1 = setTimeout(() => setLoadingPhase(1), 1800);
    const timer2 = setTimeout(() => setLoadingPhase(2), 4000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load sessions when widget opens or user logs in
  useEffect(() => {
    if (user && isOpen) {
      loadSessions();
    }
  }, [user, isOpen]);

  async function loadSessions() {
    setFetchingHistory(true);
    try {
      const res = await api.get("/cybergod/sessions");
      setSessions(res.data || []);
      if (res.data && res.data.length > 0 && !currentSessionId) {
        selectSession(res.data[0].id);
      } else if (!res.data || res.data.length === 0) {
        startNewSession();
      }
    } catch (err) {
      console.warn("Failed to load CyberGod chat history:", err);
    } finally {
      setFetchingHistory(false);
    }
  }

  async function selectSession(sessionId) {
    setCurrentSessionId(sessionId);
    setShowDrawer(false);
    try {
      const res = await api.get(`/cybergod/sessions/${sessionId}`);
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.warn("Failed to fetch session messages:", err);
    }
  }

  async function startNewSession() {
    setShowDrawer(false);
    if (!user) return;
    try {
      const res = await api.post("/cybergod/sessions", { title: "New CyberGod Session" });
      setCurrentSessionId(res.data.id);
      setMessages(res.data.messages || []);
      loadSessions();
    } catch (err) {
      console.warn("Failed to create new session:", err);
    }
  }

  async function deleteSession(e, sessionId) {
    e.stopPropagation();
    try {
      await api.delete(`/cybergod/sessions/${sessionId}`);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          selectSession(updated[0].id);
        } else {
          startNewSession();
        }
      }
    } catch (err) {
      console.warn("Failed to delete session:", err);
    }
  }

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      return;
    }

    const userQuery = input.trim();
    setInput("");

    // Optimistically render user message
    const tempId = `temp-${Date.now()}`;
    const tempUserMsg = { id: tempId, sender: "user", content: userQuery };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post("/cybergod/chat", {
        sessionId: currentSessionId,
        message: userQuery,
      });

      if (res.data?.sessionId && res.data.sessionId !== currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        loadSessions();
      }

      if (res.data?.botMessage) {
        const confirmedUserMsg = res.data.userMessage || {
          id: `user-${Date.now()}`,
          sender: "user",
          content: userQuery,
        };

        setMessages((prev) => [
          ...prev.filter((m) => !(m?.id && String(m.id).startsWith("temp-"))),
          confirmedUserMsg,
          res.data.botMessage,
        ]);
      }
    } catch (err) {
      console.error("CyberGod AI error:", err);
      setMessages((prev) => [
        ...prev.filter((m) => !(m?.id && String(m.id).startsWith("temp-"))),
        { id: `user-${Date.now()}`, sender: "user", content: userQuery },
        {
          id: `err-${Date.now()}`,
          sender: "cybergod",
          content: "⚠️ **System Notice**: I encountered a temporary connection issue. Please check your network or try asking your question again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestionChips = [
    "📜 How do I get my course certificate?",
    "🛡️ How to avoid MTN MoMo cash scams?",
    "🚨 Report a cyber extortion threat",
    "⚖️ What is Ghana Cybersecurity Act 1038?",
  ];

  return (
    <div
      ref={dragConstraintsRef}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden p-2 sm:p-4 font-sans"
    >
      {/* ------------------------------------------------------------ */}
      {/* FLOATING LAUNCHER BUTTON (DRAGGABLE ANYWHERE ON SCREEN)       */}
      {/* ------------------------------------------------------------ */}
      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0.08}
        whileDrag={{ scale: 1.08, cursor: "grabbing" }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        className={`pointer-events-auto absolute bottom-16 right-3 md:bottom-6 md:right-6 touch-none cursor-grab active:cursor-grabbing select-none transition-opacity duration-200 ${
          isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"
        }`}
        style={{ touchAction: "none" }}
      >
        <button
          type="button"
          onClick={(e) => {
            if (isDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setIsOpen(true);
          }}
          title="Chat with CyberGuard AI • Drag anywhere on screen"
          aria-label="Open CyberGuard Chatbot"
          className="group relative flex items-center gap-2 p-1.5 md:pl-2.5 md:pr-3.5 md:py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl hover:shadow-2xl shadow-slate-300/40 hover:border-slate-300 transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95"
        >
          {/* Circular Bot Badge */}
          <div className="relative w-9 h-9 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-xs opacity-70 group-hover:opacity-100 transition animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-eye-blink" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-eye-blink" />
              </div>
              <svg viewBox="0 0 24 10" className="w-3.5 h-1.5 overflow-visible">
                <path d="M 2 2 Q 12 9 22 2" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <div className="text-left hidden md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 leading-tight">Safety Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-semibold block leading-tight">
              Ask about Cyber Safety
            </span>
          </div>

          {/* Drag Grip Handle */}
          <div className="hidden md:flex items-center pl-0.5 text-slate-300 group-hover:text-slate-400 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </button>
      </motion.div>

      {/* ------------------------------------------------------------ */}
      {/* EXPANDED CHAT CONTAINER OVERLAY (DRAGGABLE VIA HEADER)       */}
      {/* ------------------------------------------------------------ */}
      {isOpen && (
        <motion.div
          drag
          dragListener={false}
          dragControls={windowDragControls}
          dragConstraints={dragConstraintsRef}
          dragMomentum={false}
          dragElastic={0.08}
          className="pointer-events-auto absolute bottom-16 right-3 md:bottom-6 md:right-6 w-[95vw] md:w-[440px] h-[580px] max-h-[80vh] bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-shadow duration-300 z-50"
        >
          {/* HEADER BAR (DRAG HANDLE) */}
          <div
            onPointerDown={(e) => {
              if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;
              windowDragControls.start(e);
            }}
            style={{ touchAction: "none" }}
            className="bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 relative z-20 cursor-grab active:cursor-grabbing select-none"
            title="Click and drag header to reposition chat window"
          >
            {/* Mobile drag handle pill */}
            <div className="sm:hidden absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-slate-300/80 pointer-events-none" />

            <div className="flex items-center gap-3">
              <Robot3DAvatar size="sm" online={true} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">CyberGuard Assistant</h3>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    Online Support
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Child Online Protection • Ghana</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold cursor-grab active:cursor-grabbing mr-1"
                title="Drag to reposition window"
              >
                <Move className="w-3 h-3 text-slate-400" />
                <span>Drag</span>
              </div>

              {user && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(!showDrawer)}
                    title="Saved Conversations History"
                    className={`p-2 rounded-xl border transition ${
                      showDrawer
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={startNewSession}
                    title="Start New Chat Session"
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize CyberGod"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* HISTORY DRAWER OVERLAY FOR SAVED CONVERSATIONS */}
          {/* ------------------------------------------------------------ */}
          {user && showDrawer && (
            <div className="absolute inset-x-0 top-[65px] bottom-0 bg-white/98 backdrop-blur-xl z-30 p-4 flex flex-col justify-between border-t border-slate-100 animate-in slide-in-from-top-4 duration-200 shadow-lg">
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                      Saved Conversations
                    </h4>
                  </div>
                  <button
                    onClick={startNewSession}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-200 transition"
                  >
                    <Plus className="w-3 h-3" /> New Chat
                  </button>
                </div>

                {fetchingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                    <p>Loading your saved chats…</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl">
                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                    <p>No saved chat sessions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => selectSession(s.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between group ${
                          s.id === currentSessionId
                            ? "bg-slate-900 border-slate-900 text-white font-bold shadow-xs"
                            : "bg-slate-50/80 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${s.id === currentSessionId ? "text-emerald-400" : "text-slate-400"}`} />
                          <span className="truncate">{s.title || "CyberGod Session"}</span>
                        </div>
                        <button
                          onClick={(e) => deleteSession(e, s.id)}
                          title="Delete Thread"
                          className={`p-1 rounded-md opacity-60 hover:opacity-100 transition shrink-0 ${
                            s.id === currentSessionId ? "hover:bg-slate-800 hover:text-rose-400" : "hover:bg-rose-50 hover:text-rose-600"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl border border-slate-200 mt-3 transition"
              >
                Close History
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* AUTHENTICATION GATE FOR GUEST USERS (WHITE THEME) */}
          {/* ------------------------------------------------------------ */}
          {!user ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
              <div className="relative z-10 space-y-4 max-w-xs">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Authentication Required
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Have a Safety Question?</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Get instant guidance on identifying scam messages, protecting your Mobile Money account, securing your social media, or course progress. Sign in to chat.
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2.5 relative z-10">
                <Link
                  to="/login"
                  state={{ from: window.location.pathname + window.location.search, intercepted: true }}
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-xs"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Chat
                </Link>
                <Link
                  to="/register"
                  state={{ from: window.location.pathname + window.location.search, intercepted: true }}
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3 rounded-xl border border-slate-200/90 shadow-2xs transition flex items-center justify-center gap-2 text-xs"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </Link>
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------ */
            /* AUTHENTICATED CHAT STREAM & MESSAGES (WHITE THEME) */
            /* ------------------------------------------------------------ */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/50">
              
              {/* MESSAGES SCROLL AREA */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
                {messages.length === 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3 my-auto shadow-xs">
                    <Robot3DAvatar size="md" online={true} />
                    <h4 className="font-bold text-slate-900 text-sm">Hello, {user.displayName || "there"}!</h4>
                    <p className="text-slate-600 text-xs leading-relaxed max-w-xs mx-auto font-normal">
                      I am your <strong className="text-slate-900">CyberGuard Safety Assistant</strong>. Ask me anything about identifying scam messages, securing your phone, or navigating your courses.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 font-medium pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Confidential &amp; Safe Learning Environment</span>
                    </div>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {m.sender === "user" ? (
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-[#0056D2] border border-slate-200 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                        <i className="fa-solid fa-circle-user"></i>
                      </div>
                    ) : (
                      <Robot3DAvatar size="sm" online={true} />
                    )}

                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                        m.sender === "user"
                          ? "bg-slate-900 text-white rounded-tr-xs font-medium shadow-xs"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs"
                      }`}
                    >
                      {m.sender === "user" ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <FormattedLessonContent content={m.content} compact={true} />
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                    <Robot3DAvatar size="sm" online={true} />
                    <div className="px-4 py-3 rounded-2xl bg-white text-slate-700 border border-slate-200/80 rounded-tl-xs shadow-xs space-y-1 max-w-[85%]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-typing-1" />
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-typing-2" />
                          <span className="w-2 h-2 rounded-full bg-[#0056D2] animate-typing-3" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tracking-tight transition-all duration-300">
                          {loadingSteps[loadingPhase] || "Formulating response..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">CyberGuard Protection Engine</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* QUICK SUGGESTION CHIPS */}
              {messages.length <= 2 && (
                <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-slate-100 bg-white/80">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(chip);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200/80 text-[10px] font-medium whitespace-nowrap transition shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT BAR */}
              <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-100 shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about online safety, scam defense, or courses..."
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1 font-mono">
                  <span>CyberGuard Safety Engine • Act 1038</span>
                  <span>Press Enter ↵</span>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
