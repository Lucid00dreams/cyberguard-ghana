/**
 * CyberGuard Ghana - Multi-Tab Inter-Process Health Monitor
 * Uses modern BroadcastChannel API to discover, inspect, and coordinate
 * memory across all open tabs of the web application.
 */

const CHANNEL_NAME = "cyberguard_tab_monitor";
let tabChannel = null;
const tabId = "tab_" + Math.random().toString(36).substring(2, 9);
const tabLoadedAt = Date.now();

export function initTabMonitor() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return;
  }
  if (tabChannel) return;

  try {
    tabChannel = new BroadcastChannel(CHANNEL_NAME);

    tabChannel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === "PING_TABS") {
        // Collect real JavaScript heap metrics if supported by browser
        let heapMb = null;
        if (window.performance && window.performance.memory) {
          heapMb = parseFloat(
            (window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)
          );
        }

        // Reply with real state of this tab
        tabChannel.postMessage({
          type: "PONG_TAB",
          tabId,
          url: window.location.pathname + window.location.search,
          title: document.title || "CyberGuard",
          loadedAt: tabLoadedAt,
          visible: !document.hidden,
          heapMb,
          requesterId: data.requesterId,
        });
      } else if (data.type === "PRUNE_MEMORY") {
        // When cleanup is triggered from another tab, prune non-essential memory
        if (data.senderTabId !== tabId) {
          try {
            sessionStorage.clear();
          } catch {}
        }
      }
    };
  } catch {
    // BroadcastChannel unsupported or blocked by strict isolation
  }
}

/**
 * Broadcasts a ping to all open tabs of this origin and collects live telemetry
 * @param {number} timeoutMs - Time window to gather responses
 * @returns {Promise<Array>} List of open tabs with real health metrics
 */
export async function scanAllTabs(timeoutMs = 280) {
  if (typeof window === "undefined") return [];

  // Always include the current tab
  const currentTab = {
    tabId,
    url: window.location.pathname + window.location.search,
    title: document.title || "CyberGuard",
    loadedAt: tabLoadedAt,
    visible: !document.hidden,
    isCurrent: true,
    heapMb:
      window.performance && window.performance.memory
        ? parseFloat((window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1))
        : null,
  };

  if (!("BroadcastChannel" in window)) {
    return [currentTab];
  }

  return new Promise((resolve) => {
    const tabs = [currentTab];
    const channel = new BroadcastChannel(CHANNEL_NAME);

    const timer = setTimeout(() => {
      try {
        channel.close();
      } catch {}
      resolve(tabs);
    }, timeoutMs);

    channel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === "PONG_TAB" && data.requesterId === tabId) {
        // Avoid duplicate entries
        if (!tabs.some((t) => t.tabId === data.tabId)) {
          tabs.push({
            tabId: data.tabId,
            url: data.url,
            title: data.title,
            loadedAt: data.loadedAt,
            visible: data.visible,
            isCurrent: false,
            heapMb: data.heapMb,
          });
        }
      }
    };

    // Send probe
    channel.postMessage({
      type: "PING_TABS",
      requesterId: tabId,
    });
  });
}

/**
 * Broadcasts an instruction to all other open tabs to purge session memory & garbage collect
 */
export function pruneAllTabsMemory() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: "PRUNE_MEMORY",
      senderTabId: tabId,
    });
    setTimeout(() => {
      try {
        channel.close();
      } catch {}
    }, 100);
  } catch {}
}

