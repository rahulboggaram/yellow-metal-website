"use client";

import { useEffect, useMemo, useRef } from "react";
import { displayFont, INTER_TABULAR_OPENTYPE_FEATURES } from "@/lib/fonts";
import {
  colsForSolariLine,
  createSolariBoard,
  displaySolariLine,
  toSolariAmountLine,
  type SolariBoardController,
} from "@/lib/solari-amount";

function SolariLineDisplay({
  line,
  cols,
  flipKey,
  className,
}: {
  line: string;
  cols: number;
  flipKey: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<SolariBoardController | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const board = createSolariBoard(element, cols, 1, {
      charDelay: 90,
      flipMs: 350,
    });
    boardRef.current = board;

    return () => {
      board.destroy();
      boardRef.current = null;
    };
  }, [cols]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    displaySolariLine(board, line);
  }, [line, flipKey, cols]);

  return (
    <div
      ref={containerRef}
      className={["ym-solari-amount", displayFont.className, className]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...displayFont.style,
        fontWeight: 600,
        fontFeatureSettings: INTER_TABULAR_OPENTYPE_FEATURES,
      }}
      aria-hidden
    />
  );
}

export function FlipClockAmount({
  amount,
  flipKey,
  className,
}: {
  amount: number;
  flipKey: number;
  className?: string;
}) {
  const line = useMemo(() => toSolariAmountLine(amount), [amount]);
  const cols = useMemo(() => colsForSolariLine(line), [line]);

  return (
    <SolariLineDisplay
      line={line}
      cols={cols}
      flipKey={flipKey}
      className={className}
    />
  );
}

export function FlipClockPlaceholder({
  className,
  template = "₹00000",
}: {
  className?: string;
  template?: string;
}) {
  const line = useMemo(() => template.replace(/,/g, ""), [template]);
  const cols = useMemo(() => colsForSolariLine(line), [line]);

  return (
    <SolariLineDisplay line={line} cols={cols} flipKey={0} className={className} />
  );
}
