import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMotionValue } from "motion/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import DesktopConstructionScene from "./desktop-construction-scene";

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
        disabled={!animated}
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
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider", {
      name: "Construction progress",
    });
    const scene = canvas.getByTestId("desktop-construction-scene");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-renderer", "webgl");
        await expect(scene.querySelector("canvas")).toBeVisible();
        await expect(scene).toHaveAttribute("data-phase", "approach");
      },
      { timeout: 20_000 },
    );
    await expect(scene.querySelector("img, image")).toBeNull();

    // The slider drives the same MotionValue as desktop scrolling. These
    // diagnostics are published only after the 3D frame has been applied.
    for (const [progress, phase, attached, placed] of [
      [16, "lower", false, false],
      [28, "attach", true, false],
      [42, "lift", true, false],
      [59, "slew", true, false],
      [74, "seat", true, false],
      [87, "release", false, true],
      [94, "return", false, true],
      [100, "completed", false, true],
      [0, "approach", false, false],
    ] as const) {
      fireEvent.change(slider, { target: { value: String(progress) } });
      await waitFor(async () => {
        await expect(scene).toHaveAttribute("data-phase", phase);
        await expect(scene).toHaveAttribute("data-attached", String(attached));
        await expect(scene).toHaveAttribute("data-placed", String(placed));
        await expect(Number(scene.getAttribute("data-progress"))).toBeCloseTo(
          progress / 100,
          2,
        );
      });
    }
  },
};

// Keep the published story identifier while showing the completed scene used
// for reduced motion. Its inline SVG fallback remains available without WebGL.
export const StaticFallback: Story = {
  render: () => <AssemblyPreview animated={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const scene = canvas.getByTestId("desktop-construction-scene");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-renderer", "webgl");
        await expect(scene.querySelector("canvas")).toBeVisible();
        await expect(scene).toHaveAttribute("data-phase", "completed");
        await expect(scene).toHaveAttribute("data-placed", "true");
        await expect(scene).toHaveAttribute("data-attached", "false");
        await expect(Number(scene.getAttribute("data-progress"))).toBe(1);
      },
      { timeout: 20_000 },
    );
    await expect(
      canvas.getByRole("slider", { name: "Construction progress" }),
    ).toBeDisabled();
    await expect(scene.querySelector("img, image")).toBeNull();
  },
};
