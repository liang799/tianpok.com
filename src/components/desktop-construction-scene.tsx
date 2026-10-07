"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { MotionValue } from "motion/react";
import type { CraneSample } from "@/lib/crane-choreography";
import type { SiteLifeFrame } from "./construction-3d/ambient-life";
import { CONSTRUCTION_PIECES } from "@/lib/construction-plan";
import { ConstructionFallback } from "./construction-3d/fallback";
import styles from "./construction-3d/scene.module.css";

const ConstructionCanvas = dynamic(() => import("./construction-3d/canvas"), {
  ssr: false,
});

type Renderer = "loading" | "webgl" | "fallback";
type SceneProps = {
  className?: string;
  progress?: MotionValue<number>;
  animated?: boolean;
  dark?: boolean;
  overview?: boolean;
  ambientMotion?: boolean;
  onRendererChange?: (renderer: Renderer) => void;
};

function subscribeMotionAvailability(onChange: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.addEventListener("visibilitychange", onChange);
  reduced.addEventListener("change", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    reduced.removeEventListener("change", onChange);
  };
}

function motionAvailable() {
  return (
    !document.hidden &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** HTML remains available before WebGL loads and when the GPU is unavailable. */
export default function DesktopConstructionScene({
  className = "",
  progress,
  animated = false,
  dark = false,
  overview = false,
  ambientMotion = false,
  onRendererChange,
}: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const siteLabel = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [inViewport, setInViewport] = useState(false);
  const motionAllowed = useSyncExternalStore(
    subscribeMotionAvailability,
    motionAvailable,
    () => false,
  );
  const [renderer, setRenderer] = useState<Renderer>("loading");
  const ambientRunning =
    ambientMotion &&
    overview &&
    !animated &&
    inViewport &&
    motionAllowed &&
    renderer === "webgl";
  const reportRenderer = useCallback(
    (next: Renderer) => {
      setRenderer(next);
      onRendererChange?.(next);
    },
    [onRendererChange],
  );
  const ready = useCallback(() => reportRenderer("webgl"), [reportRenderer]);
  const failed = useCallback(
    () => reportRenderer("fallback"),
    [reportRenderer],
  );
  const projectLabel = useCallback((x: number, y: number, fontSize: number) => {
    const label = siteLabel.current;
    if (!label) return;
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.fontSize = `${fontSize}px`;
  }, []);
  const frame = useCallback(
    (
      value: number,
      sample: CraneSample,
      rendered: { pieceCount: number; placedCount: number },
    ) => {
      if (!host.current) return;
      // Describe transforms applied to the real scene, including reverse seeks.
      const data = host.current.dataset;
      data.progress = value.toFixed(4);
      data.phase = sample.phase;
      data.attached = String(sample.attached);
      data.placed = String(sample.placed);
      data.activePiece = CONSTRUCTION_PIECES[sample.activePieceIndex].id;
      data.liftIndex = String(sample.activePieceIndex);
      data.placedCount = String(rendered.placedCount);
      data.pieceCount = String(rendered.pieceCount);
      data.cycleProgress = sample.cycleProgress.toFixed(4);
    },
    [],
  );
  const lifeFrame = useCallback((frame: SiteLifeFrame) => {
    if (!host.current) return;
    const data = host.current.dataset;
    data.ambientTime = frame.time.toFixed(3);
    data.dronePosition = JSON.stringify(frame.dronePosition);
    data.workerPosition = JSON.stringify(frame.workerPosition);
    data.workerPose = JSON.stringify(frame.workerPose);
    data.rotorAngle = frame.rotorAngle.toFixed(3);
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    const visibility = new IntersectionObserver(([entry]) =>
      setInViewport(entry.isIntersecting),
    );
    visibility.observe(element);
    return () => {
      observer.disconnect();
      visibility.disconnect();
    };
  }, []);

  return (
    <div
      ref={host}
      className={`construction-scene ${styles.scene} ${className}`}
      data-testid="desktop-construction-scene"
      data-renderer={renderer}
      data-theme={dark ? "dark" : "light"}
      data-overview={overview}
      data-ambient={ambientRunning ? "running" : "paused"}
      aria-hidden="true"
    >
      {renderer !== "webgl" && (
        <div className={styles.fallback}>
          <ConstructionFallback />
        </div>
      )}
      {nearViewport && renderer !== "fallback" && (
        <CanvasBoundary onFailure={failed}>
          <ConstructionCanvas
            progress={progress}
            animated={animated}
            dark={dark}
            overview={overview}
            ambientMotion={ambientRunning}
            onLifeFrame={lifeFrame}
            onProjectLabel={projectLabel}
            onReady={ready}
            onFailure={failed}
            onFrame={frame}
          />
        </CanvasBoundary>
      )}
      <div ref={siteLabel} className={styles.siteLabel}>
        Building
        <br />a brighter
        <br />
        digital
        <br />
        tomorrow
        <span />
      </div>
    </div>
  );
}
