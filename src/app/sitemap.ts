import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/projects",
    ...projects.map(({ slug }) => `/projects/${slug}`),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
