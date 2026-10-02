const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

// All CyberChat routes require an authenticated user
router.use(requireAuth);

/**
 * GET /api/cyberchat/profile
 * Retrieves the current logged-in user's CyberChat profile including @username, avatar, and keys.
 */
router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        displayName: true,
        email: true,
        username: true,
        avatarUrl: true,
        role: true,
        publicKey: {
          select: {
            fingerprint: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    return res.json({
      user: {
        ...user,
        hasKeys: Boolean(user.publicKey),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/cyberchat/profile/username
 * Creates or updates the user's @username for quick peer addition.
 */
router.put("/profile/username", async (req, res, next) => {
  try {
    let { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required." });
    }

    // Strip leading '@' if entered
    username = username.trim().replace(/^@/, "").toLowerCase();

    // Validate format: 3-24 characters, alphanumeric and underscore
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({
        error: "Username must be 3-24 characters and can only contain letters, numbers, and underscores.",
      });
    }

    // Check if taken
    const existing = await prisma.user.findFirst({
      where: {
        username,
        id: { not: req.user.id },
      },
    });

    if (existing) {
      return res.status(409).json({ error: `@${username} is already claimed by another cyber guard.` });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { username },
      select: {
        id: true,
        displayName: true,
        email: true,
        username: true,
        avatarUrl: true,
        role: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/cyberchat/profile/avatar
 * Updates the user's profile picture avatar URL.
 */
router.put("/profile/avatar", async (req, res, next) => {
  try {
    const { avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: avatarUrl || null },
      select: {
        id: true,
        displayName: true,
        email: true,
        username: true,
        avatarUrl: true,
      },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/keys
 * Registers or updates the user's public keys.
 */
router.post("/keys", async (req, res, next) => {
  try {
    const { ecdhPublicKey, ecdsaPublicKey, fingerprint } = req.body;

    if (!ecdhPublicKey || !ecdsaPublicKey || !fingerprint) {
      return res.status(400).json({ error: "Missing required public key fields." });
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
 * Retrieves the public keys for a specific peer.
 */
router.get("/keys/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const keyRecord = await prisma.userPublicKey.findUnique({
      where: { userId },
      select: {
        userId: true,
        ecdhPublicKey: true,
        ecdsaPublicKey: true,
        fingerprint: true,
        updatedAt: true,
      },
    });

    if (!keyRecord) {
      return res.status(404).json({ error: "User has not initialized CyberChat keys yet." });
    }

    return res.json({ key: keyRecord, ...keyRecord });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/users
 * Returns a searchable list of cyber guards with friendship status and @username.
 */
router.get("/users", async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const myId = req.user.id;
    const cleanSearch = search.trim().replace(/^@/, "");

    const users = await prisma.user.findMany({
      where: {
        id: { not: myId },
        ...(cleanSearch
          ? {
              OR: [
                { username: { contains: cleanSearch, mode: "insensitive" } },
                { displayName: { contains: cleanSearch, mode: "insensitive" } },
                { email: { contains: cleanSearch, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        publicKey: {
          select: {
            fingerprint: true,
            updatedAt: true,
          },
        },
      },
      take: 30,
      orderBy: { displayName: "asc" },
    });

    // Fetch friend requests involving myId to compute relationship status
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: myId },
          { receiverId: myId },
        ],
      },
    });

    // Fetch conversations to see if one already exists
    const myConversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: myId } },
      },
      include: {
        participants: true,
      },
    });

    const formatted = users.map((u) => {
      // Find friendship status
      const sentReq = friendRequests.find((r) => r.senderId === myId && r.receiverId === u.id);
      const receivedReq = friendRequests.find((r) => r.receiverId === myId && r.senderId === u.id);

      let friendshipStatus = "NONE";
      let requestId = null;

      if (sentReq?.status === "ACCEPTED" || receivedReq?.status === "ACCEPTED") {
        friendshipStatus = "FRIENDS";
      } else if (sentReq?.status === "PENDING") {
        friendshipStatus = "REQUEST_SENT";
        requestId = sentReq.id;
      } else if (receivedReq?.status === "PENDING") {
        friendshipStatus = "REQUEST_RECEIVED";
        requestId = receivedReq.id;
      }

      // Check existing conversation
      const existingConv = myConversations.find((c) =>
        c.participants.some((p) => p.userId === u.id)
      );

      return {
        id: u.id,
        displayName: u.displayName,
        username: u.username ? `@${u.username}` : null,
        rawUsername: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        hasKeys: Boolean(u.publicKey),
        friendshipStatus,
        requestId,
        conversationId: existingConv ? existingConv.id : null,
      };
    });

    return res.json({ users: formatted });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/friend-requests
 * Lists all pending incoming requests and outgoing requests for the logged-in user.
 */
router.get("/friend-requests", async (req, res, next) => {
  try {
    const myId = req.user.id;

    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: {
          receiverId: myId,
          status: "PENDING",
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              username: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendRequest.findMany({
        where: {
          senderId: myId,
          status: "PENDING",
        },
        include: {
          receiver: {
            select: {
              id: true,
              displayName: true,
              username: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedIncoming = incoming.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      user: {
        id: r.sender.id,
        displayName: r.sender.displayName,
        username: r.sender.username ? `@${r.sender.username}` : null,
        email: r.sender.email,
        role: r.sender.role,
        avatarUrl: r.sender.avatarUrl,
      },
    }));

    const formattedOutgoing = outgoing.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      user: {
        id: r.receiver.id,
        displayName: r.receiver.displayName,
        username: r.receiver.username ? `@${r.receiver.username}` : null,
        email: r.receiver.email,
        role: r.receiver.role,
        avatarUrl: r.receiver.avatarUrl,
      },
    }));

    return res.json({
      incoming: formattedIncoming,
      outgoing: formattedOutgoing,
      pendingCount: formattedIncoming.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/friend-requests
 * Sends a friend request by targetUserId or by @username.
 */
router.post("/friend-requests", async (req, res, next) => {
  try {
    const myId = req.user.id;
    let { targetUserId, username } = req.body;

    let targetUser = null;

    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, displayName: true, username: true },
      });
    } else if (username) {
      const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
      targetUser = await prisma.user.findFirst({
        where: { username: cleanUsername },
        select: { id: true, displayName: true, username: true },
      });
    }

    if (!targetUser) {
      return res.status(404).json({ error: "Target cyber guard not found." });
    }

    if (targetUser.id === myId) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }

    // Check existing request
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: myId, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: myId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return res.status(400).json({ error: "You are already connected as friends." });
      }
      if (existing.status === "PENDING") {
        return res.status(400).json({
          error: existing.senderId === myId
            ? "You have already sent a friend request to this cyber guard."
            : "This cyber guard already sent you a friend request. Check your requests tab!",
        });
      }
      // If declined previously, reactivate request
      const updated = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: {
          senderId: myId,
          receiverId: targetUser.id,
          status: "PENDING",
          updatedAt: new Date(),
        },
      });
      return res.status(201).json({ success: true, request: updated });
    }

    const created = await prisma.friendRequest.create({
      data: {
        senderId: myId,
        receiverId: targetUser.id,
        status: "PENDING",
      },
    });

    return res.status(201).json({ success: true, request: created });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/cyberchat/friend-requests/:id
 * Accepts or declines an incoming friend request.
 */
router.put("/friend-requests/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "ACCEPT" or "DECLINE"
    const myId = req.user.id;

    const request = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (request.receiverId !== myId) {
      return res.status(403).json({ error: "Not authorized to respond to this request." });
    }

    if (action === "DECLINE") {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: "DECLINED" },
      });
      return res.json({ success: true, message: "Friend request declined." });
    }

    if (action === "ACCEPT") {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      // Automatically ensure a 1-on-1 conversation exists
      let conv = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: myId } } },
            { participants: { some: { userId: request.senderId } } },
          ],
        },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: myId },
                { userId: request.senderId },
              ],
            },
          },
        });
      }

      return res.json({ success: true, message: "Friend request accepted!", conversationId: conv.id });
    }

    return res.status(400).json({ error: "Invalid action. Use ACCEPT or DECLINE." });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/friends
 * Returns all accepted friends for the user.
 */
router.get("/friends", async (req, res, next) => {
  try {
    const myId = req.user.id;

    const acceptedRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: myId, status: "ACCEPTED" },
          { receiverId: myId, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            role: true,
            avatarUrl: true,
            publicKey: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            role: true,
            avatarUrl: true,
            publicKey: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const friends = acceptedRequests.map((r) => {
      const peer = r.senderId === myId ? r.receiver : r.sender;
      return {
        id: peer.id,
        displayName: peer.displayName,
        username: peer.username ? `@${peer.username}` : null,
        email: peer.email,
        role: peer.role,
        avatarUrl: peer.avatarUrl,
        hasKeys: Boolean(peer.publicKey),
        connectedSince: r.updatedAt,
      };
    });

    return res.json({ friends });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/conversations
 * Lists all conversations for the user.
 */
router.get("/conversations", async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                email: true,
                role: true,
                avatarUrl: true,
                publicKey: {
                  select: {
                    ecdhPublicKey: true,
                    ecdsaPublicKey: true,
                    fingerprint: true,
                  },
                },
              },
            },
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
            selfDestructSeconds: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = conversations.map((conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === userId);
      const peerParticipant = conv.participants.find((p) => p.userId !== userId);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        updatedAt: conv.updatedAt,
        peer: peerParticipant?.user
          ? {
              id: peerParticipant.user.id,
              displayName: peerParticipant.user.displayName,
              username: peerParticipant.user.username ? `@${peerParticipant.user.username}` : null,
              email: peerParticipant.user.email,
              role: peerParticipant.user.role,
              avatarUrl: peerParticipant.user.avatarUrl,
              hasKeys: Boolean(peerParticipant.user.publicKey),
              publicKey: peerParticipant.user.publicKey,
            }
          : null,
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
      };
    });

    return res.json({ conversations: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/conversations
 * Finds or creates a 1-on-1 encrypted conversation.
 */
router.post("/conversations", async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    if (!recipientId || recipientId === userId) {
      return res.status(400).json({ error: "Invalid recipient ID." });
    }

    const peer = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        publicKey: true,
      },
    });

    if (!peer) {
      return res.status(404).json({ error: "Recipient user not found." });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                email: true,
                role: true,
                avatarUrl: true,
                publicKey: true,
              },
            },
          },
        },
      },
    });

    const targetConv = existing || (await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId },
            { userId: recipientId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                email: true,
                role: true,
                avatarUrl: true,
                publicKey: true,
              },
            },
          },
        },
      },
    }));

    const peerParticipant = targetConv.participants?.find((p) => p.userId !== userId);
    const peerUser = peerParticipant?.user || peer;

    const formattedConversation = {
      id: targetConv.id,
      createdAt: targetConv.createdAt,
      updatedAt: targetConv.updatedAt,
      peer: {
        id: peerUser.id,
        displayName: peerUser.displayName,
        username: peerUser.username ? `@${peerUser.username.replace(/^@/, "")}` : null,
        email: peerUser.email,
        role: peerUser.role,
        avatarUrl: peerUser.avatarUrl,
        hasKeys: Boolean(peerUser.publicKey),
        publicKey: peerUser.publicKey,
      },
      lastMessage: null,
    };

    return res.status(existing ? 200 : 201).json({ conversation: formattedConversation });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cyberchat/conversations/:id/messages
 * Retrieves encrypted messages for participants only.
 */
router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: "Access Denied: Zero-Knowledge protocol strictly forbids non-participants, including administrators, from accessing conversation messages.",
      });
    }

    const now = new Date();

    // Auto-purge any expired self-destruct messages
    await prisma.secureMessage.deleteMany({
      where: {
        conversationId: id,
        expiresAt: {
          not: null,
          lte: now,
        },
      },
    });

    const messages = await prisma.secureMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
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
        selfDestructSeconds: true,
        expiresAt: true,
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
      data: { lastReadAt: now },
    });

    return res.json({ messages });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cyberchat/conversations/:id/messages
 * Stores an end-to-end encrypted message.
 */
router.post("/conversations/:id/messages", async (req, res, next) => {
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
      selfDestructSeconds = 0,
    } = req.body;

    if (!ciphertext || !iv || !signature || !recipientId) {
      return res.status(400).json({ error: "Missing required ciphertext payload." });
    }

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (!participant) {
      return res.status(403).json({ error: "You are not a participant in this conversation." });
    }

    let expiresAt = null;
    if (selfDestructSeconds && selfDestructSeconds > 0) {
      expiresAt = new Date(Date.now() + selfDestructSeconds * 1000);
    }

    const message = await prisma.secureMessage.create({
      data: {
        conversationId: id,
        senderId: userId,
        recipientId,
        ciphertext,
        iv,
        signature,
        hasAttachment: Boolean(hasAttachment),
        attachmentMeta: attachmentMeta || null,
        selfDestructSeconds: Number(selfDestructSeconds) || 0,
        expiresAt,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
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

    return res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/cyberchat/messages/:id
 * Purges a message.
 */
router.delete("/messages/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.secureMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (message.senderId !== userId && message.recipientId !== userId) {
      return res.status(403).json({ error: "Cannot delete this message." });
    }

    await prisma.secureMessage.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
