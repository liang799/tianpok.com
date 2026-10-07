"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import DesktopConstructionScene from "./desktop-construction-scene";
import { MobileConstructionArt } from "./mobile-construction-art";
import Link from "next/link";
import { ArrowRight } from "./icons";
import { constructionSpring } from "@/lib/construction-motion";
import { sampleCrane } from "@/lib/crane-choreography";

const ConstructionArtwork = memo(DesktopConstructionScene);
const mobileQuery = "(max-width: 639px)";
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribe(query: string, onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const subscribeMobile = (onChange: () => void) =>
  subscribe(mobileQuery, onChange);
const subscribeReduced = (onChange: () => void) =>
  subscribe(reducedQuery, onChange);

export function ConstructionHero({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => true,
  );
  const [renderer, setRenderer] = useState<"loading" | "webgl" | "fallback">(
    "loading",
  );
  const [size, setSize] = useState({ stage: 0, viewport: 0 });
  const [phase, setPhase] = useState("Scroll to build");
  const initialAnchor = useRef({
    hash: "",
    static: false,
    animated: false,
    cancelled: false,
  });
  const stickyTop = Math.min(0, size.viewport - size.stage);
  const animated =
    !isMobile && !reducedMotion && renderer === "webgl" && size.stage > 0;
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: [`start ${stickyTop}px`, `end ${size.stage + stickyTop}px`],
  });
  const assemblyProgress = useSpring(scrollYProgress, constructionSpring);
  const onRendererChange = useCallback(
    (next: "loading" | "webgl" | "fallback") => setRenderer(next),
    [],
  );

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
    const cancelOnInput = () => {
      if (initialAnchor.current.hash) initialAnchor.current.cancelled = true;
    };
    const cancelOnResize = () => {
      initialAnchor.current.cancelled = true;
    };
    const cancelOnKey = (event: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        cancelOnInput();
    };
    window.addEventListener("wheel", cancelOnInput, { passive: true });
    window.addEventListener("touchstart", cancelOnInput, { passive: true });
    window.addEventListener("pointerdown", cancelOnInput);
    window.addEventListener("keydown", cancelOnKey);
    window.addEventListener("resize", cancelOnResize);
    return () => {
      window.removeEventListener("wheel", cancelOnInput);
      window.removeEventListener("touchstart", cancelOnInput);
      window.removeEventListener("pointerdown", cancelOnInput);
      window.removeEventListener("keydown", cancelOnKey);
      window.removeEventListener("resize", cancelOnResize);
    };
  }, []);

  useEffect(() => {
    const restoration = initialAnchor.current;
    const layout = animated ? "animated" : "static";
    if (!size.stage || restoration.cancelled || restoration[layout]) return;
    if (stageRef.current?.getBoundingClientRect().height !== size.stage) return;
    const hash = window.location.hash.slice(1);
    const target = document.getElementById(hash);
    if (!target || hash === "home") {
      restoration[layout] = true;
      return;
    }
    if (restoration.hash && restoration.hash !== hash) return;
    restoration.hash = hash;
    // Back can restore a scroll offset from an expanded runway while the
    // offscreen renderer stays lazy. Restore the measured HTML layout first,
    // and align once more if the initial WebGL layout subsequently expands.
    const frame = requestAnimationFrame(() => {
      if (restoration.cancelled || window.location.hash.slice(1) !== hash)
        return;
      if (stageRef.current?.getBoundingClientRect().height !== size.stage)
        return;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      restoration[layout] = true;
      if (animated) restoration.static = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [animated, size.stage]);

  useMotionValueEvent(assemblyProgress, "change", (value) => {
    setPhase(
      value < 0.015
        ? "Scroll to build"
        : value >= 1
          ? "Built. Keep exploring."
          : sampleCrane(value).phaseLabel,
    );
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
        data-component="ConstructionHero"
        aria-labelledby="hero-title"
      >
        <div className="hero-atmosphere" aria-hidden="true" />
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
                  <span>{phase}</span>
                </div>
                <div className="construction-progress">
                  <motion.span style={{ scaleX: assemblyProgress }} />
                </div>
              </div>
            )}
            <p className="hero-location" aria-hidden="true">
              Singapore
              <br />
              {"// 2026"}
            </p>
          </div>
        </div>
        <div className="hero-note hero-note-process" aria-hidden="true">
          Ideas
          <br />
          Code
          <br />
          Products
          <br />
          People
          <span />
        </div>
        <div className="hero-art" aria-hidden="true">
          {!isMobile && (
            <ConstructionArtwork
              progress={assemblyProgress}
              animated={animated}
              onRendererChange={onRendererChange}
            />
          )}
        </div>
        <MobileConstructionArt />
        <Link href="#projects" className="mobile-hero-cta">
          View my work <ArrowRight />
        </Link>
      </section>
    </div>
  );
}
