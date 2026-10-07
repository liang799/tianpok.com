import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
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
      expect(
        canvas.getByRole("heading", { name: "Featured work" }),
      ).toBeVisible(),
    );
    await expect(
      within(
        canvas.getByRole("region", { name: "Featured work" }),
      ).getAllByRole("link"),
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
    await waitFor(() => {
      expect(illustration).toBeInstanceOf(HTMLImageElement);
      expect(illustration?.naturalWidth).toBeGreaterThan(1);
      expect(illustration?.currentSrc).toContain(
        "/images/mobile-construction.webp",
      );
    });
  },
};
