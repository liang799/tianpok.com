import Link from "next/link";
import ConstructionScene, {
  ArchitectureBackdrop,
} from "@/components/construction-scene";
import { ArrowRight } from "@/components/icons";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { projects } from "@/data/projects";
export default function Home() {
  return (
    <main id="main-content">
      <section
        id="home"
        className="hero relative isolate overflow-hidden"
        aria-labelledby="hero-title"
      >
        <div className="blueprint-grid" aria-hidden="true" />
        <div className="site-container relative z-10">
          <div className="hero-copy">
            <p className="eyebrow hero-enter">
              {"// Builder of digital things"}
            </p>
            <h1 id="hero-title" className="hero-heading hero-enter">
              <span>Ideas</span>
              <span>Under</span>
              <span className="text-orange">Construction</span>
            </h1>
            <p className="hero-description hero-enter">
              I’m Tian Pok — a developer who enjoys turning ideas into real,
              usable products. Currently exploring software engineering, product
              design, and everything in between.
            </p>
            <div className="hero-actions hero-enter flex flex-wrap gap-5">
              <a href="#projects" className="button button-primary">
                View Projects <ArrowRight />
              </a>
              <a href="#about" className="button button-outline">
                About Me
              </a>
            </div>
          </div>
        </div>
        <div className="hero-note hero-note-process" aria-hidden="true">
          Code
          <br />
          Design
          <br />
          Build
          <br />
          Repeat
          <span />
        </div>
        <div className="hero-note hero-note-standards" aria-hidden="true">
          Same
          <br />
          Ideas
          <br />
          Higher
          <br />
          Standards
          <span />
        </div>
        <div className="hero-art">
          <ConstructionScene />
        </div>
        <svg
          className="hero-ground"
          viewBox="0 0 1440 58"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 40 65 26 130 48 205 31 264 44 335 15 389 43 438 21 485 42 555 29 611 53H1440V58H0Z"
            fill="#ffdfcf"
            opacity=".5"
          />
          <path
            d="m0 50 78-7 46 10 90-35 74 32 60-10 62 12 71-28 84 29 62-11 65 12h748v4H0Z"
            fill="#f4d7c6"
            opacity=".65"
          />
        </svg>
      </section>
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
