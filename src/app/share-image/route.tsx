import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  const [logo, wordmark] = await Promise.all(
    ["logo.svg", "wordmark.svg"].map(async (file) => {
      const svg = await readFile(join(process.cwd(), "public", file));
      return `data:image/svg+xml;base64,${svg.toString("base64")}`;
    }),
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "58px 70px",
        background: "#faf9f6",
        color: "#242523",
        borderBottom: "12px solid #ff5128",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {/* ImageResponse embeds SVG bytes directly in the generated PNG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={72} height={70} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wordmark} width={300} height={27} alt="Tian Pok" />
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 58,
          fontSize: 18,
          letterSpacing: "0.2em",
          color: "#d73f19",
        }}
      >
        {"// BUILDER OF DIGITAL THINGS"}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 14,
          fontSize: 78,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.05em",
        }}
      >
        <span>IDEAS UNDER</span>
        <span style={{ color: "#ff5128" }}>CONSTRUCTION.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          fontSize: 22,
          color: "#60615f",
        }}
      >
        <span>Software. Design. Always building.</span>
        <span>tianpok.com ↗</span>
      </div>
      <svg
        width="185"
        height="180"
        viewBox="0 0 185 180"
        style={{ position: "absolute", top: 46, right: 64 }}
      >
        <g fill="none" stroke="#ff5128" strokeWidth="3">
          <path d="M127 172V15l-18 157m0-117h91M25 55h134L127 15ZM25 67h134M127 15l32 40M109 87h18m-18 26h18m-18 26h18m-18 26h18M109 87l18 26-18 26 18 26M109 165l18-26-18-26 18-26M57 67v57m12-57v57l-6 10-6-10" />
          <path d="m25 55 14 12 14-12 14 12 14-12 14 12 14-12 14 12 14-12 14 12" />
          <path d="m63 134-19 23m19-23 19 23" />
        </g>
        <path fill="#242523" d="M37 157h52v8H37Z" />
        <path fill="#ff5128" d="M153 51h25v24h-25ZM105 172h27v8h-27Z" />
      </svg>
    </div>,
    { width: 1200, height: 630 },
  );
}
