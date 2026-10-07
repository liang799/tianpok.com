#!/usr/bin/env node
/** Re-render the hero film from its real Three.js scene. Requires ffmpeg and a
 * local Next preview for the exact font: npm run dev -- --port 3100. No capture
 * route, browser globals, or render controls are added to the deployed site. */
import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
function option(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? fallback : args[index + 1];
}
const width = Number(option("width", 1600));
const height = Number(option("height", 1000));
const fps = Number(option("fps", 24));
const duration = Number(option("duration", 14));
const sourceUrl = option("source-url", "http://localhost:3100");
const output = path.resolve(root, option("output", "public/media"));
const smoke = args.includes("--smoke");
const keepFrames = args.includes("--keep-frames") || smoke;
const webm = args.includes("--webm");
const overscan = height / (width / 2.5);
const count = Math.round(duration * fps);
if (
  ![width, height, fps, count].every(
    (value) => Number.isInteger(value) && value > 0,
  )
) {
  throw new Error(
    "Width, height, frame rate and frame count must be positive integers.",
  );
}

const started = performance.now();
const frames = await mkdtemp(path.join(tmpdir(), "tianpok-intro-"));
await mkdir(output, { recursive: true });
const asset = (name) => path.join(output, `construction-intro${name}`);
let browser;
let vite;
const errors = [];

function run(command, parameters) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, parameters, {
      cwd: root,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let message = "";
    child.stderr.on("data", (chunk) => {
      message = (message + chunk).slice(-8000);
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited ${code}: ${message}`)),
    );
  });
}

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function frameAt(id) {
  const time = (id / Math.max(1, count - 1)) * duration;
  const initialHold = duration * (0.25 / 14);
  const building = duration * (11.5 / 14);
  const transition = duration * (1.75 / 14);
  return {
    id,
    progress: Math.max(0, Math.min(1, (time - initialHold) / building)),
    presentation: smooth((time - initialHold - building) / transition),
    overscan,
  };
}

try {
  browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(sourceUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const typography = await page.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (
            rule instanceof CSSFontFaceRule &&
            /inter/i.test(rule.style.fontFamily)
          ) {
            rules.push({
              css: rule.cssText,
              href: sheet.href || location.href,
            });
          }
        }
      } catch {
        /* Cross-origin sheets are not part of the local Next font. */
      }
    }
    return { family: getComputedStyle(document.body).fontFamily, rules };
  });
  if (!typography.rules.length)
    throw new Error(
      "Could not find the live Inter font. Start the Next preview before rendering.",
    );
  let fontCss = "";
  for (const rule of typography.rules) {
    let css = rule.css;
    for (const match of [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]) {
      const response = await fetch(new URL(match[1], rule.href));
      if (!response.ok)
        throw new Error(`Font fetch failed: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      css = css.replace(
        match[0],
        `url(data:font/woff2;base64,${bytes.toString("base64")})`,
      );
    }
    fontCss += css;
  }

  const entryId = "/@construction-intro-capture.js";
  const virtualId = `\0${entryId}`;
  const entry = `
    import React, { useCallback, useEffect, useRef, useState } from "react";
    import { createRoot } from "react-dom/client";
    import ConstructionCanvas from "/src/components/construction-3d/canvas.tsx";
    import styles from "/src/components/construction-3d/scene.module.css";
    const h = React.createElement;
    const noop = () => {};
    function Capture() {
      const [frame, setFrame] = useState({ id: -1, progress: 0, presentation: 0, overscan: ${overscan} });
      const [live, setLive] = useState(false);
      const pending = useRef(null);
      const label = useRef(null);
      useEffect(() => {
        window.__constructionCapture = {
          seek: (next) => new Promise((resolve) => { pending.current = resolve; setFrame(next); }),
          live: () => new Promise((resolve) => { pending.current = resolve; setLive(true); })
        };
      }, []);
      const project = useCallback((x, y, fontSize) => {
        if (label.current) Object.assign(label.current.style, { left: x + "px", top: y + "px", fontSize: fontSize + "px" });
      }, []);
      const rendered = useCallback((progress, sample, objects) => {
        const resolve = pending.current;
        if (!resolve) return;
        pending.current = null;
        requestAnimationFrame(() => resolve({ progress, phase: sample.phase, placed: objects.placedCount, pieces: objects.pieceCount }));
      }, []);
      return h("div", { id: "capture", className: styles.scene, "data-overview": "true", "data-renderer": "webgl", style: { width: ${width}, height: live ? ${width / 2.5} : ${height}, aspectRatio: "auto", overflow: "hidden" } },
        h(ConstructionCanvas, { key: Number(live), captureFrame: live ? undefined : frame, animated: false, dark: false, overview: live, ambientMotion: false,
          onFrame: rendered, onProjectLabel: project, onLifeFrame: noop,
          onReady: () => { window.__constructionReady = true; },
          onFailure: () => { window.__constructionError = "WebGL renderer failed"; }
        }),
        h("div", { ref: label, className: styles.siteLabel }, "Building", h("br"), "a brighter", h("br"), "digital", h("br"), "tomorrow", h("span"))
      );
    }
    createRoot(document.getElementById("root")).render(h(Capture));
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
    html,body{margin:0;padding:0;background:transparent;font-family:${typography.family};-webkit-font-smoothing:antialiased;}
    *{box-sizing:border-box;}#root{width:${width}px;height:${height}px;}
  </style></head><body><div id="root"></div><script type="module" src="${entryId}"></script></body></html>`;
  vite = await createServer({
    root,
    configFile: false,
    publicDir: false,
    logLevel: "error",
    resolve: { alias: { "@": path.join(root, "src") } },
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
    oxc: { jsx: { runtime: "automatic" } },
    optimizeDeps: {
      include: [
        "react",
        "react-dom/client",
        "@react-three/fiber",
        "motion/react",
        "three",
      ],
    },
    server: {
      host: "127.0.0.1",
      port: 47131,
      strictPort: false,
      hmr: false,
      watch: null,
    },
    plugins: [
      {
        name: "temporary-construction-film",
        configureServer(server) {
          server.middlewares.use((request, response, next) => {
            if (request.url !== "/") return next();
            response.setHeader("Content-Type", "text/html");
            response.end(html);
          });
        },
        resolveId(id) {
          if (id === entryId) return virtualId;
        },
        load(id) {
          if (id === virtualId) return entry;
        },
      },
    ],
  });
  await vite.listen();
  const address = vite.httpServer.address();
  if (!address || typeof address === "string")
    throw new Error("Capture preview did not open a TCP port.");
  await page.goto(`http://127.0.0.1:${address.port}`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(
    () => window.__constructionReady && window.__constructionCapture,
    undefined,
    { timeout: 45000 },
  );
  await page.evaluate(() => document.fonts.ready);
  if (errors.length) throw new Error(errors.join("\n"));

  const captureStarted = performance.now();
  const indices = smoke
    ? [0, count - 1]
    : Array.from({ length: count }, (_, index) => index);
  const checkpoints = [];
  let placed = -1;
  console.log(
    `Capturing ${indices.length} frames at ${width}×${height}, ${fps}fps; temporary frames: ${frames}`,
  );
  for (const index of indices) {
    const frame = frameAt(index);
    const rendered = await page.evaluate(
      (next) => window.__constructionCapture.seek(next),
      frame,
    );
    await page.locator("#capture").screenshot({
      path: path.join(frames, `${String(index).padStart(5, "0")}.png`),
      omitBackground: true,
    });
    if (rendered.placed !== placed) {
      checkpoints.push({ frame: index, ...rendered });
      placed = rendered.placed;
    }
    if (index % fps === 0)
      console.log(
        `Frame ${index + 1}/${count}; ${rendered.placed}/8 pieces placed`,
      );
  }
  if (placed !== 8)
    throw new Error(
      "Final frame does not contain all eight placed structural parts.",
    );
  const captureSeconds = (performance.now() - captureStarted) / 1000;
  await page.evaluate(() => window.__constructionCapture.live());
  const live = await page.locator("#capture").screenshot({
    path: path.join(frames, "live-overview.png"),
    omitBackground: true,
  });
  const final = await readFile(
    path.join(frames, `${String(count - 1).padStart(5, "0")}.png`),
  );
  const finalFrameMatch = await page.evaluate(
    async ({ final, live, top, height }) => {
      const pixels = async (data, offset) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, -offset);
        return context.getImageData(0, 0, canvas.width, height).data;
      };
      const [a, b] = await Promise.all([pixels(final, top), pixels(live, 0)]);
      let changed = 0;
      let maximumChannelDifference = 0;
      for (let pixel = 0; pixel < a.length; pixel += 4) {
        let difference = 0;
        for (let channel = 0; channel < 4; channel++) {
          difference = Math.max(
            difference,
            Math.abs(a[pixel + channel] - b[pixel + channel]),
          );
        }
        maximumChannelDifference = Math.max(
          maximumChannelDifference,
          difference,
        );
        if (difference > 8) changed++;
      }
      return {
        changedPixels: changed,
        totalPixels: a.length / 4,
        maximumChannelDifference,
        changedFraction: changed / (a.length / 4),
      };
    },
    {
      final: final.toString("base64"),
      live: live.toString("base64"),
      top: (height - width / 2.5) / 2,
      height: width / 2.5,
    },
  );
  if (finalFrameMatch.changedFraction > 0.001) {
    throw new Error(
      `Final frame differs from the normal live overview: ${JSON.stringify(finalFrameMatch)}`,
    );
  }
  if (smoke) {
    console.log(
      JSON.stringify(
        { smoke: true, frames, captureSeconds, checkpoints, finalFrameMatch },
        null,
        2,
      ),
    );
  } else {
    const encodeStarted = performance.now();
    const input = path.join(frames, "%05d.png");
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(fps),
      "-i",
      input,
      "-f",
      "lavfi",
      "-i",
      `color=c=0xfaf9f6:s=${width}x${height}:r=${fps}`,
      "-filter_complex",
      "[1:v][0:v]overlay=shortest=1:format=auto,format=yuv420p[v]",
      "-map",
      "[v]",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "21",
      "-movflags",
      "+faststart",
      "-an",
      asset(".mp4"),
    ]);
    if (webm)
      await run("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-framerate",
        String(fps),
        "-i",
        input,
        "-c:v",
        "libvpx-vp9",
        "-pix_fmt",
        "yuva420p",
        "-b:v",
        "0",
        "-crf",
        "31",
        "-cpu-used",
        "4",
        "-row-mt",
        "1",
        "-an",
        asset(".webm"),
      ]);
    for (const [index, suffix] of [
      [0, "-start.webp"],
      [count - 1, "-poster.webp"],
    ]) {
      await sharp(path.join(frames, `${String(index).padStart(5, "0")}.png`))
        .webp({ lossless: true, effort: 6 })
        .toFile(asset(suffix));
    }
    const files = [
      ".mp4",
      "-start.webp",
      "-poster.webp",
      ...(webm ? [".webm"] : []),
    ];
    const assets = await Promise.all(
      files.map(async (suffix) => ({
        name: path.basename(asset(suffix)),
        bytes: (await stat(asset(suffix))).size,
      })),
    );
    const manifest = {
      width,
      height,
      fps,
      duration: count / fps,
      frames: count,
      verticalOverscan: overscan,
      background: "#faf9f6",
      finalCameraWorldWidth: 32,
      finalCameraWorldHeight: 12.8 * overscan,
      fontFamily: typography.family,
      assets,
      checkpoints,
      finalFrameMatch,
      captureSeconds,
      encodeSeconds: (performance.now() - encodeStarted) / 1000,
      totalSeconds: (performance.now() - started) / 1000,
      reproduce: "node scripts/render-construction-intro.mjs",
    };
    await writeFile(asset(".json"), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(JSON.stringify(manifest, null, 2));
  }
} finally {
  await browser?.close();
  await vite?.close();
  if (!keepFrames) await rm(frames, { recursive: true, force: true });
}
