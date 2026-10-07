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
    await expect(
      footer.getByRole("link", { name: "Tian Pok — home" }),
    ).toHaveAttribute("href", "/");
    await expect(
      footer.getByText(
        "Building practical, purposeful software for a better digital tomorrow.",
      ),
    ).toBeVisible();
    await expect(footer.getByText(/© 2026 Tian Pok\./)).toBeVisible();
    await expect(footer.getByText(/All rights reserved\./)).toBeVisible();
    await expect(footer.getByText(/Based in Singapore/)).toBeVisible();
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async (context) => {
    await meta.play(context);
    const footer = within(context.canvas.getByRole("contentinfo"));
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
      footer.getByRole("heading", { name: "Connect" }),
    ).toBeVisible();
    await expect(navigation.getAllByRole("link")).toHaveLength(3);
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
    const footerElement = context.canvas.getByRole("contentinfo");
    const footer = within(footerElement);
    await expect(
      footer.queryByRole("navigation", { name: "Footer navigation" }),
    ).not.toBeInTheDocument();
    await expect(
      footer.queryByRole("heading", { name: "Connect" }),
    ).not.toBeInTheDocument();
    await expect(
      footer.queryByRole("link", { name: "Tian Pok on GitHub" }),
    ).not.toBeInTheDocument();
    await expect(
      footer.queryByRole("link", { name: "Tian Pok on LinkedIn" }),
    ).not.toBeInTheDocument();
    await expect(
      footer.queryByRole("link", { name: "Email hello@tianpok.com" }),
    ).not.toBeInTheDocument();
    await expect(footer.getAllByRole("link")).toHaveLength(1);
    await expect(footer.getByText(/Build.*Learn.*Repeat/)).not.toBeVisible();
    const home = footer.getByRole("link", { name: "Tian Pok — home" });
    await context.userEvent.tab();
    await expect(home).toHaveFocus();

    const tagline = footer.getByText(
      "Building practical, purposeful software for a better digital tomorrow.",
    );
    const location = footer.getByText(/Based in Singapore/);
    const copyright = footer.getByText(/© 2026 Tian Pok\./);
    const brandBounds = home.getBoundingClientRect();
    const taglineBounds = tagline.getBoundingClientRect();
    const locationBounds = location.getBoundingClientRect();
    const copyrightBounds = copyright.getBoundingClientRect();
    await expect(locationBounds.left).toBeGreaterThan(brandBounds.right);
    await expect(locationBounds.left).toBeGreaterThanOrEqual(
      taglineBounds.right,
    );
    await expect(copyrightBounds.top).toBeGreaterThanOrEqual(
      locationBounds.bottom,
    );
    await expect(
      Math.abs(copyrightBounds.left - locationBounds.left),
    ).toBeLessThan(1);

    const viewportWidth =
      footerElement.ownerDocument.documentElement.clientWidth;
    for (const element of [home, tagline, location, copyright]) {
      const bounds = element.getBoundingClientRect();
      await expect(bounds.left).toBeGreaterThanOrEqual(0);
      await expect(bounds.right).toBeLessThanOrEqual(viewportWidth + 1);
    }
  },
};
