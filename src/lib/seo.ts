import type { Metadata } from "next";
import type { Project } from "@/data/projects";

// Match the existing production redirect from the apex domain to www.
export const site = {
  url: "https://www.tianpok.com",
  name: "Tian Pok",
  title: "Tian Pok — Software Engineer in Singapore",
  description:
    "Tian Pok is a Singapore-based software engineer building practical, purposeful web and mobile products. Explore selected projects, experiments, and product design work.",
  email: "hello@tianpok.com",
  github: "https://github.com/liang799",
  linkedin: "https://www.linkedin.com/in/tianpok-neoh/",
};

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt: string };
};

export function pageMetadata({
  title,
  description,
  path,
  image,
}: PageMetadata): Metadata {
  const fullTitle = path === "/" ? title : `${title} | ${site.name}`;
  const socialImage = image
    ? { ...image, url: absoluteUrl(image.url) }
    : {
        url: absoluteUrl("/share-image"),
        alt: "Tian Pok — I build software. And I care how it feels. Software engineer in Singapore.",
        width: 1200,
        height: 630,
        type: "image/png",
      };

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      type: "website",
      locale: "en_SG",
      siteName: site.name,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
  };
}

const person = {
  "@type": "Person",
  "@id": absoluteUrl("/#person"),
  name: site.name,
  url: absoluteUrl("/"),
  description:
    "Singapore-based software engineer building web and mobile products.",
  email: site.email,
  sameAs: [site.github, site.linkedin],
};

export const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    person,
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": person["@id"] },
    },
  ],
};

function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const projectBreadcrumbs = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/projects" },
];

export function projectsStructuredData(projects: Project[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/projects#webpage"),
        url: absoluteUrl("/projects"),
        name: `Projects | ${site.name}`,
        isPartOf: { "@id": absoluteUrl("/#website") },
        mainEntity: { "@id": absoluteUrl("/projects#list") },
      },
      {
        "@type": "ItemList",
        "@id": absoluteUrl("/projects#list"),
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: project.title,
          url: absoluteUrl(`/projects/${project.slug}`),
        })),
      },
      breadcrumbs(projectBreadcrumbs),
    ],
  };
}

export function projectStructuredData(project: Project) {
  const path = `/projects/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`${path}#webpage`),
        url: absoluteUrl(path),
        name: `${project.title} | ${site.name}`,
        description: project.description,
        isPartOf: { "@id": absoluteUrl("/#website") },
        mainEntity: { "@id": absoluteUrl(`${path}#project`) },
      },
      {
        "@type": "CreativeWork",
        "@id": absoluteUrl(`${path}#project`),
        name: project.title,
        description: project.overview,
        url: absoluteUrl(path),
        image: absoluteUrl(project.image),
        creator: person,
        keywords: project.tags,
        mainEntityOfPage: { "@id": absoluteUrl(`${path}#webpage`) },
      },
      breadcrumbs([...projectBreadcrumbs, { name: project.title, path }]),
    ],
  };
}
