// CyberGuard Master Extension Suite - Service Worker (Manifest V3)
const DEFAULT_EXTENSIONS = ["ublockorigin", "phishingdetector"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["installedExtensions"], (data) => {
    if (!data.installedExtensions) {
      chrome.storage.local.set({ installedExtensions: DEFAULT_EXTENSIONS });
    }
  });
  console.log("[CyberGuard Suite] Master Service Worker initialized.");
});

// Message listener from content script and web page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.source === "CYBERGUARD_WEB" || request.source === "CYBERGUARD_POPUP") {
    if (request.type === "INSTALL_EXTENSION") {
      const ext = request.extension;
      chrome.storage.local.get(["installedExtensions", "extensionsData"], (data) => {
        const list = Array.isArray(data.installedExtensions) ? data.installedExtensions : [];
        const extMap = data.extensionsData || {};

        if (!list.includes(ext.id)) {
          list.push(ext.id);
        }
        extMap[ext.id] = ext;

        chrome.storage.local.set({ installedExtensions: list, extensionsData: extMap }, () => {
          // Native Chrome Notification confirming installation
          try {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='%230056D2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>",
              title: "CyberGuard Extension Suite",
              message: `✓ ${ext.name} was successfully installed and is now active in your browser!`,
              priority: 2,
            });
          } catch (e) {
            console.log("Notification error:", e);
          }

          // Broadcast to all open tabs to immediately activate the new module
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: "CYBERGUARD_MODULE_ACTIVATED",
                  extensionId: ext.id,
                  extension: ext,
                }).catch(() => {});
              }
            });
          });

          sendResponse({ success: true, installed: list });
        });
      });
      return true; // Async response
    }

    if (request.type === "UNINSTALL_EXTENSION") {
      const extId = request.extensionId;
      chrome.storage.local.get(["installedExtensions"], (data) => {
        const list = (data.installedExtensions || []).filter((id) => id !== extId);
        chrome.storage.local.set({ installedExtensions: list }, () => {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: "CYBERGUARD_MODULE_DEACTIVATED",
                  extensionId: extId,
                }).catch(() => {});
              }
            });
          });

          sendResponse({ success: true, installed: list });
        });
      });
      return true;
    }

    if (request.type === "GET_INSTALLED") {
      chrome.storage.local.get(["installedExtensions", "extensionsData"], (data) => {
        sendResponse({
          installed: data.installedExtensions || [],
          data: data.extensionsData || {},
        });
      });
      return true;
    }
  }
});

// URL & Phishing safety inspection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const url = tab.url.toLowerCase();
  const isDangerous =
    url.includes("telecel-cash-ghana-verify") ||
    url.includes("mtn-momo-promo") ||
    url.includes("wassce-leaks") ||
    url.includes("instagram-blue-badge-gh") ||
    (url.startsWith("http://") && (url.includes("login") || url.includes("verify") || url.includes("momo")));

  if (isDangerous) {
    try {
      await chrome.action.setBadgeText({ tabId, text: "WARN" });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: "#DC2626" });
    } catch (e) {}
  } else {
    try {
      await chrome.action.setBadgeText({ tabId, text: "SAFE" });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: "#059669" });
    } catch (e) {}
  }
});
