import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  core: { disableTelemetry: true },
  viteFinal: async (viteConfig) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(viteConfig, {
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
