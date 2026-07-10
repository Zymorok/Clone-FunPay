import { once } from "node:events";
import { access, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cosmeticsRoot = path.join(projectRoot, "public", "assets", "website", "profile-cosmetics");
const destinationRoot = path.join(cosmeticsRoot, "animated-videos");
const categories = ["avatars", "frames"];
const width = 192;
const height = 192;
const framesPerSecond = 30;
const force = process.argv.includes("--force");
const categoryArgument = process.argv.find((argument) => argument.startsWith("--category="))?.split("=")[1];
const limitArgument = Number(process.argv.find((argument) => argument.startsWith("--limit="))?.split("=")[1] ?? 0);

if (!ffmpegPath) {
  throw new Error("FFmpeg не найден. Переустановите зависимости frontend.");
}

async function findCoverFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findCoverFiles(entryPath);
    }

    return /__cover\.(webp|jpe?g|png)$/i.test(entry.name) ? [entryPath] : [];
  }));

  return files.flat();
}

function normalizeFrameDelays(delays, pageCount) {
  return Array.from({ length: pageCount }, (_, index) => {
    const delay = Number(delays?.[index] ?? delays?.at(-1) ?? 100);
    return Number.isFinite(delay) && delay > 0 ? delay : 100;
  });
}

async function writeVideo(destinationPath, rawFrames, pageCount, delays) {
  await mkdir(path.dirname(destinationPath), { recursive: true });

  const frameSize = width * height * 4;
  const cumulativeDelays = [];
  let totalDurationMs = 0;

  for (const delay of delays) {
    totalDurationMs += delay;
    cumulativeDelays.push(totalDurationMs);
  }

  const outputFrameCount = Math.max(1, Math.round(totalDurationMs * framesPerSecond / 1000));
  const ffmpeg = spawn(ffmpegPath, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "rawvideo",
    "-pixel_format", "rgba",
    "-video_size", `${width}x${height}`,
    "-framerate", String(framesPerSecond),
    "-i", "pipe:0",
    "-an",
    "-vf", "unpremultiply=inplace=1,format=yuva420p",
    "-c:v", "libvpx-vp9",
    "-deadline", "good",
    "-cpu-used", "4",
    "-row-mt", "1",
    "-auto-alt-ref", "0",
    "-lag-in-frames", "0",
    "-g", "15",
    "-b:v", "0",
    "-crf", "38",
    "-metadata:s:v:0", "alpha_mode=1",
    destinationPath
  ], { stdio: ["pipe", "ignore", "pipe"] });
  let errorOutput = "";

  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk) => {
    errorOutput = `${errorOutput}${chunk}`.slice(-4000);
  });
  ffmpeg.stdin.on("error", () => null);

  let sourceFrameIndex = 0;

  for (let outputIndex = 0; outputIndex < outputFrameCount; outputIndex += 1) {
    const targetTimeMs = outputIndex * 1000 / framesPerSecond;

    while (sourceFrameIndex < pageCount - 1 && targetTimeMs >= cumulativeDelays[sourceFrameIndex]) {
      sourceFrameIndex += 1;
    }

    const start = sourceFrameIndex * frameSize;
    const frame = rawFrames.subarray(start, start + frameSize);

    if (!ffmpeg.stdin.write(frame)) {
      await once(ffmpeg.stdin, "drain");
    }
  }

  ffmpeg.stdin.end();
  const [exitCode] = await once(ffmpeg, "close");

  if (exitCode !== 0) {
    throw new Error(`FFmpeg завершился с кодом ${exitCode}: ${errorOutput.trim()}`);
  }
}

async function createVideo(sourceRoot, sourcePath, category) {
  const metadata = await sharp(sourcePath, { animated: true, limitInputPixels: false }).metadata();
  const pageCount = metadata.pages ?? 1;

  if (pageCount <= 1) {
    return "static";
  }

  const relativePath = path.relative(sourceRoot, sourcePath);
  const destinationPath = path.join(destinationRoot, category, relativePath.replace(/\.[^.]+$/, ".webm"));

  if (!force) {
    try {
      await access(destinationPath);
      return "skipped";
    } catch {
      // NOTE: Файл ещё не создан или повреждён — генерируем его заново.
    }
  }

  const { data, info } = await sharp(sourcePath, { animated: true, limitInputPixels: false })
    .resize({ width, height, fit: category === "frames" ? "contain" : "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const outputPageCount = info.pages ?? pageCount;
  const delays = normalizeFrameDelays(metadata.delay, outputPageCount);
  await writeVideo(destinationPath, data, outputPageCount, delays);
  return "created";
}

for (const category of categories) {
  if (categoryArgument && category !== categoryArgument) {
    continue;
  }

  const sourceRoot = path.join(cosmeticsRoot, category);
  const allFiles = await findCoverFiles(sourceRoot);
  const files = limitArgument > 0 ? allFiles.slice(0, limitArgument) : allFiles;
  const counters = { created: 0, skipped: 0, static: 0 };

  for (let index = 0; index < files.length; index += 1) {
    const result = await createVideo(sourceRoot, files[index], category);
    counters[result] += 1;
    console.log(`${category}: ${index + 1}/${files.length} (${result})`);
  }

  console.log(`${category} завершено:`, counters);
}
