// CyberGuard Master Extension Suite - Universal Content Engine
(function () {
  // 1. Mark presence on the DOM for the web application
  document.documentElement.setAttribute("data-cyberguard-extension", "true");

  // 2. Announce presence to CyberGuard Web Platform
  window.postMessage(
    {
      source: "CYBERGUARD_EXTENSION",
      type: "READY",
      version: "2.0.0",
      active: true,
    },
    "*"
  );

  // 3. Web Page <-> Extension Bridge
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "CYBERGUARD_WEB") {
      if (event.data.type === "PING") {
        window.postMessage(
          {
            source: "CYBERGUARD_EXTENSION",
            type: "PONG",
            version: "2.0.0",
            active: true,
          },
          "*"
        );
      } else if (
        event.data.type === "INSTALL_EXTENSION" ||
        event.data.type === "UNINSTALL_EXTENSION" ||
        event.data.type === "GET_INSTALLED"
      ) {
        chrome.runtime.sendMessage(event.data, (response) => {
          window.postMessage(
            {
              source: "CYBERGUARD_EXTENSION",
              type: "SYNC_STATUS",
              payload: response,
            },
            "*"
          );
          // Re-evaluate active modules on this page
          evaluateActiveModules();
        });
      }
    }
  });

  // 4. Listen for runtime messages from background service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (
      message.type === "CYBERGUARD_MODULE_ACTIVATED" ||
      message.type === "CYBERGUARD_MODULE_DEACTIVATED"
    ) {
      evaluateActiveModules();
    }
  });

  // 5. Hardcoded Extension Modules Implementation
  function evaluateActiveModules() {
    chrome.storage.local.get(["installedExtensions"], (data) => {
      const active = data.installedExtensions || [];

      // ── MODULE: Dark Reader ─────────────────────────
      if (active.includes("darkreader")) {
        applyDarkReader();
      } else {
        removeDarkReader();
      }

      // ── MODULE: uBlock Origin & Privacy Badger ──────
      if (active.includes("ublockorigin") || active.includes("privacybadger")) {
        applyAdBlocker();
      }

      // ── MODULE: Grammarly AI Writing Assistant ─────
      if (active.includes("grammarly") || active.includes("languagetool")) {
        applyGrammarAssistant();
      }

      // ── MODULE: Bitwarden / Password Helper ─────────
      if (active.includes("bitwarden") || active.includes("onepassword") || active.includes("nordpass")) {
        applyPasswordHelper();
      }

      // ── MODULE: Phishing & Scam Detector ────────────
      applyPhishingScanner();
    });
  }

  // ── Engine: Dark Reader ──────────────────────────
  function applyDarkReader() {
    if (document.getElementById("cg-dark-reader-style")) return;
    const style = document.createElement("style");
    style.id = "cg-dark-reader-style";
    style.textContent = `
      html.cg-dark-mode {
        filter: invert(90%) hue-rotate(180deg) !important;
        background: #121212 !important;
      }
      html.cg-dark-mode img, 
      html.cg-dark-mode video, 
      html.cg-dark-mode canvas,
      html.cg-dark-mode iframe {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add("cg-dark-mode");
  }

  function removeDarkReader() {
    const el = document.getElementById("cg-dark-reader-style");
    if (el) el.remove();
    document.documentElement.classList.remove("cg-dark-mode");
  }

  // ── Engine: uBlock Origin & Anti-Tracking ────────
  function applyAdBlocker() {
    const adSelectors = [
      'ins.adsbygoogle',
      'iframe[src*="doubleclick.net"]',
      'iframe[src*="adservice"]',
      '.ad-banner',
      '#ad-container',
      '[class*="sponsor-ad"]',
      '[id*="google_ads"]'
    ];
    document.querySelectorAll(adSelectors.join(",")).forEach((el) => {
      el.style.display = "none";
      el.setAttribute("data-cg-blocked", "true");
    });
  }

  // ── Engine: Grammarly AI Assistant ───────────────
  function applyGrammarAssistant() {
    const inputs = document.querySelectorAll("textarea, input[type='text']");
    inputs.forEach((input) => {
      if (input.getAttribute("data-cg-grammar-bound")) return;
      input.setAttribute("data-cg-grammar-bound", "true");
      input.addEventListener("input", (e) => {
        const text = e.target.value;
        if (text.includes("teh ")) {
          e.target.value = text.replace(/teh /g, "the ");
        }
      });
    });
  }

  // ── Engine: Bitwarden Password Helper ────────────
  function applyPasswordHelper() {
    const passInputs = document.querySelectorAll("input[type='password']");
    passInputs.forEach((passInput) => {
      if (passInput.getAttribute("data-cg-vault-bound")) return;
      passInput.setAttribute("data-cg-vault-bound", "true");

      const helperBtn = document.createElement("button");
      helperBtn.type = "button";
      helperBtn.textContent = "🔑 Generate";
      helperBtn.style.cssText =
        "position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#0056d2;color:#fff;border:none;border-radius:6px;font-size:10px;font-weight:bold;padding:4px 8px;cursor:pointer;z-index:9999;";
      helperBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
        let generated = "";
        for (let i = 0; i < 16; i++) {
          generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passInput.value = generated;
        passInput.dispatchEvent(new Event("input", { bubbles: true }));
        alert(`CyberGuard Vault Generated Password:\n\n${generated}\n\n(Copied to password field)`);
      };

      if (passInput.parentElement) {
        const parentPos = window.getComputedStyle(passInput.parentElement).position;
        if (parentPos === "static") passInput.parentElement.style.position = "relative";
        passInput.parentElement.appendChild(helperBtn);
      }
    });
  }

  // ── Engine: Phishing & MoMo Scam Scanner ─────────
  function applyPhishingScanner() {
    const url = window.location.href.toLowerCase();
    const isHttp = window.location.protocol === "http:";
    const inputs = document.querySelectorAll('input[type="password"], input[name*="pin"], input[name*="momo"]');

    if ((isHttp || url.includes("-verify") || url.includes("promo") || url.includes("leaks")) && inputs.length > 0) {
      if (!document.getElementById("cyberguard-phishing-alert-banner")) {
        const banner = document.createElement("div");
        banner.id = "cyberguard-phishing-alert-banner";
        banner.style.cssText =
          "position:fixed;top:0;left:0;width:100%;background:#dc2626;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;font-weight:bold;font-size:13px;padding:12px;text-align:center;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;gap:8px;";
        banner.innerHTML =
          "<span>⚠️ CYBERGUARD SHIELD ALERT: Do NOT enter your secret 4-Digit MoMo PIN or passwords on this unverified page!</span>";
        document.body.prepend(banner);
      }
    }
  }

  // Run on start
  evaluateActiveModules();
})();
