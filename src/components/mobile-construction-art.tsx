"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

export function MobileConstructionArt() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { stiffness: 120, damping: 28 });
  const y = useTransform(smoothScroll, [0, 850], [0, -22]);
  const scale = useTransform(smoothScroll, [0, 850], [1, 1.04]);

  return (
    <div className="mobile-construction-art" aria-hidden="true">
      <motion.div
        style={{ y: reducedMotion ? 0 : y, scale: reducedMotion ? 1 : scale }}
      >
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet="/images/mobile-construction.webp"
          />
          {/* Art direction keeps the mobile-only illustration out of desktop downloads. */}
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
            alt=""
            width={1080}
            height={1440}
            fetchPriority="high"
          />
        </picture>
      </motion.div>
    </div>
  );
}
