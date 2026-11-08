const express = require("express");
const crypto = require("crypto");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const router = express.Router();

/**
 * Curated list of high-fidelity, natural neural voices
 * Prioritizes West African English voices (Nigeria / Ghana context) alongside top international educator voices.
 */
const CURATED_VOICES = [
  {
    id: "en-NG-EzinneNeural",
    name: "Ezinne",
    accent: "West African (Ghana / Nigeria)",
    gender: "Female",
    description: "Warm, natural West African educator — relatable regional guide",
    flag: "🇬🇭",
    isDefault: true,
  },
  {
    id: "en-NG-AbeoNeural",
    name: "Abeo",
    accent: "West African (Ghana / Nigeria)",
    gender: "Male",
    description: "Authoritative, engaging West African tech mentor",
    flag: "🇬🇭",
    isDefault: false,
  },
  {
    id: "en-US-AriaNeural",
    name: "Aria",
    accent: "US English",
    gender: "Female",
    description: "Clear, studio-grade Coursera-style instructor",
    flag: "🇺🇸",
    isDefault: false,
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    accent: "US English",
    gender: "Male",
    description: "Casual, friendly conversational mentor",
    flag: "🇺🇸",
    isDefault: false,
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    accent: "British English",
    gender: "Female",
    description: "Crisp, formal academy lecturer",
    flag: "🇬🇧",
    isDefault: false,
  },
  {
    id: "en-GB-RyanNeural",
    name: "Ryan",
    accent: "British English",
    gender: "Male",
    description: "Deep, clear British tutor",
    flag: "🇬🇧",
    isDefault: false,
  },
  {
    id: "en-ZA-LeahNeural",
    name: "Leah",
    accent: "South African English",
    gender: "Female",
    description: "Melodic, calm African English narrator",
    flag: "🇿🇦",
    isDefault: false,
  },
];

// In-memory LRU cache for synthesized audio clips (max 500 clips to limit RAM to ~25MB)
const MAX_CACHE_ITEMS = 500;
/** @type {Map<string, { buffer: Buffer, timestamp: number }>} */
const audioCache = new Map();

/**
 * Format rate multiplier to MsEdgeTTS prosody percentage
 * @param {string|number} rate
 * @returns {string} e.g. "+25%", "-20%", "+0%"
 */
function formatProsodyRate(rate) {
  const num = parseFloat(String(rate));
  if (isNaN(num) || num === 1) return "+0%";
  const percent = Math.round((num - 1) * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
}

/**
 * GET /api/tts/voices
 * Return list of realistic voices available for course narration
 */
router.get("/voices", (req, res) => {
  res.json({
    status: "ok",
    voices: CURATED_VOICES,
  });
});

/**
 * GET /api/tts/stream
 * Stream high-fidelity synthesized audio for a given sentence or passage
 * Query params:
 *  - text: text to speak (max 1000 chars)
 *  - voice: voice ID (defaults to en-NG-EzinneNeural)
 *  - rate: speed factor (e.g. 1, 1.25, 0.8)
 */
router.get("/stream", async (req, res) => {
  try {
    const text = typeof req.query.text === "string" ? req.query.text.trim() : "";
    if (!text) {
      return res.status(400).json({ error: "Missing or empty text parameter" });
    }

    if (text.length > 1200) {
      return res.status(400).json({ error: "Text exceeds maximum sentence limit (1200 characters)" });
    }

    const requestedVoice = typeof req.query.voice === "string" ? req.query.voice.trim() : "en-NG-EzinneNeural";
    const voiceValid = CURATED_VOICES.some((v) => v.id === requestedVoice);
    const voice = voiceValid ? requestedVoice : "en-NG-EzinneNeural";

    const rateParam = typeof req.query.rate === "string" ? req.query.rate : "1";
    const prosodyRate = formatProsodyRate(rateParam);

    // Cache key based on voice, prosody, and md5 of text
    const textHash = crypto.createHash("md5").update(text).digest("hex");
    const cacheKey = `${voice}:${prosodyRate}:${textHash}`;

    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey);
      if (cached && cached.buffer) {
        res.set({
          "Content-Type": "audio/mpeg",
          "Content-Length": cached.buffer.length,
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Audio-Cache": "HIT",
        });
        return res.end(cached.buffer);
      }
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text, { rate: prosodyRate });

    /** @type {Buffer[]} */
    const chunks = [];

    audioStream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      const buffer = Buffer.concat(chunks);

      // Save to cache
      if (audioCache.size >= MAX_CACHE_ITEMS) {
        // Evict oldest entry
        const oldestKey = audioCache.keys().next().value;
        if (oldestKey) audioCache.delete(oldestKey);
      }
      audioCache.set(cacheKey, { buffer, timestamp: Date.now() });

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length,
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Audio-Cache": "MISS",
      });
      res.end(buffer);
    });

    audioStream.on("error", (err) => {
      console.error("[TTS Stream Error]:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to generate speech stream from neural provider" });
      }
    });
  } catch (error) {
    console.error("[TTS Route Error]:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error during speech synthesis" });
    }
  }
});

module.exports = router;

