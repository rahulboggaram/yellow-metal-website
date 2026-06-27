export type CalculatorJewelAsset = {
  id: string;
  src: string;
  width: number;
  height: number;
  /** Typical gross weight (22K), informed by retail gold jewellery benchmarks. */
  typicalGrams: number;
  label: string;
};

/**
 * Yellow Metal ornament visuals mapped to typical Indian gold piece weights.
 * Weight benchmarks reference common retail ranges (e.g. Tanishq listings:
 * stud earrings ~6g, Ganesha pendant ~6g, mangalsutra/ring ~4g).
 * Images are Yellow Metal assets — not sourced from third-party catalogues.
 */
export const CALCULATOR_JEWEL_ASSETS: CalculatorJewelAsset[] = [
  {
    id: "stud",
    src: "/images/ornaments/stud.png",
    width: 100,
    height: 112,
    typicalGrams: 6,
    label: "Stud earrings",
  },
  {
    id: "ganesha",
    src: "/images/ornaments/ganesha.png",
    width: 86,
    height: 172,
    typicalGrams: 6,
    label: "Ganesha pendant",
  },
  {
    id: "flower",
    src: "/images/ornaments/flower.png",
    width: 132,
    height: 134,
    typicalGrams: 4,
    label: "Ring / pendant",
  },
];

const MAX_JEWELS = 8;

const ORNAMENTS_BY_WEIGHT = [...CALCULATOR_JEWEL_ASSETS].sort(
  (a, b) => b.typicalGrams - a.typicalGrams,
);

const SMALLEST_ORNAMENT =
  ORNAMENTS_BY_WEIGHT[ORNAMENTS_BY_WEIGHT.length - 1];

/**
 * Build a believable set of pledged pieces that add up to roughly the entered weight.
 * Uses a greedy fit from heavier pieces down to lighter ones (studs, rings).
 */
export function calculatorJewelsForWeight(weightGrams: number): CalculatorJewelAsset[] {
  if (weightGrams <= 0) return [];

  if (weightGrams < SMALLEST_ORNAMENT.typicalGrams) {
    return [SMALLEST_ORNAMENT];
  }

  const items: CalculatorJewelAsset[] = [];
  let remaining = weightGrams;

  while (remaining >= SMALLEST_ORNAMENT.typicalGrams * 0.5 && items.length < MAX_JEWELS) {
    const next =
      ORNAMENTS_BY_WEIGHT.find((ornament) => ornament.typicalGrams <= remaining) ??
      null;

    if (!next) break;

    items.push(next);
    remaining -= next.typicalGrams;
  }

  if (items.length === 0) {
    return [SMALLEST_ORNAMENT];
  }

  return items;
}

export type CalculatorJewelLayout = {
  x: number;
  y: number;
  rotate: number;
  z: number;
};

/** Normalized footprint inside the jewel cluster (0–1). */
const JEWEL_LAYOUT_SIZE: Record<string, { w: number; h: number }> = {
  stud: { w: 0.42, h: 0.46 },
  ganesha: { w: 0.38, h: 0.58 },
  flower: { w: 0.42, h: 0.42 },
};

const LAYOUT_PAD = 0.035;

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function jewelFootprint(jewel: CalculatorJewelAsset) {
  return JEWEL_LAYOUT_SIZE[jewel.id] ?? { w: 0.4, h: 0.4 };
}

type PlacedJewel = { x: number; y: number; w: number; h: number };

function boxesOverlap(a: PlacedJewel, b: PlacedJewel) {
  return !(
    a.x + a.w + LAYOUT_PAD <= b.x ||
    b.x + b.w + LAYOUT_PAD <= a.x ||
    a.y + a.h + LAYOUT_PAD <= b.y ||
    b.y + b.h + LAYOUT_PAD <= a.y
  );
}

function layoutCandidates(w: number, h: number, rand: () => number) {
  const maxX = Math.max(0, 1 - w);
  const maxY = Math.max(0, 1 - h);
  const candidates: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 48; i += 1) {
    candidates.push({ x: rand() * maxX, y: rand() * maxY });
  }

  for (const yRatio of [0, 0.33, 0.66, 1]) {
    for (const xRatio of [0, 0.33, 0.66, 1]) {
      candidates.push({
        x: Math.min(maxX, maxX * xRatio),
        y: Math.min(maxY, maxY * yRatio),
      });
    }
  }

  return candidates;
}

/**
 * Scatter pledged jewels inside the calculator cluster without overlap.
 * Positions are seeded from weight + piece list so they stay stable while typing.
 */
export function calculatorJewelLayouts(
  jewels: CalculatorJewelAsset[],
  weightGrams: number,
): CalculatorJewelLayout[] {
  if (jewels.length === 0) return [];

  const seedKey = `${weightGrams}:${jewels.map((jewel) => jewel.id).join(",")}`;
  const rand = createSeededRandom(hashSeed(seedKey));
  const layouts: CalculatorJewelLayout[] = Array.from({ length: jewels.length });
  const placed: PlacedJewel[] = [];

  const placementOrder = jewels
    .map((jewel, index) => ({ jewel, index, area: jewelFootprint(jewel) }))
    .sort((a, b) => b.area.w * b.area.h - a.area.w * a.area.h);

  for (const { jewel, index } of placementOrder) {
    const { w, h } = jewelFootprint(jewel);
    const candidates = layoutCandidates(w, h, rand);
    let chosen: PlacedJewel | null = null;

    for (const candidate of candidates) {
      const box = { ...candidate, w, h };
      if (!placed.some((item) => boxesOverlap(box, item))) {
        chosen = box;
        break;
      }
    }

    if (!chosen) {
      const row = placed.length;
      chosen = {
        x: Math.min(Math.max(0, 1 - w), (row % 2) * (0.5 - w / 2)),
        y: Math.min(Math.max(0, 1 - h), Math.floor(row / 2) * (0.34 - h / 2)),
        w,
        h,
      };
    }

    placed.push(chosen);
    layouts[index] = {
      x: chosen.x * 100,
      y: chosen.y * 100,
      rotate: (rand() - 0.5) * 28,
      z: index + 1,
    };
  }

  return layouts;
}
