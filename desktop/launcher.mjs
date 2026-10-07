#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

function hasFlag(name) {
  return args.includes(name);
}

const mode = argValue("--mode") || "smart";
if (!["smart", "force", "off"].includes(mode)) {
  throw new Error(`Invalid --mode: ${mode}. Use smart, force or off.`);
}
const explicitExe = argValue("--exe");
const debug = hasFlag("--debug");

function log(...values) {
  console.log("[Hebrew RTL]", ...values);
}

function candidateExecutables() {
  const out = [];
  const platform = os.platform();

  if (platform === "win32") {
    const local = process.env.LOCALAPPDATA || "";
    const pf = process.env.PROGRAMFILES || "";
    out.push(
      path.join(local, "Programs", "Codex", "Codex.exe"),
      path.join(local, "Programs", "ChatGPT", "ChatGPT.exe"),
      path.join(local, "Programs", "OpenAI", "ChatGPT", "ChatGPT.exe"),
      path.join(local, "OpenAI", "ChatGPT", "ChatGPT.exe"),
      path.join(pf, "Codex", "Codex.exe"),
      path.join(pf, "ChatGPT", "ChatGPT.exe")
    );
    for (const name of ["Codex.exe", "ChatGPT.exe"]) {
      try {
        const found = execFileSync("where.exe", [name], { encoding: "utf8" })
          .split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        out.push(...found);
      } catch {}
    }
  } else if (platform === "darwin") {
    out.push(
      "/Applications/ChatGPT.app/Contents/MacOS/ChatGPT",
      "/Applications/Codex.app/Contents/MacOS/Codex",
      path.join(os.homedir(), "Applications", "ChatGPT.app", "Contents", "MacOS", "ChatGPT"),
      path.join(os.homedir(), "Applications", "Codex.app", "Contents", "MacOS", "Codex")
    );
  } else {
    out.push("/usr/bin/codex", "/usr/local/bin/codex", "/opt/Codex/codex", "/opt/ChatGPT/chatgpt");
  }

  return [...new Set(out)];
}

function resolveExe() {
  if (explicitExe) {
    const p = path.resolve(explicitExe);
    if (!fs.existsSync(p)) throw new Error(`Executable not found: ${p}`);
    return p;
  }
  const found = candidateExecutables().find(p => p && fs.existsSync(p));
  if (!found) {
    throw new Error('Could not find ChatGPT/Codex automatically. Run again with --exe "FULL_PATH_TO_EXE".');
  }
  return found;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : null;
      server.close(() => resolve(port));
    });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getTargets(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!res.ok) throw new Error(`DevTools endpoint returned HTTP ${res.status}`);
  return res.json();
}

async function evaluate(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = Math.floor(Math.random() * 1000000) + 1;
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("CDP evaluate timed out"));
    }, 8000);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        id,
        method: "Runtime.evaluate",
        params: { expression, awaitPromise: false, returnByValue: true }
      }));
    });

    ws.addEventListener("message", event => {
      let msg;
      try { msg = JSON.parse(String(event.data)); } catch { return; }
      if (msg.id !== id) return;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      if (msg.error) reject(new Error(msg.error.message || "Runtime.evaluate failed"));
      else resolve(msg.result);
    });

    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("WebSocket connection failed"));
    });
  });
}

function buildPayload() {
  const core = fs.readFileSync(path.join(root, "core", "rtl-engine.js"), "utf8");
  const boot = `
;(() => {
  try {
    if (globalThis.HebrewRTLEngine) {
      globalThis.HebrewRTLEngine.start({
        mode: ${JSON.stringify(mode)},
        tables: true,
        composer: true,
        observe: true,
        debug: ${debug ? "true" : "false"}
      });
      globalThis.__HEBREW_RTL_DESKTOP__ = true;
      console.info("[Hebrew RTL] injected");
    }
  } catch (e) { console.error("[Hebrew RTL] injection failed", e); }
})();`;
  return core + boot;
}

async function main() {
  const exe = resolveExe();
  const port = await getFreePort();
  const payload = buildPayload();

  log(`Launching: ${exe}`);
  log(`Mode: ${mode}`);
  log(`Local DevTools port: ${port}`);

  const child = spawn(exe, [
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${port}`
  ], { detached: true, stdio: "ignore" });
  child.unref();

  let targets = [];
  for (let i = 0; i < 80; i++) {
    try {
      targets = await getTargets(port);
      if (targets.length) break;
    } catch {}
    await sleep(250);
  }

  if (!targets.length) {
    throw new Error("The app started but no DevTools targets were found. This build may block remote debugging.");
  }

  const injected = new Set();

  async function injectNewTargets() {
    let list;
    try { list = await getTargets(port); }
    catch { return false; }

    for (const target of list) {
      if (!target.webSocketDebuggerUrl) continue;
      if (!["page", "webview", "iframe"].includes(target.type)) continue;
      const key = target.id || target.webSocketDebuggerUrl;
      if (injected.has(key)) continue;
      try {
        await evaluate(target.webSocketDebuggerUrl, payload);
        injected.add(key);
        log(`Injected into: ${target.title || target.url || target.type}`);
      } catch (err) {
        if (debug) log(`Skipped target: ${err.message}`);
      }
    }
    return true;
  }

  await injectNewTargets();
  log("RTL engine is active. Keep this launcher open so new windows/reloads are also injected.");
  log("Press Ctrl+C to stop the injector. Closing the injector does not close ChatGPT/Codex.");

  while (true) {
    const alive = await injectNewTargets();
    if (!alive) {
      log("App DevTools endpoint closed. Exiting.");
      break;
    }
    await sleep(1500);
  }
}

main().catch(err => {
  console.error("\n[Hebrew RTL] ERROR:", err.message);
  console.error("Tip: close ChatGPT/Codex completely and run again, or pass --exe with the full executable path.\n");
  process.exit(1);
});
