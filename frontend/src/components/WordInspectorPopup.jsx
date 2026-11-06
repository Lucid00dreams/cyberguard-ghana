import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, BookOpen, ShieldAlert, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { lookupGlossary } from "../utils/cyberDictionary";

// In-memory cache for API lookups to avoid duplicate network requests
const definitionCache = new Map();

/**
 * WordInspectorPopup
 * 
 * Pops up a sleek, authoritative definition card right above any highlighted text
 * in the lesson content. Checks the local offline CyberGuard Ghana cybersecurity
 * glossary first (0ms), with transparent fallback to standard English dictionary.
 */
export default function WordInspectorPopup({ containerRef }) {
  const [popupState, setPopupState] = useState(null); // { word, rect, definition, loading, phonetic, partOfSpeech, example, tip }
  const [speaking, setSpeaking] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      // Filter out overly long selections (paragraphs) or single character whitespace
      if (!selectedText || selectedText.length < 2 || selectedText.length > 50) return;

      // Ensure selection occurred inside our container if provided
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

        inspectWord(selectedText, rect);
      } catch {
        // Range exception fallback
      }
    };

    const handleDocumentClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        // Clicked outside popup
        setPopupState(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPopupState(null);
      }
    };

    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef]);

  async function inspectWord(rawText, rect) {
    const cleanWord = rawText.replace(/^[“"'(\[]+|[”"')\],.?!;:]+$/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    // Check offline cybersecurity glossary first
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

    // Check memory cache for standard words
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

    // Set loading state with positioning
    setPopupState({
      word: cleanWord,
      rect,
      loading: true,
      isCyber: false,
      definition: null,
    });

    // Fallback: Query Free Dictionary API for general English terms
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
        partOfSpeech: firstMeaning?.partOfSpeech || "word",
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
      // Offline fallback card
      const fallback = {
        phonetic: "",
        partOfSpeech: "term",
        definition: `"${cleanWord}" is used in this cybersecurity lesson. Read the surrounding sentence for context or consult the instructor.`,
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

  if (!popupState) return null;

  // Calculate clamped viewport positioning
  const { rect } = popupState;
  const popupWidth = 320;
  const padding = 12;

  // Horizontal clamping
  let left = rect.left + rect.width / 2 - popupWidth / 2;
  left = Math.max(padding, Math.min(window.innerWidth - popupWidth - padding, left));

  // Vertical placement (prefer above selection, fallback to below if close to top edge)
  const placeAbove = rect.top > 220;
  const top = placeAbove
    ? rect.top + window.scrollY - 12
    : rect.bottom + window.scrollY + 12;

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.92, y: placeAbove ? 6 : -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: `${top}px`,
          left: `${left}px`,
          transform: placeAbove ? "translateY(-100%)" : "none",
          width: `${popupWidth}px`,
          zIndex: 9999,
        }}
        className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 space-y-2.5 backdrop-blur-md select-none"
      >
        {/* Header: Word, Tag & Controls */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-base text-white tracking-tight truncate">
                {popupState.word}
              </span>

              {popupState.isCyber ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-[#38BDF8] border border-blue-500/30 shrink-0">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  <span>CYBER</span>
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

        {/* Content Body */}
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
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 italic">
                <span className="font-semibold text-slate-400 not-italic mr-1">Example:</span>
                &ldquo;{popupState.example}&rdquo;
              </div>
            )}

            {popupState.tip && (
              <div className="p-2 rounded-xl bg-blue-950/70 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <span className="font-bold text-blue-300 mr-1">Safety Rule:</span>
                  {popupState.tip}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pointer Arrow */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-slate-700/80 rotate-45 ${
            placeAbove
              ? "bottom-[-6px] border-b border-r"
              : "top-[-6px] border-t border-l"
          }`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
