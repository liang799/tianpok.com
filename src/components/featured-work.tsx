import Link from "next/link";
import type { Project } from "@/data/projects";
import { ArrowRight } from "./icons";
import { ProjectCard } from "./project-card";

export function FeaturedWork({ projects }: { projects: Project[] }) {
  return (
    <section
      data-component="FeaturedWork"
      id="projects"
      className="featured-work site-container"
      aria-labelledby="projects-title"
    >
      <div className="section-heading flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">{"// Projects"}</p>
          <h2 id="projects-title" className="section-title">
            Portfolio
          </h2>
        </div>
        <Link href="/projects" className="text-link shrink-0">
          View all projects <ArrowRight />
        </Link>
      </div>
      <div className="project-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
