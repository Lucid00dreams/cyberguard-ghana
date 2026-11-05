import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
  Check,
  Camera,
  Sparkles,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Phone,
  FileText,
  Compass,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberGuardLogo from "../components/CyberGuardLogo";

const EASE_OUT = [0.22, 1, 0.36, 1];

const PRESET_AVATARS = [
  {
    id: "shield-blue",
    label: "Cyber Shield",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberShield&backgroundColor=001e3c",
  },
  {
    id: "student-kwame",
    label: "Tech Scholar",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kwame&backgroundColor=b6e3f4",
  },
  {
    id: "student-akua",
    label: "Digital Leader",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akua&backgroundColor=c0aede",
  },
  {
    id: "cyber-sentinel",
    label: "Sentinel",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=SentinelGhana&backgroundColor=0056d2",
  },
  {
    id: "defender-kofi",
    label: "MoMo Defender",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi&backgroundColor=d1d4f9",
  },
  {
    id: "guardian-ama",
    label: "Safety Scout",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ama&backgroundColor=ffd5dc",
  },
];

function calculateAge(dobString) {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function Register() {
  const prefersReducedMotion = useReducedMotion();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Step state: 1 = Essentials (DOB, Email, Password), 2 = Verify Email OTP, 3 = Profile & Bio, 4 = Allocated Courses Celebration
  const [step, setStep] = useState(1);

  // Step 1: Essentials Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [receiveDailyTips, setReceiveDailyTips] = useState(false);
  const receiveDailyTipsRef = useRef(false);

  // Step 2: Verification State
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3: Profile Personalization
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Step 4: Completion State
  const [completionData, setCompletionData] = useState(null);

  // Global feedback & loading
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const calculatedAge = calculateAge(dateOfBirth);

  const getRedirectTarget = (role) => {
    const queryRedirect = searchParams.get("redirectTo");
    if (
      queryRedirect &&
      typeof queryRedirect === "string" &&
      queryRedirect.startsWith("/") &&
      !queryRedirect.startsWith("/login") &&
      !queryRedirect.startsWith("/register")
    ) {
      return queryRedirect;
    }

    const fromState = location.state?.from;
    const isIntercepted = Boolean(location.state?.intercepted);
    if (fromState && (isIntercepted || typeof fromState === "string" || fromState?.pathname)) {
      let targetPath = "";
      if (typeof fromState === "string") {
        targetPath = fromState;
      } else if (fromState?.pathname) {
        targetPath = `${fromState.pathname}${fromState.search || ""}${fromState.hash || ""}`;
      }
      if (
        targetPath &&
        targetPath !== "/" &&
        !targetPath.startsWith("/login") &&
        !targetPath.startsWith("/register")
      ) {
        return targetPath;
      }
    }

    if (role === "ADMIN" || role === "CSA_OFFICER") {
      return "/admin";
    }

    return "/dashboard";
  };

  // Google OAuth button initialization
  useEffect(() => {
    /* global google */
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "49831708110-5c9lqdvsfugm99rdtrbvhuhta5g47p63.apps.googleusercontent.com";

    let isInitialized = false;
    let interval = null;

    const renderGoogleBtn = () => {
      if (!window.google?.accounts?.id) return;
      const container = document.getElementById("googleRegisterButtonContainer");
      if (!container) return;

      try {
        if (!isInitialized) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isInitialized = true;
        }

        if (container.childElementCount === 0) {
          const containerWidth = Math.min(container.offsetWidth || 340, 360);
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: String(Math.max(containerWidth, 240)),
            text: "signup_with",
            shape: "rectangular",
          });
        }

        if (isInitialized && container.childElementCount > 0 && interval) {
          clearInterval(interval);
          interval = null;
        }
      } catch (e) {
        console.warn("Google SDK init notice:", e);
      }
    };

    renderGoogleBtn();
    interval = setInterval(renderGoogleBtn, 400);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  async function handleGoogleResponse(response) {
    if (!response?.credential) return;
    setLoading(true);
    setError("");
    try {
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));

      const { data } = await api.post("/auth/google", {
        credential: response.credential,
        email: payload.email,
        displayName: payload.name || payload.email.split("@")[0],
        avatarUrl: payload.picture || null,
        receiveDailyTips: receiveDailyTipsRef.current,
        dateOfBirth: dateOfBirth || undefined,
      });

      if (data.isNewUser && !data.welcomeDispatchedByBackend && data.token) {
        fetch("/api/welcome", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.token}` },
        }).catch(() => {});
      }

      login(data.token, data.user);

      if (data.isNewUser && Array.isArray(data.allocatedCourses) && data.allocatedCourses.length > 0) {
        setCompletionData({
          user: data.user,
          allocatedCourses: data.allocatedCourses,
          ageBand: data.user.ageBand,
        });
        setStep(4);
      } else {
        navigate(getRedirectTarget(data.user?.role), { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 1 -> STEP 2: Send Email OTP
  async function handleStep1Submit(e) {
    e.preventDefault();
    setError("");

    if (!dateOfBirth) {
      setError("Please select your date of birth.");
      return;
    }

    if (calculatedAge === null || calculatedAge < 10) {
      setError("Learners must be at least 10 years old to register.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register-send-otp", {
        email: email.trim(),
        password,
        dateOfBirth,
      });

      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          "Unable to send verification code. Please check your email address."
      );
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register-send-otp", {
        email: email.trim(),
        password,
        dateOfBirth,
      });
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2 -> STEP 3: Verify OTP
  async function handleStep2Submit(e) {
    e.preventDefault();
    setError("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register-verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });

      setVerificationToken(data.verificationToken);
      // Auto-populate display name prefix from email if empty
      if (!displayName) {
        const guessedName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        setDisplayName(guessedName);
      }
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Client-side canvas photo compression for avatar upload
  function compressImage(file, maxWidth = 480, maxHeight = 480) {
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

  async function handleAvatarFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.jpg, .png, .webp).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image size is too large (max 8MB).");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    try {
      const base64Data = await compressImage(file);
      setAvatarUrl(base64Data);
    } catch (err) {
      console.warn("Avatar processing error:", err);
      setError("Could not read image file. Please try another photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // STEP 3 -> STEP 4: Complete Registration
  async function handleStep3Submit(e) {
    e.preventDefault();
    setError("");

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register-complete", {
        verificationToken,
        email: email.trim(),
        password,
        dateOfBirth,
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl,
        receiveDailyTips,
      });

      if (data.isNewUser && !data.welcomeDispatchedByBackend && data.token) {
        fetch("/api/welcome", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.token}` },
        }).catch(() => {});
      }

      login(data.token, data.user);
      setCompletionData({
        user: data.user,
        allocatedCourses: data.allocatedCourses || [],
        ageBand: data.ageBand,
        age: data.age,
      });
      setStep(4);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.errors?.[0]?.msg ||
          "Failed to complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Animation variants
  const stepMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 12 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
        transition: { duration: 0.22, ease: EASE_OUT },
      };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid lg:grid-cols-12 lg:min-h-[640px]">
        {/* Left Hero Side Banner */}
        <div className="lg:col-span-5 bg-[#001E3C] relative overflow-hidden p-6 sm:p-8 text-white flex flex-col justify-between hidden lg:flex h-full">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75 scale-105"
            style={{ backgroundImage: "url('/hero-dashboard.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/45" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <CyberGuardLogo variant="full" size="md" theme="dark" subtitle="National COP Academy" />
          </div>

          {/* Center Value Proposition */}
          <div className="relative z-10 space-y-3.5 my-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-sky-300 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Smart Age Track Allocation</span>
            </div>

            <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
              Learn cyber safety built for everyday life in Ghana.
            </h2>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-slate-200 font-normal leading-relaxed">
                  <strong>Automated Course Allocation:</strong> We match your age to Junior or Young Adult curricula.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-slate-200 font-normal leading-relaxed">
                  <strong>Hands-on Threat Labs:</strong> Test fake MoMo reversal SMS, WhatsApp traps &amp; link vetting.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-slate-200 font-normal leading-relaxed">
                  <strong>Mentorship &amp; Support:</strong> 1-on-1 private encrypted chat with vetted Ghanaian mentors.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-slate-200 font-normal leading-relaxed">
                  <strong>Verifiable Certificates:</strong> Share earned digital safety credentials with schools &amp; employers.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Cyber Security Authority (CSA)</span>
            <span className="font-mono text-[10px] text-slate-400">Act 1038</span>
          </div>
        </div>

        {/* Right Dynamic Stepped Form Section */}
        <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-center bg-white h-full">
          <div className="max-w-md w-full mx-auto space-y-4">
            {/* Step Progress Tracker (Steps 1–3) */}
            {step < 4 && (
              <div className="space-y-2 pb-1 border-b border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="uppercase tracking-wider text-slate-400">Step {step} of 3</span>
                  <span className="text-[#0056D2] font-bold">
                    {step === 1 && "Account Essentials"}
                    {step === 2 && "Email Verification"}
                    {step === 3 && "Profile Setup"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 h-1.5">
                  <div className={`h-full rounded-full transition-colors ${step >= 1 ? "bg-[#0056D2]" : "bg-slate-100"}`} />
                  <div className={`h-full rounded-full transition-colors ${step >= 2 ? "bg-[#0056D2]" : "bg-slate-100"}`} />
                  <div className={`h-full rounded-full transition-colors ${step >= 3 ? "bg-[#0056D2]" : "bg-slate-100"}`} />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ========================================================================= */}
              {/* STEP 1: ESSENTIALS (DOB, EMAIL, PASSWORD, DAILY TIPS OPT-IN)              */}
              {/* ========================================================================= */}
              {step === 1 && (
                <motion.div key="step-1" {...stepMotion} className="space-y-4">
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Create your student account
                    </h1>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Enter your date of birth so we can allocate the right courses for your age.
                    </p>
                  </div>

                  {/* Google OAuth Quick Sign-Up */}
                  <div className="space-y-2">
                    <div
                      id="googleRegisterButtonContainer"
                      className="w-full flex justify-center items-center min-h-[40px] overflow-hidden"
                    />

                    <div className="relative flex items-center justify-center py-1">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                        Or register with email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleStep1Submit} className="space-y-3" autoComplete="off">
                    {/* Date of Birth Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Date of Birth</span>
                        {calculatedAge !== null && calculatedAge >= 10 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              calculatedAge <= 18
                                ? "bg-blue-50 text-[#0056D2] border border-blue-200/60"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            }`}
                          >
                            Age {calculatedAge} • {calculatedAge <= 18 ? "Junior Track (12–18)" : "Young Adult Track (19+)"}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split("T")[0]}
                          min="1920-01-01"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Used only to assign appropriate curriculum and protect minor privacy under Ghana Act 1038.
                      </p>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. kofi.mensah@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Password</span>
                        <span className="text-[10px] text-slate-400 font-normal">Min. 8 characters</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Daily Tips Opt-In */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 hover:border-blue-200 transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receiveDailyTips}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          receiveDailyTipsRef.current = checked;
                          setReceiveDailyTips(checked);
                        }}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0056D2] focus:ring-[#0056D2] cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] leading-snug text-slate-700">
                        <strong className="font-bold text-slate-900 block">
                          Receive daily cyber safety tips?
                        </strong>
                        Get a short 60-second tip every morning at 7:00 AM in your inbox.
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/15 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Verification Code…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Verification</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-600">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        state={
                          location.state?.intercepted && location.state?.from
                            ? { from: location.state.from, intercepted: true }
                            : undefined
                        }
                        className="text-[#0056D2] font-bold hover:underline"
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: EMAIL VERIFICATION OTP                                            */}
              {/* ========================================================================= */}
              {step === 2 && (
                <motion.div key="step-2" {...stepMotion} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(1);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to essentials</span>
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">10-minute expiry</span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center mb-2">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Check your email inbox
                    </h2>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      We sent a unique 6-digit security code to:
                      <br />
                      <strong className="text-slate-900 font-mono text-xs font-bold">{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleStep2Submit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Enter 6-Digit Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className="w-full text-center text-2xl font-mono font-bold tracking-[0.45em] py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0056D2] focus:outline-none focus:ring-3 focus:ring-blue-500/10 transition text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.trim().length !== 6}
                      className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/15 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying code…</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Resend actions */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span>Didn&apos;t receive the code?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendOtp}
                      className="text-[#0056D2] font-bold hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: PROFILE PERSONALIZATION & DETAILS                                 */}
              {/* ========================================================================= */}
              {step === 3 && (
                <motion.div key="step-3" {...stepMotion} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Personalize your profile
                    </h2>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Choose an avatar and tell us how you&apos;d like to appear on CyberGuard Ghana.
                    </p>
                  </div>

                  <form onSubmit={handleStep3Submit} className="space-y-3.5">
                    {/* Avatar Picker & Upload */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">Choose Profile Picture</label>

                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#0056D2] bg-slate-100 shrink-0 shadow-xs">
                          <img src={avatarUrl} alt="Selected avatar" className="w-full h-full object-cover" />
                          {uploadingAvatar && (
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-500" />
                            <span>Upload photo</span>
                          </button>
                          <p className="text-[11px] text-slate-400">or pick one of our Ghana student avatars below</p>
                        </div>
                      </div>

                      {/* Preset avatar grid */}
                      <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-1">
                        {PRESET_AVATARS.map((p) => {
                          const isSelected = avatarUrl === p.url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setAvatarUrl(p.url)}
                              title={p.label}
                              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden border-2 p-0.5 transition cursor-pointer ${
                                isSelected
                                  ? "border-[#0056D2] ring-2 ring-blue-500/20 scale-105"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <img src={p.url} alt={p.label} className="w-full h-full object-cover rounded-md sm:rounded-lg" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name / Display Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kwame Mensah"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                        />
                      </div>
                    </div>

                    {/* Mobile Phone Number (Optional) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Mobile Phone Number</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional (for emergency alerts)</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="+233 24 000 0000"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                        />
                      </div>
                    </div>

                    {/* Bio / Learning Interests */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Bio &amp; Learning Goals</span>
                        <span className="text-[10px] text-slate-400">{bio.length}/250</span>
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <textarea
                          rows={2}
                          maxLength={250}
                          placeholder="e.g. SHS student interested in software engineering, MoMo fraud prevention, and online safety."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition resize-none"
                        />
                      </div>
                    </div>

                    {/* Complete Button */}
                    <button
                      type="submit"
                      disabled={loading || !displayName.trim()}
                      className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/15 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Account &amp; Allocating Courses…</span>
                        </>
                      ) : (
                        <>
                          <span>Complete &amp; Allocate My Courses</span>
                          <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: ALLOCATED COURSES CELEBRATION & DESTINATION NAVIGATION            */}
              {/* ========================================================================= */}
              {step === 4 && completionData && (
                <motion.div key="step-4" {...stepMotion} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80 shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Welcome, {completionData.user?.displayName?.split(" ")[0]}!
                    </h2>

                    <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                      Your account is active. Based on your birth date, you have been assigned to the{" "}
                      <strong className="text-[#0056D2]">
                        {completionData.ageBand === "JUNIOR" ? "Junior Track (Ages 12–18)" : "Young Adult Track (Ages 19+)"}
                      </strong>
                      .
                    </p>
                  </div>

                  {/* Allocated Courses Card */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <BookOpen className="w-4 h-4 text-[#0056D2]" />
                        <span>Allocated Starter Courses</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Auto-Enrolled
                      </span>
                    </div>

                    {completionData.allocatedCourses && completionData.allocatedCourses.length > 0 ? (
                      <div className="space-y-2">
                        {completionData.allocatedCourses.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{c.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{c.category || "Cyber Safety"}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                              Ready
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic text-center py-2">
                        Browse the course catalog to start learning.
                      </p>
                    )}
                  </div>

                  {/* Action Navigation Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(getRedirectTarget(completionData.user?.role), { replace: true })}
                      className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/15 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] cursor-pointer"
                    >
                      <span>Go to Student Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/courses", { replace: true })}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-slate-500" />
                      <span>Browse Course Catalog</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
