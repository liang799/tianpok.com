export type SiteLifeVector = [number, number, number];

export interface SiteLifeDronePose {
  position: SiteLifeVector;
  rotation: SiteLifeVector;
  rotorAngle: number;
}

export interface SiteLifeWorkerPose {
  position: SiteLifeVector;
  yaw: number;
  leftFoot: SiteLifeVector;
  rightFoot: SiteLifeVector;
  leftHand: SiteLifeVector;
  rightHand: SiteLifeVector;
  headYaw: number;
  headPitch: number;
}

export interface SiteLifePose {
  drone: SiteLifeDronePose;
  workers: SiteLifeWorkerPose[];
}

const TAU = Math.PI * 2;
const WORKER_POSITIONS: SiteLifeVector[] = [
  [-2.6, 0.22, 1.95],
  [-1.91, 1.75, 1.18],
  [1.75, 0.22, 1.39],
  [-0.8, 0.22, 2.7],
  [-6.6, -0.6, 1.3],
  [6.8, 2.5, -0.3],
];
const RIGHT_HAND_HEIGHTS = [0.43, 0.26, 0.43, 0.41, 0.43, 0.41];

function ease(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

interface WalkPose {
  distance: number;
  leftFoot: SiteLifeVector;
  rightFoot: SiteLifeVector;
}

/** Foot targets are world distances along the route. The body follows their
 * midpoint, so subtracting body travel keeps the stance foot planted. The final
 * step closes the feet together before any turn begins. */
function walk(
  time: number,
  distance: number,
  steps: number,
  stepDuration: number,
): WalkPose {
  const stepTime = Math.min(steps, Math.max(0, time / stepDuration));
  const step = Math.min(steps - 1, Math.floor(stepTime));
  const phase = stepTime - step;
  const stride = distance / (steps - 1);
  const leftStep = step % 2 === 0;
  const previousSwing = Math.max(0, step - 1) * stride;
  const stance = Math.min(distance, step * stride);
  const target = Math.min(distance, (step + 1) * stride);
  const swing = mix(previousSwing, target, ease(phase));
  const body = (stance + swing) / 2;
  const lift = 0.035 * Math.sin(Math.PI * phase) ** 2;
  const swingFoot: SiteLifeVector = [
    leftStep ? -0.06 : 0.06,
    0.04 + lift,
    swing - body,
  ];
  const stanceFoot: SiteLifeVector = [
    leftStep ? 0.06 : -0.06,
    0.04,
    stance - body,
  ];
  return {
    distance: body,
    leftFoot: leftStep ? swingFoot : stanceFoot,
    rightFoot: leftStep ? stanceFoot : swingFoot,
  };
}

function animateWalk(pose: SiteLifeWorkerPose, index: number, time: number) {
  const direction = index === 3 ? 1 : -1;
  const distance = index === 3 ? 1.08 : 0.6;
  const steps = index === 3 ? 12 : 8;
  const stepDuration = index === 3 ? 0.8 : 0.95;
  const initialRest = index === 3 ? 0.15 : 0.3;
  const initialTurn = 0.65;
  const travelDuration = steps * stepDuration;
  const farRest = 1.4;
  const turnaround = 2.4;
  const homeRest = 0.8;
  const finalTurn = 1.5;
  const finalRest = 2;
  const walkStart = initialRest + initialTurn;
  const farArrival = walkStart + travelDuration;
  const turnStart = farArrival + farRest;
  const returnStart = turnStart + turnaround;
  const homeArrival = returnStart + travelDuration;
  const finalTurnStart = homeArrival + homeRest;
  const finalTurnEnd = finalTurnStart + finalTurn;
  const duration = finalTurnEnd + finalRest;
  const phase = time % duration;
  const outwardYaw = (direction * Math.PI) / 2;
  let walking: WalkPose | undefined;
  let returning = false;
  let activity = 0;

  if (phase < walkStart) {
    activity = ease((phase - initialRest) / initialTurn);
    pose.yaw = outwardYaw * activity;
  } else if (phase < farArrival) {
    pose.yaw = outwardYaw;
    activity = 1;
    walking = walk(phase - walkStart, distance, steps, stepDuration);
  } else if (phase < returnStart) {
    pose.position[0] += direction * distance;
    activity = 1;
    pose.yaw = mix(
      outwardYaw,
      -outwardYaw,
      ease((phase - turnStart) / turnaround),
    );
  } else if (phase < homeArrival) {
    pose.yaw = -outwardYaw;
    activity = 1;
    returning = true;
    walking = walk(phase - returnStart, distance, steps, stepDuration);
  } else {
    activity = 1 - ease((phase - finalTurnStart) / finalTurn);
    pose.yaw = -outwardYaw * activity;
  }

  if (walking) {
    pose.position[0] +=
      direction * (returning ? distance - walking.distance : walking.distance);
    pose.leftFoot = walking.leftFoot;
    pose.rightFoot = walking.rightFoot;
  }

  // Low, opposing arm swings preserve the shoulders' reach during each step.
  pose.leftHand = [
    mix(pose.leftHand[0], -0.115, activity),
    mix(pose.leftHand[1], 0.235, activity),
    mix(pose.leftHand[2], 0.02 - pose.leftFoot[2] * 0.6, activity),
  ];
  pose.rightHand = [
    mix(pose.rightHand[0], 0.115, activity),
    mix(pose.rightHand[1], 0.235, activity),
    mix(pose.rightHand[2], 0.02 - pose.rightFoot[2] * 0.6, activity),
  ];
}

/** Sample seconds of autonomous site activity; all coordinates besides worker
 * position and drone position are local to the corresponding model. */
export function sampleSiteLife(time: number): SiteLifePose {
  const seconds = Number.isFinite(time) ? Math.max(0, time) : 0;
  const dronePhase = (TAU * (seconds % 24)) / 24;
  const workers = WORKER_POSITIONS.map(
    (position, index): SiteLifeWorkerPose => {
      const phase = (TAU * (seconds % 36)) / 36;
      const gesture = Math.sin(phase * ((index % 2) + 2));
      const smallGesture = Math.sin(phase * 3);
      const pose: SiteLifeWorkerPose = {
        position: [...position],
        yaw: 0,
        leftFoot: [-0.06, 0.04, 0],
        rightFoot: [0.06, 0.04, 0],
        leftHand: [
          -0.135 + gesture * 0.008,
          0.228 + smallGesture * 0.007,
          0.04 + gesture * 0.01,
        ],
        rightHand: [
          0.18 + smallGesture * 0.009,
          RIGHT_HAND_HEIGHTS[index] + gesture * 0.017,
          0.04 + gesture * 0.017,
        ],
        headYaw: Math.sin(phase * 2) * (index % 2 ? -0.13 : 0.11),
        headPitch: Math.sin(phase * 3) * 0.035,
      };
      if (index === 3 || index === 4) animateWalk(pose, index, seconds);
      return pose;
    },
  );

  return {
    drone: {
      position: [
        6.1 + 0.48 * Math.sin(dronePhase),
        4.1 + 0.12 * Math.sin(dronePhase * 2),
        0.6 + 0.16 * Math.sin(dronePhase * 2),
      ],
      rotation: [
        0.018 * Math.sin(dronePhase * 2),
        0.16 * Math.sin(dronePhase),
        0.025 * Math.sin(dronePhase),
      ],
      rotorAngle: seconds * TAU * 11,
    },
    workers,
  };
}
