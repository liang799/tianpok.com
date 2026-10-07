"use client";

import { useId } from "react";
import {
  cubicBezier,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";

const artwork = "/images/desktop-construction.webp";
const site = "/images/desktop-construction-site.webp";
const settle = cubicBezier(0.22, 1, 0.36, 1);

type SceneProps = {
  className?: string;
  progress?: MotionValue<number>;
  animated?: boolean;
};

type AssemblyProps = {
  progress: MotionValue<number>;
  animated: boolean;
};

function Artwork() {
  return <image href={artwork} width="1536" height="1024" />;
}

function AssemblySlice({
  progress,
  animated,
  name,
  step,
  shape,
  start,
  end,
  distance = -36,
  tilt = 0,
  originX = "850px",
  originY = "750px",
}: AssemblyProps & {
  name: string;
  step?: string;
  shape: string;
  start: number;
  end: number;
  distance?: number;
  tilt?: number;
  originX?: string;
  originY?: string;
}) {
  const id = useId();
  const y = useTransform(progress, [start, end], [distance, 0], {
    ease: settle,
  });
  const rotate = useTransform(progress, [start, end], [tilt, 0], {
    ease: settle,
  });
  const opacity = useTransform(
    progress,
    [start, start + (end - start) * 0.7],
    [0, 1],
  );

  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={shape} />
        </clipPath>
      </defs>
      <motion.g
        data-assembly-part={name}
        data-motion-step={step}
        style={{
          y: animated ? y : 0,
          rotate: animated ? rotate : 0,
          opacity: animated ? opacity : 1,
          originX,
          originY,
          transformBox: "view-box",
        }}
      >
        <g clipPath={`url(#${id})`}>
          <Artwork />
        </g>
      </motion.g>
    </>
  );
}

function CraneLoad({ progress, animated }: AssemblyProps) {
  const id = useId();
  const loadY = useTransform(
    progress,
    [0, 0.14, 0.3, 0.43, 0.6, 0.72, 0.9, 1],
    [115, 150, 60, 110, 28, 55, 8, 0],
    { ease: settle },
  );
  const cable = useTransform(loadY, (offset) => `M817 247V${249 + offset}`);

  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d="M815 246 821 246 836 255 885 266 885 327 826 345 773 335 773 275 800 262Z" />
        </clipPath>
      </defs>
      <motion.path
        data-motion-step="crane-cable"
        d={animated ? cable : "M817 247V249"}
        stroke="#34312c"
        strokeWidth="2.2"
        fill="none"
      />
      <motion.g
        data-assembly-part="crane-load"
        style={{ y: animated ? loadY : 0 }}
      >
        <g clipPath={`url(#${id})`}>
          <Artwork />
        </g>
      </motion.g>
    </>
  );
}

export default function DesktopConstructionScene({
  className = "",
  progress,
  animated = false,
}: SceneProps) {
  const complete = useMotionValue(1);
  const value = progress ?? complete;
  const assembly = { progress: value, animated: animated && !!progress };
  const finish = useTransform(value, [0.94, 1], [0, 1], { ease: settle });

  return (
    <svg
      className={className}
      data-testid="desktop-construction-scene"
      viewBox="0 0 1536 1024"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      <image href={site} width="1536" height="1024" />
      <AssemblySlice
        {...assembly}
        name="foundation"
        shape="M528 931 602 925 649 934 735 927 784 905 848 918 892 926 935 923 982 944 1183 936 1185 974 529 979Z"
        start={0.02}
        end={0.22}
        distance={18}
      />
      <AssemblySlice
        {...assembly}
        name="scaffold"
        step="scaffold-uprights"
        shape="M531 744 749 698 937 734 937 799 1056 820 1135 845 1179 934 1179 972 531 976Z"
        start={0.13}
        end={0.4}
        distance={28}
        tilt={-0.35}
        originY="970px"
      />
      <AssemblySlice
        {...assembly}
        name="letter-stem"
        step="letter-stem-panels"
        shape="M655 531 755 508 785 521 849 539 849 695 933 721 933 588 999 604 999 798 1056 816 1056 851 933 832 785 810 785 697 655 723Z"
        start={0.28}
        end={0.55}
        distance={-42}
        tilt={0.4}
      />
      <AssemblySlice
        {...assembly}
        name="letter-upper-stem"
        shape="M654 438 755 418 786 433 849 451 849 548 785 525 755 510 654 537Z"
        start={0.43}
        end={0.65}
        distance={-34}
        tilt={-0.45}
        originY="535px"
      />
      <AssemblySlice
        {...assembly}
        name="letter-cap"
        step="letter-cap-seat"
        shape="M590 379 716 330 898 388 932 388 1118 450Q1136 456 1135 490L1135 632Q1135 650 1118 656L998 684 998 801 931 831 931 479 848 522 848 452 786 433 655 472 590 455Z"
        start={0.57}
        end={0.81}
        distance={-32}
        tilt={-0.6}
        originY="465px"
      />
      <AssemblySlice
        {...assembly}
        name="scaffold-bracing"
        shape="M628 558 659 554 659 648 755 644 787 654 933 683 938 755 929 773 747 726 623 754ZM1093 425 1164 432 1180 445 1181 967 1135 972 1135 843 1100 834 1095 643 1131 629 1130 462 1093 451Z"
        start={0.68}
        end={0.9}
        distance={15}
      />
      <AssemblySlice
        {...assembly}
        name="workers"
        shape="M576 645 598 643 606 655 622 658 620 678 607 685 607 703 601 736 574 742 575 676ZM786 615 822 609 839 627 840 678 833 718 810 718 803 673 786 651ZM973 326 990 323 1001 335 1014 331 1015 349 1002 363 1002 410 973 405 972 365ZM613 349 630 345 638 360 611 371ZM891 369 934 364 975 378 1059 412 1165 435 1168 458 1054 433 930 387 891 408Z"
        start={0.79}
        end={0.96}
        distance={8}
      />
      <CraneLoad {...assembly} />
      <motion.g
        data-motion-step="final-artwork"
        style={{ opacity: assembly.animated ? finish : 1 }}
      >
        <Artwork />
      </motion.g>
    </svg>
  );
}
