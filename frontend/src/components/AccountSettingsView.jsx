import { useState, useRef, useEffect } from "react";
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
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function AccountSettingsView({ isModal = false, onClose }) {
  const { user, updateUser } = useAuth();

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [ageBand, setAgeBand] = useState(user?.ageBand || "JUNIOR");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  // Profile save status
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Preferences toggles (locally remembered or customizable)
  const [prefs, setPrefs] = useState({
    emailCertificates: true,
    momoSmsAlerts: true,
    securityNotices: true,
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhoneNumber(user.phoneNumber || "");
      setBio(user.bio || "");
      setAgeBand(user.ageBand || "JUNIOR");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // Client-side canvas compression for snappy, fast image uploads
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
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
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

    // Validate size (< 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError("Image is too large. Please select a photo under 10MB.");
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
        // Persist directly to user profile
        const updateRes = await api.patch("/auth/me", { avatarUrl: newUrl });
        updateUser(updateRes.data);
        setProfileFeedback({ type: "success", text: "Profile picture updated successfully!" });
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
    } catch (err) {
      setAvatarError("Failed to remove avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setProfileFeedback({ type: "error", text: "Display name must be at least 2 characters long." });
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
      });

      updateUser(updateRes.data);
      setProfileFeedback({ type: "success", text: "Profile details saved successfully!" });
      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Failed to save profile changes.";
      setProfileFeedback({ type: "error", text: msg });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!passwordForm.currentPassword) {
      setPasswordFeedback({ type: "error", text: "Please provide your current password." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setSavingPassword(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordFeedback({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordFeedback(null), 4000);
    } catch (err) {
      setPasswordFeedback({
        type: "error",
        text: err.response?.data?.error || "Failed to update password. Verify current password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  const roleBadgeStyle = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    CSA_OFFICER: "bg-blue-100 text-blue-800 border-blue-200",
    TUTOR: "bg-amber-100 text-amber-800 border-amber-200",
    STUDENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }[user?.role || "STUDENT"];

  return (
    <div className={`${isModal ? "p-6" : "space-y-8"} max-w-6xl mx-auto`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0056D2]" />
            <span>Account Center</span>
            <span className="text-slate-300">•</span>
            <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wide border ${roleBadgeStyle}`}>
              {user?.role || "STUDENT"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account & Profile Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalize your identity, manage profile photo, contact details, and platform credentials.
          </p>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Feedback Alert */}
      {profileFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-xs transition-all ${
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
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid of Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* ===================== CARD 1: AVATAR & IDENTITY ===================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0056D2]" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Profile Photo & Identity
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />

                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-slate-100 ring-2 ring-slate-200/80">
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white p-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="text-[10px] font-bold mt-1">Uploading...</span>
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "Profile photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0056D2] to-teal-600 text-white font-black text-5xl flex items-center justify-center">
                      <i className="fa-solid fa-circle-user"></i>
                    </div>
                  )}
                </div>

                {/* Camera Action Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Upload new photo"
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-900 hover:bg-[#0056D2] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 border-2 border-white cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {displayName || "Unnamed User"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              </div>

              {avatarError && (
                <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  {avatarError}
                </p>
              )}

              {/* Avatar Action Buttons */}
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

          {/* Identity & Account Badges Footer */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Access Tier</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${roleBadgeStyle}`}>
                {user?.role || "STUDENT"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Verification</span>
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authenticated
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Security Alignment</span>
              <span className="text-slate-700 font-semibold text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#0056D2]" /> Ghana NCSC Certified
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Supports square JPG, PNG or WebP under 10MB.
            </p>
          </div>
        </div>

        {/* ===================== CARD 2: PROFILE DETAILS FORM ===================== */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#0056D2]" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Profile Details
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Editable
              </span>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Full Name or Display Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">On certificates & badges</span>
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
                  <span className="text-[10px] font-bold text-emerald-600">Verified</span>
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
                  <span className="text-[10px] text-slate-400 font-normal">Ghana MoMo / SMS alerts</span>
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

              {/* Age Band Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Target Curriculum Category
                </label>
                <select
                  value={ageBand}
                  onChange={(e) => setAgeBand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                >
                  <option value="JUNIOR">Junior Learner (Primary, JHS & SHS Students)</option>
                  <option value="YOUNG_ADULT">Young Adult & Professional (Tertiary, Fintech, Practitioners)</option>
                </select>
              </div>

              {/* Bio / Headline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>About You / Bio</span>
                  <span className="text-[10px] text-slate-400">{bio.length}/300</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your learning journey or cybersecurity interests..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Profile Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ===================== CARD 3: SECURITY & PASSWORD FORM ===================== */}
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Security & Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? "Hide text" : "Reveal text"}</span>
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
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">New Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <span>Use at least 8 characters including uppercase, lowercase, and numbers for optimal security.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-40 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ===================== CARD 4: NOTIFICATION PREFERENCES ===================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  Notification Preferences
                </h3>
              </div>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Live Alerts
              </span>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800">Certificate & Milestone Alerts</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Receive notifications upon completing courses and earning credentials.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.emailCertificates}
                  onChange={(e) => setPrefs({ ...prefs, emailCertificates: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0056D2] focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800">MoMo Security & Scam Alerts</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Urgent mobile security notifications regarding new SMS phishing scams in Ghana.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.momoSmsAlerts}
                  onChange={(e) => setPrefs({ ...prefs, momoSmsAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0056D2] focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Privacy & Compliance Section */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Shield className="w-3.5 h-3.5 text-[#0056D2]" />
                <span>Ghana Data Protection Act (Act 843)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your profile data and contact details are strictly encrypted and used exclusively for your learning credentials and fraud prevention.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Session Security: TLS 1.3 Active</span>
              <span className="text-emerald-600 font-medium">Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
