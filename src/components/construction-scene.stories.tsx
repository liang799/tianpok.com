import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMotionValue } from "motion/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import ConstructionScene from "./construction-scene";

const partNames = [
  "floor-base",
  "floor-middle",
  "floor-upper",
  "floor-top",
  "frame",
  "scaffold",
];

function AssemblyPreview() {
  const progress = useMotionValue(0);

  return (
    <>
      <label className="mb-3 block font-medium" htmlFor="assembly-progress">
        Building assembly progress
      </label>
      <input
        className="w-full accent-orange"
        id="assembly-progress"
        type="range"
        min="0"
        max="100"
        defaultValue="0"
        onChange={(event) => progress.set(Number(event.target.value) / 100)}
      />
      <ConstructionScene animated progress={progress} />
    </>
  );
}

function StaticPreview() {
  const progress = useMotionValue(0);
  return <ConstructionScene progress={progress} animated={false} />;
}

function getParts(canvasElement: HTMLElement) {
  return partNames.map((name) => {
    const part = canvasElement.querySelector<SVGGElement>(
      `[data-assembly-part="${name}"]`,
    );
    if (!part) throw new Error(`Missing building part: ${name}`);
    return part;
  });
}

const meta = {
  title: "Illustrations/Construction Scene",
  component: ConstructionScene,
  argTypes: {
    progress: { control: false },
    animated: { control: false },
  },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Construction scene</h1>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ConstructionScene>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScrubAssembly: Story = {
  render: () => <AssemblyPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", {
      name: "Building assembly progress",
    });
    const parts = getParts(canvasElement);

    for (const part of parts) {
      await expect(part).toHaveStyle({ opacity: "0" });
    }

    fireEvent.change(slider, { target: { value: "50" } });
    await waitFor(async () => {
      await expect(parts[0]).toHaveStyle({ opacity: "1", transform: "none" });
      await expect(parts[1]).toHaveStyle({ opacity: "1", transform: "none" });
      await expect(parts[3]).toHaveStyle({ opacity: "0" });
      await expect(parts[4]).toHaveStyle({ opacity: "0" });
    });

    fireEvent.change(slider, { target: { value: "100" } });
    await waitFor(async () => {
      for (const part of parts) {
        await expect(part).toHaveStyle({ opacity: "1", transform: "none" });
      }
    });

    fireEvent.change(slider, { target: { value: "0" } });
    await waitFor(async () => {
      for (const part of parts) {
        await expect(part).toHaveStyle({ opacity: "0" });
      }
    });
  },
};

export const StaticFallback: Story = {
  render: () => <StaticPreview />,
  play: async ({ canvasElement }) => {
    for (const part of getParts(canvasElement)) {
      await expect(part).toHaveStyle({ opacity: "1", transform: "none" });
    }
  },
};
