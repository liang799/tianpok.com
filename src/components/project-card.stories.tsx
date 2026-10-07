import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { projects } from "@/data/projects";
import { ProjectCard } from "./project-card";

function projectWithSlug(slug: string) {
  const project = projects.find((item) => item.slug === slug);
  if (!project) throw new Error(`Missing portfolio project: ${slug}`);
  return project;
}

const meta = {
  title: "Projects/Project Card",
  component: ProjectCard,
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-3xl font-bold">Projects</h1>
        <h2 className="mb-6 text-xl">Featured project</h2>
        <Story />
      </main>
    ),
  ],
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const { project } = args;
    const link = canvas.getByRole("link", {
      name: new RegExp(project.title),
    });

    await expect(link).toHaveAttribute("href", `/projects/${project.slug}`);
    await expect(
      canvas.getByRole("heading", {
        level: 3,
        name: project.title,
      }),
    ).toBeVisible();
    await expect(canvas.getByText(project.description)).toBeVisible();

    const technologies = within(
      canvas.getByRole("list", { name: "Technologies" }),
    );
    await expect(technologies.getAllByRole("listitem")).toHaveLength(
      project.tags.length,
    );
    for (const tag of project.tags) {
      await expect(technologies.getByText(tag, { exact: true })).toBeVisible();
    }

    const image = canvas.getByRole<HTMLImageElement>("img", {
      name: project.imageAlt,
    });
    await expect(image).toBeVisible();
    await waitFor(async () => {
      await expect(image.complete).toBe(true);
      await expect(image.naturalWidth).toBeGreaterThan(0);
    });
  },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MobileApp: Story = {
  args: { project: projectWithSlug("vigour") },
};

export const Website: Story = {
  args: { project: projectWithSlug("tree") },
};

export const DesignExperiment: Story = {
  args: { project: projectWithSlug("poketeams") },
};

export const LongTitle: Story = {
  args: { project: projectWithSlug("onesystem-technologies") },
};
