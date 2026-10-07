import { expect, test, type Page } from "@playwright/test";
import { projects } from "../src/data/projects";

const origin = "https://www.tianpok.com";
const routes = [
  "/",
  "/projects",
  ...projects.map(({ slug }) => `/projects/${slug}`),
];
const absoluteUrl = (route: string) => new URL(route, origin).href;

// Social crawlers need metadata in the original HTML, without hydration.
test.use({ javaScriptEnabled: false, userAgent: "Twitterbot/1.0" });

type SchemaNode = Record<string, unknown>;

async function structuredData(page: Page) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    scripts.length,
    "Pages should expose server-rendered structured data",
  ).toBeGreaterThan(0);
  const nodes: SchemaNode[] = [];

  function visit(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      const node = value as SchemaNode;
      if (node["@type"]) nodes.push(node);
      Object.values(node).forEach(visit);
    }
  }

  scripts.forEach((script) => visit(JSON.parse(script)));
  return nodes;
}

function hasType(node: SchemaNode, type: string) {
  return [node["@type"]].flat().includes(type);
}

function destination(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const node = value as SchemaNode;
    return destination(node.url ?? node["@id"] ?? node.item);
  }
}

function listItems(node: SchemaNode) {
  expect(Array.isArray(node.itemListElement)).toBe(true);
  return node.itemListElement as SchemaNode[];
}

function expectBreadcrumbs(nodes: SchemaNode[], paths: string[]) {
  const breadcrumbs = nodes.find((node) => hasType(node, "BreadcrumbList"));
  expect(
    breadcrumbs,
    "The page should describe its navigation hierarchy",
  ).toBeDefined();
  const items = listItems(breadcrumbs!);
  expect(items.map((item) => item.position)).toEqual(
    paths.map((_, index) => index + 1),
  );
  expect(items.map((item) => absoluteUrl(destination(item.item)!))).toEqual(
    paths.map(absoluteUrl),
  );
  for (const item of items) expect(item.name).toEqual(expect.any(String));
}

test("all indexable pages expose unique metadata and working social images without JavaScript", async ({
  page,
  request,
}) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const images = new Set<string>();

  for (const route of routes) {
    await test.step(route, async () => {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      const title = await page.title();
      expect(title).toContain("Tian Pok");
      expect(
        titles.has(title),
        "Each route needs a distinct search title",
      ).toBe(false);
      titles.add(title);

      const description = await page
        .locator('head meta[name="description"]')
        .getAttribute("content");
      expect(description?.length).toBeGreaterThan(30);
      expect(
        descriptions.has(description!),
        "Each route needs a distinct search description",
      ).toBe(false);
      descriptions.add(description!);

      const canonical = page.locator('head link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const canonicalUrl = await canonical.getAttribute("href");
      expect(new URL(canonicalUrl!).href).toBe(absoluteUrl(route));

      for (const [property, expected] of [
        ["og:title", title],
        ["og:description", description],
      ]) {
        await expect(
          page.locator(`head meta[property="${property}"]`),
        ).toHaveAttribute("content", expected!);
      }
      const ogUrl = await page
        .locator('head meta[property="og:url"]')
        .getAttribute("content");
      expect(new URL(ogUrl!).href).toBe(absoluteUrl(route));
      await expect(
        page.locator('head meta[name="twitter:card"]'),
      ).toHaveAttribute("content", "summary_large_image");
      await expect(
        page.locator('head meta[name="twitter:title"]'),
      ).toHaveAttribute("content", title);
      await expect(
        page.locator('head meta[name="twitter:description"]'),
      ).toHaveAttribute("content", description!);

      for (const selector of [
        'head meta[property="og:image"]',
        'head meta[name="twitter:image"]',
      ]) {
        const image = await page
          .locator(selector)
          .first()
          .getAttribute("content");
        expect(new URL(image!).origin).toBe(origin);
        images.add(image!);
      }
      const robotsContents = await page
        .locator('meta[name="robots"]')
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("content")).join(","),
        );
      expect(robotsContents).not.toMatch(/noindex|nofollow/);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }

  for (const image of images) {
    const url = new URL(image);
    const response = await request.get(`${url.pathname}${url.search}`);
    expect(response.status(), `Social image ${url.pathname} should exist`).toBe(
      200,
    );
    expect(response.headers()["content-type"]).toMatch(
      /^image\/(png|jpeg|webp)/,
    );
    expect((await response.body()).length).toBeGreaterThan(1000);
  }
});

test("home structured data identifies Tian Pok and the canonical website", async ({
  page,
}) => {
  await page.goto("/");
  const nodes = await structuredData(page);
  const person = nodes.find((node) => hasType(node, "Person"));
  const website = nodes.find((node) => hasType(node, "WebSite"));
  expect(person).toMatchObject({ name: "Tian Pok" });
  expect(absoluteUrl(destination(person)!)).toBe(absoluteUrl("/"));
  expect(website).toBeDefined();
  expect(absoluteUrl(destination(website)!)).toBe(absoluteUrl("/"));
});

test("the project collection describes all six discoverable project pages", async ({
  page,
}) => {
  await page.goto("/projects");
  const nodes = await structuredData(page);
  const collection = nodes.find((node) => hasType(node, "CollectionPage"));
  expect(absoluteUrl(destination(collection)!)).toBe(absoluteUrl("/projects"));
  const list = nodes.find((node) => hasType(node, "ItemList"));
  expect(list).toBeDefined();
  const items = listItems(list!);
  expect(items).toHaveLength(projects.length);
  expect(items.map((item) => absoluteUrl(destination(item)!)).sort()).toEqual(
    projects.map(({ slug }) => absoluteUrl(`/projects/${slug}`)).sort(),
  );
  expectBreadcrumbs(nodes, ["/", "/projects"]);
});

test("every project exposes its own work description and breadcrumb hierarchy", async ({
  page,
}) => {
  for (const project of projects) {
    await test.step(project.title, async () => {
      const route = `/projects/${project.slug}`;
      await page.goto(route);
      const nodes = await structuredData(page);
      const work = nodes.find(
        (node) => hasType(node, "CreativeWork") && node.name === project.title,
      );
      expect(work).toBeDefined();
      expect(absoluteUrl(destination(work)!)).toBe(absoluteUrl(route));
      expect(work?.description).toEqual(expect.any(String));
      expect(String(work?.description).length).toBeGreaterThan(30);
      expectBreadcrumbs(nodes, ["/", "/projects", route]);
    });
  }
});

test("robots and sitemap expose exactly the public canonical routes", async ({
  page,
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const directives = await robots.text();
  expect(directives).toMatch(/^User-agent: \*$/im);
  expect(directives).toMatch(/^Allow: \/$/im);
  expect(directives).not.toMatch(/^Disallow: \/$/im);
  expect(directives).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toMatch(/xml/);
  const urls = await page.evaluate(
    (xml) => {
      const document = new DOMParser().parseFromString(xml, "application/xml");
      if (document.querySelector("parsererror"))
        throw new Error("Invalid sitemap XML");
      return [...document.querySelectorAll("url > loc")].map(
        (element) => element.textContent,
      );
    },
    await sitemap.text(),
  );
  expect(urls.map((url) => absoluteUrl(url!)).sort()).toEqual(
    routes.map(absoluteUrl).sort(),
  );
});

test("tracking parameters keep the clean canonical and unknown projects stay out of search", async ({
  page,
}) => {
  await page.goto("/projects/vigour?utm_source=seo-test");
  const canonical = await page
    .locator('head link[rel="canonical"]')
    .getAttribute("href");
  expect(absoluteUrl(canonical!)).toBe(absoluteUrl("/projects/vigour"));

  const response = await page.goto("/projects/this-project-does-not-exist");
  expect(response?.status()).toBe(404);
  const directives = await page
    .locator('meta[name="robots"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("content")).join(","),
    );
  expect(directives).toContain("noindex");
});
