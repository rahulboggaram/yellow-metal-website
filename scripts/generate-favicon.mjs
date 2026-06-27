import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");
const svgPath = join(appDir, "icon.svg");
const svg = readFileSync(svgPath, "utf8");

function renderSvgPng(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  return resvg.render().asPng();
}

function createIco(sizes) {
  const images = sizes.map((size) => renderSvgPng(size));
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
writeFileSync(join(appDir, "apple-icon.png"), renderSvgPng(180));
writeFileSync(join(appDir, "icon.png"), renderSvgPng(32));

console.log("Generated favicon.ico, icon.png, and apple-icon.png from icon.svg");
