import { expect, type Page } from "@playwright/test";

export function heroScene(page: Page) {
  return page.locator("#home").getByTestId("desktop-construction-scene");
}

export async function expectHeroPoster(page: Page, completed = true) {
  const poster = heroScene(page).getByTestId("construction-poster");
  await expect(poster).toBeVisible();
  await expect
    .poll(() =>
      poster.evaluate(
        (image: HTMLImageElement, requireCompleted) =>
          image.complete &&
          image.naturalWidth > 1 &&
          (requireCompleted
            ? image.currentSrc.includes("/media/construction-intro-poster.webp")
            : /\/media\/construction-intro-(start|poster)\.webp/.test(
                image.currentSrc,
              )),
        completed,
      ),
    )
    .toBe(true);
}

export async function finishIntroMedia(page: Page) {
  const video = heroScene(page).getByTestId("construction-intro-video");
  await expect
    .poll(
      () =>
        video.evaluate(
          (element: HTMLVideoElement) =>
            Number.isFinite(element.duration) && element.duration > 0,
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
  // Seek the real media instead of waiting its full duration in every test.
  // Let the browser emit ended naturally so the production handoff runs.
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.currentTime = Math.max(0, element.duration - 0.04);
    await element.play();
  });
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.ended))
    .toBe(true);
}

export async function enterLiveHero(page: Page) {
  const reduced = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  if (
    !reduced &&
    (await heroScene(page).getAttribute("data-presentation")) !== "live"
  ) {
    await finishIntroMedia(page);
  }
  await expect(heroScene(page)).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(heroScene(page)).toHaveAttribute("data-presentation", "live", {
    timeout: 20_000,
  });
  await expect(heroScene(page).locator("canvas")).toBeVisible();
}

export async function expectNormalHeroFlow(page: Page) {
  const track = page.getByTestId("construction-track");
  await expect(track).toHaveAttribute("data-animated", "false");
  await expect
    .poll(() =>
      track.evaluate((element) => {
        const stage = element.querySelector<HTMLElement>(
          '[data-testid="construction-stage"]',
        );
        return Math.abs(
          element.getBoundingClientRect().height -
            (stage?.getBoundingClientRect().height ?? Infinity),
        );
      }),
    )
    .toBeLessThan(2);
  await expect(page.getByTestId("construction-stage")).not.toHaveCSS(
    "position",
    "sticky",
  );
}

export async function holdCanvasDownload(page: Page) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let chunk = "";
  await page.route(
    /\/_next\/static\/chunks\/[^?]*\.js(?:\?.*)?$/,
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes("construction-3d_canvas")) {
        chunk = path;
        await gate;
        await route.continue().catch(() => {});
        return;
      }
      // Production uses hashed chunk names. Identify the canvas module by its
      // context-loss listener and projected-label callback, holding this one
      // fetched response rather than making a second request after release.
      const response = await route.fetch();
      const body = await response.text();
      if (
        body.includes("webglcontextlost") &&
        body.includes("onProjectLabel")
      ) {
        chunk = path;
        await gate;
      }
      await route.fulfill({ response, body }).catch(() => {});
    },
  );
  return {
    release,
    chunk: () => chunk,
    requested: () => expect.poll(() => chunk, { timeout: 10_000 }).not.toBe(""),
  };
}

export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl") || type === "experimental-webgl")
        return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
}
