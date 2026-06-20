"use client";

import Image from "next/image";
import { calculatorJewelsForSide } from "@/lib/loan-calculator-jewels";

export function LoanCalculatorJewels({
  weightGrams,
  side,
}: {
  weightGrams: number;
  side: "left" | "right";
}) {
  const jewels = calculatorJewelsForSide(weightGrams, side);

  if (jewels.length === 0) {
    return <div className="ym-loan-calculator-jewels ym-loan-calculator-jewels--empty" aria-hidden />;
  }

  return (
    <div
      className={[
        "ym-loan-calculator-jewels",
        `ym-loan-calculator-jewels--${side}`,
      ].join(" ")}
      aria-hidden
    >
      {jewels.map((jewel, index) => (
        <Image
          key={`${side}-${weightGrams}-${jewel.id}-${index}`}
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
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}
