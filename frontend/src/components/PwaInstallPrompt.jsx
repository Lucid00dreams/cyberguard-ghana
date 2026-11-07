import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share, PlusSquare, CheckCircle2, Smartphone, MoreVertical } from "lucide-react";

const DISMISS_SESSION_KEY = "cyberguard_pwa_prompt_dismissed_session";
const INSTALLED_STORAGE_KEY = "cyberguard_pwa_installed";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.matchMedia?.("(display-mode: minimal-ui)")?.matches ||
    window.navigator?.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

function detectPlatform() {
  if (typeof window === "undefined") return { isIOS: false, isMobile: false };
  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Mobile/i.test(ua);
  return { isIOS, isAndroid, isMobile };
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== "undefined" ? window.__deferredPwaPrompt || null : null)
  );
  const [visible, setVisible] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const { isIOS, isAndroid, isMobile } = detectPlatform();

  useEffect(() => {
    if (isStandaloneMode()) {
      return;
    }

    // Sync with global early listener in index.html
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      setDeferredPrompt(e);
      if (!sessionStorage.getItem(DISMISS_SESSION_KEY)) {
        setVisible(true);
      }
    };

    const handlePromptReady = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
        if (!sessionStorage.getItem(DISMISS_SESSION_KEY)) {
          setVisible(true);
        }
      }
    };

    const handleManualOpen = () => {
      sessionStorage.removeItem(DISMISS_SESSION_KEY);
      setShowManualGuide(false);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
      setInstalledSuccess(true);
      setTimeout(() => {
        setVisible(false);
        setInstalledSuccess(false);
      }, 2200);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-prompt-ready", handlePromptReady);
    window.addEventListener("open-pwa-install", handleManualOpen);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Pop up automatically shortly after visiting the site
    const timer = setTimeout(() => {
      if (isStandaloneMode()) return;
      const dismissedThisSession = sessionStorage.getItem(DISMISS_SESSION_KEY);
      if (!dismissedThisSession) {
        setVisible(true);
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("open-pwa-install", handleManualOpen);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "true");
    setVisible(false);
    setShowManualGuide(false);
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        setInstalling(true);
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult?.outcome === "accepted") {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
          localStorage.setItem(INSTALLED_STORAGE_KEY, "true");
          setInstalledSuccess(true);
          setTimeout(() => {
            setVisible(false);
            setInstalledSuccess(false);
          }, 2000);
        }
      } catch (err) {
        setShowManualGuide(true);
      } finally {
        setInstalling(false);
      }
    } else {
      // Browser doesn't support beforeinstallprompt (e.g. iOS Safari) -> show 2-step guide
      setShowManualGuide(true);
    }
  };

  if (isStandaloneMode()) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="Install CyberGuard Ghana App"
          className="fixed bottom-[68px] left-3 right-3 sm:left-6 sm:right-auto sm:bottom-6 sm:w-[388px] z-[85]"
        >
          <div className="bg-white/98 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#0056D2] via-[#00B2FF] to-emerald-500" />

            <div className="p-4">
              {installedSuccess ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">CyberGuard App Installed</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Launch CyberGuard anytime directly from your home screen.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3.5">
                    {/* Standard 1:1 App Icon Preview */}
                    <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-1">
                      <img
                        src="/pwa-192x192.png"
                        alt="CyberGuard Ghana App Icon"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-[#0056D2] border border-blue-200/70">
                          <Smartphone className="w-2.5 h-2.5" /> Web App
                        </span>
                        <span className="text-[10px] font-medium text-emerald-600">
                          · Fast & Offline Ready
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-snug">
                        Install CyberGuard Ghana
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Add CyberGuard to your home screen for 1-tap launch, instant cyber alerts, and full-screen learning.
                      </p>
                    </div>

                    <button
                      onClick={handleDismiss}
                      aria-label="Dismiss install prompt"
                      className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Step-by-step guide when native prompt isn't supported (e.g., iOS Safari) */}
                  {showManualGuide ? (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                      {isIOS ? (
                        <>
                          <p className="font-bold text-slate-800">
                            Install on iPhone / iPad in 2 taps:
                          </p>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] font-bold flex items-center justify-center shrink-0">
                              1
                            </span>
                            <span className="flex-1">
                              Tap the <strong>Share</strong> icon in Safari&apos;s toolbar
                            </span>
                            <Share className="w-4 h-4 text-[#0056D2] shrink-0" />
                          </div>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] font-bold flex items-center justify-center shrink-0">
                              2
                            </span>
                            <span className="flex-1">
                              Scroll down and tap <strong>Add to Home Screen</strong>
                            </span>
                            <PlusSquare className="w-4 h-4 text-[#0056D2] shrink-0" />
                          </div>
                        </>
                      ) : isAndroid || isMobile ? (
                        <>
                          <p className="font-bold text-slate-800">
                            Add to your Android Home Screen:
                          </p>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] font-bold flex items-center justify-center shrink-0">
                              1
                            </span>
                            <span className="flex-1">
                              Tap the browser menu icon <strong>(⋮)</strong>
                            </span>
                            <MoreVertical className="w-4 h-4 text-[#0056D2] shrink-0" />
                          </div>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0056D2] font-bold flex items-center justify-center shrink-0">
                              2
                            </span>
                            <span className="flex-1">
                              Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
                            </span>
                            <Download className="w-4 h-4 text-[#0056D2] shrink-0" />
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800">
                            Install on your computer:
                          </p>
                          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                            <Download className="w-4 h-4 text-[#0056D2] shrink-0" />
                            <span className="flex-1">
                              Click the <strong>Install CyberGuard</strong> icon on the right side of your browser&apos;s address bar, or open the browser menu <strong>(⋮) → Install CyberGuard Ghana</strong>.
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleDismiss}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 flex items-center gap-2">
                      <button
                        onClick={handleInstallClick}
                        disabled={installing}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0056D2] hover:bg-[#00419E] active:scale-[0.99] text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{installing ? "Installing..." : "Install to Home Screen"}</span>
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
                      >
                        Later
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

