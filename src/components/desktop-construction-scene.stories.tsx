import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMotionValue } from "motion/react";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import DesktopConstructionScene from "./desktop-construction-scene";
import { CONSTRUCTION_PIECES } from "@/lib/construction-plan";

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
        step="0.01"
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
        await expect(scene).toHaveAttribute(
          "data-piece-count",
          String(CONSTRUCTION_PIECES.length),
        );
        await expect(scene).toHaveAttribute("data-placed-count", "0");
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
    ] as const) {
      fireEvent.change(slider, {
        target: { value: String(progress / CONSTRUCTION_PIECES.length) },
      });
      await waitFor(async () => {
        await expect(scene).toHaveAttribute("data-phase", phase);
        await expect(scene).toHaveAttribute("data-attached", String(attached));
        await expect(scene).toHaveAttribute("data-placed", String(placed));
        await expect(Number(scene.getAttribute("data-progress"))).toBeCloseTo(
          progress / (100 * CONSTRUCTION_PIECES.length),
          2,
        );
        await expect(scene).toHaveAttribute(
          "data-active-piece",
          CONSTRUCTION_PIECES[0].id,
        );
      });
    }

    // Every structural part exists from the start. Each completed cycle adds
    // one placed part; it never replaces the scene with a finished model.
    for (const [index, piece] of CONSTRUCTION_PIECES.entries()) {
      const value = ((index + 0.94) / CONSTRUCTION_PIECES.length) * 100;
      fireEvent.change(slider, { target: { value: value.toFixed(2) } });
      await waitFor(async () => {
        await expect(scene).toHaveAttribute("data-active-piece", piece.id);
        await expect(scene).toHaveAttribute("data-lift-index", String(index));
        await expect(scene).toHaveAttribute("data-phase", "return");
        await expect(scene).toHaveAttribute(
          "data-placed-count",
          String(index + 1),
        );
        await expect(scene).toHaveAttribute("data-attached", "false");
      });
    }
    fireEvent.change(slider, { target: { value: "100" } });
    await waitFor(async () => {
      await expect(scene).toHaveAttribute("data-phase", "completed");
      await expect(scene).toHaveAttribute(
        "data-placed-count",
        String(CONSTRUCTION_PIECES.length),
      );
    });
    fireEvent.change(slider, {
      target: {
        value: String(((3 + 0.59) / CONSTRUCTION_PIECES.length) * 100),
      },
    });
    await waitFor(async () => {
      await expect(scene).toHaveAttribute(
        "data-active-piece",
        CONSTRUCTION_PIECES[3].id,
      );
      await expect(scene).toHaveAttribute("data-phase", "slew");
      await expect(scene).toHaveAttribute("data-placed-count", "3");
      await expect(scene).toHaveAttribute("data-attached", "true");
    });
    fireEvent.change(slider, { target: { value: "0" } });
    await waitFor(async () => {
      await expect(scene).toHaveAttribute("data-phase", "approach");
      await expect(scene).toHaveAttribute("data-placed-count", "0");
      await expect(scene).toHaveAttribute(
        "data-active-piece",
        CONSTRUCTION_PIECES[0].id,
      );
    });
  },
};

// Keep the published story identifier while showing the completed scene used
// on arrival and for reduced motion. The inline SVG remains a WebGL fallback.
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
        await expect(scene).toHaveAttribute(
          "data-placed-count",
          String(CONSTRUCTION_PIECES.length),
        );
        await expect(scene).toHaveAttribute(
          "data-piece-count",
          String(CONSTRUCTION_PIECES.length),
        );
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
