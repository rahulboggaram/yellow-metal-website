import { Bricolage_Grotesque, Inter } from "next/font/google";

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
 * Inter stack for loan calculator and other UI surfaces.
 * Use with displayFont.className on the root element, or var(--font-inter-stack) in CSS.
 * Always includes a literal Inter fallback so font-family never invalidates if the variable is missing.
 */
export const INTER_FONT_STACK =
  "var(--font-display-family, Inter), ui-sans-serif, system-ui, sans-serif";

/** Apply on loan calculator roots and inputs — uses the loaded Inter face, not CSS tokens. */
export const loanCalculatorFontClassName = displayFont.className;

/** Stable CSS class — literal Inter family name (see globals.css .ym-font-inter). */
export const LOAN_CALCULATOR_INTER_CLASS = "ym-font-inter";
