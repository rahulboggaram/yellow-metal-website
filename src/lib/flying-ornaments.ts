export type FlyingOrnament = {
  id: string;
  src: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  /** Target on loan bag cover (percent of cover box) */
  target: {
    /** Horizontal center as % of cover width */
    left: number;
    /** Gap from cover bottom to jewel bottom edge (% of cover height) */
    bottomInset: number;
    /** Landing rotation in degrees */
    rotate?: number;
    /** Rotate (e.g. 90°) so the jewel fits inside the cover width */
    fitCoverWidth?: boolean;
    /** Max horizontal span as % of cover width when fitting */
    maxWidthPercent?: number;
  };
  /** Stagger flight start within the scroll phase */
  delay: number;
};

/** Jewels fly from hero letters to the bottom inside edge of the bag cover. */
export const FLYING_ORNAMENTS: FlyingOrnament[] = [
  {
    id: "flower",
    src: "/images/ornaments/flower.png",
    intrinsicWidth: 132,
    intrinsicHeight: 134,
    target: { left: 27, bottomInset: 3.5, rotate: -14 },
    delay: 0,
  },
  {
    id: "stud",
    src: "/images/ornaments/stud.png",
    intrinsicWidth: 100,
    intrinsicHeight: 112,
    target: { left: 39, bottomInset: 3.5, rotate: 10 },
    delay: 0.06,
  },
  {
    id: "ganesha",
    src: "/images/ornaments/ganesha.png",
    intrinsicWidth: 86,
    intrinsicHeight: 172,
    target: { left: 53, bottomInset: 3.5, rotate: -8 },
    delay: 0.12,
  },
  {
    id: "belt",
    src: "/images/ornaments/waist-belt.png",
    intrinsicWidth: 404,
    intrinsicHeight: 91,
    target: {
      left: 50,
      bottomInset: 3.5,
      rotate: 0,
      fitCoverWidth: true,
      maxWidthPercent: 0.84,
    },
    delay: 0.18,
  },
];

export const JEWEL_INSIDE_OPACITY = 0.46;

export const FLIGHT_SCROLL = {
  /** Scene progress when jewels lift off the hero */
  start: 0.02,
  /** Scene progress when jewels have landed on the cover */
  end: 0.44,
} as const;

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function computeFlightSceneProgress(
  sceneTop: number,
  _sceneHeight: number,
  calculatorTop: number,
  calculatorBottom: number,
  viewport: number,
  chromeTop: number,
): number {
  // Hold jewels on the title only while the calculator section is on screen.
  const inCalculatorZone =
    calculatorBottom > chromeTop + viewport * 0.18 &&
    calculatorTop < chromeTop + viewport * 0.88;

  if (inCalculatorZone) {
    return 0;
  }

  // After the calculator, drive flight from packet-scene scroll.
  const enterTop = chromeTop + viewport * 0.92;
  const finishTop = chromeTop + viewport * 0.06;
  const span = Math.max(enterTop - finishTop, 1);

  return clamp01((enterTop - sceneTop) / span);
}

/**
 * When the full cover is framed in the viewport, compress flight timing so
 * jewels land ~1–2 scrolls earlier while hitting the same positions.
 */
export function accelerateFlightProgress(
  progress: number,
  coverTop: number,
  coverBottom: number,
  chromeTop: number,
  viewport: number,
): number {
  const margin = 24;
  const topVisible = coverTop >= chromeTop + margin;
  const bottomVisible = coverBottom <= chromeTop + viewport - margin;
  if (!topVisible || !bottomVisible) return progress;

  const { start, end } = FLIGHT_SCROLL;
  if (progress <= start) return progress;

  const t = clamp01((progress - start) / (end - start + 0.18));
  return start + t * (end - start);
}

export function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function flightProgress(sceneProgress: number, delay = 0) {
  const { start, end } = FLIGHT_SCROLL;
  const span = end - start;
  const raw = (sceneProgress - start - delay * span * 0.35) / (span * (1 - delay * 0.35));
  return easeInOutCubic(clamp01(raw));
}

/** Fade jewels as they settle inside the bag during scroll. */
export function jewelInsideOpacity(flightP: number) {
  const fadeStart = 0.32;
  if (flightP <= fadeStart) return 1;
  const t = easeInOutCubic(clamp01((flightP - fadeStart) / (1 - fadeStart)));
  return 1 - t * (1 - JEWEL_INSIDE_OPACITY);
}

export function coverVeilOpacity(sceneProgress: number) {
  const { start, end } = FLIGHT_SCROLL;
  const t = clamp01((sceneProgress - start) / (end - start));
  return easeInOutCubic(t) * 0.85;
}
