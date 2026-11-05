import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Upload, Fingerprint, Loader2, CheckCircle2, X, ArrowRight } from "lucide-react";
import api from "../utils/api";
import { prepareEvidence } from "../utils/evidenceCrypto";

const CATEGORIES = [
  { value: "SEXTORTION", label: "Sextortion" },
  { value: "GROOMING", label: "Grooming" },
  { value: "SCAM", label: "Scam / Fraud" },
  { value: "BULLYING", label: "Cyberbullying" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "OTHER", label: "Other" },
];

export default function IncidentReport() {
  const [category, setCategory] = useState("SEXTORTION");
  const [narrative, setNarrative] = useState("");
  const [files, setFiles] = useState([]); // { file, status, sha256Hash, metadataStripped, error }
  const [wantFollowup, setWantFollowup] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreferred, setContactPreferred] = useState("WhatsApp");
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState(null);
  const [error, setError] = useState("");

  async function handleFilesSelected(e) {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
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

      // Upload each scrubbed file directly to R2 via a pre-signed URL,
      // then include only the resulting hash + storage key in the report.
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
      setError(err.response?.data?.error || "Something went wrong submitting your report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (refCode) {
    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Report submitted
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Save this reference code in a safe place. You can use it anytime to check updates from CSA officers without signing in.
            </p>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold bg-[#001E3C] text-white rounded-xl py-4 px-4 tracking-wider select-all">
            {refCode}
          </div>
          <div className="pt-1">
            <Link
              to="/report/status"
              className="inline-flex items-center justify-center bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              Check report status →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Clean Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Confidential Incident Desk</span>
            <span className="text-red-300">•</span>
            <span>No Account Required</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report Online Abuse or Fraud
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Submit an anonymous or follow-up report under Ghana&apos;s Cybersecurity Act, 2020 (Act 1038). Camera and GPS EXIF metadata are stripped locally from uploaded images before submission.
          </p>
        </div>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Category */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                1. Incident Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`text-xs px-3 py-2.5 rounded-xl font-bold transition border text-center ${category === c.value
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Narrative */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                2. Incident Details
              </label>
              <textarea
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe what happened with as much detail as you feel comfortable sharing (usernames, platforms, timelines). Do not share your real name or personal address unless requesting direct contact."
                className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* Step 3: Evidence */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                3. Attach Evidence (Optional)
              </label>
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 rounded-2xl p-6 cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">Upload Screenshots or Documents</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Images & videos are scrubbed of EXIF/GPS tags</p>
                </div>
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFilesSelected} />
              </label>

              {files.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {files.map((f) => (
                    <li key={f.id} className="border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 flex items-center justify-between">
                      <div className="truncate max-w-[70%]">
                        <span className="font-bold text-slate-800 truncate block">{f.file.name}</span>
                        {f.status === "ready" && (
                          <span className="font-mono text-[10px] text-slate-500 block truncate">
                            Metadata stripped • sha256:{f.sha256Hash?.slice(0, 16)}…
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {f.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        {f.status === "ready" && <Fingerprint className="w-4 h-4 text-emerald-600" />}
                        {f.status === "error" && <span className="text-red-600 text-xs font-bold">Failed</span>}
                        <button type="button" onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-red-600 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Step 4: Optional Follow-up */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantFollowup}
                  onChange={(e) => setWantFollowup(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Allow direct CSA Officer / Police Follow-up (Optional)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    Leave unchecked to remain 100% anonymous. Only check if you would like dedicated victim counseling or direct investigation contact.
                  </span>
                </div>
              </label>

              {wantFollowup && (
                <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Phone or WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+233 24 000 0000"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="reporter@domain.com"
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || files.some((f) => f.status === "processing")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-xs disabled:opacity-50"
            >
              {submitting
                ? "Submitting Report..."
                : wantFollowup
                  ? "Submit Report with Contact Info"
                  : "Submit 100% Anonymous Report"}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Emergency helpline: Dial <strong className="text-slate-800">292</strong> (National CSA Toll-Free)</span>
              <Link to="/report/status" className="font-bold text-blue-600 hover:underline">
                Check Report Status →
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
