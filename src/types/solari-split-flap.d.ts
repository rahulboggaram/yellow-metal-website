declare module "solari-split-flap" {
  export class SolariBoard {
    constructor(container: HTMLElement, options?: Record<string, unknown>);
    stop(): void;
    destroy(): void;
    start(): void;
    setTheme(theme: string | Record<string, unknown>): void;
    setQuotes(quotes: string[][]): void;
  }
}
