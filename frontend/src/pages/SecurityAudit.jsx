import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  HardDrive,
  Trash2,
  RefreshCw,
  Layers,
  Wifi,
  Lock,
  CheckCircle2,
  Check,
  Globe,
  FileSearch,
  ExternalLink,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { scanAllTabs, pruneAllTabsMemory } from "../utils/tabMonitor";
import { getStorageHealthReport, cleanBrowserStorage, formatBytes } from "../utils/storageCleaner";

// Official Ghanaian trusted domains for verification
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
  const autoClean = searchParams.get("auto") === "true";

  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(null);

  const [openTabs, setOpenTabs] = useState([]);
  const [storageData, setStorageData] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  // Simple Tools
  const [momoInput, setMomoInput] = useState("");
  const [momoResult, setMomoResult] = useState(null);

  const [fileResult, setFileResult] = useState(null);
  const [fileHashing, setFileHashing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fetch real, live metrics
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Discover all open tabs of this origin
      const tabs = await scanAllTabs(250);
      setOpenTabs(tabs);

      // 2. Read real storage from browser StorageManager
      const storage = await getStorageHealthReport();
      setStorageData(storage);

      // 3. Simple latency ping to server
      const t0 = performance.now();
      try {
        await fetch("/manifest.webmanifest?ping=" + Date.now(), { cache: "no-store" });
        setLatencyMs(Math.round(performance.now() - t0));
      } catch {
        setLatencyMs(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().then(() => {
      if (autoClean) {
        handleClean();
      }
    });
  }, [autoClean, loadData]);

  // Actual physical cache cleanup
  async function handleClean() {
    setCleaning(true);
    setCleanSuccess(null);
    try {
      pruneAllTabsMemory();
      const result = await cleanBrowserStorage();
      setStorageData(result.afterReport);
      setCleanSuccess(result.freedBytes);

      // Refresh tab list
      const updatedTabs = await scanAllTabs(200);
      setOpenTabs(updatedTabs);
    } catch (err) {
      console.error("Cleanup failed:", err);
    } finally {
      setCleaning(false);
    }
  }

  // MoMo Link Check
  function handleCheckMomo() {
    const raw = momoInput.trim();
    if (!raw) return;

    let isPhishing = false;
    let message = "No obvious phishing keywords detected.";

    for (const pat of SUSPICIOUS_PATTERNS) {
      if (pat.test(raw)) {
        isPhishing = true;
        message = "High risk: Message uses deceptive urgency or bonus claims common in MoMo scams.";
        break;
      }
    }

    const urlMatch = raw.match(/https?:\/\/[^\s]+/i) || raw.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/i);
    if (urlMatch) {
      try {
        const parsed = new URL(urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`);
        const hostname = parsed.hostname.toLowerCase();
        const isTrusted = TRUSTED_GH_DOMAINS.some((td) => hostname === td || hostname.endsWith(`.${td}`));

        if (!isTrusted) {
          if (hostname.includes("momo") || hostname.includes("mtn") || hostname.includes("telecel") || hostname.includes("cash")) {
            isPhishing = true;
            message = `Warning: "${hostname}" impersonates a telecom or payment brand. Official operators only use verified domains.`;
          } else {
            message = `Unverified domain "${hostname}". Do not enter your MoMo PIN on third-party websites.`;
          }
        } else {
          message = `Official verified domain: ${hostname}`;
        }
      } catch {
        // Ignored
      }
    }

    setMomoResult({ isPhishing, message });
  }

  // File SHA-256 Hash Check
  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileHashing(true);
    setFileResult(null);

    const ext = file.name.split(".").pop().toLowerCase();
    const isApk = ext === "apk";

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setFileResult({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
        hash: hashHex,
        isApk,
        note: isApk
          ? "Sideloaded Android APK. Installing APKs from messaging apps or websites bypasses Google Play security checks."
          : "Standard file. SHA-256 hash calculated directly in your browser without uploading.",
      });
    } catch {
      setFileResult({ name: file.name, error: "Failed to read file." });
    } finally {
      setFileHashing(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      {/* SIMPLE CLEAN HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#0056D2] uppercase tracking-wide">
                  Device &amp; Storage
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">PWA Quick Action</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Storage &amp; Tab Health
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                View browser storage, inspect open tabs, and clear cached files to free up space.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {/* 3 TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Storage */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-[#0056D2]" /> Cleanable Cache
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {formatBytes(storageData?.cleanableBytes || 0)}
            </p>
            <p className="text-xs text-slate-400">
              Total storage used: {formatBytes(storageData?.usageBytes || 0)}
            </p>
          </div>

          {/* Card 2: Open Tabs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" /> Active Tabs
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {openTabs.length} {openTabs.length === 1 ? "Tab" : "Tabs"}
            </p>
            <p className="text-xs text-slate-400">
              Open CyberGuard windows on this device
            </p>
          </div>

          {/* Card 3: Connection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" /> Security
            </span>
            <p className="text-2xl font-bold text-slate-900">
              {window.location.protocol === "https:" ? "Encrypted" : "Insecure"}
            </p>
            <p className="text-xs text-slate-400">
              {latencyMs !== null ? `${latencyMs} ms edge latency` : "SSL/TLS 1.3 Active"}
            </p>
          </div>
        </div>

        {/* CLEAN CACHE SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clear Temporary Browser Cache</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Frees up local storage by removing cached course media, audio clips, and page transitions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClean}
              disabled={cleaning || storageData?.cleanableBytes === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0056D2] hover:bg-[#00419E] active:scale-95 rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{cleaning ? "Cleaning..." : `Clear ${formatBytes(storageData?.cleanableBytes || 0)} Cache`}</span>
            </button>
          </div>

          {cleanSuccess !== null && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Successfully freed {formatBytes(cleanSuccess)} of browser cache.</span>
            </div>
          )}

          {/* Storage Details Table */}
          <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50/60 font-medium text-slate-600">
              <span>Category</span>
              <span>Size on Device</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-slate-700">Offline Cached Assets &amp; Audio</span>
              <span className="font-semibold text-slate-900">
                {formatBytes(storageData?.cleanableBytes || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-slate-700">Temporary Page State</span>
              <span className="font-semibold text-slate-900">
                {formatBytes(storageData?.sessionStorageBytes || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/30">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>Account Credentials &amp; Login Token</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">
                  Protected
                </span>
              </span>
              <span className="font-semibold text-slate-500">Preserved</span>
            </div>
          </div>
        </div>

        {/* OPEN TABS SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Open Application Tabs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tabs currently running CyberGuard in your browser.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {openTabs.length} {openTabs.length === 1 ? "Tab Open" : "Tabs Open"}
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {openTabs.map((tab) => {
              const minutes = Math.round((Date.now() - tab.loadedAt) / 60000);
              return (
                <div key={tab.tabId} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{tab.title}</p>
                      {tab.isCurrent && (
                        <span className="text-[10px] bg-blue-100 text-[#0056D2] px-2 py-0.5 rounded font-semibold shrink-0">
                          Current Tab
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">{tab.url}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[11px]">
                    <span className="hidden sm:inline">
                      {minutes < 1 ? "Just opened" : `${minutes} min open`}
                    </span>
                    {tab.heapMb !== null && (
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {tab.heapMb} MB
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO CLEAN UTILITY TOOLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tool 1: MoMo Link Checker */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0056D2]" />
                <h3 className="text-sm font-bold text-slate-900">Verify MoMo SMS or Link</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check whether a message or URL matches official Ghanaian telecom and bank domains.
              </p>

              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={momoInput}
                  onChange={(e) => setMomoInput(e.target.value)}
                  placeholder="Paste link or SMS text here..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0056D2] transition text-slate-800"
                />

                <button
                  type="button"
                  onClick={handleCheckMomo}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
                >
                  Verify
                </button>
              </div>

              {momoResult && (
                <div
                  className={`p-3 rounded-lg text-xs space-y-1 ${
                    momoResult.isPhishing
                      ? "bg-rose-50 border border-rose-200 text-rose-900"
                      : "bg-slate-50 border border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {momoResult.isPhishing ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{momoResult.isPhishing ? "High Risk Detected" : "Verification Result"}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">{momoResult.message}</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              MTN, Telecel, and AT will never ask you for your MoMo PIN.
            </p>
          </div>

          {/* Tool 2: File SHA-256 Check */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#0056D2]" />
                <h3 className="text-sm font-bold text-slate-900">Check Downloaded File or APK</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Calculate the cryptographic SHA-256 hash of a file on your device without uploading it.
              </p>

              <div className="pt-1">
                <label className="border border-dashed border-slate-300 hover:border-[#0056D2] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 hover:bg-slate-100/60">
                  <FileSearch className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-800">
                    {fileHashing ? "Calculating hash..." : "Choose File or APK"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Processed locally in browser</span>
                  <input
                    type="file"
                    onChange={handleFilePick}
                    disabled={fileHashing}
                    className="hidden"
                  />
                </label>
              </div>

              {fileResult && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span className="truncate max-w-[200px]">{fileResult.name}</span>
                    <span className="text-slate-500 text-[11px]">{fileResult.sizeMb} MB</span>
                  </div>
                  {fileResult.hash && (
                    <div className="p-1.5 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-600 break-all flex items-center justify-between gap-1">
                      <span className="truncate">SHA-256: {fileResult.hash}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(fileResult.hash);
                          setCopiedHash(true);
                          setTimeout(() => setCopiedHash(false), 2000);
                        }}
                        className="text-[#0056D2] hover:text-[#00419E] shrink-0 cursor-pointer"
                        title="Copy"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : "Copy"}
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600">{fileResult.note}</p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              Only install Android apps from the Google Play Store.
            </p>
          </div>
        </div>

        {/* PLAY PROTECT LINK */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-900">Looking for a full virus scan of your phone?</p>
            <p className="text-slate-500 text-[11px]">
              Use Google Play Protect on Android to scan all installed apps and files on your device.
            </p>
          </div>
          <a
            href="https://play.google.com/store/apps"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#0056D2] hover:text-[#00419E] hover:underline shrink-0"
          >
            <span>Open Play Protect</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
