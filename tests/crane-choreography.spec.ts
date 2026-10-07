import { expect, test } from "@playwright/test";
import {
  BOOM_HEIGHT,
  CRANE_BASE,
  LIFT_HEIGHT,
  LOAD_SIZE,
  PICKUP_POSITION,
  PLACEMENT_POSITION,
  SLING_HEIGHT,
  sampleCrane,
  type CraneVector3,
} from "../src/lib/crane-choreography";

function distance(a: CraneVector3, b: CraneVector3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

test("the hook is always under the trolley and the suspended load stays connected", () => {
  let carriedSamples = 0;
  for (let i = 0; i <= 2000; i++) {
    const frame = sampleCrane(i / 2000);
    const cableEndpoint: CraneVector3 = [
      CRANE_BASE[0] + Math.cos(frame.boomRotation) * frame.trolleyRadius,
      BOOM_HEIGHT - frame.cableLength,
      CRANE_BASE[2] - Math.sin(frame.boomRotation) * frame.trolleyRadius,
    ];
    expect(distance(cableEndpoint, frame.hookPosition)).toBeLessThan(1e-10);
    expect(frame.cableLength).toBeGreaterThan(0.5);
    expect(frame.hookPosition[1]).toBeLessThan(BOOM_HEIGHT);

    if (frame.attached) {
      carriedSamples++;
      const slingApex: CraneVector3 = [
        frame.loadPosition[0],
        frame.loadPosition[1] + LOAD_SIZE[1] / 2 + SLING_HEIGHT,
        frame.loadPosition[2],
      ];
      expect(distance(slingApex, frame.hookPosition)).toBeLessThan(1e-10);
    }
  }
  expect(carriedSamples).toBeGreaterThan(100);
});

test("the load lifts clear before traversing, then seats before the hook releases", () => {
  const initial = sampleCrane(0);
  const final = sampleCrane(1);
  expect(initial.loadPosition).toEqual(PICKUP_POSITION);
  expect(initial.attached).toBe(false);
  expect(final.loadPosition).toEqual(PLACEMENT_POSITION);
  expect(final.attached).toBe(false);
  expect(final.placed).toBe(true);
  expect(final.phase).toBe("completed");
  expect(distance(final.hookPosition, initial.hookPosition)).toBeLessThan(
    1e-10,
  );

  let previouslyAttached = false;
  let released = false;
  let sawTraverse = false;
  for (let i = 0; i <= 2000; i++) {
    const frame = sampleCrane(i / 2000);
    if (!previouslyAttached && !frame.attached) {
      expect(frame.loadPosition).toEqual(PICKUP_POSITION);
    }
    if (previouslyAttached && !frame.attached) released = true;
    if (released) {
      expect(frame.placed).toBe(true);
      expect(frame.loadPosition).toEqual(PLACEMENT_POSITION);
      expect(frame.loadRotation).toEqual([0, 0, 0]);
    }
    if (frame.phase === "slew") {
      sawTraverse = true;
      expect(frame.attached).toBe(true);
      expect(frame.loadPosition[1]).toBeCloseTo(LIFT_HEIGHT, 10);
      expect(frame.loadPosition[1] - LOAD_SIZE[1] / 2).toBeGreaterThan(
        PLACEMENT_POSITION[1] + LOAD_SIZE[1] / 2,
      );
    }
    previouslyAttached ||= frame.attached;
  }
  expect(sawTraverse).toBe(true);
  expect(released).toBe(true);
});

test("dense sampling stays continuous across every handoff and limits sway", () => {
  let previous = sampleCrane(0);
  let maximumSway = 0;
  for (let i = 1; i <= 4000; i++) {
    const frame = sampleCrane(i / 4000);
    // A discontinuous attachment or detachment would jump farther than any
    // legitimate movement in this tiny fraction of the complete lift.
    expect(distance(frame.hookPosition, previous.hookPosition)).toBeLessThan(
      0.04,
    );
    expect(distance(frame.loadPosition, previous.loadPosition)).toBeLessThan(
      0.04,
    );
    expect(Math.abs(frame.boomRotation - previous.boomRotation)).toBeLessThan(
      0.01,
    );
    expect(distance(frame.loadRotation, previous.loadRotation)).toBeLessThan(
      0.002,
    );
    maximumSway = Math.max(maximumSway, Math.abs(frame.loadRotation[1]));
    expect(Math.abs(frame.loadRotation[1])).toBeLessThanOrEqual(0.035);
    expect(frame.loadPosition[1]).toBeGreaterThanOrEqual(PICKUP_POSITION[1]);
    previous = frame;
  }
  expect(maximumSway).toBeGreaterThan(0.01);
});

test("seeking and reverse scrolling reproduce the same frame without retained state", () => {
  const progress = Array.from({ length: 251 }, (_, i) => i / 250);
  const forward = progress.map(sampleCrane);
  for (let i = progress.length - 1; i >= 0; i--) {
    expect(sampleCrane(progress[i])).toEqual(forward[i]);
  }
  for (const i of [199, 4, 128, 240, 0, 91, 250]) {
    expect(sampleCrane(progress[i])).toEqual(forward[i]);
  }

  const frame = sampleCrane(1);
  frame.loadPosition[1] = -100;
  expect(sampleCrane(1).loadPosition).toEqual(PLACEMENT_POSITION);
  expect(sampleCrane(-1)).toEqual(sampleCrane(0));
  expect(sampleCrane(2)).toEqual(sampleCrane(1));
  expect(sampleCrane(NaN)).toEqual(sampleCrane(0));
  expect(sampleCrane(Infinity)).toEqual(sampleCrane(1));
});
