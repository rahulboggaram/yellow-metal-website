"use client";

import Image from "next/image";
import { useMemo } from "react";
import {
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

  if (jewels.length === 0) {
    return null;
  }

  return (
    <div className="ym-loan-calculator-jewels" aria-hidden>
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
              zIndex: layout.z,
              transform: `rotate(${layout.rotate}deg)`,
              animationDelay: `${index * 70}ms`,
            }}
          >
            <Image
              src={jewel.src}
              alt=""
              width={jewel.width}
              height={jewel.height}
              className={[
                "ym-loan-calculator-jewel",
                jewel.id === "belt" ? "ym-loan-calculator-jewel--belt" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>
        );
      })}
    </div>
  );
}
