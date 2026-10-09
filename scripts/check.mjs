import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const jsFiles = [
  "core/rtl-engine.js",
  "desktop/launcher.mjs",
  "scripts/check.mjs",
  "test/core.test.mjs"
];

for (const rel of jsFiles) {
  execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "inherit" });
}

for (const rel of [
  "package.json",
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
if (!plugin.skills || !/^---\r?\n/.test(skill) || !/^name:\s*hebrew-rtl\s*$/m.test(skill)) {
  throw new Error("Codex plugin skill metadata is incomplete.");
}
console.log("Codex marketplace plugin and skill are present.");

const core = fs.readFileSync(path.join(root, "core/rtl-engine.js"), "utf8");
const versions = {
  "package.json": JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
  "plugins/hebrew-rtl/plugin.json": plugin.version,
  "core/rtl-engine.js": core.match(/const VERSION = "([^"]+)"/)?.[1],
  "desktop/launcher.mjs": fs.readFileSync(path.join(root, "desktop/launcher.mjs"), "utf8").match(/DESKTOP_VERSION = "([^"]+)"/)?.[1]
};
if (new Set(Object.values(versions)).size !== 1) {
  throw new Error(`Version mismatch: ${JSON.stringify(versions)}`);
}
console.log(`All versions match: ${versions["package.json"]}`);

const agents = fs.readFileSync(path.join(root, "codex/AGENTS.md"), "utf8");
if (!agents.includes("# Global Hebrew RTL response instructions for Codex") || !/^כלל 12:/m.test(agents)) {
  throw new Error("codex/AGENTS.md is missing its heading or rules.");
}
console.log("Codex AGENTS.md rules are present.");

const ciRules = fs.readFileSync(path.join(root, "student-kit/Hebrew_RTL_Custom_Instructions.txt"), "utf8").replace(/\r\n/g, "\n").trim();
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8").replace(/\r\n/g, "\n");
if (readme.split(ciRules).length < 3) throw new Error("README must contain the student-kit rules in both the test message and the rules block.");
console.log("README carries the current ChatGPT rules.");

// Guard against mixed student instructions after future updates.
for (const rel of ["docs/CUSTOM_INSTRUCTIONS_HE.txt", "student-kit/hebrew-rtl-output/assets/custom-instructions.txt"]) {
  const copy = fs.readFileSync(path.join(root, rel), "utf8").replace(/\\r\\n/g, "\\n").trim();
  if (copy !== ciRules) throw new Error(`Out-of-sync student instructions: ${rel}`);
}
if (ciRules.length > 1500 || (ciRules.match(/^כלל (\\d+):/gm) || []).length !== 12) {
  throw new Error("ChatGPT personal instructions must have 12 rules and fit within 1500 characters.");
}
if (!agents.includes(ciRules)) throw new Error("Codex AGENTS.md must embed the current 12 common rules.");
if (!readme.includes("Personalization") || !readme.includes("Custom Instructions") || !readme.includes("23 בדיקות")) {
  throw new Error("README must explain Personalization and the updated RTL tests.");
}
const rtlTests = fs.readFileSync(path.join(root, "student-kit/hebrew-rtl-output/references/rtl-tests.md"), "utf8");
if (!rtlTests.includes("בדיקה 23") || !rtlTests.includes("לייב ניישן")) {
  throw new Error("Mixed-language financial stress tests are missing.");
}
console.log("Student instructions, Codex rules, onboarding, and 23 RTL tests are synchronized.");
