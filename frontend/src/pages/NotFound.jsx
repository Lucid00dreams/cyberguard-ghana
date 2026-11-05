import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs space-y-4">
        <span className="inline-block font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Error 404
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Page not found
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The link you followed may have moved or no longer exists.
        </p>
        <div className="pt-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
