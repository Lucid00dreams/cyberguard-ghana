import { useState, useEffect } from "react";

/**
 * Utility to resolve avatar URLs safely:
 * - Fixes localhost:4000 paths saved in database on production
 * - Fixes relative /uploads paths
 * - Preserves data: and https: URLs
 */
export function resolveAvatarUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  // If URL points to localhost from older test data, point to production backend on Render
  if (trimmed.startsWith("http://localhost:4000") || trimmed.startsWith("http://127.0.0.1:4000")) {
    return trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):4000/, "https://cyberguard-ghana.onrender.com");
  }

  // If URL is a relative uploads path, prefix with live backend URL
  if (trimmed.startsWith("/uploads/")) {
    return `https://cyberguard-ghana.onrender.com${trimmed}`;
  }

  return trimmed;
}

/**
 * Deterministic color palette for initial badges based on name
 */
const AVATAR_PALETTES = [
  "bg-blue-100 text-[#0056D2] border-blue-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-sky-100 text-sky-800 border-sky-200",
];

function getPalette(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getInitials(name = "") {
  if (!name || typeof name !== "string") return "U";
  const clean = name.trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Bulletproof UserAvatar Component:
 * - Automatically handles Google CDN referrer blocking (referrerPolicy="no-referrer")
 * - Handles broken/failed image loads via onError fallback
 * - Displays crisp initials badge with deterministic styling
 * - Seamlessly integrates into any size or container
 */
export default function UserAvatar({
  user,
  src,
  name,
  className = "",
  size = "md", // xs (24), sm (28), md (36), lg (44), xl (112)
  rounded = "rounded-lg",
  showOnlineStatus = false,
}) {
  const [imageError, setImageError] = useState(false);

  const rawUrl = src !== undefined ? src : user?.avatarUrl;
  const resolvedUrl = resolveAvatarUrl(rawUrl);
  const displayName = name || user?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const initials = getInitials(displayName);
  const palette = getPalette(displayName);

  // Reset image error state whenever URL changes
  useEffect(() => {
    setImageError(false);
  }, [resolvedUrl]);

  const sizeClasses = {
    xs: "h-6 w-6 min-w-6 text-[10px]",
    sm: "h-7 w-7 min-w-7 text-xs",
    md: "h-9 w-9 min-w-9 text-xs",
    lg: "h-11 w-11 min-w-11 text-sm font-bold",
    xl: "h-28 w-28 min-w-28 sm:h-32 sm:w-32 sm:min-w-32 text-2xl font-black",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const hasValidImage = Boolean(resolvedUrl && !imageError);

  return (
    <div className={`relative shrink-0 inline-flex items-center justify-center select-none ${className}`}>
      {hasValidImage ? (
        <img
          src={resolvedUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImageError(true)}
          className={`${selectedSize} ${rounded} object-cover border border-slate-200/90 shadow-2xs`}
        />
      ) : (
        <div
          className={`${selectedSize} ${rounded} flex items-center justify-center font-bold tracking-tight border shadow-2xs ${palette}`}
        >
          {initials}
        </div>
      )}

      {showOnlineStatus && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
}
