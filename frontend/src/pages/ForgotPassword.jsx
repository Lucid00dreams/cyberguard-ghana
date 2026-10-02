import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import api from "../utils/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, success: false, message: "", error: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, success: false, message: "", error: "" });

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setStatus({
        loading: false,
        success: true,
        message: res.data.message || "A password reset link has been dispatched to your email inbox.",
        error: "",
      });
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        message: "",
        error: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Failed to send reset link. Please try again.",
      });
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 space-y-8">
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 bg-blue-50 text-[#0056D2] rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Your Password?</h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            Enter your registered email address below and we'll send you an official reset link powered by our secure mail gateway.
          </p>
        </div>

        {status.success ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">Reset Link Dispatched!</h3>
              <p className="text-xs leading-relaxed text-emerald-700">
                {status.message}
              </p>
            </div>

            <div className="text-xs text-slate-500 text-center space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-700">Didn't receive the email?</p>
              <p>Check your spam/junk folder or verify that you entered the correct registered email address.</p>
            </div>

            <Link
              to="/login"
              className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status.error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {status.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@school.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {status.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Reset Link…
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0056D2] font-bold">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
