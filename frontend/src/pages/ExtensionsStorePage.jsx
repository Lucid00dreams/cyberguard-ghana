import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  EyeOff,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
} from "lucide-react";

const PASSPHRASE_WORDS = [
  "accra", "adinkra", "amber", "anchor", "atlas", "baobab", "beacon", "breeze",
  "bridge", "bronze", "canopy", "carbon", "cedar", "cipher", "citadel", "cobalt",
  "compass", "coral", "cosmos", "crest", "crystal", "delta", "dune", "eclipse",
  "ember", "emerald", "falcon", "ferry", "fjord", "flint", "forest", "fortress",
  "garnet", "glacier", "granite", "harbor", "harvest", "haven", "horizon", "indigo",
  "island", "ivory", "jasper", "kernel", "lagoon", "lantern", "laurel", "ledger",
  "lighthouse", "lotus", "magnet", "mango", "marble", "meadow", "mercury", "meteor",
  "mirage", "monarch", "mosaic", "nebula", "nectar", "nimbus", "obsidian", "ocean",
  "olive", "onyx", "opal", "orbit", "orchid", "osprey", "oxygen", "palace",
  "panther", "paradox", "pebble", "pelican", "phoenix", "pioneer", "planet", "platinum",
  "plaza", "prism", "pulsar", "quartz", "quiver", "radar", "rapids", "raven",
  "reef", "ridge", "river", "rocket", "ruby", "saffron", "savanna", "scepter",
  "scroll", "sentry", "sequoia", "shadow", "shield", "sierra", "signal", "silver",
  "solstice", "spark", "spectrum", "spruce", "starlight", "summit", "sunrise", "tempest",
  "terra", "thistle", "thunder", "timber", "topaz", "torrent", "trident", "tundra",
  "velvet", "vertex", "vigil", "violet", "voyage", "walnut", "willow", "zenith",
];

function secureRandomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  let value = 0;
  do {
    window.crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % maxExclusive;
}

function generateSecurePassword({ length, upper, lower, digits, symbols }) {
  const sets = [];
  if (upper) sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
  if (lower) sets.push("abcdefghijkmnopqrstuvwxyz");
  if (digits) sets.push("23456789");
  if (symbols) sets.push("!@#$%^&*-_=+?");

  if (sets.length === 0) {
    sets.push("abcdefghijkmnopqrstuvwxyz");
  }

  const fullPool = sets.join("");
  const chars = [];

  // Guarantee at least one character from each enabled character class
  for (const set of sets) {
    chars.push(set[secureRandomInt(set.length)]);
  }
  while (chars.length < length) {
    chars.push(fullPool[secureRandomInt(fullPool.length)]);
  }

  // Fisher-Yates cryptographic shuffle
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const entropyBits = Math.round(length * Math.log2(fullPool.length));
  return { value: chars.join(""), entropyBits };
}

function generateSecurePassphrase(wordCount = 5, separator = "-") {
  const chosen = [];
  for (let i = 0; i < wordCount; i += 1) {
    chosen.push(PASSPHRASE_WORDS[secureRandomInt(PASSPHRASE_WORDS.length)]);
  }
  const entropyBits = Math.round(wordCount * Math.log2(PASSPHRASE_WORDS.length));
  return { value: chosen.join(separator), entropyBits };
}

const HIGH_RISK_TLDS = new Set([
  "xyz", "top", "click", "buzz", "tk", "ml", "cf", "ga", "gq", "zip", "mov", "icu", "work",
]);

const BRAND_KEYWORDS = [
  { keyword: "mtn", officialDomains: ["mtn.com.gh", "mtn.com"] },
  { keyword: "telecel", officialDomains: ["telecel.com.gh", "vodafone.com.gh"] },
  { keyword: "airteltigo", officialDomains: ["airteltigo.com.gh"] },
  { keyword: "momo", officialDomains: ["mtn.com.gh", "momo.mtn.com"] },
  { keyword: "ecobank", officialDomains: ["ecobank.com"] },
  { keyword: "gcbbank", officialDomains: ["gcbbank.com.gh"] },
  { keyword: "waec", officialDomains: ["waecgh.org"] },
];

function inspectUrlStructure(rawInput) {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      valid: false,
      level: "warning",
      hostname: trimmed,
      findings: ["Not a valid web address format. Double-check for typos or missing domain parts."],
    };
  }

  const findings = [];
  const host = parsed.hostname.toLowerCase();
  const labels = host.split(".").filter(Boolean);
  const tld = labels[labels.length - 1] || "";

  if (trimmed.toLowerCase().startsWith("http://") || parsed.protocol === "http:") {
    findings.push("Uses unencrypted HTTP instead of HTTPS. Never enter PINs or passwords on HTTP pages.");
  }

  if (parsed.username || parsed.password || trimmed.includes("@")) {
    findings.push("Contains '@' before the host — a classic trick used to disguise the real destination domain.");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    findings.push("Uses a raw numeric IP address instead of a registered domain name.");
  }

  if (host.includes("xn--")) {
    findings.push("Uses Punycode (xn--) internationalized characters, which can imitate look-alike letters.");
  }

  if (labels.length >= 4) {
    findings.push(`Has ${labels.length - 2} nested subdomains (${host}), often used to hide the true root domain.`);
  }

  if (HIGH_RISK_TLDS.has(tld)) {
    findings.push(`Uses the .${tld} top-level domain, which is frequently abused in disposable SMS phishing links.`);
  }

  for (const brand of BRAND_KEYWORDS) {
    if (host.includes(brand.keyword)) {
      const matchesOfficial = brand.officialDomains.some(
        (official) => host === official || host.endsWith(`.${official}`)
      );
      if (!matchesOfficial) {
        findings.push(
          `Mentions "${brand.keyword}" in "${host}", which is NOT an official ${brand.officialDomains[0]} domain.`
        );
      }
    }
  }

  const level = findings.length >= 2 ? "high" : findings.length === 1 ? "warning" : "clean";

  return {
    valid: true,
    level,
    hostname: host,
    protocol: parsed.protocol.replace(":", "").toUpperCase(),
    findings,
  };
}

const CATEGORIES = [
  { key: "all", label: "All Safety Tools" },
  { key: "passwords", label: "Password & 2FA" },
  { key: "privacy", label: "Tracker & Ad Blocking" },
  { key: "phishing", label: "Phishing & Link Checks" },
];

const VETTED_EXTENSIONS = [
  {
    id: "bitwarden",
    name: "Bitwarden Password Manager",
    publisher: "Bitwarden Inc.",
    category: "passwords",
    license: "Open Source • Free",
    icon: KeyRound,
    accent: "bg-blue-50 text-[#0056D2] border-blue-100",
    description:
      "End-to-end encrypted password vault that stores unique logins across phone and laptop, and refuses to auto-fill on look-alike phishing domains.",
    whyUseIt: "Prevents credential reuse and fake login page auto-fill.",
    storeUrl:
      "https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb",
  },
  {
    id: "proton-pass",
    name: "Proton Pass",
    publisher: "Proton AG",
    category: "passwords",
    license: "Open Source • Free tier",
    icon: Lock,
    accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
    description:
      "Encrypted password manager with hide-my-email aliases so you can sign up for websites without exposing your primary email address.",
    whyUseIt: "Protects your main email from spam and breach lists.",
    storeUrl:
      "https://chromewebstore.google.com/detail/proton-pass-free-password/ghmbeldphafepmbegfdlkpapadhbakde",
  },
  {
    id: "authenticator-2fa",
    name: "Authenticator (2FA Client)",
    publisher: "authenticator.cc",
    category: "passwords",
    license: "Open Source • Free",
    icon: ShieldCheck,
    accent: "bg-slate-100 text-slate-800 border-slate-200",
    description:
      "Generates time-based 6-digit verification codes (TOTP) locally in your browser as a stronger alternative to SMS one-time codes.",
    whyUseIt: "Defends accounts against SIM-swap takeovers.",
    storeUrl:
      "https://chromewebstore.google.com/detail/authenticator/bhghoamapcdpbohphigoooaddinpkbai",
  },
  {
    id: "ublock-origin-lite",
    name: "uBlock Origin Lite",
    publisher: "Raymond Hill (gorhill)",
    category: "privacy",
    license: "Open Source • Free",
    icon: ShieldCheck,
    accent: "bg-rose-50 text-rose-700 border-rose-100",
    description:
      "Lightweight Manifest V3 content blocker that removes deceptive pop-up download buttons, malvertising banners, and tracking scripts without reading page data.",
    whyUseIt: "Blocks fake 'Download Now' and 'Virus Detected' pop-ups.",
    storeUrl:
      "https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh",
  },
  {
    id: "privacy-badger",
    name: "Privacy Badger",
    publisher: "Electronic Frontier Foundation (EFF)",
    category: "privacy",
    license: "Nonprofit • Free",
    icon: EyeOff,
    accent: "bg-amber-50 text-amber-800 border-amber-100",
    description:
      "Built by the Electronic Frontier Foundation to automatically detect and block invisible third-party trackers that follow you across websites.",
    whyUseIt: "Stops covert cross-site behavioral tracking.",
    storeUrl:
      "https://chromewebstore.google.com/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp",
  },
  {
    id: "duckduckgo-privacy",
    name: "DuckDuckGo Privacy Essentials",
    publisher: "DuckDuckGo",
    category: "privacy",
    license: "Free",
    icon: Globe,
    accent: "bg-orange-50 text-orange-700 border-orange-100",
    description:
      "Upgrades connections to HTTPS where available, blocks hidden ad trackers, and sends Global Privacy Control (GPC) opt-out signals.",
    whyUseIt: "Enforces encrypted connections and tracker blocking.",
    storeUrl:
      "https://chromewebstore.google.com/detail/duckduckgo-privacy-essent/bkdgflcldnnnapblkhphbgpggdiikppg",
  },
  {
    id: "malwarebytes-guard",
    name: "Malwarebytes Browser Guard",
    publisher: "Malwarebytes",
    category: "phishing",
    license: "Free",
    icon: ShieldCheck,
    accent: "bg-blue-50 text-[#0056D2] border-blue-100",
    description:
      "Blocks known phishing domains, tech-support scam lockups, and malicious scripts before the page finishes loading.",
    whyUseIt: "Stops known scam and credential-harvesting domains.",
    storeUrl:
      "https://chromewebstore.google.com/detail/malwarebytes-browser-guar/ihcjicgdanjaechkgeegckofjjedodee",
  },
  {
    id: "vt4browsers",
    name: "VT4Browsers (VirusTotal)",
    publisher: "VirusTotal",
    category: "phishing",
    license: "Free",
    icon: Search,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    description:
      "Official VirusTotal extension to check suspicious links and file hashes against dozens of security vendors before opening downloads.",
    whyUseIt: "Lets you vet unfamiliar links and attachments safely.",
    storeUrl:
      "https://chromewebstore.google.com/detail/vt4browsers/efbjojhplkelaegfbieplglfidafgoka",
  },
];

export default function ExtensionsStorePage() {
  const prefersReducedMotion = useReducedMotion();

  // Password Generator State
  const [genMode, setGenMode] = useState("password"); // "password" | "passphrase"
  const [pwLength, setPwLength] = useState(18);
  const [pwClasses, setPwClasses] = useState({
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
  });
  const [wordCount, setWordCount] = useState(5);
  const [generated, setGenerated] = useState({ value: "", entropyBits: 0 });
  const [copied, setCopied] = useState(false);

  // URL Inspector State
  const [urlInput, setUrlInput] = useState("");

  // Directory Filter State
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const regenerate = useCallback(() => {
    setCopied(false);
    if (genMode === "passphrase") {
      setGenerated(generateSecurePassphrase(wordCount, "-"));
    } else {
      setGenerated(
        generateSecurePassword({
          length: pwLength,
          ...pwClasses,
        })
      );
    }
  }, [genMode, pwLength, pwClasses, wordCount]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  async function handleCopyPassword() {
    if (!generated.value) return;
    try {
      await navigator.clipboard.writeText(generated.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback selection
    }
  }

  const strengthInfo = useMemo(() => {
    const bits = generated.entropyBits;
    if (bits >= 90) {
      return {
        label: `Very strong (~${bits} bits)`,
        color: "text-emerald-700",
        barColor: "bg-emerald-600",
        pct: 100,
      };
    }
    if (bits >= 65) {
      return {
        label: `Strong (~${bits} bits)`,
        color: "text-[#0056D2]",
        barColor: "bg-[#0056D2]",
        pct: 76,
      };
    }
    return {
      label: `Moderate (~${bits} bits)`,
      color: "text-amber-700",
      barColor: "bg-amber-500",
      pct: 48,
    };
  }, [generated.entropyBits]);

  const urlInspection = useMemo(() => inspectUrlStructure(urlInput), [urlInput]);

  const filteredExtensions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VETTED_EXTENSIONS.filter((item) => {
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <motion.div {...fadeUp(0)} className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0056D2] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Practical Browser Defense</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Browser Safety Tools
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Generate high-entropy passwords locally on your device, check unfamiliar links for phishing red flags, and install reputable open-source and nonprofit security extensions directly from the official Chrome Web Store.
          </p>
        </motion.div>

        {/* Interactive Local Utilities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* TOOL 1: CRYPTOGRAPHIC PASSWORD & PASSPHRASE GENERATOR */}
          <motion.section
            {...fadeUp(0.05)}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Password &amp; Passphrase Generator
                    </h2>
                    <p className="text-xs text-slate-500">
                      Uses your browser&apos;s Web Crypto API — never sent over the network
                    </p>
                  </div>
                </div>

                <div className="inline-flex p-1 rounded-lg bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setGenMode("password")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      genMode === "password"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenMode("passphrase")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      genMode === "passphrase"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Passphrase
                  </button>
                </div>
              </div>

              {/* Output Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm sm:text-base font-mono break-all select-all leading-relaxed text-sky-100">
                    {generated.value}
                  </code>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={regenerate}
                      title="Generate new value"
                      aria-label="Regenerate password"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Entropy Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated cryptographic entropy</span>
                  <span className={`font-bold ${strengthInfo.color}`}>{strengthInfo.label}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthInfo.barColor}`}
                    style={{ width: `${strengthInfo.pct}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              {genMode === "password" ? (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="pw-length" className="font-semibold text-slate-700">
                        Length
                      </label>
                      <span className="font-mono font-bold text-slate-900">
                        {pwLength} characters
                      </span>
                    </div>
                    <input
                      id="pw-length"
                      type="range"
                      min={12}
                      max={36}
                      value={pwLength}
                      onChange={(e) => setPwLength(Number(e.target.value))}
                      className="w-full accent-[#0056D2] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "upper", label: "A–Z" },
                      { key: "lower", label: "a–z" },
                      { key: "digits", label: "0–9" },
                      { key: "symbols", label: "!@#$" },
                    ].map((opt) => {
                      const activeCount = Object.values(pwClasses).filter(Boolean).length;
                      const isChecked = pwClasses[opt.key];
                      return (
                        <label
                          key={opt.key}
                          className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          <span className="font-mono">{opt.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (!e.target.checked && activeCount <= 1) return;
                              setPwClasses((prev) => ({
                                ...prev,
                                [opt.key]: e.target.checked,
                              }));
                            }}
                            className="rounded text-[#0056D2] focus:ring-0 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="word-count" className="font-semibold text-slate-700">
                      Words in passphrase
                    </label>
                    <span className="font-mono font-bold text-slate-900">{wordCount} words</span>
                  </div>
                  <input
                    id="word-count"
                    type="range"
                    min={4}
                    max={7}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-[#0056D2] cursor-pointer"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
              Tip: Save generated passwords inside a password manager like Bitwarden or Proton Pass so you never reuse the same login across websites.
            </p>
          </motion.section>

          {/* TOOL 2: SUSPICIOUS LINK STRUCTURE INSPECTOR */}
          <motion.section
            {...fadeUp(0.1)}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Link Red-Flag Inspector
                  </h2>
                  <p className="text-xs text-slate-500">
                    Paste a suspicious SMS or WhatsApp URL to inspect its real domain structure
                  </p>
                </div>
              </div>

              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="e.g. http://mtn-momo-verify.xyz/login"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => setUrlInput("")}
                    aria-label="Clear link"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!urlInspection ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">What this local check inspects:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
                    <li>Look-alike domains impersonating Ghanaian banks, telcos, or WAEC portals</li>
                    <li>Unencrypted <code className="font-mono">http://</code> links, raw IP addresses, and <code className="font-mono">@</code> redirect tricks</li>
                    <li>Punycode (<code className="font-mono">xn--</code>) homographs and disposable top-level domains</li>
                  </ul>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                    urlInspection.level === "high"
                      ? "bg-rose-50/80 border-rose-200 text-rose-950"
                      : urlInspection.level === "warning"
                      ? "bg-amber-50/80 border-amber-200 text-amber-950"
                      : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      {urlInspection.level === "clean" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            urlInspection.level === "high" ? "text-rose-600" : "text-amber-600"
                          }`}
                        />
                      )}
                      <span>
                        {urlInspection.level === "high"
                          ? "Multiple phishing red flags found"
                          : urlInspection.level === "warning"
                          ? "Caution — structural warning found"
                          : "No obvious URL formatting tricks found"}
                      </span>
                    </div>
                    {urlInspection.valid && (
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-black/10">
                        Host: {urlInspection.hostname}
                      </span>
                    )}
                  </div>

                  {urlInspection.findings.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                      {urlInspection.findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] leading-relaxed">
                      Even when a domain looks normal, never enter your Mobile Money PIN or OTP on a web link sent via SMS or WhatsApp. Check unfamiliar links on{" "}
                      <a
                        href="https://www.virustotal.com/gui/home/url"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        VirusTotal
                      </a>{" "}
                      if unsure.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Structural check only — does not visit or open the link.</span>
              </span>
              <Link
                to="/phishing-simulator"
                className="font-semibold text-[#0056D2] hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Practice lab</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.section>
        </div>

        {/* Vetted Official Extensions Directory */}
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Recommended Browser Extensions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Vetted security and privacy extensions. Links open the publisher&apos;s official listing on the Chrome Web Store (compatible with Chrome, Brave, and Edge).
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter extensions..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    isSelected
                      ? "bg-[#001E3C] text-white border-[#001E3C]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          {filteredExtensions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">No matching extensions</p>
              <p className="text-xs text-slate-500">
                Try clearing your search filter or selecting All Safety Tools.
              </p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredExtensions.map((ext) => {
                  const Icon = ext.icon;
                  return (
                    <motion.div
                      layout
                      key={ext.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      transition={{ duration: 0.18 }}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${ext.accent}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {ext.name}
                              </h3>
                              <p className="text-xs text-slate-500">{ext.publisher}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            {ext.license}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{ext.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          {ext.whyUseIt}
                        </span>
                        <a
                          href={ext.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0056D2] hover:bg-[#00419E] text-white text-xs font-bold transition shrink-0"
                        >
                          <span>Chrome Web Store</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
