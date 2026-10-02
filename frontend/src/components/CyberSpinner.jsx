import { ShieldCheck, Lock, Fingerprint } from "lucide-react";

export default function CyberSpinner({
  size = "md",
  label = "CyberGuard Ghana Security Verification...",
  fullScreen = false,
  inline = false,
  icon = "shield",
}) {
  // Size mappings for spinner container & icons
  const sizeMap = {
    sm: { container: "w-8 h-8", outerRing: "w-8 h-8 border-2", innerRing: "w-6 h-6 border-2", icon: "w-3 h-3" },
    md: { container: "w-16 h-16", outerRing: "w-16 h-16 border-3", innerRing: "w-11 h-11 border-2", icon: "w-6 h-6" },
    lg: { container: "w-24 h-24", outerRing: "w-24 h-24 border-4", innerRing: "w-16 h-16 border-3", icon: "w-8 h-8" },
    xl: { container: "w-32 h-32", outerRing: "w-32 h-32 border-4", innerRing: "w-20 h-20 border-3", icon: "w-12 h-12" },
  };

  const s = sizeMap[size] || sizeMap.md;

  const renderIcon = () => {
    switch (icon) {
      case "lock":
        return <Lock className={`${s.icon} text-[#0056D2] dark:text-blue-400 animate-pulse`} />;
      case "fingerprint":
        return <Fingerprint className={`${s.icon} text-emerald-500 animate-pulse`} />;
      default:
        return <ShieldCheck className={`${s.icon} text-[#0056D2] dark:text-blue-400 animate-pulse`} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${inline ? "inline-flex" : ""}`}>
      {/* CyberGuard Custom Animated Dual-Ring Radar Shield */}
      <div className={`relative flex items-center justify-center ${s.container}`}>
        {/* Outer Pulsing Glow Aura */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-600/30 blur-xl animate-cyber-pulse" />

        {/* Outer Rotating Radar Ring */}
        <div
          className={`absolute rounded-full border-t-[#0056D2] border-r-blue-400 border-b-transparent border-l-transparent animate-radar-sweep ${s.outerRing}`}
        />

        {/* Inner Counter-Rotating Emerald Shield Ring */}
        <div
          className={`absolute rounded-full border-t-emerald-500 border-l-emerald-400 border-b-transparent border-r-transparent animate-[spin_1.4s_linear_infinite_reverse] ${s.innerRing}`}
        />

        {/* Center Ghana National Color Accents Badge */}
        <div className="relative z-10 p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center">
          {renderIcon()}
        </div>

        {/* Ghana Cyber Security Act 1038 Tiny Radar Sweeper Dot */}
        <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white dark:border-slate-900 shadow-md animate-ping" />
      </div>

      {/* Animated Status Text Label */}
      {label && (
        <div className="text-center space-y-1">
          <p className="text-xs font-mono font-bold tracking-widest text-[#0056D2] dark:text-blue-400 uppercase flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            {label}
          </p>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            COP ACT 1038 • ZERO-KNOWLEDGE DEFENSE
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/40 dark:border-slate-800 shadow-2xl max-w-sm w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
