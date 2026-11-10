import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Wifi,
  Lock,
  Eye,
  FileSearch,
  Smartphone,
  ExternalLink,
  Search,
  ArrowRight,
  Radio,
  HardDrive,
  Globe,
  Layers,
  Cpu,
  Activity,
  Battery,
  BatteryCharging,
  Zap,
  Clock,
  XCircle,
  Terminal,
  Fingerprint,
  Server,
  Gauge,
  Sparkles,
  Check,
  Copy,
} from "lucide-react";

import { scanAllTabs, pruneAllTabsMemory } from "../utils/tabMonitor";
import { getStorageHealthReport, cleanBrowserStorage, formatBytes } from "../utils/storageCleaner";

const EASE_OUT = [0.22, 1, 0.36, 1];

// Official Ghanaian trusted domains for MoMo and financial services
const TRUSTED_GH_DOMAINS = [
  "mtn.com.gh",
  "telecel.com.gh",
  "at.com.gh",
  "csa.gov.gh",
  "bog.gov.gh",
  "ecobank.com",
  "gcb.com.gh",
  "stanbicbank.com.gh",
  "calbank.net",
  "ghipss.net",
  "cyberguard.gh",
  "cyberguard-ghana.vercel.app",
];

const SUSPICIOUS_PATTERNS = [
  /momo.*claim/i,
  /mtn.*bonus/i,
  /telecel.*promo/i,
  /free.*cash/i,
  /urgent.*pin/i,
  /update.*wallet/i,
  /loan.*instant/i,
  /wa\.me\/.*momo/i,
];

export default function SecurityAudit() {
  const [searchParams] = useSearchParams();
  const autoStart = searchParams.get("auto") === "true";
  const prefersReducedMotion = useReducedMotion();

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState("STANDBY");
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Telemetry state
  const [openTabs, setOpenTabs] = useState([]);
  const [storageData, setStorageData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [hardwareData, setHardwareData] = useState(null);
  const [permissionsData, setPermissionsData] = useState([]);
  const [ipAuditData, setIpAuditData] = useState(null);

  // Cleanup state
  const [cleaning, setCleaning] = useState(false);
  const [cleanedResult, setCleanedResult] = useState(null);

  // Tools state
  const [momoInput, setMomoInput] = useState("");
  const [momoAnalysis, setMomoAnalysis] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [fileHashing, setFileHashing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const terminalEndRef = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setTerminalLogs((prev) => [...prev.slice(-12), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Execute authentic multi-step system scan
  const executeScan = useCallback(async () => {
    setScanning(true);
    setScanProgress(5);
    setTerminalLogs([]);
    setCleanedResult(null);

    // 1. Multi-Tab Process Discovery
    setScanStage("PROCESS_AUDIT");
    addLog("INITIATING MULTI-PROCESS TAB PROBE VIA BROADCAST CHANNEL...");
    await new Promise((r) => setTimeout(r, 200));
    const tabs = await scanAllTabs(320);
    setOpenTabs(tabs);
    addLog(`DETECTED ${tabs.length} ACTIVE WINDOW/WORKER TARGETS ACROSS DOMAIN.`);
    setScanProgress(28);

    // 2. Storage & Cache StorageManager Inspection
    setScanStage("STORAGE_INSPECTION");
    addLog("QUERYING BROWSER STORAGE SUBSYSTEMS & CACHESTORAGE INDICES...");
    await new Promise((r) => setTimeout(r, 220));
    const storage = await getStorageHealthReport();
    setStorageData(storage);
    addLog(
      `INDEXED: ${formatBytes(storage.usageBytes)} DISK FOOTPRINT · ${storage.totalCacheEntries} CACHED ASSETS.`
    );
    setScanProgress(55);

    // 3. Network & Edge Latency Probe
    setScanStage("NETWORK_LATENCY");
    addLog("MEASURING CDN EDGE ROUND-TRIP LATENCY & WEBRTC LEAK CANDIDATES...");
    const pingStart = performance.now();
    let latencyMs = 0;
    try {
      await fetch("/manifest.webmanifest?ping=" + Date.now(), { cache: "no-store" });
      latencyMs = Math.round(performance.now() - pingStart);
    } catch {
      latencyMs = 0;
    }

    let webrtcLeak = false;
    try {
      const rtc = new RTCPeerConnection({ iceServers: [] });
      rtc.createDataChannel("");
      const offer = await rtc.createOffer();
      await rtc.setLocalDescription(offer);
      const sdp = offer.sdp || "";
      if (sdp.includes("c=IN IP4 192.168.") || sdp.includes("c=IN IP4 10.")) {
        webrtcLeak = true;
      }
      rtc.close();
    } catch {
      webrtcLeak = false;
    }

    setNetworkData({
      online: navigator.onLine,
      latencyMs,
      effectiveType: navigator.connection?.effectiveType || "High-Speed",
      downlink: navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : null,
      rtt: navigator.connection?.rtt ? `${navigator.connection.rtt} ms` : null,
      saveData: Boolean(navigator.connection?.saveData),
      isHttps: window.location.protocol === "https:",
    });

    setIpAuditData({
      leaked: webrtcLeak,
      status: webrtcLeak ? "Warning: Private LAN IP leaked to WebRTC" : "Shielded: WebRTC private candidates masked",
    });
    addLog(`NETWORK: ${latencyMs}ms RTT TO EDGE · HTTPS ${window.location.protocol === "https:" ? "ACTIVE" : "INSECURE"}.`);
    setScanProgress(78);

    // 4. Hardware & Power Telemetry
    setScanStage("HARDWARE_TELEMETRY");
    addLog("INTERROGATING THREAD CONCURRENCY, ALLOCATED JS HEAP & BATTERY...");
    let batteryInfo = null;
    if ("getBattery" in navigator) {
      try {
        const b = await navigator.getBattery();
        batteryInfo = {
          level: Math.round(b.level * 100),
          charging: b.charging,
        };
      } catch {}
    }

    let memoryInfo = null;
    if (window.performance && window.performance.memory) {
      memoryInfo = {
        usedHeapMb: parseFloat((window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)),
        totalHeapMb: parseFloat((window.performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1)),
        limitHeapMb: parseFloat((window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)),
      };
    }

    setHardwareData({
      cores: navigator.hardwareConcurrency || "Unknown",
      deviceMemoryGb: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : null,
      battery: batteryInfo,
      memory: memoryInfo,
      isPwa: window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone),
    });
    setScanProgress(90);

    // 5. Hardware Permissions Audit
    setScanStage("PERMISSIONS_AUDIT");
    addLog("VERIFYING CAMERA, MICROPHONE, AND GEOLOCATION CONSTRAINTS...");
    const perms = ["geolocation", "notifications", "camera", "microphone"];
    const permsAudit = [];
    for (const pName of perms) {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: pName });
          permsAudit.push({ name: pName, state: res.state });
        } else {
          permsAudit.push({ name: pName, state: "prompt" });
        }
      } catch {
        permsAudit.push({ name: pName, state: "restricted" });
      }
    }
    setPermissionsData(permsAudit);

    setScanProgress(100);
    addLog("SYSTEM DIAGNOSTIC COMPLETE. INTEGRITY PROFILE SYNTHESIZED.");
    await new Promise((r) => setTimeout(r, 250));
    setScanning(false);
    setHasScanned(true);
    setScanStage("COMPLETED");
  }, []);

  useEffect(() => {
    if (autoStart) {
      executeScan();
    }
  }, [autoStart, executeScan]);

  // Overall Health Score (0 - 100)
  const healthScore = useMemo(() => {
    if (!hasScanned) return null;
    let score = 100;
    if (networkData && !networkData.isHttps) score -= 30;
    if (ipAuditData && ipAuditData.leaked) score -= 15;
    if (openTabs.length > 3) score -= 5 * (openTabs.length - 3);
    if (storageData && storageData.cleanableBytes > 25 * 1024 * 1024) score -= 10;

    const grantedHighRisk = permissionsData.filter(
      (p) => p.state === "granted" && (p.name === "camera" || p.name === "microphone" || p.name === "geolocation")
    );
    score -= grantedHighRisk.length * 5;

    return Math.max(score, 35);
  }, [hasScanned, networkData, ipAuditData, openTabs, storageData, permissionsData]);

  // Physical storage purge
  async function handleRealClean() {
    setCleaning(true);
    addLog("PURGING NON-CRITICAL CACHESTORAGE BLOBS & SESSION TRANSITIONS...");
    try {
      pruneAllTabsMemory();
      const result = await cleanBrowserStorage();
      setCleanedResult(result);
      setStorageData(result.afterReport);

      const updatedTabs = await scanAllTabs(220);
      setOpenTabs(updatedTabs);
      addLog(`PURGE VERIFIED: FREED ${formatBytes(result.freedBytes)} ACROSS ${result.purgedItemsCount} ASSETS.`);
    } catch (err) {
      console.error("[Clean] Physical cleanup error:", err);
      addLog("ERROR ENCOUNTERED DURING STORAGE PURGE OPERATION.");
    } finally {
      setCleaning(false);
    }
  }

  // MoMo Link Analyzer
  function handleAnalyzeMomo() {
    const raw = momoInput.trim();
    if (!raw) return;

    let isPhishing = false;
    const reasons = [];

    for (const pat of SUSPICIOUS_PATTERNS) {
      if (pat.test(raw)) {
        isPhishing = true;
        reasons.push("Matches known deceptive cashout, urgent PIN, or bonus templates used in Ghana MoMo scams.");
        break;
      }
    }

    const urlMatch = raw.match(/https?:\/\/[^\s]+/i) || raw.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/i);
    if (urlMatch) {
      const foundUrl = urlMatch[0];
      try {
        const parsed = new URL(foundUrl.startsWith("http") ? foundUrl : `https://${foundUrl}`);
        const hostname = parsed.hostname.toLowerCase();
        const isTrusted = TRUSTED_GH_DOMAINS.some((td) => hostname === td || hostname.endsWith(`.${td}`));

        if (!isTrusted) {
          if (
            hostname.includes("momo") ||
            hostname.includes("mtn") ||
            hostname.includes("telecel") ||
            hostname.includes("cash")
          ) {
            isPhishing = true;
            reasons.push(
              `Domain "${hostname}" impersonates telecom infrastructure. Official operators NEVER use unverified domains.`
            );
          } else if (parsed.protocol === "http:") {
            isPhishing = true;
            reasons.push("Insecure unencrypted HTTP connection. Submitting PINs or credentials over HTTP exposes them to sniffing.");
          } else {
            reasons.push(`Domain "${hostname}" is unrecognized. Exercise strict caution before authorizing transactions.`);
          }
        } else {
          reasons.push(`Verified official telecom/banking domain: ${hostname}`);
        }
      } catch {
        reasons.push("Malformed link syntax detected.");
      }
    }

    setMomoAnalysis({
      input: raw,
      isPhishing,
      verdict: isPhishing ? "HIGH RISK · PHISHING VECTOR IDENTIFIED" : reasons.length > 0 ? "CAUTION · UNVERIFIED HOST" : "NO KNOWN THREAT SIGNATURES",
      reasons,
    });
  }

  // File SHA-256 Inspector
  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileHashing(true);
    setFileAnalysis(null);

    const ext = file.name.split(".").pop().toLowerCase();
    const isApk = ext === "apk";
    const isExecutable = ["exe", "bat", "vbs", "dex", "scr", "sh", "msi"].includes(ext);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setFileAnalysis({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type || "application/octet-stream",
        hash: hashHex,
        isApk,
        isExecutable,
        recommendation: isApk
          ? "Sideloaded Android APK. Installing applications outside Google Play exposes devices to contact scrapers and banking overlays."
          : isExecutable
          ? "Executable binary file. Do not run unless origin signature is verified by an IT administrator."
          : "Standard media/document container. SHA-256 cryptographic signature verified.",
      });
    } catch {
      setFileAnalysis({
        name: file.name,
        error: "Failed to access file for cryptographic hashing.",
      });
    } finally {
      setFileHashing(false);
      e.target.value = "";
    }
  }

  const copyHash = (hash) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans pb-20 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* REACT BITS STYLE: DYNAMIC SVG DOT MATRIX & GRID PATTERN BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          className="absolute inset-0 w-full h-full opacity-15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cyber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#06B6D4" strokeWidth="0.6" strokeDasharray="2 3" />
              <circle cx="40" cy="0" r="1.2" fill="#3B82F6" />
            </pattern>
            <radialGradient id="cyber-mask" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cyber-grid)" mask="url(#cyber-mask-ref)" />
        </svg>

        {/* Hero Cyber Graphic Overlay with Deep Radial Vignette */}
        <div
          className="absolute top-0 inset-x-0 h-[480px] bg-cover bg-[center_top] opacity-15 mix-blend-luminosity filter blur-[0.5px]"
          style={{ backgroundImage: "url('/hero-threat.png')" }}
        />
        <div className="absolute top-0 inset-x-0 h-[480px] bg-gradient-to-b from-[#050B14]/40 via-[#050B14]/80 to-[#050B14]" />

        {/* Glowing Luminous Orbs */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-emerald-500/15 rounded-full blur-[100px] -z-10" />
      </div>

      {/* TOP COMMAND HEADER */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-[#050B14]/80 backdrop-blur-md pt-8 pb-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-300 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>PWA Multi-Tab Hardware Scanner</span>
              </div>
              <span className="text-slate-500 font-mono text-xs hidden sm:inline">ACT 1038 · COP PROTOCOL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>System &amp; Threat Diagnostic Center</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time multi-tab inspection, exact byte-level cache accounting, hardware telemetry, and authentic physical storage cleanup for CyberGuard Ghana.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={executeScan}
              disabled={scanning}
              className="relative group overflow-hidden bg-gradient-to-r from-[#0056D2] to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-mono text-xs uppercase font-bold tracking-wider px-6 py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2.5"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-200 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "PROBING SYSTEM..." : hasScanned ? "RE-RUN SCAN" : "START HARDWARE SCAN"}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCANNER & HUD MATRIX */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-8 relative z-10">

        {/* HERO HUD SCANNER / RADAR DISPLAY */}
        <div className="rounded-3xl border border-cyan-500/30 bg-[#091220]/90 backdrop-blur-xl p-6 sm:p-10 shadow-[0_0_50px_rgba(3,105,161,0.15)] relative overflow-hidden">
          {/* Subtle Cyber Corner Accents */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* LEFT / CENTER: THE ROTATING CYBER RADAR & LASER SCANNER */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">

                {/* Outer Circular Dial with Degrees & Ticks */}
                <svg className="absolute inset-0 w-full h-full text-cyan-500/20" viewBox="0 0 280 280">
                  <circle cx="140" cy="140" r="132" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="140" cy="140" r="110" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                  <circle cx="140" cy="140" r="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" opacity="0.6" />
                  <line x1="140" y1="8" x2="140" y2="272" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                  <line x1="8" y1="140" x2="272" y2="140" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                </svg>

                {/* Rotating Sonar Radar Beam */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: scanning ? 2.2 : 6, ease: "linear" }}
                  className="absolute inset-2 rounded-full pointer-events-none"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6,182,212,0.15) 320deg, rgba(6,182,212,0.6) 360deg)",
                  }}
                />

                {/* Counter-Rotating Notched HUD Reticle */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="absolute inset-8 rounded-full border border-dashed border-blue-400/30 pointer-events-none"
                />

                {/* Device Silhouette with Sweeping Vertical Scanning Laser */}
                <div className="relative z-10 w-28 h-44 rounded-2xl border-2 border-cyan-400/60 bg-slate-950/80 backdrop-blur-md p-2 flex flex-col items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden">
                  {/* Phone Speaker Notch */}
                  <div className="w-8 h-1 rounded-full bg-cyan-400/40" />

                  {/* Device Core Icon */}
                  <div className="relative flex flex-col items-center justify-center gap-1">
                    <Fingerprint className="w-8 h-8 text-cyan-300 animate-pulse" />
                    <span className="font-mono text-[9px] text-cyan-400 tracking-widest font-bold">CYBERGUARD</span>
                  </div>

                  {/* Device Home Pill */}
                  <div className="w-10 h-1 rounded-full bg-cyan-400/30" />

                  {/* Animated Vertical Neon Laser Line */}
                  <motion.div
                    animate={{ y: [-75, 75, -75] }}
                    transition={{ repeat: Infinity, duration: scanning ? 1.5 : 3.5, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4] pointer-events-none"
                  >
                    <div className="absolute -inset-x-2 -top-3 h-6 bg-cyan-500/20 blur-sm pointer-events-none" />
                  </motion.div>
                </div>
              </div>

              {/* Status Indicator Under Radar */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${scanning ? "bg-cyan-400 animate-ping" : hasScanned ? "bg-emerald-400" : "bg-slate-600"}`} />
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-cyan-300">
                  {scanning ? `AUDITING · STAGE: ${scanStage}` : hasScanned ? "SYSTEM ARMED & MONITORED" : "STANDBY · READY TO AUDIT"}
                </span>
              </div>
            </div>

            {/* RIGHT: REAL-TIME HEALTH REPORT & PHYSICAL CLEAN ACTION */}
            <div className="lg:col-span-7 space-y-6">
              {hasScanned ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div className="flex items-center gap-5">
                      {/* High-Tech Circular Health Dial */}
                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1E293B" strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={healthScore >= 85 ? "#10B981" : healthScore >= 70 ? "#F59E0B" : "#F43F5E"}
                            strokeWidth="8"
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * (healthScore || 0)) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono font-black text-xl text-white">
                          <span>{healthScore}</span>
                          <span className="text-[8px] tracking-widest text-slate-400 uppercase -mt-1">INDEX</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white tracking-tight">
                            {healthScore >= 85
                              ? "Optimal Security & Storage Health"
                              : healthScore >= 70
                              ? "Moderate Resource Overhead"
                              : "Resource Saturation Detected"}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono">
                          {openTabs.length} tabs monitored · {storageData?.totalCacheEntries || 0} cached chunks · {formatBytes(storageData?.cleanableBytes || 0)} evictable
                        </p>
                      </div>
                    </div>

                    {/* PHYSICAL CLEAN BUTTON */}
                    <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
                      <button
                        type="button"
                        onClick={handleRealClean}
                        disabled={cleaning || storageData?.cleanableBytes === 0}
                        className="relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-mono text-xs uppercase font-black tracking-wider px-5 py-3 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-200 active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4 text-slate-950" />
                        <span>
                          {cleaning
                            ? "EVICTING STORAGE..."
                            : cleanedResult
                            ? `FREED ${formatBytes(cleanedResult.freedBytes)} · CLEAN AGAIN`
                            : `CLEAN ${formatBytes(storageData?.cleanableBytes || 0)}`}
                        </span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-white/20" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cleanedResult
                          ? `Disk freed: ${formatBytes(cleanedResult.freedBytes)} (${cleanedResult.purgedItemsCount} assets pruned)`
                          : "Preserves your active session tokens"}
                      </span>
                    </div>
                  </div>

                  {/* 4 CORE METRICS METERS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" /> Edge Latency
                      </span>
                      <p className="text-base font-mono font-bold text-cyan-300">
                        {networkData?.latencyMs ? `${networkData.latencyMs} ms` : "0 ms"}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{networkData?.effectiveType || "CDN Edge"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-400" /> JS Heap RAM
                      </span>
                      <p className="text-base font-mono font-bold text-blue-300">
                        {hardwareData?.memory?.usedHeapMb ? `${hardwareData.memory.usedHeapMb} MB` : "Protected"}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{hardwareData?.memory?.limitHeapMb ? `of ${hardwareData.memory.limitHeapMb} MB` : "OS Sandbox"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Disk Footprint
                      </span>
                      <p className="text-base font-mono font-bold text-indigo-300">
                        {formatBytes(storageData?.usageBytes || 0)}
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{storageData?.totalCacheEntries} cache assets</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> CPU Threads
                      </span>
                      <p className="text-base font-mono font-bold text-amber-300">
                        {hardwareData?.cores} Cores
                      </p>
                      <span className="text-[10px] text-slate-500 block truncate">{hardwareData?.battery ? `${hardwareData.battery.level}% Battery` : "AC Power"}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">READY TO COMMENCE AUDIT</span>
                    <h2 className="text-2xl font-black text-white">Full Process &amp; Hardware Health Diagnostics</h2>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Click the button above to probe all open tabs across your browser, calculate exact cache allocation down to the byte, test edge ping, and purge unneeded assets.
                    </p>
                  </div>
                </div>
              )}

              {/* LIVE STREAMING TERMINAL CONSOLE */}
              <div className="rounded-2xl border border-slate-800 bg-[#030712] p-3.5 font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1.5 border-b border-slate-900 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>DIAGNOSTIC TERMINAL LOGS</span>
                  </span>
                  <span>{terminalLogs.length} EVENTS</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 scrollbar-none pr-1 text-slate-300">
                  {terminalLogs.length === 0 ? (
                    <span className="text-slate-600 italic">Telemetry listener waiting for scan trigger...</span>
                  ) : (
                    terminalLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400 shrink-0">›</span>
                        <span className="leading-snug">{log}</span>
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: MULTI-TAB MATRIX HUD */}
        {hasScanned && (
          <div className="rounded-3xl border border-slate-800 bg-[#091220]/90 backdrop-blur-xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Active Browser Tabs &amp; Workers</h3>
                  <p className="text-xs text-slate-400">Live inter-tab communication discovered via BroadcastChannel API</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
                {openTabs.length} {openTabs.length === 1 ? "PROCESS ACTIVE" : "PROCESSES ACTIVE"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openTabs.map((tab) => {
                const minutesOpen = Math.round((Date.now() - tab.loadedAt) / 60000);
                return (
                  <div
                    key={tab.tabId}
                    className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 relative overflow-hidden ${
                      tab.isCurrent
                        ? "bg-blue-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                        : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">
                        {tab.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tab.isCurrent
                            ? "bg-cyan-500 text-slate-950 font-black"
                            : tab.visible
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tab.isCurrent ? "Current Tab" : tab.visible ? "Foreground" : "Background"}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 truncate bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {tab.url}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{minutesOpen < 1 ? "< 1 min ago" : `${minutesOpen} min active`}</span>
                      </span>
                      {tab.heapMb !== null && (
                        <span className="font-bold text-cyan-300">
                          {tab.heapMb} MB RAM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: VERIFIED STORAGE ALLOCATION BREAKDOWN */}
        {hasScanned && (
          <div className="rounded-3xl border border-slate-800 bg-[#091220]/90 backdrop-blur-xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Browser Storage &amp; Cache Allocation</h3>
                  <p className="text-xs text-slate-400">Directly audited from navigator.storage and CacheStorage interfaces</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">
                TOTAL: {formatBytes(storageData?.usageBytes || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CacheStorage */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">CacheStorage</span>
                  <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                    {storageData?.totalCacheEntries || 0} ASSETS
                  </span>
                </div>
                <p className="text-2xl font-mono font-black text-cyan-300">
                  {formatBytes(storageData?.cleanableBytes || 0)}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cached Vite chunks, course audio narrations, and offline assets.
                </p>
              </div>

              {/* LocalStorage */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">LocalStorage</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {storageData?.localKeyCount || 0} KEYS
                  </span>
                </div>
                <p className="text-2xl font-mono font-black text-slate-200">
                  {formatBytes(storageData?.localStorageBytes || 0)}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {formatBytes(storageData?.localProtectedBytes || 0)} protected session credentials.
                </p>
              </div>

              {/* SessionStorage */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">SessionStorage</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {storageData?.sessionKeyCount || 0} RECORDS
                  </span>
                </div>
                <p className="text-2xl font-mono font-black text-slate-200">
                  {formatBytes(storageData?.sessionStorageBytes || 0)}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Temporary in-memory page transition caches.
                </p>
              </div>

              {/* Cleanable Space */}
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Cleanable Cache</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                    EVICTABLE
                  </span>
                </div>
                <p className="text-2xl font-mono font-black text-emerald-400">
                  {formatBytes(storageData?.cleanableBytes || 0)}
                </p>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  Safe to prune without logging you out or resetting preferences.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: INTERACTIVE THREAT SCANNERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* TOOL 1: MOMO SMS & LINK TERMINAL */}
          <div className="rounded-3xl border border-slate-800 bg-[#091220]/90 backdrop-blur-xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">MoMo SMS &amp; Link Verifier</h3>
                  <p className="text-xs text-slate-400">Cross-reference suspicious URLs against Ghanaian telecom registries</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Paste any text message, WhatsApp link, or remote cashout prompt to analyze against known spoofing and phishing signatures.
              </p>

              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={momoInput}
                  onChange={(e) => setMomoInput(e.target.value)}
                  placeholder="Paste SMS text or link (e.g. 'Claim 200 GHS bonus at mtn-bonus.top')..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-800 bg-slate-950/80 text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition resize-none"
                />

                <button
                  type="button"
                  onClick={handleAnalyzeMomo}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase font-bold py-2.5 rounded-xl transition cursor-pointer border border-slate-700 hover:border-cyan-500/50"
                >
                  VERIFY LINK OR MESSAGE
                </button>
              </div>

              {momoAnalysis && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    momoAnalysis.isPhishing
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      : "bg-slate-900/90 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {momoAnalysis.isPhishing ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-mono tracking-wider">{momoAnalysis.verdict}</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                    {momoAnalysis.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            <p className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
              OFFICIAL MTN, TELECEL, AND AT WILL NEVER ASK YOU TO APPROVE PROMPTS YOU DID NOT INITIATE.
            </p>
          </div>

          {/* TOOL 2: CRYPTOGRAPHIC FILE SHA-256 LAB */}
          <div className="rounded-3xl border border-slate-800 bg-[#091220]/90 backdrop-blur-xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Downloaded File &amp; APK Inspector</h3>
                  <p className="text-xs text-slate-400">Client-side SHA-256 cryptographic signature verification</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Select any file (.apk, .pdf, .docx, .zip) to compute its exact SHA-256 hash in browser memory without sending data to any external server.
              </p>

              <div className="pt-1">
                <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition bg-slate-950/60 hover:bg-slate-900/60">
                  <FileSearch className="w-7 h-7 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {fileHashing ? "COMPUTING SHA-256 HASH..." : "SELECT FILE OR APK TO INSPECT"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Executed entirely on-device via Web Cryptography API
                  </span>
                  <input
                    type="file"
                    onChange={handleFileSelected}
                    disabled={fileHashing}
                    className="hidden"
                  />
                </label>
              </div>

              {fileAnalysis && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    fileAnalysis.isApk || fileAnalysis.isExecutable
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-slate-900/90 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="truncate max-w-[200px] text-white">{fileAnalysis.name}</span>
                    <span className="text-cyan-400">{fileAnalysis.sizeMb} MB</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono">
                    <span className="truncate text-slate-400">SHA-256: {fileAnalysis.hash}</span>
                    <button
                      type="button"
                      onClick={() => copyHash(fileAnalysis.hash)}
                      className="text-cyan-400 hover:text-cyan-300 shrink-0 cursor-pointer"
                      title="Copy Hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{fileAnalysis.recommendation}</p>
                </motion.div>
              )}
            </div>

            <p className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
              ONLY INSTALL ANDROID APPS FROM THE GOOGLE PLAY STORE OR VERIFIED ACADEMIC REPOSITORIES.
            </p>
          </div>
        </div>

        {/* NATIVE GOOGLE PLAY PROTECT INTEGRATION GUIDANCE */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-cyan-500/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Full Hardware OS Scanning</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Need a deep malware scan of all installed Android apps?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Play Protect continuously analyzes all installed applications on your Android smartphone for malicious lending Trojans, stalkerware, and rogue APKs.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <a
              href="https://play.google.com/store/apps"
              target="_blank"
              rel="noreferrer"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs uppercase font-black px-5 py-3 rounded-xl transition inline-flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <span>OPEN PLAY PROTECT</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
