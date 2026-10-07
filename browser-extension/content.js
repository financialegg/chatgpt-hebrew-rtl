(function () {
  "use strict";

  const DEFAULTS = {
    mode: "smart",
    tables: true,
    composer: true,
    observe: true,
    smartWriting: true,
    consented: false
  };

  const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
  const INSTRUCTION_MARKER = "פעל לפי כללי הכתיבה בעברית (30 כללים)";
  const COMPOSER_SELECTOR = "textarea, [contenteditable='true'], [contenteditable='plaintext-only'], [role='textbox']";
  const SEND_SELECTOR = "button[data-testid='send-button'], button[aria-label='Send prompt']";
  let resending = false;
  let settings = { ...DEFAULTS };
  let promptHooksInstalled = false;

  async function loadSettings() {
    try {
      const stored = await chrome.storage.local.get(DEFAULTS);
      settings = { ...DEFAULTS, ...stored };
      return settings;
    } catch (_) {
      return DEFAULTS;
    }
  }

  function composerFrom(target) {
    if (!target || !target.closest) return null;
    return target.closest(COMPOSER_SELECTOR);
  }

  function composerText(composer) {
    if (!composer) return "";
    return String("value" in composer ? composer.value : composer.innerText || composer.textContent || "").trim();
  }

  // Insert at the start of the composer through the editing pipeline, so the
  // page's editor (ProseMirror) sees a normal input event and keeps its own state.
  function prependText(composer, text) {
    composer.focus();
    if ("value" in composer) {
      composer.setSelectionRange(0, 0);
    } else {
      const range = document.createRange();
      range.setStart(composer, 0);
      range.collapse(true);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return document.execCommand("insertText", false, text);
  }

  // Returns true when the instruction was added.
  function applyWritingRules(composer) {
    if (!settings.smartWriting || !globalThis.HebrewWritingRules) return false;
    const original = composerText(composer);
    if (!original || !HEBREW_RE.test(original) || original.includes(INSTRUCTION_MARKER)) return false;
    return prependText(composer, globalThis.HebrewWritingRules.buildInstruction());
  }

  // The editor commits the inserted text asynchronously, so cancel the user's
  // send, let the editor settle, then repeat the same send once.
  function deferSend(send) {
    resending = true;
    setTimeout(() => {
      try { send(); } finally { resending = false; }
    }, 60);
  }

  function onComposerKeydown(event) {
    if (resending || event.isComposing) return;
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    const composer = composerFrom(event.target);
    if (!composer || !applyWritingRules(composer)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    deferSend(() => composer.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true
    })));
  }

  function onSendClick(event) {
    if (resending) return;
    const button = event.target?.closest?.(SEND_SELECTOR);
    if (!button) return;
    const composer = button.closest("form")?.querySelector(COMPOSER_SELECTOR);
    if (!composer || !applyWritingRules(composer)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    deferSend(() => button.click());
  }

  function updatePromptHooks(enabled) {
    if (enabled && !promptHooksInstalled) {
      document.addEventListener("keydown", onComposerKeydown, true);
      document.addEventListener("click", onSendClick, true);
      promptHooksInstalled = true;
    } else if (!enabled && promptHooksInstalled) {
      document.removeEventListener("keydown", onComposerKeydown, true);
      document.removeEventListener("click", onSendClick, true);
      promptHooksInstalled = false;
    }
  }

  async function boot() {
    if (!globalThis.HebrewRTLEngine) return;
    settings = await loadSettings();
    if (settings.consented) {
      globalThis.HebrewRTLEngine.start(settings);
      updatePromptHooks(true);
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "HEBREW_RTL_SETTINGS") return;
    settings = { ...settings, ...(message.settings || {}) };
    if (settings.consented && globalThis.HebrewRTLEngine) {
      globalThis.HebrewRTLEngine.start(settings);
      updatePromptHooks(true);
    } else {
      updatePromptHooks(false);
      globalThis.HebrewRTLEngine?.stop();
    }
  });

  boot();
})();
