import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Loader2,
  Radio,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";

/**
 * Curated Studio Neural Voices powered by free high-fidelity Edge TTS
 * Features real human actors with distinct regional accents and personalities.
 */
export const NEURAL_VOICES = [
  {
    id: "en-NG-EzinneNeural",
    name: "Ezinne",
    accent: "West African",
    region: "Ghana / Nigeria",
    gender: "Female",
    description: "Warm, natural West African educator — relatable regional guide",
    flag: "🇬🇭",
    isNeural: true,
  },
  {
    id: "en-NG-AbeoNeural",
    name: "Abeo",
    accent: "West African",
    region: "Ghana / Nigeria",
    gender: "Male",
    description: "Confident, engaging West African tech mentor",
    flag: "🇬🇭",
    isNeural: true,
  },
  {
    id: "en-US-AriaNeural",
    name: "Aria",
    accent: "US English",
    region: "North America",
    gender: "Female",
    description: "Clear, studio-grade Coursera-style instructor",
    flag: "🇺🇸",
    isNeural: true,
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    accent: "US English",
    region: "North America",
    gender: "Male",
    description: "Casual, friendly conversational mentor",
    flag: "🇺🇸",
    isNeural: true,
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    accent: "US English",
    region: "North America",
    gender: "Female",
    description: "Upbeat, expressive & friendly instructor",
    flag: "🇺🇸",
    isNeural: true,
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    accent: "British English",
    region: "United Kingdom",
    gender: "Female",
    description: "Crisp, formal academy lecturer",
    flag: "🇬🇧",
    isNeural: true,
  },
  {
    id: "en-GB-RyanNeural",
    name: "Ryan",
    accent: "British English",
    region: "United Kingdom",
    gender: "Male",
    description: "Articulate, resonant British tutor",
    flag: "🇬🇧",
    isNeural: true,
  },
  {
    id: "en-ZA-LeahNeural",
    name: "Leah",
    accent: "South African",
    region: "Southern Africa",
    gender: "Female",
    description: "Melodic, calm African English guide",
    flag: "🇿🇦",
    isNeural: true,
  },
];

/**
 * In-memory Blob URL cache for zero-latency playback across sentences & voices
 */
const audioBlobCache = new Map();

/**
 * Clean markdown symbols from text so Speech engines read smooth natural English
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
 * Split lesson text into discrete sentences for robust streaming and synchronized highlighting
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
 * Build backend neural TTS stream URL
 */
function buildNeuralStreamUrl(text, voiceId, rate) {
  const base = api.defaults.baseURL || "/api";
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/tts/stream?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voiceId)}&rate=${rate}`;
}

/**
 * Fetch and cache raw audio as local Blob URL for glitch-free playback
 */
async function fetchAudioBlobUrl(text, voiceId, rate) {
  const cacheKey = `${voiceId}:${rate}:${text}`;
  if (audioBlobCache.has(cacheKey)) {
    return audioBlobCache.get(cacheKey);
  }

  const streamUrl = buildNeuralStreamUrl(text, voiceId, rate);
  const response = await fetch(streamUrl);
  if (!response.ok) {
    throw new Error(`TTS server error (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  audioBlobCache.set(cacheKey, blobUrl);
  return blobUrl;
}

export default function CourseAudioNarrator({
  title = "Lesson Audio Narration",
  content = "",
  activeSentenceIndex = 0,
  onSentenceChange = undefined,
  onComplete = undefined,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);
  const [audioError, setAudioError] = useState("");

  // Selected voice: ensure we always default to real studio voices
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    const saved = localStorage.getItem("cg_preferred_voice");
    if (saved && NEURAL_VOICES.some((v) => v.id === saved)) {
      return saved;
    }
    // Clean up any legacy robotic browser voice name stored in earlier sessions
    localStorage.setItem("cg_preferred_voice", "en-NG-EzinneNeural");
    return "en-NG-EzinneNeural";
  });

  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem("cg_preferred_rate");
    return saved ? parseFloat(saved) : 1;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [deviceVoices, setDeviceVoices] = useState([]);

  const sentences = useMemo(() => extractSentences(content), [content]);

  // Audio elements & playback state refs
  const activeAudioRef = useRef(null);
  const previewAudioRef = useRef(null);
  const currentIndexRef = useRef(activeSentenceIndex);
  const isPlayingRef = useRef(false);
  const mainBarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close voice dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setVoicePickerOpen(false);
      }
    }

    if (voicePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [voicePickerOpen]);

  // Synchronize ref with parent controlled activeSentenceIndex
  useEffect(() => {
    currentIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Track scroll position to show sticky floating mini-player
  useEffect(() => {
    const handleScroll = () => {
      if (!mainBarRef.current) return;
      const rect = mainBarRef.current.getBoundingClientRect();
      setScrolledPast(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load fallback device voices only as supplementary option
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadLocal = () => {
      const all = window.speechSynthesis.getVoices() || [];
      const english = all.filter((v) => v.lang?.toLowerCase().startsWith("en"));
      setDeviceVoices(english.length > 0 ? english : all);
    };

    loadLocal();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadLocal;
    }
  }, []);

  // Determine current active voice object
  const currentNeuralVoice = useMemo(() => {
    return NEURAL_VOICES.find((v) => v.id === selectedVoiceId) || null;
  }, [selectedVoiceId]);

  const currentDeviceVoice = useMemo(() => {
    if (currentNeuralVoice) return null;
    return deviceVoices.find((v) => v.voiceURI === selectedVoiceId) || null;
  }, [currentNeuralVoice, deviceVoices, selectedVoiceId]);

  // Stop all playback engines
  const stopAllPlayback = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setPreviewingVoiceId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

  // Preload upcoming sentence audio for instantaneous transitions
  const preloadUpcoming = useCallback(
    (nextIdx, voiceId) => {
      if (!voiceId || nextIdx >= sentences.length) return;
      const nextText = sentences[nextIdx];
      if (!nextText) return;
      fetchAudioBlobUrl(nextText, voiceId, playbackRate).catch(() => {});
    },
    [playbackRate, sentences]
  );

  // Play a specific sentence using Real Studio Neural Voices
  const speakSentence = useCallback(
    async (index, voiceToUse = selectedVoiceId) => {
      if (index < 0 || index >= sentences.length) {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        if (onComplete) onComplete();
        return;
      }

      currentIndexRef.current = index;
      if (onSentenceChange) onSentenceChange(index);

      const text = sentences[index];
      if (!text) return;

      // Stop previous audio instance completely
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const neuralVoice = NEURAL_VOICES.find((v) => v.id === voiceToUse);

      // 1. PRIMARY ENGINE: REAL NEURAL STUDIO AUDIO
      if (neuralVoice) {
        setIsLoadingAudio(true);
        setAudioError("");

        try {
          const blobUrl = await fetchAudioBlobUrl(text, neuralVoice.id, playbackRate);

          // If playback was cancelled during fetch
          if (!isPlayingRef.current) {
            setIsLoadingAudio(false);
            return;
          }

          const audio = new Audio(blobUrl);
          activeAudioRef.current = audio;
          audio.playbackRate = 1.0;
          audio.muted = isMuted;

          audio.onplay = () => {
            setIsLoadingAudio(false);
            setIsPlaying(true);
            // Preload upcoming sentence in background for zero buffering
            preloadUpcoming(index + 1, neuralVoice.id);
          };

          audio.onended = () => {
            if (isPlayingRef.current) {
              const nextIdx = index + 1;
              if (nextIdx < sentences.length) {
                currentIndexRef.current = nextIdx;
                if (onSentenceChange) onSentenceChange(nextIdx);
                // Natural breath pause (90ms) before next sentence
                setTimeout(() => {
                  if (isPlayingRef.current) {
                    speakSentence(nextIdx, voiceToUse);
                  }
                }, 90);
              } else {
                setIsPlaying(false);
                if (onComplete) onComplete();
              }
            }
          };

          audio.onerror = (e) => {
            console.error("[CourseAudioNarrator] Audio decode error:", e);
            setIsLoadingAudio(false);
            setAudioError("Audio stream interrupted. Tap play to retry.");
          };

          await audio.play();
        } catch (err) {
          console.error("[CourseAudioNarrator] Failed to fetch neural speech:", err);
          setIsLoadingAudio(false);
          setAudioError("Connection to speech service delayed. Tap play to retry.");
        }
        return;
      }

      // 2. DEVICE SYSTEM VOICE (Only if user explicitly chose it)
      const deviceVoice = deviceVoices.find((v) => v.voiceURI === voiceToUse);
      if (deviceVoice && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = deviceVoice;
        utterance.rate = playbackRate * 0.95;
        utterance.volume = isMuted ? 0 : 1;

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
        };

        utterance.onend = () => {
          if (isPlayingRef.current) {
            const nextIdx = index + 1;
            if (nextIdx < sentences.length) {
              currentIndexRef.current = nextIdx;
              if (onSentenceChange) onSentenceChange(nextIdx);
              setTimeout(() => {
                if (isPlayingRef.current) {
                  speakSentence(nextIdx, voiceToUse);
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
          console.warn("[CourseAudioNarrator] SpeechSynthesis error:", e.error);
          setIsPlaying(false);
          setIsLoadingAudio(false);
        };

        window.speechSynthesis.speak(utterance);
      }
    },
    [sentences, selectedVoiceId, playbackRate, isMuted, onSentenceChange, preloadUpcoming, onComplete, deviceVoices]
  );

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (sentences.length === 0) return;

    if (isPlaying) {
      stopAllPlayback();
    } else {
      setIsPlaying(true);
      speakSentence(activeSentenceIndex, selectedVoiceId);
    }
  };

  // Restart from sentence 0
  const handleRestart = () => {
    stopAllPlayback();
    currentIndexRef.current = 0;
    if (onSentenceChange) onSentenceChange(0);
    setIsPlaying(true);
    speakSentence(0, selectedVoiceId);
  };

  // Skip Forward
  const handleSkipNext = () => {
    const nextIdx = Math.min(sentences.length - 1, activeSentenceIndex + 1);
    if (nextIdx !== activeSentenceIndex) {
      currentIndexRef.current = nextIdx;
      if (onSentenceChange) onSentenceChange(nextIdx);
      if (isPlaying) {
        speakSentence(nextIdx, selectedVoiceId);
      }
    }
  };

  // Skip Backward
  const handleSkipPrev = () => {
    const prevIdx = Math.max(0, activeSentenceIndex - 1);
    if (prevIdx !== activeSentenceIndex) {
      currentIndexRef.current = prevIdx;
      if (onSentenceChange) onSentenceChange(prevIdx);
      if (isPlaying) {
        speakSentence(prevIdx, selectedVoiceId);
      }
    }
  };

  // Cycle speed (1x -> 1.25x -> 1.5x -> 0.8x)
  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    localStorage.setItem("cg_preferred_rate", String(nextRate));

    if (isPlaying) {
      setTimeout(() => speakSentence(activeSentenceIndex, selectedVoiceId), 50);
    }
  };

  // Select voice from dropdown: updates state & immediately speaks with the new voice
  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    localStorage.setItem("cg_preferred_voice", voiceId);
    setVoicePickerOpen(false);

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewingVoiceId(null);

    if (isPlaying) {
      speakSentence(activeSentenceIndex, voiceId);
    }
  };

  // Preview an actual voice sample directly in the dropdown
  const handlePreviewVoice = async (e, voice) => {
    e.stopPropagation();

    // If currently playing preview for this voice, toggle off
    if (previewingVoiceId === voice.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingVoiceId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    setPreviewingVoiceId(voice.id);

    try {
      const sampleText = `Hello! I am ${voice.name}, your CyberGuard cybersecurity instructor.`;
      const blobUrl = await fetchAudioBlobUrl(sampleText, voice.id, 1);
      const audio = new Audio(blobUrl);
      previewAudioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoiceId(null);
      };

      audio.onerror = () => {
        setPreviewingVoiceId(null);
      };

      await audio.play();
    } catch (err) {
      console.warn("[CourseAudioNarrator] Preview failed:", err);
      setPreviewingVoiceId(null);
    }
  };

  const progressPercent =
    sentences.length > 0
      ? Math.round(((activeSentenceIndex + 1) / sentences.length) * 100)
      : 0;

  const currentSentence = sentences[activeSentenceIndex] || "";
  const estMinutes = Math.max(1, Math.round(sentences.length * 0.15));

  return (
    <>
      {/* COMPACT HIGH-END AUDIO HEADER DECK */}
      <div
        ref={mainBarRef}
        className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 relative z-20"
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
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : isPlaying ? (
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
                {currentNeuralVoice && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    Studio Neural Voice
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {isPlaying
                  ? `Sentence ${activeSentenceIndex + 1} of ${sentences.length} (${progressPercent}%)`
                  : audioError ? (
                    <span className="text-rose-600 font-semibold">{audioError}</span>
                  ) : (
                    "Click play or tap any sentence in the lesson to listen"
                  )}
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
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setVoicePickerOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <span className="truncate max-w-[130px] sm:max-w-[180px] flex items-center gap-1.5 font-bold text-slate-800">
                  {currentNeuralVoice ? (
                    <>
                      <span>{currentNeuralVoice.flag}</span>
                      <span>{currentNeuralVoice.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                        ({currentNeuralVoice.accent})
                      </span>
                    </>
                  ) : currentDeviceVoice ? (
                    <>
                      <span>💻</span>
                      <span className="truncate">{currentDeviceVoice.name.slice(0, 14)}</span>
                    </>
                  ) : (
                    <>
                      <span>🇬🇭</span>
                      <span>Ezinne</span>
                    </>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    voicePickerOpen ? "rotate-180 text-[#0056D2]" : ""
                  }`}
                />
              </button>

              {voicePickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 z-50 divide-y divide-slate-100 ring-1 ring-slate-900/10">
                  {/* Curated Studio Neural Voices Section */}
                  <div className="pb-2">
                    <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Real Studio Voices</span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold lowercase">
                        <Sparkles className="w-2.5 h-2.5" /> free neural
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {NEURAL_VOICES.map((v) => {
                        const isSelected = v.id === selectedVoiceId;
                        const isPreviewing = previewingVoiceId === v.id;

                        return (
                          <div
                            key={v.id}
                            onClick={() => handleSelectVoice(v.id)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-200/90"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base leading-none">{v.flag}</span>
                                <span className="font-bold text-slate-900 truncate">
                                  {v.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                  {v.accent}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-normal">
                                {v.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Audio Sample Preview Button */}
                              <button
                                type="button"
                                onClick={(e) => handlePreviewVoice(e, v)}
                                title={`Preview ${v.name}'s voice`}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isPreviewing
                                    ? "bg-amber-100 text-amber-800 border-amber-300 animate-pulse"
                                    : "bg-white text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-2xs"
                                }`}
                              >
                                {isPreviewing ? (
                                  <Radio className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isSelected && (
                                <Check className="w-4 h-4 text-[#0056D2]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Local Device Voices Section */}
                  {deviceVoices.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Device System Voices ({deviceVoices.length})
                      </div>
                      <div className="space-y-0.5 pt-1 max-h-32 overflow-y-auto">
                        {deviceVoices.slice(0, 8).map((v) => {
                          const isSelected = v.voiceURI === selectedVoiceId;
                          return (
                            <button
                              key={v.voiceURI}
                              type="button"
                              onClick={() => handleSelectVoice(v.voiceURI)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? "bg-blue-50 text-[#0056D2] font-bold border border-blue-200/80"
                                  : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              <span className="truncate block font-medium">
                                💻 {v.name}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#0056D2] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
        <div className="relative w-full h-1 bg-slate-100 cursor-pointer overflow-hidden rounded-b-2xl">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-[#0056D2] transition-all duration-300"
          />
        </div>

        {/* ACTIVE LIVE CAPTION BAR */}
        {isPlaying && currentSentence && (
          <div className="px-4 py-2.5 bg-blue-50/70 border-t border-blue-100/80 flex items-center gap-2.5 transition-all duration-200 rounded-b-2xl">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-blue-950 leading-relaxed truncate">
              {currentSentence}
            </p>
          </div>
        )}
      </div>

      {/* STICKY FLOATING MINI-PLAYER (When scrolled down lesson content) */}
      {isPlaying && scrolledPast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 backdrop-blur-xl transition-all duration-200 max-w-[92vw]">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
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
