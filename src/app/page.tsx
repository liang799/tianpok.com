import Link from "next/link";
import { ArchitectureBackdrop } from "@/components/construction-scene";
import { ConstructionHero } from "@/components/construction-hero";
import { ArrowRight, ArrowUpRight, GithubIcon } from "@/components/icons";
import { FeaturedWork } from "@/components/featured-work";
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
        <p className="eyebrow hero-enter">Software engineer</p>
        <h1 id="hero-title" className="hero-heading hero-enter">
          <span>I build software.</span>
          <span>And I care</span>
          <span className="text-orange">how it feels.</span>
        </h1>
        <p className="hero-description hero-enter">
          Singapore-based software engineer building web and mobile products
          that are practical, purposeful, and people-friendly.
        </p>
        <div className="hero-actions hero-enter flex flex-wrap gap-5">
          <Link href="#projects" className="button button-primary">
            View my work <ArrowRight />
          </Link>
          <a
            href={site.github}
            className="button button-outline"
            target="_blank"
            rel="noreferrer"
          >
            <GithubIcon /> GitHub <ArrowUpRight />
          </a>
        </div>
      </ConstructionHero>
      <FeaturedWork projects={projects} />
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
