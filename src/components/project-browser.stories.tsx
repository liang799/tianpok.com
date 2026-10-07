import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { projects } from "@/data/projects";
import ProjectBrowser from "./project-browser";

const meta = {
  title: "Projects/Project Browser",
  component: ProjectBrowser,
  args: { projects },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-7xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Projects</h1>
        <h2 className="mb-6 text-xl">Portfolio</h2>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ProjectBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

const allProjectTitles = [
  "Vigour",
  "BellCurveHero",
  "TREE",
  "PokéTeams",
  "MindfulHacks Bot",
  "Onesystem Technologies",
];

export const AllProjects: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const browser = within(
      canvas.getByRole("region", { name: "Browse projects" }),
    );

    await expect(browser.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(browser.getByRole("status")).toHaveTextContent(
      "Showing 6 projects.",
    );
    await expect(browser.getAllByRole("link")).toHaveLength(6);

    for (const title of allProjectTitles) {
      await expect(
        browser.getByRole("link", { name: new RegExp(title) }),
      ).toBeVisible();
    }
  },
};

export const FilterByCategory: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const filters = within(
      canvas.getByRole("group", { name: "Filter projects by category" }),
    );
    const cases = [
      {
        category: "Apps",
        titles: ["Vigour"],
        announcement: "Showing 1 apps project.",
      },
      {
        category: "Web",
        titles: ["BellCurveHero", "TREE", "Onesystem Technologies"],
        announcement: "Showing 3 web projects.",
      },
      {
        category: "Experiments",
        titles: ["PokéTeams", "MindfulHacks Bot"],
        announcement: "Showing 2 experiments projects.",
      },
      {
        category: "All",
        titles: allProjectTitles,
        announcement: "Showing 6 projects.",
      },
    ];

    for (const { category, titles, announcement } of cases) {
      await step(`Filter by ${category}`, async () => {
        await userEvent.click(filters.getByRole("button", { name: category }));

        await expect(canvas.getByRole("status")).toHaveTextContent(
          announcement,
        );
        await expect(canvas.getAllByRole("link")).toHaveLength(titles.length);

        for (const button of filters.getAllByRole("button")) {
          await expect(button).toHaveAttribute(
            "aria-pressed",
            button.textContent === category ? "true" : "false",
          );
        }

        for (const title of allProjectTitles) {
          const link = canvas.queryByRole("link", {
            name: new RegExp(title),
          });
          if (titles.includes(title)) {
            await expect(link).toBeVisible();
          } else {
            await expect(link).not.toBeInTheDocument();
          }
        }
      });
    }
  },
};

export const KeyboardFiltering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("button", { name: "All" });
    const apps = canvas.getByRole("button", { name: "Apps" });
    const web = canvas.getByRole("button", { name: "Web" });

    await userEvent.tab();
    await expect(all).toHaveFocus();
    await userEvent.tab();
    await expect(apps).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(apps).toHaveAttribute("aria-pressed", "true");
    await expect(apps).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Showing 1 apps project.",
    );
    await expect(canvas.getByRole("link", { name: /Vigour/ })).toBeVisible();

    await userEvent.tab();
    await expect(web).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(web).toHaveAttribute("aria-pressed", "true");
    await expect(apps).toHaveAttribute("aria-pressed", "false");
    await expect(web).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Showing 3 web projects.",
    );
    await expect(canvas.getAllByRole("link")).toHaveLength(3);
  },
};

export const EmptyCollection: Story = {
  args: { projects: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Showing 0 projects.",
    );
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
    await userEvent.click(canvas.getByRole("button", { name: "Apps" }));
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Showing 0 apps projects.",
    );
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
  },
};
