import Link from "next/link";
import { ArchitectureBackdrop } from "@/components/construction-scene";
import { ConstructionHero } from "@/components/construction-hero";
import { ArrowRight } from "@/components/icons";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { projects } from "@/data/projects";
import { StructuredData } from "@/components/structured-data";
import { homeStructuredData, pageMetadata, site } from "@/lib/seo";

export const metadata = pageMetadata({
  title: site.title,
  description: site.description,
  path: "/",
});

export default function Home() {
  return (
    <main id="main-content">
      <StructuredData data={homeStructuredData} />
      <ConstructionHero>
        <p className="eyebrow hero-enter">{"// Builder of digital things"}</p>
        <h1 id="hero-title" className="hero-heading hero-enter">
          <span>Ideas</span>
          <span>Under</span>
          <span className="text-orange">Construction</span>
        </h1>
        <p className="hero-description hero-enter">
          I’m Tian Pok — a developer who enjoys turning ideas into real, usable
          products. Currently exploring software engineering, product design,
          and everything in between.
        </p>
        <div className="hero-actions hero-enter flex flex-wrap gap-5">
          <Link href="#projects" className="button button-primary">
            View Projects <ArrowRight />
          </Link>
          <Link href="#about" className="button button-outline">
            About Me
          </Link>
        </div>
      </ConstructionHero>
      <section
        id="projects"
        className="portfolio-section site-container"
        aria-labelledby="projects-title"
      >
        <Reveal className="section-heading flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-2">{"// Projects"}</p>
            <h2 id="projects-title" className="section-title">
              Portfolio
            </h2>
          </div>
          <Link href="/projects" className="text-link">
            View all projects <ArrowRight />
          </Link>
        </Reveal>
        <div className="project-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.slug} delay={(index % 3) * 70}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </section>
      <section
        id="about"
        className="about-section relative isolate overflow-hidden"
        aria-labelledby="about-title"
      >
        <ArchitectureBackdrop className="about-art" />
        <div className="about-grid" aria-hidden="true" />
        <div className="site-container relative z-10 flex items-center justify-between gap-8">
          <Reveal>
            <p className="eyebrow mb-5">{"// 01"}</p>
            <h2 id="about-title" className="about-title">
              Still
              <br />
              <span className="text-orange">Building</span>
            </h2>
            <p className="about-description">
              A collection of projects, experiments, and ideas
              <br className="hidden sm:block" /> as I learn, explore, and build
              what’s next.
            </p>
          </Reveal>
          <p className="about-note hidden sm:block" aria-hidden="true">
            <span />
            Better
            <br />
            Software
            <br />A brighter
            <br />
            Tomorrow
          </p>
        </div>
      </section>
    </main>
  );
}
