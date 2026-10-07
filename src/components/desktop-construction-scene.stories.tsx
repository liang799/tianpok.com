import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMotionValue } from "motion/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import DesktopConstructionScene from "./desktop-construction-scene";

const parts = [
  "foundation",
  "scaffold",
  "letter-stem",
  "letter-cap",
  "workers",
];

function AssemblyPreview({ animated = true }: { animated?: boolean }) {
  const progress = useMotionValue(0);
  return (
    <>
      <label htmlFor="desktop-assembly-progress">Construction progress</label>
      <input
        id="desktop-assembly-progress"
        className="mb-6 block w-full accent-orange"
        type="range"
        min="0"
        max="100"
        defaultValue="0"
        onChange={(event) => progress.set(Number(event.target.value) / 100)}
      />
      <DesktopConstructionScene progress={progress} animated={animated} />
    </>
  );
}

const meta = {
  title: "Illustrations/Desktop Construction Scene",
  component: DesktopConstructionScene,
  argTypes: { progress: { control: false }, animated: { control: false } },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-5 text-2xl">Cinematic construction</h1>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof DesktopConstructionScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScrollAssembly: Story = {
  render: () => <AssemblyPreview />,
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole("slider", {
      name: "Construction progress",
    });
    const part = (name: string) => {
      const element = canvasElement.querySelector<SVGGElement>(
        `[data-assembly-part="${name}"]`,
      );
      if (!element) throw new Error(`Missing ${name} construction layer`);
      return element;
    };
    for (const name of parts)
      await expect(part(name)).toHaveStyle({ opacity: "0" });

    fireEvent.change(slider, { target: { value: "45" } });
    await waitFor(async () => {
      await expect(part("foundation")).toHaveStyle({
        opacity: "1",
        transform: "none",
      });
      await expect(part("scaffold")).toHaveStyle({
        opacity: "1",
        transform: "none",
      });
      await expect(
        Number(getComputedStyle(part("letter-stem")).opacity),
      ).toBeGreaterThan(0);
      await expect(part("letter-cap")).toHaveStyle({ opacity: "0" });
      await expect(part("workers")).toHaveStyle({ opacity: "0" });
      const cable = canvasElement.querySelector(
        '[data-motion-step="crane-cable"]',
      );
      const endY = Number(cable?.getAttribute("d")?.split("V")[1]);
      const loadY = new DOMMatrix(
        getComputedStyle(part("crane-load")).transform,
      ).m42;
      await expect(Math.abs(endY - (249 + loadY))).toBeLessThan(0.1);
    });

    fireEvent.change(slider, { target: { value: "100" } });
    await waitFor(async () => {
      for (const name of parts)
        await expect(part(name)).toHaveStyle({
          opacity: "1",
          transform: "none",
        });
      await expect(
        canvasElement.querySelector('[data-motion-step="final-artwork"]'),
      ).toHaveStyle({ opacity: "1" });
      await expect(part("crane-load")).toHaveStyle({ transform: "none" });
    });

    fireEvent.change(slider, { target: { value: "0" } });
    await waitFor(async () => {
      for (const name of parts)
        await expect(part(name)).toHaveStyle({ opacity: "0" });
      await expect(
        canvasElement.querySelector('[data-motion-step="final-artwork"]'),
      ).toHaveStyle({ opacity: "0" });
    });
  },
};

export const StaticFallback: Story = {
  render: () => <AssemblyPreview animated={false} />,
  play: async ({ canvasElement }) => {
    const final = canvasElement.querySelector(
      '[data-motion-step="final-artwork"]',
    );
    await expect(final).toHaveStyle({ opacity: "1" });
    const image = final?.querySelector("image");
    await expect(image).toHaveAttribute(
      "href",
      "/images/desktop-construction.webp",
    );
    for (const name of parts)
      await expect(
        canvasElement.querySelector(`[data-assembly-part="${name}"]`),
      ).toHaveStyle({ opacity: "1", transform: "none" });
  },
};
