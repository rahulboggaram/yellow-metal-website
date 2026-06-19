"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  lerpJewelLayout,
  readCoverJewelLayout,
  snapshotHeroJewelSizes,
  type JewelLayout,
  type JewelSize,
} from "@/lib/cover-jewel-layout";
import {
  FLYING_ORNAMENTS,
  FLIGHT_SCROLL,
  flightProgress,
  jewelInsideOpacity,
} from "@/lib/flying-ornaments";

type Props = {
  sceneProgress: number;
  coverRef: React.RefObject<HTMLElement | null>;
  onFlyingChange?: (flying: boolean) => void;
};

function readElementRect(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

function toViewportPoint(docX: number, docY: number, size: JewelSize, rotate = 0): JewelLayout {
  return {
    x: docX - window.scrollX,
    y: docY - window.scrollY,
    width: size.width,
    height: size.height,
    rotate,
  };
}

function readHeroLayoutDocument(id: string, size: JewelSize): JewelLayout | null {
  const node = document.querySelector<HTMLElement>(`[data-ornament-id="${id}"]`);
  if (!node) return null;
  const doc = readElementRect(node);
  return toViewportPoint(doc.x, doc.y, size, 0);
}

function getChromeTop() {
  const site = document.querySelector(".ym-site");
  return site
    ? Number.parseFloat(getComputedStyle(site).getPropertyValue("--ym-chrome-top")) || 0
    : 0;
}

function readFlightStart(
  ornamentId: string,
  startDoc: { x: number; y: number },
  size: JewelSize,
  chromeTop: number,
): JewelLayout {
  const live = readHeroLayoutDocument(ornamentId, size);
  if (live) {
    if (live.y < window.innerHeight && live.y + live.height > chromeTop) {
      return live;
    }
  }

  const x = startDoc.x - window.scrollX;
  let y = startDoc.y - window.scrollY;
  if (y + size.height < chromeTop) {
    y = chromeTop + 20;
  }

  return { x, y, width: size.width, height: size.height, rotate: 0 };
}

export function FlyingOrnaments({
  sceneProgress,
  coverRef,
  onFlyingChange,
}: Props) {
  const [layouts, setLayouts] = useState<JewelLayout[]>([]);
  const [enabled, setEnabled] = useState(true);
  const sizesRef = useRef<Record<string, JewelSize>>({});
  const startDocsRef = useRef<Record<string, { x: number; y: number }>>({});
  const snapshottedRef = useRef(false);
  const flightSnapshottedRef = useRef(false);
  const flyingRef = useRef(false);
  const onFlyingChangeRef = useRef(onFlyingChange);

  useEffect(() => {
    onFlyingChangeRef.current = onFlyingChange;
  }, [onFlyingChange]);

  function setFlying(next: boolean) {
    if (flyingRef.current === next) return;
    flyingRef.current = next;
    onFlyingChangeRef.current?.(next);
  }

  function snapshotStartPositions() {
    const sizes = snapshotHeroJewelSizes(FLYING_ORNAMENTS);
    if (Object.keys(sizes).length !== FLYING_ORNAMENTS.length) return false;

    sizesRef.current = sizes;
    const docs: Record<string, { x: number; y: number }> = {};
    for (const ornament of FLYING_ORNAMENTS) {
      const node = document.querySelector<HTMLElement>(`[data-ornament-id="${ornament.id}"]`);
      if (!node) return false;
      const doc = readElementRect(node);
      docs[ornament.id] = { x: doc.x, y: doc.y };
    }
    startDocsRef.current = docs;
    return true;
  }

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setEnabled(!(reducedMotion || mobile));

    if (snapshotStartPositions()) {
      snapshottedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setFlying(false);
      setLayouts([]);
      return;
    }

    const cover = coverRef.current;
    if (!cover) return;

    if (sceneProgress >= FLIGHT_SCROLL.end) {
      setFlying(false);
      setLayouts([]);
      return;
    }

    const shouldFly = sceneProgress >= FLIGHT_SCROLL.start;

    if (!shouldFly) {
      flightSnapshottedRef.current = false;
      setFlying(false);
      setLayouts([]);
      return;
    }

    if (!flightSnapshottedRef.current) {
      flightSnapshottedRef.current = snapshotStartPositions();
    }

    if (!flightSnapshottedRef.current && !snapshottedRef.current) {
      setFlying(false);
      setLayouts([]);
      return;
    }

    if (!snapshottedRef.current && flightSnapshottedRef.current) {
      snapshottedRef.current = true;
    }

    if (!snapshottedRef.current) {
      if (snapshotStartPositions()) {
        snapshottedRef.current = true;
      } else {
        setFlying(false);
        setLayouts([]);
        return;
      }
    }

    const chromeTop = getChromeTop();

    const nextLayouts = FLYING_ORNAMENTS.map((ornament) => {
      const size = sizesRef.current[ornament.id];
      const startDoc = startDocsRef.current[ornament.id];
      if (!size || !startDoc) return null;

      const start = readFlightStart(ornament.id, startDoc, size, chromeTop);
      const end = readCoverJewelLayout(cover, ornament, size, "viewport");
      const amount = flightProgress(sceneProgress, ornament.delay);
      return lerpJewelLayout(start, end, amount);
    }).filter((layout): layout is JewelLayout => layout !== null);

    setLayouts(nextLayouts);
    setFlying(nextLayouts.length === FLYING_ORNAMENTS.length);
  }, [sceneProgress, coverRef, enabled]);

  useEffect(() => {
    if (!enabled) return;

    function onResize() {
      const cover = coverRef.current;
      if (!cover || sceneProgress < FLIGHT_SCROLL.start || sceneProgress >= FLIGHT_SCROLL.end) return;
      if (!snapshottedRef.current) return;

      const chromeTop = getChromeTop();

      setLayouts(
        FLYING_ORNAMENTS.map((ornament) => {
          const size = sizesRef.current[ornament.id];
          const startDoc = startDocsRef.current[ornament.id];
          if (!size || !startDoc) return null;
          const start = readFlightStart(ornament.id, startDoc, size, chromeTop);
          const end = readCoverJewelLayout(cover, ornament, size, "viewport");
          const amount = flightProgress(sceneProgress, ornament.delay);
          return lerpJewelLayout(start, end, amount);
        }).filter((layout): layout is JewelLayout => layout !== null),
      );
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, sceneProgress, coverRef]);

  if (!enabled || layouts.length !== FLYING_ORNAMENTS.length) return null;

  const layer = (
    <div className="ym-flying-layer" aria-hidden>
      {FLYING_ORNAMENTS.map((ornament, index) => {
        const layout = layouts[index];
        if (!layout) return null;

        const p = flightProgress(sceneProgress, ornament.delay);
        const opacity = jewelInsideOpacity(p);

        return (
          <div
            key={ornament.id}
            className="ym-ornament--flying"
            style={{
              transform: `translate3d(${layout.x}px, ${layout.y}px, 0) rotate(${layout.rotate}deg)`,
              width: layout.width,
              height: layout.height,
              opacity,
            }}
          >
            <Image
              src={ornament.src}
              alt=""
              width={ornament.intrinsicWidth}
              height={ornament.intrinsicHeight}
              className="ym-flying-ornament-img"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );

  return createPortal(layer, document.body);
}
