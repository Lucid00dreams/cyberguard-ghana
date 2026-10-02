import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, KeyRound } from "lucide-react";
import api from "../utils/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState({ loading: false, success: false, message: "", error: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: false, success: false, message: "", error: "" });

    if (!token) {
      setStatus({ loading: false, success: false, message: "", error: "Missing or invalid password reset token." });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setStatus({ loading: false, success: false, message: "", error: "Passwords do not match." });
      return;
    }

    setStatus({ loading: true, success: false, message: "", error: "" });

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });

      setStatus({
        loading: false,
        success: true,
        message: res.data.message || "Your password has been updated successfully!",
        error: "",
      });
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        message: "",
        error: err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Failed to reset password. Link may have expired.",
      });
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 space-y-8">
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-slate-500 text-xs leading-relaxed">
            Please choose a strong password (minimum 8 characters, with at least 1 uppercase letter and 1 digit).
          </p>
        </div>

        {status.success ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">Password Updated!</h3>
              <p className="text-xs leading-relaxed text-emerald-700">
                {status.message}
              </p>
            </div>

            <Link
              to="/login"
              className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center text-xs"
            >
              Sign In to Portal
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status.error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {status.error}
              </div>
            )}

            {!token && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center">
                Invalid or missing reset token. Please request a new link from the forgot password page.
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status.loading || !token}
              className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {status.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Resetting Password…
                </>
              ) : (
                <>
                  Confirm New Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-600 hover:text-[#0056D2] font-bold">
                Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
