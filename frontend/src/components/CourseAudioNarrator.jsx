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
  CheckCircle2,
} from "lucide-react";

/**
 * Clean markdown symbols from text so SpeechSynthesis reads smooth natural English
 */
function cleanTextForSpeech(raw) {
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
function extractSentences(rawContent) {
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

  const sentences = useMemo(() => extractSentences(content), [content]);
  const currentIndexRef = useRef(activeSentenceIndex);
  const isPlayingRef = useRef(false);
  const utteranceRef = useRef(null);

  // Sync ref with controlled activeSentenceIndex
  useEffect(() => {
    currentIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load available system & browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      // Filter for English voices
      const englishVoices = allVoices.filter((v) =>
        v.lang?.toLowerCase().startsWith("en")
      );

      // Sort natural/neural and local voices first
      const sorted = (englishVoices.length > 0 ? englishVoices : allVoices).sort((a, b) => {
        const aScore = (a.name.includes("Natural") || a.name.includes("Google") || a.name.includes("Neural")) ? 1 : 0;
        const bScore = (b.name.includes("Natural") || b.name.includes("Google") || b.name.includes("Neural")) ? 1 : 0;
        return bScore - aScore;
      });

      setVoices(sorted);

      // Auto-select preferred or best voice
      if (sorted.length > 0) {
        const saved = localStorage.getItem("cg_preferred_voice");
        const match = sorted.find((v) => v.voiceURI === saved);
        if (match) {
          setSelectedVoiceURI(match.voiceURI);
        } else {
          // Default to first natural or clean English voice
          setSelectedVoiceURI(sorted[0].voiceURI);
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

  // Speak a specific sentence by index
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
    utteranceRef.current = utterance;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      if (onSentenceChange) onSentenceChange(index);
    };

    utterance.onend = () => {
      // Advance to next sentence automatically if still playing
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        if (nextIdx < sentences.length) {
          currentIndexRef.current = nextIdx;
          if (onSentenceChange) onSentenceChange(nextIdx);
          speakSentence(nextIdx);
        } else {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }
      }
    };

    utterance.onerror = (e) => {
      // Ignore user-initiated cancellation
      if (e.error === "canceled" || e.error === "interrupted") return;
      console.warn("[CourseAudioNarrator] Speech error:", e.error);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Play / Pause
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
      if (isPlaying) {
        speakSentence(nextIdx);
      }
    }
  };

  const handleSkipPrev = () => {
    const prevIdx = Math.max(0, activeSentenceIndex - 1);
    if (prevIdx !== activeSentenceIndex) {
      currentIndexRef.current = prevIdx;
      if (onSentenceChange) onSentenceChange(prevIdx);
      if (isPlaying) {
        speakSentence(prevIdx);
      }
    }
  };

  const handleSeek = (newIndex) => {
    const validIdx = Math.max(0, Math.min(sentences.length - 1, newIndex));
    currentIndexRef.current = validIdx;
    if (onSentenceChange) onSentenceChange(validIdx);
    if (isPlaying) {
      speakSentence(validIdx);
    }
  };

  const handleVoiceSelect = (voiceURI) => {
    setSelectedVoiceURI(voiceURI);
    localStorage.setItem("cg_preferred_voice", voiceURI);
    setVoicePickerOpen(false);

    // If already playing, restart current sentence with the new voice
    if (isPlaying) {
      setTimeout(() => speakSentence(activeSentenceIndex), 50);
    }
  };

  const handleRateChange = (newRate) => {
    setPlaybackRate(newRate);
    if (isPlaying) {
      setTimeout(() => speakSentence(activeSentenceIndex), 50);
    }
  };

  // Progress percentage
  const progressPercent = sentences.length > 0
    ? Math.round(((activeSentenceIndex + 1) / sentences.length) * 100)
    : 0;

  const currentSentence = sentences[activeSentenceIndex] || "Ready to begin audio narration.";
  const prevSentence = activeSentenceIndex > 0 ? sentences[activeSentenceIndex - 1] : null;
  const nextSentence = activeSentenceIndex < sentences.length - 1 ? sentences[activeSentenceIndex + 1] : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl overflow-hidden select-none">
      {/* TOP DECK: NARRATOR STATUS & VOICE CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Headphones className={`w-4 h-4 text-blue-400 ${isPlaying ? "animate-pulse" : ""}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Interactive Read-Aloud
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {title}
            </p>
          </div>
        </div>

        {/* VOICE SELECTOR & SPEED */}
        <div className="flex items-center gap-2">
          {/* Voice Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setVoicePickerOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {selectedVoice?.name ? selectedVoice.name.replace(/Google|Microsoft|English/gi, "").trim() || "Natural Voice" : "Select Voice"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Voice Dropdown Menu */}
            {voicePickerOpen && (
              <div className="absolute right-0 mt-1.5 w-64 sm:w-72 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl p-1.5 z-50 divide-y divide-slate-800">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Narrator Voice
                </div>
                <div className="space-y-0.5 pt-1">
                  {voices.map((v) => {
                    const isSelected = v.voiceURI === selectedVoiceURI;
                    return (
                      <button
                        key={v.voiceURI}
                        type="button"
                        onClick={() => handleVoiceSelect(v.voiceURI)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="truncate mr-2">{v.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {v.lang}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-0.5 text-xs font-semibold">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                  playbackRate === rate
                    ? "bg-blue-600 text-white shadow-2xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STAGE: HIGHLIGHTED READ-ALONG TELEPROMPTER CAPTION */}
      <div className="relative px-5 sm:px-8 py-8 sm:py-10 min-h-[170px] sm:min-h-[190px] flex flex-col justify-center border-b border-slate-800/80 bg-radial from-slate-900 via-slate-950 to-black">
        {/* Acoustic Waveform Visualizer */}
        <div className="absolute top-4 right-5 sm:right-8 flex items-end gap-1 h-5">
          {[12, 20, 16, 24, 10, 18, 22, 14, 20, 16].map((h, i) => (
            <div
              key={i}
              style={{
                height: isPlaying ? `${Math.max(4, (h * ((i % 3) + 1.2)) % 22)}px` : "4px",
                transition: "height 0.15s ease-in-out",
              }}
              className={`w-1 rounded-full ${
                isPlaying ? "bg-[#38BDF8] shadow-sm shadow-cyan-500/50" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Previous sentence hint */}
        {prevSentence && (
          <p className="text-xs text-slate-500 truncate mb-2 select-none opacity-60">
            {prevSentence}
          </p>
        )}

        {/* ACTIVE HIGHLIGHTED READ-ALONG SENTENCE */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 mb-2">
            <Subtitles className="w-3 h-3 text-blue-400" />
            <span>Read-Along Caption</span>
          </div>

          <p className="text-base sm:text-xl font-extrabold text-white leading-relaxed tracking-tight transition-all">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent drop-shadow-sm">
              {currentSentence}
            </span>
          </p>
        </div>

        {/* Next sentence preview */}
        {nextSentence && (
          <p className="text-xs text-slate-500 truncate mt-2 select-none opacity-60">
            {nextSentence}
          </p>
        )}
      </div>

      {/* BOTTOM DECK: AUDIO SCRUBBER & PLAYER CONTROLS */}
      <div className="px-5 sm:px-8 py-4 space-y-3 bg-slate-900/90">
        {/* Scrubber slider & Progress Labels */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max={Math.max(0, sentences.length - 1)}
            value={activeSentenceIndex}
            onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Sentence {activeSentenceIndex + 1} of {sentences.length}
            </span>
            <span className="text-blue-400 font-semibold">{progressPercent}% complete</span>
          </div>
        </div>

        {/* Playback Button Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRestart}
              title="Restart from beginning"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              title={isMuted ? "Unmute" : "Mute"}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Main Action Buttons: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSkipPrev}
              disabled={activeSentenceIndex <= 0}
              title="Previous sentence"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              title={isPlaying ? "Pause Narration" : "Listen to Lesson"}
              className={`p-3.5 rounded-2xl transition cursor-pointer shadow-lg flex items-center justify-center ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:scale-105"
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleSkipNext}
              disabled={activeSentenceIndex >= sentences.length - 1}
              title="Next sentence"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
            Tip: Highlight any word in the text for instant meaning
          </div>
        </div>
      </div>
    </div>
  );
}
