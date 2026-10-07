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
      ["Work", "/#projects"],
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
    const linkedin = footer.getByRole("link", { name: "Tian Pok on LinkedIn" });
    await expect(linkedin).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/tianpok-neoh/",
    );
    await expect(linkedin).toHaveAttribute("target", "_blank");
    await expect(linkedin).toHaveAttribute("rel", "noreferrer");
    await expect(
      footer.getByRole("link", {
        name: "Tian Pok — home",
      }),
    ).toHaveAttribute("href", "/");
    await expect(
      footer.getByText(
        "Building practical, purposeful software for a better digital tomorrow.",
      ),
    ).toBeVisible();
    await expect(
      footer.getByText("© 2026 Tian Pok. All rights reserved."),
    ).toBeVisible();
    await expect(footer.getByText(/Based in Singapore/)).toBeVisible();
    await expect(
      footer.getByRole("heading", { name: "Connect" }),
    ).toBeVisible();
    await expect(navigation.getAllByRole("link")).toHaveLength(3);
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    const footer = within(context.canvas.getByRole("contentinfo"));
    for (const name of [
      "Tian Pok — home",
      "Work",
      "About",
      "Contact",
      "Tian Pok on GitHub",
      "Tian Pok on LinkedIn",
      "Email hello@tianpok.com",
    ]) {
      await context.userEvent.tab();
      await expect(footer.getByRole("link", { name })).toHaveFocus();
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    const footer = context.canvas.getByRole("contentinfo");
    const viewportWidth = footer.ownerDocument.documentElement.clientWidth;
    for (const element of footer.querySelectorAll("a, p, li")) {
      const bounds = element.getBoundingClientRect();
      await expect(bounds.left).toBeGreaterThanOrEqual(0);
      await expect(bounds.right).toBeLessThanOrEqual(viewportWidth + 1);
    }
  },
};
