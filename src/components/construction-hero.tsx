"use client";

import {
  memo,
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

const ConstructionArtwork = memo(DesktopConstructionScene);

const motionQuery =
  "(min-width: 640px) and (prefers-reduced-motion: no-preference)";
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
  // A wheel tick can jump hundreds of pixels. Filter that input once for the
  // entire scene so every piece stays in sync without a bouncy overshoot.
  const assemblyProgress = useSpring(scrollYProgress, constructionSpring);

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

  useMotionValueEvent(assemblyProgress, "change", (progress) => {
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
        data-component="ConstructionHero"
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
        <div className="hero-note hero-note-standards" aria-hidden="true">
          Building
          <br />
          A brighter
          <br />
          Digital
          <br />
          Tomorrow
          <span />
        </div>
        <svg
          className="hero-skyline-extension"
          viewBox="0 0 450 270"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#fbe6d7"
            d="M0 246h20v-25h17v-12h15v61H0Zm43 24V198l27-12 15 8v76Zm42 0v-83h10v-30l26-13 25 12v114Zm55 0V111l26-13 30 12v160Zm52 0V80h9V58h8V38h7v20h9v22h12v190Zm49 0v-99h15v-40h18v-30l26-9 25 11v167Zm80 0V94l28-14 19 13v177Zm41 0V15l28-14 25 17v252Z"
          />
          <path
            fill="#ffd9c0"
            opacity=".7"
            d="M12 270v-23h32v23Zm29 0v-38l21-8 18 7v39Zm37 0v-68h30v68Zm29 0v-91l22-9 17 9v91Zm48 0V148l25-9 23 12v119Zm49 0v-62h34v62Zm48 0V90l29-15 25 15v180Zm62 0v-105h29v105Zm33 0V119l26-8 34 15v144Z"
          />
        </svg>
        <div className="hero-art" aria-hidden="true">
          {animated ? (
            <ConstructionArtwork progress={assemblyProgress} animated />
          ) : (
            <picture className="desktop-construction-fallback">
              <source
                media="(min-width: 640px)"
                srcSet="/images/desktop-construction.webp"
              />
              {/* A media source avoids downloading desktop artwork on phones. */}
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
                alt=""
                width={1536}
                height={1024}
                fetchPriority="high"
              />
            </picture>
          )}
        </div>
        <svg
          className="hero-outbuilding"
          viewBox="0 0 210 255"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="#aaa49e" d="M88 95V12l45-18 33 21v98Z" />
          <path fill="#393a37" d="m1 43 154-31 55 28v215H1Z" />
          <path fill="#242725" d="m1 43 154-31v243H1Z" />
          <path fill="#30332f" d="m155 12 55 28v215h-55Z" />
          <path
            d="M177 36v205m-11-213v46m28-32v193M166 52l28-10M166 73l28-11"
            stroke="#55584e"
            strokeWidth="2"
            fill="none"
          />
          <path d="M0 240h210" stroke="#ff642a" strokeWidth="1" />
        </svg>
        <MobileConstructionArt />
        <Link href="#projects" className="mobile-hero-cta">
          View my work <ArrowRight />
        </Link>
      </section>
    </div>
  );
}
