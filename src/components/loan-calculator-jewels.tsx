"use client";

import Image from "next/image";
import { useMemo, type CSSProperties } from "react";
import {
  calculatorJewelGrid,
  calculatorJewelLayouts,
  calculatorJewelsForWeight,
} from "@/lib/loan-calculator-jewels";

export function LoanCalculatorJewels({ weightGrams }: { weightGrams: number }) {
  const jewels = useMemo(
    () => calculatorJewelsForWeight(weightGrams),
    [weightGrams],
  );

  const layouts = useMemo(
    () => calculatorJewelLayouts(jewels, weightGrams),
    [jewels, weightGrams],
  );

  const grid = useMemo(() => calculatorJewelGrid(jewels.length), [jewels.length]);

  if (jewels.length === 0) {
    return null;
  }

  return (
    <div
      className="ym-loan-calculator-jewels"
      style={
        {
          "--jewel-rows": grid.rows,
          "--jewel-cols": grid.cols,
        } as CSSProperties
      }
      aria-hidden
    >
      {jewels.map((jewel, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        return (
          <div
            key={`${weightGrams}-${jewel.id}-${index}`}
            className="ym-loan-calculator-jewel-wrap"
            style={{
              left: `${layout.x}%`,
              top: `${layout.y}%`,
              width: `${layout.slotW}%`,
              height: `${layout.slotH}%`,
              zIndex: layout.z,
              animationDelay: `${index * 70}ms`,
            }}
          >
            <Image
              src={jewel.src}
              alt=""
              width={jewel.width}
              height={jewel.height}
              className="ym-loan-calculator-jewel"
            />
          </div>
        );
      })}
    </div>
  );
}
