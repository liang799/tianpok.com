"use client";

import { useState } from "react";
import type { Project } from "@/data/projects";
import { ProjectCard } from "./project-card";

const categories = ["All", "Apps", "Web", "Experiments"] as const;
type Category = (typeof categories)[number];

export default function ProjectBrowser({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<Category>("All");
  const visibleProjects =
    category === "All"
      ? projects
      : projects.filter((project) => project.category === category);

  return (
    <section aria-label="Browse projects" className="pb-16 sm:pb-24">
      <div
        className="mb-8 flex flex-wrap gap-2.5"
        role="group"
        aria-label="Filter projects by category"
      >
        {categories.map((option) => (
          <button
            key={option}
            type="button"
            className="filter-button"
            aria-pressed={category === option}
            aria-controls="project-results"
            onClick={() => setCategory(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {visibleProjects.length}{" "}
        {category === "All" ? "" : `${category.toLowerCase()} `}
        {visibleProjects.length === 1 ? "project" : "projects"}.
      </p>
      <div
        id="project-results"
        className="project-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visibleProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
