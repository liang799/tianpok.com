import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
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

export const DesktopCarousel: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvasElement, userEvent, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "Previous projects" });
    const next = canvas.getByRole("button", { name: "Next projects" });
    const cards = projects.map((project) =>
      canvas.getByRole("link", { name: new RegExp(project.title) }),
    );
    const rail = cards[0].parentElement!;
    const expectInRail = async (card: HTMLElement) => {
      await waitFor(() => {
        const viewport = rail.getBoundingClientRect();
        const bounds = card.getBoundingClientRect();
        expect(bounds.left).toBeGreaterThanOrEqual(viewport.left - 1);
        expect(bounds.right).toBeLessThanOrEqual(viewport.right + 1);
      });
    };

    await step(
      "Keyboard reaches every project, including those off screen",
      async () => {
        await expect(previous).toBeDisabled();
        await expect(next).toBeEnabled();
        await userEvent.tab();
        await expect(
          canvas.getByRole("link", { name: "View all projects" }),
        ).toHaveFocus();
        await userEvent.tab();
        await expect(next).toHaveFocus();
        for (const card of cards) {
          await userEvent.tab();
          await expect(card).toHaveFocus();
          await expectInRail(card);
        }
        await waitFor(() => expect(next).toBeDisabled());
        await expect(previous).toBeEnabled();
      },
    );

    await step("Previous returns the rail to its first page", async () => {
      await userEvent.click(previous);
      await waitFor(() => expect(previous).toBeDisabled());
      await expect(next).toBeEnabled();
      await expectInRail(cards[0]);
      await expect(rail.scrollLeft).toBeLessThan(2);
    });

    await step(
      "Next reveals the final page and disables at the end",
      async () => {
        await userEvent.click(next);
        await waitFor(() => expect(next).toBeDisabled());
        await expect(previous).toBeEnabled();
        await expectInRail(cards[cards.length - 1]);
        await expect(rail.scrollLeft).toBeGreaterThan(rail.clientWidth / 2);
      },
    );
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
