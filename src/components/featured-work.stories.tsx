import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { projects } from "@/data/projects";
import { FeaturedWork } from "./featured-work";

const meta = {
  title: "Projects/Featured Work",
  component: FeaturedWork,
  args: { projects },
  decorators: [
    (Story) => (
      <main>
        <h1 className="sr-only">Tian Pok’s selected projects</h1>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof FeaturedWork>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopGrid: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvasElement, userEvent, step }) => {
    const canvas = within(canvasElement);
    const cards = projects.map((project) =>
      canvas.getByRole("link", { name: new RegExp(project.title) }),
    );

    await step("All six projects form two rows of three cards", async () => {
      await expect(
        canvas.getByRole("heading", { name: "Portfolio", level: 2 }),
      ).toBeVisible();
      await expect(canvas.queryAllByRole("button")).toHaveLength(0);
      const bounds = cards.map((card) => card.getBoundingClientRect());
      for (const [index, card] of cards.entries()) {
        await expect(card).toBeVisible();
        await expect(
          within(card).getByRole("list", { name: "Technologies" }),
        ).toBeVisible();
        expect(bounds[index].top).toBeCloseTo(
          bounds[Math.floor(index / 3) * 3].top,
          0,
        );
        expect(bounds[index].left).toBeCloseTo(bounds[index % 3].left, 0);
        if (index % 3 > 0) {
          expect(bounds[index].left).toBeGreaterThan(bounds[index - 1].right);
        }
      }
      expect(bounds[3].top).toBeGreaterThan(bounds[0].bottom);
    });

    await step("Keyboard reaches every project in reading order", async () => {
      await userEvent.tab();
      await expect(
        canvas.getByRole("link", { name: "View all projects" }),
      ).toHaveFocus();
      for (const card of cards) {
        await userEvent.tab();
        await expect(card).toHaveFocus();
      }
    });
  },
};

export const MobileStack: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("group", { name: "Browse featured projects" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Next projects" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Previous projects" }),
    ).not.toBeInTheDocument();
    const cards = projects.map((project) =>
      canvas.getByRole("link", { name: new RegExp(project.title) }),
    );
    await expect(cards).toHaveLength(6);
    const viewportWidth =
      canvasElement.ownerDocument.documentElement.clientWidth;
    let previousBottom = 0;
    for (const [index, card] of cards.entries()) {
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute(
        "href",
        `/projects/${projects[index].slug}`,
      );
      const bounds = card.getBoundingClientRect();
      await expect(bounds.top).toBeGreaterThanOrEqual(previousBottom);
      await expect(bounds.left).toBeGreaterThanOrEqual(0);
      await expect(bounds.right).toBeLessThanOrEqual(viewportWidth + 1);
      previousBottom = bounds.bottom;
    }
  },
};
