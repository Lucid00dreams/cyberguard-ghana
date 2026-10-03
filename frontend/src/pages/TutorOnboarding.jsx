import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { uploadFileToR2 } from "../utils/storage";

export default function TutorOnboarding() {
  const { user } = useAuth();
  const location = useLocation();
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
        specialties: specialties.split(",").map((item) => item.trim()).filter(Boolean),
        hourlyRateGHS: Number(hourlyRate),
      };
      if (avatarFile) {
        payload.avatarUrl = await uploadFileToR2(avatarFile, "tutor-avatars");
      }

      const { data } = await api.post("/tutors/apply", payload);
      setStatus({ type: "success", message: data.note || "Your tutor application has been submitted." });
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.msg || "Unable to submit your application.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-signal font-semibold">Tutor onboarding</p>
        <h1 className="text-3xl font-semibold mt-3">Apply to become a CyberGuard tutor</h1>
        <p className="text-mist mt-3">
          Help Ghanaian youth learn online safety and build courses that make cybersecurity easier to understand.
          Submit your profile, then a CyberGuard admin will vet your application.
        </p>
      </div>

      {!user ? (
        <div className="border border-line rounded-xl bg-paper p-10 text-center">
          <p className="text-mist mb-4">Log in or register to apply as a tutor.</p>
          <div className="flex justify-center gap-4">
            <Link to="/login" state={{ from: location, intercepted: true }} className="text-sm font-semibold text-guard">Log in</Link>
            <Link to="/register" state={{ from: location, intercepted: true }} className="text-sm font-semibold bg-guard text-white px-4 py-2 rounded-md">Create account</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-paper border border-line rounded-xl p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Headline</span>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Cybersecurity mentor and mentor coach"
                className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Hourly rate (GHS)</span>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold">Specialties</span>
            <input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="e.g. Phishing awareness, social media safety, password hygiene"
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
            />
            <p className="text-xs text-mist mt-2">Separate multiple specialties with commas.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Profile picture (optional)</span>
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setAvatarFile(file);
                setAvatarPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
            {avatarPreview && <img src={avatarPreview} alt="Tutor preview" className="mt-3 h-20 w-20 rounded-full object-cover" />}
          </label>

          <label className="block">
            <span className="text-sm font-semibold">About you</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="6"
              placeholder="Tell us about your experience, why you want to teach, and the topics you cover."
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm"
            />
          </label>

          {status && (
            <div className={`rounded-xl p-4 text-sm ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-alert/10 text-alert"}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-guard text-white px-6 py-3 font-semibold hover:bg-guardLight disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}
    </div>
  );
}

