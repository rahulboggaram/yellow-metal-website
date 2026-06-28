import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { interFontBindings } from "@/lib/fonts";

type InterNumericProps<T extends ElementType> = {
  as?: T;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style">;

/** Amounts and numeric copy — Inter via next/font class + inline style. */
export function InterNumeric<T extends ElementType = "span">({
  as,
  className,
  style,
  ...props
}: InterNumericProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  const bindings = interFontBindings(className, style);

  return <Tag {...props} {...bindings} />;
}
