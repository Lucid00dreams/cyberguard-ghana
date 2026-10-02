import React from "react";

/**
 * CyberGuard Ghana Official Vector Emblem & Logo Lockup
 * Features:
 * - Cybersecurity defense shield with aerodynamic bevels
 * - Cyan & gold cyber circuit traces with node connections
 * - Ghanaian Golden Medallion core
 * - Iconic Ghanaian Black Star of Africa
 * - Emerald Green active protection terminal
 *
 * @param {'full' | 'compact' | 'icon'} variant - Layout style
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} size - Scale size
 * @param {'light' | 'dark' | 'auto'} theme - Color scheme
 * @param {string} className - Optional container styling
 * @param {string} subtitle - Optional custom subtitle text
 */
export default function CyberGuardLogo({
  variant = "full",
  size = "md",
  theme = "light",
  className = "",
  subtitle = "National COP Academy",
  interactive = false,
}) {
  // Size metrics
  const sizeMap = {
    xs: { iconSize: 22, textClass: "text-sm", subClass: "text-[8px]" },
    sm: { iconSize: 28, textClass: "text-base", subClass: "text-[9px]" },
    md: { iconSize: 38, textClass: "text-lg", subClass: "text-[10px]" },
    lg: { iconSize: 48, textClass: "text-xl sm:text-2xl", subClass: "text-xs" },
    xl: { iconSize: 64, textClass: "text-2xl sm:text-3xl", subClass: "text-xs sm:text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === "dark";

  // Unique ID prefix to prevent SVG gradient ID collisions
  const uid = React.useId().replace(/:/g, "");

  const emblemSvg = (
    <svg
      width={currentSize.iconSize}
      height={currentSize.iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform duration-200 ${
        interactive ? "group-hover:scale-105" : ""
      }`}
      aria-label="CyberGuard Ghana Shield Emblem"
    >
      <defs>
        {/* Shield Background Gradient */}
        <linearGradient id={`${uid}-shieldBg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0056D2" />
          <stop offset="45%" stopColor="#0A3C96" />
          <stop offset="100%" stopColor="#051736" />
        </linearGradient>

        {/* Shield Outer Rim Gradient */}
        <linearGradient id={`${uid}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Golden Medallion Gradient */}
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Gold Ring Gradient */}
        <linearGradient id={`${uid}-goldRing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Subtle Glow Filter */}
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Protective Shield Silhouette */}
      <path
        d="M 32 4 C 44 4, 55 9, 58 14 C 58 35, 50 51, 32 61 C 14 51, 6 35, 6 14 C 9 9, 20 4, 32 4 Z"
        fill={`url(#${uid}-shieldBg)`}
        stroke={`url(#${uid}-border)`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Bevel Contour Face */}
      <path
        d="M 32 8.5 C 41 8.5, 50 12.5, 52.5 16.5 C 52.5 33, 46 46, 32 54.5 C 18 46, 11.5 33, 11.5 16.5 C 14 12.5, 23 8.5, 32 8.5 Z"
        fill="#081426"
        stroke="#1E3A8A"
        strokeWidth="1"
        opacity="0.92"
      />

      {/* High-Tech Circuit Traces */}
      {/* Left Circuit Network */}
      <path
        d="M 16 23 L 23 23 L 27 28"
        stroke="#38BDF8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx="16" cy="23" r="1.6" fill="#38BDF8" />

      {/* Right Circuit Network */}
      <path
        d="M 48 23 L 41 23 L 37 28"
        stroke="#38BDF8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx="48" cy="23" r="1.6" fill="#38BDF8" />

      {/* Center Top Keyline */}
      <line
        x1="32"
        y1="9"
        x2="32"
        y2="18"
        stroke="#F59E0B"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Ghana Golden Core Medallion / Radar Ring */}
      <circle
        cx="32"
        cy="33"
        r="14"
        fill={`url(#${uid}-gold)`}
        stroke={`url(#${uid}-goldRing)`}
        strokeWidth="1.8"
        filter={`url(#${uid}-glow)`}
      />

      {/* Concentric Tech Dash Track */}
      <circle
        cx="32"
        cy="33"
        r="11.8"
        fill="none"
        stroke="#FEF08A"
        strokeWidth="0.75"
        strokeDasharray="2 1.5"
        opacity="0.75"
      />

      {/* Iconic Ghanaian Black Star (Black Star of Africa) */}
      <polygon
        points="
          32,23.5
          34.3,29.8
          41.0,30.0
          35.7,34.2
          37.6,40.7
          32,36.8
          26.4,40.7
          28.3,34.2
          23.0,30.0
          29.7,29.8
        "
        fill="#050811"
        stroke="#1E293B"
        strokeWidth="0.5"
      />

      {/* Gold Star Core Spark */}
      <circle cx="32" cy="33" r="1.1" fill="#FDE047" opacity="0.9" />

      {/* Active Green Defensive Terminal */}
      <circle cx="32" cy="51" r="1.8" fill="#10B981" />
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>{emblemSvg}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0 ${className}`}>
      {emblemSvg}

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`font-sans font-black tracking-tight whitespace-nowrap ${currentSize.textClass} ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            CyberGuard{" "}
            <span className="text-[#0056D2] dark:text-[#38BDF8]">
              Ghana
            </span>
          </span>
          {variant === "compact" && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-[#0056D2] border border-blue-200/80 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              COP
            </span>
          )}
        </div>

        {variant === "full" && subtitle && (
          <div className="flex items-center gap-1 mt-0.5 whitespace-nowrap">
            <span className="flex items-center gap-0.5 shrink-0">
              <span className="w-1 h-1 rounded-full bg-rose-500" />
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
            </span>
            <span
              className={`font-mono uppercase font-semibold tracking-wider text-[9px] whitespace-nowrap ${
                isDark ? "text-slate-400" : "text-slate-400"
              }`}
            >
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
