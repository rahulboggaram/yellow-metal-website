export type CalculatorJewelAsset = {
  id: string;
  src: string;
  width: number;
  height: number;
};

export const CALCULATOR_JEWEL_ASSETS: CalculatorJewelAsset[] = [
  {
    id: "flower",
    src: "/images/ornaments/flower.png",
    width: 132,
    height: 134,
  },
  {
    id: "stud",
    src: "/images/ornaments/stud.png",
    width: 100,
    height: 112,
  },
  {
    id: "ganesha",
    src: "/images/ornaments/ganesha.png",
    width: 86,
    height: 172,
  },
  {
    id: "belt",
    src: "/images/ornaments/waist-belt.png",
    width: 404,
    height: 91,
  },
];

/** How many jewels to show in total (split across left & right). */
export function calculatorJewelCount(weightGrams: number): number {
  if (weightGrams <= 0) return 0;
  if (weightGrams < 2) return 1;
  if (weightGrams < 6) return 2;
  if (weightGrams < 12) return 3;
  return 4;
}

export function calculatorJewelsForSide(
  weightGrams: number,
  side: "left" | "right",
): CalculatorJewelAsset[] {
  const total = calculatorJewelCount(weightGrams);
  if (total === 0) return [];

  const leftCount = Math.ceil(total / 2);
  const rightCount = Math.floor(total / 2);
  const count = side === "left" ? leftCount : rightCount;

  const items: CalculatorJewelAsset[] = [];
  let assetIndex = side === "left" ? 0 : 1;

  for (let i = 0; i < count; i++) {
    items.push(CALCULATOR_JEWEL_ASSETS[assetIndex % CALCULATOR_JEWEL_ASSETS.length]);
    assetIndex += 2;
  }

  return items;
}
