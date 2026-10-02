require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const incidentRoutes = require("./routes/incidents");
const path = require("path");
const tutorRoutes = require("./routes/tutors");
const uploadRoutes = require("./routes/uploads");
const cybergodRoutes = require("./routes/cybergod");
const cyberchatRoutes = require("./routes/cyberchat");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const rateLimit = require("express-rate-limit");

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
    contentSecurityPolicy: false, // Managed per frontend or reverse-proxy
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
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Secure Static Uploads with Content-Type Sniffing Protection
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../public/uploads"), {
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      const safeExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mov"];
      const ext = path.extname(filePath).toLowerCase();
      if (!safeExtensions.includes(ext)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

app.get("/health", (req, res) => res.json({ status: "ok", service: "cyberguard-ghana-backend" }));

// Rate-limited authentication & recovery endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/forgot-password", resetLimiter);
app.use("/api/auth/reset-password", resetLimiter);
app.use("/api/auth", authRoutes);

app.use("/api/courses", courseRoutes);
// Incident reporting endpoints contain internal submitLimiter; do not block CSA officer reviews
app.use("/api/incidents", incidentRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/cybergod/chat", aiLimiter);
app.use("/api/cybergod", cybergodRoutes);
app.use("/api/cyberchat", cyberchatRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CyberGuard Ghana backend listening on port ${PORT}`);
});

module.exports = app;
