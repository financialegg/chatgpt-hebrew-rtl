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

for (const rel of [
  "package.json",
  "browser-extension/manifest.json",
  ".agents/plugins/marketplace.json",
  "plugins/hebrew-rtl/plugin.json"
]) {
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  console.log(`Valid JSON: ${rel}`);
}

const marketplace = JSON.parse(fs.readFileSync(path.join(root, ".agents/plugins/marketplace.json"), "utf8"));
const pluginEntry = marketplace.plugins.find(plugin => plugin.name === "hebrew-rtl");
if (!pluginEntry) throw new Error("Codex marketplace does not contain the hebrew-rtl plugin.");
const pluginRoot = path.resolve(root, pluginEntry.source.path);
if (!fs.existsSync(path.join(pluginRoot, "plugin.json"))) throw new Error("Codex marketplace plugin source is missing plugin.json.");
const plugin = JSON.parse(fs.readFileSync(path.join(pluginRoot, "plugin.json"), "utf8"));
const skillPath = path.join(pluginRoot, "skills", "hebrew-rtl", "SKILL.md");
const skill = fs.readFileSync(skillPath, "utf8");
if (!plugin.skills || !skill.startsWith("---\n") || !/^name:\s*hebrew-rtl\s*$/m.test(skill)) {
  throw new Error("Codex plugin skill metadata is incomplete.");
}
console.log("Codex marketplace plugin and skill are present.");

const core = fs.readFileSync(path.join(root, "core/rtl-engine.js"), "utf8");
const ext = fs.readFileSync(path.join(root, "browser-extension/rtl-engine.js"), "utf8");
if (core !== ext) throw new Error("browser-extension/rtl-engine.js is out of sync; run npm run build");
console.log("Core and extension engine are in sync.");
