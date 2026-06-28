import { Bricolage_Grotesque, Inter } from "next/font/google";
import type { CSSProperties } from "react";

/** Section headings */
export const brandFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-brand-family",
  display: "swap",
});

/** Hero & body — clean sans-serif matching print cover */
export const displayFont = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display-family",
  display: "swap",
});

/**
 * Bind Inter on calculator numbers — mirrors flip-clock-amount.tsx exactly,
 * plus a self-hosted @font-face fallback in globals.css.
 */
export const interFontClassName = displayFont.className;

export const calculatorInterStyle: CSSProperties = {
  ...displayFont.style,
  fontWeight: 600,
  fontSynthesis: "none",
};

export function interFontBindings(className?: string, style?: CSSProperties) {
  return {
    className: [interFontClassName, "ym-loan-calculator-inter", className]
      .filter(Boolean)
      .join(" "),
    style: { ...calculatorInterStyle, ...style },
  };
}
