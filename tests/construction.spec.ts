import { expect, test, type Locator, type Page } from "@playwright/test";

const assemblyParts = [
  "foundation",
  "letter-stem",
  "letter-cap",
  "workers",
  "scaffold",
] as const;

function part(page: Page, name: (typeof assemblyParts)[number]) {
  return page.locator(`[data-assembly-part="${name}"]`);
}

async function opacity(element: Locator) {
  return element.evaluate((node) => Number(getComputedStyle(node).opacity));
}

async function translation(element: Locator) {
  return element.evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    const matrix = new DOMMatrix(transform === "none" ? undefined : transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
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
  // Wheel input exercises native scrolling and sticky positioning, rather than
  // writing the animation's progress or simulating a component state update.
  await page.mouse.move(20, 200);
  await page.mouse.wheel(0, trackBounds!.y - stickyTop + distance * progress);
}

async function expectCompletedBuilding(page: Page) {
  for (const name of assemblyParts) {
    await expect.poll(() => opacity(part(page, name))).toBeGreaterThan(0.99);
    await expect
      .poll(async () => {
        const position = await translation(part(page, name));
        return Math.abs(position.x) + Math.abs(position.y);
      })
      .toBeLessThan(0.5);
  }
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

async function expectBuildingInViewport(page: Page) {
  for (const name of assemblyParts) {
    await expect(part(page, name)).toBeInViewport({ ratio: 0.95 });
  }
}

async function settleHeroLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Give the hydrated hero's ResizeObserver and its resulting layout a
    // browser frame each before checking the final anchor destination.
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
  const artwork = page.locator(".desktop-construction-fallback img");
  await expect(artwork).toBeVisible();
  await expect
    .poll(() =>
      artwork.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 1,
      ),
    )
    .toBe(true);
}

test("a wheel step moves building pieces through intermediate positions instead of snapping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await settleHeroLayout(page);
  await scrollThroughConstruction(page, 0.28);
  await expectPinnedStage(page);
  const floor = part(page, "letter-stem");
  await expect.poll(async () => (await translation(floor)).y).toBeLessThan(-15);

  // Sample actual rendered transforms while a single native wheel step crosses
  // a floor's assembly range. A direct scroll mapping jumps in one frame.
  const samples = floor.evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        const record = () => {
          const transform = getComputedStyle(element).transform;
          values.push(
            new DOMMatrix(transform === "none" ? undefined : transform).m42,
          );
          if (values.length < 75) requestAnimationFrame(record);
          else resolve(values);
        };
        requestAnimationFrame(record);
      }),
  );
  await scrollThroughConstruction(page, 0.6);
  const positions = await samples;
  const travel = Math.abs(positions[0]);
  expect(travel).toBeGreaterThan(15);
  const intermediate = new Set(
    positions
      .filter((y) => y > positions[0] + 1 && y < -1)
      .map((y) => y.toFixed(1)),
  );
  expect(intermediate.size).toBeGreaterThanOrEqual(4);
  const largestJump = Math.max(
    ...positions.slice(1).map((y, index) => Math.abs(y - positions[index])),
  );
  expect(largestJump).toBeLessThan(travel * 0.7);
  await expect
    .poll(async () => Math.abs((await translation(floor)).y))
    .toBeLessThan(0.5);
});

test("scroll assembles the podium before the TP letter and finishes with workers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await settleHeroLayout(page);

  await scrollThroughConstruction(page, 0.25);
  await expect
    .poll(() => opacity(part(page, "foundation")))
    .toBeGreaterThan(0.99);
  await expect.poll(() => opacity(part(page, "scaffold"))).toBeGreaterThan(0.5);
  expect(await opacity(part(page, "letter-stem"))).toBe(0);
  expect(await opacity(part(page, "letter-cap"))).toBe(0);

  await scrollThroughConstruction(page, 0.55);
  await expect
    .poll(() => opacity(part(page, "letter-stem")))
    .toBeGreaterThan(0.99);
  expect(await opacity(part(page, "letter-cap"))).toBe(0);
  expect(await opacity(part(page, "workers"))).toBe(0);

  await scrollThroughConstruction(page, 0.84);
  await expect
    .poll(() => opacity(part(page, "letter-cap")))
    .toBeGreaterThan(0.99);
  await expect.poll(() => opacity(part(page, "workers"))).toBeGreaterThan(0.15);
  expect(
    await opacity(page.locator('[data-motion-step="final-artwork"]')),
  ).toBe(0);

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expect
    .poll(() => opacity(page.locator('[data-motion-step="final-artwork"]')))
    .toBeGreaterThan(0.99);

  await scrollThroughConstruction(page, 0.25);
  await expect.poll(() => opacity(part(page, "letter-stem"))).toBe(0);
  expect(await opacity(part(page, "foundation"))).toBeGreaterThan(0.99);
  expect(await opacity(part(page, "workers"))).toBe(0);
});

test("scroll assembles the building in stages and scrolling up reverses it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await expect(
    page.getByText("Scroll to build", { exact: true }),
  ).toBeVisible();

  const topFloor = part(page, "letter-cap");
  await expect.poll(() => opacity(topFloor)).toBeLessThan(0.1);
  const initialPosition = await translation(topFloor);
  expect(Math.abs(initialPosition.y)).toBeGreaterThan(10);

  await scrollThroughConstruction(page, 0.5);
  await expect
    .poll(() => opacity(part(page, "foundation")))
    .toBeGreaterThan(0.99);
  await expectPinnedStage(page);
  await expect(part(page, "foundation")).toBeInViewport({ ratio: 0.95 });

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expectBuildingInViewport(page);
  await expect(
    page.getByText("Built. Keep exploring.", { exact: true }),
  ).toBeVisible();

  await scrollThroughConstruction(page, 0);
  await expect.poll(() => opacity(topFloor)).toBeLessThan(0.1);
  await expect
    .poll(async () =>
      Math.abs((await translation(topFloor)).y - initialPosition.y),
    )
    .toBeLessThan(1);
});

test("the completed scene releases into the portfolio and the CTA can skip it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expectBuildingInViewport(page);
  const stage = page.getByTestId("construction-stage");
  const stageBounds = await stage.boundingBox();
  expect(stageBounds).not.toBeNull();
  await page.mouse.wheel(0, stageBounds!.height + 1);
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  // A compact featured-work row can bring the document to its end before the
  // whole hero leaves the viewport. Its upward travel proves the pin released.
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
  test(`a direct #${hash} link remains at its destination after the scroll track is enabled`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#${hash}`);
    await expect(page.getByTestId("construction-track")).toHaveAttribute(
      "data-animated",
      "true",
    );
    await settleHeroLayout(page);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeInViewport();
  });
}

test("returning from a project restores the portfolio beyond the construction track", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page
    .locator("#home")
    .getByRole("link", { name: "View my work", exact: true })
    .click();
  await expect(page).toHaveURL("/#projects");
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
  await page.getByRole("link", { name: /^Vigour/ }).click();
  await expect(page).toHaveURL("/projects/vigour");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vigour");

  await page.goBack();
  await expect(page).toHaveURL("/#projects");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await settleHeroLayout(page);
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test("the building assembles in the tablet viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await expect.poll(() => opacity(part(page, "letter-cap"))).toBeLessThan(0.1);

  await scrollThroughConstruction(page, 0.5);
  await expectPinnedStage(page);
  await expect(part(page, "foundation")).toBeInViewport({ ratio: 0.95 });

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expectBuildingInViewport(page);
  const width = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
});

test("a short viewport keeps the building in view while construction is pinned", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 568 });
  await page.goto("/");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );

  await scrollThroughConstruction(page, 1);
  await expectCompletedBuilding(page);
  await expectPinnedStage(page);
  await expectBuildingInViewport(page);
  const bounds = await page.getByTestId("construction-stage").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(569);
});

test("reduced motion presents the completed building with ordinary scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectOrdinaryFlow(page);
  await expect(page.getByText("Scroll to build", { exact: true })).toBeHidden();
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

  test("the completed building and portfolio remain usable", async ({
    page,
  }) => {
    await page.goto("/");
    await expectOrdinaryFlow(page);
    await expect(
      page.getByText("Scroll to build", { exact: true }),
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
