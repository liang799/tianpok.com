"use client";

import {
  memo,
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import DesktopConstructionScene from "./desktop-construction-scene";
import { MobileConstructionArt } from "./mobile-construction-art";
import Link from "next/link";
import { ArrowRight } from "./icons";

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
  const [introReplay, setIntroReplay] = useState(0);
  const [completedIntro, setCompletedIntro] = useState(-1);
  const [skippedIntro, setSkippedIntro] = useState(-1);
  const complete =
    completedIntro === introReplay || skippedIntro === introReplay;
  const onIntroComplete = useCallback(
    () => setCompletedIntro(introReplay),
    [introReplay],
  );

  function toggleIntro() {
    if (!complete) setSkippedIntro(introReplay);
    else setIntroReplay((run) => run + 1);
  }

  return (
    <div
      className="construction-track"
      data-testid="construction-track"
      data-animated="false"
    >
      <section
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
            {!isMobile && !reducedMotion && (
              <button
                type="button"
                className="construction-replay-control"
                onClick={toggleIntro}
              >
                <span aria-hidden="true">{complete ? "↻" : "→"}</span>
                {complete ? "Replay the build" : "Skip intro"}
              </button>
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
              overview
              ambientMotion={!reducedMotion}
              intro
              introReplay={introReplay}
              skipIntro={skippedIntro === introReplay}
              onIntroComplete={onIntroComplete}
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
