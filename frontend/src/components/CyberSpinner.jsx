import { Loader2 } from "lucide-react";

export default function CyberSpinner({
  size = "md",
  label = "Loading...",
  fullScreen = false,
  inline = false,
}) {
  const sizeStyles = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
    xl: "w-11 h-11",
  };

  const iconClass = sizeStyles[size] || sizeStyles.md;

  const content = (
    <div
      className={`${inline ? "inline-flex flex-row gap-2.5" : "flex flex-col gap-3"
        } items-center justify-center`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${iconClass} text-[#0056D2] animate-spin shrink-0`} />
      {label && (
        <p className="text-xs font-medium text-slate-600 tracking-tight text-center">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-xs">
        <div className="bg-white px-7 py-6 rounded-2xl border border-slate-200 shadow-xl max-w-xs w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
