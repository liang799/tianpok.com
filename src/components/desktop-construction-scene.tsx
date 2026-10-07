"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MotionValue } from "motion/react";
import type { CraneSample } from "@/lib/crane-choreography";
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
  onRendererChange?: (renderer: Renderer) => void;
};

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
  onRendererChange,
}: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [renderer, setRenderer] = useState<Renderer>("loading");
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
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={host}
      className={`construction-scene ${styles.scene} ${className}`}
      data-testid="desktop-construction-scene"
      data-renderer={renderer}
      data-theme={dark ? "dark" : "light"}
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
            onReady={ready}
            onFailure={failed}
            onFrame={frame}
          />
        </CanvasBoundary>
      )}
    </div>
  );
}
