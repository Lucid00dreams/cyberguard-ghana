import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Upload, Fingerprint, Loader2, CheckCircle2, X } from "lucide-react";
import api from "../utils/api";
import { prepareEvidence } from "../utils/evidenceCrypto";

const EASE_OUT = [0.16, 1, 0.3, 1];

const CATEGORIES = [
  { value: "SEXTORTION", label: "Sextortion" },
  { value: "GROOMING", label: "Grooming" },
  { value: "SCAM", label: "Scam / Fraud" },
  { value: "BULLYING", label: "Cyberbullying" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "OTHER", label: "Other" },
];

export default function IncidentReport() {
  const prefersReducedMotion = useReducedMotion();
  const [category, setCategory] = useState("SEXTORTION");
  const [narrative, setNarrative] = useState("");
  const [files, setFiles] = useState([]);
  const [wantFollowup, setWantFollowup] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreferred] = useState("WhatsApp");
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState(null);
  const [error, setError] = useState("");

  async function handleFilesSelected(e) {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      const uniqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2);
      const entry = { id: uniqueId, file, status: "processing" };
      setFiles((prev) => [...prev, entry]);

      try {
        const prepared = await prepareEvidence(file);
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, ...prepared, status: "ready" } : f))
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "error", error: err.message } : f))
        );
      }
    }
    e.target.value = "";
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const readyFiles = files.filter((f) => f.status === "ready");
      const evidence = [];

      for (const f of readyFiles) {
        const { data: presign } = await api.post("/incidents/evidence/presign", {
          mimeType: f.mimeType,
          sha256Hash: f.sha256Hash,
        });

        await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": f.mimeType },
          body: f.cleanFile,
        });

        evidence.push({
          sha256Hash: f.sha256Hash,
          objectKey: presign.objectKey,
          mimeType: f.mimeType,
          byteSize: f.byteSize,
        });
      }

      const { data } = await api.post("/incidents", {
        category,
        narrative,
        evidence,
        contactPhone: wantFollowup ? contactPhone : "",
        contactEmail: wantFollowup ? contactEmail : "",
        contactPreferred: wantFollowup ? contactPreferred : "ANONYMOUS",
      });
      setRefCode(data.refCode);
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not submit your report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-14 sm:pb-16">
      {/* Full-Bleed Quarter-Page Hero */}
      <section className="bg-slate-950 text-white relative overflow-hidden py-12 sm:py-16 px-4 sm:px-6 min-h-[26vh] sm:min-h-[28vh] flex items-center border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-[center_35%] opacity-85"
          style={{ backgroundImage: "url('/hero-threat.png?v=1038')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 via-45% to-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/35" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="max-w-2xl space-y-2.5"
          >
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Report Online Abuse or Fraud
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
              Submit an anonymous or follow-up incident report under Ghana&apos;s Cybersecurity Act, 2020 (Act 1038). No account required.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        {refCode ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-2xs space-y-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Report Submitted
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Save your reference code below to check updates from CSA officers without signing in.
              </p>
            </div>
            <div className="font-mono text-lg sm:text-xl font-bold bg-slate-900 text-white rounded-xl py-3.5 px-4 tracking-wider select-all">
              {refCode}
            </div>
            <div>
              <Link
                to="/report/status"
                className="inline-flex items-center justify-center bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                Track report status →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-2xs">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Incident Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 block">
                  Incident Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`text-xs px-3 py-2.5 rounded-xl font-semibold transition border text-center cursor-pointer ${
                        category === c.value
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* What Happened */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 block">
                  What Happened
                </label>
                <textarea
                  required
                  minLength={20}
                  maxLength={5000}
                  rows={4}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Describe what happened, the platform used, and any relevant usernames or phone numbers..."
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0056D2] leading-relaxed placeholder:text-slate-400"
                />
              </div>

              {/* Evidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Evidence <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Location metadata auto-removed</span>
                </div>

                <label className="flex items-center justify-between gap-3 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 truncate">
                      Attach screenshots or videos
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#0056D2] shrink-0">Browse</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
                </label>

                {files.length > 0 && (
                  <ul className="space-y-1.5 pt-0.5">
                    {files.map((f) => (
                      <li
                        key={f.id}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-slate-800 truncate">{f.file.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.status === "processing" && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                          )}
                          {f.status === "ready" && (
                            <Fingerprint className="w-3.5 h-3.5 text-emerald-600" title="EXIF stripped & hashed" />
                          )}
                          {f.status === "error" && (
                            <span className="text-rose-600 text-[11px] font-semibold">Failed</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(f.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Follow-up Toggle */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantFollowup}
                    onChange={(e) => setWantFollowup(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Request follow-up from a CSA officer{" "}
                    <span className="text-slate-500 font-normal">(leave unchecked to stay anonymous)</span>
                  </span>
                </label>

                {wantFollowup && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200">
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone or WhatsApp (+233...)"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#0056D2]"
                    />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Email address (optional)"
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#0056D2]"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || files.some((f) => f.status === "processing")}
                className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition disabled:opacity-50 cursor-pointer"
              >
                {submitting
                  ? "Submitting..."
                  : wantFollowup
                    ? "Submit Report"
                    : "Submit Anonymous Report"}
              </button>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  CSA Helpline: <strong className="text-slate-800">292</strong> (Toll-Free)
                </span>
                <Link to="/report/status" className="font-semibold text-[#0056D2] hover:underline">
                  Track existing report →
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
