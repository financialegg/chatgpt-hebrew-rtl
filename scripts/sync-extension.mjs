import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const source = path.join(root, "core", "rtl-engine.js");
const target = path.join(root, "browser-extension", "rtl-engine.js");
fs.copyFileSync(source, target);
console.log(`Synced ${path.relative(root, source)} -> ${path.relative(root, target)}`);
