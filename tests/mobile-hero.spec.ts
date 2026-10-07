import { expect, test, type Page } from "@playwright/test";

const mobileHeadline = /I build software\.\s*And I care\s*how it feels\./;

async function expectMobileHero(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    mobileHeadline,
  );
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText(/^Software engineer$/i)).toBeVisible();

  const artwork = page.locator(".mobile-construction-art");
  const image = artwork.locator("img");
  await expect(artwork).toBeVisible();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete &&
          element.naturalWidth > 1 &&
          element.currentSrc.endsWith("/images/mobile-construction.webp"),
      ),
    )
    .toBe(true);
  const action = page.getByRole("link", { name: "View my work", exact: true });
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", "#projects");
  await expect(
    page.getByRole("link", { name: "View Projects", exact: true }),
  ).toBeHidden();

  // The mobile composition scrolls directly into the work. There must be no
  // invisible desktop assembly runway between its call to action and projects.
  const track = page.getByTestId("construction-track");
  const stage = page.getByTestId("construction-stage");
  await expect(track).toHaveAttribute("data-animated", "false");
  const trackBounds = await track.boundingBox();
  const stageBounds = await stage.boundingBox();
  expect(trackBounds).not.toBeNull();
  expect(stageBounds).not.toBeNull();
  expect(Math.abs(trackBounds!.height - stageBounds!.height)).toBeLessThan(2);
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`mobile hero fits ${viewport.width}px with readable text and a loaded illustration`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expectMobileHero(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ),
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    for (const line of await page.locator(".hero-heading span:visible").all()) {
      const bounds = await line.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    const action = page.getByRole("link", {
      name: "View my work",
      exact: true,
    });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
    const bounds = await action.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  });
}

test("mobile work button reaches the projects and browser Back restores that section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "View my work", exact: true }).click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await page.getByRole("link", { name: /^Vigour/ }).click();
  await expect(page).toHaveURL("/projects/vigour");
  await page.goBack();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test("reduced motion shows the complete mobile artwork with ordinary scrolling", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectMobileHero(page);
  const illustration = page.locator(".mobile-construction-art > div");
  await expect(illustration).toHaveCSS("opacity", "1");
  const initialTransform = await illustration.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.mouse.wheel(0, 180);
  await expect(illustration).toHaveCSS("transform", initialTransform);
  await page.getByRole("link", { name: "View my work", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  expect(errors, "Reduced-motion hydration must not produce errors").toEqual(
    [],
  );
});

test.describe("mobile without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("the illustration, headline, and work link remain usable", async ({
    page,
  }) => {
    await page.goto("/");
    await expectMobileHero(page);
    await page.getByRole("link", { name: "View my work", exact: true }).click();
    await expect(page).toHaveURL("/#projects");
    await expect(
      page.getByRole("heading", { name: "Portfolio", exact: true }),
    ).toBeInViewport();
  });
});
