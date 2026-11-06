const webpush = require("web-push");
const prisma = require("../config/prisma");

// Fallback keys in case env variables are missing in local dev
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BIkPjmRoxdhI1tssNStVV0_UMRBB5NJE0Y_eX0M0223hAE99ZLfxQGWerAbAhv7IooXNPVCVvLYd1cG8m1Rp84E";

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "RM8siuZ5iZ4HJZFiOBgUcjl_7cG9KJ3Zz-Znzztrdkk";

const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@cyberguard.gh";

// Initialize VAPID
try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
} catch (err) {
  console.error("[WebPush] Failed to set VAPID details:", err.message);
}

function getVapidPublicKey() {
  return DEFAULT_VAPID_PUBLIC_KEY;
}

/**
 * Send a web push notification to a single subscriber.
 * Automatically cleans up expired/unregistered subscriptions (HTTP 404 or 410).
 *
 * @param {Object} subscription - { endpoint, p256dh, auth } or Prisma record
 * @param {Object} payload - { title, body, icon, badge, data: { url }, vibrate }
 * @returns {Promise<{ success: boolean, expired?: boolean, error?: string }>}
 */
async function sendPushNotification(subscription, payload = {}) {
  if (!subscription || !subscription.endpoint) {
    return { success: false, error: "Invalid subscription: missing endpoint." };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const formattedPayload = JSON.stringify({
    title: payload.title || "CyberGuard Ghana",
    body: payload.body || "New security alert available.",
    icon: payload.icon || "/logo-mark.svg",
    badge: payload.badge || "/favicon.svg",
    vibrate: payload.vibrate || [200, 100, 200],
    data: {
      url: payload.url || payload.data?.url || "/",
      timestamp: Date.now(),
    },
  });

  try {
    const res = await webpush.sendNotification(pushSubscription, formattedPayload, {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "high",
    });
    return { success: true, statusCode: res.statusCode };
  } catch (err) {
    const statusCode = err.statusCode || err.status;
    const isExpired = statusCode === 404 || statusCode === 410;

    if (isExpired) {
      console.warn(`[WebPush] Subscription expired (${statusCode}), pruning endpoint:`, subscription.endpoint);
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      } catch (cleanupErr) {
        // ignore cleanup error
      }
      return { success: false, expired: true, error: "Subscription expired or unsubscribed." };
    }

    console.error(`[WebPush] Dispatch error to ${subscription.endpoint}:`, err.message);
    return { success: false, expired: false, error: err.message };
  }
}

/**
 * Broadcast a push notification to multiple subscriptions.
 *
 * @param {Array<Object>} subscriptions
 * @param {Object} payload
 * @returns {Promise<{ total: number, sent: number, failed: number, expired: number }>}
 */
async function broadcastPushNotification(subscriptions = [], payload = {}) {
  let sent = 0;
  let failed = 0;
  let expired = 0;

  const promises = subscriptions.map(async (sub) => {
    const res = await sendPushNotification(sub, payload);
    if (res.success) {
      sent += 1;
    } else {
      failed += 1;
      if (res.expired) expired += 1;
    }
  });

  await Promise.allSettled(promises);
  return { total: subscriptions.length, sent, failed, expired };
}

module.exports = {
  getVapidPublicKey,
  sendPushNotification,
  broadcastPushNotification,
};

