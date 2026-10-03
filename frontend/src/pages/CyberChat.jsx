import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../utils/api";
import UserAvatar from "../components/UserAvatar";
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
  deleteLocalKeys,
} from "../utils/e2eeCrypto";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Paperclip,
  Mic,
  Square,
  Clock,
  Send,
  Search,
  Users,
  CheckCheck,
  Check,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Database,
  FileText,
  Download,
  UserPlus,
  UserCheck,
  AtSign,
  Camera,
  MessageSquare,
  Sparkles,
  Heart,
  Smile,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  Bell,
  BellOff,
} from "lucide-react";
import CyberSpinner from "../components/CyberSpinner";

// CyberGuard Ghana Curated Sticker Set
const CYBER_STICKERS = [
  {
    id: "shield_active",
    name: "Shield Active",
    emoji: "🛡️",
    title: "Secure",
    tagline: "Perimeter protected",
    bg: "bg-blue-50 border-blue-200 text-[#0056D2]",
  },
  {
    id: "e2ee_locked",
    name: "Locked",
    emoji: "🔒",
    title: "End-to-End Encrypted",
    tagline: "Private on-device keys",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  {
    id: "threat_alert",
    name: "Phishing Alert",
    emoji: "🚨",
    title: "Watch Out!",
    tagline: "Suspicious message or link",
    bg: "bg-red-50 border-red-200 text-red-700",
  },
  {
    id: "hacker_terminal",
    name: "Terminal",
    emoji: "💻",
    title: "All Clear",
    tagline: "No issues reported",
    bg: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  {
    id: "ghana_guard",
    name: "Ghana Guard",
    emoji: "🇬🇭",
    title: "CyberGuard Ghana",
    tagline: "Digital safety community",
    bg: "bg-amber-50 border-amber-300 text-amber-950",
  },
  {
    id: "cybergod_ai",
    name: "Assistant",
    emoji: "🤖",
    title: "Safety Assistant",
    tagline: "Help & protection guidance",
    bg: "bg-sky-50 border-sky-200 text-sky-800",
  },
  {
    id: "mission_launch",
    name: "Ready",
    emoji: "🚀",
    title: "Ready to Learn",
    tagline: "Course underway",
    bg: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    id: "guards_united",
    name: "Connected",
    emoji: "🤝",
    title: "Connected",
    tagline: "Fellow learner online",
    bg: "bg-teal-50 border-teal-200 text-teal-800",
  },
  {
    id: "certified_pro",
    name: "Accredited",
    emoji: "🏆",
    title: "Verified Defender",
    tagline: "Certificate earned",
    bg: "bg-yellow-50 border-yellow-300 text-yellow-900",
  },
  {
    id: "flawless_defense",
    name: "Great Job",
    emoji: "🔥",
    title: "On Point",
    tagline: "Great cyber habits",
    bg: "bg-orange-50 border-orange-200 text-orange-800",
  },
  {
    id: "secops_coffee",
    name: "Study Break",
    emoji: "☕",
    title: "Study Break",
    tagline: "Taking five",
    bg: "bg-stone-100 border-stone-300 text-stone-800",
  },
  {
    id: "approved_safe",
    name: "Verified",
    emoji: "👍",
    title: "Verified Safe",
    tagline: "Signed & checked",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
];

// Categorized Emoji Dataset
const EMOJI_CATEGORIES = {
  smileys: {
    label: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😴", "🤔", "🫡", "🤫", "🤯", "🥳"],
  },
  tech: {
    label: "Cyber & Tech",
    emojis: ["🛡️", "🔒", "🔓", "🔑", "🗝️", "💻", "🖥️", "⌨️", "🖱️", "📱", "📡", "🔋", "🔌", "💡", "🌐", "🛰️", "⚙️", "🔧", "🛠️", "🚨", "⚠️", "🤖", "🧠", "🕵️", "🕶️", "📄", "📊", "🏷️"],
  },
  hands: {
    label: "Hands & Hearts",
    emojis: ["👍", "👎", "👏", "🙌", "🫶", "🤝", "👊", "✌️", "🤞", "🤟", "🤘", "👌", "🤌", "👈", "👉", "☝️", "✋", "👋", "✍️", "❤️", "💙", "💚", "💛", "💜", "🖤", "🤍", "💔", "❤️‍🔥", "✨"],
  },
  symbols: {
    label: "Badges & Symbols",
    emojis: ["🇬🇭", "🎯", "🚀", "⚡", "🔥", "💯", "🌟", "⭐", "🎉", "🎊", "🏆", "🥇", "🎖️", "👑", "☕", "🍕", "🍿", "☕", "🌍", "💬", "📦", "✉️"],
  },
};

const QUICK_REACTION_EMOJIS = ["👍", "❤️", "🛡️", "🔥", "😂", "🚀", "🔒", "🤝"];

export default function CyberChat() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { permission, requestPermission, playChime } = useNotifications();

  // Local User Profile & Cryptographic State
  const [profile, setProfile] = useState(null);
  const [e2eeKeys, setE2eeKeys] = useState(null);
  const [publicMeta, setPublicMeta] = useState(null);
  const [isKeyInitializing, setIsKeyInitializing] = useState(true);

  // Active Tab: "chats" | "friends" | "requests"
  const [activeTab, setActiveTab] = useState("chats");

  // Conversations & Peer State
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [], pendingCount: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active Chat Message State
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [selfDestructSeconds, setSelfDestructSeconds] = useState(0);

  // Emoji & Sticker Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTab, setEmojiPickerTab] = useState("emojis"); // "emojis" | "stickers"
  const [emojiCategory, setEmojiCategory] = useState("smileys");

  // Cached derived shared keys and verify keys for active peer
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
  const avatarInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Modals & Action States
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState(null);
  const [verifiedPeers, setVerifiedPeers] = useState({});

  const [showAdminBlindedModal, setShowAdminBlindedModal] = useState(false);
  const [rawServerMessages, setRawServerMessages] = useState([]);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [exportedBackup, setExportedBackup] = useState("");
  const [keyActionMsg, setKeyActionMsg] = useState("");

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Load verified peers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cyberguard_verified_peers_${user?.id}`);
      if (saved) setVerifiedPeers(JSON.parse(saved));
    } catch (_) {}
  }, [user?.id]);

  // Deep-linking via query parameters (?tab=requests or ?conv=id)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["chats", "friends", "requests"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const convIdParam = searchParams.get("conv");
    if (convIdParam && conversations.length > 0) {
      const match = conversations.find((c) => c.id === convIdParam);
      if (match && (!activeConv || activeConv.id !== match.id)) {
        selectConversation(match);
      }
    }
  }, [searchParams, conversations, activeConv]);

  // Periodic background polling for conversation updates & friend requests
  useEffect(() => {
    if (!user?.id) return;
    const pollInterval = setInterval(() => {
      fetchConversations();
      fetchFriendRequests();
    }, 6000);
    return () => clearInterval(pollInterval);
  }, [user?.id]);

  // 1. Initialize E2EE Keys for Logged-In User
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

        // Synchronize public keys with server
        await api.post("/cyberchat/keys", publicPayload).catch((err) => {
          console.warn("Public key registration sync:", err.message);
        });

        await fetchUserProfile();
        await fetchConversations();
        await fetchFriends();
        await fetchFriendRequests();
      } catch (err) {
        console.error("E2EE Cryptographic Setup Error:", err);
      } finally {
        if (isMounted) setIsKeyInitializing(false);
      }
    }

    setupCrypto();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 2. Profile & Relationship Fetchers
  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/cyberchat/profile");
      setProfile(res.data.profile);
      if (res.data.profile?.username) {
        setNewUsernameInput(res.data.profile.username);
      }
    } catch (err) {
      console.error("Error fetching cyberchat profile:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get("/cyberchat/conversations");
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await api.get("/cyberchat/friends");
      setFriendsList(res.data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get("/cyberchat/friend-requests");
      setFriendRequests(res.data);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

  const fetchUsersDirectory = async (query = "") => {
    try {
      const res = await api.get(`/cyberchat/users?search=${encodeURIComponent(query)}`);
      setAvailableUsers(res.data.users || []);
    } catch (err) {
      console.error("Error searching users directory:", err);
    }
  };

  // 3. Select Conversation & Derive Shared Secret
  const selectConversation = async (conv) => {
    if (!conv) return;

    if (!e2eeKeys) {
      alert("Please wait for your cryptographic keys to initialize.");
      return;
    }

    // Safely guarantee conv has peer
    let targetPeer = conv.peer;
    if (!targetPeer && conv.participants) {
      const peerP = conv.participants.find((p) => p.userId !== user?.id);
      if (peerP?.user) targetPeer = peerP.user;
    }

    const safeConv = {
      ...conv,
      peer: targetPeer || conv.peer,
    };

    setActiveConv(safeConv);
    setLoadingMessages(true);
    setDecryptedMessages([]);
    setShowEmojiPicker(false);
    setPeerKeyMissing(false);

    if (!safeConv.peer?.id) {
      console.warn("Peer information not available for conversation:", safeConv);
      setLoadingMessages(false);
      return;
    }

    try {
      const keyRes = await api.get(`/cyberchat/keys/${safeConv.peer.id}`).catch((err) => {
        if (err.response?.status === 404) {
          return { data: null };
        }
        throw err;
      });

      const peerKeys = keyRes?.data?.key || keyRes?.data;

      if (!peerKeys || !peerKeys.ecdhPublicKey || !peerKeys.ecdsaPublicKey) {
        setPeerKeyMissing(true);
        setActiveSharedKey(null);
        setActivePeerVerifyKey(null);
        setSafetyInfo(null);
        return;
      }

      // Derive AES-256-GCM Shared Session Key via ECDH
      const sharedKey = await deriveSharedAesKey(
        e2eeKeys.ecdhPair.privateKey,
        peerKeys.ecdhPublicKey
      );
      setActiveSharedKey(sharedKey);

      // Import peer's ECDSA signing public key
      const peerVerifyKey = await importPeerEcdsaPublicKey(peerKeys.ecdsaPublicKey);
      setActivePeerVerifyKey(peerVerifyKey);

      // Calculate Verification Emojis for Identity Safety Check
      const safety = await computeSafetyVerification(
        publicMeta.fingerprint,
        peerKeys.fingerprint
      );
      setSafetyInfo(safety);

      await loadAndDecryptMessages(safeConv.id, sharedKey, peerVerifyKey);
    } catch (err) {
      console.warn("Peer cryptographic session pending or uninitialized:", err.message || err);
      setPeerKeyMissing(true);
      setActiveSharedKey(null);
      setActivePeerVerifyKey(null);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. Load & Decrypt Messages
  const loadAndDecryptMessages = async (convId, sharedKey, peerVerifyKey) => {
    try {
      const res = await api.get(`/cyberchat/conversations/${convId}/messages`);
      const rawMessages = res.data.messages || [];
      setRawServerMessages(rawMessages);

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
            } catch (err) {
              console.warn("Failed to decrypt attachment blob:", err);
            }
          }

          return {
            id: msg.id,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            createdAt: msg.createdAt,
            expiresAt: msg.expiresAt,
            selfDestructSeconds: msg.selfDestructSeconds,
            decryptedText: result.success
              ? result.payload?.text
              : "Encrypted message (peer keys updated)",
            sticker: result.success ? result.payload?.sticker : null,
            attachment: result.payload?.attachment
              ? { ...result.payload.attachment, url: attachmentUrl }
              : null,
            signatureValid: result.signatureValid,
            tampered: Boolean(result.success && !result.signatureValid && !isMine && msg.signature),
            isMine,
          };
        })
      );

      setDecryptedMessages((prev) => {
        if (prev.length > 0 && decrypted.length > prev.length) {
          const lastMsg = decrypted[decrypted.length - 1];
          if (!lastMsg?.isMine) {
            playChime("message");
          }
        }
        return decrypted;
      });
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages]);

  // Polling for active conversation messages
  useEffect(() => {
    if (!activeConv || !activeSharedKey || !activePeerVerifyKey) return;

    const interval = setInterval(() => {
      loadAndDecryptMessages(activeConv.id, activeSharedKey, activePeerVerifyKey);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConv?.id, activeSharedKey, activePeerVerifyKey]);

  // 5. Send Encrypted Text / Attachment Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!messageText.trim() && !selectedFile && !audioBlob) || sending || !activeConv || !activeSharedKey) return;

    setSending(true);
    try {
      let attachmentPayload = null;

      if (selectedFile) {
        attachmentPayload = await encryptFileBlob(selectedFile, activeSharedKey);
      } else if (audioBlob) {
        attachmentPayload = await encryptFileBlob(
          new File([audioBlob], "voice-memo.webm", { type: "audio/webm" }),
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
        selfDestructSeconds: Number(selfDestructSeconds) || 0,
      });

      setMessageText("");
      setSelectedFile(null);
      setAudioBlob(null);
      setAudioDuration(0);
      setShowEmojiPicker(false);

      await loadAndDecryptMessages(activeConv.id, activeSharedKey, activePeerVerifyKey);
      fetchConversations();
    } catch (err) {
      console.error("Error sending encrypted message:", err);
      alert("Failed to encrypt and send message. Ensure your cryptographic keys are ready.");
    } finally {
      setSending(false);
    }
  };

  // 6. Send Encrypted Sticker Message
  const handleSendSticker = async (sticker) => {
    if (sending || !activeConv || !activeSharedKey) return;
    setSending(true);
    try {
      const payload = {
        text: `[Sticker: ${sticker.name}]`,
        sticker: {
          id: sticker.id,
          name: sticker.name,
          emoji: sticker.emoji,
          title: sticker.title,
          tagline: sticker.tagline,
          bg: sticker.bg,
        },
        timestamp: Date.now(),
        attachment: null,
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
        hasAttachment: false,
        selfDestructSeconds: Number(selfDestructSeconds) || 0,
      });

      setShowEmojiPicker(false);
      await loadAndDecryptMessages(activeConv.id, activeSharedKey, activePeerVerifyKey);
      fetchConversations();
    } catch (err) {
      console.error("Error sending sticker:", err);
      alert("Failed to send encrypted sticker.");
    } finally {
      setSending(false);
    }
  };

  // 7. Insert Emoji into message input
  const handleInsertEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
    textInputRef.current?.focus();
  };

  // 8. Username Claiming Handler
  const handleSaveUsername = async (e) => {
    e.preventDefault();
    if (!newUsernameInput.trim()) return;

    setUsernameSaving(true);
    setUsernameError("");

    try {
      const res = await api.put("/cyberchat/profile/username", {
        username: newUsernameInput.trim(),
      });
      setProfile(res.data.profile);
      setShowUsernameModal(false);
      alert(`Username @${res.data.profile.username} claimed successfully!`);
    } catch (err) {
      setUsernameError(err.response?.data?.error || "Failed to update username");
    } finally {
      setUsernameSaving(false);
    }
  };

  // 9. Profile Photo Upload Handler
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setAvatarUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          await api.put("/cyberchat/profile/avatar", {
            avatarUrl: base64Data,
          });
          await fetchUserProfile();
          updateUser?.({ ...user, avatarUrl: base64Data });
          setShowAvatarModal(false);
        } catch (uploadErr) {
          alert("Failed to update profile picture: " + (uploadErr.response?.data?.error || uploadErr.message));
        } finally {
          setAvatarUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setAvatarUploading(false);
      alert("Error reading photo: " + err.message);
    }
  };

  // 10. Friend Request Handlers
  const handleSendFriendRequest = async (targetUser) => {
    try {
      await api.post("/cyberchat/friend-requests", {
        recipientId: targetUser.id,
      });
      alert(`Friend request sent to ${targetUser.displayName}!`);
      fetchFriendRequests();
      fetchUsersDirectory(searchQuery);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to dispatch friend request.");
    }
  };

  const handleRespondFriendRequest = async (requestId, action) => {
    try {
      const res = await api.put(`/cyberchat/friend-requests/${requestId}`, { action });
      fetchFriendRequests();
      fetchFriends();
      fetchUsersDirectory(searchQuery);

      if (action === "ACCEPT" && res.data.conversation) {
        const updatedConvs = await api.get("/cyberchat/conversations");
        setConversations(updatedConvs.data.conversations || []);
        selectConversation(res.data.conversation);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process friend request.");
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    try {
      const res = await api.post("/cyberchat/conversations", {
        recipientId: targetUser.id,
      });
      let conv = res.data.conversation;
      if (!conv.peer) {
        conv = {
          ...conv,
          peer: {
            id: targetUser.id,
            displayName: targetUser.displayName,
            username: targetUser.username,
            email: targetUser.email,
            role: targetUser.role,
            avatarUrl: targetUser.avatarUrl,
          },
        };
      }
      setActiveTab("chats");
      setSearchQuery("");
      await fetchConversations();
      await selectConversation(conv);
    } catch (err) {
      console.error("Could not start encrypted chat:", err);
      alert(err.response?.data?.error || "Could not start encrypted chat.");
    }
  };

  // 11. Voice Note Recording
  const startVoiceRecording = async () => {
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
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setAudioDuration(0);
      audioTimerRef.current = setInterval(() => {
        setAudioDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission is required to record encrypted voice memos.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(audioTimerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    stopVoiceRecording();
    setAudioBlob(null);
    setAudioDuration(0);
  };

  const togglePeerVerification = (peerId) => {
    setVerifiedPeers((prev) => {
      const next = { ...prev, [peerId]: !prev[peerId] };
      localStorage.setItem(`cyberguard_verified_peers_${user?.id}`, JSON.stringify(next));
      return next;
    });
  };

  const handleVerifyPeerSafety = () => {
    setShowSafetyModal(true);
  };

  const isCurrentPeerVerified = activeConv?.peer ? Boolean(verifiedPeers[activeConv.peer.id]) : false;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F1F5F9] text-slate-900 flex flex-col font-sans">
      {/* Top Header: Telegram clean header */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between text-xs shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold text-sm text-slate-900 tracking-tight">CyberChat</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" /> End-to-End Encrypted
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-medium"
            title="Manage encryption keys"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Encryption Keys</span>
          </button>
        </div>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Telegram clean list */}
        <div className={`w-full md:w-88 lg:w-96 border-r border-slate-200/80 bg-white flex flex-col shadow-xs z-10 shrink-0 ${
          activeConv ? "hidden md:flex" : "flex"
        }`}>
          {/* User Profile Card */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative group cursor-pointer shrink-0" onClick={() => setShowAvatarModal(true)}>
                  <UserAvatar
                    src={profile?.avatarUrl}
                    name={profile?.displayName}
                    size="md"
                    rounded="rounded-full"
                    className="w-10 h-10 group-hover:opacity-85 transition"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                    <span className="truncate max-w-[130px]">{user?.displayName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {user?.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    {profile?.username ? (
                      <button
                        onClick={() => setShowUsernameModal(true)}
                        className="text-xs text-slate-500 hover:text-[#0056D2] font-medium transition"
                      >
                        @{profile.username}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowUsernameModal(true)}
                        className="text-[11px] text-[#0056D2] hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <AtSign className="w-3 h-3" /> Set @username
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowUsernameModal(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Edit @username"
              >
                <AtSign className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification Permission Banner */}
          {permission === "default" && (
            <div className="px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#0056D2] min-w-0">
                <Bell className="w-3.5 h-3.5 shrink-0 text-[#0056D2]" />
                <span className="font-medium text-[11px] truncate">Enable message notifications</span>
              </div>
              <button
                type="button"
                onClick={requestPermission}
                className="px-2.5 py-0.5 text-[11px] font-semibold rounded-lg bg-[#0056D2] hover:bg-blue-700 text-white transition shrink-0 shadow-xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* Navigation Tabs: Chats | Contacts | Requests */}
          <div className="grid grid-cols-3 border-b border-slate-100 bg-white text-xs font-semibold text-center">
            <button
              onClick={() => setActiveTab("chats")}
              className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === "chats"
                  ? "border-[#0056D2] text-[#0056D2] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === "friends"
                  ? "border-[#0056D2] text-[#0056D2] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contacts</span>
              {friendsList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
                  {friendsList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition relative ${
                activeTab === "requests"
                  ? "border-[#0056D2] text-[#0056D2] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Requests</span>
              {friendRequests.pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-[10px] text-white font-bold">
                  {friendRequests.pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Contacts Bar - Telegram Pill Style */}
          <div className="px-3 py-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchUsersDirectory(e.target.value);
                }}
                placeholder="Search"
                className="w-full bg-slate-100 hover:bg-slate-150 border-0 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0056D2]/60 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {/* If actively searching */}
            {searchQuery.trim() ? (
              <div className="p-2 space-y-1.5">
                <div className="text-[10px] uppercase text-[#0056D2] font-bold px-2 py-1">
                  Directory Results ({availableUsers.length})
                </div>
                {availableUsers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">No cyber guards found matching "{searchQuery}"</div>
                ) : (
                  availableUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={u} size="md" rounded="rounded-xl" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{u.displayName}</div>
                          <div className="text-[11px] text-[#0056D2] flex items-center gap-1 font-medium">
                            {u.username ? (
                              <span>@{u.username}</span>
                            ) : (
                              <span className="text-slate-500 capitalize">{u.role?.toLowerCase()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        {u.friendshipStatus === "FRIENDS" ? (
                          <button
                            onClick={() => handleStartChatWithUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-[#0056D2] hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <MessageSquare className="w-3 h-3" /> Chat
                          </button>
                        ) : u.friendshipStatus === "REQUEST_SENT" ? (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                            Pending ⏳
                          </span>
                        ) : u.friendshipStatus === "REQUEST_RECEIVED" ? (
                          <button
                            onClick={() => handleRespondFriendRequest(u.requestId, "ACCEPT")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                          >
                            Accept
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(u)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0056D2] text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === "chats" ? (
              /* Chats Tab */
              <div>
                {loadingConversations ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Shield className="w-8 h-8 text-blue-500/40 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No active chats yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">Search or add cyber guards to start a secure conversation</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = activeConv?.id === conv.id;
                    const peer = conv.peer;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-3 flex items-center justify-between text-left transition border-b border-slate-100/80 ${
                          isSelected
                            ? "bg-[#EBF2FA] border-l-3 border-[#0056D2]"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={peer?.avatarUrl}
                            name={peer?.displayName}
                            size="lg"
                            rounded="rounded-full"
                            showOnlineStatus
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {peer?.displayName || "Cyber Guard"}
                              </span>
                              {conv.lastMessage && (
                                <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-1">
                                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {conv.lastMessage
                                  ? (conv.lastMessage.isMine ? "You: " : "") +
                                    (conv.lastMessage.hasAttachment ? "📎 Attachment" : "🔒 Message")
                                  : "Secret chat initiated"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : activeTab === "friends" ? (
              /* Friends Tab */
              <div className="p-3 space-y-2">
                <div className="text-[10px] uppercase text-[#0056D2] font-bold px-1">
                  Connected Cyber Guards ({friendsList.length})
                </div>
                {friendsList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    You haven't connected with any friends yet. Search someone above to send a request!
                  </div>
                ) : (
                  friendsList.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={friend} size="md" rounded="rounded-xl" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{friend.displayName}</div>
                          <div className="text-[11px] text-[#0056D2] font-medium">{friend.username ? `@${friend.username}` : `@${friend.role?.toLowerCase()}`}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartChatWithUser(friend)}
                        className="px-2.5 py-1 rounded-lg bg-[#0056D2] hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" /> Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Requests Tab */
              <div className="p-3 space-y-4">
                <div>
                  <div className="text-[10px] uppercase text-[#0056D2] font-bold px-1 mb-2">
                    Incoming Friend Requests ({friendRequests.incoming.length})
                  </div>
                  {friendRequests.incoming.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">No incoming friend requests</div>
                  ) : (
                    friendRequests.incoming.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 mb-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={req.user} size="md" rounded="rounded-xl" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{req.user.displayName}</div>
                            <div className="text-[11px] text-[#0056D2] font-medium">{req.user.username ? `@${req.user.username}` : `@${req.user.role?.toLowerCase()}`}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                          <button
                            onClick={() => handleRespondFriendRequest(req.id, "ACCEPT")}
                            className="flex-1 py-1.5 rounded-lg bg-[#0056D2] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondFriendRequest(req.id, "DECLINE")}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold px-1 mb-2">
                    Sent Requests ({friendRequests.outgoing.length})
                  </div>
                  {friendRequests.outgoing.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-500">No sent requests pending</div>
                  ) : (
                    friendRequests.outgoing.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar user={req.user} size="xs" rounded="rounded-lg" />
                          <div>
                            <div className="text-xs font-medium text-slate-800">{req.user.displayName}</div>
                            <div className="text-[10px] text-slate-500">{req.user.username}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Waiting...</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Main Pane: Telegram Clean Encrypted Thread */}
        {activeConv ? (
          <div className="flex-1 flex flex-col relative bg-[#F1F5F9] w-full">
            {/* Chat Thread Header - Telegram Style */}
            <div className="h-15 px-3 sm:px-5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shadow-xs z-10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Back Button to return to chats list */}
                <button
                  type="button"
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
                  title="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <UserAvatar
                  src={activeConv.peer?.avatarUrl}
                  name={activeConv.peer?.displayName}
                  size="md"
                  rounded="rounded-full"
                  showOnlineStatus
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{activeConv.peer?.displayName}</span>
                    {activeConv.peer?.username && (
                      <span className="text-xs text-slate-500 font-normal truncate">@{activeConv.peer.username}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.2">
                    {isCurrentPeerVerified ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified secret chat
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <Lock className="w-2.5 h-2.5 text-emerald-600" />
                        End-to-end encrypted
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-[#0056D2] font-medium text-[11px]">online</span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Self-Destruct Disappearing Messages */}
                <div className="flex items-center gap-1 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 rounded-full px-2.5 py-1 text-xs text-slate-600 transition">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <select
                    value={selfDestructSeconds}
                    onChange={(e) => setSelfDestructSeconds(Number(e.target.value))}
                    className="bg-transparent text-slate-700 text-xs focus:outline-none cursor-pointer font-medium"
                    title="Auto-delete message timer"
                  >
                    <option value={0}>Off</option>
                    <option value={30}>30s</option>
                    <option value={300}>5m</option>
                    <option value={3600}>1h</option>
                    <option value={86400}>24h</option>
                  </select>
                </div>

                <button
                  onClick={handleVerifyPeerSafety}
                  className="p-2 rounded-full text-slate-500 hover:text-[#0056D2] hover:bg-slate-100 transition"
                  title="Verify security fingerprint"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Stream with Telegram Wallpaper Pattern */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 chat-wallpaper-doodle">
              {/* E2EE Secret Chat Card */}
              {peerKeyMissing ? (
                <div className="max-w-sm mx-auto my-3 p-3.5 rounded-2xl bg-amber-50/95 border border-amber-200/80 text-center shadow-xs backdrop-blur-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-xs font-bold text-amber-900">Key Exchange Pending</div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    {activeConv.peer?.displayName || "This user"} will automatically sync their encryption keys upon opening CyberChat.
                  </p>
                </div>
              ) : (
                <div className="max-w-xs sm:max-w-sm mx-auto my-3 p-3.5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs text-center backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">CyberChat Secret Session</div>
                  <div className="text-[11px] text-slate-500 mt-1.5 space-y-0.5 text-left pl-3">
                    <p>• 256-bit AES client-side encryption</p>
                    <p>• Verified ECDSA cryptographic signatures</p>
                    <p>• Leaves zero unencrypted data on servers</p>
                    <p>• Self-destruct message timers supported</p>
                  </div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <CyberSpinner label="Loading conversation..." />
                </div>
              ) : decryptedMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-white/80 backdrop-blur-xs rounded-2xl max-w-xs mx-auto p-5 border border-slate-200/70 shadow-xs">
                  <p className="font-semibold text-slate-700 text-xs">No messages here yet...</p>
                  <p className="text-[11px] text-slate-500 mt-1">Send a greeting to start this private conversation.</p>
                </div>
              ) : (
                decryptedMessages.map((msg) => {
                  const isMine = msg.isMine;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-1.5 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && (
                        activeConv.peer?.avatarUrl ? (
                          <img
                            src={activeConv.peer.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs mb-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0056D2] border border-blue-100 flex items-center justify-center text-sm mb-0.5">
                            <i className="fa-solid fa-circle-user"></i>
                          </div>
                        )
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)] relative group ${
                          isMine
                            ? "bg-[#EEFFDE] text-slate-900 border border-[#DCF4C2] rounded-tr-xs"
                            : "bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs"
                        }`}
                      >
                        {msg.tampered && (
                          <div className="mb-1.5 p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5 font-bold">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                            <span>Message signature failed verification.</span>
                          </div>
                        )}

                        {/* Sticker Rendering */}
                        {msg.sticker ? (
                          <div className="py-1 text-center">
                            <div className="text-5xl filter drop-shadow-sm hover:scale-105 transition-transform cursor-pointer">
                              {msg.sticker.emoji}
                            </div>
                            <div className="font-semibold text-xs text-slate-800 mt-1">
                              {msg.sticker.title || msg.sticker.name}
                            </div>
                          </div>
                        ) : (
                          msg.decryptedText && (
                            <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.decryptedText}
                            </div>
                          )
                        )}

                        {msg.attachment && (
                          <div className="mt-2 pt-1.5 border-t border-black/5">
                            {msg.attachment.isVoiceMemo ? (
                              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/5 text-slate-800">
                                <audio controls src={msg.attachment.url} className="h-8 max-w-[200px]" />
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {msg.attachment.duration || 0}s
                                </span>
                              </div>
                            ) : msg.attachment.mimeType?.startsWith("image/") ? (
                              <div>
                                <img
                                  src={msg.attachment.url}
                                  alt="Decrypted file"
                                  className="rounded-xl max-h-60 object-cover border border-slate-200/80"
                                />
                                <div className="text-[10px] mt-1 flex items-center justify-between text-slate-500">
                                  <span className="truncate max-w-[140px]">{msg.attachment.name}</span>
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="font-medium hover:underline flex items-center gap-0.5 ml-2 text-[#0056D2]"
                                  >
                                    <Download className="w-2.5 h-2.5" /> Save
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={msg.attachment.url}
                                download={msg.attachment.name}
                                className="flex items-center gap-2 p-2 rounded-xl transition text-xs bg-black/5 hover:bg-black/10 text-slate-800"
                              >
                                <FileText className="w-4 h-4 text-[#0056D2]" />
                                <span className="truncate font-medium">{msg.attachment.name}</span>
                                <Download className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                              </a>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 text-[10px] mt-1 text-slate-400 font-normal">
                          {msg.selfDestructSeconds > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-500 mr-1">
                              <Clock className="w-2.5 h-2.5" />
                              {msg.selfDestructSeconds}s
                            </span>
                          )}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#4FAE33]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Area - Telegram Clean Style */}
            <div className="p-2.5 sm:p-3 border-t border-slate-200/80 bg-white/95 backdrop-blur-md relative">
              {/* Emoji & Sticker Drawer Popover */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-16 left-3 sm:left-6 z-30 w-80 sm:w-88 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3 text-slate-900 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  {/* Top Switcher: Emojis vs Stickers */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEmojiPickerTab("emojis")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          emojiPickerTab === "emojis"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        😊 Emojis
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmojiPickerTab("stickers")}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          emojiPickerTab === "stickers"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        🎨 Stickers
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* TAB 1: Emojis */}
                  {emojiPickerTab === "emojis" ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-1 overflow-x-auto pb-2 text-[11px]">
                        {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEmojiCategory(key)}
                            className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition ${
                              emojiCategory === key
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-1 text-xl">
                        {EMOJI_CATEGORIES[emojiCategory]?.emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition hover:scale-120"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* TAB 2: Stickers */
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                        {CYBER_STICKERS.map((sticker) => (
                          <button
                            key={sticker.id}
                            type="button"
                            onClick={() => handleSendSticker(sticker)}
                            className="p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/90 text-left flex items-center gap-2.5 transition hover:scale-[1.02]"
                          >
                            <span className="text-2xl">{sticker.emoji}</span>
                            <div className="overflow-hidden">
                              <div className="font-semibold text-xs leading-tight text-slate-900 truncate">{sticker.title}</div>
                              <div className="text-[9px] text-slate-500 truncate">{sticker.tagline}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(selectedFile || audioBlob) && (
                <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Paperclip className="w-4 h-4 text-[#0056D2]" />
                    <span>
                      {selectedFile ? `File: ${selectedFile.name}` : `Voice Message (${audioDuration}s)`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setAudioBlob(null);
                    }}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isRecordingVoice ? (
                <div className="flex items-center justify-between p-2.5 rounded-full bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2.5 text-red-600 text-xs font-semibold pl-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Recording: {audioDuration}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelVoiceRecording}
                      className="px-3 py-1 text-xs rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopVoiceRecording}
                      className="px-3 py-1 text-xs rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition flex items-center gap-1 shadow-xs"
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
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition shrink-0"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex items-center bg-slate-100 hover:bg-slate-150 focus-within:bg-white border border-slate-200/80 focus-within:border-slate-300 rounded-2xl px-3 py-1 transition">
                    <input
                      ref={textInputRef}
                      type="text"
                      value={messageText}
                      disabled={peerKeyMissing}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={
                        peerKeyMissing
                          ? "Waiting for peer encryption keys..."
                          : "Write a message..."
                      }
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className={`p-1.5 rounded-full transition shrink-0 ${
                        showEmojiPicker
                          ? "text-[#0056D2]"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="Emojis and stickers"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>

                  {messageText.trim() || selectedFile || audioBlob ? (
                    <button
                      type="submit"
                      disabled={peerKeyMissing || sending}
                      className="w-10 h-10 rounded-full bg-[#0056D2] hover:bg-blue-700 text-white flex items-center justify-center transition shadow-xs disabled:opacity-40 shrink-0"
                      title="Send message"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
                      title="Record voice message"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Empty Welcome State - Telegram Clean Watermark */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#F1F5F9] chat-wallpaper-doodle select-none">
            <div className="px-5 py-2.5 rounded-full bg-slate-200/80 backdrop-blur-md text-slate-600 text-xs font-semibold shadow-xs">
              Select a chat to start messaging
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>End-to-End Encrypted & Private</span>
            </div>

            {!profile?.username && (
              <div className="mt-8 p-4 rounded-2xl bg-white/95 border border-slate-200 max-w-sm text-left flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs font-bold text-slate-900">Choose your @username</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Let fellow cyber guards find you easily.</div>
                </div>
                <button
                  onClick={() => setShowUsernameModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs"
                >
                  Set Username
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Create / Edit Username */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#0056D2] font-bold text-base">
                <AtSign className="w-5 h-5" />
                <span>Create Your @username</span>
              </div>
              <button onClick={() => setShowUsernameModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUsername} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose a unique username so other cyber guards can add you directly to their contacts and start chatting.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[#0056D2] font-bold">@</span>
                  <input
                    type="text"
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value)}
                    placeholder="e.g. kofi_cyber"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition font-mono"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">3-24 characters, letters, numbers, and underscores.</div>
              </div>

              {usernameError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {usernameError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={usernameSaving || !newUsernameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {usernameSaving ? "Saving..." : "Save Username"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Profile Picture Photo Upload */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#0056D2] font-bold text-sm">
                <Camera className="w-4 h-4" />
                <span>Profile Picture</span>
              </div>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              <UserAvatar
                src={profile?.avatarUrl}
                name={profile?.displayName}
                size="xl"
                rounded="rounded-3xl"
                className="w-24 h-24 mb-3 border-4 border-[#0056D2] shadow-md"
              />

              <p className="text-xs text-slate-600">Choose a new photo to represent your CyberGuard profile</p>

              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                className="hidden"
              />

              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>{avatarUploading ? "Uploading photo..." : "Upload New Photo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Verify Privacy (Safety Emojis & Verification) */}
      {showSafetyModal && activeConv && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#0056D2] font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>Verify Privacy with {activeConv.peer?.displayName}</span>
              </div>
              <button onClick={() => setShowSafetyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Compare these 4 security emojis with your peer. If they match on both devices, your connection is cryptographically confirmed and safe from any interception.
            </p>

            {safetyInfo && (
              <div className="my-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-4 text-4xl mb-3">
                  {safetyInfo.emojis.map((emoji, idx) => (
                    <span key={idx} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      {emoji}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-bold text-[#0056D2] tracking-wider">
                  Secure Verification Emojis
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => activeConv?.peer?.id && togglePeerVerification(activeConv.peer.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                  isCurrentPeerVerified
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-[#0056D2] text-white hover:bg-blue-700"
                }`}
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isCurrentPeerVerified ? "Mark as Unverified" : "Mark as Verified Peer"}</span>
              </button>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-800 transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Admin-Blinded Inspector (Zero Knowledge Proof) */}
      {showAdminBlindedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#0056D2] font-bold text-base">
                <Database className="w-5 h-5" />
                <span>Raw Database Inspector (Super Admin View)</span>
              </div>
              <button onClick={() => setShowAdminBlindedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-[#0056D2]">Zero-Knowledge Verification:</strong> This live view shows exactly what is stored in the database. Because private keys are stored only in your browser, the Super Admin and server operators only see encrypted ciphertext and random nonces.
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3 font-mono text-[11px]">
              {rawServerMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No message records stored yet</div>
              ) : (
                rawServerMessages.slice(-4).map((raw, idx) => (
                  <div key={raw.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[#0056D2] font-bold mb-2">
                      <span>Row #{idx + 1} • Message ID: {raw.id.slice(0, 8)}...</span>
                      <span className="text-slate-500 text-[10px]">{new Date(raw.createdAt).toISOString()}</span>
                    </div>
                    <div className="space-y-1.5 text-slate-800">
                      <div>
                        <span className="text-slate-500">ciphertext: </span>
                        <span className="text-[#0056D2] break-all">{raw.ciphertext.slice(0, 60)}... (Encrypted blob)</span>
                      </div>
                      <div>
                        <span className="text-slate-500">iv: </span>
                        <span className="text-amber-700">{raw.iv} (Random nonce)</span>
                      </div>
                      <div>
                        <span className="text-slate-500">ecdsa_signature: </span>
                        <span className="text-indigo-700 break-all">{raw.signature.slice(0, 48)}...</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowAdminBlindedModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Key Backup & Passphrase */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#0056D2] font-bold text-base">
                <Key className="w-5 h-5" />
                <span>Encrypted Key Backup</span>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Your private encryption keys reside exclusively in this browser. You can export an encrypted backup with a master passphrase to migrate to another device.
              </p>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Master Passphrase</label>
                <input
                  type="password"
                  value={backupPassphrase}
                  onChange={(e) => setBackupPassphrase(e.target.value)}
                  placeholder="Enter secure passphrase..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 mb-2 focus:outline-none focus:border-[#0056D2]"
                />
                <button
                  onClick={async () => {
                    if (!backupPassphrase || backupPassphrase.length < 6) {
                      setKeyActionMsg("Passphrase must be at least 6 characters.");
                      return;
                    }
                    try {
                      const backup = await exportEncryptedKeyBackup(user.id, backupPassphrase);
                      setExportedBackup(backup);
                      setKeyActionMsg("Backup generated! Copy and save this string safely.");
                    } catch (err) {
                      setKeyActionMsg("Export failed: " + err.message);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white font-bold transition shadow-xs"
                >
                  Generate Encrypted Backup
                </button>

                {exportedBackup && (
                  <div className="mt-3">
                    <textarea
                      readOnly
                      value={exportedBackup}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-[10px] text-[#0056D2]"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(exportedBackup);
                        alert("Backup string copied to clipboard!");
                      }}
                      className="mt-1 text-xs text-[#0056D2] underline flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" /> Copy Backup String
                    </button>
                  </div>
                )}
              </div>

              {keyActionMsg && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[#0056D2] text-xs font-medium">
                  {keyActionMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
