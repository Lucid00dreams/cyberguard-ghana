import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Subtitles,
  Check,
  X,
} from "lucide-react";

/**
 * Clean markdown symbols from text so SpeechSynthesis reads smooth natural English
 */
export function cleanTextForSpeech(raw) {
  if (!raw) return "";
  return raw
    .replace(/^#+\s+/gm, "") // Remove header hashes
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold **text** -> text
    .replace(/\*(.*?)\*/g, "$1") // Italic *text* -> text
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links [text](url) -> text
    .replace(/^[*\-•\d.]+\s+/gm, "") // Bullet / numbered list symbols
    .replace(/`{1,3}.*?`{1,3}/gs, "") // Code blocks
    .replace(/[\r\n]+/g, " ") // Collapse newlines
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Split lesson text into discrete sentences for robust SpeechSynthesis streaming
 */
export function extractSentences(rawContent) {
  if (!rawContent) return [];
  const cleaned = cleanTextForSpeech(rawContent);
  if (!cleaned) return [];

  // Match sentences ending in ., !, or ?
  const rawMatches = cleaned.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) || [];
  const sentences = rawMatches
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  return sentences.length > 0 ? sentences : [cleaned];
}

/**
 * Rank and prioritize high-fidelity Neural / Natural voices over legacy robotic voices
 */
export function rankAndSortVoices(allVoices) {
  if (!allVoices || allVoices.length === 0) return [];

  const englishVoices = allVoices.filter((v) =>
    v.lang?.toLowerCase().startsWith("en")
  );
  const pool = englishVoices.length > 0 ? englishVoices : allVoices;

  return [...pool].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aLang = a.lang.toLowerCase();
    const bLang = b.lang.toLowerCase();

    let aScore = 0;
    let bScore = 0;

    // Prioritize Neural / Natural / Online voices (Edge/Chrome/Safari)
    if (aName.includes("natural") || aName.includes("online (natural)")) aScore += 120;
    if (bName.includes("natural") || bName.includes("online (natural)")) bScore += 120;

    if (aName.includes("neural") || aName.includes("premium")) aScore += 90;
    if (bName.includes("neural") || bName.includes("premium")) bScore += 90;

    if (aName.includes("google")) aScore += 70;
    if (bName.includes("google")) bScore += 70;

    if (aName.includes("samantha") || aName.includes("siri") || aName.includes("daniel")) aScore += 60;
    if (bName.includes("samantha") || bName.includes("siri") || bName.includes("daniel")) bScore += 60;

    // English African accents if present
    if (aLang.includes("gh") || aLang.includes("ng") || aLang.includes("za")) aScore += 40;
    if (bLang.includes("gh") || bLang.includes("ng") || bLang.includes("za")) bScore += 40;

    // English US/UK priority
    if (aLang === "en-us" || aLang === "en-gb") aScore += 30;
    if (bLang === "en-us" || bLang === "en-gb") bScore += 30;

    // Demote legacy robotic desktop voices
    if (aName.includes("desktop") || aName.includes("david") || aName.includes("zira")) aScore -= 60;
    if (bName.includes("desktop") || bName.includes("david") || bName.includes("zira")) bScore -= 60;

    return bScore - aScore;
  });
}

function formatVoiceName(name) {
  if (!name) return "Natural Voice";
  return name
    .replace(/Microsoft/gi, "")
    .replace(/Online\s*\(Natural\)/gi, "Natural")
    .replace(/Desktop/gi, "")
    .replace(/English\s*\(.*?\)/gi, "")
    .replace(/United States|United Kingdom/gi, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || name;
}

export default function CourseAudioNarrator({
  title = "Lesson Audio Narration",
  content = "",
  activeSentenceIndex = 0,
  onSentenceChange,
  onComplete,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => {
    return localStorage.getItem("cg_preferred_voice") || "";
  });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [scrolledPast, setScrolledPast] = useState(false);

  const sentences = useMemo(() => extractSentences(content), [content]);
  const currentIndexRef = useRef(activeSentenceIndex);
  const isPlayingRef = useRef(false);
  const mainBarRef = useRef(null);

  // Sync ref with controlled activeSentenceIndex
  useEffect(() => {
    currentIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Track scroll position to show floating sticky mini-player when reading down the page
  useEffect(() => {
    const handleScroll = () => {
      if (!mainBarRef.current) return;
      const rect = mainBarRef.current.getBoundingClientRect();
      // Scrolled past if top player is out of view
      setScrolledPast(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load and rank available voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const ranked = rankAndSortVoices(allVoices);
      setVoices(ranked);

      if (ranked.length > 0) {
        const saved = localStorage.getItem("cg_preferred_voice");
        const match = ranked.find((v) => v.voiceURI === saved);
        if (match) {
          setSelectedVoiceURI(match.voiceURI);
        } else {
          // Auto-select top-ranked natural voice
          setSelectedVoiceURI(ranked[0].voiceURI);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const selectedVoice = useMemo(() => {
    return voices.find((v) => v.voiceURI === selectedVoiceURI) || voices[0] || null;
  }, [voices, selectedVoiceURI]);

  // Speak a specific sentence by index with natural pacing
  const speakSentence = (index) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (index < 0 || index >= sentences.length) {
      setIsPlaying(false);
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = sentences[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    // Set conversational natural rate
    utterance.rate = playbackRate * 0.96;
    utterance.pitch = 1.0;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      if (onSentenceChange) onSentenceChange(index);
    };

    utterance.onend = () => {
      // Natural breath pause between sentences (120ms) before continuing
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < sentences.length) {
          currentIndexRef.current = nextIdx;
          if (onSentenceChange) onSentenceChange(nextIdx);
          setTimeout(() => {
            if (isPlayingRef.current) {
              speakSentence(nextIdx);
            }
          }, 120);
        } else {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      console.warn("[CourseAudioNarrator] Speech error:", e.error);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!speechSupported || sentences.length === 0) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speakSentence(activeSentenceIndex);
    }
  };

  const handleRestart = () => {
    window.speechSynthesis.cancel();
    currentIndexRef.current = 0;
    if (onSentenceChange) onSentenceChange(0);
    speakSentence(0);
  };

  const handleSkipNext = () => {
    const nextIdx = Math.min(sentences.length - 1, activeSentenceIndex + 1);
    if (nextIdx !== activeSentenceIndex) {
      currentIndexRef.current = nextIdx;
      if (onSentenceChange) onSentenceChange(nextIdx);
      if (isPlaying) speakSentence(nextIdx);
    }
  };

  const handleSkipPrev = () => {
    const prevIdx = Math.max(0, activeSentenceIndex - 1);
    if (prevIdx !== activeSentenceIndex) {
      currentIndexRef.current = prevIdx;
      if (onSentenceChange) onSentenceChange(prevIdx);
      if (isPlaying) speakSentence(prevIdx);
    }
  };

  const handleSeek = (newIndex) => {
    const validIdx = Math.max(0, Math.min(sentences.length - 1, newIndex));
    currentIndexRef.current = validIdx;
    if (onSentenceChange) onSentenceChange(validIdx);
    if (isPlaying) speakSentence(validIdx);
  };

  const handleVoiceSelect = (voiceURI) => {
    setSelectedVoiceURI(voiceURI);
    localStorage.setItem("cg_preferred_voice", voiceURI);
    setVoicePickerOpen(false);

    if (isPlaying) {
      setTimeout(() => speakSentence(activeSentenceIndex), 50);
    }
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (isPlaying) {
      setTimeout(() => speakSentence(activeSentenceIndex), 50);
    }
  };

  const progressPercent = sentences.length > 0
    ? Math.round(((activeSentenceIndex + 1) / sentences.length) * 100)
    : 0;

  const currentSentence = sentences[activeSentenceIndex] || "";
  const estMinutes = Math.max(1, Math.round(sentences.length * 0.15));

  return (
    <>
      {/* COMPACT HIGH-END AUDIO HEADER DECK */}
      <div
        ref={mainBarRef}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200"
      >
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Play/Pause, Title & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              title={isPlaying ? "Pause Narration" : "Listen to Lesson"}
              className={`w-11 h-11 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-sm ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20"
                  : "bg-[#0056D2] hover:bg-[#00419E] text-white shadow-blue-500/20 hover:scale-105"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#0056D2]" />
                  <span>{isPlaying ? "Reading Aloud" : "Listen to Lesson"}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  ⏱️ ~{estMinutes} min
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {isPlaying
                  ? `Sentence ${activeSentenceIndex + 1} of ${sentences.length} (${progressPercent}%)`
                  : "Click play or tap any sentence in the text to listen"}
              </p>
            </div>
          </div>

          {/* Right: Controls & Voice Picker */}
          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
            {/* Skip Prev / Next */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleSkipPrev}
                disabled={activeSentenceIndex <= 0}
                title="Previous sentence"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSkipNext}
                disabled={activeSentenceIndex >= sentences.length - 1}
                title="Next sentence"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Toggle Pill */}
            <button
              type="button"
              onClick={handleRateChange}
              title="Change reading speed"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {playbackRate}x
            </button>

            {/* Voice Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setVoicePickerOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {formatVoiceName(selectedVoice?.name)}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {voicePickerOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 divide-y divide-slate-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Voice ({voices.length})
                  </div>
                  <div className="space-y-0.5 pt-1">
                    {voices.map((v) => {
                      const isSelected = v.voiceURI === selectedVoiceURI;
                      const isNatural = v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neural");
                      return (
                        <button
                          key={v.voiceURI}
                          type="button"
                          onClick={() => handleVoiceSelect(v.voiceURI)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-200/80"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="min-w-0 flex-1 mr-2 truncate">
                            <span className="truncate block font-medium">
                              {formatVoiceName(v.name)}
                            </span>
                            {isNatural && (
                              <span className="text-[9px] font-mono text-emerald-600 block">
                                ⭐ High Fidelity Neural
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              title="Restart audio"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESS SCRUBBER LINE */}
        <div className="relative w-full h-1 bg-slate-100 cursor-pointer">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-[#0056D2] transition-all duration-300"
          />
        </div>

        {/* ACTIVE LIVE CAPTION BAR (When playing) */}
        {isPlaying && currentSentence && (
          <div className="px-4 py-2.5 bg-blue-50/70 border-t border-blue-100/80 flex items-center gap-2.5 transition-all duration-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-blue-950 leading-relaxed truncate">
              {currentSentence}
            </p>
          </div>
        )}
      </div>

      {/* STICKY FLOATING MINI-PLAYER (Appears when reading and scrolled past the top bar) */}
      {isPlaying && scrolledPast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-xl transition-all duration-200 max-w-[92vw]">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>

          <div className="min-w-0 max-w-[160px] sm:max-w-xs truncate text-xs font-semibold">
            {currentSentence}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-xs">
            <button
              type="button"
              onClick={handleSkipPrev}
              disabled={activeSentenceIndex <= 0}
              className="p-1 text-slate-400 hover:text-white transition disabled:opacity-30"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSkipNext}
              disabled={activeSentenceIndex >= sentences.length - 1}
              className="p-1 text-slate-400 hover:text-white transition disabled:opacity-30"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRateChange}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-blue-300 ml-1"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      )}
    </>
  );
}
