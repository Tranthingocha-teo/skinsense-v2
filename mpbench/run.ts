import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  ANALYSIS_MAX_SIDE,
  boundingBox,
  captureIssues,
  computeZoneReading,
  faceFraming,
  meanLuma,
  partitionSkinPixels,
  sharpness,
  ZONES,
  type Landmark,
} from "@skinsense/domain";

const MPBENCH_DIR = new URL(".", import.meta.url).pathname;
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
const SERVE_MIME: Record<string, string> = { ".html": "text/html", ".js": "text/javascript" };

type BenchResult = { width: number; height: number; landmarks: Landmark[]; skinMask: number[]; rgba: number[] };

function startServer(): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const route = (req.url ?? "/").split("?")[0];
      const filePath = path.join(MPBENCH_DIR, route === "/" ? "bench.html" : route);
      try {
        const body = await readFile(filePath);
        res.setHeader("Content-Type", SERVE_MIME[path.extname(filePath)] ?? "application/octet-stream");
        res.end(body);
      } catch {
        res.statusCode = 404;
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

async function toDataUrl(photoPath: string): Promise<string> {
  const ext = path.extname(photoPath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`mpbench: unsupported photo extension "${ext}" (expected .jpg/.jpeg/.png)`);
  const bytes = await readFile(photoPath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

// Runs the real web capture pipeline (FaceLandmarker + ImageSegmenter, via
// bench.html in an actual browser) against one photo, then reuses
// @skinsense/domain's real partitionSkinPixels to classify every skin pixel
// into a zone — so ADR 0003's fixtures exercise the same zone logic the app ships.
// Ticket 07 rating pass: `bun run.ts --rate <photos...>` prints one row per
// photo (quality signals + issues), no fixture written — the rated table is
// what moves the provisional QUALITY cut-offs.
// Ticket 17 live mode: `bun run.ts --live` opens bench.html?live on the webcam
// and stays open until the window is closed; the per-frame zone readings are
// drawn in the page, which imports @skinsense/domain from the bundle built here.
async function main() {
  const live = process.argv[2] === "--live";
  const rate = process.argv[2] === "--rate";
  const photoPaths = process.argv.slice(rate ? 3 : 2);
  if (photoPaths.length === 0 && !live) {
    console.error("Usage: bun run.ts <path-to-photo.jpg> | bun run.ts --rate <photos...> | bun run.ts --live");
    process.exit(1);
  }

  if (live) {
    execFileSync("bun", [
      "build",
      path.resolve(MPBENCH_DIR, "../packages/domain/src/index.ts"),
      "--outfile",
      path.join(MPBENCH_DIR, "dist/domain.js"),
      "--format",
      "esm",
    ]);
  }
  const server = await startServer();
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  try {
    const context = await browser.newContext();
    if (live) await context.grantPermissions(["camera"], { origin: server.url });
    const page = await context.newPage();
    if (live) {
      await page.goto(`${server.url}/bench.html?live`);
      await page.waitForEvent("close", { timeout: 0 });
      return;
    }
    await page.goto(`${server.url}/bench.html`);
    await page.waitForFunction(() => (window as unknown as { mpbenchReady?: boolean }).mpbenchReady === true);
    if (rate) console.log("photo\tbrightness\tfaceWidth\tcenterOffset\tyaw\tsharpness\tissues");

    for (const photoPath of photoPaths) {
      const name = path.basename(photoPath, path.extname(photoPath));
      const dataUrl = await toDataUrl(path.resolve(photoPath));
      let result: BenchResult;
      try {
        result = (await page.evaluate(
          ([url, maxSide]) =>
            (window as unknown as { runBench(u: string, m: number): Promise<BenchResult> }).runBench(url, maxSide),
          [dataUrl, ANALYSIS_MAX_SIDE] as const,
        )) as BenchResult;
      } catch (err) {
        if (!rate) throw err;
        const message = err instanceof Error ? err.message : String(err);
        console.log(`${name}\t-\t-\t-\t-\t-\t${/no face/.test(message) ? "noFace" : message.split("\n")[0]}`);
        continue;
      }

      const skinMask = Uint8Array.from(result.skinMask);
      const brightness = meanLuma(result.rgba, skinMask);
      const framing = faceFraming(result.landmarks);
      const focus = sharpness(result.rgba, result.width, result.height, boundingBox(result.landmarks));
      const issues = captureIssues({ brightness, framing, sharpness: focus });
      if (rate) {
        console.log(
          [name, brightness.toFixed(1), framing.faceWidth.toFixed(3), framing.centerOffset.toFixed(3), framing.yaw.toFixed(3), focus.toFixed(1), issues.join(",") || "-"].join("\t"),
        );
        continue;
      }

      const { allSkinPixels, zonePixels } = partitionSkinPixels({ ...result, skinMask }, result.rgba);
      const outDir = path.resolve(MPBENCH_DIR, "../packages/domain/src/__fixtures__/redness");
      await mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `${name}.json`);
      await writeFile(outPath, JSON.stringify({ allSkinPixels, zonePixels }, null, 2));

      console.log(`Wrote ${outPath}`);
      console.log(`allSkin: ${allSkinPixels.length}px`);
      // Capture-quality signals (ticket 07): printed so Dinh's rating pass over a
      // test photo set can turn these provisional QUALITY cut-offs into validated ones.
      console.log(
        `quality: brightness=${brightness.toFixed(1)} faceWidth=${framing.faceWidth.toFixed(3)} centerOffset=${framing.centerOffset.toFixed(3)} yaw=${framing.yaw.toFixed(3)} sharpness=${focus.toFixed(1)} issues=[${issues.join(",")}]`,
      );
      for (const zone of ZONES) {
        const reading = computeZoneReading(zonePixels[zone], allSkinPixels);
        console.log(
          `${zone}: ${reading.pixelCount}px  redness=${reading.redness.toFixed(3)}  unevenness=${reading.unevenness.toFixed(3)}`,
        );
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
