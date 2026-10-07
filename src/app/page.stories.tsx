import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Ideas\s*Under\s*Construction/,
    );
    await expect(
      canvas.getByRole("link", { name: "View Projects" }),
    ).toHaveAttribute("href", "#projects");
    await expect(
      canvas.getByRole("link", { name: "About Me" }),
    ).toHaveAttribute("href", "#about");
    await expect(
      canvas.getByRole("heading", { name: "Portfolio" }),
    ).toBeVisible();
    await expect(
      within(canvas.getByRole("region", { name: "Portfolio" })).getAllByRole(
        "link",
      ),
    ).toHaveLength(7);
    await expect(
      canvas.getByRole("heading", { name: /Still\s*Building/ }),
    ).toBeVisible();
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
