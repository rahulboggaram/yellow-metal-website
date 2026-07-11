"use client";

import Lottie from "lottie-react";
import addToFavorites from "../../../public/lottie/add-to-favorites.json";
import financialGraphLoader from "../../../public/lottie/financial-graph-loader.json";

const ANIMATIONS = {
  favorites: addToFavorites,
  "financial-graph": financialGraphLoader,
} as const;

export type AdminLottieName = keyof typeof ANIMATIONS;

export function AdminLottiePreview({
  animation = "favorites",
  className,
  size = 96,
}: {
  animation?: AdminLottieName;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie animationData={ANIMATIONS[animation]} loop autoplay />
    </div>
  );
}
