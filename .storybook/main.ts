import type { StorybookConfig } from "@storybook/nextjs-vite";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Publish each public asset explicitly so an already staged Storybook can
// never be copied recursively into the next static build.
const publicAssets = readdirSync(new URL("../public/", import.meta.url))
  .filter((name) => name !== "storybook")
  .map((name) => ({ from: `../public/${name}`, to: `/${name}` }));
const noindex = '<meta name="robots" content="noindex, nofollow" />';

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: publicAssets,
  managerHead: (head) => `${head}${noindex}`,
  previewHead: (head) => `${head}${noindex}`,
  core: { disableTelemetry: true },
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(viteConfig, {
      // Vitest's staticDirs middleware only serves directories, so Vite serves
      // root SVG files during tests. The explicit list above owns build copies.
      publicDir: fileURLToPath(new URL("../public/", import.meta.url)),
      build: { copyPublicDir: false },
      optimizeDeps: {
        exclude: ["next/dist/client/components/redirect-boundary.js"],
      },
      resolve: {
        alias: [
          {
            find: "next/dist/client/components/redirect-boundary.js",
            replacement: fileURLToPath(
              new URL("./redirect-boundary.tsx", import.meta.url),
            ),
          },
        ],
      },
    });
  },
};

export default config;
