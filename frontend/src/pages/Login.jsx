import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberGuardLogo from "../components/CyberGuardLogo";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getRedirectTarget = (role) => {
    const fromState = location.state?.from;
    if (typeof fromState === "string" && fromState.trim().length > 0) return fromState;
    if (fromState?.pathname) return `${fromState.pathname}${fromState.search || ""}`;
    const queryRedirect = searchParams.get("redirectTo");
    if (queryRedirect) return queryRedirect;
    if (role === "ADMIN" || role === "CSA_OFFICER") return "/admin";
    return "/dashboard";
  };

  useEffect(() => {
    /* global google */
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "49831708110-5c9lqdvsfugm99rdtrbvhuhta5g47p63.apps.googleusercontent.com";

    let isInitialized = false;
    let interval = null;

    const renderGoogleBtn = () => {
      if (!window.google?.accounts?.id) return;

      const container = document.getElementById("googleButtonContainer");
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
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "360",
            text: "continue_with",
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
    try {
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));

      const { data } = await api.post("/auth/google", {
        credential: response.credential,
        email: payload.email,
        displayName: payload.name || payload.email.split("@")[0],
        avatarUrl: payload.picture || null,
      });
      login(data.token, data.user);
      navigate(getRedirectTarget(data.user?.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate(getRedirectTarget(data.user?.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "49831708110-5c9lqdvsfugm99rdtrbvhuhta5g47p63.apps.googleusercontent.com";

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            triggerGoogleEmailFallback();
          }
        });
        return;
      } catch (e) {
        // Fallback below
      }
    }
    triggerGoogleEmailFallback();
  }

  async function triggerGoogleEmailFallback() {
    const gEmail = window.prompt("Enter your Google Account email address to sign in:", "student.ghana@gmail.com");
    if (!gEmail) return;

    setLoading(true);
    try {
      const formattedEmail = gEmail.trim().toLowerCase();
      const nameFromEmail = formattedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const { data } = await api.post("/auth/google", {
        email: formattedEmail,
        displayName: nameFromEmail || "Ghana Student",
        avatarUrl: `https://lh3.googleusercontent.com/a/default-user=s96-c`,
      });
      login(data.token, data.user);
      navigate(getRedirectTarget(), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid lg:grid-cols-12 lg:h-[560px]">
        {/* Left Hero Side Banner with Background Photo */}
        <div className="lg:col-span-5 bg-[#001E3C] relative overflow-hidden p-6 sm:p-8 text-white flex flex-col justify-between hidden lg:flex h-full">
          {/* Background Photo Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 scale-105"
            style={{ backgroundImage: "url('/hero-students.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <CyberGuardLogo variant="full" size="md" theme="dark" subtitle="National COP Academy" />
          </div>

          {/* Center Value Proposition */}
          <div className="relative z-10 space-y-3 my-auto">
            <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
              Welcome back to CyberGuard.
            </h2>
            <p className="text-slate-200 text-xs leading-relaxed font-normal">
              Continue your safety modules, book consultations with vetted mentors, and manage your certificates.
            </p>
          </div>

          {/* Footer Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-300">
            National Child Online Protection (Ghana)
          </div>
        </div>

        {/* Right Clean Form Section */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white h-full">
          <div className="max-w-sm w-full mx-auto space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h1>
              <p className="text-slate-500 text-xs font-normal">
                Enter your registered email and password to access your dashboard.
              </p>
            </div>

            {/* Official Google Sign-In Button */}
            <div id="googleButtonContainer" className="w-full flex justify-center items-center min-h-[40px] overflow-hidden" />

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-medium text-slate-500 absolute">
                or continue with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="name@school.edu.gh"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-[#0056D2] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3 px-5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating…
                  </>
                ) : (
                  <>
                    Sign In to Portal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account yet?{" "}
                <Link to="/register" state={{ from: location.state?.from || location }} className="text-[#0056D2] font-bold hover:underline">
                  Create a Free Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

