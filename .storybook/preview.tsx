import type { Preview } from "@storybook/nextjs-vite";
import { anton, inter } from "../src/app/fonts";
import "../src/app/globals.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
    a11y: { test: "error" },
    viewport: {
      options: {
        mobile: {
          name: "Mobile",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "1000px" },
          type: "desktop",
        },
      },
    },
    controls: { expanded: true },
  },
  decorators: [
    (Story) => (
      <div
        className={`${inter.variable} ${anton.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), Arial, sans-serif" }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
