/**
 * Capture Conclave product screens and /story export frames via Chrome CDP.
 * Isolated --user-data-dir so Chrome does not hang on the default profile.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.CONCLAVE_URL || "http://127.0.0.1:43123";
const PORT = Number(process.env.CDP_PORT || 9333);
const USER_DATA = `/tmp/conclave-chrome-${Date.now()}`;
const CHROME = process.env.CHROME || "google-chrome";

const HIDE_OVERLAY = `
(() => {
  try { sessionStorage.setItem("conclave.splash.seen", "1"); } catch {}
  try { localStorage.setItem("conclave.notify.asked", "1"); } catch {}
  const zap = () => {
    document.documentElement.setAttribute("data-shot", "1");
    if (document.body) document.body.setAttribute("data-shot", "1");
    document.querySelectorAll("nextjs-portal, [data-next-badge-root], [data-nextjs-toast]").forEach((el) => {
      el.remove();
    });
  };
  zap();
  if (!document.getElementById("shot-hide-style")) {
    const style = document.createElement("style");
    style.id = "shot-hide-style";
    style.textContent = \`
      nextjs-portal, [data-next-badge-root], [data-nextjs-toast],
      [data-nextjs-dev-overlay], #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    \`;
    (document.head || document.documentElement).appendChild(style);
  }
  if (!window.__conclaveShotObs) {
    window.__conclaveShotObs = new MutationObserver(zap);
    window.__conclaveShotObs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
`;

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(t);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(t);
          reject(e);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitJson(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {
      /* retry */
    }
    await sleep(100);
  }
  throw new Error(`Chrome CDP not ready: ${url}`);
}

async function connectPage() {
  const list = await waitJson(`http://127.0.0.1:${PORT}/json/list`);
  const target = list.find((t) => t.type === "page") || list[0];
  if (!target?.webSocketDebuggerUrl) throw new Error("No Chrome page target");
  const pageWs = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    pageWs.addEventListener("open", resolve);
    pageWs.addEventListener("error", () => reject(new Error("page ws failed")));
  });
  return { page: new Cdp(pageWs), pageWs };
}

async function screenshotPage(page, { url, path, width, height, scale, mobile, waitMs, ready }) {
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  await page.send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: HIDE_OVERLAY });
  await page.send("Page.navigate", { url, transitionType: "reload" }, 60000);
  await page.send(
    "Runtime.evaluate",
    {
      expression: `new Promise((resolve) => {
        if (document.readyState === "complete") resolve(true);
        else window.addEventListener("load", () => resolve(true), { once: true });
      })`,
      awaitPromise: true,
    },
    25000
  );
  await page.send("Runtime.evaluate", { expression: HIDE_OVERLAY });
  if (ready) {
    await page.send("Runtime.evaluate", { expression: ready, awaitPromise: true }, 25000);
  }
  await page.send("Runtime.evaluate", {
    expression: `Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...[...document.images].map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
      ),
    ])`,
    awaitPromise: true,
  });
  await sleep(waitMs);
  await page.send("Runtime.evaluate", { expression: HIDE_OVERLAY });
  const { data } = await page.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(data, "base64"));
  console.log("wrote", path);
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--remote-allow-origins=*",
      `--user-data-dir=${USER_DATA}`,
      `--remote-debugging-port=${PORT}`,
      "--window-size=390,844",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  let stderr = "";
  chrome.stderr.on("data", (buf) => {
    stderr += String(buf);
  });
  try {
    const { page, pageWs } = await connectPage();
    const shots = resolve(ROOT, "public/social/shots");

    await screenshotPage(page, {
      url: `${BASE}/`,
      path: resolve(shots, "landing.png"),
      width: 390,
      height: 844,
      scale: 2,
      mobile: true,
      waitMs: 700,
    });

    await screenshotPage(page, {
      url: `${BASE}/login`,
      path: resolve(shots, "login.png"),
      width: 390,
      height: 844,
      scale: 2,
      mobile: true,
      waitMs: 800,
    });

    await screenshotPage(page, {
      url: `${BASE}/demo`,
      path: resolve(shots, "discover.png"),
      width: 390,
      height: 844,
      scale: 2,
      mobile: true,
      waitMs: 900,
      ready: `(async () => {
        const start = Date.now();
        while (Date.now() - start < 18000) {
          if (location.pathname.startsWith("/discover") && document.querySelector(".mp-person-card")) return true;
          await new Promise((r) => setTimeout(r, 200));
        }
        return false;
      })()`,
    });

    const exports = [
      { q: "story", w: 1080, h: 1920, file: "conclave-story.png" },
      { q: "feed", w: 1080, h: 1080, file: "conclave-feed.png" },
      { q: "portrait", w: 1080, h: 1350, file: "conclave-portrait.png" },
    ];
    for (const exp of exports) {
      await screenshotPage(page, {
        url: `${BASE}/story?export=${exp.q}`,
        path: resolve(ROOT, "public/social", exp.file),
        width: exp.w,
        height: exp.h,
        scale: 1,
        mobile: false,
        waitMs: 700,
        ready: `(async () => {
          await Promise.all([...document.images].map((img) =>
            img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
          ));
          return true;
        })()`,
      });
    }

    pageWs.close();
  } catch (err) {
    console.error(stderr.slice(-2000));
    throw err;
  } finally {
    chrome.kill("SIGTERM");
    await sleep(300);
    try {
      chrome.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
