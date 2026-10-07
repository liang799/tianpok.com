type BlockProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  color?: string;
  side?: string;
  top?: string;
};

function Block({
  x,
  y,
  width,
  height,
  depth = -38,
  color = "#fff0dc",
  side = "#ec622b",
  top = "#fff7eb",
}: BlockProps) {
  const rise = Math.abs(depth) * 0.46;
  const edge = depth < 0 ? x : x + width;
  return (
    <g>
      <path
        d={`M${x} ${y}l${depth} ${-rise}h${width}l${-depth} ${rise}Z`}
        fill={top}
      />
      <path
        d={`M${edge} ${y}l${depth} ${-rise}v${height}l${-depth} ${rise}Z`}
        fill={side}
      />
      <rect x={x} y={y} width={width} height={height} fill={color} />
    </g>
  );
}

function Crane({ small = false }: { small?: boolean }) {
  return (
    <g>
      <g fill="none" stroke="#e9662d" strokeLinejoin="round">
        <path d="M0 0v-485h22V0M0-485l11-70 11 70" strokeWidth="4" />
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d={`M0 ${-477 + i * 34}h22L0 ${-443 + i * 34}h22Z`}
            strokeWidth="2.3"
          />
        ))}
        <path
          d="M-338-485h480v20h-480Zm0 0 12-14h456l12 14M11-555l-293 56m293-56 120 56"
          strokeWidth="3.5"
        />
        {Array.from({ length: 17 }, (_, i) => (
          <path
            key={i}
            d={`M${-335 + i * 28} -484l14 19 14-19`}
            strokeWidth="2"
          />
        ))}
      </g>
      <Block
        x={115}
        y={-481}
        width={39}
        height={33}
        depth={10}
        color="#ef702f"
        side="#cb5023"
        top="#ffac73"
      />
      <Block
        x={-14}
        y={-454}
        width={34}
        height={36}
        depth={11}
        color="#f18748"
        side="#d95828"
        top="#ffad6e"
      />
      <path d="M-9-448h23v19H-9Z" fill="#555d52" />
      <g transform={small ? undefined : "translate(38 0)"}>
        <path
          d="M-178-465v83m9-83v83"
          fill="none"
          stroke="#535a51"
          strokeWidth="2"
        />
        <rect x={-183} y={-386} width={20} height={14} rx="3" fill="#e96b2f" />
        <path
          d="M-173-372v7c0 6 8 6 8 0"
          fill="none"
          stroke="#424a41"
          strokeWidth="3"
        />
        {!small && (
          <>
            <path
              d="m-169-361-24 23m24-23 29 23"
              fill="none"
              stroke="#57594b"
              strokeWidth="2"
            />
            <Block
              x={-188}
              y={-334}
              width={47}
              height={42}
              depth={-18}
              color="#ffb084"
              side="#e76028"
              top="#ffcdac"
            />
          </>
        )}
      </g>
    </g>
  );
}

function Worker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="m-4 14-3 25m8-25 4 25M-6-1l-5 18m14-18 8 10 5-7"
        fill="none"
        stroke="#353e36"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M-6-3h10l2 18H-8Z" fill="#3b443b" />
      <circle cy="-10" r="4.5" fill="#b98b68" />
      <path d="M-6-12c0-8 12-8 12 0Z" fill="#f17b37" />
    </g>
  );
}

/** Vector architecture keeps the completed reference composition visible without WebGL. */
export function ConstructionFallback() {
  return (
    <svg
      data-testid="construction-fallback"
      viewBox="0 0 900 720"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g opacity="0.64">
        {[
          [45, 492, 35, 169],
          [106, 411, 32, 249],
          [162, 464, 39, 196],
          [227, 357, 35, 303],
          [288, 445, 44, 215],
          [347, 322, 47, 338],
          [428, 407, 35, 253],
          [495, 457, 32, 203],
          [787, 371, 40, 289],
          [852, 319, 35, 341],
        ].map(([x, y, width, height], index) => (
          <g key={x}>
            <Block
              x={x}
              y={y}
              width={width}
              height={height}
              depth={-17}
              color={index % 3 === 0 ? "#e7d9cd" : "#f5d9c0"}
              side="#ead0b8"
              top="#f6e6d9"
            />
            {index % 3 === 0 && (
              <path
                d={`M${x + width / 2} ${y}v-18`}
                stroke="#ddcdbd"
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </g>
      <path
        d="M74 396c7-11 14-10 21-10 6-20 28-20 37 0 9-1 14 2 21 10ZM778 269c9-11 18-12 27-11 10-31 48-30 59 0 14-1 22 3 31 11Z"
        fill="#f8e4d3"
        opacity="0.8"
      />

      <g transform="translate(224 665) scale(.49)">
        <Crane small />
      </g>
      <g transform="translate(719 637)">
        <Crane />
      </g>
      <Block
        x={50}
        y={612}
        width={82}
        height={46}
        depth={23}
        color="#484a40"
        side="#32392f"
        top="#65675b"
      />
      <Block
        x={112}
        y={574}
        width={72}
        height={84}
        depth={25}
        color="#393e36"
        side="#292f2a"
        top="#5e6558"
      />
      <Block
        x={254}
        y={578}
        width={76}
        height={80}
        depth={-32}
        color="#eb733a"
        side="#41433a"
        top="#f19150"
      />
      <Block
        x={784}
        y={479}
        width={105}
        height={179}
        depth={-39}
        color="#30352f"
        side="#484d41"
        top="#5b6053"
      />
      <Block
        x={758}
        y={438}
        width={63}
        height={58}
        depth={-28}
        color="#575b4e"
        side="#6b6b5b"
        top="#868273"
      />

      <Block
        x={365}
        y={548}
        width={194}
        height={110}
        depth={-48}
        color="#30372f"
        side="#40463b"
        top="#525b4c"
      />
      <Block
        x={560}
        y={594}
        width={127}
        height={64}
        depth={-32}
        color="#353b31"
        side="#454a3d"
        top="#5b6450"
      />

      <Block x={403} y={374} width={66} height={174} depth={-51} />
      <Block x={535} y={376} width={61} height={218} depth={-46} />
      <Block x={596} y={376} width={88} height={43} depth={-46} />
      <Block x={653} y={419} width={31} height={65} depth={-46} />
      <Block x={596} y={464} width={88} height={42} depth={-46} />
      <Block x={324} y={331} width={208} height={43} depth={-51} />
      <path
        d="M405 433h64m-64 62h64m66-24h61m-61 66h61M430 332v42m103 2v130"
        fill="none"
        stroke="#d5c5b0"
        strokeOpacity=".42"
        strokeWidth="1"
      />
      <path
        d="M352 415h51m-51 63h51m86-61h46m-46 62h46"
        fill="none"
        stroke="#ba5129"
        strokeOpacity=".45"
        strokeWidth="1"
      />

      <g fill="none" stroke="#4a5145" strokeWidth="3">
        <path d="M319 658V526m44 132V513m70 145V518m118 140V540m57 118V580m76 78V376m29 282V370M319 526l44 132m0-145-44 145m44-94 70 94m0-140-70 140m188-118 57 118m0-78-57 78M684 376l29 94-29 86 29 102m0-288-29 99 29 91-29 98" />
        <path
          d="m311 538 53-18 195 37m-245 39 51-18 193 36m-2-9 134 25M676 391l43-15m-43 95 43-15m-43 100 43-15"
          strokeWidth="5"
        />
        <path
          d="M363 546v-42m69 56v-42m63 53v-41m57 52v-42m-194-13 198 37M684 376v-23m29 17v-23m-34 10 40-6"
          strokeWidth="2"
        />
      </g>

      <Worker x={391} y={495} />
      <Worker x={548} y={518} />
      <Worker x={634} y={327} />
      <Worker x={754} y={616} />
      <Block
        x={294}
        y={633}
        width={37}
        height={25}
        depth={-14}
        color="#b7b8a5"
        side="#909a85"
        top="#d2d2bd"
      />
      <Block
        x={699}
        y={632}
        width={38}
        height={26}
        depth={-16}
        color="#eb7135"
        side="#b84f28"
        top="#fda264"
      />
      <path d="M0 659 900 650v27H0Z" fill="#30352f" />
      <path
        d="m0 659 900-9m-208 3v24m64-24v24m64-25v25m60-26v26"
        fill="none"
        stroke="#cb6e3e"
        strokeWidth="1"
        opacity=".8"
      />
    </svg>
  );
}
