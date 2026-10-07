import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { Brand } from "./brand";

const meta = {
  title: "Site/Brand",
  component: Brand,
  decorators: [
    (Story) => (
      <main className="p-6">
        <h1 className="sr-only">Tian Pok branding</h1>
        <Story />
      </main>
    ),
  ],
  play: async ({ canvas, args }) => {
    const home = canvas.getByRole("link", {
      name: args.footer
        ? "Tian Pok — home. Ideas under construction"
        : "Tian Pok — home",
    });
    await expect(home).toHaveAttribute("href", "/");

    // Both supplied SVG assets must load, including the exact wordmark lettering.
    const images = Array.from(home.querySelectorAll("img"));
    await expect(images.map((image) => new URL(image.src).pathname)).toEqual([
      "/logo.svg",
      "/wordmark.svg",
    ]);
    for (const image of images) {
      await expect(image).toHaveAttribute("alt", "");
      await waitFor(() => {
        expect(image.complete).toBe(true);
        expect(image.naturalWidth).toBeGreaterThan(0);
      });
    }

    const tagline = canvas.queryByText("Ideas under construction");
    if (args.footer) {
      await expect(tagline).toBeVisible();
    } else {
      await expect(tagline).not.toBeInTheDocument();
    }
  },
} satisfies Meta<typeof Brand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeaderWordmark: Story = {
  args: { footer: false },
};

export const FooterWordmark: Story = {
  args: { footer: true },
};
