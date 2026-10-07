import { expect, test } from "@playwright/test";
import {
  disableWebGL,
  expectNormalHeroFlow,
  expectHeroPoster,
  finishIntroMedia,
  heroScene,
  holdCanvasDownload,
} from "./hero-helpers";

test("the desktop hero never flashes the loading SVG while live 3D is downloading", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const held = await holdCanvasDownload(page);

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await held.requested();
    const scene = page.getByTestId("desktop-construction-scene");
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("data-renderer", "loading");
    await expect(scene.locator("canvas")).toHaveCount(0);
    const fallback = scene.getByTestId("construction-fallback");
    await testInfo.attach("loading-state", {
      body: JSON.stringify({
        heldChunk: held.chunk(),
        renderer: await scene.getAttribute("data-renderer"),
        fallbackVisible: await fallback.isVisible(),
        canvasCount: await scene.locator("canvas").count(),
      }),
      contentType: "application/json",
    });
    await page.getByTestId("construction-stage").screenshot({
      path: testInfo.outputPath("initial-hero-loading.png"),
      animations: "disabled",
    });
    await expect(
      fallback,
      "Waiting for live 3D must not expose the visibly different loading SVG",
    ).toBeHidden({ timeout: 500 });
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("a finished intro retains its poster while the GPU is still loading, then hands off", async ({
  page,
}) => {
  const held = await holdCanvasDownload(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await held.requested();
    await expect(heroScene(page)).toHaveAttribute("data-presentation", "intro");
    await finishIntroMedia(page);
    await expect(heroScene(page)).toHaveAttribute(
      "data-presentation",
      "poster",
    );
    await expect(heroScene(page)).toHaveAttribute("data-renderer", "loading");
    await expectHeroPoster(page);
    await expect(
      heroScene(page).getByTestId("construction-fallback"),
    ).toBeHidden();
    await expectNormalHeroFlow(page);
    held.release();
    await expect(heroScene(page)).toHaveAttribute("data-presentation", "live", {
      timeout: 20_000,
    });
    await expect(
      heroScene(page).getByTestId("construction-poster"),
    ).toBeHidden();
    await expect(heroScene(page).locator("canvas")).toBeVisible();
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("a ready GPU cannot cut off the automatic intro", async ({ page }) => {
  await page.goto("/");
  const scene = heroScene(page);
  const video = scene.getByTestId("construction-intro-video");
  await expect(video).toBeVisible();
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  await expect(scene).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(scene).toHaveAttribute("data-presentation", "intro");
  await expect(scene.locator("canvas")).toBeHidden();
  await expect(scene).toHaveAttribute("data-ambient", "paused");
  await finishIntroMedia(page);
  await expect(scene).toHaveAttribute("data-presentation", "live");
  await expect(scene).toHaveAttribute("data-ambient", "running");
});

test("skipping before WebGL is ready shows the completed poster without exposing the SVG", async ({
  page,
}) => {
  const held = await holdCanvasDownload(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await held.requested();
    await page.getByRole("button", { name: "Skip intro", exact: true }).click();
    await expect(heroScene(page)).toHaveAttribute(
      "data-presentation",
      "poster",
    );
    await expectHeroPoster(page);
    await expect(
      heroScene(page).getByTestId("construction-fallback"),
    ).toBeHidden();
    held.release();
    await expect(heroScene(page)).toHaveAttribute("data-presentation", "live", {
      timeout: 20_000,
    });
  } finally {
    held.release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("unavailable WebGL retains the rendered intro and completed poster with usable navigation", async ({
  page,
}) => {
  await disableWebGL(page);
  await page.goto("/");
  await expect(heroScene(page)).toHaveAttribute("data-renderer", "fallback", {
    timeout: 20_000,
  });
  await finishIntroMedia(page);
  await expect(heroScene(page)).toHaveAttribute("data-presentation", "poster");
  await expectHeroPoster(page);
  await expect(
    heroScene(page).getByTestId("construction-fallback"),
  ).toBeHidden();
  await expectNormalHeroFlow(page);
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

for (const failure of ["autoplay rejected", "decode error"] as const) {
  test(`${failure} retains the poster until the live scene is ready`, async ({
    page,
  }) => {
    if (failure === "autoplay rejected") {
      await page.addInitScript(() => {
        HTMLMediaElement.prototype.play = () =>
          Promise.reject(
            new DOMException(
              "Autoplay denied by test browser",
              "NotAllowedError",
            ),
          );
      });
    }
    const held = await holdCanvasDownload(page);
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await held.requested();
      if (failure === "decode error")
        await heroScene(page)
          .getByTestId("construction-intro-video")
          .dispatchEvent("error");
      await expect(heroScene(page)).toHaveAttribute(
        "data-presentation",
        "poster",
      );
      await expectHeroPoster(page);
      await expect(
        heroScene(page).getByTestId("construction-fallback"),
      ).toBeHidden();
      held.release();
      await expect(heroScene(page)).toHaveAttribute(
        "data-presentation",
        "live",
        { timeout: 20_000 },
      );
    } finally {
      held.release();
      await page.unrouteAll({ behavior: "wait" });
    }
  });
}
