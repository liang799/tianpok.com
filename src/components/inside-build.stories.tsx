import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, waitFor, within } from "storybook/test";
import { InsideBuild } from "./inside-build";
import { CONSTRUCTION_PIECES } from "@/lib/construction-plan";

const meta = {
  title: "Site/Inside the Build",
  component: InsideBuild,
  decorators: [
    (Story) => (
      <main>
        <h1 className="sr-only">Inside Tian Pok’s portfolio</h1>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof InsideBuild>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StructureInspection: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    const panel = within(canvas.getByRole("tabpanel", { name: /Structure/ }));
    await expect(
      panel.getByRole("button", { name: /Page & content/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      panel.getByRole("button", { name: /Reusable components/ }),
    );
    await expect(
      panel.getByRole("heading", { name: "A component, not a copied screen." }),
    ).toBeVisible();
    await expect(
      panel.getByRole("button", { name: /Page & content/ }),
    ).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(
      panel.getByRole("button", { name: /Motion & safeguards/ }),
    );
    await expect(
      panel.getByRole("heading", { name: "Movement with a fallback." }),
    ).toBeVisible();
    await expect(
      panel.getByRole("link", { name: "View source" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/liang799/tianpok.com/blob/main/src/lib/crane-choreography.ts",
    );

    const expose = panel.getByRole("button", { name: "Expose page layout" });
    const root = canvasElement.ownerDocument.documentElement;
    await userEvent.click(expose);
    await expect(expose).toHaveAttribute("aria-pressed", "true");
    await expect(root).toHaveAttribute("data-inspect-layout", "true");
    await expect(
      canvas.getByRole("button", { name: "Exit structure view" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(root).not.toHaveAttribute("data-inspect-layout");
    await expect(expose).toHaveAttribute("aria-pressed", "false");
    await expect(expose).toHaveFocus();

    await userEvent.click(expose);
    await userEvent.click(
      canvas.getByRole("button", { name: "Exit structure view" }),
    );
    await expect(root).not.toHaveAttribute("data-inspect-layout");
    await expect(expose).toHaveFocus();

    await userEvent.click(expose);
    const components = canvas.getByRole("tab", { name: /Components/ });
    await userEvent.click(components);
    await userEvent.keyboard("{Escape}");
    await expect(root).not.toHaveAttribute("data-inspect-layout");
    await expect(components).toHaveFocus();
  },
};

export const KeyboardTabs: Story = {
  play: async ({ canvas, userEvent }) => {
    const structure = canvas.getByRole("tab", { name: /Structure/ });
    const components = canvas.getByRole("tab", { name: /Components/ });
    const motion = canvas.getByRole("tab", { name: /Motion/ });
    await userEvent.click(structure);
    await userEvent.keyboard("{ArrowRight}");
    await expect(components).toHaveFocus();
    await expect(components).toHaveAttribute("aria-selected", "true");
    await expect(structure).toHaveAttribute("tabindex", "-1");
    await expect(
      canvas.getByRole("tabpanel", { name: /Components/ }),
    ).toBeVisible();

    await userEvent.keyboard("{End}");
    await expect(motion).toHaveFocus();
    await expect(motion).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(structure).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(motion).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(structure).toHaveFocus();
    await expect(structure).toHaveAttribute("aria-selected", "true");
    await expect(
      canvas.getByRole("tabpanel", { name: /Structure/ }),
    ).toBeVisible();
  },
};

export const LiveProjectData: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /Components/ }));
    const panel = within(canvas.getByRole("tabpanel", { name: /Components/ }));
    const select = panel.getByRole("combobox", { name: "Project data" });
    await expect(select).toHaveValue("vigour");
    await expect(panel.getByRole("link", { name: /^Vigour/ })).toHaveAttribute(
      "href",
      "/projects/vigour",
    );

    await userEvent.selectOptions(select, "tree");
    await expect(
      panel.queryByRole("heading", { name: "Vigour" }),
    ).not.toBeInTheDocument();
    await expect(panel.getByRole("heading", { name: "TREE" })).toBeVisible();
    await expect(panel.getByRole("link", { name: /^TREE/ })).toHaveAttribute(
      "href",
      "/projects/tree",
    );
    await expect(panel.getByText(/slug === "tree"/)).toBeVisible();
    const image = panel.getByRole<HTMLImageElement>("img", {
      name: /TREE environmental organisation/,
    });
    await waitFor(async () => {
      await expect(image.complete && image.naturalWidth > 0).toBe(true);
    });
  },
};

export const ManualMotion: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: /Motion/ }));
    const panelElement = canvas.getByRole("tabpanel", { name: /Motion/ });
    const panel = within(panelElement);
    const slider = panel.getByRole("slider", { name: /Assembly progress/ });
    const scene = panel.getByTestId("desktop-construction-scene");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-renderer", "webgl");
      },
      { timeout: 20_000 },
    );

    await userEvent.click(panel.getByRole("button", { name: "Halfway" }));
    await expect(slider).toHaveValue("50");
    await expect(panel.getByText("50%", { exact: true })).toBeVisible();
    await expect(panel.getByText(/input\.set\(0\.50+\)/)).toBeVisible();
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-phase", "approach");
        await expect(scene).toHaveAttribute("data-attached", "false");
        await expect(scene).toHaveAttribute("data-placed", "false");
        await expect(scene).toHaveAttribute(
          "data-active-piece",
          CONSTRUCTION_PIECES[4].id,
        );
        await expect(scene).toHaveAttribute("data-placed-count", "4");
      },
      { timeout: 3000 },
    );

    await userEvent.selectOptions(
      panel.getByRole("combobox", { name: "Inspect a lift" }),
      "7",
    );
    await expect(slider).toHaveValue("93.8");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute(
          "data-active-piece",
          CONSTRUCTION_PIECES[7].id,
        );
        await expect(scene).toHaveAttribute("data-phase", "slew");
        await expect(scene).toHaveAttribute("data-attached", "true");
        await expect(scene).toHaveAttribute("data-placed-count", "7");
      },
      { timeout: 3000 },
    );

    await userEvent.click(panel.getByRole("button", { name: "Complete" }));
    await expect(slider).toHaveValue("100");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-phase", "completed");
        await expect(scene).toHaveAttribute("data-placed", "true");
        await expect(scene).toHaveAttribute("data-attached", "false");
        await expect(scene).toHaveAttribute(
          "data-placed-count",
          String(CONSTRUCTION_PIECES.length),
        );
      },
      { timeout: 3000 },
    );

    await userEvent.click(panel.getByRole("button", { name: "Start" }));
    await expect(slider).toHaveValue("0");
    await waitFor(
      async () => {
        await expect(scene).toHaveAttribute("data-phase", "approach");
        await expect(scene).toHaveAttribute("data-placed", "false");
        await expect(scene).toHaveAttribute("data-placed-count", "0");
      },
      { timeout: 3000 },
    );
    // Native range keyboard behavior is covered in Playwright; Storybook's
    // userEvent does not implement Home/End for input[type=range].
    fireEvent.change(slider, { target: { value: "42" } });
    await expect(slider).toHaveValue("42");
    await expect(panel.getByText("42%", { exact: true })).toBeVisible();
    await waitFor(async () => {
      await expect(scene).toHaveAttribute("data-phase", "lift");
      await expect(scene).toHaveAttribute("data-attached", "true");
      await expect(scene).toHaveAttribute(
        "data-active-piece",
        CONSTRUCTION_PIECES[3].id,
      );
      await expect(scene).toHaveAttribute("data-placed-count", "3");
    });
    await expect(
      canvasElement.ownerDocument.documentElement,
    ).not.toHaveAttribute("data-inspect-layout");
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: /Good software/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Open component workshop" }),
    ).toHaveAttribute("href", "/storybook/index.html");
    await userEvent.click(canvas.getByRole("tab", { name: /Components/ }));
    await expect(
      canvas.getByRole("combobox", { name: "Project data" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("tab", { name: /Motion/ }));
    await expect(
      canvas.getByRole("slider", { name: /Assembly progress/ }),
    ).toBeVisible();
  },
};
