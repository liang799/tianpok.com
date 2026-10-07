"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import ConstructionScene from "./construction-scene";

const motionQuery = "(prefers-reduced-motion: no-preference)";
function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const phases = [
  "Scroll to build",
  "Foundations",
  "Structure",
  "Finishing touches",
  "Built. Keep exploring.",
];

export function ConstructionHero({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );
  const [size, setSize] = useState({ stage: 0, viewport: 0 });
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const initialAnchorHandled = useRef(false);
  // Tall mobile layouts pin only once the illustration fits on screen.
  const stickyTop = Math.min(0, size.viewport - size.stage);
  const animated = motionAllowed && size.stage > 0;
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: [`start ${stickyTop}px`, `end ${size.stage + stickyTop}px`],
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const next = {
        stage: stage.getBoundingClientRect().height,
        viewport: window.innerHeight,
      };
      setSize((previous) =>
        previous.stage === next.stage && previous.viewport === next.viewport
          ? previous
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!animated || initialAnchorHandled.current) return;
    // Wait for the expanded sticky stage to finish its resize before restoring
    // a direct section link whose initial position used the static HTML height.
    if (stageRef.current?.getBoundingClientRect().height !== size.stage) return;
    const hash = window.location.hash.slice(1);
    const target = document.getElementById(hash);
    initialAnchorHandled.current = true;
    if (!target || hash === "home") return;
    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [animated, size.stage]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next =
      progress >= 0.98
        ? 4
        : progress > 0.7
          ? 3
          : progress > 0.3
            ? 2
            : progress > 0.02
              ? 1
              : 0;
    // React only updates the label at phase boundaries; Motion drives every frame.
    if (next !== phaseRef.current) {
      phaseRef.current = next;
      setPhase(next);
    }
  });

  return (
    <div
      ref={trackRef}
      className="construction-track"
      data-testid="construction-track"
      data-animated={animated}
      style={
        {
          "--construction-sticky-top": `${stickyTop}px`,
          "--construction-height": `${size.stage}px`,
        } as CSSProperties
      }
    >
      <section
        ref={stageRef}
        id="home"
        className="hero construction-stage relative isolate overflow-hidden"
        data-testid="construction-stage"
        aria-labelledby="hero-title"
      >
        <div className="blueprint-grid" aria-hidden="true" />
        <div className="site-container relative z-10">
          <div className="hero-copy">
            {children}
            {animated && (
              <div className="construction-cue" aria-hidden="true">
                <div className="construction-cue-label">
                  <svg width="15" height="18" viewBox="0 0 15 18" fill="none">
                    <path
                      d="M7.5 1v14m-5-5 5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span>{phases[phase]}</span>
                </div>
                <div className="construction-progress">
                  <motion.span style={{ scaleX: scrollYProgress }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hero-note hero-note-process" aria-hidden="true">
          Code
          <br />
          Design
          <br />
          Build
          <br />
          Repeat
          <span />
        </div>
        <div className="hero-note hero-note-standards" aria-hidden="true">
          Same
          <br />
          Ideas
          <br />
          Higher
          <br />
          Standards
          <span />
        </div>
        <div className="hero-art">
          <ConstructionScene progress={scrollYProgress} animated={animated} />
        </div>
        <svg
          className="hero-ground"
          viewBox="0 0 1440 58"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 40 65 26 130 48 205 31 264 44 335 15 389 43 438 21 485 42 555 29 611 53H1440V58H0Z"
            fill="#ffdfcf"
            opacity=".5"
          />
          <path
            d="m0 50 78-7 46 10 90-35 74 32 60-10 62 12 71-28 84 29 62-11 65 12h748v4H0Z"
            fill="#f4d7c6"
            opacity=".65"
          />
        </svg>
      </section>
    </div>
  );
}
