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
 * Inter OpenType features — site-wide (Figma Alternatives + Stylistic Sets).
 * ss01, ss03, ss07 ON; cv01,03,04,06,07,08,09,10,11 ON; cv05,12,13 OFF.
 * Include liga/calt — font-feature-settings replaces the full set, it does not cascade.
 */
export const INTER_OPENTYPE_FEATURES =
  '"liga" 1, "calt" 1, "ss01" 1, "ss03" 1, "ss07" 1, "cv01" 1, "cv03" 1, "cv04" 1, "cv06" 1, "cv07" 1, "cv08" 1, "cv09" 1, "cv10" 1, "cv11" 1';

export const INTER_TABULAR_OPENTYPE_FEATURES = `${INTER_OPENTYPE_FEATURES}, "tnum" 1, "lnum" 1`;

/**
 * Bind Inter on calculator numbers — mirrors flip-clock-amount.tsx exactly,
 * plus a self-hosted @font-face fallback in globals.css.
 */
export const interFontClassName = displayFont.className;

export const calculatorInterStyle: CSSProperties = {
  ...displayFont.style,
  fontWeight: 600,
  fontSynthesis: "none",
  fontFeatureSettings: INTER_TABULAR_OPENTYPE_FEATURES,
};

export function interFontBindings(className?: string, style?: CSSProperties) {
  return {
    className: [interFontClassName, "ym-loan-calculator-inter", className]
      .filter(Boolean)
      .join(" "),
    style: { ...calculatorInterStyle, ...style },
  };
}
