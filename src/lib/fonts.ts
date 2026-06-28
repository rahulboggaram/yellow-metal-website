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
 * Bind Inter via next/font on a single element.
 * Use both className and inline style — inline style wins over CSS inherit chains
 * (critical for <input type="number"> on iOS).
 */
export const interFontClassName = displayFont.className;
export const interFontStyle: CSSProperties = displayFont.style;

export const YM_INTER_DATA_ATTR = "data-ym-inter";

export function interFontBindings(className?: string, style?: CSSProperties) {
  return {
    [YM_INTER_DATA_ATTR]: "",
    className: [interFontClassName, className].filter(Boolean).join(" "),
    style: { ...interFontStyle, ...style },
  };
}
