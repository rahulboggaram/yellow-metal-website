"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  readCoverJewelLayout,
  snapshotHeroJewelSizes,
  type JewelLayout,
  type JewelSize,
} from "@/lib/cover-jewel-layout";
import { FLYING_ORNAMENTS } from "@/lib/flying-ornaments";

type Props = {
  coverRef: React.RefObject<HTMLElement | null>;
};

export function CoverJewels({ coverRef }: Props) {
  const [layouts, setLayouts] = useState<JewelLayout[]>([]);
  const sizesRef = useRef<Record<string, JewelSize>>({});

  useLayoutEffect(() => {
    const sizes = snapshotHeroJewelSizes(FLYING_ORNAMENTS);
    if (Object.keys(sizes).length === FLYING_ORNAMENTS.length) {
      sizesRef.current = sizes;
    }
  }, []);

  useEffect(() => {
    function update() {
      const cover = coverRef.current;
      if (!cover || Object.keys(sizesRef.current).length !== FLYING_ORNAMENTS.length) {
        return;
      }

      setLayouts(
        FLYING_ORNAMENTS.map((ornament) => {
          const size = sizesRef.current[ornament.id];
          if (!size) return null;
          return readCoverJewelLayout(cover, ornament, size, "cover");
        }).filter((layout): layout is JewelLayout => layout !== null),
      );
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [coverRef]);

  if (layouts.length !== FLYING_ORNAMENTS.length) return null;

  return (
    <div className="ym-loan-cover-jewels" aria-hidden>
      {FLYING_ORNAMENTS.map((ornament, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        return (
          <Image
            key={ornament.id}
            src={ornament.src}
            alt=""
            width={ornament.intrinsicWidth}
            height={ornament.intrinsicHeight}
            className="ym-loan-cover-jewel"
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.width,
              height: layout.height,
              transform: `rotate(${layout.rotate}deg)`,
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
}
