"use client";

import Image from "next/image";
import { calculatorJewelsForWeight } from "@/lib/loan-calculator-jewels";

export function LoanCalculatorJewels({ weightGrams }: { weightGrams: number }) {
  const jewels = calculatorJewelsForWeight(weightGrams);

  if (jewels.length === 0) {
    return null;
  }

  return (
    <div className="ym-loan-calculator-jewels" aria-hidden>
      {jewels.map((jewel, index) => (
        <div
          key={`${weightGrams}-${jewel.id}-${index}`}
          className="ym-loan-calculator-jewel-wrap"
          style={{
            zIndex: index + 1,
            transform: `translate(${-index * 4}px, ${index * 5}px)`,
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
      ))}
    </div>
  );
}
