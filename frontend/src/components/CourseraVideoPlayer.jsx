import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Search,
  Copy,
  Check,
  Download,
  Sparkles,
  Subtitles,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  Settings2,
} from "lucide-react";
import api from "../utils/api";

/**
 * Coursera-Style Interactive Video Player with Synchronized Live Transcripts
 *
 * Features:
 * - HTML5 Video playback with custom controls, speed selection, volume, fullscreen
 * - Live CC (Closed Caption) subtitle overlay synced with current playback
 * - Synchronized Interactive Transcript with live highlighted active segment
 * - Click-to-seek: clicking any timestamp immediately seeks video
 * - Keyword search filter within transcript
 * - Auto-scroll toggle (keeps active transcript line in view)
 * - Copy / Download transcript
 * - On-demand Gemini AI transcription trigger
 */
export default function CourseraVideoPlayer({ lesson, onLessonUpdate }) {
  const videoRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const activeSegmentRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCC, setShowCC] = useState(true);

  // Transcript state
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // Parse segments from lesson
  const rawSegments = lesson?.transcriptSegments;
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : typeof rawSegments === "string"
    ? (() => {
        try {
          return JSON.parse(rawSegments);
        } catch {
          return [];
        }
      })()
    : [];

  // Identify active segment based on currentTime
  const activeSegmentIndex = segments.findIndex((seg, idx) => {
    const nextSeg = segments[idx + 1];
    const segStart = typeof seg.seconds === "number" ? seg.seconds : 0;
    const segEnd = nextSeg ? nextSeg.seconds : duration || segStart + 20;
    return currentTime >= segStart && currentTime < segEnd;
  });

  const activeSegment = activeSegmentIndex !== -1 ? segments[activeSegmentIndex] : null;

  // Sync video time updates
  function handleTimeUpdate() {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }

  function handleLoadedMetadata() {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }

  // Smoothly scroll active segment into view if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && activeSegmentRef.current && transcriptContainerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentIndex, autoScroll]);

  // Play/Pause
  function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }

  // Seek video
  function seekTo(seconds) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }

  // Skip -10s or +10s
  function skip(delta) {
    if (!videoRef.current) return;
    const next = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    seekTo(next);
  }

  // Volume
  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  }

  // Speed
  function changeSpeed(rate) {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }

  // Fullscreen
  function toggleFullscreen() {
    const el = document.getElementById("coursera-player-container");
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // Format seconds to MM:SS
  function formatSeconds(secs) {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Copy transcript
  function copyTranscript() {
    const text = lesson?.transcript || segments.map((s) => `[${s.start}] ${s.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Download transcript
  function downloadTranscript() {
    const text = lesson?.transcript || segments.map((s) => `[${s.start}] ${s.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lesson?.title || "lesson"}-transcript.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // On-demand AI Transcribe
  async function handleAITranscribe() {
    if (!lesson?.id) return;
    setTranscribing(true);
    try {
      const res = await api.post(`/courses/lessons/${lesson.id}/transcribe`);
      if (onLessonUpdate) {
        onLessonUpdate(res.data);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      alert("Unable to transcribe video. Please verify your connection or try again.");
    } finally {
      setTranscribing(false);
    }
  }

  // Filter segments by search query
  const filteredSegments = segments.filter((seg) =>
    searchQuery.trim() ? seg.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="space-y-6" id="coursera-player-container">
      {/* ------------------------------------------------------------ */}
      {/* COURSERA VIDEO PLAYER BOX */}
      {/* ------------------------------------------------------------ */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group">
        {/* Video Element */}
        <div className="relative aspect-video w-full flex items-center justify-center bg-black">
          {lesson?.videoUrl ? (
            <video
              ref={videoRef}
              src={lesson.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              playsInline
            />
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No video stream linked to this lesson.</p>
            </div>
          )}

          {/* Subtitle / Closed Caption Overlay (Coursera Style) */}
          {showCC && activeSegment && isPlaying && (
            <div className="absolute bottom-16 inset-x-8 text-center pointer-events-none z-10 transition-opacity duration-200">
              <span className="inline-block bg-black/85 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-lg backdrop-blur-md shadow-lg border border-white/10 max-w-2xl">
                {activeSegment.text}
              </span>
            </div>
          )}

          {/* Big Center Play Button when paused */}
          {!isPlaying && lesson?.videoUrl && (
            <button
              onClick={togglePlay}
              className="absolute w-20 h-20 rounded-full bg-[#0056D2]/90 hover:bg-[#0056D2] text-white flex items-center justify-center shadow-2xl shadow-blue-600/50 hover:scale-110 transition cursor-pointer z-10"
              aria-label="Play Video"
            >
              <Play className="w-9 h-9 fill-current ml-1" />
            </button>
          )}
        </div>

        {/* Video Controls Bar */}
        {lesson?.videoUrl && (
          <div className="bg-slate-900/95 border-t border-slate-800 p-3 sm:p-4 space-y-2.5 text-white">
            {/* Scrubber / Progress Bar */}
            <div className="relative flex items-center group/scrub cursor-pointer">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0056D2] hover:h-2.5 transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left: Play, Skip, Time */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => skip(10)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Current / Duration Time */}
                <div className="font-mono text-slate-300 text-[11px] select-none">
                  <span className="text-white font-bold">{formatSeconds(currentTime)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>

              {/* Right: Volume, CC, Speed, Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Volume slider */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0056D2]"
                  />
                </div>

                {/* Subtitles (CC) Toggle */}
                <button
                  onClick={() => setShowCC(!showCC)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border transition ${
                    showCC
                      ? "bg-[#0056D2] border-[#0056D2] text-white"
                      : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title="Toggle Closed Captions"
                >
                  CC
                </button>

                {/* Playback Rate Dropdown */}
                <div className="relative group/speed">
                  <select
                    value={playbackRate}
                    onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-2 py-1 rounded-md border border-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* COURSERA INTERACTIVE SYNCHRONIZED TRANSCRIPT SECTION */}
      {/* ------------------------------------------------------------ */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        {/* Transcript Toolbar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#0056D2] dark:text-blue-400 flex items-center justify-center font-bold">
              <Subtitles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Interactive Transcript
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#0056D2] dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900">
                  Coursera Synced
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any timestamp to jump directly to that point in the lecture.
              </p>
            </div>
          </div>

          {/* Toolbar Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>

            {/* Auto-scroll Toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                autoScroll
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
              title="Automatically follow playback"
            >
              <span className={`w-2 h-2 rounded-full ${autoScroll ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              Auto-scroll
            </button>

            {/* Copy Button */}
            <button
              onClick={copyTranscript}
              disabled={segments.length === 0}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 disabled:opacity-40"
              title="Copy entire transcript to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={downloadTranscript}
              disabled={segments.length === 0}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition disabled:opacity-40"
              title="Download transcript (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* AI Re-Transcribe Button */}
            <button
              onClick={handleAITranscribe}
              disabled={transcribing || !lesson?.id}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Generate or refresh timestamped transcript with Gemini AI"
            >
              {transcribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{transcribing ? "Transcribing…" : "AI Transcribe"}</span>
            </button>
          </div>
        </div>

        {/* Transcript Body */}
        <div
          ref={transcriptContainerRef}
          className="p-4 sm:p-6 max-h-96 overflow-y-auto space-y-2.5 custom-scrollbar text-xs leading-relaxed"
        >
          {segments.length === 0 ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#0056D2] dark:text-blue-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">No Transcript Available Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lesson?.videoUrl
                    ? "Generate Coursera-style synchronized timestamps with Gemini AI."
                    : "Upload a video file in Course Studio to generate automatic transcripts."}
                </p>
              </div>

              {lesson?.videoUrl && (
                <button
                  onClick={handleAITranscribe}
                  disabled={transcribing}
                  className="inline-flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419E] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Transcript Now
                </button>
              )}
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No matching transcript text found for "{searchQuery}".
            </div>
          ) : (
            filteredSegments.map((seg, idx) => {
              const isActive = activeSegment && activeSegment.id === seg.id;
              return (
                <div
                  key={seg.id || idx}
                  ref={isActive ? activeSegmentRef : null}
                  onClick={() => seekTo(seg.seconds || 0)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-3 group/seg ${
                    isActive
                      ? "bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white shadow-xs font-medium"
                      : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-transparent"
                  }`}
                >
                  {/* Timestamp Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(seg.seconds || 0);
                    }}
                    className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                      isActive
                        ? "bg-[#0056D2] text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-[#0056D2] dark:text-blue-400 group-hover/seg:bg-blue-600 group-hover/seg:text-white"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{seg.start}</span>
                  </button>

                  {/* Segment Text */}
                  <p className="flex-1 select-text">
                    {searchQuery.trim() ? (
                      // Highlight matched query in text
                      highlightMatch(seg.text, searchQuery)
                    ) : (
                      seg.text
                    )}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Utility to highlight search query matches in transcript
function highlightMatch(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-0.5 rounded font-bold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
