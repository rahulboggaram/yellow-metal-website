"use client";

import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import addToFavorites from "../../../public/lottie/add-to-favorites.json";
import financialGraphLoader from "../../../public/lottie/financial-graph-loader.json";
import loan from "../../../public/lottie/loan.json";

const ANIMATIONS = {
  favorites: addToFavorites,
  "financial-graph": financialGraphLoader,
  loan,
} as const;

export type AdminLottieName = keyof typeof ANIMATIONS;

export function AdminLottiePreview({
  animation = "favorites",
  className,
  size = 96,
  loop = true,
  freezeFrame,
}: {
  animation?: AdminLottieName;
  className?: string;
  size?: number;
  loop?: boolean;
  /** Play through this frame, then hold (0-based). */
  freezeFrame?: number;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={ANIMATIONS[animation]}
        loop={loop}
        autoplay
        initialSegment={
          freezeFrame != null && !loop ? [0, freezeFrame] : undefined
        }
        onComplete={() => {
          if (freezeFrame == null) return;
          lottieRef.current?.goToAndStop(freezeFrame, true);
        }}
      />
    </div>
  );
}
