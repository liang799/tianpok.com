"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./scene.module.css";

const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

/** The same scene rendered offline. No Three.js is needed to paint this layer. */
export function ConstructionIntro({
  enabled,
  active,
  complete,
  visible,
  onComplete,
}: {
  enabled: boolean;
  active: boolean;
  complete: boolean;
  visible: boolean;
  onComplete: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stalled = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const clearStall = useCallback(() => {
    if (stalled.current) clearTimeout(stalled.current);
    stalled.current = null;
  }, []);
  const finish = useCallback(() => {
    clearStall();
    onComplete();
  }, [clearStall, onComplete]);

  useEffect(() => {
    const element = video.current;
    if (!element || !enabled) return;
    if (!active || complete) {
      element.pause();
      clearStall();
      return;
    }
    // Muted, inline playback works without a gesture. If the browser declines,
    // the completed poster remains visible until the live scene is ready.
    let cancelled = false;
    void element.play().catch(() => {
      if (!cancelled) finish();
    });
    return () => {
      cancelled = true;
      element.pause();
      clearStall();
    };
  }, [active, clearStall, complete, enabled, finish]);

  function waitForMedia() {
    clearStall();
    // A broken or stalled video must never hold the live scene behind it.
    if (active && !complete) stalled.current = setTimeout(finish, 2500);
  }

  return (
    <div
      className={styles.prerender}
      data-visible={visible}
      data-playing={playing && !complete}
    >
      <picture>
        <source
          media="(min-width: 640px) and (prefers-reduced-motion: reduce)"
          srcSet="/media/construction-intro-poster.webp"
        />
        <source
          media="(min-width: 640px)"
          srcSet={
            complete || playing
              ? "/media/construction-intro-poster.webp"
              : "/media/construction-intro-start.webp"
          }
        />
        {/* The media source prevents a desktop poster download on mobile. */}
        <img
          data-testid="construction-poster"
          className={styles.prerenderFrame}
          src={transparentPixel}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      {enabled && (
        <video
          ref={video}
          data-testid="construction-intro-video"
          className={`${styles.prerenderFrame} ${styles.introVideo}`}
          src="/media/construction-intro.mp4"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onPlaying={() => {
            clearStall();
            setPlaying(true);
          }}
          onEnded={finish}
          onError={finish}
          onWaiting={waitForMedia}
          onStalled={waitForMedia}
        />
      )}
    </div>
  );
}
