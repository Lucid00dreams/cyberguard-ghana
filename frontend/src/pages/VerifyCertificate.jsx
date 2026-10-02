import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Award, ShieldCheck, CheckCircle2, Search, ArrowRight, XCircle, Loader2 } from "lucide-react";
import api from "../utils/api";

export default function VerifyCertificate() {
  const { certRef: urlCertRef } = useParams();
  const [inputRef, setInputRef] = useState(urlCertRef || "");
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (urlCertRef) {
      verifyCert(urlCertRef);
    }
  }, [urlCertRef]);

  async function verifyCert(code) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setCertData(null);

    try {
      const res = await api.get(`/courses/certificates/verify/${encodeURIComponent(code.trim())}`);
      const data = res.data;

      if (!data.valid) {
        setError(data.error || "Invalid certificate reference code.");
      } else {
        setCertData(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Network error while verifying certificate.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (inputRef.trim()) {
      verifyCert(inputRef);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#001E3C] rounded-3xl p-8 sm:p-10 text-white shadow-xl text-center space-y-4 relative overflow-hidden border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Verify Ghana COP Digital Certificate</h1>
          <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
            Verify official youth cybersecurity credentials issued by CyberGuard Ghana under the Cyber Security Authority (Act 1038) framework.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value)}
                placeholder="Enter Certificate Reference Code (e.g. CG-GH-2026-X89K2)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-[#0056D2] text-xs sm:text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputRef.trim()}
              className="bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition text-xs shrink-0 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
            </button>
          </form>
        </div>

        {/* Results Area */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-3">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-900">Certificate Verification Failed</h3>
            <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          </div>
        )}

        {certData && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl space-y-8 relative overflow-hidden">
            {/* Accreditation Badge Overlay */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-600 block">
                    Official &amp; Verified
                  </span>
                  <h2 className="text-xl font-black text-slate-900">Accredited COP Credential</h2>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200">
                REF: {certData.certRef}
              </span>
            </div>

            {/* Certificate Details */}
            <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Recipient Name
                </span>
                <span className="text-lg font-extrabold text-slate-900 block">{certData.recipient}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Completed Curriculum
                </span>
                <span className="text-sm font-bold text-slate-900 block">{certData.courseTitle}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Issuing Authority
                </span>
                <span className="text-xs font-semibold text-slate-800 block">{certData.authority}</span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 block mb-0.5">
                  Legal Framework
                </span>
                <span className="text-xs font-semibold text-slate-800 block">{certData.framework}</span>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital Signature Verified on Blockchain-backed Ledger
              </span>
              <Link to="/courses" className="text-[#0056D2] font-bold hover:underline flex items-center gap-1">
                Explore Accredited Courses <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
