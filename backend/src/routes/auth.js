const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  isTrustedClientOrigin,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOtpVerificationEmail,
} = require("../utils/mailer");

// Precomputed 12-round bcrypt hash used to equalize timing when login email does not exist
const DUMMY_BCRYPT_HASH = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

const router = express.Router();

function calculateAgeBandFromDob(dobInput) {
  if (!dobInput) return { ageBand: "JUNIOR", age: null, birthDate: null };
  const birthDate = new Date(dobInput);
  if (isNaN(birthDate.getTime())) {
    return { ageBand: "JUNIOR", age: null, birthDate: null };
  }
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  const ageBand = age <= 18 ? "JUNIOR" : "YOUNG_ADULT";
  return { ageBand, age, birthDate };
}

async function allocateCoursesForUser(tx, userId, ageBand) {
  const matchingCourses = await tx.course.findMany({
    where: { isPublished: true, ageBand },
    select: {
      id: true,
      title: true,
      category: true,
      slug: true,
      coverImageUrl: true,
      ageBand: true,
    },
    take: 3,
    orderBy: { createdAt: "asc" },
  });

  if (matchingCourses.length > 0) {
    await tx.enrollment.createMany({
      data: matchingCourses.map((c) => ({
        userId,
        courseId: c.id,
        status: "ACTIVE",
        progressPct: 0,
      })),
      skipDuplicates: true,
    });
  }

  return matchingCourses;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      tokenVersion: typeof user.tokenVersion === "number" ? user.tokenVersion : 0,
      purpose: "session",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      algorithm: "HS256",
    }
  );
}

function getRequestOrigin(req) {
  if (req.headers.origin && typeof req.headers.origin === "string") {
    const cleaned = req.headers.origin.trim().replace(/\/$/, "");
    if (isTrustedClientOrigin(cleaned)) return cleaned;
  }
  if (req.headers.referer && typeof req.headers.referer === "string") {
    try {
      const origin = new URL(req.headers.referer).origin;
      if (isTrustedClientOrigin(origin)) return origin;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Safely deletes a user and cleans up or reassigns all foreign-key dependencies
 * inside an atomic transaction while preserving anonymized email audit logs.
 */
async function deleteUserAccountCleanly(targetUserId) {
  return prisma.$transaction(async (tx) => {
    // 1. Detach user reference from historical daily tip email logs so audit logs remain intact
    await tx.dailyTipEmailLog.updateMany({
      where: { userId: targetUserId },
      data: { userId: null },
    });

    // 2. Clean up bookings made as a student and free future unstarted tutor slots
    const studentBookings = await tx.booking.findMany({
      where: { studentId: targetUserId },
      select: { slotId: true },
    });
    const bookedSlotIds = studentBookings.map((b) => b.slotId).filter(Boolean);

    if (studentBookings.length > 0) {
      await tx.booking.deleteMany({ where: { studentId: targetUserId } });
    }
    if (bookedSlotIds.length > 0) {
      await tx.availabilitySlot.updateMany({
        where: { id: { in: bookedSlotIds }, startsAt: { gt: new Date() } },
        data: { isBooked: false },
      });
    }

    // 3. Clean up TutorProfile, tutor bookings, and availability slots if user is a tutor
    const tutorProfile = await tx.tutorProfile.findUnique({
      where: { userId: targetUserId },
      select: { id: true },
    });
    if (tutorProfile) {
      await tx.booking.deleteMany({ where: { tutorId: tutorProfile.id } });
      await tx.availabilitySlot.deleteMany({ where: { tutorId: tutorProfile.id } });
      await tx.tutorProfile.delete({ where: { id: tutorProfile.id } });
    }

    // 4. Delete quiz attempts, certificates, and enrollments belonging to this user
    await tx.quizAttempt.deleteMany({ where: { userId: targetUserId } });
    await tx.certificate.deleteMany({ where: { userId: targetUserId } });
    await tx.enrollment.deleteMany({ where: { userId: targetUserId } });

    // 5. Handle authored courses: reassign to an active admin so students keep enrolled courses
    const authoredCourses = await tx.course.findMany({
      where: { authorId: targetUserId },
      select: { id: true },
    });
    if (authoredCourses.length > 0) {
      const fallbackAdmin = await tx.user.findFirst({
        where: { role: "ADMIN", id: { not: targetUserId } },
        select: { id: true },
      });
      if (fallbackAdmin) {
        await tx.course.updateMany({
          where: { authorId: targetUserId },
          data: { authorId: fallbackAdmin.id },
        });
      } else {
        const courseIds = authoredCourses.map((c) => c.id);
        await tx.quizAttempt.deleteMany({
          where: { quiz: { lesson: { module: { courseId: { in: courseIds } } } } },
        });
        await tx.certificate.deleteMany({ where: { courseId: { in: courseIds } } });
        await tx.enrollment.deleteMany({ where: { courseId: { in: courseIds } } });
        await tx.course.deleteMany({ where: { id: { in: courseIds } } });
      }
    }

    // 6. Delete user (cascades ChatSession, UserPublicKey, ConversationParticipant, SecureMessage, FriendRequest)
    await tx.user.delete({ where: { id: targetUserId } });
  });
}

router.post(
  "/register-send-otp",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long."),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg, errors: errors.array() });
      }

      const { email, password, dateOfBirth } = req.body;

      // Validate Date of Birth and age limits
      const { age, ageBand, birthDate } = calculateAgeBandFromDob(dateOfBirth);
      if (!birthDate || age === null || age < 10 || age > 100) {
        return res.status(400).json({
          error: "Please enter a valid date of birth (minimum 10 years old).",
        });
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      // Check if an unexpired OTP was dispatched in the last 45 seconds to prevent spamming
      const existingVerification = await prisma.emailVerification.findUnique({
        where: { email },
      });
      if (
        existingVerification &&
        existingVerification.createdAt &&
        Date.now() - new Date(existingVerification.createdAt).getTime() < 45 * 1000
      ) {
        const remainingSec = Math.ceil(
          (45 * 1000 - (Date.now() - new Date(existingVerification.createdAt).getTime())) / 1000
        );
        return res.status(429).json({
          error: `Please wait ${remainingSec} seconds before requesting another code.`,
        });
      }

      // Generate cryptographically secure 6-digit numeric code
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.emailVerification.upsert({
        where: { email },
        update: {
          otpHash,
          expiresAt,
          verified: false,
          attempts: 0,
          createdAt: new Date(),
        },
        create: {
          email,
          otpHash,
          expiresAt,
          verified: false,
          attempts: 0,
        },
      });

      // Dispatch verification email
      const requestOrigin = getRequestOrigin(req);
      try {
        await sendOtpVerificationEmail(email, otpCode, { clientOrigin: requestOrigin });
      } catch (mailErr) {
        console.error(`[Mailer] OTP email dispatch to ${email} failed:`, mailErr.message);
        return res.status(500).json({
          error: "Unable to send verification code email. Please check the address or try again shortly.",
        });
      }

      res.json({
        success: true,
        message: "Verification code sent to your email.",
        email,
        expiresAt,
        estimatedAge: age,
        ageBand,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/register-verify-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("otp")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("Verification code must be 6 digits."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg, errors: errors.array() });
      }

      const { email, otp } = req.body;
      const verification = await prisma.emailVerification.findUnique({
        where: { email },
      });

      if (!verification) {
        return res.status(400).json({
          error: "No active verification found for this email. Please request a new code.",
        });
      }

      if (verification.expiresAt < new Date()) {
        return res.status(400).json({
          error: "Verification code has expired. Please request a new code.",
        });
      }

      if (verification.attempts >= 5) {
        return res.status(429).json({
          error: "Too many failed attempts. Please request a new code.",
        });
      }

      const isValid = await bcrypt.compare(otp, verification.otpHash);
      if (!isValid) {
        await prisma.emailVerification.update({
          where: { email },
          data: { attempts: { increment: 1 } },
        });
        return res.status(400).json({
          error: "Invalid 6-digit code. Please check your inbox and try again.",
        });
      }

      // Mark verified and issue a 30-minute registration completion token
      await prisma.emailVerification.update({
        where: { email },
        data: { verified: true },
      });

      const verificationToken = jwt.sign(
        { email, purpose: "registration_verified" },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      res.json({
        success: true,
        message: "Email verified successfully.",
        verificationToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/register-complete",
  [
    body("verificationToken").notEmpty().withMessage("Verification token is required."),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
    body("dateOfBirth").notEmpty().withMessage("Date of birth is required."),
    body("displayName").trim().isLength({ min: 2 }).withMessage("Full name must be at least 2 characters."),
    body("avatarUrl").optional({ nullable: true }),
    body("phoneNumber").optional({ nullable: true }),
    body("bio").optional({ nullable: true }),
    body("receiveDailyTips").optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg, errors: errors.array() });
      }

      const {
        verificationToken,
        email,
        password,
        dateOfBirth,
        displayName,
        avatarUrl,
        phoneNumber,
        bio,
        receiveDailyTips,
      } = req.body;

      // Cryptographically verify completion token
      let decoded;
      try {
        decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
      } catch (tokenErr) {
        return res.status(401).json({
          error: "Verification session expired. Please verify your email again.",
        });
      }

      if (
        !decoded ||
        decoded.purpose !== "registration_verified" ||
        decoded.email?.toLowerCase() !== email.toLowerCase()
      ) {
        return res.status(401).json({
          error: "Invalid verification session. Please verify your email again.",
        });
      }

      // Calculate age and learning track
      const { ageBand, age, birthDate } = calculateAgeBandFromDob(dateOfBirth);
      if (!birthDate) {
        return res.status(400).json({ error: "Invalid date of birth provided." });
      }

      // Check if user already registered in the meantime
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      let allocatedCourses = [];
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            displayName: displayName.trim(),
            dateOfBirth: birthDate,
            ageBand,
            role: "STUDENT",
            avatarUrl: avatarUrl || null,
            phoneNumber: phoneNumber ? phoneNumber.trim() : null,
            bio: bio ? bio.trim() : null,
            receiveDailyTips: Boolean(receiveDailyTips),
          },
        });

        // Automatically allocate matching courses for this student's learning track
        allocatedCourses = await allocateCoursesForUser(tx, newUser.id, ageBand);

        // Clean up verification record
        await tx.emailVerification.deleteMany({ where: { email } });

        return newUser;
      });

      // Send welcome email
      const requestOrigin = getRequestOrigin(req);
      const hasBackendSmtp = Boolean((process.env.SMTP_PASS || "").trim());
      if (hasBackendSmtp) {
        sendWelcomeEmail(user.email, user.displayName, {
          receiveDailyTips: user.receiveDailyTips,
          clientOrigin: requestOrigin,
        }).catch((err) => {
          console.error(`[Mailer] Welcome email to ${user.email} failed:`, err.message);
        });
      }

      const token = signToken(user);

      res.status(201).json({
        token,
        isNewUser: true,
        welcomeDispatchedByBackend: hasBackendSmtp,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          ageBand: user.ageBand,
          dateOfBirth: user.dateOfBirth,
          receiveDailyTips: user.receiveDailyTips,
        },
        allocatedCourses,
        age,
        ageBand,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/register",
  [
    body("verificationToken").notEmpty().withMessage("Email verification is required before creating an account."),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
    body("displayName").trim().isLength({ min: 2 }),
    body("ageBand").optional().isIn(["JUNIOR", "YOUNG_ADULT"]),
    body("dateOfBirth").optional(),
    body("receiveDailyTips").optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg, errors: errors.array() });
      }

      const { verificationToken, email, password, displayName, avatarUrl, receiveDailyTips, dateOfBirth } = req.body;

      let decoded;
      try {
        decoded = jwt.verify(verificationToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      } catch {
        return res.status(401).json({
          error: "Verification session expired. Please verify your email again.",
        });
      }

      if (
        !decoded ||
        decoded.purpose !== "registration_verified" ||
        decoded.email?.toLowerCase() !== email.toLowerCase()
      ) {
        return res.status(401).json({
          error: "Invalid verification session. Please verify your email again.",
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      let effectiveAgeBand = req.body.ageBand || "JUNIOR";
      let birthDate = null;
      let calculatedAge = null;
      if (dateOfBirth) {
        const derived = calculateAgeBandFromDob(dateOfBirth);
        effectiveAgeBand = derived.ageBand;
        birthDate = derived.birthDate;
        calculatedAge = derived.age;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      let allocatedCourses = [];
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            displayName,
            dateOfBirth: birthDate,
            ageBand: effectiveAgeBand,
            role: "STUDENT",
            avatarUrl,
            receiveDailyTips: Boolean(receiveDailyTips),
          },
        });

        allocatedCourses = await allocateCoursesForUser(tx, newUser.id, effectiveAgeBand);
        await tx.emailVerification.deleteMany({ where: { email } });
        return newUser;
      });

      // Send personalized welcome email automatically upon first-time registration
      const requestOrigin = getRequestOrigin(req);
      const hasBackendSmtp = Boolean((process.env.SMTP_PASS || "").trim());
      if (hasBackendSmtp) {
        sendWelcomeEmail(user.email, user.displayName, {
          receiveDailyTips: user.receiveDailyTips,
          clientOrigin: requestOrigin,
        }).catch((err) => {
          console.error(`[Mailer] Welcome email to ${user.email} failed:`, err.message);
        });
      }

      const token = signToken(user);
      res.status(201).json({
        token,
        isNewUser: true,
        welcomeDispatchedByBackend: hasBackendSmtp,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          ageBand: user.ageBand,
          dateOfBirth: user.dateOfBirth,
          receiveDailyTips: user.receiveDailyTips,
        },
        allocatedCourses,
        age: calculatedAge,
        ageBand: effectiveAgeBand,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Google OAuth Sign In / Sign Up endpoint with cryptographic ID token verification
router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string" || !credential.trim()) {
      return res.status(400).json({ error: "Google OAuth ID credential is required." });
    }

    // Cryptographically verify ID token against Google's tokeninfo API
    let tokenData = null;
    try {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`);
      if (resp.ok) {
        tokenData = await resp.json();
      }
    } catch (e) {
      console.warn("Google token verification network error:", e.message);
      return res.status(503).json({ error: "Google authentication service is currently unreachable." });
    }

    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ error: "Invalid or expired Google OAuth credential." });
    }

    // Verify issuer
    if (
      tokenData.iss &&
      tokenData.iss !== "accounts.google.com" &&
      tokenData.iss !== "https://accounts.google.com"
    ) {
      return res.status(401).json({ error: "Invalid Google OAuth token issuer." });
    }

    // Verify email address is verified by Google
    if (tokenData.email_verified === "false" || tokenData.email_verified === false) {
      return res.status(401).json({ error: "Unverified Google email address." });
    }

    // Verify audience against GOOGLE_CLIENT_ID
    const configuredClientId = process.env.GOOGLE_CLIENT_ID
      ? process.env.GOOGLE_CLIENT_ID.trim().replace(/^["']|["']$/g, "")
      : "";
    if (configuredClientId && tokenData.aud?.trim() !== configuredClientId) {
      console.warn(`[OAuth] Client ID mismatch. Token aud: "${tokenData.aud}", Configured: "${configuredClientId}"`);
      return res.status(401).json({ error: "Google OAuth client ID mismatch." });
    }

    const verifiedEmail = tokenData.email.trim().toLowerCase();
    const displayName = tokenData.name || verifiedEmail.split("@")[0];
    const avatarUrl = tokenData.picture || null;
    // Google OAuth users automatically get daily cyber tips without checking any box
    const optedInDailyTips = true;

    let user = await prisma.user.findUnique({ where: { email: verifiedEmail } });
    let isNewUser = false;
    let allocatedCourses = [];
    const hasBackendSmtp = Boolean((process.env.SMTP_PASS || "").trim());

    if (!user) {
      isNewUser = true;
      let effectiveAgeBand = "JUNIOR";
      let birthDate = null;
      if (req.body.dateOfBirth) {
        const derived = calculateAgeBandFromDob(req.body.dateOfBirth);
        effectiveAgeBand = derived.ageBand;
        birthDate = derived.birthDate;
      }

      const dummyPassword = await bcrypt.hash(`Google_${Date.now()}_${Math.random()}`, 12);
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: verifiedEmail,
            passwordHash: dummyPassword,
            displayName,
            avatarUrl,
            role: "STUDENT",
            ageBand: effectiveAgeBand,
            dateOfBirth: birthDate,
            receiveDailyTips: true,
            receiveDailyPushTips: true,
          },
        });

        allocatedCourses = await allocateCoursesForUser(tx, newUser.id, effectiveAgeBand);
        return newUser;
      });

      // Send personalized welcome email automatically for first-time Google OAuth signups
      if (hasBackendSmtp) {
        const requestOrigin = getRequestOrigin(req);
        sendWelcomeEmail(user.email, user.displayName, {
          receiveDailyTips: user.receiveDailyTips,
          clientOrigin: requestOrigin,
        }).catch((err) => {
          console.error(`[Mailer] Google signup welcome email to ${user.email} failed:`, err.message);
        });
      }
    } else {
      const googleUpdates = {};
      if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes("googleusercontent.com") || user.avatarUrl.includes("default-user"))) {
        googleUpdates.avatarUrl = avatarUrl;
      }
      if (!user.receiveDailyTips) {
        googleUpdates.receiveDailyTips = true;
      }
      if (!user.receiveDailyPushTips) {
        googleUpdates.receiveDailyPushTips = true;
      }
      if (Object.keys(googleUpdates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: googleUpdates,
        });
      }
    }

    const token = signToken(user);
    res.json({
      token,
      isNewUser,
      welcomeDispatchedByBackend: isNewUser ? hasBackendSmtp : false,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        ageBand: user.ageBand,
        dateOfBirth: user.dateOfBirth,
        receiveDailyTips: user.receiveDailyTips,
      },
      allocatedCourses,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          ageBand: user.ageBand,
          receiveDailyTips: user.receiveDailyTips,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        ageBand: true,
        dateOfBirth: true,
        avatarUrl: true,
        phoneNumber: true,
        bio: true,
        receiveDailyTips: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/me",
  requireAuth,
  [
    body("displayName").optional().trim().isLength({ min: 2 }).withMessage("Display name must be at least 2 characters."),
    body("avatarUrl").optional({ nullable: true }),
    body("phoneNumber").optional({ nullable: true }),
    body("bio").optional({ nullable: true }),
    body("ageBand").optional().isIn(["JUNIOR", "YOUNG_ADULT"]),
    body("dateOfBirth").optional({ nullable: true }),
    body("receiveDailyTips").optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { displayName, ageBand, dateOfBirth, avatarUrl, phoneNumber, bio, receiveDailyTips } = req.body;
      const dataToUpdate = {};
      if (displayName !== undefined) dataToUpdate.displayName = displayName.trim();
      if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl || null;
      if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
      if (bio !== undefined) dataToUpdate.bio = bio ? bio.trim() : null;
      if (typeof receiveDailyTips === "boolean") dataToUpdate.receiveDailyTips = receiveDailyTips;

      if (dateOfBirth !== undefined) {
        if (!dateOfBirth) {
          dataToUpdate.dateOfBirth = null;
        } else {
          const derived = calculateAgeBandFromDob(dateOfBirth);
          dataToUpdate.dateOfBirth = derived.birthDate;
          dataToUpdate.ageBand = derived.ageBand;
        }
      } else if (ageBand !== undefined) {
        dataToUpdate.ageBand = ageBand;
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          ageBand: true,
          dateOfBirth: true,
          avatarUrl: true,
          phoneNumber: true,
          bio: true,
          receiveDailyTips: true,
          createdAt: true,
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Self-service Account Deletion: permanently deletes the authenticated user's account and records
router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User account not found." });
    }

    // Prevent locking out platform governance if this is the sole ADMIN account
    if (existingUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return res.status(400).json({
          error: "Cannot delete the sole Superadmin account. Promote another administrator first.",
        });
      }
    }

    await deleteUserAccountCleanly(existingUser.id);
    res.json({
      success: true,
      message: "Your account and personal data have been permanently deleted.",
    });
  } catch (err) {
    next(err);
  }
});

// Admin Managerial: list all platform users
router.get("/users", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { displayName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        ageBand: true,
        avatarUrl: true,
        receiveDailyTips: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Admin Managerial: change a user's role (STUDENT, TUTOR, ADMIN, CSA_OFFICER)
router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("ADMIN"),
  [body("role").isIn(["STUDENT", "TUTOR", "ADMIN", "CSA_OFFICER"])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const targetId = req.params.id;
      const { role } = req.body;

      // Prevent admin from locking themselves out
      if (req.user.id === targetId && role !== "ADMIN") {
        return res.status(400).json({ error: "You cannot revoke your own admin role." });
      }

      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role },
        select: { id: true, email: true, displayName: true, role: true },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Admin Managerial: delete a user
router.delete("/users/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (req.user.id === targetId) {
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    await deleteUserAccountCleanly(targetId);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// Authenticated Change Password — verifies current password, sets new password, rotates tokenVersion, and issues a fresh session JWT
router.post(
  "/change-password",
  requireAuth,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters.")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter.")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one digit."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0]?.msg || "Please check your new password requirements.",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(404).json({ error: "User not found." });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
        },
      });

      const newToken = signToken(updatedUser);
      res.json({
        success: true,
        message: "Password updated. Other active sessions have been signed out.",
        token: newToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Forgot Password — sends a password reset email using nodemailer
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address.")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Secret includes user's current passwordHash so token invalidates if password changes
        const resetSecret = user.passwordHash + process.env.JWT_SECRET;
        const resetToken = jwt.sign(
          { id: user.id, email: user.email, purpose: "password_reset" },
          resetSecret,
          { expiresIn: "15m", algorithm: "HS256" }
        );

        try {
          await sendPasswordResetEmail(user.email, resetToken, user.displayName, {
            clientOrigin: getRequestOrigin(req),
          });
        } catch (mailErr) {
          console.error("Failed to send reset email via SMTP:", mailErr);
          return res.status(500).json({
            error: "Unable to dispatch password reset email. Please try again later or contact support.",
          });
        }
      } else {
        // Equalize timing slightly when account does not exist
        await bcrypt.compare(email, DUMMY_BCRYPT_HASH);
      }

      // Always return success message to prevent account enumeration
      res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent to your email inbox.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// Reset Password — verifies reset token and updates user passwordHash
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required."),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters.")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter.")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one digit."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, newPassword } = req.body;

      let decoded;
      try {
        decoded = jwt.decode(token);
      } catch (e) {
        return res.status(400).json({ error: "Invalid or malformed reset token." });
      }

      if (!decoded || !decoded.id) {
        return res.status(400).json({ error: "Invalid reset token." });
      }

      if (decoded.purpose && decoded.purpose !== "password_reset") {
        return res.status(400).json({ error: "Invalid token purpose." });
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return res.status(404).json({ error: "User account no longer exists." });
      }

      const resetSecret = user.passwordHash + process.env.JWT_SECRET;
      try {
        jwt.verify(token, resetSecret, { algorithms: ["HS256"] });
      } catch (err) {
        return res.status(400).json({
          error: "Password reset link has expired or has already been used. Please request a new link.",
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
        },
      });

      res.json({
        success: true,
        message: "Your password has been reset successfully! You can now log in with your new password.",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
