import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

function scene(page: Page) {
  return page.getByTestId("desktop-construction-scene");
}

async function expectWebGLScene(page: Page) {
  await expect(scene(page)).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(scene(page).locator("canvas")).toBeVisible();
  await expect(scene(page).locator("img, image")).toHaveCount(0);
}

async function renderedProgress(page: Page) {
  return Number(await scene(page).getAttribute("data-progress"));
}

async function scrollThroughConstruction(page: Page, progress: number) {
  const track = page.getByTestId("construction-track");
  const stage = page.getByTestId("construction-stage");
  const trackBounds = await track.boundingBox();
  const stageBounds = await stage.boundingBox();
  expect(trackBounds).not.toBeNull();
  expect(stageBounds).not.toBeNull();

  const distance = trackBounds!.height - stageBounds!.height;
  const stickyTop = await stage.evaluate((element) => {
    const top = getComputedStyle(element).top;
    return top === "auto" ? 0 : parseFloat(top);
  });
  expect(
    distance,
    "Animation needs a real, scrollable construction track",
  ).toBeGreaterThan(100);
  // Native wheel input exercises sticky layout and the scene's scroll mapping.
  await page.mouse.move(20, 200);
  await page.mouse.wheel(0, trackBounds!.y - stickyTop + distance * progress);
}

async function expectProgress(page: Page, progress: number) {
  await expect
    .poll(async () => Math.abs((await renderedProgress(page)) - progress))
    .toBeLessThan(0.015);
}

async function expectCompletedBuilding(page: Page) {
  await expect(scene(page)).toHaveAttribute("data-phase", "completed");
  await expect(scene(page)).toHaveAttribute("data-placed", "true");
  await expect(scene(page)).toHaveAttribute("data-attached", "false");
  await expectProgress(page, 1);
}

async function expectPinnedStage(page: Page) {
  await expect
    .poll(() =>
      page.getByTestId("construction-stage").evaluate((element) => {
        const pinnedTop = parseFloat(getComputedStyle(element).top);
        return Math.abs(element.getBoundingClientRect().y - pinnedTop);
      }),
    )
    .toBeLessThan(2);
}

async function settleHeroLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function expectOrdinaryFlow(page: Page) {
  const track = page.getByTestId("construction-track");
  const stage = page.getByTestId("construction-stage");
  await expect(track).toHaveAttribute("data-animated", "false");
  const trackBounds = await track.boundingBox();
  const stageBounds = await stage.boundingBox();
  expect(trackBounds).not.toBeNull();
  expect(stageBounds).not.toBeNull();
  expect(Math.abs(trackBounds!.height - stageBounds!.height)).toBeLessThan(2);
  await expect(scene(page)).toBeVisible();
  await expect(scene(page).locator("img, image")).toHaveCount(0);
}

test("a wheel step renders intermediate crane frames instead of snapping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expectWebGLScene(page);
  await settleHeroLayout(page);
  await scrollThroughConstruction(page, 0.28);
  await expectProgress(page, 0.28);
  await expectPinnedStage(page);

  // Diagnostics are written after applying the scene frame. Sampling them
  // checks the rendered timeline rather than a parallel React state value.
  const samples = scene(page).evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        const record = () => {
          values.push(Number(element.getAttribute("data-progress")));
          if (values.length < 90) requestAnimationFrame(record);
          else resolve(values);
        };
        requestAnimationFrame(record);
      }),
  );
  await scrollThroughConstruction(page, 0.6);
  const positions = await samples;
  const intermediate = new Set(
    positions.filter((value) => value > 0.3 && value < 0.58),
  );
  expect(intermediate.size).toBeGreaterThanOrEqual(4);
  const largestJump = Math.max(
    ...positions
      .slice(1)
      .map((value, index) => Math.abs(value - positions[index])),
  );
  expect(largestJump).toBeLessThan(0.22);
  await expectProgress(page, 0.6);
});

test("the crane picks up, carries, seats, and releases its load; scrolling back reverses it", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expectWebGLScene(page);
  await settleHeroLayout(page);
  await expect(scene(page)).toHaveAttribute("data-attached", "false");
  await expect(scene(page)).toHaveAttribute("data-placed", "false");
  const initial = await scene(page).locator("canvas").screenshot();

  await scrollThroughConstruction(page, 0.16);
  await expectProgress(page, 0.16);
  await expect(scene(page)).toHaveAttribute("data-phase", "lower");
  await expect(scene(page)).toHaveAttribute("data-attached", "false");

  await scrollThroughConstruction(page, 0.42);
  await expectProgress(page, 0.42);
  await expect(scene(page)).toHaveAttribute("data-phase", "lift");
  await expect(scene(page)).toHaveAttribute("data-attached", "true");
  await expect(scene(page)).toHaveAttribute("data-placed", "false");
  await expectPinnedStage(page);

  await scrollThroughConstruction(page, 0.59);
  await expectProgress(page, 0.59);
  await expect(scene(page)).toHaveAttribute("data-phase", "slew");
  await expect(scene(page)).toHaveAttribute("data-attached", "true");

  await scrollThroughConstruction(page, 0.74);
  await expectProgress(page, 0.74);
  await expect(scene(page)).toHaveAttribute("data-phase", "seat");
  await expect(scene(page)).toHaveAttribute("data-attached", "true");

  await scrollThroughConstruction(page, 0.87);
  await expectProgress(page, 0.87);
  await expect(scene(page)).toHaveAttribute("data-phase", "release");
  await expect(scene(page)).toHaveAttribute("data-attached", "false");
  await expect(scene(page)).toHaveAttribute("data-placed", "true");

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expect(
    page.getByText("Built. Keep exploring.", { exact: true }),
  ).toBeVisible();
  const completed = await scene(page).locator("canvas").screenshot();
  await testInfo.attach("completed-3d-construction", {
    body: completed,
    contentType: "image/png",
  });
  const before = await sharp(initial).removeAlpha().raw().toBuffer();
  const after = await sharp(completed).removeAlpha().raw().toBuffer();
  expect(after.length).toBe(before.length);
  let changed = 0;
  for (let index = 0; index < before.length; index += 3) {
    if (
      Math.max(
        Math.abs(before[index] - after[index]),
        Math.abs(before[index + 1] - after[index + 1]),
        Math.abs(before[index + 2] - after[index + 2]),
      ) > 20
    )
      changed++;
  }
  // A canvas that never redraws must not pass only because attributes changed.
  expect(changed / (before.length / 3)).toBeGreaterThan(0.002);

  await scrollThroughConstruction(page, 0);
  await expectProgress(page, 0);
  await expect(scene(page)).toHaveAttribute("data-phase", "approach");
  await expect(scene(page)).toHaveAttribute("data-attached", "false");
  await expect(scene(page)).toHaveAttribute("data-placed", "false");
});

test("the completed scene releases into the portfolio and the CTA can skip it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expectWebGLScene(page);
  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  const stage = page.getByTestId("construction-stage");
  const stageBounds = await stage.boundingBox();
  expect(stageBounds).not.toBeNull();
  await page.mouse.wheel(0, stageBounds!.height + 1);
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await expect
    .poll(async () => (await stage.boundingBox())!.y - stageBounds!.y)
    .toBeLessThan(-100);

  await page.goto("/");
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
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
    await settleHeroLayout(page);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeInViewport();
  });
}

test("manually leaving a section anchor is not undone when the lazy scene loads or the viewport changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#projects");
  await settleHeroLayout(page);
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await page.mouse.move(20, 200);
  await page.mouse.wheel(0, -5000);
  await expectWebGLScene(page);
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
  await page.setViewportSize({ width: 1536, height: 900 });
  await settleHeroLayout(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
});

test("returning from a project restores the portfolio beyond the construction track", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Reproduce Back restoring a deep scroll position before the hero's lazy
  // observer runs. Its renderer must remain optional for anchor restoration.
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
  await expectWebGLScene(page);
  await settleHeroLayout(page);
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await expect
    .poll(() =>
      page
        .locator("#projects")
        .evaluate((element) =>
          Math.abs(
            element.getBoundingClientRect().y -
              parseFloat(
                getComputedStyle(document.documentElement).scrollPaddingTop,
              ),
          ),
        ),
    )
    .toBeLessThan(2);
  await page.getByRole("link", { name: /^Vigour/ }).click();
  await expect(page).toHaveURL("/projects/vigour");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vigour");
  await page.goBack();
  await expect(page).toHaveURL("/#projects");
  await settleHeroLayout(page);
  await expect(scene(page)).toHaveAttribute("data-renderer", "loading");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "false",
  );
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test("the crane builds in a tablet viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expectWebGLScene(page);
  await scrollThroughConstruction(page, 0.5);
  await expectProgress(page, 0.5);
  await expectPinnedStage(page);
  await expect(scene(page).locator("canvas")).toBeInViewport({ ratio: 0.9 });
  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  const width = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
});

test("a short viewport keeps the scene in view while construction is pinned", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 568 });
  await page.goto("/");
  await expectWebGLScene(page);
  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expect(scene(page).locator("canvas")).toBeInViewport({ ratio: 0.9 });
  const bounds = await page.getByTestId("construction-stage").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(569);
});

test("reduced motion renders the completed 3D scene with ordinary scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectOrdinaryFlow(page);
  await expectWebGLScene(page);
  await expectCompletedBuilding(page);
  await expect(page.getByText("Scroll to build", { exact: true })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Replay construction" }),
  ).toBeHidden();
  await page.mouse.wheel(0, 100);
  await expectCompletedBuilding(page);
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test("an unavailable WebGL context leaves a vector scene and usable work link", async ({
  page,
}) => {
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
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-renderer", "fallback", {
    timeout: 20_000,
  });
  await expectOrdinaryFlow(page);
  await expect(scene(page).getByTestId("construction-fallback")).toBeVisible();
  await expect(scene(page).locator("img, image")).toHaveCount(0);
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the vector building and portfolio remain usable", async ({ page }) => {
    await page.goto("/");
    await expectOrdinaryFlow(page);
    await expect(
      scene(page).getByTestId("construction-fallback"),
    ).toBeVisible();
    await expect(
      page.getByText("Scroll to build", { exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Replay construction" }),
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
