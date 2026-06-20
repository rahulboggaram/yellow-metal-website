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
 * stud earrings ~6g, Ganesha pendant ~6g, mangalsutra/ring ~4g, waist belt ~40g).
 * Images are Yellow Metal assets — not sourced from third-party catalogues.
 */
export const CALCULATOR_JEWEL_ASSETS: CalculatorJewelAsset[] = [
  {
    id: "belt",
    src: "/images/ornaments/waist-belt.png",
    width: 404,
    height: 91,
    typicalGrams: 40,
    label: "Waist belt",
  },
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
 * Uses a greedy fit from heavier pieces (belt, necklace) down to lighter ones (studs, rings).
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

export function calculatorJewelsForSide(
  weightGrams: number,
  side: "left" | "right",
): CalculatorJewelAsset[] {
  const all = calculatorJewelsForWeight(weightGrams);
  if (all.length === 0) return [];

  const leftCount = Math.ceil(all.length / 2);
  const rightCount = Math.floor(all.length / 2);

  if (side === "left") return all.slice(0, leftCount);
  return all.slice(leftCount, leftCount + rightCount);
}

export type CalculatorJewelPose = {
  rotate: number;
  x: number;
  y: number;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable scatter pose per jewel — rotated and offset so pieces feel casually piled. */
export function calculatorJewelPose(
  side: "left" | "right",
  jewelId: string,
  index: number,
  count: number,
): CalculatorJewelPose {
  const hash = hashString(`${side}:${jewelId}:${index}:${count}`);
  const unit = (shift: number) => ((hash >> shift) & 0xffff) / 0xffff;

  const rotateRange = jewelId === "belt" ? 12 : 34;
  const rotate = unit(0) * rotateRange * 2 - rotateRange;

  const spread = count > 1 ? index - (count - 1) / 2 : 0;
  const y = spread * 62 + unit(4) * 40 - 20;
  const x =
    (side === "left" ? -10 : 10) +
    (unit(8) * 32 - 16) +
    spread * (side === "left" ? -4 : 4);

  return { rotate, x, y };
}
