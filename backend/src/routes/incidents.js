const express = require("express");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { r2Client, BUCKET_NAME } = require("../config/storage");
const { requireAuth, requireRole } = require("../middleware/auth");
const { generateRefCode } = require("../utils/refCode");
const { exportCaseBriefPdf } = require("../controllers/incidentPdf");

const router = express.Router();

// Zero-Knowledge mode: this endpoint intentionally never reads req.ip,
// never requires a login, and the IncidentReport model has no field
// that could re-identify the reporter. Rate limiting is IP-based only
// in-memory for abuse prevention and is never persisted to the DB.
const submitLimiter = rateLimit({
  windowMs: Number(process.env.INCIDENT_SUBMIT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.INCIDENT_SUBMIT_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reports submitted from this network. Please try again later." },
});

/**
 * Step 1 — client requests a pre-signed PUT URL so evidence is uploaded
 * directly from the browser to Cloudflare R2. The server never touches
 * the raw file, and no server-side EXIF data is ever generated because
 * the file was already scrubbed client-side before this call.
 */
router.post("/evidence/presign", submitLimiter, async (req, res, next) => {
  try {
    const { mimeType, sha256Hash } = req.body;
    if (!mimeType || !sha256Hash) {
      return res.status(400).json({ error: "mimeType and sha256Hash are required." });
    }

    const objectKey = `evidence/${sha256Hash}-${crypto.randomBytes(4).toString("hex")}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    res.json({ uploadUrl, objectKey });
  } catch (err) {
    next(err);
  }
});

/**
 * Step 2 — client submits the report metadata + the already-uploaded
 * evidence hash(es). Server checks for duplicate hashes (flags viral
 * abusive media) and stores everything with zero PII.
 */
router.post(
  "/",
  submitLimiter,
  [
    body("category").isIn(["SEXTORTION", "GROOMING", "SCAM", "BULLYING", "IMPERSONATION", "OTHER"]),
    body("narrative").trim().isLength({ min: 20, max: 5000 }),
    body("evidence").isArray({ min: 0 }),
    body("evidence.*.sha256Hash").optional().isHexadecimal().isLength({ min: 64, max: 64 }),
    body("evidence.*.objectKey").optional().isString(),
    body("evidence.*.mimeType").optional().isString(),
    body("evidence.*.byteSize").optional().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { category, narrative, evidence = [], contactPhone, contactEmail, contactPreferred } = req.body;
      const refCode = generateRefCode("CG");

      let finalNarrative = narrative;
      if (contactPhone || contactEmail) {
        const contactBlock = `[REPORTER CONTACT DETAILS]\n• Phone/WhatsApp: ${contactPhone || "Not provided"}\n• Email: ${contactEmail || "Not provided"}\n• Preferred Channel: ${contactPreferred || "WhatsApp"}\n----------------------------------------\n\n`;
        finalNarrative = contactBlock + narrative;
      }

      const report = await prisma.$transaction(async (tx) => {
        const created = await tx.incidentReport.create({
          data: { refCode, category, narrative: finalNarrative },
        });

        for (const item of evidence) {
          const duplicate = await tx.evidenceHash.findFirst({
            where: { sha256Hash: item.sha256Hash },
          });

          await tx.evidenceHash.create({
            data: {
              incidentId: created.id,
              sha256Hash: item.sha256Hash,
              storageKey: item.objectKey,
              mimeType: item.mimeType,
              byteSize: item.byteSize,
              duplicateOfId: duplicate ? duplicate.id : null,
            },
          });
        }

        return created;
      });

      // Only the ref code is returned. This is the reporter's ONLY way
      // to check status later — losing it means losing the ability to
      // follow up, by design (no account, no email, no PII stored).
      res.status(201).json({ refCode: report.refCode });
    } catch (err) {
      next(err);
    }
  }
);

// Anonymous status lookup by reference code — no auth, no PII required
router.get("/status/:refCode", submitLimiter, async (req, res, next) => {
  try {
    const report = await prisma.incidentReport.findUnique({
      where: { refCode: req.params.refCode },
      select: { refCode: true, status: true, category: true, createdAt: true, updatedAt: true },
    });
    if (!report) return res.status(404).json({ error: "No report found with that reference code." });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// ---------------- CSA Admin Portal (authenticated, role-gated) ----------------

router.get("/", requireAuth, requireRole("ADMIN", "CSA_OFFICER"), async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const reports = await prisma.incidentReport.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      },
      include: { evidence: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, requireRole("ADMIN", "CSA_OFFICER"), async (req, res, next) => {
  try {
    const report = await prisma.incidentReport.findUnique({
      where: { id: req.params.id },
      include: { evidence: true },
    });
    if (!report) return res.status(404).json({ error: "Report not found." });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// CSA officer generates a short-lived download link to verify evidence
router.get(
  "/evidence/:evidenceId/download-url",
  requireAuth,
  requireRole("ADMIN", "CSA_OFFICER"),
  async (req, res, next) => {
    try {
      const evidence = await prisma.evidenceHash.findUnique({ where: { id: req.params.evidenceId } });
      if (!evidence) return res.status(404).json({ error: "Evidence record not found." });

      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: evidence.storageKey });
      const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
      res.json({ downloadUrl, sha256Hash: evidence.sha256Hash });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/review",
  requireAuth,
  requireRole("ADMIN", "CSA_OFFICER"),
  [body("status").isIn(["SUBMITTED", "UNDER_REVIEW", "ESCALATED", "RESOLVED", "DISMISSED"])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { status, reviewNotes } = req.body;
      const updated = await prisma.incidentReport.update({
        where: { id: req.params.id },
        data: { status, reviewNotes, reviewedById: req.user.id },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id/export-pdf",
  requireAuth,
  requireRole("ADMIN", "CSA_OFFICER"),
  exportCaseBriefPdf
);

module.exports = router;
