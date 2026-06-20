"use client";

import Image from "next/image";
import {
  calculatorJewelPose,
  calculatorJewelsForSide,
} from "@/lib/loan-calculator-jewels";

export function LoanCalculatorJewels({
  weightGrams,
  side,
}: {
  weightGrams: number;
  side: "left" | "right";
}) {
  const jewels = calculatorJewelsForSide(weightGrams, side);

  if (jewels.length === 0) {
    return (
      <div
        className="ym-loan-calculator-jewels ym-loan-calculator-jewels--empty"
        aria-hidden
      />
    );
  }

  return (
    <div
      className={[
        "ym-loan-calculator-jewels",
        `ym-loan-calculator-jewels--${side}`,
      ].join(" ")}
      aria-hidden
    >
      {jewels.map((jewel, index) => {
        const pose = calculatorJewelPose(side, jewel.id, index, jewels.length);

        return (
          <div
            key={`${side}-${weightGrams}-${jewel.id}-${index}`}
            className="ym-loan-calculator-jewel-wrap"
            style={{
              transform: `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) rotate(${pose.rotate}deg)`,
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
