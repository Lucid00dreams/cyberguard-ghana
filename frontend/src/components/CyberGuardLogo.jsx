import React from "react";

/**
 * CyberGuard Ghana Official Vector Emblem & Logo Lockup
 * Features:
 * - Cybersecurity defense shield with aerodynamic bevels
 * - Cyan & gold cyber circuit traces with node connections
 * - Ghanaian Golden Medallion core
 * - Iconic Ghanaian Black Star of Africa
 * - Emerald Green active protection terminal
 */
export default function CyberGuardLogo({
  variant = "full",
  size = "md",
  theme = "light",
  className = "",
  subtitle = "National COP Academy",
  interactive = false,
}) {
  // Standard app-icon size metrics
  const sizeMap = {
    xs: { iconSize: 28, textClass: "text-sm", subClass: "text-[8px]" },
    sm: { iconSize: 36, textClass: "text-base", subClass: "text-[9px]" },
    md: { iconSize: 44, textClass: "text-lg", subClass: "text-[10px]" },
    lg: { iconSize: 54, textClass: "text-xl sm:text-2xl", subClass: "text-xs" },
    xl: { iconSize: 68, textClass: "text-2xl sm:text-3xl", subClass: "text-xs sm:text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === "dark";

  // Unique ID prefix to prevent SVG gradient ID collisions
  const uid = React.useId().replace(/:/g, "");

  const emblemSvg = (
    <svg
      width={currentSize.iconSize}
      height={currentSize.iconSize}
      viewBox="5 16 90 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform duration-200 ${
        interactive ? "group-hover:scale-105" : ""
      }`}
      aria-label="CyberGuard Ghana Shield Emblem"
    >
      {/* Circuit Traces Network (Slate Blue) */}
      <g stroke="#A4B8D1" strokeWidth="3.0" strokeLinecap="round" strokeLinejoin="round">
        {/* Left 5 Traces */}
        <path d="M 20.2 22.5 L 33.0 22.5 L 40.0 29.5" />
        <path d="M 13.0 35.1 L 23.2 35.1 L 30.7 38.5" />
        <path d="M 9.9 49.8 L 30.7 49.8" />
        <path d="M 13.0 64.8 L 23.2 64.8 L 30.7 61.4" />
        <path d="M 20.2 77.3 L 33.0 77.3 L 40.0 70.3" />

        {/* Right 5 Traces */}
        <path d="M 79.8 22.5 L 67.0 22.5 L 60.0 29.5" />
        <path d="M 87.0 35.1 L 76.8 35.1 L 69.3 38.5" />
        <path d="M 90.1 49.8 L 69.3 49.8" />
        <path d="M 87.0 64.8 L 76.8 64.8 L 69.3 61.4" />
        <path d="M 79.8 77.3 L 67.0 77.3 L 60.0 70.3" />
      </g>

      {/* Circuit Ring Nodes (Hollow / Transparent Core) */}
      <g stroke="#A4B8D1" strokeWidth="2.4" fill="none">
        {/* Left Nodes */}
        <circle cx="20.2" cy="22.5" r="2.6" />
        <circle cx="13.0" cy="35.1" r="2.6" />
        <circle cx="9.9" cy="49.8" r="2.6" />
        <circle cx="13.0" cy="64.8" r="2.6" />
        <circle cx="20.2" cy="77.3" r="2.6" />

        {/* Right Nodes */}
        <circle cx="79.8" cy="22.5" r="2.6" />
        <circle cx="87.0" cy="35.1" r="2.6" />
        <circle cx="90.1" cy="49.8" r="2.6" />
        <circle cx="87.0" cy="64.8" r="2.6" />
        <circle cx="79.8" cy="77.3" r="2.6" />
      </g>

      {/* Outer Protective Shield (Cyan Rim) */}
      <path
        d="M 50.0 23.7
           C 55.0 25.5, 63.0 29.5, 69.3 31.2
           L 69.3 54.5
           C 69.3 65.0, 58.0 72.0, 50.0 74.5
           C 42.0 72.0, 30.7 65.0, 30.7 54.5
           L 30.7 31.2
           C 37.0 29.5, 45.0 25.5, 50.0 23.7 Z"
        fill="#00C4FF"
      />

      {/* Shield Core Body (Dark Slate Navy) */}
      <path
        d="M 50.0 27.2
           C 54.0 28.6, 60.5 32.0, 65.9 33.8
           L 65.9 53.0
           C 65.9 61.8, 56.5 67.5, 50.0 70.8
           C 43.5 67.5, 34.1 61.8, 34.1 53.0
           L 34.1 33.8
           C 39.5 32.0, 46.0 28.6, 50.0 27.2 Z"
        fill="#2F364B"
      />

      {/* Padlock Shackle */}
      <path
        d="M 44.5 48.0 L 44.5 41.5 C 44.5 37.0, 55.5 37.0, 55.5 41.5 L 55.5 48.0"
        stroke="#00C4FF"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Padlock Body (Hexagon-bottomed Cyan Block) */}
      <path
        d="M 40.5 47.0 L 59.5 47.0 L 59.5 55.5 L 50.0 60.5 L 40.5 55.5 Z"
        fill="#00C4FF"
      />

      {/* Padlock Keyhole Slot (Dark Slate Navy) */}
      <rect x="48.4" y="51.5" width="3.2" height="4.2" rx="1.0" fill="#2F364B" />
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
