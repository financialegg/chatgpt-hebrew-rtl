(function () {
  "use strict";

  // Display only: the extension never edits or adds to what the user sends.
  // Writing rules belong in ChatGPT's Custom Instructions (docs/CUSTOM_INSTRUCTIONS_HE.txt).
  const DEFAULTS = {
    mode: "smart",
    tables: true,
    composer: true,
    observe: true,
    consented: false
  };

  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(DEFAULTS);
      return { ...DEFAULTS, ...stored };
    } catch (_) {
      return DEFAULTS;
    }
  }

  function apply(settings) {
    if (!globalThis.HebrewRTLEngine) return;
    if (settings.consented) globalThis.HebrewRTLEngine.start(settings);
    else globalThis.HebrewRTLEngine.stop();
  }

  let settings = { ...DEFAULTS };

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "HEBREW_RTL_SETTINGS") return;
    settings = { ...settings, ...(message.settings || {}) };
    apply(settings);
  });

  loadSettings().then((loaded) => {
    settings = loaded;
    apply(settings);
  });
})();
