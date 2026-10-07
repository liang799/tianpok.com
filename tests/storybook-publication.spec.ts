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

test("published Storybook loads the real construction component and its static assets", async ({
  page,
}) => {
  const errors: string[] = [];
  const failedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
  await expect(preview.getByTestId("desktop-construction-scene")).toBeVisible();

  // Keyboard scrubbing must still drive the real Motion component after the
  // manager and all its imported preview chunks are served from a subdirectory.
  await expect
    .poll(async () => {
      await slider.press("End");
      return preview
        .locator('[data-motion-step="final-artwork"]')
        .evaluate((element) => Number(getComputedStyle(element).opacity));
    })
    .toBe(1);
  const artwork = await page.request.get("/images/desktop-construction.webp");
  expect(artwork.status()).toBe(200);
  expect(artwork.headers()["content-type"]).toContain("image/webp");
  expect(failedAssets).toEqual([]);
  expect(errors).toEqual([]);
});
