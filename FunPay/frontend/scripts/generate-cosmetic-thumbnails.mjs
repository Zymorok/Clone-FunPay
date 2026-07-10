import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cosmeticsRoot = path.join(projectRoot, "public", "assets", "website", "profile-cosmetics");
const thumbnailRoot = path.join(cosmeticsRoot, "thumbnails");
const categories = {
  avatars: { static: { width: 256, height: 256, fit: "cover" }, animated: { width: 192, height: 192, fit: "cover" } },
  frames: { static: { width: 256, height: 256, fit: "contain" }, animated: { width: 192, height: 192, fit: "contain" } },
  banners: { static: { width: 480, height: 120, fit: "cover" }, animated: { width: 360, height: 90, fit: "cover" } },
  wallpapers: { static: { width: 480, height: 270, fit: "cover" }, animated: { width: 360, height: 203, fit: "cover" } }
};

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

async function createThumbnail(sourceRoot, sourcePath, destinationRoot, options) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  const destinationPath = path.join(destinationRoot, relativePath.replace(/\.[^.]+$/, ".webp"));
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(sourcePath, { animated: false })
    .resize({ ...options, withoutEnlargement: true })
    .webp({ quality: 62, alphaQuality: 72, effort: 4 })
    .toFile(destinationPath);
}

async function createAnimatedThumbnail(sourceRoot, sourcePath, destinationRoot, options) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  const destinationPath = path.join(destinationRoot, relativePath.replace(/\.[^.]+$/, ".webp"));
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(sourcePath, { animated: true, limitInputPixels: false })
    .resize(options)
    .webp({ quality: 44, alphaQuality: 58, effort: 1, loop: 0 })
    .toFile(destinationPath);
}

async function runPool(items, concurrency, worker) {
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
}

for (const [category, options] of Object.entries(categories)) {
  const sourceRoot = path.join(cosmeticsRoot, category);
  const destinationRoot = path.join(thumbnailRoot, category);
  const animatedDestinationRoot = path.join(cosmeticsRoot, "animated-thumbnails", category);
  const files = await findCoverFiles(sourceRoot);
  await runPool(files, 2, (file) => createThumbnail(sourceRoot, file, destinationRoot, options.static));
  console.log(`${category} static: ${files.length}`);

  let animatedCount = 0;
  await runPool(files, 1, async (file) => {
    await createAnimatedThumbnail(sourceRoot, file, animatedDestinationRoot, options.animated);
    animatedCount += 1;

    if (animatedCount % 10 === 0 || animatedCount === files.length) {
      console.log(`${category} animated: ${animatedCount}/${files.length}`);
    }
  });
}
