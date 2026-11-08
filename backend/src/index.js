require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const incidentRoutes = require("./routes/incidents");
const tutorRoutes = require("./routes/tutors");
const uploadRoutes = require("./routes/uploads");
const cybergodRoutes = require("./routes/cybergod");
const cyberchatRoutes = require("./routes/cyberchat");
const dailyTipsRoutes = require("./routes/dailyTips");
const pushNotificationsRoutes = require("./routes/pushNotifications");
const ttsRoutes = require("./routes/tts");
const { startDailyTipsScheduler } = require("./services/dailyTipsService");
const { isTrustedClientOrigin, setClientOriginHint } = require("./utils/mailer");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Trust first reverse proxy (Render / Cloudflare / Vercel) so rate limiters see real client IPs
app.set("trust proxy", 1);
app.disable("x-powered-by");

const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // max 180 API requests per minute per IP
  message: { error: "Too many requests from this IP. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/register attempts per window
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // max 6 reset requests per 15 minutes
  message: { error: "Too many password reset requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // max 25 media upload operations per 15 minutes
  message: { error: "Upload rate limit reached. Please wait before uploading more files." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 chat messages per minute
  message: { error: "AI assistant rate limit reached. Please slow down your requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production-ready HTTP Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    xContentTypeOptions: true,
    xFrameOptions: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      if (isTrustedClientOrigin(cleanOrigin)) {
        setClientOriginHint(cleanOrigin);
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from ${origin}`), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ limit: "8mb", extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Secure Static Uploads with Content-Type Sniffing & Script Execution Protection
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../public/uploads"), {
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; media-src 'self'; img-src 'self'; style-src 'none'; script-src 'none'; sandbox");
      const safeExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov", ".m4v"];
      const ext = path.extname(filePath).toLowerCase();
      if (!safeExtensions.includes(ext)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

app.get("/health", (req, res) => res.json({ status: "ok", service: "cyberguard-ghana-backend" }));
app.get("/api/health", (req, res) => {
  const hint = typeof req.query.clientOrigin === "string" ? req.query.clientOrigin.trim().replace(/\/$/, "") : "";
  if (hint && isTrustedClientOrigin(hint)) {
    setClientOriginHint(hint);
  }
  res.json({ status: "ok", service: "cyberguard-ghana-backend" });
});

app.use("/api", globalApiLimiter);

// Rate-limited authentication & recovery endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/register-send-otp", authLimiter);
app.use("/api/auth/register-verify-otp", authLimiter);
app.use("/api/auth/register-complete", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/forgot-password", resetLimiter);
app.use("/api/auth/reset-password", resetLimiter);
app.use("/api/auth", authRoutes);

app.use("/api/courses", courseRoutes);
// Incident reporting endpoints contain internal submitLimiter; do not block CSA officer reviews
app.use("/api/incidents", incidentRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/uploads", uploadLimiter, uploadRoutes);
app.use("/api/cybergod/chat", aiLimiter);
app.use("/api/cybergod", cybergodRoutes);
app.use("/api/cyberchat", cyberchatRoutes);
app.use("/api/daily-tips", dailyTipsRoutes);
app.use("/api/push", pushNotificationsRoutes);
app.use("/api/tts", ttsRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CyberGuard Ghana backend listening on port ${PORT}`);
  startDailyTipsScheduler();
});

module.exports = app;
