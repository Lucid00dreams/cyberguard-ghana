import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../utils/api";
import UserAvatar from "../components/UserAvatar";
import CyberSpinner from "../components/CyberSpinner";
import {
  initializeUserE2EE,
  deriveSharedAesKey,
  importPeerEcdsaPublicKey,
  encryptAndSignMessage,
  verifyAndDecryptMessage,
  encryptFileBlob,
  decryptFileBlob,
  computeSafetyVerification,
  exportEncryptedKeyBackup,
  importEncryptedKeyBackup,
  MAX_ATTACHMENT_BYTES,
} from "../utils/e2eeCrypto";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Paperclip,
  Mic,
  Square,
  Send,
  Search,
  Users,
  CheckCheck,
  X,
  Copy,
  ChevronLeft,
  FileText,
  Download,
  MessageSquare,
  Bell,
  Ban,
  Flag,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";

const ROLE_BADGES = {
  TUTOR: "Verified Mentor",
  CSA_OFFICER: "CSA Officer",
  ADMIN: "Support",
  STUDENT: "Learner",
};

export default function CyberChat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permission, requestPermission, playChime } = useNotifications();

  const [e2eeKeys, setE2eeKeys] = useState(null);
  const [publicMeta, setPublicMeta] = useState(null);
  const [isKeyInitializing, setIsKeyInitializing] = useState(true);

  // Sidebar Tabs: "chats" | "mentors"
  const [activeTab, setActiveTab] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [mentorsDirectory, setMentorsDirectory] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active Thread State
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // Derived Session Keys
  const [activeSharedKey, setActiveSharedKey] = useState(null);
  const [activePeerVerifyKey, setActivePeerVerifyKey] = useState(null);
  const [peerKeyMissing, setPeerKeyMissing] = useState(false);

  // Attachments & Voice Notes
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const objectUrlsRef = useRef([]);

  // Verification, Key Backup, & Safety Reporting Modals
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState(null);
  const [verifiedPeers, setVerifiedPeers] = useState({});

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyModalMode, setKeyModalMode] = useState("export"); // "export" | "import"
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [exportedBackup, setExportedBackup] = useState("");
  const [importBackupString, setImportBackupString] = useState("");
  const [keyActionMsg, setKeyActionMsg] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState("GROOMING");
  const [reportReason, setReportReason] = useState("");
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [blockOnReport, setBlockOnReport] = useState(true);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submittedReportRef, setSubmittedReportRef] = useState("");

  const messagesEndRef = useRef(null);
  const handledMentorParamRef = useRef(null);

  const isLearner = user?.role === "STUDENT";

  // Clean up decrypted blob URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cyberguard_verified_peers_${user?.id}`);
      if (saved) setVerifiedPeers(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [user?.id]);

  // Initialize E2EE Keys & Initial Data
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    async function setupCrypto() {
      setIsKeyInitializing(true);
      try {
        const { keys, publicPayload } = await initializeUserE2EE(user.id);
        if (!isMounted) return;

        setE2eeKeys(keys);
        setPublicMeta(publicPayload);

        await api.post("/cyberchat/keys", publicPayload).catch(() => {});
        await Promise.all([fetchConversations(), fetchMentorsDirectory("")]);
      } catch {
        if (isMounted) {
          setStatusNotice({
            type: "error",
            text: "Could not initialize browser encryption keys. Ensure IndexedDB is enabled.",
          });
        }
      } finally {
        if (isMounted) setIsKeyInitializing(false);
      }
    }

    setupCrypto();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Poll conversation list every 8 seconds
  useEffect(() => {
    if (!user?.id || isKeyInitializing) return;
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [user?.id, isKeyInitializing]);

  // Handle ?conv= or ?mentor= deep links
  useEffect(() => {
    if (isKeyInitializing || !e2eeKeys) return;

    const convIdParam = searchParams.get("conv");
    if (convIdParam && conversations.length > 0) {
      const match = conversations.find((c) => c.id === convIdParam);
      if (match && activeConv?.id !== match.id) {
        selectConversation(match);
      }
    }

    const mentorIdParam = searchParams.get("mentor");
    if (mentorIdParam && handledMentorParamRef.current !== mentorIdParam) {
      handledMentorParamRef.current = mentorIdParam;
      handleStartChatById(mentorIdParam);
    }
  }, [searchParams, conversations, isKeyInitializing, e2eeKeys]);

  async function fetchConversations() {
    try {
      const res = await api.get("/cyberchat/conversations");
      const list = res.data?.conversations || [];
      setConversations(list);

      if (activeConv) {
        const updatedActive = list.find((c) => c.id === activeConv.id);
        if (updatedActive) {
          setActiveConv((prev) =>
            prev
              ? {
                  ...prev,
                  isBlocked: updatedActive.isBlocked,
                  blockedByMe: updatedActive.blockedByMe,
                }
              : prev
          );
        }
      }
    } catch {
      // ignore transient network errors
    } finally {
      setLoadingConversations(false);
    }
  }

  async function fetchMentorsDirectory(query = "") {
    try {
      const res = await api.get("/cyberchat/mentors", {
        params: query.trim() ? { search: query.trim() } : {},
      });
      setMentorsDirectory(res.data?.mentors || res.data?.users || []);
    } catch {
      setMentorsDirectory([]);
    }
  }

  async function handleStartChatById(recipientId, peerFallback = null) {
    try {
      const res = await api.post("/cyberchat/conversations", { recipientId });
      const conv = res.data?.conversation;
      if (!conv) return;

      const hydratedConv = {
        ...conv,
        peer: conv.peer || peerFallback,
      };

      setActiveTab("chats");
      setSearchParams({ conv: hydratedConv.id }, { replace: true });
      await fetchConversations();
      await selectConversation(hydratedConv);
    } catch (err) {
      setStatusNotice({
        type: "error",
        text:
          err.response?.data?.error ||
          "Unable to start conversation. Only Verified Mentors and CSA Officers can be messaged.",
      });
    }
  }

  async function selectConversation(conv) {
    if (!conv || !e2eeKeys) return;

    setActiveConv(conv);
    setLoadingMessages(true);
    setDecryptedMessages([]);
    setPeerKeyMissing(false);

    if (!conv.peer?.id) {
      setLoadingMessages(false);
      return;
    }

    try {
      const keyRes = await api.get(`/cyberchat/keys/${conv.peer.id}`).catch((err) => {
        if (err.response?.status === 404) return { data: null };
        throw err;
      });

      const peerKeys = keyRes?.data?.key || keyRes?.data;
      if (!peerKeys?.ecdhPublicKey || !peerKeys?.ecdsaPublicKey) {
        setPeerKeyMissing(true);
        setActiveSharedKey(null);
        setActivePeerVerifyKey(null);
        setSafetyInfo(null);
        return;
      }

      const sharedKey = await deriveSharedAesKey(
        e2eeKeys.ecdhPair.privateKey,
        peerKeys.ecdhPublicKey
      );
      setActiveSharedKey(sharedKey);

      const peerVerifyKey = await importPeerEcdsaPublicKey(peerKeys.ecdsaPublicKey);
      setActivePeerVerifyKey(peerVerifyKey);

      const safety = await computeSafetyVerification(
        publicMeta?.fingerprint,
        peerKeys.fingerprint
      );
      setSafetyInfo(safety);

      await loadAndDecryptMessages(conv.id, sharedKey, peerVerifyKey);
    } catch {
      setPeerKeyMissing(true);
      setActiveSharedKey(null);
      setActivePeerVerifyKey(null);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadAndDecryptMessages(convId, sharedKey, peerVerifyKey) {
    try {
      const res = await api.get(`/cyberchat/conversations/${convId}/messages`);
      const rawMessages = res.data?.messages || [];

      // Release prior temporary blob URLs before creating fresh ones
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];

      const decrypted = await Promise.all(
        rawMessages.map(async (msg) => {
          const isMine = msg.senderId === user.id;
          const result = await verifyAndDecryptMessage({
            sharedKey,
            peerEcdsaPublicKey: peerVerifyKey,
            myEcdsaPublicKey: e2eeKeys.ecdsaPair.publicKey,
            messageRecord: msg,
            isMine,
          });

          let attachmentUrl = null;
          if (result.success && result.payload?.attachment) {
            try {
              attachmentUrl = await decryptFileBlob(
                result.payload.attachment.encryptedData,
                result.payload.attachment.iv,
                result.payload.attachment.mimeType,
                sharedKey
              );
              if (attachmentUrl) objectUrlsRef.current.push(attachmentUrl);
            } catch {
              attachmentUrl = null;
            }
          }

          return {
            id: msg.id,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            createdAt: msg.createdAt,
            decryptedText: result.success
              ? result.payload?.text || ""
              : "Encrypted message (key rotation occurred)",
            attachment: result.payload?.attachment
              ? { ...result.payload.attachment, url: attachmentUrl }
              : null,
            signatureValid: result.signatureValid,
            tampered: Boolean(result.success && !result.signatureValid),
            isMine,
          };
        })
      );

      setDecryptedMessages((prev) => {
        if (prev.length > 0 && decrypted.length > prev.length) {
          const lastMsg = decrypted[decrypted.length - 1];
          if (!lastMsg?.isMine) playChime("message");
        }
        return decrypted;
      });
    } catch {
      // ignore transient poll errors
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages.length]);

  useEffect(() => {
    if (!activeConv?.id || !activeSharedKey || !activePeerVerifyKey) return;
    const interval = setInterval(() => {
      loadAndDecryptMessages(activeConv.id, activeSharedKey, activePeerVerifyKey);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConv?.id, activeSharedKey, activePeerVerifyKey]);

  function handleFileSelection(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setStatusNotice({
        type: "error",
        text: "File exceeds the 2 MB maximum size limit.",
      });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    e.target.value = "";
  }

  async function handleSendMessage(e) {
    e?.preventDefault();
    if (
      (!messageText.trim() && !selectedFile && !audioBlob) ||
      sending ||
      !activeConv ||
      !activeSharedKey ||
      activeConv.isBlocked
    ) {
      return;
    }

    setSending(true);
    setStatusNotice(null);
    try {
      let attachmentPayload = null;

      if (selectedFile) {
        attachmentPayload = await encryptFileBlob(selectedFile, activeSharedKey);
      } else if (audioBlob) {
        attachmentPayload = await encryptFileBlob(
          new File([audioBlob], "voice-note.webm", { type: "audio/webm" }),
          activeSharedKey
        );
        attachmentPayload.isVoiceMemo = true;
        attachmentPayload.duration = audioDuration;
      }

      const payload = {
        text: messageText.trim(),
        timestamp: Date.now(),
        attachment: attachmentPayload,
      };

      const { ciphertext, iv, signature } = await encryptAndSignMessage({
        sharedKey: activeSharedKey,
        myEcdsaPrivateKey: e2eeKeys.ecdsaPair.privateKey,
        payload,
      });

      await api.post(`/cyberchat/conversations/${activeConv.id}/messages`, {
        recipientId: activeConv.peer.id,
        ciphertext,
        iv,
        signature,
        hasAttachment: Boolean(attachmentPayload),
      });

      setMessageText("");
      setSelectedFile(null);
      setAudioBlob(null);
      setAudioDuration(0);

      await loadAndDecryptMessages(activeConv.id, activeSharedKey, activePeerVerifyKey);
      fetchConversations();
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err.response?.data?.error || err.message || "Failed to encrypt and send message.",
      });
    } finally {
      setSending(false);
    }
  }

  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size <= MAX_ATTACHMENT_BYTES) {
          setAudioBlob(blob);
        } else {
          setStatusNotice({ type: "error", text: "Voice note exceeds 2 MB limit." });
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setAudioDuration(0);
      audioTimerRef.current = setInterval(() => {
        setAudioDuration((d) => d + 1);
      }, 1000);
    } catch {
      setStatusNotice({
        type: "error",
        text: "Microphone permission is required to record a voice note.",
      });
    }
  }

  function stopVoiceRecording() {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(audioTimerRef.current);
    }
  }

  function cancelVoiceRecording() {
    stopVoiceRecording();
    setAudioBlob(null);
    setAudioDuration(0);
  }

  async function handleToggleBlockPeer() {
    if (!activeConv?.peer?.id) return;
    const peerId = activeConv.peer.id;
    try {
      if (activeConv.blockedByMe) {
        await api.delete(`/cyberchat/blocks/${peerId}`);
        setActiveConv((prev) => (prev ? { ...prev, blockedByMe: false, isBlocked: false } : prev));
        setStatusNotice({ type: "info", text: `Unblocked ${activeConv.peer.displayName}.` });
      } else {
        await api.post("/cyberchat/blocks", { targetUserId: peerId });
        setActiveConv((prev) => (prev ? { ...prev, blockedByMe: true, isBlocked: true } : prev));
        setStatusNotice({
          type: "info",
          text: `Blocked ${activeConv.peer.displayName}. They can no longer message you.`,
        });
      }
      fetchConversations();
      fetchMentorsDirectory(searchQuery);
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err.response?.data?.error || "Could not update block preference.",
      });
    }
  }

  async function handleSubmitSafetyReport(e) {
    e.preventDefault();
    if (!activeConv?.id || submittingReport) return;

    const cleanReason = reportReason.trim();
    if (cleanReason.length < 10) {
      setStatusNotice({
        type: "error",
        text: "Please describe the concern in at least 10 characters.",
      });
      return;
    }

    setSubmittingReport(true);
    try {
      const disclosedMessages = includeTranscript
        ? decryptedMessages.slice(-15).map((m) => ({
            id: m.id,
            text: m.decryptedText || (m.attachment ? `[Attachment: ${m.attachment.name}]` : ""),
          }))
        : [];

      const res = await api.post(`/cyberchat/conversations/${activeConv.id}/report`, {
        category: reportCategory,
        reason: cleanReason,
        disclosedMessages,
        blockPeer: blockOnReport,
      });

      setSubmittedReportRef(res.data?.refCode || "SUBMITTED");
      if (blockOnReport) {
        setActiveConv((prev) => (prev ? { ...prev, blockedByMe: true, isBlocked: true } : prev));
      }
      fetchConversations();
    } catch (err) {
      setStatusNotice({
        type: "error",
        text: err.response?.data?.error || "Could not submit safety report.",
      });
    } finally {
      setSubmittingReport(false);
    }
  }

  function togglePeerVerification(peerId) {
    setVerifiedPeers((prev) => {
      const next = { ...prev, [peerId]: !prev[peerId] };
      try {
        localStorage.setItem(`cyberguard_verified_peers_${user?.id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.peer?.displayName?.toLowerCase().includes(q) ||
        c.peer?.headline?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mentorsDirectory;
    return mentorsDirectory.filter(
      (m) =>
        m.displayName?.toLowerCase().includes(q) ||
        m.headline?.toLowerCase().includes(q) ||
        (m.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [mentorsDirectory, searchQuery]);

  const isCurrentPeerVerified = activeConv?.peer
    ? Boolean(verifiedPeers[activeConv.peer.id])
    : false;

  return (
    <div className="h-full flex-1 min-h-0 bg-[#F8FAFC] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Mentorship Safety Header */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-900">Mentorship &amp; CSA Support Chat</span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="hidden sm:inline text-slate-500 truncate">
            End-to-end encrypted · Verified mentors &amp; CSA officers only
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyActionMsg(null);
            setShowKeyModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition text-xs font-medium shrink-0 cursor-pointer"
        >
          <Key className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Key backup</span>
        </button>
      </div>

      {/* Inline Status Notice */}
      {statusNotice && (
        <div
          className={`px-4 py-2.5 border-b text-xs font-medium flex items-center justify-between gap-3 shrink-0 ${
            statusNotice.type === "error"
              ? "bg-rose-50/90 border-rose-200 text-rose-900"
              : "bg-slate-100 border-slate-200 text-slate-800"
          }`}
        >
          <span>{statusNotice.text}</span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Two-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`w-full md:w-84 lg:w-96 border-r border-slate-200/90 bg-white flex flex-col shrink-0 ${
            activeConv ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Notification Opt-In */}
          {permission === "default" && (
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
                <Bell className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">Desktop alerts for mentor replies</span>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shrink-0 cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}

          {/* Sidebar Tabs: Conversations | Verified Mentors */}
          <div className="grid grid-cols-2 border-b border-slate-200/80 bg-white text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("chats")}
              className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === "chats"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversations</span>
              {conversations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
                  {conversations.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("mentors");
                fetchMentorsDirectory(searchQuery);
              }}
              className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === "mentors"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isLearner ? "Mentors & CSA" : "Contacts"}</span>
              {mentorsDirectory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono">
                  {mentorsDirectory.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab === "mentors") {
                    fetchMentorsDirectory(e.target.value);
                  }
                }}
                placeholder={
                  activeTab === "chats"
                    ? "Filter conversations..."
                    : isLearner
                    ? "Search verified mentors or CSA officers..."
                    : "Search booked mentees or officers..."
                }
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {activeTab === "chats" ? (
              loadingConversations ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-2.5">
                  <p className="text-xs font-semibold text-slate-800">No mentorship chats yet</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isLearner
                      ? "Start a secure conversation with a CSA-vetted cybersecurity mentor or CSA support officer."
                      : "Conversations with learners who book your mentorship sessions or reach out for guidance will appear here."}
                  </p>
                  {isLearner && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("mentors")}
                      className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Browse verified mentors</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConv?.id === conv.id;
                  const peer = conv.peer;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSearchParams({ conv: conv.id }, { replace: true });
                        selectConversation(conv);
                      }}
                      className={`w-full p-3.5 flex items-center justify-between text-left transition cursor-pointer ${
                        isSelected ? "bg-slate-100/90" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <UserAvatar
                          src={peer?.avatarUrl}
                          name={peer?.displayName}
                          size="md"
                          rounded="rounded-full"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {peer?.displayName || "Mentor"}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 text-slate-600 font-medium shrink-0">
                              {ROLE_BADGES[peer?.role] || peer?.role}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate">
                              {conv.isBlocked
                                ? "Blocked"
                                : conv.lastMessage
                                ? (conv.lastMessage.isMine ? "You: " : "") +
                                  (conv.lastMessage.hasAttachment
                                    ? "Encrypted attachment"
                                    : "Encrypted message")
                                : peer?.headline || "Ready to chat"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : filteredMentors.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">No contacts available</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isLearner
                    ? "Verified mentors and CSA officers will appear here as soon as they are accredited."
                    : "Learners who book a 1-on-1 mentorship session with you appear here automatically."}
                </p>
                {isLearner && (
                  <Link
                    to="/tutors"
                    className="inline-block text-xs font-semibold text-slate-700 underline pt-1"
                  >
                    View mentorship slots
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        src={mentor.avatarUrl}
                        name={mentor.displayName}
                        size="md"
                        rounded="rounded-full"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {mentor.displayName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-700">
                            {ROLE_BADGES[mentor.role] || mentor.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {mentor.headline}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartChatById(mentor.id, mentor)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                    >
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Thread Pane */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-[#F8FAFC] w-full min-w-0">
            {/* Thread Header */}
            <div className="h-15 px-3 sm:px-5 border-b border-slate-200/90 bg-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConv(null);
                    setSearchParams({}, { replace: true });
                  }}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <UserAvatar
                  src={activeConv.peer?.avatarUrl}
                  name={activeConv.peer?.displayName}
                  size="md"
                  rounded="rounded-full"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {activeConv.peer?.displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-700 shrink-0">
                      {ROLE_BADGES[activeConv.peer?.role] || activeConv.peer?.role}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {isCurrentPeerVerified
                        ? "Keys verified"
                        : activeConv.peer?.headline || "End-to-end encrypted"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety & Cryptographic Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSafetyModal(true)}
                  disabled={peerKeyMissing}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition disabled:opacity-40 cursor-pointer"
                  title="Verify encryption fingerprint"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline">Verify keys</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBlockPeer}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer"
                  title={activeConv.blockedByMe ? "Unblock contact" : "Block contact"}
                >
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline">
                    {activeConv.blockedByMe ? "Unblock" : "Block"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReportRef("");
                    setReportReason("");
                    setShowReportModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-medium text-slate-700 transition cursor-pointer"
                  title="Report concern to CSA Officers"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {/* Mentorship Safety Banner */}
              {peerKeyMissing ? (
                <div className="max-w-md mx-auto my-2 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-center space-y-1">
                  <ShieldAlert className="w-4 h-4 text-amber-700 mx-auto" />
                  <p className="text-xs font-semibold text-amber-900">Encryption keys pending</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {activeConv.peer?.displayName || "This mentor"} has not opened CyberChat on
                    their device yet. Messaging unlocks automatically as soon as their keys sync.
                  </p>
                </div>
              ) : (
                <div className="max-w-lg mx-auto my-1 p-3.5 rounded-xl bg-white border border-slate-200/80 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Protected Mentorship Channel
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Messages are end-to-end encrypted with AES-256-GCM and signed with ECDSA. Never
                    share passwords, Mobile Money PINs, or one-time verification codes.
                  </p>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <CyberSpinner label="Decrypting messages..." />
                </div>
              ) : decryptedMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No messages yet. Introduce yourself or ask your cybersecurity question below.
                </div>
              ) : (
                decryptedMessages.map((msg) => {
                  const isMine = msg.isMine;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && (
                        <UserAvatar
                          src={activeConv.peer?.avatarUrl}
                          name={activeConv.peer?.displayName}
                          size="xs"
                          rounded="rounded-full"
                          className="mb-1"
                        />
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 border ${
                          isMine
                            ? "bg-slate-900 text-white border-slate-900 rounded-br-xs"
                            : "bg-white text-slate-900 border-slate-200/90 rounded-bl-xs"
                        }`}
                      >
                        {msg.tampered && (
                          <div className="mb-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Signature could not be verified (key changed or altered).</span>
                          </div>
                        )}

                        {msg.decryptedText && (
                          <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.decryptedText}
                          </div>
                        )}

                        {msg.attachment && (
                          <div
                            className={`mt-2 pt-2 border-t ${
                              isMine ? "border-white/15" : "border-slate-100"
                            }`}
                          >
                            {msg.attachment.isVoiceMemo && msg.attachment.url ? (
                              <div className="flex items-center gap-2">
                                <audio
                                  controls
                                  src={msg.attachment.url}
                                  className="h-8 max-w-[210px]"
                                />
                                <span
                                  className={`text-[10px] font-mono ${
                                    isMine ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {msg.attachment.duration || 0}s
                                </span>
                              </div>
                            ) : msg.attachment.mimeType?.startsWith("image/") &&
                              msg.attachment.url ? (
                              <div className="space-y-1">
                                <img
                                  src={msg.attachment.url}
                                  alt={msg.attachment.name || "Attachment"}
                                  className="rounded-xl max-h-60 object-cover border border-slate-200/40"
                                />
                                <div
                                  className={`text-[10px] flex items-center justify-between ${
                                    isMine ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  <span className="truncate max-w-[160px]">
                                    {msg.attachment.name}
                                  </span>
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name || "image"}
                                    rel="noopener noreferrer"
                                    className="underline inline-flex items-center gap-1 ml-2"
                                  >
                                    <Download className="w-2.5 h-2.5" /> Save
                                  </a>
                                </div>
                              </div>
                            ) : msg.attachment.url ? (
                              <a
                                href={msg.attachment.url}
                                download={msg.attachment.name || "document"}
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition ${
                                  isMine
                                    ? "bg-white/10 hover:bg-white/15 text-white"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                                }`}
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate font-medium">{msg.attachment.name}</span>
                                <Download className="w-3.5 h-3.5 ml-auto shrink-0 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-[11px] opacity-75">
                                Attachment could not be decrypted
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                            isMine ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMine && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-slate-200/90 bg-white">
              {activeConv.isBlocked ? (
                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <span>
                    {activeConv.blockedByMe
                      ? "You blocked this contact."
                      : "Messaging is unavailable in this conversation."}
                  </span>
                  {activeConv.blockedByMe && (
                    <button
                      type="button"
                      onClick={handleToggleBlockPeer}
                      className="px-3 py-1 rounded-lg bg-slate-900 text-white font-semibold text-xs cursor-pointer"
                    >
                      Unblock
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {(selectedFile || audioBlob) && (
                    <div className="mb-2 flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 text-slate-800 font-medium truncate">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {selectedFile
                            ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                            : `Voice note (${audioDuration}s)`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setAudioBlob(null);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isRecordingVoice ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
                      <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold pl-2">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>Recording voice note ({audioDuration}s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          className="px-3 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={stopVoiceRecording}
                          className="px-3 py-1 text-xs rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Square className="w-3 h-3" /> Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                        onChange={handleFileSelection}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={peerKeyMissing}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0 disabled:opacity-40 cursor-pointer"
                        title="Attach PDF, image, or text file (up to 2 MB)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <input
                        ref={textInputRef}
                        type="text"
                        value={messageText}
                        disabled={peerKeyMissing}
                        maxLength={4000}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={
                          peerKeyMissing
                            ? "Waiting for contact encryption keys..."
                            : "Write an encrypted message..."
                        }
                        className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition disabled:opacity-60"
                      />

                      {messageText.trim() || selectedFile || audioBlob ? (
                        <button
                          type="submit"
                          disabled={peerKeyMissing || sending}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-40 shrink-0 cursor-pointer"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={peerKeyMissing}
                          onClick={startVoiceRecording}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shrink-0 disabled:opacity-40 cursor-pointer"
                          title="Record voice note"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-8 max-w-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Mentorship &amp; CSA Support Chat
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isLearner
                  ? "Select an existing conversation or choose a CSA-vetted cybersecurity mentor from the directory to ask course questions, career advice, or cyber safety guidance."
                  : "Select a conversation from the left panel to assist learners who booked sessions with you or reached out for guidance."}
              </p>
              {isLearner && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("mentors")}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Browse verified mentors
                  </button>
                  <Link
                    to="/tutors"
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                  >
                    Book 1-on-1 video slot
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Verify Key Fingerprint */}
      {showSafetyModal && activeConv && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setShowSafetyModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Verify keys with {activeConv.peer?.displayName}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Compare this 12-digit code or 4-symbol sequence during your video session. Matching
              values confirm end-to-end encryption without interception.
            </p>

            {safetyInfo && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="flex items-center justify-center gap-3 text-2xl">
                  {safetyInfo.emojis.map((emoji, idx) => (
                    <span
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {safetyInfo.safetyCode}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => activeConv?.peer?.id && togglePeerVerification(activeConv.peer.id)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                {isCurrentPeerVerified ? "Mark unverified" : "Mark verified"}
              </button>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Passphrase-Encrypted Key Backup & Restore */}
      {showKeyModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Key className="w-4 h-4 text-slate-600" />
                <span>Encryption key backup</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs">
              <button
                type="button"
                onClick={() => {
                  setKeyModalMode("export");
                  setKeyActionMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  keyModalMode === "export"
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                Export backup
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeyModalMode("import");
                  setKeyActionMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  keyModalMode === "import"
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                Restore backup
              </button>
            </div>

            {keyModalMode === "export" ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Private keys stay in this browser&apos;s IndexedDB and are never stored on our
                  servers. Export an AES-256-GCM encrypted backup protected by an 8+ character
                  passphrase.
                </p>

                <input
                  type="password"
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  placeholder="Create backup passphrase (8+ characters)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const backup = await exportEncryptedKeyBackup(user.id, backupPassphrase);
                      setExportedBackup(backup);
                      setKeyActionMsg({
                        type: "success",
                        text: "Encrypted backup generated. Store it in a password manager.",
                      });
                    } catch (err) {
                      setKeyActionMsg({ type: "error", text: err.message });
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer"
                >
                  Generate encrypted backup
                </button>

                {exportedBackup && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      readOnly
                      value={exportedBackup}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[10px] text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(exportedBackup);
                        setKeyActionMsg({
                          type: "success",
                          text: "Copied encrypted backup string to clipboard.",
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy backup string</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Paste your previously exported encrypted backup JSON and enter its passphrase to
                  restore your keys on this device.
                </p>

                <textarea
                  value={importBackupString}
                  onChange={(e) => setImportBackupString(e.target.value)}
                  rows={3}
                  placeholder='{"salt":"...","iv":"...","data":"..."}'
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />

                <input
                  type="password"
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  placeholder="Enter backup passphrase..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const restoredPublic = await importEncryptedKeyBackup(
                        user.id,
                        importBackupString.trim(),
                        backupPassphrase
                      );
                      const refreshed = await initializeUserE2EE(user.id);
                      setE2eeKeys(refreshed.keys);
                      setPublicMeta(restoredPublic);
                      await api.post("/cyberchat/keys", restoredPublic);
                      setKeyActionMsg({
                        type: "success",
                        text: "Encryption keys restored and synchronized.",
                      });
                    } catch {
                      setKeyActionMsg({
                        type: "error",
                        text: "Could not decrypt backup. Verify the JSON string and passphrase.",
                      });
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore keys</span>
                </button>
              </div>
            )}

            {keyActionMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  keyActionMsg.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {keyActionMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Report Safety Concern to CSA Officers */}
      {showReportModal && activeConv && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => {
            if (!submittingReport) setShowReportModal(false);
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Flag className="w-4 h-4 text-rose-600" />
                <span>Report conversation to CSA</span>
              </div>
              <button
                type="button"
                disabled={submittingReport}
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedReportRef ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 text-emerald-950">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Safety report escalated</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    Your report has been escalated to CSA Officers under reference code{" "}
                    <span className="font-mono font-bold">{submittedReportRef}</span>.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSafetyReport} className="space-y-3.5 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Reporting <span className="font-semibold text-slate-900">{activeConv.peer?.displayName}</span>{" "}
                  sends an escalated case directly to Cyber Security Authority triage officers.
                </p>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Concern category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white"
                  >
                    <option value="GROOMING">Inappropriate contact / grooming</option>
                    <option value="BULLYING">Harassment or cyberbullying</option>
                    <option value="SCAM">Scam, payment request, or phishing</option>
                    <option value="SEXTORTION">Sextortion or threats</option>
                    <option value="IMPERSONATION">Impersonation</option>
                    <option value="OTHER">Other safety concern</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">What happened?</label>
                  <textarea
                    required
                    rows={3}
                    minLength={10}
                    maxLength={2000}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the message or behavior so CSA officers can act quickly..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white resize-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTranscript}
                    onChange={(e) => setIncludeTranscript(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-[11px] text-slate-600 leading-relaxed">
                    Include the last 15 decrypted messages and cryptographic signatures from this
                    session as verifiable evidence.
                  </span>
                </label>

                <label className="flex items-center gap-2.5 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockOnReport}
                    onChange={(e) => setBlockOnReport(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Also block {activeConv.peer?.displayName} from messaging me
                  </span>
                </label>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={submittingReport}
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || reportReason.trim().length < 10}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition disabled:opacity-40 cursor-pointer"
                  >
                    {submittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
