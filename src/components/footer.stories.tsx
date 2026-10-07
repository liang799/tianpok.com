import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Footer } from "./footer";

const meta = {
  title: "Site/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <>
        <main className="p-6">
          <h1>Let’s build something.</h1>
        </main>
        <Story />
      </>
    ),
  ],
  play: async ({ canvas }) => {
    const footer = within(canvas.getByRole("contentinfo"));
    const navigation = within(
      footer.getByRole("navigation", { name: "Footer navigation" }),
    );
    for (const [name, href] of [
      ["Home", "/#home"],
      ["Projects", "/#projects"],
      ["About", "/#about"],
      ["Contact", "mailto:hello@tianpok.com"],
    ]) {
      await expect(navigation.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }

    await expect(
      footer.getByRole("link", { name: "Email hello@tianpok.com" }),
    ).toHaveAttribute("href", "mailto:hello@tianpok.com");
    const github = footer.getByRole("link", { name: "Tian Pok on GitHub" });
    await expect(github).toHaveAttribute("href", "https://github.com/liang799");
    await expect(github).toHaveAttribute("target", "_blank");
    await expect(github).toHaveAttribute("rel", "noreferrer");
    await expect(
      footer.getByRole("link", {
        name: "Tian Pok — home. Ideas under construction",
      }),
    ).toHaveAttribute("href", "/");
    await expect(footer.getByText("Ideas under construction")).toBeVisible();
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};
