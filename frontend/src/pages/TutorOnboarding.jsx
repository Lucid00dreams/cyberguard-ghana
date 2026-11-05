import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { uploadFileToR2 } from "../utils/storage";

export default function TutorOnboarding() {
  const { user } = useAuth();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const payload = {
        headline,
        bio,
        specialties: specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        hourlyRateGHS: Number(hourlyRate),
      };
      if (avatarFile) {
        payload.avatarUrl = await uploadFileToR2(avatarFile, "tutor-avatars");
      }

      const { data } = await api.post("/tutors/apply", payload);
      setStatus({
        type: "success",
        message: data.note || "Your tutor application has been submitted for review.",
      });
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0]?.msg ||
        "Unable to submit your application.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056D2] border border-blue-100 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mentor Application</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Apply to Become a Verified Tutor
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Share practical cybersecurity guidance with Ghanaian students and young adults. Applications are reviewed by an administrator before appearing in the mentor directory.
          </p>
        </div>

        {!user ? (
          <div className="border border-slate-200 rounded-2xl bg-white p-10 text-center space-y-4 shadow-xs">
            <p className="text-sm text-slate-600">
              Sign in or create an account before submitting a tutor application.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/login"
                state={{ from: location, intercepted: true }}
                className="text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                state={{ from: location, intercepted: true }}
                className="text-xs font-bold bg-[#0056D2] hover:bg-[#00419E] text-white px-5 py-2.5 rounded-xl transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Professional Headline *</span>
                <input
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. SOC Analyst & Digital Safety Educator"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] transition"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Hourly Rate (GHS)</span>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0056D2] transition"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Specialties *</span>
              <input
                required
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g. Phishing defense, Mobile Money safety, Account security"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] transition"
              />
              <p className="text-[11px] text-slate-500">
                Separate multiple specialties with commas.
              </p>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Profile Photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-xs text-slate-600"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAvatarFile(file);
                  setAvatarPreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Tutor preview"
                  className="mt-2 h-16 w-16 rounded-full object-cover border border-slate-200"
                />
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Experience &amp; Bio *</span>
              <textarea
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="5"
                placeholder="Describe your background, certifications, and the cybersecurity topics you teach."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0056D2] transition"
              />
            </label>

            {status && (
              <div
                className={`rounded-xl p-3.5 text-xs font-semibold border ${
                  status.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold px-6 py-3 transition disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? "Submitting..." : "Submit Application"}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
