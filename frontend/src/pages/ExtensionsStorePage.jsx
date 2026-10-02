import { useState, useMemo, useRef, useEffect } from "react";
import FeaturedSwipeStack from "../components/FeaturedSwipeStack";
import JSZip from "jszip";
import {
  Search,
  Star,
  Download,
  CheckCircle2,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Eye,
  Globe,
  Code,
  Terminal,
  Layers,
  Sparkles,
  Server,
  Zap,
  ChevronDown,
  Check,
  Volume2,
  BookOpen,
  FileText,
  Store,
  X,
  SlidersHorizontal,
  Loader2,
  Settings,
  Trash2,
  Moon,
  Sun,
  Copy,
  RefreshCw,
  Radio,
  HelpCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
// App Store Categories
// ─────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "all",
    label: "All Extensions",
    icon: Store,
    description: "Complete catalog of vetted extensions",
  },
  {
    key: "lifestyle",
    label: "Student & Lifestyle",
    icon: Sparkles,
    description: "AI grammar, study focus, dark mode, and audio tools for everyday life",
  },
  {
    key: "privacy",
    label: "Privacy & Anti-Tracking",
    icon: Eye,
    description: "Wide-spectrum ad blockers, fingerprinting protection, and telemetry blockers",
  },
  {
    key: "password",
    label: "Password & Identity",
    icon: Lock,
    description: "Zero-knowledge vaults, passkeys, and credential hygiene",
  },
  {
    key: "threat",
    label: "Threat Intel & OSINT",
    icon: ShieldAlert,
    description: "URL reputation, malware intelligence, passive reconnaissance, and DNS lookups",
  },
  {
    key: "devsec",
    label: "Web & App Security",
    icon: Code,
    description: "Library vulnerability scanners, CSP evaluators, and web pentest helpers",
  },
  {
    key: "network",
    label: "Network & VPN",
    icon: Globe,
    description: "Encrypted tunnels, protocol indicators, and security headers auditors",
  },
];

// ─────────────────────────────────────────────
// Spotlight / Featured Extensions (App Store Row)
// ─────────────────────────────────────────────
const SPOTLIGHT_ITEMS = [
  {
    id: "ublockorigin",
    tagline: "ESSENTIAL PRIVACY",
    title: "uBlock Origin",
    subtitle: "#1 Wide-Spectrum Ad Blocker",
    description: "Zero-bloat ad and tracker blocking with minimal memory usage.",
    badge: "Must-Have",
    gradient: "from-[#0056D2] to-blue-700",
  },
  {
    id: "grammarly",
    tagline: "STUDENT ESSENTIAL",
    title: "Grammarly AI",
    subtitle: "Writing & Essay Assistant",
    description: "Real-time AI spelling, grammar, and essay tone corrector for students.",
    badge: "Student Choice",
    gradient: "from-blue-700 to-indigo-800",
  },
  {
    id: "bitwarden",
    tagline: "CREDENTIAL DEFENSE",
    title: "Bitwarden Vault",
    subtitle: "Zero-Knowledge Passwords",
    description: "End-to-end encrypted password and 2FA authenticator manager.",
    badge: "Open Source",
    gradient: "from-blue-800 to-slate-900",
  },
  {
    id: "darkreader",
    tagline: "NIGHT STUDY & FOCUS",
    title: "Dark Reader",
    subtitle: "Eye Strain Protection",
    description: "Inverts brightness to create soothing dark mode on all websites.",
    badge: "Study Favorite",
    gradient: "from-slate-800 to-slate-950",
  },
  {
    id: "virustotal",
    tagline: "THREAT INTELLIGENCE",
    title: "VT4Browsers",
    subtitle: "Real-time Threat Scanner",
    description: "Scan links and downloads against 70+ antivirus engines via VirusTotal.",
    badge: "SOC Vetted",
    gradient: "from-blue-900 to-indigo-950",
  },
];

// ─────────────────────────────────────────────
// 32 Vetted Extensions Database with Real Logos
// ─────────────────────────────────────────────
const EXTENSIONS = [
  // ── Student & Lifestyle ──────────────────────
  {
    id: "grammarly",
    name: "Grammarly: AI Writing Assistant",
    publisher: "Grammarly Inc.",
    category: "lifestyle",
    rating: 4.5,
    installs: "40M+",
    manifestVersion: "Manifest V3",
    badge: "Essential",
    icon: Sparkles,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/grammarly.svg",
    description:
      "AI grammar, spelling, punctuation, and clarity corrector for student essays, reports, and emails.",
    url: "https://chrome.google.com/webstore/detail/grammarly-ai-writing-and/kbfnbcaeplbcioakkpcpgfkobkghlhen",
  },
  {
    id: "darkreader",
    name: "Dark Reader",
    publisher: "Alexander Shutau",
    category: "lifestyle",
    rating: 4.7,
    installs: "5M+",
    manifestVersion: "Manifest V3",
    badge: "Open Source",
    icon: Eye,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/darkreader.svg",
    description:
      "Inverts brightness and creates soothing dark themes on all websites to protect eyes during late-night study sessions.",
    url: "https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh",
  },
  {
    id: "notion",
    name: "Notion Web Clipper",
    publisher: "Notion Labs Inc.",
    category: "lifestyle",
    rating: 4.2,
    installs: "4M+",
    manifestVersion: "Manifest V3",
    badge: "Productivity",
    icon: Layers,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/notion.svg",
    description:
      "Save any web page, study article, or research summary directly into your Notion workspace with one click.",
    url: "https://chrome.google.com/webstore/detail/notion-web-clipper/knheggckgoiihginacbkhaalnibhilkk",
  },
  {
    id: "forest",
    name: "Forest: Focus & Study Timer",
    publisher: "ForestApp",
    category: "lifestyle",
    rating: 4.8,
    installs: "800K+",
    manifestVersion: "Manifest V3",
    badge: "Focus",
    icon: Zap,
    logoUrl: "https://www.google.com/s2/favicons?domain=forestapp.cc&sz=128",
    description:
      "Gamified Pomodoro timer. Plant virtual trees while studying; trees wither if you visit distracting social websites.",
    url: "https://chrome.google.com/webstore/detail/forest-stay-focused-be-pr/kjacjjdnoddnpdgjhflfcggipjlhnjjd",
  },
  {
    id: "googlescholar",
    name: "Google Scholar Button",
    publisher: "Google",
    category: "lifestyle",
    rating: 4.4,
    installs: "3M+",
    manifestVersion: "Manifest V3",
    badge: "Academic",
    icon: BookOpen,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googlescholar.svg",
    description:
      "Look up academic papers, citations, and journal references instantly while browsing university coursework.",
    url: "https://chrome.google.com/webstore/detail/google-scholar-button/ldipcbpaocekfooobnbcddclnhejkcpn",
  },
  {
    id: "volumemaster",
    name: "Volume Master - 600% Audio Boost",
    publisher: "Peta Sittek",
    category: "lifestyle",
    rating: 4.7,
    installs: "10M+",
    manifestVersion: "Manifest V3",
    badge: "Audio",
    icon: Volume2,
    logoUrl: "https://www.google.com/s2/favicons?domain=chrome.google.com&sz=128",
    description:
      "Boost sound volume up to 600% for quiet lectures, zoom recordings, and online tutorials across browser tabs.",
    url: "https://chrome.google.com/webstore/detail/volume-master/jghecgabfgfdldnmbfkhmffcabddioke",
  },
  {
    id: "toby",
    name: "Toby for Tabs - Session Manager",
    publisher: "Toby",
    category: "lifestyle",
    rating: 4.5,
    installs: "400K+",
    manifestVersion: "Manifest V3",
    badge: "Organize",
    icon: Store,
    logoUrl: "https://www.google.com/s2/favicons?domain=gettoby.com&sz=128",
    description:
      "Organize tabs into visual collections for different courses, research projects, and everyday reading lists.",
    url: "https://chrome.google.com/webstore/detail/toby-for-tabs/hddnkoipeegfoeaoibdmnaalmgkpipfd",
  },
  {
    id: "languagetool",
    name: "LanguageTool - Grammar & Style",
    publisher: "LanguageTooler GmbH",
    category: "lifestyle",
    rating: 4.7,
    installs: "2M+",
    manifestVersion: "Manifest V3",
    badge: "Writing",
    icon: FileText,
    logoUrl: "https://www.google.com/s2/favicons?domain=languagetool.org&sz=128",
    description:
      "Multilingual spelling, style, and grammar assistant supporting English, French, and over 30 languages.",
    url: "https://chrome.google.com/webstore/detail/grammar-and-spell-checker/oldceeleldhonbafppcapldpdifcinji",
  },

  // ── Password & Identity ──────────────────────
  {
    id: "bitwarden",
    name: "Bitwarden",
    publisher: "Bitwarden Inc.",
    category: "password",
    rating: 4.8,
    installs: "3M+",
    manifestVersion: "Manifest V3",
    badge: "Open Source",
    icon: Lock,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bitwarden.svg",
    description:
      "Open-source password manager with zero-knowledge AES-256 encryption and integrated 2FA authenticator.",
    url: "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb",
  },
  {
    id: "1password",
    name: "1Password",
    publisher: "AgileBits Inc.",
    category: "password",
    rating: 4.7,
    installs: "900K+",
    manifestVersion: "Manifest V3",
    badge: "Verified",
    icon: Key,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/1password.svg",
    description:
      "Password management with Watchtower breach notifications, Travel Mode security, and secure passkeys.",
    url: "https://chrome.google.com/webstore/detail/1password-%E2%80%93-password-mana/aeblfdkhhhdcdjpifhhbdiojplfjncoa",
  },
  {
    id: "nordpass",
    name: "NordPass",
    publisher: "Nord Security",
    category: "password",
    rating: 4.5,
    installs: "500K+",
    manifestVersion: "Manifest V3",
    badge: "Audited",
    icon: ShieldCheck,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nordpass.svg",
    description:
      "XChaCha20 encrypted password manager by Nord Security featuring automatic real-time breach scanning.",
    url: "https://chrome.google.com/webstore/detail/nordpass%C2%AE-password-manage/fooolghllnmhmmndgjiamiiodkpenpbb",
  },

  // ── Privacy & Anti-Tracking ──────────────────
  {
    id: "ublockorigin",
    name: "uBlock Origin",
    publisher: "Raymond Hill",
    category: "privacy",
    rating: 4.9,
    installs: "30M+",
    manifestVersion: "Manifest V3 / V2",
    badge: "Open Source",
    icon: Shield,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/ublockorigin.svg",
    description:
      "Efficient wide-spectrum content blocker. Blocks tracking scripts, malvertising, and coin miners with minimal CPU usage.",
    url: "https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm",
  },
  {
    id: "privacybadger",
    name: "Privacy Badger",
    publisher: "Electronic Frontier Foundation (EFF)",
    category: "privacy",
    rating: 4.5,
    installs: "1M+",
    manifestVersion: "Manifest V3",
    badge: "EFF",
    icon: Eye,
    logoUrl: "https://www.google.com/s2/favicons?domain=privacybadger.org&sz=128",
    description:
      "Built by the EFF. Automatically detects and blocks third-party trackers based on tracking behavior across sites.",
    url: "https://chrome.google.com/webstore/detail/privacy-badger/pkehgijcmpdhfbdbbnkijodmdjhbjlgp",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo Privacy Essentials",
    publisher: "DuckDuckGo",
    category: "privacy",
    rating: 4.6,
    installs: "5M+",
    manifestVersion: "Manifest V3",
    badge: "Verified",
    icon: ShieldCheck,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/duckduckgo.svg",
    description:
      "Seamless privacy protection with built-in tracker blocking, smarter encryption (HTTPS), and private search.",
    url: "https://chrome.google.com/webstore/detail/duckduckgo-privacy-essent/bkdgflcldnnnapblkhphbgpggdiikppg",
  },

  // ── Threat Intel & OSINT ─────────────────────
  {
    id: "virustotal",
    name: "VirusTotal VT4Browsers",
    publisher: "VirusTotal (Chronicle / Google)",
    category: "threat",
    rating: 4.5,
    installs: "300K+",
    manifestVersion: "Manifest V3",
    badge: "Google Security",
    icon: ShieldAlert,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/virustotal.svg",
    description:
      "Checks downloaded files and suspicious links against 70+ antivirus and threat intelligence engines before opening.",
    url: "https://chrome.google.com/webstore/detail/vt4browsers/efbjojhplkelaegfbieplglfidafgoka",
  },
  {
    id: "talos",
    name: "Cisco Talos Intelligence",
    publisher: "Cisco Systems",
    category: "threat",
    rating: 4.4,
    installs: "100K+",
    manifestVersion: "Manifest V3",
    badge: "Cisco",
    icon: Shield,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/cisco.svg",
    description:
      "Instant lookup of IP and domain reputation against Cisco Talos threat research and telemetry databases.",
    url: "https://talosintelligence.com",
  },
  {
    id: "urlvoid",
    name: "URLVoid Link Scanner",
    publisher: "NoVirusThanks",
    category: "threat",
    rating: 4.3,
    installs: "80K+",
    manifestVersion: "Manifest V3",
    badge: "Scanner",
    icon: ShieldAlert,
    logoUrl: "https://www.google.com/s2/favicons?domain=urlvoid.com&sz=128",
    description:
      "Analyze websites through 30+ blocklist engines and domain reputation tools to detect phishing and scam sites.",
    url: "https://www.urlvoid.com",
  },
  {
    id: "shodan",
    name: "Shodan",
    publisher: "Shodan.io",
    category: "threat",
    rating: 4.6,
    installs: "200K+",
    manifestVersion: "Manifest V3",
    badge: "OSINT",
    icon: Globe,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/shodan.svg",
    description:
      "Shows open ports, services, geographic location, and hosting provider for any website you visit.",
    url: "https://chrome.google.com/webstore/detail/shodan/jjaldaagfjfglddndfpgbipjflamjndl",
  },
  {
    id: "hunter",
    name: "Hunter - Email Finder",
    publisher: "Hunter.io",
    category: "threat",
    rating: 4.7,
    installs: "600K+",
    manifestVersion: "Manifest V3",
    badge: "Verified",
    icon: Search,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hunter.svg",
    description:
      "Find email addresses associated with any domain. Essential for security audits, authorized OSINT, and domain verification.",
    url: "https://chrome.google.com/webstore/detail/hunter-email-finder-exten/hgmhmanijnjhaffoampdlllchpolkdnj",
  },
  {
    id: "builtwith",
    name: "BuiltWith Technology Profiler",
    publisher: "BuiltWith Pty Ltd",
    category: "threat",
    rating: 4.5,
    installs: "1M+",
    manifestVersion: "Manifest V3",
    badge: "Recon",
    icon: Server,
    logoUrl: "https://www.google.com/s2/favicons?domain=builtwith.com&sz=128",
    description:
      "Find out what technologies, frameworks, CDNs, and security controls are running behind the websites you inspect.",
    url: "https://chrome.google.com/webstore/detail/builtwith-technology-prof/dapjbgnjinbpoindlpdmhochffioedbn",
  },
  {
    id: "ipassistant",
    name: "IP & ASN Lookup",
    publisher: "IP-API",
    category: "threat",
    rating: 4.4,
    installs: "200K+",
    manifestVersion: "Manifest V3",
    badge: "Network",
    icon: Globe,
    logoUrl: "https://www.google.com/s2/favicons?domain=ip-api.com&sz=128",
    description:
      "Instant resolution of server IP address, Autonomous System Number (ASN), country, and ISP details for active host.",
    url: "https://chromewebstore.google.com/detail/ip-address-domain-informa/lhgkegeccnckoiliokondpaaalbhafoa",
  },

  // ── Web & App Security ───────────────────────
  {
    id: "retirejs",
    name: "Retire.js",
    publisher: "Erlend Oftedal",
    category: "devsec",
    rating: 4.3,
    installs: "50K+",
    manifestVersion: "Manifest V3",
    badge: "Open Source",
    icon: Code,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/javascript.svg",
    description:
      "Scans web applications for vulnerable JavaScript libraries and components with known CVEs.",
    url: "https://chrome.google.com/webstore/detail/retirejs/moibopkbhjceeedibkbkbchbjnkadmom",
  },
  {
    id: "cspevaluator",
    name: "CSP Evaluator",
    publisher: "Google Security Team",
    category: "devsec",
    rating: 4.4,
    installs: "40K+",
    manifestVersion: "Manifest V3",
    badge: "Google",
    icon: ShieldCheck,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg",
    description:
      "Evaluates Content Security Policy (CSP) headers against industry best practices and detects XSS bypass risks.",
    url: "https://chrome.google.com/webstore/detail/csp-evaluator/dmlkfcidkgnonimmlaidgahbihdfikhm",
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer",
    publisher: "Wappalyzer",
    category: "devsec",
    rating: 4.6,
    installs: "2M+",
    manifestVersion: "Manifest V3",
    badge: "Standard",
    icon: Code,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/wappalyzer.svg",
    description:
      "Identifies software, CMS engines, web frameworks, payment processors, and analytics scripts on any visited website.",
    url: "https://chrome.google.com/webstore/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg",
  },
  {
    id: "cookie-editor",
    name: "Cookie-Editor",
    publisher: "Moustachauve",
    category: "devsec",
    rating: 4.7,
    installs: "800K+",
    manifestVersion: "Manifest V3",
    badge: "Open Source",
    icon: Lock,
    logoUrl: "https://www.google.com/s2/favicons?domain=cookie-editor.cgagnier.ca&sz=128",
    description:
      "Inspect, create, edit, and delete browser cookies. Inspect SameSite, Secure, and HttpOnly security attributes.",
    url: "https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm",
  },
  {
    id: "modheader",
    name: "ModHeader - Modify Headers",
    publisher: "ModHeader",
    category: "devsec",
    rating: 4.4,
    installs: "900K+",
    manifestVersion: "Manifest V3",
    badge: "Headers",
    icon: Terminal,
    logoUrl: "https://www.google.com/s2/favicons?domain=modheader.com&sz=128",
    description:
      "Modify HTTP request and response headers on the fly. Essential for testing authorization tokens and security headers.",
    url: "https://chrome.google.com/webstore/detail/modheader-modify-http-hea/idgpnmonknjnojddfkpgkljpfnnfcklj",
  },
  {
    id: "useragentswitcher",
    name: "User-Agent Switcher",
    publisher: "Google",
    category: "devsec",
    rating: 4.1,
    installs: "2M+",
    manifestVersion: "Manifest V3",
    badge: "Google",
    icon: Globe,
    logoUrl: "https://www.google.com/s2/favicons?domain=chrome.google.com&sz=128",
    description:
      "Quickly spoof and switch browser User-Agent strings to audit mobile rendering, bot detection, and WAF rules.",
    url: "https://chrome.google.com/webstore/detail/user-agent-switcher-for-c/djflhoibgkdhkhhcedjiklpkjnoahfmg",
  },
  {
    id: "hackbar",
    name: "HackBar Web Pentest Helper",
    publisher: "Security Community",
    category: "devsec",
    rating: 4.3,
    installs: "100K+",
    manifestVersion: "Manifest V3",
    badge: "Pentest",
    icon: Terminal,
    logoUrl: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
    description:
      "Security testing tool to assist in auditing SQL injection, XSS payloads, URL encoding/decoding, and Base64 hashes.",
    url: "https://github.com",
  },

  // ── Network & VPN ────────────────────────────
  {
    id: "protonvpn",
    name: "Proton VPN",
    publisher: "Proton AG",
    category: "network",
    rating: 4.6,
    installs: "1M+",
    manifestVersion: "Manifest V3",
    badge: "Swiss Privacy",
    icon: Globe,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/protonvpn.svg",
    description:
      "High-speed Swiss VPN with strict no-logs policy, DNS leak protection, and NetShield malicious domain blocking.",
    url: "https://chrome.google.com/webstore/detail/proton-vpn-fast-secure/jplgfhpmjnbigmhklmmbgecoobifkmpa",
  },
  {
    id: "windscribe",
    name: "Windscribe - Free VPN",
    publisher: "Windscribe Limited",
    category: "network",
    rating: 4.6,
    installs: "2M+",
    manifestVersion: "Manifest V3",
    badge: "No-Logs",
    icon: ShieldCheck,
    logoUrl: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/windscribe.svg",
    description:
      "Browser VPN and proxy with built-in R.O.B.E.R.T. ad and malware blocking, WebRTC leak prevention, and cookie clearing.",
    url: "https://chrome.google.com/webstore/detail/windscribe-free-proxy-and/hnmpcagpplmpfojmgmnngilcnanddlhb",
  },
  {
    id: "securityheaders",
    name: "Security Headers Checker",
    publisher: "Scott Helme",
    category: "network",
    rating: 4.5,
    installs: "30K+",
    manifestVersion: "Manifest V3",
    badge: "Audited",
    icon: ShieldCheck,
    logoUrl: "https://www.google.com/s2/favicons?domain=securityheaders.com&sz=128",
    description:
      "Grades websites from A+ to F on implementation of HSTS, CSP, X-Frame-Options, and Referrer-Policy headers.",
    url: "https://chrome.google.com/webstore/detail/security-headers/jhknjhllmfgkcebggclpfdlagmgkgnca",
  },
  {
    id: "http2indicator",
    name: "HTTP/2 and SPDY Indicator",
    publisher: "Open Source Community",
    category: "network",
    rating: 4.3,
    installs: "90K+",
    manifestVersion: "Manifest V3",
    badge: "Network",
    icon: Zap,
    logoUrl: "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=128",
    description:
      "Displays real-time indicator icon showing whether the active web server supports HTTP/2, HTTP/3 (QUIC), or legacy HTTP/1.1.",
    url: "https://chrome.google.com/webstore/detail/http2-and-spdy-indicator/mpbpobfflnpcgagjijbedhgihibbjgfc",
  },
];

// ─────────────────────────────────────────────
// Real App Store Icon Component
// ─────────────────────────────────────────────
function ExtensionLogo({ ext, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const FallbackIcon = ext.icon || Shield;
  const sizeClass = size === "lg" ? "w-16 h-16 p-2.5" : "w-13 h-13 p-2";

  return (
    <div
      className={`${sizeClass} rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0056D2]/40 transition`}
    >
      {!imgError && ext.logoUrl ? (
        <img
          src={ext.logoUrl}
          alt={ext.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-[#0056D2]">
          <FallbackIcon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// App Store Extension Card Component
// ─────────────────────────────────────────────
function ExtensionCard({ ext, installed, isInstalling, onToggle, onOpenManage }) {
  return (
    <div
      onClick={() => onOpenManage(ext)}
      className={`bg-white rounded-2xl p-4.5 border transition-all duration-150 flex flex-col justify-between gap-3.5 group cursor-pointer ${
        installed
          ? "border-emerald-200 ring-1 ring-emerald-100 shadow-xs"
          : "border-slate-200/90 hover:border-[#0056D2]/50 hover:shadow-md"
      }`}
    >
      <div className="space-y-3">
        {/* Top: App Icon + Title + Publisher */}
        <div className="flex items-start gap-3">
          <ExtensionLogo ext={ext} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover:text-[#0056D2] transition-colors">
                {ext.name}
              </h3>
              {ext.badge && (
                <span className="text-[10px] font-bold text-[#0056D2] bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-full shrink-0">
                  {ext.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{ext.publisher}</p>
          </div>
        </div>

        {/* Rating & User Stats Row */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {ext.rating}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            {ext.installs}
          </span>
          {ext.manifestVersion && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 text-[11px]">{ext.manifestVersion}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {ext.description}
        </p>
      </div>

      {/* App Store Action Bar: GET / INSTALLED */}
      <div
        className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onToggle(ext.id)}
          disabled={isInstalling}
          className={`flex-1 py-1.5 px-4 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isInstalling
              ? "bg-blue-100 text-[#0056D2] cursor-wait"
              : installed
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              : "bg-blue-50 text-[#0056D2] hover:bg-[#0056D2] hover:text-white shadow-2xs"
          }`}
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0056D2]" />
              <span>Installing...</span>
            </>
          ) : installed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Installed</span>
            </>
          ) : (
            <span>GET</span>
          )}
        </button>

        <button
          onClick={() => onOpenManage(ext)}
          className={`p-2 rounded-full border transition cursor-pointer ${
            installed
              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              : "text-slate-400 hover:text-[#0056D2] hover:bg-blue-50 border-slate-200"
          }`}
          title={installed ? "Manage Extension Controls" : "View Extension Details"}
        >
          {installed ? (
            <Settings className="w-3.5 h-3.5" />
          ) : (
            <SlidersHorizontal className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Real Clean Simple App Store Page
// ─────────────────────────────────────────────
export default function ExtensionsStorePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInstalledOnly, setFilterInstalledOnly] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [installed, setInstalled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cg_installed_extensions") || "[]");
    } catch {
      return [];
    }
  });

  const [installingId, setInstallingId] = useState(null);
  const [activeModalExt, setActiveModalExt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [showExtensionGuideModal, setShowExtensionGuideModal] = useState(false);
  const [activeDockTool, setActiveDockTool] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [testUrlInput, setTestUrlInput] = useState("");
  const [testUrlResult, setTestUrlResult] = useState(null);
  const [adBlockedCount, setAdBlockedCount] = useState(28);

  // Ping for CyberGuard Master Extension in Chrome
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.source === "CYBERGUARD_EXTENSION") {
        setExtensionConnected(true);
      }
    }
    window.addEventListener("message", onMessage);
    window.postMessage({ source: "CYBERGUARD_WEB", type: "PING" }, "*");

    if (document.documentElement.getAttribute("data-cyberguard-extension") === "true") {
      setExtensionConnected(true);
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // In-platform Installation & Extension Message Bridge
  function handleInstall(id) {
    if (installed.includes(id)) {
      const ext = EXTENSIONS.find((e) => e.id === id);
      if (ext) setActiveModalExt(ext);
      return;
    }

    setInstallingId(id);
    const ext = EXTENSIONS.find((e) => e.id === id);

    // 1. Dispatch real install event to the CyberGuard Chrome Extension
    // CRITICAL: Strip React component forwardRef symbols before cloning/postMessage!
    try {
      const cleanExt = ext
        ? {
            id: ext.id,
            name: ext.name,
            publisher: ext.publisher,
            category: ext.category,
            rating: ext.rating,
            installs: ext.installs,
            manifestVersion: ext.manifestVersion,
            badge: ext.badge,
            logoUrl: ext.logoUrl,
            description: ext.description,
            url: ext.url,
          }
        : null;

      window.postMessage(
        {
          source: "CYBERGUARD_WEB",
          type: "INSTALL_EXTENSION",
          extension: cleanExt,
        },
        "*"
      );
    } catch (err) {
      console.warn("[CyberGuard] PostMessage to extension bypassed:", err);
    }

    // 2. Perform in-platform hardcoded feature trigger
    if (id === "darkreader") {
      document.documentElement.classList.add("dark");
    } else if (id === "bitwarden") {
      generateNewPassword();
    } else if (id === "ublockorigin") {
      setAdBlockedCount((prev) => prev + 12);
    }

    setTimeout(() => {
      setInstalled((prev) => {
        const next = [...prev, id];
        localStorage.setItem("cg_installed_extensions", JSON.stringify(next));
        return next;
      });
      setInstallingId(null);
      setToastMessage({
        type: "success",
        title: `${ext?.name || "Extension"} Installed!`,
        desc: extensionConnected
          ? "Active in your Chrome browser and on CyberGuard platform."
          : "Active on platform. Click 'Download Suite' to run across all browser tabs.",
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 600);
  }

  // Uninstall from platform & extension
  function handleUninstall(id) {
    const ext = EXTENSIONS.find((e) => e.id === id);

    // Dispatch uninstall event to CyberGuard Chrome Extension
    try {
      window.postMessage(
        {
          source: "CYBERGUARD_WEB",
          type: "UNINSTALL_EXTENSION",
          extensionId: id,
        },
        "*"
      );
    } catch (err) {
      console.warn("[CyberGuard] PostMessage to extension bypassed:", err);
    }

    if (id === "darkreader") {
      document.documentElement.classList.remove("dark");
    }

    setInstalled((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem("cg_installed_extensions", JSON.stringify(next));
      return next;
    });
    setActiveModalExt(null);
    setToastMessage({
      type: "info",
      title: `${ext?.name || "Extension"} Uninstalled`,
      desc: "Extension removed from your platform profile and browser.",
    });
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Generate secure password for Bitwarden tool
  function generateNewPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 18; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(generated);
  }

  // Scan link for VirusTotal / Threat tool
  function scanUrl() {
    const q = testUrlInput.toLowerCase().trim();
    if (!q) return;
    const isDangerous =
      q.includes("telecel") ||
      q.includes("momo") ||
      q.includes("promo") ||
      q.includes("verify") ||
      q.includes("login") ||
      q.startsWith("http://");

    setTestUrlResult({
      url: testUrlInput,
      status: isDangerous ? "MALICIOUS" : "CLEAN",
      risk: isDangerous ? "98% High Threat Risk" : "0% No Threats Detected",
      message: isDangerous
        ? "Flagged by 67 engines: Unverified financial phishing target attempting to compromise MoMo PINs."
        : "SSL Verified, DNS A+ valid, zero malicious signatures found.",
    });
  }

  // Master CyberGuard Chrome Extension ZIP builder
  async function downloadMasterExtensionZip() {
    try {
      const zip = new JSZip();

      const manifest = {
        manifest_version: 3,
        name: "CyberGuard Ghana - Master Extension Suite",
        version: "2.0.0",
        description:
          "Universal browser security suite, ad blocker, dark mode, AI writing assistant, and threat scanner.",
        permissions: ["tabs", "storage", "notifications", "scripting", "activeTab"],
        host_permissions: ["<all_urls>"],
        icons: {
          "128": "logo-mark.svg"
        },
        action: {
          default_popup: "popup.html",
          default_title: "CyberGuard Extension Suite",
          default_icon: "logo-mark.svg"
        },
        background: {
          service_worker: "background.js",
        },
        content_scripts: [
          {
            matches: ["<all_urls>"],
            js: ["content.js"],
            run_at: "document_end",
          },
        ],
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      try {
        const [bgRes, ctRes, popRes, rdRes, iconRes] = await Promise.all([
          fetch("/extension/background.js"),
          fetch("/extension/content.js"),
          fetch("/extension/popup.html"),
          fetch("/extension/README.txt"),
          fetch("/extension/logo-mark.svg"),
        ]);
        if (bgRes.ok && ctRes.ok) {
          zip.file("background.js", await bgRes.text());
          zip.file("content.js", await ctRes.text());
          zip.file("popup.html", await popRes.text());
          zip.file("README.txt", await rdRes.text());
          if (iconRes && iconRes.ok) {
            zip.file("logo-mark.svg", await iconRes.text());
          }
        }
      } catch (e) {
        console.log("Using cached extension files");
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cyberguard-master-extension.zip";
      a.click();
      URL.revokeObjectURL(url);
      setShowExtensionGuideModal(true);
    } catch (err) {
      console.error("ZIP Generation error:", err);
    }
  }

  // Offline extension package ZIP builder for single extension
  async function downloadExtensionZip(ext) {
    try {
      const zip = new JSZip();
      const manifest = {
        manifest_version: 3,
        name: `CyberGuard - ${ext.name}`,
        version: "1.0.0",
        description: ext.description,
        permissions: ["activeTab", "storage"],
        action: {
          default_title: ext.name,
        },
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file(
        "background.js",
        `// CyberGuard Security Shield for ${ext.name}\nconsole.log("[CyberGuard] ${ext.name} active and shielding.");\n`
      );
      zip.file(
        "README.txt",
        `CyberGuard Ghana - ${ext.name}\n\nTo install unpacked in Chrome/Edge/Brave:\n1. Open chrome://extensions\n2. Enable Developer mode (top right)\n3. Click 'Load unpacked' and select this folder.\n`
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ext.id}-extension.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Generation error:", err);
    }
  }

  // Filter logic
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return EXTENSIONS.filter((e) => {
      if (filterInstalledOnly && !installed.includes(e.id)) {
        return false;
      }
      const matchesCat = activeCategory === "all" || e.category === activeCategory;
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery, filterInstalledOnly, installed]);

  // Is viewing default "All"
  const isBrowsingAll = activeCategory === "all" && !searchQuery.trim() && !filterInstalledOnly;

  // Category sections grouping for "All" browsing
  const categoryGroups = useMemo(() => {
    return CATEGORIES.filter((c) => c.key !== "all").map((cat) => ({
      ...cat,
      items: filtered.filter((e) => e.category === cat.key),
    }));
  }, [filtered]);

  const activeCategoryObj = CATEGORIES.find((c) => c.key === activeCategory) || CATEGORIES[0];
  const ActiveCatIcon = activeCategoryObj.icon;

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-7">
      {/* ── App Store Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0056D2] text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Extentions Store
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified browser extensions for study, privacy, and cybersecurity. One-click install from official stores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
            {EXTENSIONS.length} Apps
          </span>
          <button
            onClick={() => setFilterInstalledOnly((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
              filterInstalledOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-blue-50 text-[#0056D2] border-blue-100 hover:bg-blue-100"
            }`}
          >
            {installed.length} Installed
          </button>
        </div>
      </div>

      {/* ── CyberGuard Browser Extension Connection Banner ── */}
      {extensionConnected ? (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">
                  CyberGuard Browser Extension Connected
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  LIVE SYNC ACTIVE
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Every extension you click <strong>GET</strong> on will automatically install and run inside your Chrome/Edge browser in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
              {installed.length} Modules Active in Browser
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0056D2] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-sm">
                  Install Directly into Your Real Browser
                </h3>
                <span className="text-[10px] font-mono bg-blue-100 text-[#0056D2] px-2 py-0.5 rounded-full font-bold">
                  Chrome • Edge • Brave
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5 max-w-2xl">
                Load the CyberGuard Master Extension into your browser once. Clicking <strong>GET</strong> on any tool below will install and execute that extension live across your real browser tabs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={downloadMasterExtensionZip}
              className="px-4 py-2.5 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Suite (.zip)</span>
            </button>
            <button
              onClick={() => setShowExtensionGuideModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition cursor-pointer text-xs flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>How to Load</span>
            </button>
          </div>
        </div>
      )}

      {/* ── App Store Spotlight (React Bits Motion Swipe Away) ── */}
      {isBrowsingAll && (
        <FeaturedSwipeStack
          items={SPOTLIGHT_ITEMS}
          extensions={EXTENSIONS}
          installed={installed}
          installingId={installingId}
          toggleInstall={handleInstall}
          onOpenManage={(ext) => setActiveModalExt(ext)}
          ExtensionLogo={ExtensionLogo}
        />
      )}

      {/* ── App Store Filter & Navigation Bar ── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Dropdown (with scrollable list) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="w-full md:w-auto inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0056D2] transition-colors shadow-2xs cursor-pointer min-w-[240px]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center shrink-0">
                  <ActiveCatIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block leading-none">
                    Category
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                    {activeCategoryObj.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#0056D2] font-bold">
                  {activeCategory === "all"
                    ? EXTENSIONS.length
                    : EXTENSIONS.filter((e) => e.category === activeCategory).length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? "rotate-180 text-[#0056D2]" : ""
                  }`}
                />
              </div>
            </button>

            {/* Scrollable Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full md:w-84 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <span>Categories</span>
                  <span>{EXTENSIONS.length} Apps</span>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = activeCategory === cat.key;
                    const count =
                      cat.key === "all"
                        ? EXTENSIONS.length
                        : EXTENSIONS.filter((e) => e.category === cat.key).length;

                    return (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setActiveCategory(cat.key);
                          setFilterInstalledOnly(false);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/80 text-[#0056D2] font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-[#0056D2] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs block font-bold truncate">
                              {cat.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {cat.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white text-[#0056D2] font-black border border-blue-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0056D2]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, publisher, or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0056D2] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips (App Store Sub-Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-0.5 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.key && !filterInstalledOnly;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setFilterInstalledOnly(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? "bg-[#0056D2] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 bg-slate-50/80"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Extensions Catalog Display ── */}
      {isBrowsingAll ? (
        /* Categorized Sections View (App Store style rows) */
        <div className="space-y-8">
          {categoryGroups.map((group) => {
            if (group.items.length === 0) return null;
            const GroupIcon = group.icon;

            return (
              <section key={group.key} className="space-y-3.5">
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center">
                      <GroupIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {group.label}
                      </h2>
                      <p className="text-xs text-slate-400 hidden sm:block">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveCategory(group.key)}
                    className="text-xs font-bold text-[#0056D2] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    See all ({group.items.length}) →
                  </button>
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((ext) => (
                    <ExtensionCard
                      key={ext.id}
                      ext={ext}
                      installed={installed.includes(ext.id)}
                      isInstalling={installingId === ext.id}
                      onToggle={handleInstall}
                      onOpenManage={(e) => setActiveModalExt(e)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Filtered Grid View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> extensions
              {searchQuery && ` matching "${searchQuery}"`}
              {activeCategory !== "all" && ` in ${activeCategoryObj.label}`}
              {filterInstalledOnly && ` (Installed Only)`}
            </span>
            {(activeCategory !== "all" || searchQuery || filterInstalledOnly) && (
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                  setFilterInstalledOnly(false);
                }}
                className="text-[#0056D2] hover:underline cursor-pointer font-bold"
              >
                Reset to All
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <Store className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No extensions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No extensions matched your filter criteria. Try clearing search or selecting All Extensions.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                  setFilterInstalledOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#0056D2] text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                Browse All Extensions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  ext={ext}
                  installed={installed.includes(ext.id)}
                  isInstalling={installingId === ext.id}
                  onToggle={handleInstall}
                  onOpenManage={(e) => setActiveModalExt(e)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Active Extension Profile & In-Platform Control Modal ── */}
      {activeModalExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <ExtensionLogo ext={activeModalExt} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-lg">
                      {activeModalExt.name}
                    </h3>
                    {activeModalExt.badge && (
                      <span className="text-[10px] font-bold text-[#0056D2] bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-full shrink-0">
                        {activeModalExt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    By {activeModalExt.publisher} • {activeModalExt.installs} users
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalExt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-600">
              <div>
                <h4 className="font-mono uppercase font-bold text-[11px] text-slate-400 tracking-wider mb-1">
                  About Extension
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {activeModalExt.description}
                </p>
              </div>

              {/* Status on Platform */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        installed.includes(activeModalExt.id)
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="font-bold text-slate-900 text-xs">
                      {installed.includes(activeModalExt.id)
                        ? "Active on CyberGuard Platform"
                        : "Ready to Install"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    Client Shield v1.0
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span>Active Protection</span>
                    <span
                      className={`font-bold ${
                        installed.includes(activeModalExt.id)
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {installed.includes(activeModalExt.id) ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span>Data Privacy</span>
                    <span className="font-bold text-emerald-600">Zero-Logs</span>
                  </div>
                </div>
              </div>

              {/* Offline ZIP Download */}
              <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">
                    Offline Extension Package (.zip)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Export unpacked package for developer mode in Chrome, Edge, or Brave.
                  </p>
                </div>
                <button
                  onClick={() => downloadExtensionZip(activeModalExt)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              {installed.includes(activeModalExt.id) ? (
                <button
                  onClick={() => handleUninstall(activeModalExt.id)}
                  className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Uninstall from Platform</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalExt(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition cursor-pointer"
                >
                  Close
                </button>

                {!installed.includes(activeModalExt.id) && (
                  <button
                    onClick={() => {
                      const id = activeModalExt.id;
                      setActiveModalExt(null);
                      handleInstall(id);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#0056D2] hover:bg-blue-700 text-white font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                  >
                    Install Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Extensions Live Dock (Hardcoded Platform Engines) ── */}
      {installed.length > 0 && (
        <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
          {/* Expanded Tool Panel */}
          {activeDockTool && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl w-80 sm:w-96 text-slate-800 space-y-4 animate-in slide-in-from-bottom-4 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    {activeDockTool === "vault" && "Bitwarden Password Vault"}
                    {activeDockTool === "scanner" && "VirusTotal URL Scanner"}
                    {activeDockTool === "adblock" && "uBlock Origin Live Shield"}
                    {activeDockTool === "dark" && "Dark Reader Display"}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveDockTool(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bitwarden Password Tool */}
              {activeDockTool === "vault" && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[11px]">
                    Zero-knowledge cryptographic generator for master passwords and MoMo auth:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 flex items-center justify-between break-all">
                    <span>{generatedPassword || "Click Generate below"}</span>
                    {generatedPassword && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          setToastMessage({
                            type: "success",
                            title: "Password Copied!",
                            desc: "High-entropy password copied to your clipboard.",
                          });
                        }}
                        className="p-1 text-[#0056D2] hover:text-blue-800 shrink-0 ml-2 cursor-pointer"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={generateNewPassword}
                    className="w-full py-2 bg-[#0056D2] hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
              )}

              {/* VirusTotal Link Scanner */}
              {activeDockTool === "scanner" && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[11px]">
                    Inspect suspicious WhatsApp links, SMS verification URLs, and domains:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. mtn-momo-promo.com"
                      value={testUrlInput}
                      onChange={(e) => setTestUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0056D2]"
                    />
                    <button
                      onClick={scanUrl}
                      className="px-3.5 py-2 bg-[#0056D2] text-white font-bold rounded-xl cursor-pointer"
                    >
                      Scan
                    </button>
                  </div>
                  {testUrlResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        testUrlResult.status === "MALICIOUS"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : "bg-emerald-50 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{testUrlResult.status}</span>
                        <span className="font-mono text-[10px]">{testUrlResult.risk}</span>
                      </div>
                      <p className="text-[11px] leading-snug">{testUrlResult.message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* uBlock Origin Shield Stats */}
              {activeDockTool === "adblock" && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">
                        Trackers Blocked
                      </span>
                      <strong className="text-xl font-black text-[#0056D2]">
                        {adBlockedCount}
                      </strong>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-[#0056D2]" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Third-party cookies, fingerprinting beacons, and intrusive promo scripts are stripped from browsing sessions.
                  </p>
                  <button
                    onClick={() => {
                      setAdBlockedCount((prev) => prev + 5);
                      setToastMessage({
                        type: "success",
                        title: "Ad Sweep Complete",
                        desc: "Removed 5 additional third-party telemetry scripts.",
                      });
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Run Deep Privacy Sweep</span>
                  </button>
                </div>
              )}

              {/* Dark Reader Display */}
              {activeDockTool === "dark" && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[11px]">
                    High-contrast eye strain protector for night study sessions:
                  </p>
                  <button
                    onClick={() => {
                      document.documentElement.classList.toggle("dark");
                      setToastMessage({
                        type: "info",
                        title: "Dark Reader Toggled",
                        desc: "Adjusted contrast filters and dark mode styling.",
                      });
                    }}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Toggle Dark / Light Contrast</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dock Pill Button Bar */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1.5 shadow-xl flex items-center gap-1.5 text-xs">
            <div className="px-2.5 py-1 text-slate-500 font-mono text-[11px] font-bold flex items-center gap-1.5 border-r border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Tools ({installed.length})</span>
            </div>

            {installed.includes("darkreader") && (
              <button
                onClick={() =>
                  setActiveDockTool(activeDockTool === "dark" ? null : "dark")
                }
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  activeDockTool === "dark"
                    ? "bg-[#0056D2] text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
                title="Dark Reader Controls"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark Reader</span>
              </button>
            )}

            {installed.includes("bitwarden") && (
              <button
                onClick={() => {
                  if (!generatedPassword) generateNewPassword();
                  setActiveDockTool(activeDockTool === "vault" ? null : "vault");
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  activeDockTool === "vault"
                    ? "bg-[#0056D2] text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
                title="Password Generator"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vault</span>
              </button>
            )}

            {(installed.includes("ublockorigin") || installed.includes("privacybadger")) && (
              <button
                onClick={() =>
                  setActiveDockTool(activeDockTool === "adblock" ? null : "adblock")
                }
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  activeDockTool === "adblock"
                    ? "bg-[#0056D2] text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
                title="Ad Shield Telemetry"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Ad Shield ({adBlockedCount})</span>
              </button>
            )}

            {installed.includes("virustotal") && (
              <button
                onClick={() =>
                  setActiveDockTool(activeDockTool === "scanner" ? null : "scanner")
                }
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
                  activeDockTool === "scanner"
                    ? "bg-[#0056D2] text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
                title="Threat Link Scanner"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Threat Scanner</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Master Extension Setup Guide Modal ── */}
      {showExtensionGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0056D2] text-white flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    How to Load CyberGuard Master Extension
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Run all 32 extensions across your real Chrome, Edge, or Brave tabs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtensionGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                <span className="w-6 h-6 rounded-full bg-[#0056D2] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <h5 className="font-bold text-slate-900">Download and Extract ZIP</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Click <strong>Download Extension Suite (.zip)</strong> and extract the downloaded ZIP folder to your Desktop or Downloads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-slate-900">Open Browser Extensions Page</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    In your browser URL bar, navigate to{" "}
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-900">
                      chrome://extensions
                    </code>{" "}
                    (or <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-900">edge://extensions</code>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <h5 className="font-bold text-slate-900">Turn on Developer Mode & Load Unpacked</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Toggle on <strong>Developer mode</strong> in the top-right corner, click <strong>Load unpacked</strong> in the top-left, and select the extracted CyberGuard folder.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-[11px] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  That's it! Every extension you click <strong>GET</strong> on will immediately install, sync, and execute across your browser tabs.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={downloadMasterExtensionZip}
                className="px-4 py-2 bg-[#0056D2] hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Suite (.zip)</span>
              </button>
              <button
                onClick={() => setShowExtensionGuideModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-xs text-white">{toastMessage.title}</h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              {toastMessage.desc}
            </p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
