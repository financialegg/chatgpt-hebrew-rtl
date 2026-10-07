import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const corePath = path.join(root, "core", "rtl-engine.js");
const desktopPath = path.join(root, "desktop", "launcher.mjs");
const code = fs.readFileSync(corePath, "utf8");

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(code, context);

const rtl = context.HebrewRTLEngine;

test("Hebrew paragraph is RTL", () => {
  assert.equal(rtl.directionOf("מניית אנבידיה עלתה היום."), "rtl");
});

test("English paragraph is LTR", () => {
  assert.equal(rtl.directionOf("NVIDIA reported strong revenue."), "ltr");
});

test("Ticker before Hebrew still resolves RTL", () => {
  assert.equal(rtl.directionOf("NVDA עלתה ב-5.3% אחרי הדוח."), "rtl");
});

test("Numbers before Hebrew still resolve RTL", () => {
  assert.equal(rtl.directionOf("5.3% עלייה במניה בעקבות הדוח."), "rtl");
});

test("Mixed finance sentence remains RTL", () => {
  assert.equal(rtl.directionOf("S&P 500 עלה ב-1.3% ומניית AMD התחזקה."), "rtl");
});

test("Hebrew with HBM/DRAM remains RTL", () => {
  assert.equal(rtl.directionOf("תחום HBM/DRAM ממשיך להתחזק."), "rtl");
});

test("Pure URL-like English stays LTR", () => {
  assert.equal(rtl.directionOf("https://chatgpt.com/codex"), "ltr");
});

test("Force mode returns RTL", () => {
  assert.equal(rtl.directionOf("English only", "force"), "rtl");
});

test("Off mode returns null", () => {
  assert.equal(rtl.directionOf("עברית", "off"), null);
});

test("Hebrew detection", () => {
  assert.equal(rtl.hasHebrew("MRVL היא מניה"), true);
  assert.equal(rtl.hasHebrew("MRVL stock"), false);
});

test("Known-direction rendering does not use unicode-bidi plaintext", () => {
  assert.equal(code.includes('unicodeBidi = "plaintext"'), false);
  assert.equal(code.includes('unicodeBidi = "isolate"'), true);
});

test("Original DOM state is snapshotted and restorable", () => {
  assert.match(code, /const originals = new WeakMap\(\)/);
  assert.match(code, /function restoreOriginal\(el\)/);
});

test("Feature toggles clear tables and composer state", () => {
  assert.match(code, /clearTables\(\)/);
  assert.match(code, /clearComposers\(\)/);
  assert.match(code, /state\.options\.tables === false/);
  assert.match(code, /state\.options\.composer === false/);
});

test("Desktop payload is reload-safe and does not rely on a permanent injected-target set", () => {
  const desktop = fs.readFileSync(desktopPath, "utf8");
  assert.equal(desktop.includes("const injected = new Set()"), false);
  assert.match(desktop, /__HEBREW_RTL_DESKTOP_VERSION__/);
  assert.match(desktop, /refreshTargets\(\)/);
});
