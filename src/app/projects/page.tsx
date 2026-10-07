import ProjectBrowser from "@/components/project-browser";
import { projects } from "@/data/projects";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, projectsStructuredData } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects — Apps, Websites & Experiments",
  description:
    "Browse Tian Pok’s software and design projects, from Android apps and Next.js websites to Python bots and interface prototypes. Explore the work and technologies.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <main id="main-content" className="site-container">
      <StructuredData data={projectsStructuredData(projects)} />
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
