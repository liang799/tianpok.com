import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { CONSTRUCTION_PIECES } from "../src/lib/construction-plan";
import { enterLiveHero, expectNormalHeroFlow, heroScene } from "./hero-helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`desktop renders a transparent, nonblank 3D scene with ${reducedMotion} motion`, async ({
    page,
  }, testInfo) => {
    const rasterRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /\/images\/[^?]*construction[^?]*\.(webp|png|jpe?g)/.test(request.url())
      ) {
        rasterRequests.push(request.url());
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByTestId("construction-track")).toHaveAttribute(
      "data-animated",
      "false",
    );

    await enterLiveHero(page);
    const scene = heroScene(page);
    await expect(scene).toHaveAttribute("data-renderer", "webgl", {
      timeout: 20_000,
    });
    await expect(scene).toHaveAttribute("data-phase", "completed");
    await expect(scene).toHaveAttribute(
      "data-placed-count",
      String(CONSTRUCTION_PIECES.length),
    );
    await expect(scene.getByTestId("construction-fallback")).toBeHidden();
    const canvas = scene.locator("canvas");
    await expect(canvas).toBeVisible();
    const renderedBounds = await canvas.boundingBox();
    expect(renderedBounds!.width).toBeGreaterThan(400);
    expect(renderedBounds!.height).toBeGreaterThan(250);
    expect(
      await canvas.evaluate((element: HTMLCanvasElement) => {
        const context =
          element.getContext("webgl2") || element.getContext("webgl");
        return context?.getContextAttributes()?.alpha;
      }),
    ).toBe(true);

    const screenshot = await canvas.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("scene-3d.png"),
    });
    const heroScreenshot = await page
      .getByTestId("construction-stage")
      .screenshot({
        animations: "disabled",
        path: testInfo.outputPath("hero-3d.png"),
      });
    await testInfo.attach("hero", {
      body: heroScreenshot,
      contentType: "image/png",
    });
    const { data, info } = await sharp(screenshot)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let orangePixels = 0;
    let darkPixels = 0;
    const shades = new Set<string>();
    for (let index = 0; index < data.length; index += info.channels) {
      const [red, green, blue] = data.subarray(index, index + 3);
      if (red > 130 && red - green > 25 && red - blue > 45) orangePixels++;
      if (Math.max(red, green, blue) < 110) darkPixels++;
      shades.add(`${red >> 4},${green >> 4},${blue >> 4}`);
    }
    // Check the full rendered scene without depending on a particular camera
    // pixel: lit orange machinery and dark structural parts must both exist.
    const pixelCount = info.width * info.height;
    expect(orangePixels / pixelCount).toBeGreaterThan(0.001);
    expect(darkPixels / pixelCount).toBeGreaterThan(0.001);
    expect(shades.size).toBeGreaterThan(40);
    expect(
      rasterRequests,
      "The hero must not download generated artwork",
    ).toEqual([]);
  });
}

for (const width of [640, 768, 1260, 1440, 1536, 1632]) {
  test(`hero details stay clear of the artwork at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const name of ["Skip intro", "Replay the build"] as const) {
      if (name === "Replay the build") await enterLiveHero(page);
      const control = page.getByRole("button", { name, exact: true });
      await expect(control).toBeVisible();
      const description = await page.locator(".hero-description").boundingBox();
      const controlBounds = await control.boundingBox();
      const location = await page.locator(".hero-location").boundingBox();
      const actions = await page.locator(".hero-actions").boundingBox();
      expect(controlBounds!.x).toBeCloseTo(description!.x, 0);
      expect(actions!.y + actions!.height).toBeLessThan(location!.y);
      expect(location!.y + location!.height + 12).toBeLessThanOrEqual(
        controlBounds!.y,
      );
      const stage = await page.getByTestId("construction-stage").boundingBox();
      for (const detail of [actions!, location!, controlBounds!]) {
        expect(detail.y + detail.height).toBeLessThan(stage!.y + stage!.height);
      }
      await expectNormalHeroFlow(page);
    }
  });
}
