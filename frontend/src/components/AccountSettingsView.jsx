import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  User,
  Camera,
  Phone,
  Mail,
  Shield,
  FileText,
  Lock,
  Check,
  X,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Bell,
  Award,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import DeleteAccountSection from "./DeleteAccountSection";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  CSA_OFFICER: "CSA Officer",
  TUTOR: "Verified Tutor",
  STUDENT: "Learner",
};

export default function AccountSettingsView({ isModal = false, onClose }) {
  const { user, updateUser } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [ageBand, setAgeBand] = useState(user?.ageBand || "JUNIOR");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  // Profile save status
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Database-backed preference: Daily 7:00 AM GMT Cyber Safety Tips
  const [receiveDailyTips, setReceiveDailyTips] = useState(Boolean(user?.receiveDailyTips));
  const [savingTipsPref, setSavingTipsPref] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhoneNumber(user.phoneNumber || "");
      setBio(user.bio || "");
      setAgeBand(user.ageBand || "JUNIOR");
      setDateOfBirth(
        user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""
      );
      setAvatarUrl(user.avatarUrl || "");
      setReceiveDailyTips(Boolean(user.receiveDailyTips));
    }
  }, [user]);

  async function handleToggleDailyTips(e) {
    const checked = e.target.checked;
    setReceiveDailyTips(checked);
    setSavingTipsPref(true);
    try {
      const res = await api.patch("/auth/me", { receiveDailyTips: checked });
      updateUser(res.data);
      setProfileFeedback({
        type: "success",
        text: checked
          ? "Subscribed to 7:00 AM GMT Daily Cyber Safety Tips."
          : "Unsubscribed from 7:00 AM GMT Daily Cyber Safety Tips.",
      });
      setTimeout(() => setProfileFeedback(null), 3500);
    } catch {
      setReceiveDailyTips(!checked);
      setProfileFeedback({
        type: "error",
        text: "Could not update your daily email preference. Please try again.",
      });
    } finally {
      setSavingTipsPref(false);
    }
  }

  // Client-side canvas compression for fast avatar uploads
  function compressImage(file, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError("Image is too large. Please select a photo under 10 MB.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError("");

    try {
      const base64Data = await compressImage(file, 800, 800);
      const res = await api.post("/uploads/image", { image: base64Data });
      const newUrl = res.data?.url;

      if (newUrl) {
        setAvatarUrl(newUrl);
        const updateRes = await api.patch("/auth/me", { avatarUrl: newUrl });
        updateUser(updateRes.data);
        setProfileFeedback({ type: "success", text: "Profile picture updated." });
        setTimeout(() => setProfileFeedback(null), 3500);
      }
    } catch (err) {
      setAvatarError(err.response?.data?.error || "Failed to upload image. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const updateRes = await api.patch("/auth/me", { avatarUrl: null });
      setAvatarUrl("");
      updateUser(updateRes.data);
      setProfileFeedback({ type: "success", text: "Profile picture removed." });
      setTimeout(() => setProfileFeedback(null), 3500);
    } catch {
      setAvatarError("Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setProfileFeedback({
        type: "error",
        text: "Display name must be at least 2 characters long.",
      });
      return;
    }

    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const updateRes = await api.patch("/auth/me", {
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        ageBand,
        dateOfBirth: dateOfBirth || null,
      });

      updateUser(updateRes.data);
      setProfileFeedback({ type: "success", text: "Profile details saved." });
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to save profile changes.";
      setProfileFeedback({ type: "error", text: msg });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!passwordForm.currentPassword) {
      setPasswordFeedback({ type: "error", text: "Enter your current password." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.token) {
        localStorage.setItem("cg_token", res.data.token);
      }

      setPasswordFeedback({ type: "success", text: "Password updated. Other active sessions were signed out." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordFeedback(null), 4500);
    } catch (err) {
      setPasswordFeedback({
        type: "error",
        text: err.response?.data?.error || "Failed to update password. Check your current password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  const roleBadgeStyle = {
    ADMIN: "bg-slate-100 text-slate-800 border-slate-200",
    CSA_OFFICER: "bg-slate-100 text-slate-700 border-slate-200",
    TUTOR: "bg-slate-100 text-slate-700 border-slate-200",
    STUDENT: "bg-slate-100 text-slate-700 border-slate-200",
  }[user?.role || "STUDENT"];

  const memberSinceLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GH", {
        month: "short",
        year: "numeric",
      })
    : "Active";

  const cardMotion = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.24, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className={`${isModal ? "p-6" : "space-y-6"} max-w-6xl mx-auto`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/80">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Account & Profile Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your profile photo, display details, password, and email preferences.
          </p>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Feedback Alert */}
      <AnimatePresence>
        {profileFeedback && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
              profileFeedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {profileFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{profileFeedback.text}</span>
            </div>
            <button
              onClick={() => setProfileFeedback(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid of Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: AVATAR & ACCOUNT SUMMARY */}
        <motion.div
          {...cardMotion(0)}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Camera className="w-4 h-4 text-[#0056D2]" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Profile Photo
              </h3>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 pt-5">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />

                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-slate-100 ring-1 ring-slate-200">
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white p-2">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span className="text-[10px] font-bold mt-1">Uploading...</span>
                    </div>
                  ) : (
                    <UserAvatar
                      src={avatarUrl}
                      name={displayName}
                      size="xl"
                      rounded="rounded-full"
                      className="w-full h-full"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Upload new photo"
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-900 hover:bg-[#0056D2] text-white flex items-center justify-center shadow-sm transition-colors border-2 border-white cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {displayName || "Learner"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              </div>

              {avatarError && (
                <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  {avatarError}
                </p>
              )}

              <div className="w-full max-w-xs flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  <span>Choose Photo</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Factual Account Summary */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Account role</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadgeStyle}`}
              >
                {ROLE_LABELS[user?.role] || user?.role || "Learner"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Member since</span>
              <span className="text-slate-800 font-semibold">{memberSinceLabel}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">7:00 AM daily tips</span>
              <span
                className={`font-semibold ${
                  receiveDailyTips ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {receiveDailyTips ? "Subscribed" : "Off"}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              JPG, PNG, or WebP up to 10 MB.
            </p>
          </div>
        </motion.div>

        {/* CARD 2: PROFILE DETAILS FORM */}
        <motion.form
          {...cardMotion(0.04)}
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-[#0056D2]" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Profile Details
              </h3>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Full Name or Display Name *</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Shown on certificates
                  </span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email (Read only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[11px] font-medium text-slate-400">Sign-in email</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Ghana Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Mobile Phone Number</span>
                  <span className="text-[11px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+233 54 000 0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Date of Birth & Learning Track Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Date of Birth</span>
                    <span className="text-[11px] text-slate-400 font-normal">For age curriculum</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      min="1920-01-01"
                      value={dateOfBirth}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDateOfBirth(val);
                        if (val) {
                          const birth = new Date(val);
                          if (!isNaN(birth.getTime())) {
                            const now = new Date();
                            let age = now.getFullYear() - birth.getFullYear();
                            const m = now.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                            setAgeBand(age <= 18 ? "JUNIOR" : "YOUNG_ADULT");
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Learning Track</label>
                  <select
                    value={ageBand}
                    onChange={(e) => setAgeBand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  >
                    <option value="JUNIOR">
                      Junior Learner (Primary, JHS &amp; SHS Students)
                    </option>
                    <option value="YOUNG_ADULT">
                      Young Adult &amp; Professional (Tertiary, Fintech, Practitioners)
                    </option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Bio</span>
                  <span className="text-[11px] text-slate-400">{bio.length}/300</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your learning goals or cybersecurity interests..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* CARD 3: PASSWORD & SESSION SECURITY */}
        <motion.form
          {...cardMotion(0.08)}
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0056D2]" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  Change Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                  passwordFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border border-rose-200 text-rose-900"
                }`}
              >
                <span>{passwordFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setPasswordFeedback(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  New Password (8+ characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <span>
                Include uppercase, lowercase, and a number. Updating your password automatically invalidates older signed-in sessions.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={
                savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-40 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* CARD 4: EMAIL & PRIVACY */}
        <motion.div
          {...cardMotion(0.12)}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="w-4 h-4 text-[#0056D2]" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Email & Data Privacy
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-900">
                    Daily 7:00 AM GMT Cyber Safety Tips
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Receive one short, practical cyber defense tip in your email inbox every morning at 7:00 AM GMT. Saved directly to your account.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={savingTipsPref}
                  checked={receiveDailyTips}
                  onChange={handleToggleDailyTips}
                  className="w-4 h-4 rounded text-[#0056D2] focus:ring-0 cursor-pointer shrink-0"
                />
              </label>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Award className="w-3.5 h-3.5 text-[#0056D2]" />
                  <span>Course Certificates</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Verifiable completion certificates are issued automatically in your Certificates tab when you finish all modules and pass the final quiz.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-[#0056D2]" />
                <span>Ghana Data Protection Act (Act 843)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your profile details are used only for your learning account, mentorship bookings, and certificates. You can export certificates or permanently delete your account below at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* DANGER ZONE: DELETE ACCOUNT */}
      <DeleteAccountSection />
    </div>
  );
}
