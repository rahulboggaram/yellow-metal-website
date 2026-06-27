import { execSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(rootDir, "src", "app");
const sourcePath = join(rootDir, "public", "images", "site", "ym-favicon-source.png");

function resizePng(size, outputPath) {
  execSync(`sips -z ${size} ${size} "${sourcePath}" --out "${outputPath}"`, {
    stdio: "pipe",
  });
}

function createIco(sizes) {
  const images = sizes.map((size) => {
    const tempPath = join(tmpdir(), `ym-favicon-${size}.png`);
    resizePng(size, tempPath);
    const png = readFileSync(tempPath);
    unlinkSync(tempPath);
    return png;
  });

  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;

  for (let i = 0; i < count; i += 1) {
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry[4] = 1;
    entry[5] = 0;
    entry[6] = 32;
    entry[7] = 0;
    entry.writeUInt32LE(images[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += images[i].length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images]);
}

writeFileSync(join(appDir, "favicon.ico"), createIco([16, 32, 48]));
resizePng(32, join(appDir, "icon.png"));
resizePng(180, join(appDir, "apple-icon.png"));

console.log("Generated favicon.ico, icon.png, and apple-icon.png from ym-favicon-source.png");
