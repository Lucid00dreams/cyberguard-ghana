const express = require("express");
const rateLimit = require("express-rate-limit");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
const { generateRefCode } = require("../utils/refCode");

const router = express.Router();

const chatReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat requests. Please wait a moment." },
});

const chatWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Message rate limit reached. Please slow down." },
});

const chatReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many report submissions. Please try again shortly." },
});

// All CyberChat routes require authentication and baseline rate limiting
router.use(requireAuth);
router.use(chatReadLimiter);

const PEER_USER_SELECT = {
  id: true,
  displayName: true,
  role: true,
  avatarUrl: true,
  tutorProfile: {
    select: {
      id: true,
      headline: true,
      specialties: true,
      vetted: true,
      avatarUrl: true,
    },
  },
  publicKey: {
    select: {
      ecdhPublicKey: true,
      ecdsaPublicKey: true,
      fingerprint: true,
      updatedAt: true,
    },
  },
};

function isTrustedPractitioner(userRecord) {
  if (!userRecord) return false;
  if (userRecord.role === "CSA_OFFICER" || userRecord.role === "ADMIN") return true;
  if (userRecord.role === "TUTOR" && Boolean(userRecord.tutorProfile?.vetted)) return true;
  return false;
}

function isValidMentorshipPair(userA, userB) {
  if (!userA || !userB || userA.id === userB.id) return false;
  // At least one side must be a CSA-vetted Tutor, CSA Officer, or Admin.
  // Learner-to-Learner (STUDENT <-> STUDENT) peer chat is strictly prohibited.
  return isTrustedPractitioner(userA) || isTrustedPractitioner(userB);
}

function sanitizePeer(u, extra = {}) {
  if (!u) return null;
  const isVerifiedMentor = u.role === "TUTOR" && Boolean(u.tutorProfile?.vetted);
  const isCsaOfficer = u.role === "CSA_OFFICER" || u.role === "ADMIN";

  let headline = "Learner";
  if (isVerifiedMentor) {
    headline = u.tutorProfile.headline || "Verified Cybersecurity Mentor";
  } else if (u.role === "CSA_OFFICER") {
    headline = "Cyber Security Authority Officer";
  } else if (u.role === "ADMIN") {
    headline = "Platform Support Administrator";
  }

  return {
    id: u.id,
    displayName: u.displayName,
    role: u.role,
    avatarUrl: u.avatarUrl || u.tutorProfile?.avatarUrl || null,
    headline,
    specialties: isVerifiedMentor ? u.tutorProfile.specialties || [] : [],
    isVerifiedMentor,
    isCsaOfficer,
    hasKeys: Boolean(u.publicKey),
    publicKey: u.publicKey
      ? {
          ecdhPublicKey: u.publicKey.ecdhPublicKey,
          ecdsaPublicKey: u.publicKey.ecdsaPublicKey,
          fingerprint: u.publicKey.fingerprint,
          updatedAt: u.publicKey.updatedAt,
        }
      : null,
    ...extra,
  };
}

function validatePublicJwkString(jwkStr, expectedKty = "EC") {
  if (typeof jwkStr !== "string" || jwkStr.length > 2048) return false;
  try {
    const parsed = JSON.parse(jwkStr);
    if (!parsed || typeof parsed !== "object") return false;
    // Reject if private key parameter "d" is ever present
    if ("d" in parsed) return false;
    if (parsed.kty !== expectedKty || parsed.crv !== "P-256") return false;
    if (typeof parsed.x !== "string" || typeof parsed.y !== "string") return false;
    return true;
  } catch {
    return false;
  }
}

async function getBlockState(myId, peerId) {
  const blocks = await prisma.chatBlock.findMany({
    where: {
      OR: [
        { blockerId: myId, blockedId: peerId },
        { blockerId: peerId, blockedId: myId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
  return {
    isBlocked: blocks.length > 0,
    blockedByMe: blocks.some((b) => b.blockerId === myId),
    blockedMe: blocks.some((b) => b.blockerId === peerId),
  };
}

async function canInitiateConversation(me, peer) {
  if (!isValidMentorshipPair(me, peer)) {
    return {
      allowed: false,
      reason:
        "CyberChat is restricted to mentorship and support conversations with Verified Tutors or CSA Officers.",
    };
  }

  // Learners can initiate a chat with any Verified Tutor or CSA Officer / Admin
  if (!isTrustedPractitioner(me) && isTrustedPractitioner(peer)) {
    return { allowed: true };
  }

  // CSA Officers & Admins can initiate official support or practitioner chats
  if (me.role === "CSA_OFFICER" || me.role === "ADMIN") {
    return { allowed: true };
  }

  // Verified Tutors can chat with other practitioners OR learners who booked a session with them
  if (me.role === "TUTOR" && me.tutorProfile?.vetted) {
    if (isTrustedPractitioner(peer)) {
      return { allowed: true };
    }
    const hasBooking = await prisma.booking.findFirst({
      where: {
        tutorId: me.tutorProfile.id,
        studentId: peer.id,
        status: { not: "CANCELLED" },
      },
      select: { id: true },
    });
    if (hasBooking) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason:
        "Tutors can only initiate new conversations with learners who have booked a mentorship session with them.",
    };
  }

  return { allowed: false, reason: "Conversation not permitted under mentorship safety rules." };
}

/**
 * GET /api/cyberchat/profile
 * Retrieves the logged-in user's CyberChat profile and key fingerprint.
 */
router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: PEER_USER_SELECT,
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    const profilePayload = {
      ...sanitizePeer(user),
      fingerprint: user.publicKey?.fingerprint || null,
    };

    return res.json({
      profile: profilePayload,
      user: profilePayload,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/keys
 * Registers or updates the user's P-256 public keys (rejects any payload containing private key material).
 */
router.post("/keys", chatWriteLimiter, async (req, res, next) => {
  try {
    const { ecdhPublicKey, ecdsaPublicKey, fingerprint } = req.body;

    if (!ecdhPublicKey || !ecdsaPublicKey || !fingerprint) {
      return res.status(400).json({ error: "Missing required public key fields." });
    }

    if (!validatePublicJwkString(ecdhPublicKey) || !validatePublicJwkString(ecdsaPublicKey)) {
      return res.status(400).json({ error: "Invalid P-256 public key format." });
    }

    if (typeof fingerprint !== "string" || !/^[A-F0-9]{4}(-[A-F0-9]{4}){3}$/.test(fingerprint)) {
      return res.status(400).json({ error: "Invalid key fingerprint format." });
    }

    const keyRecord = await prisma.userPublicKey.upsert({
      where: { userId: req.user.id },
      update: {
        ecdhPublicKey,
        ecdsaPublicKey,
        fingerprint,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user.id,
        ecdhPublicKey,
        ecdsaPublicKey,
        fingerprint,
      },
    });

    return res.json({ success: true, key: keyRecord });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/keys/:userId
 * Retrieves public keys only for authorized mentorship/support counterparts.
 */
router.get("/keys/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [me, peer] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id }, select: PEER_USER_SELECT }),
      prisma.user.findUnique({ where: { id: userId }, select: PEER_USER_SELECT }),
    ]);

    if (!me || !peer) {
      return res.status(404).json({ error: "User not found." });
    }

    if (me.id !== peer.id && !isValidMentorshipPair(me, peer)) {
      return res.status(403).json({
        error: "Public keys are only accessible for authorized mentorship and support contacts.",
      });
    }

    if (!peer.publicKey) {
      return res.status(404).json({ error: "Contact has not initialized encryption keys yet." });
    }

    const keyRecord = {
      userId: peer.id,
      ecdhPublicKey: peer.publicKey.ecdhPublicKey,
      ecdsaPublicKey: peer.publicKey.ecdsaPublicKey,
      fingerprint: peer.publicKey.fingerprint,
      updatedAt: peer.publicKey.updatedAt,
    };

    return res.json({ key: keyRecord, ...keyRecord });
  } catch (err) {
    next(err);
  }
});

/**
 * Shared Directory Handler for GET /api/cyberchat/mentors and GET /api/cyberchat/users
 * Never exposes learner-to-learner social discovery or email PII.
 */
async function handleDirectoryLookup(req, res, next) {
  try {
    const myId = req.user.id;
    const cleanSearch = String(req.query.search || "").trim();

    const me = await prisma.user.findUnique({
      where: { id: myId },
      select: PEER_USER_SELECT,
    });
    if (!me) return res.status(404).json({ error: "User not found." });

    const [blocks, myConversations] = await Promise.all([
      prisma.chatBlock.findMany({
        where: { OR: [{ blockerId: myId }, { blockedId: myId }] },
        select: { blockerId: true, blockedId: true },
      }),
      prisma.conversation.findMany({
        where: { participants: { some: { userId: myId } } },
        include: { participants: true },
      }),
    ]);

    const blockedIds = new Set(
      blocks.map((b) => (b.blockerId === myId ? b.blockedId : b.blockerId))
    );

    const searchFilter = cleanSearch
      ? {
          OR: [
            { displayName: { contains: cleanSearch, mode: "insensitive" } },
            {
              tutorProfile: {
                is: {
                  headline: { contains: cleanSearch, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {};

    let eligibleUsers = [];

    if (!isTrustedPractitioner(me)) {
      // Learners ONLY see CSA-vetted Tutors and CSA Officers
      eligibleUsers = await prisma.user.findMany({
        where: {
          id: { not: myId },
          AND: [
            {
              OR: [
                { role: "CSA_OFFICER" },
                { role: "TUTOR", tutorProfile: { is: { vetted: true } } },
              ],
            },
            searchFilter,
          ],
        },
        select: PEER_USER_SELECT,
        take: 40,
        orderBy: { displayName: "asc" },
      });
    } else if (me.role === "TUTOR" && me.tutorProfile?.vetted) {
      // Verified Tutors see learners who booked a session with them + Verified Tutors + CSA Officers
      const bookings = await prisma.booking.findMany({
        where: { tutorId: me.tutorProfile.id, status: { not: "CANCELLED" } },
        select: { studentId: true },
      });
      const bookedStudentIds = [...new Set(bookings.map((b) => b.studentId))];

      eligibleUsers = await prisma.user.findMany({
        where: {
          id: { not: myId },
          AND: [
            {
              OR: [
                { role: "CSA_OFFICER" },
                { role: "TUTOR", tutorProfile: { is: { vetted: true } } },
                ...(bookedStudentIds.length > 0 ? [{ id: { in: bookedStudentIds } }] : []),
              ],
            },
            searchFilter,
          ],
        },
        select: PEER_USER_SELECT,
        take: 40,
        orderBy: { displayName: "asc" },
      });
    } else {
      // CSA Officers & Admins see Verified Tutors, CSA Officers, and (when searching) learners needing support
      eligibleUsers = await prisma.user.findMany({
        where: {
          id: { not: myId },
          AND: [
            cleanSearch
              ? {}
              : {
                  OR: [
                    { role: "CSA_OFFICER" },
                    { role: "ADMIN" },
                    { role: "TUTOR", tutorProfile: { is: { vetted: true } } },
                  ],
                },
            searchFilter,
          ],
        },
        select: PEER_USER_SELECT,
        take: 40,
        orderBy: { displayName: "asc" },
      });
    }

    const contacts = eligibleUsers
      .filter((u) => !blockedIds.has(u.id))
      .map((u) => {
        const existingConv = myConversations.find((c) =>
          c.participants.some((p) => p.userId === u.id)
        );
        return sanitizePeer(u, {
          conversationId: existingConv ? existingConv.id : null,
        });
      });

    return res.json({ mentors: contacts, users: contacts });
  } catch (err) {
    next(err);
  }
}

router.get("/mentors", handleDirectoryLookup);
router.get("/users", handleDirectoryLookup);

/**
 * Legacy social networking endpoints disabled in Mentorship-Only mode.
 */
router.get("/friend-requests", (_req, res) => {
  return res.json({ incoming: [], outgoing: [], pendingCount: 0 });
});

router.post("/friend-requests", (_req, res) => {
  return res.status(403).json({
    error:
      "Peer friend requests are disabled. CyberChat is restricted to Verified Tutors and CSA Officers.",
  });
});

router.put("/friend-requests/:id", (_req, res) => {
  return res.status(403).json({
    error: "Peer friend requests are disabled.",
  });
});

router.get("/friends", handleDirectoryLookup);

/**
 * GET /api/cyberchat/conversations
 * Lists active mentorship & CSA support conversations (filters out any non-mentorship legacy threads).
 */
router.get("/conversations", async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [me, conversations, blocks] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: PEER_USER_SELECT }),
      prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        include: {
          participants: {
            include: {
              user: { select: PEER_USER_SELECT },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              senderId: true,
              createdAt: true,
              hasAttachment: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.chatBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    if (!me) return res.status(404).json({ error: "User not found." });

    const result = [];

    for (const conv of conversations) {
      const myParticipant = conv.participants.find((p) => p.userId === userId);
      const peerParticipant = conv.participants.find((p) => p.userId !== userId);
      const peerUser = peerParticipant?.user;

      if (!peerUser || !isValidMentorshipPair(me, peerUser)) {
        continue;
      }

      const blockedByMe = blocks.some(
        (b) => b.blockerId === userId && b.blockedId === peerUser.id
      );
      const blockedMe = blocks.some(
        (b) => b.blockerId === peerUser.id && b.blockedId === userId
      );
      const lastMessage = conv.messages[0] || null;

      result.push({
        id: conv.id,
        updatedAt: conv.updatedAt,
        blockedByMe,
        isBlocked: blockedByMe || blockedMe,
        peer: sanitizePeer(peerUser),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              isMine: lastMessage.senderId === userId,
              createdAt: lastMessage.createdAt,
              hasAttachment: lastMessage.hasAttachment,
            }
          : null,
        lastReadAt: myParticipant?.lastReadAt,
      });
    }

    return res.json({ conversations: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/conversations
 * Finds or creates a 1-on-1 encrypted mentorship or CSA support conversation.
 */
router.post("/conversations", chatWriteLimiter, async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    if (!recipientId || typeof recipientId !== "string" || recipientId === userId) {
      return res.status(400).json({ error: "Invalid recipient ID." });
    }

    const [me, peer, blockState] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: PEER_USER_SELECT }),
      prisma.user.findUnique({ where: { id: recipientId }, select: PEER_USER_SELECT }),
      getBlockState(userId, recipientId),
    ]);

    if (!me || !peer) {
      return res.status(404).json({ error: "Recipient not found." });
    }

    if (blockState.isBlocked) {
      return res.status(403).json({
        error: blockState.blockedByMe
          ? "You have blocked this contact. Unblock them first to send messages."
          : "Messaging is unavailable with this contact.",
      });
    }

    // Check if an authorized mentorship conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
    });

    if (existing) {
      if (!isValidMentorshipPair(me, peer)) {
        return res.status(403).json({
          error:
            "CyberChat is restricted to mentorship and support conversations with Verified Tutors or CSA Officers.",
        });
      }

      return res.status(200).json({
        conversation: {
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
          blockedByMe: false,
          isBlocked: false,
          peer: sanitizePeer(peer),
          lastMessage: null,
        },
      });
    }

    // Enforce strict initiation policy for brand-new conversations
    const perm = await canInitiateConversation(me, peer);
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const created = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
    });

    return res.status(201).json({
      conversation: {
        id: created.id,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        blockedByMe: false,
        isBlocked: false,
        peer: sanitizePeer(peer),
        lastMessage: null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/conversations/:id/messages
 * Retrieves encrypted messages for authorized mentorship/support participants only.
 */
router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: PEER_USER_SELECT } },
        },
      },
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const myParticipant = conv.participants.find((p) => p.userId === userId);
    const peerParticipant = conv.participants.find((p) => p.userId !== userId);

    if (!myParticipant) {
      return res.status(403).json({
        error: "Access denied: only conversation participants can read encrypted messages.",
      });
    }

    if (!peerParticipant?.user || !isValidMentorshipPair(myParticipant.user, peerParticipant.user)) {
      return res.status(403).json({
        error:
          "This conversation is inactive because CyberChat is restricted to Verified Tutors and CSA Officers.",
      });
    }

    const messages = await prisma.secureMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 250,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        recipientId: true,
        ciphertext: true,
        iv: true,
        signature: true,
        hasAttachment: true,
        attachmentMeta: true,
        createdAt: true,
      },
    });

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return res.json({ messages });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/conversations/:id/messages
 * Stores an end-to-end encrypted mentorship/support message.
 * Disappearing timers are disabled to preserve learner protection & auditability.
 */
router.post("/conversations/:id/messages", chatWriteLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      recipientId,
      ciphertext,
      iv,
      signature,
      hasAttachment = false,
      attachmentMeta = null,
    } = req.body;

    if (
      typeof ciphertext !== "string" ||
      !ciphertext ||
      ciphertext.length > 4_200_000 ||
      typeof iv !== "string" ||
      !iv ||
      iv.length > 64 ||
      typeof signature !== "string" ||
      !signature ||
      signature.length > 512
    ) {
      return res.status(400).json({ error: "Invalid or oversized encrypted message payload." });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: PEER_USER_SELECT } },
        },
      },
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const myParticipant = conv.participants.find((p) => p.userId === userId);
    const peerParticipant = conv.participants.find((p) => p.userId !== userId);

    if (!myParticipant || !peerParticipant?.user) {
      return res.status(403).json({ error: "You are not a participant in this conversation." });
    }

    // Bind recipientId strictly to the verified counterpart in this conversation
    const verifiedRecipientId = peerParticipant.user.id;
    if (recipientId && recipientId !== verifiedRecipientId) {
      return res.status(400).json({ error: "Recipient mismatch for this conversation." });
    }

    if (!isValidMentorshipPair(myParticipant.user, peerParticipant.user)) {
      return res.status(403).json({
        error: "CyberChat is restricted to Verified Tutors and CSA Officers.",
      });
    }

    const blockState = await getBlockState(userId, verifiedRecipientId);
    if (blockState.isBlocked) {
      return res.status(403).json({
        error: blockState.blockedByMe
          ? "You blocked this contact. Unblock them to resume messaging."
          : "Messaging is unavailable in this conversation.",
      });
    }

    const safeMeta =
      typeof attachmentMeta === "string" && attachmentMeta.length <= 2048 ? attachmentMeta : null;

    const message = await prisma.secureMessage.create({
      data: {
        conversationId: id,
        senderId: userId,
        recipientId: verifiedRecipientId,
        ciphertext,
        iv,
        signature,
        hasAttachment: Boolean(hasAttachment),
        attachmentMeta: safeMeta,
        selfDestructSeconds: 0,
        expiresAt: null,
      },
    });

    const now = new Date();
    await Promise.all([
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: now },
      }),
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId,
          },
        },
        data: { lastReadAt: now },
      }),
    ]);

    return res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cyberchat/messages/:id
 * Disabled to prevent bad actors from erasing evidence after sending inappropriate content.
 */
router.delete("/messages/:id", (_req, res) => {
  return res.status(403).json({
    error: "Messages in mentorship conversations cannot be remotely erased.",
  });
});

/**
 * Block / Unblock Management
 */
router.get("/blocks", async (req, res, next) => {
  try {
    const blocks = await prisma.chatBlock.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: { id: true, displayName: true, role: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({
      blocks: blocks.map((b) => ({
        id: b.id,
        blockedId: b.blockedId,
        createdAt: b.createdAt,
        user: b.blocked,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/blocks", chatWriteLimiter, async (req, res, next) => {
  try {
    const myId = req.user.id;
    const { targetUserId, reason } = req.body;

    if (!targetUserId || typeof targetUserId !== "string" || targetUserId === myId) {
      return res.status(400).json({ error: "Invalid user ID to block." });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) return res.status(404).json({ error: "User not found." });

    const safeReason =
      typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 240) : null;

    await prisma.chatBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: myId,
          blockedId: targetUserId,
        },
      },
      update: { reason: safeReason },
      create: {
        blockerId: myId,
        blockedId: targetUserId,
        reason: safeReason,
      },
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/blocks/:targetUserId", chatWriteLimiter, async (req, res, next) => {
  try {
    await prisma.chatBlock.deleteMany({
      where: {
        blockerId: req.user.id,
        blockedId: req.params.targetUserId,
      },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/conversations/:id/report
 * Client-initiated message franking / safety report to CSA Officers.
 * Verifies conversation membership & cryptographic message metadata before filing an ESCALATED IncidentReport.
 */
router.post("/conversations/:id/report", chatReportLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      category = "OTHER",
      reason = "",
      disclosedMessages = [],
      blockPeer = true,
    } = req.body;

    const validCategories = [
      "SEXTORTION",
      "GROOMING",
      "SCAM",
      "BULLYING",
      "IMPERSONATION",
      "OTHER",
    ];
    const safeCategory = validCategories.includes(category) ? category : "OTHER";
    const trimmedReason = String(reason || "").trim();

    if (trimmedReason.length < 10 || trimmedReason.length > 3000) {
      return res.status(400).json({
        error: "Please provide a brief description between 10 and 3,000 characters.",
      });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, role: true },
            },
          },
        },
      },
    });

    if (!conv) return res.status(404).json({ error: "Conversation not found." });

    const me = conv.participants.find((p) => p.userId === userId)?.user;
    const peer = conv.participants.find((p) => p.userId !== userId)?.user;

    if (!me || !peer) {
      return res.status(403).json({ error: "Only conversation participants can report this chat." });
    }

    // Verify submitted message IDs against actual stored SecureMessage records in this conversation
    const submittedList = Array.isArray(disclosedMessages) ? disclosedMessages.slice(-20) : [];
    const submittedIds = submittedList
      .map((m) => (typeof m?.id === "string" ? m.id : null))
      .filter(Boolean);

    const dbMessages =
      submittedIds.length > 0
        ? await prisma.secureMessage.findMany({
            where: {
              conversationId: id,
              id: { in: submittedIds },
            },
            select: {
              id: true,
              senderId: true,
              createdAt: true,
              signature: true,
              hasAttachment: true,
            },
            orderBy: { createdAt: "asc" },
          })
        : [];

    const dbMap = new Map(dbMessages.map((m) => [m.id, m]));
    const transcriptLines = [];

    for (const item of submittedList) {
      const verified = dbMap.get(item?.id);
      if (!verified) continue;
      const authorLabel =
        verified.senderId === peer.id
          ? `${peer.displayName} (${peer.role})`
          : `${me.displayName} (${me.role})`;
      const textExcerpt = String(item?.text || (verified.hasAttachment ? "[Attachment]" : ""))
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400);
      const sigTag = verified.signature ? `sig:${verified.signature.slice(0, 16)}...` : "unsigned";
      transcriptLines.push(
        `[${verified.createdAt.toISOString()}] ${authorLabel} [msg:${verified.id.slice(0, 8)} | ${sigTag}]: ${textExcerpt}`
      );
    }

    const narrativeParts = [
      `[MENTORSHIP CHAT SAFETY REPORT]`,
      `• Conversation ID: ${id}`,
      `• Reported Account: ${peer.displayName} (Role: ${peer.role}, ID: ${peer.id})`,
      `• Submitted By: ${me.displayName} (Role: ${me.role})`,
      `----------------------------------------`,
      `Reporter Statement:`,
      trimmedReason,
    ];

    if (transcriptLines.length > 0) {
      narrativeParts.push(
        `----------------------------------------`,
        `Client-Disclosed Transcript (${transcriptLines.length} server-verified message record(s)):`,
        ...transcriptLines
      );
    }

    const refCode = generateRefCode("CG");
    await prisma.incidentReport.create({
      data: {
        refCode,
        category: safeCategory,
        status: "ESCALATED",
        narrative: narrativeParts.join("\n").slice(0, 5000),
      },
    });

    if (blockPeer) {
      await prisma.chatBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: peer.id,
          },
        },
        update: { reason: `Reported conversation (${refCode})` },
        create: {
          blockerId: userId,
          blockedId: peer.id,
          reason: `Reported conversation (${refCode})`,
        },
      });
    }

    return res.status(201).json({
      refCode,
      blocked: Boolean(blockPeer),
      message: "Safety report submitted to CSA Officers.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
