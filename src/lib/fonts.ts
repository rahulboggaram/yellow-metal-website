import { Bricolage_Grotesque, Inter, Noto_Sans_Kannada } from "next/font/google";
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

/** Kannada consent notice, legal switcher, and hero phrases */
export const kannadaFont = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kannada-family",
  display: "swap",
});

/**
 * Calculator numbers use the ym-loan-calculator-inter class.
 * The next/font class and inline style are applied once on <body>.
 * Repeating them in client components makes the first paint disagree with the live page.
 */
export function interFontBindings(className?: string, style?: CSSProperties) {
  return {
    className: ["ym-loan-calculator-inter", className].filter(Boolean).join(" "),
    style,
  };
}
