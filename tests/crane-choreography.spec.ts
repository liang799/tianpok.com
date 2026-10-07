import { expect, test } from "@playwright/test";
import {
  CONSTRUCTION_PIECES,
  PICKUP_SURFACE_HEIGHT,
  liftingEyes,
} from "../src/lib/construction-plan";
import {
  BOOM_HEIGHT,
  CRANE_BASE,
  LIFT_HEIGHT,
  SLING_HEIGHT,
  sampleCrane,
  type CraneVector3,
} from "../src/lib/crane-choreography";

const count = CONSTRUCTION_PIECES.length;

function distance(a: CraneVector3, b: CraneVector3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function frameAt(piece: number, cycleProgress: number) {
  return sampleCrane((piece + cycleProgress) / count);
}

test("all eight prefab pieces exist on pallets, then remain in the completed structure", () => {
  const first = sampleCrane(0);
  const last = sampleCrane(1);
  expect(count).toBe(8);
  expect(first.placedCount).toBe(0);
  expect(last.placedCount).toBe(count);
  expect(last.phase).toBe("completed");
  expect(last.attached).toBe(false);
  expect(distance(last.hookPosition, first.hookPosition)).toBeLessThan(1e-10);

  for (let index = 0; index < count; index++) {
    const part = CONSTRUCTION_PIECES[index];
    expect(first.piecePoses[index]).toEqual({
      id: part.id,
      position: part.pickup,
      rotation: [0, 0, 0],
      placed: false,
    });
    expect(part.pickup[1] - part.size[1] / 2).toBeCloseTo(
      PICKUP_SURFACE_HEIGHT,
      10,
    );
    expect(last.piecePoses[index]).toEqual({
      id: part.id,
      position: part.placement,
      rotation: [0, 0, 0],
      placed: true,
    });
    for (const local of [0, 0.16, 0.28, 0.42, 0.59, 0.74, 0.87, 0.99]) {
      const frame = frameAt(index, local);
      expect(frame.activePieceIndex).toBe(index);
      expect(frame.piecePoses.map((pose) => pose.id)).toEqual(
        CONSTRUCTION_PIECES.map((piece) => piece.id),
      );
      expect(frame.loadPosition).toEqual(frame.piecePoses[index].position);
      expect(frame.loadRotation).toEqual(frame.piecePoses[index].rotation);
      expect(frame.placedCount).toBe(
        frame.piecePoses.filter((pose) => pose.placed).length,
      );
      for (let other = 0; other < count; other++) {
        if (other === index) continue;
        expect(frame.piecePoses[other].position).toEqual(
          other < index
            ? CONSTRUCTION_PIECES[other].placement
            : CONSTRUCTION_PIECES[other].pickup,
        );
        expect(frame.piecePoses[other].rotation).toEqual([0, 0, 0]);
      }
      if (local < 0.3) expect(frame.loadPosition).toEqual(part.pickup);
      if (local > 0.85) {
        expect(frame.loadPosition).toEqual(part.placement);
        expect(frame.attached).toBe(false);
        expect(frame.placed).toBe(true);
      }
    }
  }
});

test("every part has connected rigging, overhead clearance, and exact alignment during seating", () => {
  const carriedIds = new Set<string>();
  let maxCableError = 0;
  let maxSlingError = 0;
  let minCable = Infinity;
  let maxReach = 0;
  let minimumScaffoldClearance = Infinity;
  let minimumBuildingClearance = Infinity;
  let maximumSeatedRotation = 0;

  for (let i = 0; i <= 8000; i++) {
    const frame = sampleCrane(i / 8000);
    const part = CONSTRUCTION_PIECES[frame.activePieceIndex];
    const cableEndpoint: CraneVector3 = [
      CRANE_BASE[0] + Math.cos(frame.boomRotation) * frame.trolleyRadius,
      BOOM_HEIGHT - frame.cableLength,
      CRANE_BASE[2] - Math.sin(frame.boomRotation) * frame.trolleyRadius,
    ];
    maxCableError = Math.max(
      maxCableError,
      distance(cableEndpoint, frame.hookPosition),
    );
    minCable = Math.min(minCable, frame.cableLength);
    maxReach = Math.max(maxReach, frame.trolleyRadius);
    if (frame.attached) {
      carriedIds.add(part.id);
      const slingApex: CraneVector3 = [
        frame.loadPosition[0],
        frame.loadPosition[1] + part.size[1] / 2 + SLING_HEIGHT,
        frame.loadPosition[2],
      ];
      maxSlingError = Math.max(
        maxSlingError,
        distance(slingApex, frame.hookPosition),
      );
      expect(liftingEyes(part)).toHaveLength(4);
    }
    if (frame.phase === "slew") {
      expect(frame.attached).toBe(true);
      expect(frame.loadPosition[1]).toBeCloseTo(LIFT_HEIGHT, 10);
      const underside = frame.loadPosition[1] - part.size[1] / 2;
      minimumScaffoldClearance = Math.min(
        minimumScaffoldClearance,
        underside - 4.54,
      );
      for (let placed = 0; placed < frame.activePieceIndex; placed++) {
        const prior = CONSTRUCTION_PIECES[placed];
        minimumBuildingClearance = Math.min(
          minimumBuildingClearance,
          underside - prior.placement[1] - prior.size[1] / 2,
        );
      }
    }
    if (frame.phase === "seat" || frame.phase === "release") {
      for (const pose of frame.piecePoses) {
        maximumSeatedRotation = Math.max(
          maximumSeatedRotation,
          Math.hypot(...pose.rotation),
        );
      }
    }
  }
  expect(carriedIds.size).toBe(count);
  expect(maxCableError).toBeLessThan(1e-10);
  expect(maxSlingError).toBeLessThan(1e-10);
  expect(minCable).toBeGreaterThan(0.5);
  expect(maxReach).toBeLessThan(8.4);
  expect(minimumScaffoldClearance).toBeGreaterThan(0.4);
  expect(minimumBuildingClearance).toBeGreaterThan(0.25);
  expect(maximumSeatedRotation).toBe(0);
});

test("each prefab stays continuous through all handoffs and no piece is swapped or teleported", () => {
  let previous = sampleCrane(0);
  let maxHookStep = 0;
  let maxPieceStep = 0;
  let maxBoomStep = 0;
  let maxRotationStep = 0;
  let maxSway = 0;

  for (let i = 1; i <= 16000; i++) {
    const frame = sampleCrane(i / 16000);
    maxHookStep = Math.max(
      maxHookStep,
      distance(frame.hookPosition, previous.hookPosition),
    );
    maxBoomStep = Math.max(
      maxBoomStep,
      Math.abs(frame.boomRotation - previous.boomRotation),
    );
    for (let piece = 0; piece < count; piece++) {
      const currentPose = frame.piecePoses[piece];
      const previousPose = previous.piecePoses[piece];
      maxPieceStep = Math.max(
        maxPieceStep,
        distance(currentPose.position, previousPose.position),
      );
      maxRotationStep = Math.max(
        maxRotationStep,
        distance(currentPose.rotation, previousPose.rotation),
      );
      maxSway = Math.max(maxSway, Math.abs(currentPose.rotation[1]));
    }
    previous = frame;
  }
  // Sampling at 2,000 intervals per lift bounds normal travel well below the
  // jump introduced by swapping a staged part for a separate finished model.
  expect(maxHookStep).toBeLessThan(0.14);
  expect(maxPieceStep).toBeLessThan(0.04);
  expect(maxBoomStep).toBeLessThan(0.04);
  expect(maxRotationStep).toBeLessThan(0.002);
  expect(maxSway).toBeGreaterThan(0.01);
  expect(maxSway).toBeLessThanOrEqual(0.035);

  for (let boundary = 1; boundary < count; boundary++) {
    const before = sampleCrane(boundary / count - 1e-9);
    const after = sampleCrane(boundary / count + 1e-9);
    expect(before.activePieceIndex).toBe(boundary - 1);
    expect(after.activePieceIndex).toBe(boundary);
    expect(distance(before.hookPosition, after.hookPosition)).toBeLessThan(
      1e-8,
    );
    expect(Math.abs(before.boomRotation - after.boomRotation)).toBeLessThan(
      1e-8,
    );
    expect(before.piecePoses).toEqual(after.piecePoses);
    expect(before.placedCount).toBe(boundary);
    expect(after.placedCount).toBe(boundary);
    expect(before.attached || after.attached).toBe(false);
  }
});

test("completed structural faces meet exactly without overlapping volumes", () => {
  const byId = (id: string) =>
    CONSTRUCTION_PIECES.find((piece) => piece.id === id)!;
  const top = (id: string) => byId(id).placement[1] + byId(id).size[1] / 2;
  const bottom = (id: string) => byId(id).placement[1] - byId(id).size[1] / 2;
  for (const [lower, upper] of [
    ["t-base", "t-column"],
    ["t-column", "t-cap"],
    ["p-base", "p-column"],
    ["p-crossbeam", "p-outer"],
    ["p-outer", "p-roof"],
  ]) {
    expect(top(lower), `${lower} must support ${upper}`).toBeCloseTo(
      bottom(upper),
      10,
    );
  }
  for (const beam of ["p-crossbeam", "p-roof"]) {
    expect(byId(beam).placement[0] - byId(beam).size[0] / 2).toBeCloseTo(
      byId("p-column").placement[0] + byId("p-column").size[0] / 2,
      10,
    );
  }
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) {
      const first = CONSTRUCTION_PIECES[a];
      const second = CONSTRUCTION_PIECES[b];
      const overlap = [0, 1, 2].map(
        (axis) =>
          (first.size[axis] + second.size[axis]) / 2 -
          Math.abs(first.placement[axis] - second.placement[axis]),
      );
      expect(
        Math.min(...overlap),
        `${first.id} overlaps ${second.id}`,
      ).toBeLessThan(1e-10);
    }
  }
});

test("reverse seeks reproduce every prefab and crane pose without retained state", () => {
  const progress = Array.from({ length: 801 }, (_, i) => i / 800);
  const forward = progress.map(sampleCrane);
  for (let i = progress.length - 1; i >= 0; i--) {
    expect(sampleCrane(progress[i])).toEqual(forward[i]);
  }
  for (const i of [799, 4, 128, 640, 0, 391, 800]) {
    expect(sampleCrane(progress[i])).toEqual(forward[i]);
  }

  const frame = sampleCrane(1);
  frame.loadPosition[1] = -100;
  frame.piecePoses[0].position[1] = -200;
  expect(sampleCrane(1)).toEqual(forward[800]);
  expect(sampleCrane(-1)).toEqual(sampleCrane(0));
  expect(sampleCrane(2)).toEqual(sampleCrane(1));
  expect(sampleCrane(NaN)).toEqual(sampleCrane(0));
  expect(sampleCrane(Infinity)).toEqual(sampleCrane(1));
});
