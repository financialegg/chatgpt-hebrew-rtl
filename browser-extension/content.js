(function () {
  "use strict";

  const DEFAULTS = {
    mode: "smart",
    tables: true,
    composer: true,
    observe: true
  };

  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(DEFAULTS);
      return { ...DEFAULTS, ...stored };
    } catch (_) {
      return DEFAULTS;
    }
  }

  async function boot() {
    if (!globalThis.HebrewRTLEngine) return;
    const settings = await loadSettings();
    globalThis.HebrewRTLEngine.start(settings);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "HEBREW_RTL_SETTINGS") return;
    if (globalThis.HebrewRTLEngine) {
      globalThis.HebrewRTLEngine.setOptions(message.settings || {});
    }
  });

  boot();
})();
