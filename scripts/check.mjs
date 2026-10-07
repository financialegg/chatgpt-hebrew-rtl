import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const jsFiles = [
  "core/rtl-engine.js",
  "browser-extension/rtl-engine.js",
  "browser-extension/content.js",
  "browser-extension/popup.js",
  "desktop/launcher.mjs",
  "scripts/sync-extension.mjs",
  "scripts/check.mjs",
  "test/core.test.mjs"
];

for (const rel of jsFiles) {
  execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "inherit" });
}

for (const rel of ["package.json", "browser-extension/manifest.json"]) {
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  console.log(`Valid JSON: ${rel}`);
}

const core = fs.readFileSync(path.join(root, "core/rtl-engine.js"), "utf8");
const ext = fs.readFileSync(path.join(root, "browser-extension/rtl-engine.js"), "utf8");
if (core !== ext) throw new Error("browser-extension/rtl-engine.js is out of sync; run npm run build");
console.log("Core and extension engine are in sync.");
