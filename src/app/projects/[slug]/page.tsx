import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { projects } from "@/data/projects";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, projectStructuredData } from "@/lib/seo";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  return pageMetadata({
    title: project.title,
    description: `${project.description} Explore the project, built with ${project.tags.join(", ")}, in Tian Pok’s portfolio.`,
    path: `/projects/${project.slug}`,
    image: { url: project.image, alt: project.imageAlt },
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  return (
    <main id="main-content" className="site-container pb-8">
      <StructuredData data={projectStructuredData(project)} />
      <div className="page-intro">
        <Link href="/projects" className="text-link mb-7!">
          <span className="rotate-180">
            <ArrowRight />
          </span>
          Back to projects
        </Link>
        <p className="eyebrow">{`// ${project.category}`}</p>
        <h1 className="page-heading">{project.title}</h1>
        <p className="page-description">{project.description}</p>
      </div>
      <div className="detail-art relative">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 1500px) 90vw, 1320px"
          className="object-cover"
          preload
        />
      </div>
      <div className="detail-info">
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading">Overview</h2>
          <p>{project.overview}</p>
          <div className="mt-7 flex flex-wrap gap-4">
            {project.url && (
              <a
                href={project.url}
                className="button button-primary"
                target="_blank"
                rel="noreferrer"
              >
                {project.url.includes("github.com")
                  ? "View on GitHub"
                  : project.url.includes("adobe.com")
                    ? "View design"
                    : "Visit project"}
                <ArrowUpRight />
              </a>
            )}
            <a
              href={`mailto:hello@tianpok.com?subject=${encodeURIComponent(`Let’s talk about ${project.title}`)}`}
              className="button button-outline"
            >
              Ask me about this project
              <ArrowUpRight className="shrink-0" />
            </a>
          </div>
        </section>
        <section aria-labelledby="built-with-heading">
          <h2 id="built-with-heading">Built with</h2>
          <ul
            className="flex flex-wrap gap-2.5"
            aria-label="Technologies and disciplines"
          >
            {project.tags.map((tag) => (
              <li key={tag} className="tech-tag">
                {tag}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm!">{project.category}</p>
        </section>
      </div>
    </main>
  );
}
