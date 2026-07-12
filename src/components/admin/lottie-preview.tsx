"use client";

import { useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import addToFavorites from "../../../public/lottie/add-to-favorites.json";
import financialGraphLoader from "../../../public/lottie/financial-graph-loader.json";
import loan from "../../../public/lottie/loan.json";

const ANIMATIONS = {
  favorites: addToFavorites,
  "financial-graph": financialGraphLoader,
  loan,
} as const;

/** Resets on full page refresh; survives in-app tab switches. */
const playedThisPageLoad = new Set<string>();

export type AdminLottieName = keyof typeof ANIMATIONS;

export function AdminLottiePreview({
  animation = "favorites",
  className,
  size = 96,
  speed = 1,
}: {
  animation?: AdminLottieName;
  className?: string;
  size?: number;
  speed?: number;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const alreadyPlayed = playedThisPageLoad.has(animation);

  useEffect(() => {
    if (!alreadyPlayed) return;
    lottieRef.current?.goToAndStop(0, true);
  }, [alreadyPlayed, animation]);

  useEffect(() => {
    lottieRef.current?.setSpeed(speed);
  }, [speed]);

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={ANIMATIONS[animation]}
        /* loop={1} = play twice total, then stop */
        loop={alreadyPlayed ? false : 1}
        autoplay={!alreadyPlayed}
        onDOMLoaded={() => {
          lottieRef.current?.setSpeed(speed);
        }}
        onComplete={() => {
          playedThisPageLoad.add(animation);
          lottieRef.current?.goToAndStop(0, true);
        }}
      />
    </div>
  );
}
