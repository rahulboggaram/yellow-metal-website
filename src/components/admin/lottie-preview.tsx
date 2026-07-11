"use client";

import Lottie from "lottie-react";
import addToFavorites from "../../../public/lottie/add-to-favorites.json";

export function AdminLottiePreview({
  className,
  size = 96,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie animationData={addToFavorites} loop autoplay />
    </div>
  );
}
