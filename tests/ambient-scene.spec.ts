import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

function scene(page: Page) {
  return page.getByTestId("desktop-construction-scene");
}

async function readLife(page: Page) {
  return scene(page).evaluate((element) => ({
    time: Number(element.getAttribute("data-ambient-time")),
    drone: element.getAttribute("data-drone-position"),
    worker: element.getAttribute("data-worker-position"),
    pose: element.getAttribute("data-worker-pose"),
    progress: element.getAttribute("data-progress"),
    scrollY: window.scrollY,
  }));
}

async function expectLifeFrozen(page: Page) {
  await expect(scene(page)).toHaveAttribute("data-ambient", "paused");
  await expect(scene(page)).toHaveAttribute("data-drone-position", /^\[/);
  await expect(scene(page)).toHaveAttribute("data-worker-position", /^\[/);
  // Observe several real browser frames. A single reading cannot distinguish
  // a paused actor from one whose next update simply has not arrived yet.
  const samples = await scene(page).evaluate(
    (element) =>
      new Promise<string[]>((resolve) => {
        const samples: string[] = [];
        const started = performance.now();
        const sample = () => {
          samples.push(
            JSON.stringify([
              element.getAttribute("data-ambient-time"),
              element.getAttribute("data-drone-position"),
              element.getAttribute("data-worker-position"),
              element.getAttribute("data-worker-pose"),
            ]),
          );
          if (performance.now() - started < 600) requestAnimationFrame(sample);
          else resolve(samples);
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(samples.length).toBeGreaterThan(2);
  expect(new Set(samples).size).toBe(1);
}

async function openOverview(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(scene(page)).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(scene(page)).toHaveAttribute("data-phase", "completed");
  await expect(scene(page)).toHaveAttribute("data-placed-count", "8");
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "false",
  );
}

test("the completed worksite has moving actors without scrolling or a manual motion control", async ({
  page,
}, testInfo) => {
  await openOverview(page);
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  await expect(
    page.getByRole("button", { name: /^(Pause|Resume) scene motion$/ }),
  ).toBeHidden();
  const initial = await readLife(page);
  expect(JSON.parse(initial.drone ?? "null")).toHaveLength(3);
  expect(JSON.parse(initial.worker ?? "null")).toHaveLength(3);
  const before = await scene(page)
    .locator("canvas")
    .screenshot({
      path: testInfo.outputPath("ambient-before.png"),
    });

  await expect
    .poll(async () => (await readLife(page)).time - initial.time)
    .toBeGreaterThan(1.2);
  const moving = await readLife(page);
  expect(moving.drone).not.toBe(initial.drone);
  expect(moving.worker).not.toBe(initial.worker);
  expect(moving.pose).not.toBe(initial.pose);
  expect(Number(moving.progress)).toBe(1);
  expect(moving.scrollY).toBe(initial.scrollY);
  await expect(scene(page)).toHaveAttribute("data-phase", "completed");
  const after = await scene(page)
    .locator("canvas")
    .screenshot({
      path: testInfo.outputPath("ambient-after.png"),
    });
  const beforePixels = await sharp(before).removeAlpha().raw().toBuffer();
  const afterPixels = await sharp(after).removeAlpha().raw().toBuffer();
  expect(afterPixels.length).toBe(beforePixels.length);
  let changedPixels = 0;
  for (let index = 0; index < beforePixels.length; index += 3) {
    if (
      Math.max(
        Math.abs(beforePixels[index] - afterPixels[index]),
        Math.abs(beforePixels[index + 1] - afterPixels[index + 1]),
        Math.abs(beforePixels[index + 2] - afterPixels[index + 2]),
      ) > 20
    )
      changedPixels++;
  }
  expect(
    changedPixels,
    "The actor updates must actually redraw the canvas",
  ).toBeGreaterThan(20);
});

test("ambient actors suspend offscreen and on the document visibility signal", async ({
  page,
}) => {
  await openOverview(page);
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expectLifeFrozen(page);
  const offscreen = await readLife(page);
  await page.mouse.move(20, 200);
  await page.mouse.wheel(0, -10_000);
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  await expect
    .poll(async () => (await readLife(page)).time)
    .toBeGreaterThan(offscreen.time);

  // Headless pages have no OS tab switch. Send the same visibility signal that
  // the browser sends when a tab is hidden, then restore the native property.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectLifeFrozen(page);
  const hidden = await readLife(page);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  await expect
    .poll(async () => (await readLife(page)).time)
    .toBeGreaterThan(hidden.time);
});

test("reduced motion keeps the completed worksite static and hides ambient controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openOverview(page);
  await expectLifeFrozen(page);
  await expect(
    page.getByRole("button", { name: /^(Pause|Resume) scene motion$/ }),
  ).toBeHidden();
  await expect(scene(page)).toHaveAttribute("data-phase", "completed");
});

test("replay freezes ambient life while the crane assembly remains scroll controlled", async ({
  page,
}) => {
  await openOverview(page);
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  await page
    .getByRole("button", { name: "Replay the build", exact: true })
    .click();
  await expect(page.getByTestId("construction-track")).toHaveAttribute(
    "data-animated",
    "true",
  );
  await expect(scene(page)).toHaveAttribute("data-phase", "approach");
  await expectLifeFrozen(page);
  await expect(
    page.getByRole("button", { name: /^(Pause|Resume) scene motion$/ }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Exit replay", exact: true }).click();
  await expect(scene(page)).toHaveAttribute("data-phase", "completed");
  await expect(scene(page)).toHaveAttribute("data-ambient", "running");
  const resumed = await readLife(page);
  await expect
    .poll(async () => (await readLife(page)).time)
    .toBeGreaterThan(resumed.time + 0.2);
});
