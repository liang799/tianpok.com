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
  depth = 24,
  color = "#f0632e",
  side = "#c84622",
  top = "#ff9259",
}: BlockProps) {
  const rise = depth * 0.46;
  return (
    <g>
      <path
        d={`M${x} ${y}l${depth} ${-rise}h${width}l${-depth} ${rise}Z`}
        fill={top}
      />
      <path
        d={`M${x + width} ${y}l${depth} ${-rise}v${height}l${-depth} ${rise}Z`}
        fill={side}
      />
      <rect x={x} y={y} width={width} height={height} fill={color} />
    </g>
  );
}

/** Inline vector architecture remains available before WebGL is ready. */
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
      <g opacity="0.58">
        {[
          [116, 393, 39, 183],
          [177, 354, 31, 228],
          [229, 414, 42, 182],
          [290, 321, 37, 279],
          [357, 383, 45, 230],
          [431, 281, 45, 335],
          [503, 361, 40, 240],
          [557, 397, 31, 207],
          [759, 329, 45, 266],
          [819, 407, 26, 177],
        ].map(([x, y, width, height], index) => (
          <g key={x}>
            <Block
              x={x}
              y={y}
              width={width}
              height={height}
              depth={16}
              color={index % 3 === 0 ? "#eadbd0" : "#f2dfcd"}
              side="#e6d6c8"
              top="#f6e8dc"
            />
            {index % 3 === 0 && (
              <path
                d={`M${x + width / 2} ${y}v-21`}
                stroke="#decfc2"
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </g>

      <path
        d="M118 593 441 499 846 581 520 686Z"
        fill="#e9e3d9"
        opacity="0.6"
      />
      <path d="M203 587 504 503 807 570 507 662Z" fill="#eeebe4" />
      <path d="M203 587 507 654 807 562v15l-300 93-304-69Z" fill="#d8d6cc" />
      <path d="M203 587 504 495 807 562 507 654Z" fill="#f5f0e7" />
      <path
        d="m251 574 303 67m-240-85 302 67m-232-88 296 67m-218-90 281 65M303 609l299-94m-231 109 301-94m-230 110 300-94"
        fill="none"
        stroke="#ddd9d0"
        strokeWidth="1"
      />

      <Block
        x={344}
        y={541}
        width={244}
        height={31}
        depth={63}
        color="#3e4541"
        side="#2a302d"
        top="#626b63"
      />
      <Block
        x={384}
        y={389}
        width={49}
        height={153}
        depth={40}
        color="#343c37"
        side="#272f2b"
        top="#647065"
      />
      <Block
        x={470}
        y={397}
        width={49}
        height={145}
        depth={40}
        color="#e0d8c8"
        side="#b9b7aa"
        top="#f1e9da"
      />
      <Block x={519} y={398} width={63} height={26} depth={40} />
      <Block
        x={554}
        y={424}
        width={28}
        height={54}
        depth={40}
        color="#e0d8c8"
        side="#b9b7aa"
        top="#f1e9da"
      />
      <Block
        x={519}
        y={455}
        width={63}
        height={27}
        depth={40}
        color="#e0d8c8"
        side="#b9b7aa"
        top="#f1e9da"
      />
      <rect x={470} y={503} width={49} height={39} fill="#ed5728" />
      <Block x={331} y={353} width={143} height={39} depth={40} />
      <path
        d="M394 407v123m17-123v123m69-135v135m19-135v135M339 363h126"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.12"
        strokeWidth="2"
      />

      <g fill="none" stroke="#666e66" strokeWidth="2.2">
        <path d="M291 570V417m-25 161V431m42 133V411m-56 31 70-23m-70 80 70-23m-70 80 70-23M266 431l25 86-25 61m25-161-25 81 25 72" />
        <path d="m257 448 70-23m-70 82 70-23m-70 83 70-23" strokeWidth="5" />
      </g>

      <Block
        x={646}
        y={579}
        width={67}
        height={24}
        depth={28}
        color="#a9aaa0"
        side="#83897d"
        top="#d6d5c9"
      />
      <g fill="none" stroke="#e9632d" strokeLinejoin="round">
        <path
          d="M663 584V160h25v424M663 160l25-64 9 64m-22-33v-32"
          strokeWidth="5"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M663 ${168 + i * 34}h25l-25 34h25Z`}
            strokeWidth="2.5"
          />
        ))}
        <path
          d="M247 158h535v22H247Zm0 0 23-22h499l13 22M270 136l-23 44m450-84-375 40m375-40 81 40"
          strokeWidth="4"
        />
        {Array.from({ length: 18 }, (_, i) => (
          <path
            key={i}
            d={`M${250 + i * 29} 159l14 21 15-21`}
            strokeWidth="2.2"
          />
        ))}
      </g>
      <Block
        x={741}
        y={158}
        width={52}
        height={41}
        depth={11}
        color="#e7602e"
        side="#c84a23"
        top="#fc8c50"
      />
      <Block
        x={641}
        y={189}
        width={35}
        height={38}
        depth={13}
        color="#f48647"
        side="#d45229"
        top="#ffae68"
      />
      <path d="M648 196h21v17h-21Z" fill="#454d46" />
      <path d="M335 180v128m9-128v128" stroke="#4a514a" strokeWidth="2" />
      <rect x="330" y="304" width="19" height="15" rx="3" fill="#e5672c" />
      <path
        d="M339 319v7c0 8 10 9 10 1"
        fill="none"
        stroke="#3d443e"
        strokeWidth="3"
      />

      <Block x={207} y={549} width={32} height={28} depth={18} />
      <Block
        x={228}
        y={582}
        width={37}
        height={22}
        depth={22}
        color="#b9b8ab"
        side="#969b8f"
        top="#d9d7cc"
      />
      <Block x={732} y={576} width={32} height={29} depth={19} />
      <g transform="translate(616 546)">
        <path
          d="m-5 15-4 28m10-28 4 28m-10-41-4 18m10-18 10 12"
          fill="none"
          stroke="#303a33"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M-7-2h11l3 19H-9Z" fill="#ed7634" />
        <circle cy="-10" r="5" fill="#b78e6e" />
        <path d="M-7-12c0-10 13-10 13 0Z" fill="#ef7430" />
      </g>
    </svg>
  );
}
