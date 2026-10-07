import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "./page";

const meta = {
  title: "Pages/Home",
  component: Home,
  render: () => (
    <>
      <Header />
      <Home />
      <Footer />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole("heading", { name: "Portfolio" })).toBeVisible(),
    );
    await expect(
      within(canvas.getByRole("region", { name: "Portfolio" })).getAllByRole(
        "link",
      ),
    ).toHaveLength(7);
    await waitFor(() =>
      expect(
        canvas.getByRole("heading", { name: /Still\s*Building/ }),
      ).toBeVisible(),
    );
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    const canvas = within(context.canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1 }),
    ).toHaveAccessibleName(/I build software\.\s*And I care\s*how it feels\./);
    const hero = within(
      canvas.getByRole("region", { name: /I build software/ }),
    );
    await expect(
      hero.getByRole("link", { name: "View my work" }),
    ).toHaveAttribute("href", "#projects");
    await expect(hero.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/liang799",
    );
    const scene = hero.getByTestId("desktop-construction-scene");
    await waitFor(
      () => {
        expect(scene).toHaveAttribute("data-renderer", "webgl");
        expect(scene.querySelector("canvas")).toBeVisible();
        expect(scene).toHaveAttribute("data-phase", "completed");
        expect(scene).toHaveAttribute("data-placed-count", "8");
      },
      { timeout: 10_000 },
    );
    await expect(scene.querySelector("img, image")).toBeNull();
    const track = canvas.getByTestId("construction-track");
    await expect(track).toHaveAttribute("data-animated", "false");
    await userEvent.click(
      hero.getByRole("button", { name: "Replay the build" }),
    );
    await waitFor(() => {
      expect(track).toHaveAttribute("data-animated", "true");
      expect(scene).toHaveAttribute("data-phase", "approach");
      expect(scene).toHaveAttribute("data-placed-count", "0");
      expect(Number(scene.getAttribute("data-progress"))).toBeLessThan(0.001);
    });
    await userEvent.click(hero.getByRole("button", { name: "Exit replay" }));
    await waitFor(() => {
      expect(track).toHaveAttribute("data-animated", "false");
      expect(scene).toHaveAttribute("data-phase", "completed");
      expect(scene).toHaveAttribute("data-placed-count", "8");
    });
    await expect(
      hero.getByRole("button", { name: "Replay the build" }),
    ).toHaveFocus();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    const canvas = within(context.canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 1 }),
    ).toHaveAccessibleName(/I build software\.\s*And I care\s*how it feels\./);
    await waitFor(() =>
      expect(canvas.getByText(/^Software engineer$/i)).toBeVisible(),
    );
    await expect(
      canvas.getByRole("link", { name: "View my work" }),
    ).toHaveAttribute("href", "#projects");
    await expect(
      canvas.queryByRole("link", { name: "View Projects" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Open menu" }),
    ).toBeVisible();
    const illustration = context.canvasElement.querySelector<HTMLImageElement>(
      ".mobile-construction-art img",
    );
    await expect(illustration).toBeVisible();
    await waitFor(
      () => {
        expect(illustration?.naturalWidth).toBeGreaterThan(1);
        expect(illustration?.currentSrc).toContain(
          "/images/mobile-construction.webp",
        );
      },
      { timeout: 10_000 },
    );
    await expect(canvas.queryByTestId("desktop-construction-scene")).toBeNull();
    await expect(
      canvas.queryByRole("button", { name: "Replay the build" }),
    ).toBeNull();
    await expect(
      context.canvasElement.querySelector(".hero-art canvas"),
    ).toBeNull();
    const track = canvas.getByTestId("construction-track");
    const stage = canvas.getByTestId("construction-stage");
    await expect(track).toHaveAttribute("data-animated", "false");
    await expect(
      Math.abs(
        track.getBoundingClientRect().height -
          stage.getBoundingClientRect().height,
      ),
    ).toBeLessThan(2);
  },
};
