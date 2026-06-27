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
  slotW: number;
  slotH: number;
  rotate: number;
  z: number;
};

export type CalculatorJewelGrid = {
  cols: number;
  rows: number;
};

const SLOT_GAP = 0.1;

export function calculatorJewelGrid(jewelCount: number): CalculatorJewelGrid {
  if (jewelCount <= 0) return { cols: 0, rows: 0 };
  if (jewelCount === 1) return { cols: 1, rows: 1 };
  return { cols: 2, rows: Math.ceil(jewelCount / 2) };
}

/**
 * Place pledged jewels on a non-overlapping grid inside the calculator cluster.
 */
export function calculatorJewelLayouts(
  jewels: CalculatorJewelAsset[],
  _weightGrams: number,
): CalculatorJewelLayout[] {
  const { cols, rows } = calculatorJewelGrid(jewels.length);
  if (cols === 0) return [];

  const cellW = 1 / cols;
  const cellH = 1 / rows;
  const slotW = cellW - SLOT_GAP;
  const slotH = cellH - SLOT_GAP;
  const insetX = (cellW - slotW) / 2;
  const insetY = (cellH - slotH) / 2;

  return jewels.map((jewel, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: (col * cellW + insetX) * 100,
      y: (row * cellH + insetY) * 100,
      slotW: slotW * 100,
      slotH: slotH * 100,
      rotate: 0,
      z: index + 1,
    };
  });
}
