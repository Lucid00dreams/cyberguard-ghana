import { useState, useMemo } from "react";
import {
  Search,
  Star,
  Download,
  CheckCircle2,
  Package,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Eye,
  Globe,
  Cpu,
  Code,
  Sliders,
  Terminal,
  Filter,
  ChevronRight,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Clean Curated Cybersecurity Extension Catalog
// ─────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", label: "All Tools", icon: Package },
  { key: "password", label: "Password & Auth", icon: Lock },
  { key: "privacy", label: "Privacy", icon: Eye },
  { key: "threat", label: "Threat Intel", icon: ShieldAlert },
  { key: "network", label: "Network Security", icon: Globe },
  { key: "osint", label: "OSINT", icon: Search },
  { key: "devsec", label: "Dev Security", icon: Code },
  { key: "forensics", label: "Forensics", icon: Terminal },
  { key: "vpn", label: "VPN & Proxy", icon: ShieldCheck },
];

const EXTENSIONS = [
  // ── Password & Auth ──────────────────────
  {
    id: "bitwarden",
    name: "Bitwarden",
    publisher: "Bitwarden Inc.",
    category: "password",
    rating: 4.8,
    installs: "3M+",
    featured: true,
    description:
      "Open-source password manager. Generate, save, and autofill strong credentials with zero-knowledge end-to-end encryption.",
    url: "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb",
    icon: Lock,
    badge: "Open Source",
  },
  {
    id: "1password",
    name: "1Password",
    publisher: "AgileBits Inc.",
    category: "password",
    rating: 4.7,
    installs: "900K+",
    featured: false,
    description:
      "Password management with Watchtower breach notifications, Travel Mode security, and secure credential sharing.",
    url: "https://chrome.google.com/webstore/detail/1password-–-password-mana/aeblfdkhhhdcdjpifhhbdiojplfjncoa",
    icon: Key,
    badge: "Verified",
  },
  {
    id: "nordpass",
    name: "NordPass",
    publisher: "Nord Security",
    category: "password",
    rating: 4.5,
    installs: "500K+",
    featured: false,
    description:
      "XChaCha20 encrypted password manager by Nord Security. Features real-time breach scanner and credential audit.",
    url: "https://chrome.google.com/webstore/detail/nordpass%C2%AE-password-manage/fooolghllnmhmmndgjiamiiodkpenpbb",
    icon: ShieldCheck,
    badge: null,
  },

  // ── Privacy ──────────────────────────────
  {
    id: "ublockorigin",
    name: "uBlock Origin",
    publisher: "Raymond Hill",
    category: "privacy",
    rating: 4.9,
    installs: "30M+",
    featured: true,
    description:
      "Efficient wide-spectrum content blocker. Blocks tracking scripts, malicious ads, and coin miners with minimal CPU and memory usage.",
    url: "https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm",
    icon: Shield,
    badge: "Open Source",
  },
  {
    id: "privacybadger",
    name: "Privacy Badger",
    publisher: "Electronic Frontier Foundation",
    category: "privacy",
    rating: 4.5,
    installs: "1M+",
    featured: false,
    description:
      "Built by the EFF. Automatically detects and blocks third-party trackers based on tracking behavior across websites.",
    url: "https://chrome.google.com/webstore/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp",
    icon: Eye,
    badge: "EFF",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo Privacy Essentials",
    publisher: "DuckDuckGo",
    category: "privacy",
    rating: 4.6,
    installs: "5M+",
    featured: false,
    description:
      "Enforces HTTPS encryption, blocks hidden tracking networks, and provides a website privacy rating on every domain.",
    url: "https://chrome.google.com/webstore/detail/duckduckgo-privacy-essent/bkbkchdhiamnoj/",
    icon: Globe,
    badge: "Verified",
  },

  // ── Threat Intelligence ──────────────────
  {
    id: "virustotal",
    name: "VirusTotal",
    publisher: "Google / Chronicle",
    category: "threat",
    rating: 4.6,
    installs: "800K+",
    featured: true,
    description:
      "Right-click any link or file before downloading to inspect its safety score across 70+ antivirus engines and threat feeds.",
    url: "https://chrome.google.com/webstore/detail/virustotal/efbjojhplkelaegfbieplglfidedpora",
    icon: ShieldAlert,
    badge: "Google",
  },
  {
    id: "talos",
    name: "Cisco Talos Intelligence",
    publisher: "Cisco Systems",
    category: "threat",
    rating: 4.3,
    installs: "60K+",
    featured: false,
    description:
      "Look up reputation for suspicious IP addresses, domains, and file hashes against Cisco Talos's global threat intelligence dataset.",
    url: "https://www.talosintelligence.com/",
    icon: Zap,
    badge: "Cisco",
  },
  {
    id: "urlvoid",
    name: "URLVoid Scanner",
    publisher: "URLVoid.com",
    category: "threat",
    rating: 4.1,
    installs: "30K+",
    featured: false,
    description:
      "Scan URLs against 30+ blacklist databases to identify phishing campaigns, malicious redirects, and fraudulent domains.",
    url: "https://www.urlvoid.com/",
    icon: Search,
    badge: null,
  },

  // ── Network Security ─────────────────────
  {
    id: "shodan",
    name: "Shodan Plugin",
    publisher: "Shodan",
    category: "network",
    rating: 4.4,
    installs: "200K+",
    featured: false,
    description:
      "View open ports, detected services, ASN ownership, and reported vulnerabilities for the web server hosting any website.",
    url: "https://chrome.google.com/webstore/detail/shodan/jjalcfnidlmpjhdfepjhjbhnhkbgleap",
    icon: Globe,
    badge: null,
  },
  {
    id: "http2indicator",
    name: "HTTP/2 & QUIC Indicator",
    publisher: "Andy Davies",
    category: "network",
    rating: 4.2,
    installs: "100K+",
    featured: false,
    description:
      "Displays transport protocol indicators (HTTP/1.1, HTTP/2, HTTP/3 QUIC) in real time to assess TLS and protocol posture.",
    url: "https://chrome.google.com/webstore/detail/http2-and-spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin",
    icon: Cpu,
    badge: null,
  },
  {
    id: "securityheaders",
    name: "Security Headers Audit",
    publisher: "Scott Helme",
    category: "network",
    rating: 4.6,
    installs: "80K+",
    featured: false,
    description:
      "Evaluates HTTP security response headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy) and grades implementation.",
    url: "https://chrome.google.com/webstore/detail/security-headers/emikbbbebcdfohonlaifafnoanocnebl",
    icon: ShieldCheck,
    badge: null,
  },

  // ── OSINT ────────────────────────────────
  {
    id: "hunter",
    name: "Hunter Domain Finder",
    publisher: "Hunter.io",
    category: "osint",
    rating: 4.5,
    installs: "500K+",
    featured: false,
    description:
      "Find publicly exposed corporate email addresses and contact structures for any domain during security reconnaissance.",
    url: "https://chrome.google.com/webstore/detail/hunter-email-finder-exten/hgmhmanijnjhaffoampdlllchpolkdnj",
    icon: Search,
    badge: null,
  },
  {
    id: "builtwith",
    name: "BuiltWith Technology Profiler",
    publisher: "BuiltWith.com",
    category: "osint",
    rating: 4.3,
    installs: "300K+",
    featured: false,
    description:
      "Inspect the technology stack of any website: web servers, frameworks, CDNs, analytics providers, and third-party libraries.",
    url: "https://chrome.google.com/webstore/detail/builtwith-technology-prof/dapjbgnjinbpoindlpdmhochffioedbn",
    icon: Code,
    badge: null,
  },
  {
    id: "ipassistant",
    name: "IP & ASN Lookup",
    publisher: "IP-API",
    category: "osint",
    rating: 4.4,
    installs: "200K+",
    featured: false,
    description:
      "Instant lookup of IP address, Autonomous System Number (ASN), geolocation, ISP provider, and network abuse contact.",
    url: "https://chromewebstore.google.com/detail/ip-address-domain-informa/lhgkegeccnckoiliokondpaaalbhafoa",
    icon: Globe,
    badge: null,
  },

  // ── Dev Security ─────────────────────────
  {
    id: "retirejs",
    name: "Retire.js",
    publisher: "Erlend Oftedal",
    category: "devsec",
    rating: 4.3,
    installs: "50K+",
    featured: false,
    description:
      "Scans web applications for vulnerable JavaScript libraries with known CVEs and alerts you with severity information.",
    url: "https://chrome.google.com/webstore/detail/retirejs/moibopkbhjceeedibkbkbchbjnkadmom",
    icon: Code,
    badge: "Open Source",
  },
  {
    id: "cspevaluator",
    name: "CSP Evaluator",
    publisher: "Google Information Security",
    category: "devsec",
    rating: 4.5,
    installs: "40K+",
    featured: false,
    description:
      "Analyzes Content Security Policy headers for bypasses and common misconfigurations that could allow Cross-Site Scripting (XSS).",
    url: "https://chrome.google.com/webstore/detail/csp-evaluator/fjohamlofnakbnbfjkohkbdigoodcejf",
    icon: ShieldAlert,
    badge: "Google",
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer",
    publisher: "Wappalyzer",
    category: "devsec",
    rating: 4.4,
    installs: "2M+",
    featured: false,
    description:
      "Identifies software stacks, frameworks, CMS platforms, and server software for attack surface mapping and penetration testing.",
    url: "https://chrome.google.com/webstore/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg",
    icon: Code,
    badge: "Verified",
  },
  {
    id: "cookie-editor",
    name: "Cookie-Editor",
    publisher: "cgagnier.ca",
    category: "devsec",
    rating: 4.6,
    installs: "1M+",
    featured: false,
    description:
      "Inspect, create, edit, and delete browser cookies in real time. Essential for session testing and authentication audits.",
    url: "https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm",
    icon: Sliders,
    badge: null,
  },

  // ── Forensics ────────────────────────────
  {
    id: "modheader",
    name: "ModHeader",
    publisher: "Bewisse",
    category: "forensics",
    rating: 4.5,
    installs: "700K+",
    featured: false,
    description:
      "Modify HTTP request and response headers on the fly to test CORS policies, custom authentication tokens, and API behavior.",
    url: "https://chrome.google.com/webstore/detail/modheader-modify-http-hea/idgpnmonknjnojddfkpgkljpfnnfcklj",
    icon: Terminal,
    badge: null,
  },
  {
    id: "useragentswitcher",
    name: "User-Agent Switcher",
    publisher: "ray-lothian",
    category: "forensics",
    rating: 4.4,
    installs: "600K+",
    featured: false,
    description:
      "Spoof browser user-agent strings to test device fingerprinting, mobile response layouts, and access control policies.",
    url: "https://chrome.google.com/webstore/detail/user-agent-switcher-and-m/bhchdcejhohfmigjafbampogmaanbfkg",
    icon: Cpu,
    badge: "Open Source",
  },
  {
    id: "hackbar",
    name: "HackBar Quantum",
    publisher: "0140454",
    category: "forensics",
    rating: 4.2,
    installs: "100K+",
    featured: false,
    description:
      "Penetration testing helper bar for encoding/decoding Base64, URL encoding, MD5/SHA hashes, and testing security inputs.",
    url: "https://chromewebstore.google.com/detail/hackbar-quantum/hndkdpedhhpkfgcleoegjaoopljbgkla",
    icon: Terminal,
    badge: null,
  },

  // ── VPN & Proxy ──────────────────────────
  {
    id: "windscribe",
    name: "Windscribe VPN",
    publisher: "Windscribe Limited",
    category: "vpn",
    rating: 4.5,
    installs: "1M+",
    featured: false,
    description:
      "Encrypted browser proxy with integrated tracker blocker, firewall protection, and strict zero-logging architecture.",
    url: "https://chrome.google.com/webstore/detail/windscribe-vpn/hnmpcagpplmpfojmgmnngilcnanddlhb",
    icon: ShieldCheck,
    badge: "Free Tier",
  },
  {
    id: "protonvpn",
    name: "ProtonVPN",
    publisher: "Proton AG",
    category: "vpn",
    rating: 4.6,
    installs: "400K+",
    featured: false,
    description:
      "Open-source, Swiss-based VPN with verified no-logs audit and forward secrecy to secure internet traffic on public networks.",
    url: "https://chrome.google.com/webstore/detail/proton-vpn-fast-secure/jplgfhpmjnbigmhklmmbgecoobifkmpa",
    icon: Shield,
    badge: "Open Source",
  },
];

function StarRating({ rating }) {
  const full = Math.floor(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < full
              ? "fill-[#0056D2] text-[#0056D2]"
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
      <span className="text-xs text-slate-700 font-mono font-semibold ml-1">{rating}</span>
    </span>
  );
}

function ExtensionCard({ ext, installed, onToggle }) {
  const catObj = CATEGORIES.find((c) => c.key === ext.category);
  const IconComponent = ext.icon || Shield;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-150 ${
        installed
          ? "border-blue-300 ring-1 ring-blue-100 shadow-xs"
          : "border-slate-200 hover:border-blue-400 hover:shadow-md"
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0056D2] flex items-center justify-center shrink-0">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm leading-tight truncate">
                {ext.name}
              </span>
              {ext.badge && (
                <span className="text-[10px] font-semibold text-[#0056D2] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {ext.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{ext.publisher}</p>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
          <StarRating rating={ext.rating} />
          <span className="flex items-center gap-1 font-mono">
            <Download className="w-3 h-3 text-slate-400" />
            {ext.installs}
          </span>
          {catObj && (
            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
              {catObj.label}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {ext.description}
        </p>
      </div>

      {/* CTA Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onToggle(ext.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
            installed
              ? "bg-blue-50 text-[#0056D2] border border-blue-200 hover:bg-blue-100"
              : "bg-[#0056D2] hover:bg-blue-700 text-white shadow-2xs"
          }`}
        >
          {installed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Installed
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Install Extension
            </>
          )}
        </button>
        <a
          href={ext.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl text-slate-400 hover:text-[#0056D2] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition"
          title="Open in official store"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function ExtensionsStore() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [installed, setInstalled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cg_installed_extensions") || "[]");
    } catch {
      return [];
    }
  });

  function toggleInstall(id) {
    const ext = EXTENSIONS.find((e) => e.id === id);
    setInstalled((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else {
        if (ext?.url) window.open(ext.url, "_blank", "noopener,noreferrer");
        next = [...prev, id];
      }
      localStorage.setItem("cg_installed_extensions", JSON.stringify(next));
      return next;
    });
  }

  const featured = EXTENSIONS.filter((e) => e.featured);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return EXTENSIONS.filter((e) => {
      const matchesCat = activeCategory === "all" || e.category === activeCategory;
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Clean Platform Blue Hero Banner ── */}
      <div className="rounded-2xl bg-[#0056D2] text-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <Package className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Cybersecurity Extensions Store
                </h1>
                <p className="text-xs text-blue-100">
                  Vetted browser security tools for defense, credentials, and digital privacy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-blue-100 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-white" /> {EXTENSIONS.length} Vetted Tools
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" /> {installed.length} Installed
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-white" /> {CATEGORIES.length - 1} Categories
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white">
              Official Store Links
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured Picks ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Featured Tools
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featured.map((ext) => {
            const IconComponent = ext.icon || Shield;
            return (
              <div
                key={ext.id}
                onClick={() => toggleInstall(ext.id)}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0056D2] flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{ext.name}</div>
                    <div className="text-xs text-slate-500">{ext.installs} users</div>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-[#0056D2] transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="ext-search"
            type="text"
            placeholder="Search extensions by name, publisher, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:ring-1 focus:ring-blue-100 transition"
          />
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{filtered.length} available</span>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeCategory === key
                ? "bg-[#0056D2] text-white border-[#0056D2]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Extension Cards Grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl text-slate-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">No extensions found</p>
          <p className="text-xs text-slate-400 mt-1">Try another keyword or select "All Tools"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ext) => (
            <ExtensionCard
              key={ext.id}
              ext={ext}
              installed={installed.includes(ext.id)}
              onToggle={toggleInstall}
            />
          ))}
        </div>
      )}

      {/* ── Disclaimer Footer ── */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#0056D2] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800 font-semibold">Educational Notice:</strong> These extensions are curated for educational and defensive cybersecurity purposes. Clicking "Install Extension" directs to the official browser web store in a new tab. Always review extension permissions prior to installation.
        </p>
      </div>
    </div>
  );
}
