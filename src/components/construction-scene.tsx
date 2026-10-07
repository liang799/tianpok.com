"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Children, type ReactNode } from "react";
import styles from "./construction-scene.module.css";

const ORANGE = "#ff4d23";
const INK = "#30322f";

type SceneProps = {
  className?: string;
  progress?: MotionValue<number>;
  animated?: boolean;
};

type AssemblyProps = {
  progress: MotionValue<number>;
  animated: boolean;
};

function AssemblyPart({
  progress,
  animated,
  name,
  start,
  end,
  distance = 54,
  children,
}: AssemblyProps & {
  name: string;
  start: number;
  end: number;
  distance?: number;
  children: ReactNode;
}) {
  const y = useTransform(progress, [start, end], [distance, 0]);
  const opacity = useTransform(
    progress,
    [start, start + (end - start) * 0.6],
    [0, 1],
  );

  return (
    <motion.g
      data-assembly-part={name}
      style={{ y: animated ? y : 0, opacity: animated ? opacity : 1 }}
    >
      {Children.toArray(children)}
    </motion.g>
  );
}

const skyline = [
  [202, 538, 29, 66],
  [237, 477, 35, 127],
  [279, 420, 42, 184],
  [331, 480, 30, 124],
  [365, 447, 36, 157],
  [409, 432, 44, 172],
  [461, 382, 38, 222],
  [508, 406, 39, 198],
  [556, 469, 33, 135],
  [600, 420, 42, 184],
  [650, 330, 43, 274],
  [704, 403, 28, 201],
  [739, 472, 40, 132],
  [786, 391, 32, 213],
  [826, 466, 31, 138],
  [866, 425, 30, 179],
  [906, 490, 35, 114],
  [951, 513, 38, 91],
] as const;

function City() {
  return (
    <g fill="#ffded0">
      {skyline.map(([x, y, width, height], index) => (
        <g key={x} opacity={index % 3 === 0 ? 0.65 : 0.88}>
          <path
            d={`M${x} 604V${y + 13}h${width * 0.18}v-9h${width * 0.16}v-8h${width * 0.3}v8h${width * 0.16}v9h${width * 0.2}V604Z`}
          />
          {index % 2 === 0 && (
            <path
              d={`M${x + width / 2} ${y - 4}v-28`}
              stroke="#ffd7c5"
              strokeWidth="1.1"
            />
          )}
          {Array.from({ length: Math.floor(height / 21) }, (_, row) => (
            <g key={row} fill="#fff7f0" opacity=".65">
              <rect x={x + 8} y={y + 25 + row * 21} width="3" height="5" />
              <rect
                x={x + width - 12}
                y={y + 25 + row * 21}
                width="3"
                height="5"
              />
            </g>
          ))}
        </g>
      ))}
      <path
        d="M188 603v-30h17v-18h21v48M290 604V461l37-17v160M522 604V446h17v-35h17v193M734 604V490h24v-11h17v125"
        fill="#ffd5c3"
      />
      <path
        d="M394 604V471h12v-23h8v-39h3v39h8v17h8v139M811 604V467h9v-29h7v-28h3v28h6v29h7v137"
        fill="#ffcab5"
      />
    </g>
  );
}

function Scaffold({
  x,
  y,
  width,
  height,
  color = INK,
  levels = 4,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  levels?: number;
}) {
  const bay = height / levels;
  return (
    <g fill="none" stroke={color} strokeWidth="2" strokeLinejoin="miter">
      <path
        d={`M${x} ${y - 11}v${height + 11}M${x + width / 2} ${y - 8}v${height + 8}M${x + width} ${y - 11}v${height + 11}`}
      />
      {Array.from({ length: levels }, (_, i) => (
        <g key={i}>
          <path
            d={`M${x - 5} ${y + i * bay}h${width + 10}M${x} ${y + i * bay}l${width} ${bay}M${x + width} ${y + i * bay}l-${width} ${bay}`}
            strokeWidth="1.45"
          />
          <path
            d={`M${x - 5} ${y + i * bay + 3}h${width + 10}`}
            strokeWidth=".65"
          />
        </g>
      ))}
      <path d={`M${x - 4} ${y + height}h${width + 8}`} />
    </g>
  );
}

function Crane({ progress, animated }: AssemblyProps) {
  const left = 448;
  const right = 931;
  const top = 70;
  const deck = 165;
  const mast = 765;
  const loadY = useTransform(progress, [0, 0.78], [-78, 0]);
  const ropes = useTransform(
    loadY,
    (offset) =>
      `M562 187L570 ${281 + offset}h7L587 186M573 190V${290 + offset}`,
  );
  return (
    <g stroke={ORANGE} strokeLinejoin="round" strokeLinecap="round">
      <path
        d={`M${mast - 13} 592V${deck}L${mast} ${top}l13 95v427`}
        fill="none"
        strokeWidth="3"
      />
      <path
        d={`M${mast} ${top}L${left + 16} ${deck}M${mast} ${top}L${right - 23} ${deck - 9}M${mast} ${top}L${right - 78} ${deck - 5}`}
        fill="none"
        strokeWidth="2"
      />
      <path
        d={`M${mast - 12} ${deck - 1}l22-23-19-22 13-23-7-23`}
        fill="none"
        strokeWidth="2.1"
      />
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i} fill="none" strokeWidth="1.9">
          <path d={`M${mast - 12} ${deck + 25 + i * 25}h24l-24 25h24l-24-25`} />
        </g>
      ))}
      <path
        d={`M${left} ${deck + 14}l18-18 243-7 19 17 155-9V${deck - 19}l-35 1v14L${left} ${deck + 14}Z`}
        fill="none"
        strokeWidth="2.8"
      />
      <path
        d={`M${left + 15} ${deck + 12}l20-18 17 17 18-18 18 17 18-18 18 17 18-18 18 17 18-18 18 17 18-18 18 17 18-18 18 17 18-18 18 17`}
        fill="none"
        strokeWidth="1.65"
      />
      <path
        d={`M${mast + 13} ${deck + 3}l104-3M${mast + 13} ${deck - 4}l104-3`}
        fill="none"
        strokeWidth="1.5"
      />
      <path
        d={`M${mast - 28} ${deck + 6}h43v51h-38l-10-6v-23Z`}
        fill={ORANGE}
        strokeWidth="1"
      />
      <path
        d={`M${mast - 22} ${deck + 15}h9v23h-16l2-11Z`}
        fill="#fffaf6"
        stroke="none"
      />
      <rect
        x={right - 61}
        y={deck - 17}
        width="39"
        height="46"
        fill={ORANGE}
        strokeWidth="1"
      />
      <path
        d={`M${mast - 19} 568h39v20h17v15h-77v-15h21Z`}
        fill={ORANGE}
        stroke="none"
      />
      <g>
        <path d="M559 177h31v9h-31Z" fill={ORANGE} strokeWidth="1" />
        <motion.path
          d={animated ? ropes : "M562 187l8 94h7l10-95M573 190v100"}
          fill="none"
          strokeWidth="1.6"
        />
        <motion.g
          data-assembly-part="crane-load"
          style={{ y: animated ? loadY : 0 }}
        >
          <rect
            x="568"
            y="267"
            width="11"
            height="17"
            fill={ORANGE}
            stroke="none"
          />
          <path
            d="M574 284v7c8 4 3 12-2 11-6-1-5-6-3-8"
            fill="none"
            strokeWidth="2"
          />
          <g>
            <path
              d="M573 299l-33 38m33-38 35 38"
              fill="none"
              strokeWidth="1.7"
            />
            <path d="M526 336h95v11h-95Z" fill={INK} stroke="none" />
          </g>
        </motion.g>
      </g>
      <circle cx={mast} cy={top} r="3" fill={ORANGE} stroke="none" />
    </g>
  );
}

function UnfinishedBuilding({ progress, animated }: AssemblyProps) {
  const assembly = { progress, animated };
  return (
    <g>
      {[
        {
          name: "floor-base",
          y: 570,
          height: 33,
          window: 584,
          start: 0.1,
          end: 0.3,
        },
        {
          name: "floor-middle",
          y: 535,
          height: 35,
          window: 549,
          start: 0.26,
          end: 0.46,
        },
        {
          name: "floor-upper",
          y: 500,
          height: 35,
          window: 514,
          start: 0.42,
          end: 0.62,
        },
        {
          name: "floor-top",
          y: 463,
          height: 37,
          window: 479,
          start: 0.58,
          end: 0.78,
        },
      ].map((floor) => (
        <AssemblyPart
          {...assembly}
          key={floor.name}
          name={floor.name}
          start={floor.start}
          end={floor.end}
          distance={-52}
        >
          <g key="walls" fill={INK}>
            <rect x="478" y={floor.y} width="8" height={floor.height} />
            <rect x="479" y={floor.y} width="190" height={floor.height} />
            {floor.name === "floor-top" && <path d="M483 468h188v7H483Z" />}
            {floor.name === "floor-upper" && <path d="M482 506h188v6H482Z" />}
          </g>
          <AssemblyPart
            {...assembly}
            key="windows"
            name={`${floor.name}-windows`}
            start={floor.start + 0.08}
            end={floor.end}
            distance={8}
          >
            <g fill="#fff0e5">
              <rect x="505" y={floor.window} width="20" height="21" />
              <rect x="634" y={floor.window} width="20" height="21" />
            </g>
          </AssemblyPart>
        </AssemblyPart>
      ))}
      <AssemblyPart
        {...assembly}
        name="frame"
        start={0.72}
        end={0.92}
        distance={-62}
      >
        <g fill={INK}>
          <path d="M478 430h8v33h-8ZM491 389h9v74h-9ZM545 405h9v58h-9ZM598 430h8v33h-8ZM660 397h9v66h-9Z" />
          <path d="M480 426h190v7H480Z" />
        </g>
        <g stroke={INK} fill="none" strokeWidth="2">
          <path d="M477 414h24M495 389v-36M603 464v-70M641 464v-72M596 399h52M596 425h52M603 399l38 26-38 26 38 13" />
        </g>
      </AssemblyPart>
      <AssemblyPart
        {...assembly}
        name="ladder"
        start={0.8}
        end={0.96}
        distance={34}
      >
        <path
          d="M693 604V483h7v121M696 480v-5M691 499h10M691 513h10M691 527h10M691 541h10M691 555h10M691 569h10M691 583h10"
          stroke={INK}
          fill="none"
          strokeWidth="1.3"
        />
      </AssemblyPart>
    </g>
  );
}

function Excavator({ progress, animated }: AssemblyProps) {
  const armRotation = useTransform(progress, [0, 0.16, 0.34], [0, -4, 0]);
  return (
    <g transform="translate(0 20)">
      <path
        d="M41 579c-5 0-9 4-9 9s4 9 9 9h80c6 0 10-4 10-9s-4-9-10-9Z"
        fill={INK}
      />
      <path d="M42 583h76a5 5 0 0 1 0 10H42a5 5 0 0 1 0-10Z" fill="#5b5b54" />
      {[44, 59, 74, 89, 104, 118].map((x) => (
        <circle key={x} cx={x} cy="588" r="3.6" fill="#3b3d38" />
      ))}
      <path d="M41 574h85v7H41Z" fill="#202521" />
      <path d="M45 553h42v-14h13l8 29H44Z" fill={ORANGE} />
      <path d="M47 550h16v-7h18v7" fill={INK} />
      <path d="M81 552l5-31h19l8 41H85Z" fill={INK} />
      <path d="M88 525h14l5 26H84Z" fill="#dadcd1" />
      <path d="M94 552h16v15H92Z" fill="#333a35" />
      <path
        d="M45 556h26m-26 3h26m-26 3h26"
        stroke="#eb7149"
        strokeWidth="1.3"
      />
      <path d="M43 568h73v5H43Z" fill="#de401d" />
      <motion.g
        className={styles.excavatorArm}
        style={{ rotate: animated ? armRotation : 0 }}
      >
        <path
          d="M93 548l20-61 68-36c7-4 14 0 16 8l22 88-10 4-30-82-53 31-20 50Z"
          fill={ORANGE}
        />
        <path
          d="M102 541l19-48 61-29 25 73"
          fill="none"
          stroke="#ff9774"
          strokeWidth="2"
        />
        <path
          d="M107 535l9-40M124 486l43-20M195 480l13 48"
          fill="none"
          stroke="#fef5e8"
          strokeWidth="3"
        />
        <path
          d="M115 498l9-24 48-18M194 473l14 54"
          fill="none"
          stroke={ORANGE}
          strokeWidth="4"
        />
        <path
          d="M212 535l9 26M215 541l-4 22"
          fill="none"
          stroke={INK}
          strokeWidth="3"
        />
        <path
          d="M208 560c-1 7-12 19-20 24h25c12-3 14-9 12-17l-5-12Z"
          fill={INK}
        />
        <path d="M191 585h26l-4 3h-30Z" fill="#242622" />
        <circle
          cx="184"
          cy="463"
          r="4"
          fill="#ffa17b"
          stroke="#e74720"
          strokeWidth="1"
        />
        <circle cx="122" cy="491" r="3" fill="#ffa17b" />
      </motion.g>
    </g>
  );
}

export default function ConstructionScene({
  className = "",
  progress,
  animated = false,
}: SceneProps) {
  const complete = useMotionValue(1);
  const assembly = {
    progress: progress ?? complete,
    animated: animated && !!progress,
  };

  return (
    <svg
      className={`${styles.scene} ${className}`}
      viewBox="0 0 1020 625"
      preserveAspectRatio={animated ? "none" : "xMidYMax meet"}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#9b9b8e" strokeWidth=".6" opacity=".22">
        <path d="M397 125v409M479 98v358M601 38v79M662 40v460M848 40v335M946 0v543M316 267h704M376 188h644M425 353h595M535 70h133M879 19h141" />
        <path
          d="M883 309h93M930 262v95M797 47h96M842 5v93M305 410h105M355 365v101"
          opacity=".45"
        />
      </g>
      <City />
      <AssemblyPart
        {...assembly}
        name="site"
        start={0.02}
        end={0.34}
        distance={88}
      >
        <path
          d="M272 604V494h14v-15h17v9h12v116M318 604V438h11v-13h10v-10h10v10h10v24h7v155M383 604V565h15v-17h12v56"
          fill={ORANGE}
        />
        <path
          d="M338 414v-28M322 469v-25M358 447v-10M289 480v-28"
          stroke={ORANGE}
          strokeWidth="1.1"
        />
        <g stroke="#fff3e8" strokeWidth="2" opacity=".75">
          <path d="M329 458v5m0 15v5m0 15v5m0 15v5m0 15v5M347 458v5m0 15v5m0 15v5m0 15v5m0 15v5" />
        </g>
        <Scaffold
          x={241}
          y={558}
          width={43}
          height={47}
          color={ORANGE}
          levels={2}
        />
        <Scaffold
          x={285}
          y={579}
          width={42}
          height={25}
          color={ORANGE}
          levels={2}
        />
      </AssemblyPart>
      <AssemblyPart
        {...assembly}
        name="scaffold-left"
        start={0.35}
        end={0.68}
        distance={78}
      >
        <Scaffold x={389} y={503} width={58} height={101} levels={5} />
        <Scaffold x={420} y={550} width={61} height={54} levels={3} />
      </AssemblyPart>
      <Crane {...assembly} />
      <AssemblyPart
        {...assembly}
        name="foundation"
        start={0}
        end={0.18}
        distance={22}
      >
        <path d="M298 604h32v-8h38v-17h53v25M866 604h64v-9h45v9" fill={INK} />
        <rect x="479" y="596" width="190" height="8" fill={INK} />
      </AssemblyPart>
      <UnfinishedBuilding {...assembly} />
      <AssemblyPart
        {...assembly}
        name="scaffold"
        start={0.8}
        end={0.98}
        distance={66}
      >
        <Scaffold x={707} y={516} width={82} height={89} levels={4} />
        <Scaffold x={784} y={512} width={45} height={92} levels={4} />
        <Scaffold x={836} y={555} width={39} height={50} levels={2} />
      </AssemblyPart>
      <Excavator {...assembly} />
      <path
        d="M0 612l23-8 29 1 21 7 28-3 25 6 33-11 20 8 24-11 29 6 30 7h759v11H0Z"
        fill="#ead6c9"
      />
      <path
        d="M0 622l56-9 34 3 34-8 22 6 39-5 41 8 37-7 757-2v17H0Z"
        fill="#d9c8bb"
      />
      <path
        d="M23 610h201l15-6h35v-3h94v-8h45v11h258v-4h114v5h143v-3h47v7h45v10H21Z"
        fill={INK}
      />
      <path d="M0 618h1020v7H0Z" fill="#333530" />
      <g fill="#c9b3a3">
        <path d="M12 610l10-6 17 6ZM150 611l12-7 18 7ZM202 609l8-8 16 8Z" />
      </g>
    </svg>
  );
}

export function ArchitectureBackdrop({ className = "" }: SceneProps) {
  return (
    <svg
      className={`${styles.backdrop} ${className}`}
      viewBox="0 0 950 420"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="architecture-fade"
          x1="140"
          y1="420"
          x2="810"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#161916" />
          <stop offset="1" stopColor="#535550" />
        </linearGradient>
      </defs>
      <path
        d="M201 420 430 178 676 83 850 420Z"
        fill="url(#architecture-fade)"
      />
      <g stroke="#96998f" strokeWidth="1" opacity=".26">
        <path d="M80 150H950M180 250H950M280 350H950M425 0v420M575 0v420M725 0v420M875 0v420M180 0l420 420M360 0l420 420M550 0l400 400" />
      </g>
      <g stroke="#101310" strokeWidth="7" strokeLinejoin="miter">
        <path d="M308 420V295l280-127 157 93v159M357 420V219M438 420V183M525 420V143M617 420V191M695 420V237M288 343l300-130 181 99M288 407l300-134 181 89M340 289l248-111 165 99" />
        <path
          d="M363 303v117M443 268v152M527 231v189M621 246v174M701 291v129"
          strokeWidth="4"
        />
      </g>
      <g stroke="#84877e" strokeWidth="1" opacity=".35">
        <path d="M310 311l278-129 162 96M310 354l278-129 162 96M310 417l278-129 162 96M362 225v195M443 190v230M530 151v269M624 198v222M699 241v179" />
        <path d="m365 300 76 50-76 34m78-119 84 49-84 36m84-119 60 45-60 38m63-97 32 86-32 34m34-40 73 94-73-37m75-34 51 94" />
      </g>
      <g stroke="#0b0e0b" strokeWidth="3" strokeLinejoin="round">
        <path d="M692 420V79h26v341M692 87l26 27-26 28 26 27-26 27 26 27-26 27 26 27-26 27 26 27-26 27 26 27-26 27M691 99l13-93 14 93M465 161l340-169h44L479 180ZM704 6 479 156M706 8 807 21" />
        <path
          d="m491 148 24 10 3-24 23 10 3-23 23 10 3-24 23 10 3-23 23 10 3-24 23 10 3-23 23 10 3-24 23 10 3-23 23 10 3-24"
          strokeWidth="2"
        />
        <path d="M554 145v116m8-120v120m-4 0-18 24h37Z" strokeWidth="1.5" />
        <path d="M681 90h43v32h-43ZM772 13h31v35h-31Z" fill="#0b0e0b" />
      </g>
      <g stroke="#111510" strokeWidth="2">
        <path d="M759 420V246M796 420V257M836 420V277M875 420V294M748 277l148 43M748 315l148 43M748 353l148 43M760 278l36 48-36 29 36 48M798 290l38 47-38 29 38 48M837 302l38 48-38 28" />
      </g>
    </svg>
  );
}
