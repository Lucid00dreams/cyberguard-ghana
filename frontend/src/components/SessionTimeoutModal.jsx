import { ShieldAlert, Clock, LogIn, X } from "lucide-react";

export default function SessionTimeoutModal({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
          <Clock className="w-7 h-7 text-amber-600 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2 flex items-center justify-center gap-2">
          <span>Session Timed Out</span>
        </h3>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 mb-5 text-left text-xs leading-relaxed text-amber-900 font-medium">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Inactivity Security Protocol</p>
              <p className="text-amber-800">
                You have been automatically logged out due to <strong>15 minutes of inactivity</strong> to protect sensitive Child Online Protection (COP) platform data and user privacy.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Please log back in to continue your courses, mentorship sessions, or access your dashboard.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
          >
            Dismiss
          </button>
          <button
            onClick={onLogin}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4" />
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
}
