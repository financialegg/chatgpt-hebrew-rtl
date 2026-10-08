# Security

## Desktop injector

The desktop MVP launches ChatGPT/Codex with Chromium remote debugging bound to `127.0.0.1` on an ephemeral local port, then injects the RTL engine through the Chrome DevTools Protocol.

While the app is open, another process running on the same machine could potentially discover and connect to that local debugging endpoint. Do not use the desktop injector on an untrusted or multi-user machine.

For a production-grade public release, prefer a signed desktop integration or an official extension point when available.
