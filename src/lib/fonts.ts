import type { CSSProperties } from "react";

/**
 * Calculator numbers use the ym-loan-calculator-inter class.
 * Fonts are self-hosted, so the build does not download them from Google.
 */
export function interFontBindings(className?: string, style?: CSSProperties) {
  return {
    className: ["ym-loan-calculator-inter", className].filter(Boolean).join(" "),
    style,
  };
}
