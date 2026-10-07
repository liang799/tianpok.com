import type { Metadata } from "next";
import ProjectBrowser from "@/components/project-browser";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A collection of Tian Pok’s apps, websites, and experiments. Ideas brought to life through software and design.",
};

export default function ProjectsPage() {
  return (
    <main id="main-content" className="site-container">
      <div className="page-intro">
        <p className="eyebrow">{"// Selected work"}</p>
        <h1 className="page-heading">
          Built with <span className="text-orange">curiosity.</span>
        </h1>
        <p className="page-description">
          A collection of apps, websites, and experiments. Things I’ve built,
          explored, and learned from along the way.
        </p>
      </div>
      <ProjectBrowser projects={projects} />
    </main>
  );
}
