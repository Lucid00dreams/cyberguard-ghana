import api from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermissionState() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[PushManager] Service Worker registration failed:", err);
    throw new Error("Could not register notification service worker.");
  }
}

export async function getActiveLocalSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await registerServiceWorker();
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    return null;
  }
}

export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    throw new Error("Web Push notifications are not supported on this device/browser.");
  }

  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notification permission was blocked in browser settings. Please allow notifications for this site to receive daily tips."
        : "Notification permission was dismissed."
    );
  }

  // 2. Register Service Worker
  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error("Service worker could not be activated.");
  }

  // 3. Obtain VAPID Public Key
  let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    try {
      const res = await api.get("/push/public-key");
      publicKey = res.data?.publicKey;
    } catch (e) {
      // fallback
    }
  }

  if (!publicKey) {
    throw new Error("VAPID public key could not be retrieved from server.");
  }

  const convertedKey = urlBase64ToUint8Array(publicKey);

  // 4. Subscribe on browser PushManager (safely replacing stale or mismatched keys)
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    try {
      const existingKey = subscription.options?.applicationServerKey;
      let matches = false;
      if (existingKey) {
        const existingArr = new Uint8Array(existingKey);
        if (existingArr.length === convertedKey.length) {
          matches = existingArr.every((val, i) => val === convertedKey[i]);
        }
      }
      if (!matches) {
        console.log("[PushManager] Existing push key outdated, refreshing subscription...");
        await subscription.unsubscribe();
        subscription = null;
      }
    } catch {
      // If inspecting key fails, proceed with re-subscribe
      subscription = null;
    }
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
  }

  // 5. Send subscription to CyberGuard Backend
  const rawSub = subscription.toJSON();
  const res = await api.post("/push/subscribe", {
    endpoint: rawSub.endpoint,
    keys: rawSub.keys,
    userAgent: navigator.userAgent,
  });

  return {
    success: true,
    subscription,
    message: res.data?.message || "Notifications active!",
  };
}

/**
 * Silently syncs push registration on device if permission is already granted
 */
export async function syncPushSubscriptionIfPermitted() {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return null;
  }
  try {
    return await subscribeToPushNotifications();
  } catch (err) {
    console.warn("[PushManager] Background push sync:", err.message);
    return null;
  }
}

export async function unsubscribeFromPushNotifications() {
  if (!isPushSupported()) return;

  try {
    const reg = await registerServiceWorker();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await api.post("/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
    }
  } catch (err) {
    console.error("[PushManager] Error during unsubscribe:", err);
  }
}

export async function sendTestPushNotification() {
  const res = await api.post("/push/test");
  return res.data;
}

export async function fetchPushStatus() {
  const [serverRes, localSub] = await Promise.all([
    api.get("/push/status").catch(() => ({ data: { receiveDailyPushTips: false, activeDevicesCount: 0 } })),
    getActiveLocalSubscription(),
  ]);

  return {
    receiveDailyPushTips: Boolean(serverRes.data?.receiveDailyPushTips),
    activeDevicesCount: serverRes.data?.activeDevicesCount || 0,
    isThisDeviceSubscribed: Boolean(localSub),
    permission: getPushPermissionState(),
  };
}

