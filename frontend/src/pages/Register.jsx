import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import CyberGuardLogo from "../components/CyberGuardLogo";

const AGES = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, "24+"];

export default function Register() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", ageBand: "JUNIOR" });
  const [selectedAge, setSelectedAge] = useState(15);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const getRedirectTarget = (role) => {
    // 1. Explicit query parameter (?redirectTo=/some-path)
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

    // 2. Intercepted / asked to register to continue work
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

    // 3. Admin / CSA Officer direct login -> /admin
    if (role === "ADMIN" || role === "CSA_OFFICER") {
      return "/admin";
    }

    // 4. Direct account creation: go to homepage
    return "/";
  };

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

  const selectAge = (age) => {
    setSelectedAge(age);
    const band = typeof age === "number" && age <= 18 ? "JUNIOR" : "YOUNG_ADULT";
    setForm((prev) => ({ ...prev, ageBand: band }));
  };

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
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      navigate(getRedirectTarget(data.user?.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Registration failed. Please try again.");
      setShowEmailForm(true);
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
            style={{ backgroundImage: "url('/hero-dashboard.png?v=1038')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

          {/* Top Brand Tag */}
          <div className="relative z-10">
            <CyberGuardLogo variant="full" size="md" theme="dark" subtitle="National COP Academy" />
          </div>

          {/* Center Value Proposition */}
          <div className="relative z-10 space-y-3 my-auto">
            <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
              Protect yourself online with <span className="text-sky-400">CyberGuard</span>.
            </h2>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30">✓</div>
                <p className="text-[11px] text-slate-200 font-normal">100% free courses for Ghanaian students</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30">✓</div>
                <p className="text-[11px] text-slate-200 font-normal">Hands-on MoMo & WhatsApp scam simulations</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30">✓</div>
                <p className="text-[11px] text-slate-200 font-normal">Free 1-on-1 sessions with Ghanaian mentors</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-blue-400/30">✓</div>
                <p className="text-[11px] text-slate-200 font-normal">Verified certificates for your CV or school</p>
              </div>
            </div>
          </div>

          {/* Footer Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-300">
            National Child Online Protection (Ghana)
          </div>
        </div>

        {/* Right Clean Form Section */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white h-full overflow-hidden">
          <div className="max-w-sm w-full mx-auto space-y-3">
            {/* Header */}
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your free account</h1>
              <p className="text-slate-500 text-xs font-normal">
                Join students across Ghana building practical digital safety skills.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Official Google Sign-Up Button */}
            <div id="googleRegisterButtonContainer" className="w-full flex justify-center items-center min-h-[40px] overflow-hidden" />

            {/* Register with Email Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition ${
                showEmailForm
                  ? "border-[#0056D2]/40 bg-blue-50/60 text-[#0056D2]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0056D2]" />
                Register with Email
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEmailForm ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded Email Registration Fields */}
            {showEmailForm && (
              <form onSubmit={handleSubmit} className="space-y-2.5 pt-1" autoComplete="off">
                {/* Full Name */}
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Kofi Mensah)"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                  />
                </div>

                {/* Email Address */}
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Create Password (min 8 chars)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-3 focus:ring-blue-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Age Scroll Wheel */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">
                      Age: <strong className="text-[#0056D2] font-black">{selectedAge} yrs</strong>
                    </span>
                    <span className="text-slate-500 font-medium">
                      {selectedAge <= 18 ? "Secondary School (Junior)" : "Tertiary / Young Adult"}
                    </span>
                  </div>

                  {/* Horizontal Scroll Wheel */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none snap-x">
                    {AGES.map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => selectAge(age)}
                        className={`h-7 min-w-[32px] px-2 rounded-lg text-xs font-bold shrink-0 snap-center transition-all ${
                          selectedAge === age
                            ? "bg-[#0056D2] text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 text-xs hover:scale-[1.01] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Account…
                    </>
                  ) : (
                    <>
                      Create Free Account <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
