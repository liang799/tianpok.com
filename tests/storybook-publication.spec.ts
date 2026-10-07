import { expect, test } from "@playwright/test";

const constructionStory =
  "illustrations-desktop-construction-scene--scroll-assembly";

test("published Storybook serves its manager, preview and component index without indexing portfolio pages", async ({
  request,
}) => {
  const [manager, preview, index, home] = await Promise.all([
    request.get("/storybook/index.html"),
    request.get("/storybook/iframe.html"),
    request.get("/storybook/index.json"),
    request.get("/"),
  ]);

  for (const response of [manager, preview, index]) {
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
  expect(await manager.text()).toContain(
    'name="robots" content="noindex, nofollow"',
  );
  expect(await preview.text()).toContain(
    'name="robots" content="noindex, nofollow"',
  );
  const stories = await index.json();
  expect(stories.entries[constructionStory].type).toBe("story");
  expect(home.status()).toBe(200);
  expect(home.headers()["x-robots-tag"]).toBeUndefined();
});

test("published Storybook loads and scrubs the real 3D component without raster artwork", async ({
  page,
}) => {
  const errors: string[] = [];
  const failedAssets: string[] = [];
  const rasterRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      /\/images\/[^?]*construction[^?]*\.(webp|png|jpe?g)/.test(request.url())
    ) {
      rasterRequests.push(request.url());
    }
  });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith("/storybook/") && response.status() >= 400) {
      failedAssets.push(`${response.status()} ${path}`);
    }
  });

  await page.goto(`/storybook/index.html?path=/story/${constructionStory}`);
  const preview = page.frameLocator("#storybook-preview-iframe");
  const slider = preview.getByRole("slider", { name: "Construction progress" });
  await expect(slider).toBeVisible();
  const scene = preview.getByTestId("desktop-construction-scene");
  await expect(scene).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(scene.locator("canvas")).toBeVisible();
  await expect(scene.locator("img, image")).toHaveCount(0);

  // Keyboard scrubbing must still drive the real scene after the
  // manager and all its imported preview chunks are served from a subdirectory.
  await expect
    .poll(async () => {
      await slider.press("End");
      return scene.getAttribute("data-phase");
    })
    .toBe("completed");
  await expect(scene).toHaveAttribute("data-placed", "true");
  await expect(scene).toHaveAttribute("data-attached", "false");
  await slider.press("Home");
  await expect(scene).toHaveAttribute("data-phase", "approach");
  await expect(scene).toHaveAttribute("data-placed", "false");
  expect(rasterRequests).toEqual([]);
  expect(failedAssets).toEqual([]);
  expect(errors).toEqual([]);
});
