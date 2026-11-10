const express = require("express");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
const { getVapidPublicKey, sendPushNotification } = require("../utils/pushNotifier");
const { getDailyTipsScheduleConfig } = require("../services/dailyTipsService");

const router = express.Router();

/**
 * Public: Get VAPID public key for browser PushManager subscription
 */
router.get("/public-key", (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

/**
 * Authenticated: Register or update browser PushSubscription
 */
router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Missing required push subscription fields (endpoint, keys.p256dh, keys.auth)." });
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers["user-agent"] || null,
      },
      create: {
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers["user-agent"] || null,
      },
    });

    // Automatically enable push notifications preference on opt-in
    await prisma.user.update({
      where: { id: req.user.id },
      data: { receiveDailyPushTips: true },
    });

    res.json({
      success: true,
      message: "Push notifications successfully enabled on this device.",
      subscriptionId: subscription.id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Authenticated: Unsubscribe specific device
 */
router.post("/unsubscribe", requireAuth, async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint,
          userId: req.user.id,
        },
      });
    } else {
      // If no endpoint specified, remove all subscriptions for this user
      await prisma.pushSubscription.deleteMany({
        where: { userId: req.user.id },
      });
    }

    res.json({ success: true, message: "Push notifications disabled on this device." });
  } catch (err) {
    next(err);
  }
});

/**
 * Authenticated: Toggle user push tips preference
 */
router.patch("/preferences", requireAuth, async (req, res, next) => {
  try {
    const { receiveDailyPushTips } = req.body;
    if (typeof receiveDailyPushTips !== "boolean") {
      return res.status(400).json({ error: "receiveDailyPushTips must be a boolean." });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { receiveDailyPushTips },
      select: { id: true, receiveDailyPushTips: true },
    });

    res.json({ success: true, receiveDailyPushTips: updated.receiveDailyPushTips });
  } catch (err) {
    next(err);
  }
});

/**
 * Authenticated: Get current user push status
 */
router.get("/status", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { receiveDailyPushTips: true },
    });

    const activeDevicesCount = await prisma.pushSubscription.count({
      where: { userId: req.user.id },
    });

    res.json({
      receiveDailyPushTips: Boolean(user?.receiveDailyPushTips),
      activeDevicesCount,
      hasActiveSubscription: activeDevicesCount > 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Authenticated: Send instant test push notification to user's registered devices
 */
router.post("/test", requireAuth, async (req, res, next) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.user.id },
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({
        error: "No active push subscription found on this device. Please enable notifications first.",
      });
    }

    const schedule = await getDailyTipsScheduleConfig();
    const testPayload = {
      title: "🛡️ CyberGuard Ghana · Push Test",
      body: `Instant Web Push is active on your device! You'll receive your ${schedule.displayTime || "7:00 AM"} daily security tips right here.`,
      icon: "/pwa-192x192.png",
      badge: "/favicon.png",
      url: "/dashboard?tab=settings",
      vibrate: [200, 100, 200, 100, 200],
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const outcome = await sendPushNotification(sub, testPayload);
      if (outcome.success) sent += 1;
      else failed += 1;
    }

    res.json({
      success: true,
      message: `Test notification dispatched to ${sent} device(s).`,
      sent,
      failed,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

