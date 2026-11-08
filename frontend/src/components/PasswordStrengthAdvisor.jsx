import { useState, useMemo, useCallback } from "react";
import { RefreshCw, Check } from "lucide-react";

const COMMON_WEAK_PATTERNS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abcdef",
  "ghana",
  "cyberguard",
  "admin",
  "welcome",
];

/**
 * Generates a cryptographically strong password using window.crypto.getRandomValues.
 */
export function generateStrongPassword() {
  const words = [
    "Shield",
    "Cipher",
    "Aegis",
    "Vault",
    "Kente",
    "Vector",
    "Falcon",
    "Matrix",
    "Sentinel",
    "Cobalt",
  ];
  const symbols = ["!", "@", "#", "$", "&"];
  const digits = "23456789";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  const rand = new Uint32Array(6);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(rand);
  } else {
    for (let i = 0; i < rand.length; i++) {
      rand[i] = Math.floor(Math.random() * 100000);
    }
  }

  const word = words[rand[0] % words.length];
  const sym = symbols[rand[1] % symbols.length];
  const d1 = digits[rand[2] % digits.length];
  const d2 = digits[rand[3] % digits.length];
  const c1 = chars[rand[4] % chars.length];
  const c2 = chars[rand[5] % chars.length];

  return `${word}${sym}${d1}${d2}${c1}${c2}`;
}

export function evaluatePasswordStrength(password = "", userHint = "") {
  const pwd = String(password || "");
  const length = pwd.length;

  if (length === 0) {
    return { score: 0, label: "", hint: "", barColor: "bg-slate-200", textColor: "text-slate-500" };
  }

  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(pwd);
  const hasMinLength = length >= 8;

  const lowerPwd = pwd.toLowerCase();
  const isCommon = COMMON_WEAK_PATTERNS.some((w) => lowerPwd.includes(w));
  const hasEmailPrefix =
    userHint &&
    userHint.split("@")[0].trim().length >= 3 &&
    lowerPwd.includes(userHint.split("@")[0].toLowerCase().trim());

  let score = 1;
  if (hasMinLength) {
    score = 1;
    if (hasLower && hasUpper) score += 1;
    if (hasNumber) score += 1;
    if (hasSymbol || length >= 12) score += 1;
    if (isCommon || hasEmailPrefix) score = Math.min(score, 2);
  }

  let hint = "";
  if (!hasMinLength) {
    hint = `${8 - length} more char${8 - length === 1 ? "" : "s"} needed`;
  } else if (isCommon) {
    hint = "Avoid common words or sequences";
  } else if (hasEmailPrefix) {
    hint = "Avoid using your email name";
  } else if (!hasUpper || !hasLower) {
    hint = "Mix uppercase & lowercase";
  } else if (!hasNumber) {
    hint = "Add a number";
  } else if (!hasSymbol && length < 12) {
    hint = "Add a symbol for maximum security";
  } else {
    hint = "Meets all security requirements";
  }

  const levels = {
    1: { label: "Weak", barColor: "bg-rose-500", textColor: "text-rose-600" },
    2: { label: "Fair", barColor: "bg-amber-500", textColor: "text-amber-600" },
    3: { label: "Good", barColor: "bg-blue-600", textColor: "text-blue-600" },
    4: { label: "Strong", barColor: "bg-emerald-500", textColor: "text-emerald-600" },
  };

  const level = levels[score] || levels[1];

  return {
    score,
    label: level.label,
    hint,
    barColor: level.barColor,
    textColor: level.textColor,
  };
}

export default function PasswordStrengthAdvisor({
  password = "",
  onSelectPassword,
  userHint = "",
}) {
  const [suggested, setSuggested] = useState(() => generateStrongPassword());
  const [applied, setApplied] = useState(false);

  const metrics = useMemo(
    () => evaluatePasswordStrength(password, userHint),
    [password, userHint]
  );

  const handleRegenerate = useCallback(() => {
    setSuggested(generateStrongPassword());
    setApplied(false);
  }, []);

  const handleUseSuggested = useCallback(() => {
    if (onSelectPassword) {
      onSelectPassword(suggested);
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(suggested).catch(() => {});
    }
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }, [onSelectPassword, suggested]);

  return (
    <div className="pt-1.5 space-y-2">
      {/* Slim Live Strength Meter (shows as user types) */}
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1 h-1">
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className={`h-full rounded-full transition-colors duration-200 ${
                  seg <= metrics.score ? metrics.barColor : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className={`font-bold ${metrics.textColor}`}>{metrics.label}</span>
            <span className="text-slate-500 truncate">{metrics.hint}</span>
          </div>
        </div>
      )}

      {/* Simple Single-Line Suggested Password Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Suggested:</span>
          <code className="font-mono font-bold text-slate-900 truncate select-all">
            {suggested}
          </code>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleRegenerate}
            title="New suggestion"
            aria-label="Generate another password"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleUseSuggested}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              applied
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {applied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Used</span>
              </>
            ) : (
              <span>Use</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
