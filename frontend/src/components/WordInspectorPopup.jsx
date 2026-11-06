import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, ShieldAlert, Sparkles, Loader2, BookOpen } from "lucide-react";
import { lookupGlossary } from "../utils/cyberDictionary";

// In-memory cache for API lookups to avoid duplicate network requests
const definitionCache = new Map();

/**
 * WordInspectorPopup (Portal-Powered & Position Fixed)
 * 
 * Works flawlessly across Desktop and Mobile:
 * - Rendered directly to document.body via createPortal with position: fixed
 * - Desktop: Floats precisely above/below the highlighted selection
 * - Mobile (<640px): Docks as a sleek bottom sheet so it never collides with native OS selection handles
 * - Instant 0ms offline CyberGuard Ghana cybersecurity glossary + live dictionary fallback
 */
export default function WordInspectorPopup({ containerRef }) {
  const [popupState, setPopupState] = useState(null); // { word, rect, definition, loading, phonetic, partOfSpeech, example, tip, isCyber }
  const [speaking, setSpeaking] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    let debounceTimer = null;

    const handleSelection = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const rawText = selection.toString().trim();
        // Ignore single characters or entire long paragraphs
        if (!rawText || rawText.length < 2 || rawText.length > 55) return;

        // Ensure selection occurred inside our container if containerRef is provided
        if (containerRef && containerRef.current) {
          const anchorNode = selection.anchorNode;
          if (anchorNode && !containerRef.current.contains(anchorNode)) {
            return;
          }
        }

        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (!rect || (rect.width === 0 && rect.height === 0)) return;

          inspectWord(rawText, rect);
        } catch {
          // Range error fallback
        }
      }, 80);
    };

    const handleDocumentClick = (e) => {
      // Don't close if clicking inside popup
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      // Close on outside click
      setPopupState(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPopupState(null);
    };

    // Support both mouse and touch events
    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(debounceTimer);
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef]);

  async function inspectWord(rawText, rect) {
    const cleanWord = rawText.replace(/^[“"'(\[]+|[”"')\],.?!;:]+$/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    // 1. Check local offline cybersecurity glossary (instant 0ms)
    const offlineMatch = lookupGlossary(cleanWord);
    if (offlineMatch) {
      setPopupState({
        word: offlineMatch.term || cleanWord,
        rect,
        loading: false,
        isCyber: true,
        phonetic: offlineMatch.phonetic,
        partOfSpeech: offlineMatch.partOfSpeech,
        definition: offlineMatch.definition,
        example: offlineMatch.example,
        tip: offlineMatch.tip,
      });
      return;
    }

    // 2. Check memory cache for standard terms
    const lowerKey = cleanWord.toLowerCase();
    if (definitionCache.has(lowerKey)) {
      setPopupState({
        word: cleanWord,
        rect,
        loading: false,
        isCyber: false,
        ...definitionCache.get(lowerKey),
      });
      return;
    }

    // 3. Show loading state
    setPopupState({
      word: cleanWord,
      rect,
      loading: true,
      isCyber: false,
      definition: null,
    });

    // 4. Fallback: Query Free Dictionary API for general English words
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerKey)}`
      );
      if (!response.ok) throw new Error("Not found");
      const data = await response.json();
      const firstEntry = data[0];
      const firstMeaning = firstEntry?.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];

      const resolved = {
        phonetic: firstEntry?.phonetic || firstEntry?.phonetics?.find((p) => p.text)?.text || "",
        partOfSpeech: firstMeaning?.partOfSpeech || "noun",
        definition: firstDef?.definition || "Definition not found in dictionary.",
        example: firstDef?.example || null,
        tip: null,
      };

      definitionCache.set(lowerKey, resolved);

      setPopupState((prev) => {
        if (!prev || prev.word.toLowerCase() !== lowerKey) return prev;
        return {
          ...prev,
          loading: false,
          ...resolved,
        };
      });
    } catch {
      // Clean fallback if word not found
      const fallback = {
        phonetic: "",
        partOfSpeech: "term",
        definition: `"${cleanWord}" is used in this cybersecurity lesson. Check the context of the sentence or ask your CyberGuard tutor.`,
        example: null,
        tip: null,
      };
      setPopupState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          loading: false,
          ...fallback,
        };
      });
    }
  }

  // Pronounce word using Web Speech Synthesis
  function handlePronounce() {
    if (!popupState?.word || typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(popupState.word);
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  if (!popupState || typeof document === "undefined") return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const { rect } = popupState;
  const popupWidth = Math.min(340, typeof window !== "undefined" ? window.innerWidth - 24 : 340);

  // Desktop positioning: clamp horizontally, flip above/below vertically
  let left = 12;
  let top = 12;
  let placeAbove = true;

  if (!isMobile && rect) {
    left = rect.left + rect.width / 2 - popupWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, left));

    placeAbove = rect.top > 200;
    top = placeAbove ? rect.top - 10 : rect.bottom + 10;
  }

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-[999999]">
        {/* Mobile Backdrop Tap to Dismiss */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupState(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto"
          />
        )}

        {/* The Card: Mobile Bottom Sheet OR Desktop Floating Popover */}
        <motion.div
          ref={popupRef}
          initial={
            isMobile
              ? { opacity: 0, y: 100 }
              : { opacity: 0, scale: 0.94, y: placeAbove ? 8 : -8 }
          }
          animate={
            isMobile
              ? { opacity: 1, y: 0 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={
            isMobile
              ? { opacity: 0, y: 100 }
              : { opacity: 0, scale: 0.94 }
          }
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={
            isMobile
              ? {
                  position: "fixed",
                  bottom: "16px",
                  left: "12px",
                  right: "12px",
                  maxHeight: "80vh",
                  width: "auto",
                }
              : {
                  position: "fixed",
                  top: `${top}px`,
                  left: `${left}px`,
                  transform: placeAbove ? "translateY(-100%)" : "none",
                  width: `${popupWidth}px`,
                }
          }
          className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/90 p-4 space-y-2.5 backdrop-blur-xl select-none"
        >
          {/* Header Row: Word, Badge & Pronounce */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-base text-white tracking-tight truncate capitalize">
                  {popupState.word}
                </span>

                {popupState.isCyber ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-[#38BDF8] border border-blue-500/40 shrink-0">
                    <ShieldAlert className="w-2.5 h-2.5 text-cyan-400" />
                    <span>CYBERGUARD</span>
                  </span>
                ) : popupState.partOfSpeech ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {popupState.partOfSpeech}
                  </span>
                ) : null}
              </div>

              {popupState.phonetic && (
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {popupState.phonetic}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePronounce}
                title="Pronounce word"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  speaking
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPopupState(null)}
                title="Close"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Definition Body */}
          {popupState.loading ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Looking up definition...</span>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-slate-200 leading-relaxed font-normal">
                {popupState.definition}
              </p>

              {popupState.example && (
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 italic">
                  <span className="font-semibold text-slate-400 not-italic mr-1">Example:</span>
                  &ldquo;{popupState.example}&rdquo;
                </div>
              )}

              {popupState.tip && (
                <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="font-bold text-blue-300 mr-1">Safety Rule:</span>
                    {popupState.tip}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Arrow Pointer (Desktop only) */}
          {!isMobile && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-slate-700/90 rotate-45 ${
                placeAbove
                  ? "bottom-[-6px] border-b border-r"
                  : "top-[-6px] border-t border-l"
              }`}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
