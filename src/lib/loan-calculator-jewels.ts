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
