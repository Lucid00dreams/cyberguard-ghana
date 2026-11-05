import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Search, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import api from "../utils/api";

export default function IncidentStatus() {
  const prefersReducedMotion = useReducedMotion();
  const [refCode, setRefCode] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!refCode.trim()) return;
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/incidents/status/${refCode.trim().toUpperCase()}`);
      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No incident report matched that reference code. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] bg-[#F8FAFC] py-14 px-4 sm:px-6 flex items-start justify-center">
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="space-y-2">
          <Link
            to="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0056D2] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Incident Desk</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Check Report Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Enter the reference code issued when you submitted your report to check its current triage status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. CG-INC-XXXX"
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0056D2] transition"
            />
          </div>
          <button
            type="submit"
            disabled={!refCode.trim() || loading}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Check Status</span>
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {report && (
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="font-mono font-bold text-slate-900">{report.refCode}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056D2] border border-blue-200 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{report.status?.replace(/_/g, " ")}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Category</span>
              <span className="font-semibold text-slate-900">
                {report.category?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Submitted</span>
              <span className="font-medium text-slate-800">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
