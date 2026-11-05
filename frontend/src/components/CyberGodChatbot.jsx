import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import {
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
  History,
  Move,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import FormattedLessonContent from "./FormattedLessonContent";

function AssistantBadge({ size = "md", online = false }) {
  const sizeStyles = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={`relative ${sizeStyles[size] || sizeStyles.md
        } bg-[#001E3C] text-white flex items-center justify-center shrink-0 shadow-xs`}
    >
      <ShieldCheck className={iconSizes[size] || iconSizes.md} />
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
      )}
    </div>
  );
}

const SUGGESTION_PROMPTS = [
  "How do I earn a course certificate?",
  "How to spot Mobile Money cash-out scams",
  "How do I report online extortion?",
  "What does Ghana Cybersecurity Act 1038 cover?",
];

export default function CyberGodChatbot() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const dragConstraintsRef = useRef(null);
  const isDraggingRef = useRef(false);
  const windowDragControls = useDragControls();
  const chatEndRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (user && isOpen) {
      loadSessions();
    }
  }, [user, isOpen]);

  async function loadSessions() {
    setFetchingHistory(true);
    try {
      const res = await api.get("/cybergod/sessions");
      const list = res.data || [];
      setSessions(list);
      if (list.length > 0 && !currentSessionId) {
        selectSession(list[0].id);
      } else if (list.length === 0) {
        startNewSession();
      }
    } catch (err) {
      console.warn("Failed to load assistant chat history:", err);
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
      const res = await api.post("/cybergod/sessions", { title: "New Conversation" });
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

  async function submitQuestion(rawText) {
    const userQuery = (rawText ?? input).trim();
    if (!userQuery || loading || !user) return;

    setInput("");
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, sender: "user", content: userQuery }]);
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
      console.error("Safety Assistant error:", err);
      setMessages((prev) => [
        ...prev.filter((m) => !(m?.id && String(m.id).startsWith("temp-"))),
        { id: `user-${Date.now()}`, sender: "user", content: userQuery },
        {
          id: `err-${Date.now()}`,
          sender: "cybergod",
          content:
            "I couldn't reach the assistant service right now. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e) {
    if (e) e.preventDefault();
    submitQuestion(input);
  }

  return (
    <div
      ref={dragConstraintsRef}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden p-2 sm:p-4 font-sans"
    >
      {/* COMPACT, UNOBTRUSIVE LAUNCHER */}
      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0.08}
        whileDrag={prefersReducedMotion ? undefined : { scale: 1.05, cursor: "grabbing" }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 150);
        }}
        className={`pointer-events-auto absolute bottom-16 right-3 md:bottom-5 md:right-5 touch-none cursor-grab active:cursor-grabbing select-none transition-opacity duration-150 ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
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
          title="Ask CyberGuard Assistant (drag to move)"
          aria-label="Open Safety Assistant"
          className="flex items-center gap-2 h-11 px-3.5 rounded-full bg-[#001E3C] hover:bg-[#002B54] text-white border border-white/15 shadow-lg transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-sky-300 shrink-0" />
          <span className="text-xs font-semibold tracking-tight hidden sm:inline">
            Ask Assistant
          </span>
        </button>
      </motion.div>

      {/* EXPANDED CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragListener={false}
            dragControls={windowDragControls}
            dragConstraints={dragConstraintsRef}
            dragMomentum={false}
            dragElastic={0.08}
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }
            }
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-16 left-2.5 right-2.5 w-auto sm:left-auto sm:right-5 sm:w-[410px] h-[550px] max-h-[78vh] bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* HEADER BAR (DRAG HANDLE) */}
            <div
              onPointerDown={(e) => {
                if (
                  e.target.closest("button") ||
                  e.target.closest("a") ||
                  e.target.closest("input")
                ) {
                  return;
                }
                windowDragControls.start(e);
              }}
              style={{ touchAction: "none" }}
              className="bg-white px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 relative z-20 cursor-grab active:cursor-grabbing select-none"
              title="Drag header to reposition"
            >
              <div className="flex items-center gap-3">
                <AssistantBadge size="sm" online />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Safety Assistant
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Scam checks, courses &amp; reporting help
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-medium cursor-grab active:cursor-grabbing mr-0.5"
                  title="Drag window"
                >
                  <Move className="w-3 h-3 text-slate-400" />
                </div>

                {user && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDrawer(!showDrawer)}
                      title="Conversation history"
                      className={`p-2 rounded-lg border transition cursor-pointer ${showDrawer
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={startNewSession}
                      title="New conversation"
                      className="p-2 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SAVED CONVERSATIONS DRAWER */}
            <AnimatePresence>
              {user && showDrawer && (
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="absolute inset-x-0 top-[61px] bottom-0 bg-white z-30 p-4 flex flex-col justify-between border-t border-slate-100"
                >
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-bold text-slate-900">
                        Saved Conversations
                      </h4>
                      <button
                        type="button"
                        onClick={startNewSession}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0056D2] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> New chat
                      </button>
                    </div>

                    {fetchingHistory ? (
                      <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0056D2]" />
                        <p>Loading conversations...</p>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-slate-300 mx-auto" />
                        <p>No saved conversations yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {sessions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => selectSession(s.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${s.id === currentSessionId
                                ? "bg-slate-900 border-slate-900 text-white font-semibold"
                                : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                              <MessageSquare
                                className={`w-3.5 h-3.5 shrink-0 ${s.id === currentSessionId
                                    ? "text-sky-300"
                                    : "text-slate-400"
                                  }`}
                              />
                              <span className="truncate">
                                {s.title === "New CyberGod Session"
                                  ? "Conversation"
                                  : s.title || "Conversation"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => deleteSession(e, s.id)}
                              title="Delete conversation"
                              className={`p-1 rounded-md opacity-60 hover:opacity-100 transition shrink-0 cursor-pointer ${s.id === currentSessionId
                                  ? "hover:bg-slate-800 hover:text-rose-300"
                                  : "hover:bg-rose-50 hover:text-rose-600"
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
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl mt-3 transition cursor-pointer"
                  >
                    Back to chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GUEST GATE */}
            {!user ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 bg-[#F8FAFC]">
                <div className="space-y-3 max-w-xs">
                  <div className="mx-auto flex justify-center">
                    <AssistantBadge size="lg" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-semibold">
                    <Lock className="w-3 h-3" /> Sign in required
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Ask a cyber safety question
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sign in to get practical guidance on Mobile Money scam messages, account recovery, or your CyberGuard courses.
                  </p>
                </div>

                <div className="w-full max-w-xs space-y-2.5">
                  <Link
                    to="/login"
                    state={{
                      from: window.location.pathname + window.location.search,
                      intercepted: true,
                    }}
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link
                    to="/register"
                    state={{
                      from: window.location.pathname + window.location.search,
                      intercepted: true,
                    }}
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-2.5 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 text-xs"
                  >
                    <UserPlus className="w-4 h-4" /> Create Free Account
                  </Link>
                </div>
              </div>
            ) : (
              /* AUTHENTICATED CHAT */
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#F8FAFC]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {messages.length === 0 && (
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2.5 shadow-2xs">
                      <div className="flex justify-center">
                        <AssistantBadge size="md" online />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Hi {user.displayName?.split(" ")[0] || "there"}, how can I help?
                      </h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xs mx-auto">
                        Ask about suspicious SMS or WhatsApp messages, Mobile Money PIN safety, reporting abuse, or earning certificates.
                      </p>
                    </div>
                  )}

                  {messages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                    >
                      {m.sender === "user" ? (
                        <UserAvatar user={user} size="sm" rounded="rounded-full" />
                      ) : (
                        <AssistantBadge size="sm" />
                      )}

                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${m.sender === "user"
                            ? "bg-[#001E3C] text-white rounded-tr-xs font-medium"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs"
                          }`}
                      >
                        {m.sender === "user" ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <FormattedLessonContent content={m.content} compact />
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-start gap-2.5">
                      <AssistantBadge size="sm" />
                      <div className="px-4 py-3 rounded-2xl bg-white text-slate-600 border border-slate-200/80 rounded-tl-xs shadow-2xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0056D2]" />
                        <span className="text-xs font-medium">Writing a reply...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* QUICK PROMPTS */}
                {messages.length <= 1 && !loading && (
                  <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-slate-200/70 bg-white">
                    {SUGGESTION_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => submitQuestion(prompt)}
                        className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0056D2] border border-slate-200 text-[11px] font-medium whitespace-nowrap transition cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* INPUT BAR */}
                <form
                  onSubmit={handleSend}
                  className="p-3 bg-white border-t border-slate-200/80 shrink-0"
                >
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about online safety, scams, or courses..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      aria-label="Send message"
                      className="absolute right-1.5 p-2 rounded-lg bg-[#0056D2] hover:bg-[#00419E] text-white disabled:opacity-35 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
