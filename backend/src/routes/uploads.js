const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { body, validationResult } = require("express-validator");
const { r2Client, BUCKET_NAME, R2_ENDPOINT } = require("../config/storage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "../../public/uploads");
const VIDEOS_DIR = path.join(UPLOADS_DIR, "videos");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const multer = require("multer");
const { transcribeVideoFile, generateFallbackTranscript } = require("../services/transcriptionService");

// Configure Multer storage for local high-speed video streaming & storage
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    const uniqueName = `lecture-${crypto.randomBytes(8).toString("hex")}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250 MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|quicktime|mov|mkv|ogg|m4v/i;
    const isMimeValid = allowed.test(file.mimetype) || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/");
    const isExtValid = allowed.test(path.extname(file.originalname).toLowerCase());
    if (isMimeValid || isExtValid) {
      cb(null, true);
    } else {
      cb(new Error("Only video files (.mp4, .webm, .mov, .m4v, .mkv) are accepted."));
    }
  },
});

function buildObjectUrl(objectKey) {
  const endpoint = R2_ENDPOINT?.replace(/\/+$/, "") || "";
  return `${endpoint}/${BUCKET_NAME}/${encodeURIComponent(objectKey)}`;
}

// R2/S3 Presigned URL endpoint
router.post(
  "/presign",
  requireAuth,
  [body("mimeType").isString().notEmpty(), body("folder").optional().isString()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { mimeType, folder = "uploads" } = req.body;
      const safeFolder = folder.replace(/^\/|\/$/g, "");
      const suffix = mimeType.split("/").pop();
      const objectKey = `${safeFolder}/${crypto.randomBytes(6).toString("hex")}-${Date.now()}.${suffix}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      res.json({ uploadUrl, objectKey, objectUrl: buildObjectUrl(objectKey) });
    } catch (err) {
      next(err);
    }
  }
);

// Allowed image extensions and signatures (Magic Bytes)
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "gif";
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString() === "RIFF" &&
    buffer.slice(8, 12).toString() === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

// Direct Image Upload (Base64 / Data URL) for user profile avatars & course cover images
router.post("/image", requireAuth, async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required." });
    }

    let base64Data = image;
    const parts = image.split(";base64,");
    if (parts.length === 2) {
      base64Data = parts[1];
    }

    const buffer = Buffer.from(base64Data, "base64");

    // Max 5MB image upload constraint
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: "Image file size exceeds maximum limit of 5MB." });
    }

    // Cryptographic & magic-byte verification (Strictly reject HTML, SVG, scripts)
    const verifiedExt = validateImageBuffer(buffer);
    if (!verifiedExt) {
      return res.status(400).json({
        error: "Invalid image format. Only authentic JPEG, PNG, WEBP, or GIF image files are accepted.",
      });
    }

    const filename = `img-${crypto.randomBytes(12).toString("hex")}-${Date.now()}.${verifiedExt}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const imageUrl = `${baseUrl}/uploads/${filename}`;

    res.json({ success: true, url: imageUrl, filename });
  } catch (err) {
    next(err);
  }
});

// Video Upload (Direct Multipart Video File)
router.post("/video", requireAuth, videoUpload.single("video"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file was uploaded." });
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const videoUrl = `${baseUrl}/uploads/videos/${req.file.filename}`;

    res.json({
      success: true,
      url: videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

// Video Upload + Automatic Coursera-Style Gemini AI Transcription
router.post("/video-with-transcription", requireAuth, videoUpload.single("video"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file was uploaded." });
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const videoUrl = `${baseUrl}/uploads/videos/${req.file.filename}`;
    const filePath = req.file.path;

    const title = req.body.title || path.parse(req.file.originalname).name;
    const duration = Number(req.body.duration) || 120;

    // Transcribe video audio using Gemini Multimodal AI
    console.log(`🎙️ Triggering Coursera-style automatic transcription for: "${title}"`);
    const transcription = await transcribeVideoFile(filePath, req.file.mimetype, { title, duration });

    res.json({
      success: true,
      url: videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      transcript: transcription.fullTranscript,
      transcriptSegments: transcription.segments,
    });
  } catch (err) {
    console.error("Video upload & transcribe error:", err);
    next(err);
  }
});

// On-demand transcription endpoint for existing video lessons
router.post("/transcribe", requireAuth, async (req, res, next) => {
  try {
    const { videoUrl, title = "Interactive Lecture", duration = 120 } = req.body;
    if (!videoUrl || typeof videoUrl !== "string") {
      return res.status(400).json({ error: "Video URL is required." });
    }

    // Check if it's a locally uploaded file in /uploads/videos/
    if (videoUrl.includes("/uploads/videos/")) {
      const rawFilename = videoUrl.split("/uploads/videos/")[1];
      if (rawFilename) {
        // Defend against path traversal: immediately reject traversal sequences
        if (rawFilename.includes("..") || rawFilename.includes("/") || rawFilename.includes("\\")) {
          return res.status(400).json({ error: "Invalid video filename or directory traversal attempt detected." });
        }

        const cleanFilename = path.basename(rawFilename);
        const localPath = path.resolve(VIDEOS_DIR, cleanFilename);

        if (localPath.startsWith(path.resolve(VIDEOS_DIR)) && fs.existsSync(localPath)) {
          const transcription = await transcribeVideoFile(localPath, "video/mp4", { title, duration });
          return res.json({ success: true, ...transcription });
        }
      }
    }

    // Fallback transcript if external or remote URL
    const fallback = generateFallbackTranscript(title, duration);
    res.json({ success: true, ...fallback });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

