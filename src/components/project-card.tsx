import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/data/projects";
import { ArrowUpRight } from "./icons";
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="project-card group block h-full"
      aria-label={`Explore ${project.title}`}
    >
      <div className="project-image relative overflow-hidden">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 639px) 90vw, (max-width: 1023px) 44vw, 29vw"
          className="object-cover"
        />
      </div>
      <div className="project-content">
        <div className="flex items-start justify-between gap-3">
          <h3>{project.title}</h3>
          <ArrowUpRight className="project-arrow shrink-0 text-orange" />
        </div>
        <p>{project.description}</p>
        <ul className="flex flex-wrap gap-2" aria-label="Technologies">
          {project.tags.map((tag) => (
            <li key={tag} className="tech-tag">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
