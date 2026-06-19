import type { FlyingOrnament } from "./flying-ornaments";

export type JewelSize = { width: number; height: number };

export type JewelLayout = JewelSize & {
  x: number;
  y: number;
  rotate: number;
};

export function readHeroJewelSize(id: string): JewelSize | null {
  const node = document.querySelector<HTMLElement>(`[data-ornament-id="${id}"]`);
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { width: rect.width, height: rect.height };
}

export function snapshotHeroJewelSizes(
  ornaments: FlyingOrnament[],
): Record<string, JewelSize> {
  const sizes: Record<string, JewelSize> = {};
  for (const ornament of ornaments) {
    const size = readHeroJewelSize(ornament.id);
    if (size) sizes[ornament.id] = size;
  }
  return sizes;
}

function rotatedBounds(size: JewelSize, rotateDeg: number): JewelSize {
  const rad = (rotateDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: size.width * cos + size.height * sin,
    height: size.width * sin + size.height * cos,
  };
}

function resolveLandingRotation(
  ornament: FlyingOrnament,
  size: JewelSize,
  coverWidth: number,
): number {
  const preferred = ornament.target.rotate ?? 0;
  const maxWidth = coverWidth * (ornament.target.maxWidthPercent ?? 0.86);

  if (!ornament.target.fitCoverWidth) {
    return preferred;
  }

  const flat = rotatedBounds(size, preferred);
  if (flat.width <= maxWidth) return preferred;

  for (const angle of [90, -90, 75, -75]) {
    const bounds = rotatedBounds(size, angle);
    if (bounds.width <= maxWidth) return angle;
  }

  return 90;
}

/** Bottom-anchored position on the cover — size stays constant from the hero. */
export function readCoverJewelLayout(
  cover: HTMLElement,
  ornament: FlyingOrnament,
  size: JewelSize,
  coords: "viewport" | "cover" = "viewport",
): JewelLayout {
  const box = cover.getBoundingClientRect();
  const bottomInset = (ornament.target.bottomInset / 100) * box.height;
  const rotate = resolveLandingRotation(ornament, size, box.width);
  const bounds = rotatedBounds(size, rotate);
  const centerX = box.left + (ornament.target.left / 100) * box.width;
  const bottomLine = box.bottom - bottomInset;
  const centerY = bottomLine - bounds.height / 2;

  let x = centerX - size.width / 2;
  let y = centerY - size.height / 2;

  if (coords === "cover") {
    x -= box.left;
    y -= box.top;
  }

  return {
    x,
    y,
    width: size.width,
    height: size.height,
    rotate,
  };
}

export function lerpJewelLayout(
  start: JewelLayout,
  end: JewelLayout,
  amount: number,
): JewelLayout {
  const t = amount;
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    width: start.width,
    height: start.height,
    rotate: start.rotate + (end.rotate - start.rotate) * t,
  };
}
