import { expect, test } from "@playwright/test";
import sharp from "sharp";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`desktop artwork blends into the hero with ${reducedMotion} motion`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByTestId("construction-track")).toHaveAttribute(
      "data-animated",
      String(reducedMotion === "no-preference"),
    );

    const hero = page.getByTestId("construction-stage");
    const bounds = await hero.boundingBox();
    const art = await page.locator(".hero-art").boundingBox();
    expect(bounds).not.toBeNull();
    expect(art).not.toBeNull();
    const renderedArtwork = page.locator(
      ".hero-art > svg, .desktop-construction-fallback img",
    );
    await expect(renderedArtwork).toBeVisible();
    const renderedBounds = await renderedArtwork.boundingBox();
    expect(renderedBounds!.width).toBeGreaterThan(800);
    expect(renderedBounds!.width / renderedBounds!.height).toBeCloseTo(1.5, 2);
    // Both the SVG and static picture align a 3:2 image to the bottom right.
    const scale = Math.min(art!.width / 1536, art!.height / 1024);
    const left = art!.x + art!.width - 1536 * scale - bounds!.x;
    const right = art!.x + art!.width - bounds!.x;
    const top = art!.y + art!.height - 1024 * scale - bounds!.y;
    const screenshot = await hero.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("hero.png"),
    });
    await testInfo.attach("hero", {
      body: screenshot,
      contentType: "image/png",
    });
    const { data, info } = await sharp(screenshot)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number, channel: number) =>
      data[
        (Math.round(y) * info.width + Math.round(x)) * info.channels + channel
      ];
    // A blank or fully faded image must not pass the edge checks below.
    const craneContrast: number[] = [];
    for (let x = 1060; x <= 1300; x += 20) {
      for (let y = 120; y <= 240; y += 20) {
        craneContrast.push(
          pixel(left + x * scale, top + y * scale, 0) -
            pixel(left + x * scale, top + y * scale, 2),
        );
      }
    }
    expect(Math.max(...craneContrast)).toBeGreaterThan(80);

    for (const [name, x, sourceY] of [
      ["left sky", left, 35],
      ["right cloud", right, 400],
    ] as const) {
      const y = top + sourceY * scale;
      const jump = Math.max(
        ...[0, 1, 2].map((channel) =>
          Math.abs(pixel(x - 2, y, channel) - pixel(x + 2, y, channel)),
        ),
      );
      expect(
        jump,
        `${name} must not end at a visible rectangular seam`,
      ).toBeLessThanOrEqual(3);
    }
  });
}

for (const width of [640, 768, 1260, 1440, 1536, 1632]) {
  test(`hero details stay clear of the artwork at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const cue = page.locator(".construction-cue");
    await expect(cue).toBeVisible();
    const description = await page.locator(".hero-description").boundingBox();
    const cueBounds = await cue.boundingBox();
    expect(cueBounds!.x).toBeCloseTo(description!.x, 0);
    const location = await page.locator(".hero-location").boundingBox();
    const actions = await page.locator(".hero-actions").boundingBox();
    expect(actions!.y + actions!.height).toBeLessThan(location!.y);
    expect(location!.y + location!.height + 12).toBeLessThan(cueBounds!.y);

    const stage = await page.getByTestId("construction-stage").boundingBox();
    for (const selector of [
      ".hero-actions",
      ".hero-location",
      ".construction-cue",
    ]) {
      const detail = await page.locator(selector).boundingBox();
      expect(
        detail!.y + detail!.height,
        `${selector} must fit inside the hero`,
      ).toBeLessThan(stage!.y + stage!.height);
    }
  });
}
