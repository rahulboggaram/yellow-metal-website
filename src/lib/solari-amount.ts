import { formatInr } from "@/lib/gold-price-format";
import { SolariBoard } from "solari-split-flap";

/** INR amount for the flip clock — ₹452000 (no commas) */
export function toSolariAmountLine(amount: number): string {
  return formatInr(amount).replace(/,/g, "");
}

export function colsForSolariLine(line: string): number {
  return Math.max(1, line.length);
}

export type SolariBoardController = SolariBoard & {
  _cols: number;
  _rows: number;
  _charDelay: number;
  _currentChars: string[];
  _cellTimers: number[][];
  _layoutQuote: (lines: string[]) => {
    grid: string[][];
    authorRows: Record<number, boolean>;
  };
  _flipCell: (index: number, newChar: string) => void;
};

export function displaySolariLine(board: SolariBoardController, line: string) {
  board.stop();
  const { grid } = board._layoutQuote([line.slice(0, board._cols)]);
  const { _cols: cols, _rows: rows } = board;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const target = grid[r][c];
      const delay = idx * board._charDelay;

      if (board._currentChars[idx] !== target) {
        const tid = window.setTimeout(() => board._flipCell(idx, target), delay);
        board._cellTimers[idx].push(tid);
      }
    }
  }
}

export function createSolariBoard(
  element: HTMLElement,
  cols: number,
  rows = 1,
  options?: { flipMs?: number; charDelay?: number; theme?: string },
): SolariBoardController {
  return new SolariBoard(element, {
    cols,
    rows,
    theme: options?.theme ?? "classic",
    sound: false,
    flipMs: options?.flipMs ?? 150,
    charDelay: options?.charDelay ?? 50,
    holdMs: 999_999,
    quotes: [[" "]],
  }) as SolariBoardController;
}
