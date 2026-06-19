"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FlyingOrnaments } from "@/components/flying-ornaments";
import { CoverJewels } from "@/components/cover-jewels";
import { CustodyTrustMarks } from "@/components/custody-trust-marks";
import { FLIGHT_SCROLL, accelerateFlightProgress, computeFlightSceneProgress, coverVeilOpacity } from "@/lib/flying-ornaments";

export function PacketSealSection() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [jewelsFlying, setJewelsFlying] = useState(false);

  useEffect(() => {
    function onScroll() {
      const node = sceneRef.current;
      if (!node) return;

      const calculator = document.querySelector<HTMLElement>(
        ".ym-loan-calculator-section",
      );
      const site = document.querySelector(".ym-site");
      const chromeTop = site
        ? Number.parseFloat(getComputedStyle(site).getPropertyValue("--ym-chrome-top")) || 0
        : 0;
      const viewport = window.innerHeight - chromeTop;
      const sceneRect = node.getBoundingClientRect();
      const calcRect = calculator?.getBoundingClientRect();
      const cover = coverRef.current;

      let p = computeFlightSceneProgress(
        sceneRect.top,
        sceneRect.height,
        calcRect?.top ?? Number.POSITIVE_INFINITY,
        calcRect?.bottom ?? Number.NEGATIVE_INFINITY,
        viewport,
        chromeTop,
      );

      if (cover) {
        const coverRect = cover.getBoundingClientRect();
        p = accelerateFlightProgress(
          p,
          coverRect.top,
          coverRect.bottom,
          chromeTop,
          viewport,
        );
      }

      setProgress(p);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("ym-jewels-flying", jewelsFlying);
    return () => {
      document.body.classList.remove("ym-jewels-flying");
    };
  }, [jewelsFlying]);

  const coverVisible = progress > 0.02;
  const showPlacedJewels = progress >= FLIGHT_SCROLL.end;
  const veilOpacity = coverVeilOpacity(progress);
  const trustMarksVisible = progress > 0.14;

  return (
    <section className="ym-packet-scene" id="custody" ref={sceneRef}>
      <FlyingOrnaments
        sceneProgress={progress}
        coverRef={coverRef}
        onFlyingChange={setJewelsFlying}
      />

      <div className="ym-packet-sticky">
        <div className="ym-container ym-packet-stage">
          <div className="ym-packet-visual">
            <div className="ym-packet-cover-wrap">
              <div
                ref={coverRef}
                className={[
                  "ym-loan-cover",
                  coverVisible && "ym-loan-cover--visible",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Image
                  src="/images/loan-bag-cover.png"
                  alt="Yellow Metal gold loan custody cover sheet"
                  width={900}
                  height={1270}
                  className="ym-loan-cover-img"
                  priority={false}
                />

                {showPlacedJewels && <CoverJewels coverRef={coverRef} />}

                <div
                  className="ym-loan-cover-veil"
                  aria-hidden
                  style={{ opacity: veilOpacity }}
                />
              </div>
            </div>

            <CustodyTrustMarks visible={trustMarksVisible} />
          </div>
        </div>
      </div>
    </section>
  );
}
