/* Hebrew RTL Engine v0.3.1
 * Hebrew-first, browser-safe RTL processing for ChatGPT/Codex surfaces.
 * Exposes globalThis.HebrewRTLEngine.
 */
(function (global) {
  "use strict";

  const VERSION = "0.4.0";
  const DEFAULTS = {
    mode: "smart",
    tables: true,
    composer: true,
    observe: true,
    debug: false
  };

  const MARK_BLOCK = "data-hebrew-rtl";
  const MARK_TABLE = "data-hebrew-rtl-table";
  const MARK_CELL = "data-hebrew-rtl-cell";
  const MARK_LTR = "data-hebrew-rtl-ltr";
  const MARK_COMPOSER = "data-hebrew-rtl-composer";
  const MARK_ACTIVE = "data-hebrew-rtl-active";

  const RTL_RE = /[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
  const LATIN_RE = /[A-Za-z]/;
  const STRONG_RTL_RE = /[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const STRONG_LTR_RE = /[A-Za-z]/;

  const BLOCK_SELECTOR = [
    "p", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
    "figcaption", "summary",
    "[data-message-author-role] .markdown",
    "[data-message-author-role] .whitespace-pre-wrap",
    "[data-message-author-role] [class*='prose']"
  ].join(",");

  const LTR_SELECTOR = [
    "pre", "code", "kbd", "samp",
    ".katex", ".katex-display", "mjx-container", "math",
    "[data-language]", "[class*='code-block']"
  ].join(",");

  const COMPOSER_SELECTOR = [
    "textarea",
    "[contenteditable='true']",
    "[contenteditable='plaintext-only']",
    "[role='textbox']"
  ].join(",");

  const CHROME_SELECTOR = [
    "aside", "nav", "header",
    "[role='navigation']", "[role='menubar']", "[role='menu']", "[role='toolbar']"
  ].join(",");

  let state = {
    options: { ...DEFAULTS },
    observer: null,
    inputHandler: null
  };

  const originals = new WeakMap();

  function log(...args) {
    if (state.options.debug && global.console) console.debug("[HebrewRTL]", ...args);
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function firstStrong(text) {
    const value = normalizeText(text);
    for (const ch of value) {
      if (STRONG_RTL_RE.test(ch)) return "rtl";
      if (STRONG_LTR_RE.test(ch)) return "ltr";
    }
    return null;
  }

  function hasHebrew(text) { return HEBREW_RE.test(String(text || "")); }
  function hasRTL(text) { return RTL_RE.test(String(text || "")); }
  function hasLatin(text) { return LATIN_RE.test(String(text || "")); }

  function directionOf(text, mode = state.options.mode) {
    const value = normalizeText(text);
    if (!value || mode === "off") return null;
    if (mode === "force") return "rtl";

    const strong = firstStrong(value);
    if (strong === "rtl") return "rtl";
    if (strong === "ltr" && !hasRTL(value)) return "ltr";

    // A ticker/number/link may appear before the Hebrew sentence. If Hebrew
    // exists anywhere in the paragraph, Hebrew remains the base direction.
    if (hasHebrew(value)) return "rtl";
    if (hasRTL(value)) return "rtl";
    return strong || "ltr";
  }

  function isAppChrome(el) {
    return !!(el && el.closest && el.closest(CHROME_SELECTOR));
  }

  function isInsideComposer(el) {
    return !!(el && el.closest && el.closest(COMPOSER_SELECTOR));
  }

  function isExcluded(el) {
    if (!el || el.nodeType !== 1) return true;
    if (isAppChrome(el)) return true;
    if (isInsideComposer(el)) return true;
    if (el.closest("pre, code, kbd, samp, script, style, svg, canvas")) return true;
    return false;
  }

  function snapshot(el) {
    if (!el || originals.has(el)) return;
    originals.set(el, {
      hadDir: el.hasAttribute("dir"),
      dir: el.getAttribute("dir"),
      textAlign: el.style.getPropertyValue("text-align"),
      textAlignPriority: el.style.getPropertyPriority("text-align"),
      unicodeBidi: el.style.getPropertyValue("unicode-bidi"),
      unicodeBidiPriority: el.style.getPropertyPriority("unicode-bidi"),
      direction: el.style.getPropertyValue("direction"),
      directionPriority: el.style.getPropertyPriority("direction")
    });
  }

  function restoreProperty(style, name, value, priority) {
    if (value) style.setProperty(name, value, priority || "");
    else style.removeProperty(name);
  }

  function restoreOriginal(el) {
    if (!el) return;
    const original = originals.get(el);
    if (!original) return;

    if (original.hadDir) el.setAttribute("dir", original.dir ?? "");
    else el.removeAttribute("dir");

    restoreProperty(el.style, "text-align", original.textAlign, original.textAlignPriority);
    restoreProperty(el.style, "unicode-bidi", original.unicodeBidi, original.unicodeBidiPriority);
    restoreProperty(el.style, "direction", original.direction, original.directionPriority);
    originals.delete(el);
  }

  function conversationRoots() {
    const roots = Array.from(document.querySelectorAll("main, [role='main']"))
      .filter(el => !isAppChrome(el));
    if (roots.length) return roots;

    const message = document.querySelector("[data-message-author-role]");
    if (message) {
      const parent = message.closest("main, section, article, div");
      if (parent) return [parent];
    }
    return [document.body];
  }

  function qsaIncluding(root, selector) {
    const out = [];
    if (root && root.matches && root.matches(selector)) out.push(root);
    if (root && root.querySelectorAll) out.push(...root.querySelectorAll(selector));
    return out;
  }

  function applyBlockDirection(el, explicitMode) {
    if (!el || isExcluded(el)) return;
    const mode = explicitMode || state.options.mode;
    if (mode === "off") return;

    const dir = directionOf(el.textContent || "", mode);
    if (!dir) return;

    snapshot(el);
    el.setAttribute(MARK_BLOCK, dir);
    el.setAttribute("dir", dir);
    el.style.textAlign = dir === "rtl" ? "right" : "left";

    // We already determined the base direction. `plaintext` would ignore that
    // direction and re-detect from the first strong character, so use isolate.
    el.style.unicodeBidi = "isolate";
  }

  function forceLTR(root) {
    for (const el of qsaIncluding(root, LTR_SELECTOR)) {
      if (isAppChrome(el) || isInsideComposer(el)) continue;
      snapshot(el);
      el.setAttribute(MARK_LTR, "1");
      el.setAttribute("dir", "ltr");
      el.style.textAlign = "left";
      el.style.unicodeBidi = "isolate";
    }

    for (const el of qsaIncluding(root, "a, bdi, time")) {
      if (isAppChrome(el) || isInsideComposer(el)) continue;
      const dir = directionOf(el.textContent || "", "smart");
      if (!dir) continue;
      snapshot(el);
      el.setAttribute(MARK_LTR, "1");
      el.setAttribute("dir", dir);
      el.style.unicodeBidi = "isolate";
    }
  }

  function processTables(root) {
    if (!state.options.tables) return;
    for (const table of qsaIncluding(root, "table")) {
      if (isAppChrome(table) || isInsideComposer(table)) continue;
      const text = table.textContent || "";
      if (!hasRTL(text) && state.options.mode !== "force") continue;

      snapshot(table);
      table.setAttribute(MARK_TABLE, "1");
      table.setAttribute("dir", "rtl");
      table.style.direction = "rtl";

      for (const cell of table.querySelectorAll("th, td")) {
        const dir = directionOf(cell.textContent || "", "smart") || "rtl";
        snapshot(cell);
        cell.setAttribute(MARK_CELL, "1");
        cell.setAttribute("dir", dir);
        cell.style.textAlign = dir === "rtl" ? "right" : "left";
        cell.style.unicodeBidi = "isolate";
      }
    }
  }

  function applyComposerDirection(el) {
    if (!state.options.composer || !el || isAppChrome(el)) return;
    const raw = (("value" in el ? el.value : el.textContent) || "").trim();
    const mode = state.options.mode === "force" ? "force" : "smart";
    const dir = directionOf(raw, mode);

    snapshot(el);
    el.setAttribute(MARK_COMPOSER, "1");

    if (!dir) {
      el.setAttribute("dir", "auto");
      el.style.textAlign = "start";
      el.style.unicodeBidi = "normal";
      return;
    }

    el.setAttribute("dir", dir);
    el.style.textAlign = dir === "rtl" ? "right" : "left";
    el.style.unicodeBidi = "isolate";
  }

  function processComposers(root = document) {
    if (!state.options.composer) return;
    for (const el of qsaIncluding(root, COMPOSER_SELECTOR)) {
      if (el.closest("pre, code") || isAppChrome(el)) continue;
      applyComposerDirection(el);
    }
  }

  function processRoot(root) {
    if (!root || state.options.mode === "off") return;
    for (const el of qsaIncluding(root, BLOCK_SELECTOR)) applyBlockDirection(el);
    forceLTR(root);
    processTables(root);
  }

  function process(root = document) {
    if (typeof document === "undefined") return;
    if (state.options.mode === "off") {
      clearAll();
      return;
    }

    // styles.css only applies while this marker is present.
    if (!document.documentElement.hasAttribute(MARK_ACTIVE)) {
      document.documentElement.setAttribute(MARK_ACTIVE, "1");
    }

    if (root === document || root === document.documentElement || root === document.body) {
      for (const conversationRoot of conversationRoots()) processRoot(conversationRoot);
      processComposers(document);
      return;
    }

    if (root.nodeType === 1 && !isAppChrome(root)) {
      processRoot(root);
      processComposers(root);
    }
  }

  function clearMarked(selector, marker) {
    if (typeof document === "undefined") return;
    for (const el of document.querySelectorAll(selector)) {
      el.removeAttribute(marker);
      restoreOriginal(el);
    }
  }

  function clearTables() {
    clearMarked(`[${MARK_CELL}]`, MARK_CELL);
    clearMarked(`[${MARK_TABLE}]`, MARK_TABLE);
  }

  function clearComposers() {
    clearMarked(`[${MARK_COMPOSER}]`, MARK_COMPOSER);
  }

  function clearAll() {
    if (typeof document === "undefined") return;
    document.documentElement.removeAttribute(MARK_ACTIVE);
    clearTables();
    clearComposers();
    clearMarked(`[${MARK_LTR}]`, MARK_LTR);
    clearMarked(`[${MARK_BLOCK}]`, MARK_BLOCK);
  }

  function onMutations(mutations) {
    const seen = new Set();
    for (const mutation of mutations) {
      const target = mutation.target && mutation.target.nodeType === 1
        ? mutation.target
        : mutation.target && mutation.target.parentElement;

      if (target && !isAppChrome(target) && !seen.has(target)) {
        seen.add(target);
        process(target);
      }

      for (const added of mutation.addedNodes || []) {
        const el = added.nodeType === 1 ? added : added.parentElement;
        if (el && !isAppChrome(el) && !seen.has(el)) {
          seen.add(el);
          process(el);
        }
      }
    }
  }

  function onInput(event) {
    const target = event.target;
    if (!target || !target.matches || !target.matches(COMPOSER_SELECTOR)) return;
    applyComposerDirection(target);
  }

  function installObserver() {
    if (!state.options.observe || state.observer || typeof MutationObserver === "undefined") return;
    state.observer = new MutationObserver(onMutations);
    state.observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function uninstallObserver() {
    if (!state.observer) return;
    state.observer.disconnect();
    state.observer = null;
  }

  function installInputListener() {
    if (state.inputHandler || typeof document === "undefined") return;
    state.inputHandler = onInput;
    document.addEventListener("input", state.inputHandler, true);
  }

  function uninstallInputListener() {
    if (!state.inputHandler || typeof document === "undefined") return;
    document.removeEventListener("input", state.inputHandler, true);
    state.inputHandler = null;
  }

  function start(options = {}) {
    state.options = { ...state.options, ...options };
    if (typeof document === "undefined") return api;

    if (state.options.observe) installObserver();
    else uninstallObserver();

    if (state.options.composer) installInputListener();
    else {
      uninstallInputListener();
      clearComposers();
    }

    process(document);
    log("started", state.options);
    return api;
  }

  function setOptions(options = {}) {
    const previous = { ...state.options };
    state.options = { ...state.options, ...options };

    if (typeof document === "undefined") return { ...state.options };

    if (previous.tables && state.options.tables === false) clearTables();
    if (previous.composer && state.options.composer === false) {
      clearComposers();
      uninstallInputListener();
    } else if (!previous.composer && state.options.composer === true) {
      installInputListener();
    }

    if (previous.observe && state.options.observe === false) uninstallObserver();
    else if (!previous.observe && state.options.observe === true) installObserver();

    if (state.options.mode === "off") clearAll();
    else process(document);

    return { ...state.options };
  }

  function stop() {
    uninstallObserver();
    uninstallInputListener();
    clearAll();
  }

  const api = {
    version: VERSION,
    start,
    stop,
    process,
    setOptions,
    directionOf,
    firstStrong,
    hasHebrew,
    hasRTL,
    hasLatin
  };

  global.HebrewRTLEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
