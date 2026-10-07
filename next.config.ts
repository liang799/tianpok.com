import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  headers: () => [
    {
      source: "/storybook/:path*",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    },
  ],
};

export default nextConfig;
