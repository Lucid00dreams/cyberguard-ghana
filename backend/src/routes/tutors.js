const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Public: browse vetted tutors
router.get("/", async (req, res, next) => {
  try {
    const tutors = await prisma.tutorProfile.findMany({
      where: { vetted: true },
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
        availability: { where: { isBooked: false, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } },
      },
    });
    res.json(tutors);
  } catch (err) {
    next(err);
  }
});

// Admin: list pending tutor applications
router.get("/pending", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const tutors = await prisma.tutorProfile.findMany({
      where: { vetted: false },
      include: {
        user: { select: { displayName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(tutors);
  } catch (err) {
    next(err);
  }
});

// Student/Tutor: apply to become a tutor (starts unvetted; Admin approves)
router.post(
  "/apply",
  requireAuth,
  [
    body("headline").trim().isLength({ min: 5, max: 120 }),
    body("bio").trim().isLength({ min: 20, max: 2000 }),
    body("specialties").isArray({ min: 1 }),
    body("hourlyRateGHS").isFloat({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { headline, bio, specialties, hourlyRateGHS, avatarUrl } = req.body;

      const profile = await prisma.tutorProfile.upsert({
        where: { userId: req.user.id },
        update: { headline, bio, specialties, hourlyRateGHS, avatarUrl },
        create: { userId: req.user.id, headline, bio, specialties, hourlyRateGHS, avatarUrl },
      });

      // Role remains STUDENT until an administrator explicitly vets and approves the profile
      res.status(201).json({
        ...profile,
        note: "Application received. An administrator must vet your profile before tutor permissions are granted.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// Admin: vet a tutor profile — marks profile as vetted and promotes user to TUTOR role
router.patch("/:tutorId/vet", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const profileRecord = await prisma.tutorProfile.findUnique({
      where: { id: req.params.tutorId },
    });
    if (!profileRecord) return res.status(404).json({ error: "Tutor profile not found." });

    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.tutorProfile.update({
        where: { id: req.params.tutorId },
        data: { vetted: true },
      });

      await tx.user.update({
        where: { id: profileRecord.userId },
        data: { role: "TUTOR" },
      });

      return profile;
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Tutor: add an availability slot
router.post(
  "/availability",
  requireAuth,
  requireRole("TUTOR"),
  [body("startsAt").isISO8601(), body("endsAt").isISO8601()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
      if (!tutorProfile) return res.status(404).json({ error: "Tutor profile not found." });

      const slot = await prisma.availabilitySlot.create({
        data: { tutorId: tutorProfile.id, startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt) },
      });
      res.status(201).json(slot);
    } catch (err) {
      next(err);
    }
  }
);

// Student: book an open slot -> generates a unique Jitsi room
router.post("/availability/:slotId/book", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "CSA_OFFICER") {
      return res.status(403).json({
        error: "Admins and CSA Officers have supervisory roles and cannot book student mentorship sessions.",
      });
    }

    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: req.params.slotId },
      include: { tutor: true },
    });
    if (!slot || slot.isBooked) {
      return res.status(409).json({ error: "This slot is no longer available." });
    }

    if (slot.tutor?.userId === req.user.id) {
      return res.status(400).json({ error: "Mentors cannot book their own consultation slot." });
    }

    const jitsiRoomId = `CyberGuard-Session-${crypto.randomUUID()}`;

    const booking = await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.update({ where: { id: slot.id }, data: { isBooked: true } });
      return tx.booking.create({
        data: {
          studentId: req.user.id,
          tutorId: slot.tutorId,
          slotId: slot.id,
          jitsiRoomId,
          status: "CONFIRMED",
        },
      });
    });

    res.status(201).json({
      ...booking,
      jitsiUrl: `https://meet.jit.si/${jitsiRoomId}`,
    });
  } catch (err) {
    next(err);
  }
});

// Student: view own bookings
router.get("/bookings/mine", requireAuth, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId: req.user.id },
      include: { slot: true, tutor: { include: { user: { select: { displayName: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings.map((b) => ({ ...b, jitsiUrl: `https://meet.jit.si/${b.jitsiRoomId}` })));
  } catch (err) {
    next(err);
  }
});
// Admin: remove a tutor profile (revoke tutor role and delete profile)
router.delete("/:tutorId", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const tutor = await prisma.tutorProfile.findUnique({ where: { id: req.params.tutorId } });
    if (!tutor) return res.status(404).json({ error: "Tutor profile not found." });

    // demote the associated user to STUDENT
    await prisma.user.update({ where: { id: tutor.userId }, data: { role: "STUDENT" } });

    // delete the tutor profile and related availability slots
    await prisma.availabilitySlot.deleteMany({ where: { tutorId: tutor.id } });
    await prisma.tutorProfile.delete({ where: { id: tutor.id } });

    res.json({ success: true, message: "Tutor profile removed." });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
