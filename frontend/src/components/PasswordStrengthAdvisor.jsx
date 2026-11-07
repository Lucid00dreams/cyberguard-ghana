import { useState, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  KeyRound,
} from "lucide-react";

const COMMON_WEAK_PATTERNS = [
  "password",
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "abcdef",
  "ghana",
  "accra",
  "kumasi",
  "cyberguard",
  "admin",
  "welcome",
  "letmein",
  "iloveyou",
];

/**
 * Generates a cryptographically strong, memorable yet high-entropy password
 * using window.crypto.getRandomValues (CSPRNG).
 */
export function generateStrongPassword() {
  const prefixes = [
    "Adinkra",
    "Shield",
    "Sentinel",
    "Cipher",
    "Bastion",
    "Aegis",
    "Vortex",
    "Quantum",
    "Kente",
    "Cobalt",
    "Falcon",
    "Nexus",
  ];
  const cores = [
    "Guard",
    "Vault",
    "Pulse",
    "Orbit",
    "Matrix",
    "Vector",
    "Spark",
    "Forge",
    "Crest",
    "Prime",
  ];
  const symbols = ["!", "@", "#", "$", "%", "&", "*"];
  const digits = "23456789";
  const extras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  const randArray = new Uint32Array(8);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randArray);
  } else {
    for (let i = 0; i < randArray.length; i++) {
      randArray[i] = Math.floor(Math.random() * 100000);
    }
  }

  const w1 = prefixes[randArray[0] % prefixes.length];
  const w2 = cores[randArray[1] % cores.length];
  const sym1 = symbols[randArray[2] % symbols.length];
  const sym2 = symbols[randArray[3] % symbols.length];
  const d1 = digits[randArray[4] % digits.length];
  const d2 = digits[randArray[5] % digits.length];
  const d3 = digits[randArray[6] % digits.length];
  const ex = extras[randArray[7] % extras.length];

  return `${w1}${sym1}${d1}${d2}${w2}${sym2}${d3}${ex}`;
}

/**
 * Evaluates password strength, criteria checks, entropy bits, and estimated crack time.
 */
export function evaluatePasswordStrength(password = "", userHint = "") {
  const pwd = String(password || "");
  const length = pwd.length;

  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasMinLength = length >= 8;
  const hasRecommendedLength = length >= 12;
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(pwd);
  const hasMixedCase = hasLower && hasUpper;

  if (length === 0) {
    return {
      score: 0,
      maxScore: 5,
      label: "Enter a password",
      crackTime: "—",
      entropyBits: 0,
      colorClass: "bg-slate-200",
      textClass: "text-slate-500",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      warning: "",
      checks: {
        hasMinLength: false,
        hasMixedCase: false,
        hasNumber: false,
        hasSymbol: false,
      },
    };
  }

  // Compute character pool size
  let pool = 0;
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasNumber) pool += 10;
  if (hasSymbol) pool += 32;
  if (pool === 0) pool = 26;

  let entropyBits = Math.round(length * Math.log2(pool));

  // Detect weak patterns
  const lowerPwd = pwd.toLowerCase();
  let warning = "";

  const matchedCommon = COMMON_WEAK_PATTERNS.find((w) => lowerPwd.includes(w));
  if (matchedCommon) {
    entropyBits = Math.max(12, Math.floor(entropyBits * 0.45));
    warning = "Contains a common predictable word or sequence.";
  }

  // Repeated characters (e.g. "aaaa" or "1111")
  if (/(.)\1{2,}/.test(pwd)) {
    entropyBits = Math.max(10, Math.floor(entropyBits * 0.6));
    if (!warning) warning = "Avoid repeating the same character multiple times.";
  }

  // Sequential numbers or letters
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf)/i.test(pwd)) {
    entropyBits = Math.max(14, Math.floor(entropyBits * 0.6));
    if (!warning) warning = "Sequential keyboard or number pattern detected.";
  }

  // Contains email username hint
  if (userHint && userHint.length >= 3) {
    const emailPrefix = userHint.split("@")[0].toLowerCase().trim();
    if (emailPrefix.length >= 3 && lowerPwd.includes(emailPrefix)) {
      entropyBits = Math.max(15, Math.floor(entropyBits * 0.55));
      warning = "Avoid including your email or name inside your password.";
    }
  }

  // Calculate 1..5 score
  let score = 1;
  if (hasMinLength) {
    let points = 1; // min length met
    if (hasMixedCase) points += 1;
    if (hasNumber) points += 1;
    if (hasSymbol) points += 1;
    if (hasRecommendedLength && entropyBits >= 65) points += 1;

    score = Math.min(5, Math.max(1, points));
    if (matchedCommon || (length < 8)) {
      score = Math.min(score, 2);
    }
  } else {
    score = 1;
    if (!warning) warning = `${8 - length} more character${8 - length === 1 ? "" : "s"} needed (min. 8).`;
  }

  // Estimate offline brute-force crack time at ~10^10 guesses/sec
  let crackTime = "Instantly";
  if (entropyBits < 28) crackTime = "Instantly";
  else if (entropyBits < 36) crackTime = "< 5 seconds";
  else if (entropyBits < 45) crackTime = "~4 minutes";
  else if (entropyBits < 54) crackTime = "~3 days";
  else if (entropyBits < 64) crackTime = "~8 years";
  else if (entropyBits < 75) crackTime = "1,000+ years";
  else crackTime = "Centuries+";

  const tiers = {
    1: {
      label: "Very Weak",
      colorClass: "bg-rose-500",
      textClass: "text-rose-600",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    },
    2: {
      label: "Weak",
      colorClass: "bg-orange-500",
      textClass: "text-orange-600",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    },
    3: {
      label: "Fair",
      colorClass: "bg-amber-500",
      textClass: "text-amber-700",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    },
    4: {
      label: "Strong",
      colorClass: "bg-[#0056D2]",
      textClass: "text-[#0056D2]",
      badgeClass: "bg-blue-50 text-[#0056D2] border-blue-200",
    },
    5: {
      label: "Vault-Grade",
      colorClass: "bg-emerald-500",
      textClass: "text-emerald-700",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };

  const tier = tiers[score] || tiers[1];

  return {
    score,
    maxScore: 5,
    label: tier.label,
    crackTime,
    entropyBits,
    colorClass: tier.colorClass,
    textClass: tier.textClass,
    badgeClass: tier.badgeClass,
    warning,
    checks: {
      hasMinLength,
      hasMixedCase,
      hasNumber,
      hasSymbol,
    },
  };
}

/**
 * Interactive Password Strength Detector + Strong Password Generator
 * @param {object} props
 * @param {string} props.password - Current password value
 * @param {(newPassword: string) => void} props.onSelectPassword - Callback when user applies a suggested password
 * @param {string} [props.userHint] - Optional email/username to check against personal info reuse
 */
export default function PasswordStrengthAdvisor({
  password = "",
  onSelectPassword,
  userHint = "",
}) {
  const [suggestedPassword, setSuggestedPassword] = useState(() => generateStrongPassword());
  const [applied, setApplied] = useState(false);

  const metrics = useMemo(
    () => evaluatePasswordStrength(password, userHint),
    [password, userHint]
  );

  const handleRegenerate = useCallback(() => {
    const next = generateStrongPassword();
    setSuggestedPassword(next);
    setApplied(false);
  }, []);

  const handleUseSuggested = useCallback(() => {
    if (onSelectPassword) {
      onSelectPassword(suggestedPassword);
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(suggestedPassword).catch(() => {});
    }
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  }, [onSelectPassword, suggestedPassword]);

  const requirementItems = [
    { key: "hasMinLength", label: "8+ chars", met: metrics.checks.hasMinLength },
    { key: "hasMixedCase", label: "Upper & lower", met: metrics.checks.hasMixedCase },
    { key: "hasNumber", label: "Number (0-9)", met: metrics.checks.hasNumber },
    { key: "hasSymbol", label: "Symbol (!@#$)", met: metrics.checks.hasSymbol },
  ];

  return (
    <div className="pt-1.5 space-y-2.5">
      {/* Live Strength Meter (Visible as soon as user starts typing, or shows readiness bar) */}
      {password.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {metrics.score >= 4 ? (
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${metrics.textClass}`} />
              ) : (
                <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ${metrics.textClass}`} />
              )}
              <span className="text-[11px] font-bold text-slate-700">Strength:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${metrics.badgeClass}`}
              >
                {metrics.label}
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              Crack time: <strong className="text-slate-700">{metrics.crackTime}</strong>
            </span>
          </div>

          {/* 5-Segment Progress Bar */}
          <div className="grid grid-cols-5 gap-1 h-1.5" role="progressbar" aria-valuenow={metrics.score} aria-valuemin={0} aria-valuemax={5}>
            {[1, 2, 3, 4, 5].map((segment) => (
              <div
                key={segment}
                className={`h-full rounded-full transition-colors duration-200 ${
                  segment <= metrics.score ? metrics.colorClass : "bg-slate-200/80"
                }`}
              />
            ))}
          </div>

          {/* Requirement Checklist Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            {requirementItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                  item.met
                    ? "bg-emerald-50/90 text-emerald-700 border-emerald-200/80"
                    : "bg-white text-slate-400 border-slate-200/60"
                }`}
              >
                <Check
                  className={`w-3 h-3 shrink-0 ${
                    item.met ? "text-emerald-600 stroke-[2.5]" : "text-slate-300"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Contextual Warning if weak pattern detected */}
          {metrics.warning && (
            <p className="text-[11px] text-amber-700 font-medium leading-snug">
              Tip: {metrics.warning}
            </p>
          )}
        </div>
      )}

      {/* Strong Password Suggestion Bar */}
      <div className="p-2.5 rounded-xl bg-blue-50/55 border border-blue-200/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-[#0056D2]/10 text-[#0056D2] flex items-center justify-center shrink-0">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Suggested Strong Password
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-900 truncate select-all mt-0.5">
              {suggestedPassword}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRegenerate}
            title="Generate another strong password"
            aria-label="Generate another strong password"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleUseSuggested}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs ${
              applied
                ? "bg-emerald-600 text-white"
                : "bg-[#0056D2] hover:bg-[#00419E] text-white"
            }`}
          >
            {applied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Applied & Copied</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Use Strong Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

