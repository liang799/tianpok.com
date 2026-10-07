import { expect, test } from "@playwright/test";
import {
  enterLiveHero,
  expectNormalHeroFlow,
  expectHeroPoster,
  finishIntroMedia,
  heroScene,
} from "./hero-helpers";

test("the automatic intro and its replay keep ordinary scrolling and hand off to the completed live building", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const scene = heroScene(page);
  await expect(scene).toHaveAttribute("data-presentation", "intro");
  await expect(
    page.getByRole("button", { name: "Skip intro", exact: true }),
  ).toBeVisible();
  await expectNormalHeroFlow(page);
  await expect(scene.getByTestId("construction-fallback")).toBeHidden();
  await page.mouse.wheel(0, 100);
  await enterLiveHero(page);
  await expect(scene).toHaveAttribute("data-phase", "completed");
  await expect(scene).toHaveAttribute("data-placed-count", "8");
  await expect(scene).toHaveAttribute("data-ambient", "running");
  const height = (await page.getByTestId("construction-track").boundingBox())!
    .height;
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.getByTestId("construction-stage").screenshot({
    path: testInfo.outputPath("hero-live.png"),
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Replay the build", exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-presentation", "intro");
  await expect(scene).toHaveAttribute("data-renderer", "webgl");
  await expect(scene).toHaveAttribute("data-phase", "completed");
  await expect(scene).toHaveAttribute("data-ambient", "paused");
  await expectNormalHeroFlow(page);
  await expect
    .poll(() =>
      scene
        .getByTestId("construction-intro-video")
        .evaluate((video: HTMLVideoElement) => video.currentTime),
    )
    .toBeLessThan(1);
  expect(
    (await page.getByTestId("construction-track").boundingBox())!.height,
  ).toBeCloseTo(height, 0);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0);
  await finishIntroMedia(page);
  await expect(scene).toHaveAttribute("data-presentation", "live");
  await expectNormalHeroFlow(page);
  await expect(page.getByText("Scroll to build", { exact: true })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Exit replay", exact: true }),
  ).toBeHidden();
});

test("the work CTA skips directly to the portfolio during the intro", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await expectNormalHeroFlow(page);
});

for (const [hash, heading] of [
  ["projects", "Portfolio"],
  ["about", /Still\s*Building/],
] as const) {
  test(`a direct #${hash} link remains at its destination while the hero loads lazily`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#${hash}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeInViewport();
    await expectNormalHeroFlow(page);
  });
}

test("manually leaving a section anchor is not undone by media, lazy WebGL, or a resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await page.mouse.move(20, 200);
  await page.mouse.wheel(0, -5000);
  await enterLiveHero(page);
  await expectNormalHeroFlow(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
  await page.setViewportSize({ width: 1536, height: 900 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
});

test("browser Back restores the portfolio even when the offscreen renderer stays unloaded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      observe(target: Element) {
        if (
          target.getAttribute("data-testid") === "desktop-construction-scene" &&
          window.location.hash === "#projects"
        )
          return;
        super.observe(target);
      }
    };
  });
  await page.goto("/");
  await enterLiveHero(page);
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await page.getByRole("link", { name: /^Vigour/ }).click();
  await expect(page).toHaveURL("/projects/vigour");
  await page.goBack();
  await expect(page).toHaveURL("/#projects");
  await expect(heroScene(page)).toHaveAttribute("data-renderer", "loading");
  await expectNormalHeroFlow(page);
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

for (const viewport of [
  { width: 768, height: 1024 },
  { width: 1024, height: 568 },
]) {
  test(`intro and live scene fit ${viewport.width}×${viewport.height} without a scroll runway`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expectNormalHeroFlow(page);
    await enterLiveHero(page);
    await expectNormalHeroFlow(page);
    const width = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ),
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
    await page
      .locator("#home")
      .getByRole("link", { name: "View my work", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Portfolio", exact: true }),
    ).toBeInViewport();
  });
}

test("reduced motion opens the completed scene without playing the intro", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectNormalHeroFlow(page);
  await enterLiveHero(page);
  await expect(heroScene(page)).toHaveAttribute("data-phase", "completed");
  await expect(heroScene(page)).toHaveAttribute("data-ambient", "paused");
  await expect(
    page.getByRole("button", { name: /^(Skip intro|Replay the build)$/ }),
  ).toBeHidden();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the prerendered poster and work link remain usable without an SVG flash", async ({
    page,
  }) => {
    await page.goto("/");
    await expectNormalHeroFlow(page);
    await expectHeroPoster(page, false);
    await expect(
      heroScene(page).getByTestId("construction-fallback"),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /^(Skip intro|Replay the build)$/ }),
    ).toBeHidden();
    await page
      .locator("#home")
      .getByRole("link", { name: "View my work", exact: true })
      .click();
    await expect(page).toHaveURL("/#projects");
    await expect(
      page.getByRole("heading", { name: "Portfolio", exact: true }),
    ).toBeInViewport();
  });
});
