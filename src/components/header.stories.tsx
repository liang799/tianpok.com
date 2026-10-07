import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Header } from "./header";

const meta = {
  title: "Site/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/" } },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <main className="min-h-96 p-6">
          <h1>I build software. And I care how it feels.</h1>
          <p>Explore Tian Pok’s projects.</p>
        </main>
      </>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;
const mobileGlobals = { viewport: { value: "mobile", isRotated: false } };

export const DesktopHome: Story = {
  play: async ({ canvas }) => {
    const navigation = within(
      canvas.getByRole("navigation", { name: "Main navigation" }),
    );
    await expect(
      navigation.queryByRole("link", { name: "Home" }),
    ).not.toBeInTheDocument();
    const work = navigation.getByRole("link", { name: "Work" });
    await expect(work).toHaveAttribute("href", "/#projects");
    await expect(work).not.toHaveAttribute("aria-current");
    await expect(
      canvas.getByRole("link", { name: "View my work" }),
    ).toHaveAttribute("href", "/#projects");
    await expect(
      navigation.getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "mailto:hello@tianpok.com");
    await expect(
      canvas.queryByRole("button", { name: "Open menu" }),
    ).not.toBeInTheDocument();
  },
};

export const ProjectPage: Story = {
  parameters: { nextjs: { navigation: { pathname: "/projects/tree" } } },
  play: async ({ canvas }) => {
    const navigation = within(
      canvas.getByRole("navigation", { name: "Main navigation" }),
    );
    await expect(
      navigation.getByRole("link", { name: "Work" }),
    ).toHaveAttribute("aria-current", "location");
    await expect(
      navigation.queryByRole("link", { name: "Home" }),
    ).not.toBeInTheDocument();
  },
};

export const MobileMenuOpen: Story = {
  globals: mobileGlobals,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Open menu" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvas.queryByRole("navigation", { name: "Main navigation" }),
    ).not.toBeInTheDocument();

    await userEvent.click(toggle);
    await expect(toggle).toHaveAccessibleName("Close menu");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const navigation = canvas.getByRole("navigation", {
      name: "Main navigation",
    });
    await expect(navigation).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-controls", navigation.id);
    await expect(within(navigation).getAllByRole("link")).toHaveLength(4);
  },
};

export const MobileDismissals: Story = {
  globals: mobileGlobals,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Open menu" });
    await userEvent.click(toggle);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Home" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
    await expect(
      canvas.queryByRole("navigation", { name: "Main navigation" }),
    ).not.toBeInTheDocument();

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("main"));
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvas.queryByRole("navigation", { name: "Main navigation" }),
    ).not.toBeInTheDocument();
  },
};

export const MobileProjectNavigation: Story = {
  globals: mobileGlobals,
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Open menu" });
    await userEvent.click(toggle);
    const projects = canvas.getByRole("link", { name: "Projects" });
    await expect(projects).toHaveAttribute("href", "/#projects");
    await userEvent.click(projects);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      canvas.queryByRole("navigation", { name: "Main navigation" }),
    ).not.toBeInTheDocument();
  },
};
