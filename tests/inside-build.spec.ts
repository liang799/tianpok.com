import { expect, test } from "@playwright/test";
import { CONSTRUCTION_PIECES } from "../src/lib/construction-plan";

test("the workbench supports keyboard tabs, wrapping, and Home/End", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#inside-the-build");
  const structure = section.getByRole("tab", { name: /Structure/ });
  const components = section.getByRole("tab", { name: /Components/ });
  const motion = section.getByRole("tab", { name: /Motion/ });
  await structure.click();
  await structure.press("ArrowRight");
  await expect(components).toBeFocused();
  await expect(components).toHaveAttribute("aria-selected", "true");
  await expect(structure).toHaveAttribute("tabindex", "-1");
  await expect(
    section.getByRole("tabpanel", { name: /Components/ }),
  ).toBeVisible();
  await components.press("End");
  await expect(motion).toBeFocused();
  await motion.press("ArrowRight");
  await expect(structure).toBeFocused();
  await structure.press("ArrowLeft");
  await expect(motion).toBeFocused();
  await motion.press("Home");
  await expect(structure).toBeFocused();
  await expect(structure).toHaveAttribute("aria-selected", "true");
});

test("structure view outlines the real page and cleans up on Escape and navigation", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#inside-the-build");
  const root = page.locator("html");
  const expose = section.getByRole("button", { name: "Expose page layout" });
  await expose.click();
  await expect(root).toHaveAttribute("data-inspect-layout", "true");
  await expect(
    section.getByRole("button", { name: "Hide page layout" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Exit structure view" }),
  ).toBeVisible();
  const projects = page.locator("#projects");
  await expect(projects).toHaveAttribute("data-component");
  await expect
    .poll(() =>
      projects.evaluate((node) => getComputedStyle(node).outlineStyle),
    )
    .not.toBe("none");
  const header = page.getByRole("banner");
  await expect(header).toHaveAttribute("data-component", "Header");
  await expect
    .poll(() => header.evaluate((node) => getComputedStyle(node).outlineStyle))
    .not.toBe("none");

  await page.keyboard.press("Escape");
  await expect(root).not.toHaveAttribute("data-inspect-layout");
  await expect(expose).toBeFocused();
  await expect(expose).toHaveAttribute("aria-pressed", "false");

  await expose.click();
  const components = section.getByRole("tab", { name: /Components/ });
  await components.click();
  await page.keyboard.press("Escape");
  await expect(root).not.toHaveAttribute("data-inspect-layout");
  await expect(components).toBeFocused();
  await components.press("Home");
  await expose.click();
  await components.click();
  await section.getByRole("link", { name: /^Vigour/ }).click();
  await expect(page).toHaveURL("/projects/vigour");
  await expect(root).not.toHaveAttribute("data-inspect-layout");
  await expect(
    page.getByRole("button", { name: "Exit structure view" }),
  ).toHaveCount(0);
  await page.goBack();
  await expect(section).toBeVisible();
  await expect(root).not.toHaveAttribute("data-inspect-layout");
});

test("project data drives the real card, source example, and destination", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#inside-the-build");
  await section.getByRole("tab", { name: /Components/ }).click();
  const panel = section.getByRole("tabpanel", { name: /Components/ });
  await expect(
    panel.getByRole("heading", { name: "Vigour", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("combobox", { name: "Project data" })
    .selectOption("tree");
  await expect(
    panel.getByRole("heading", { name: "TREE", exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole("heading", { name: "Vigour", exact: true }),
  ).toHaveCount(0);
  await expect(panel.locator("code")).toContainText('slug === "tree"');
  await expect(
    panel.getByRole("img", { name: /TREE environmental organisation/ }),
  ).toBeVisible();
  await panel.getByRole("link", { name: /^TREE/ }).click();
  await expect(page).toHaveURL("/projects/tree");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("TREE");
});

test("motion presets, lift selection, and keyboard scrubbing control the full TP assembly", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#inside-the-build");
  await section.getByRole("tab", { name: /Motion/ }).click();
  const panel = section.getByRole("tabpanel", { name: /Motion/ });
  const slider = panel.getByRole("slider", { name: /Assembly progress/ });
  const scene = panel.getByTestId("desktop-construction-scene");
  await expect(scene).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(scene.locator("canvas")).toBeVisible();

  await panel.getByRole("button", { name: "Start", exact: true }).click();
  await expect(slider).toHaveValue("0");
  await expect(scene).toHaveAttribute("data-phase", "approach");
  await expect(scene).toHaveAttribute("data-attached", "false");
  await expect(scene).toHaveAttribute("data-placed", "false");
  await expect(scene).toHaveAttribute("data-placed-count", "0");
  await expect(scene).toHaveAttribute(
    "data-piece-count",
    String(CONSTRUCTION_PIECES.length),
  );
  await panel.getByRole("button", { name: "Halfway" }).click();
  await expect(slider).toHaveValue("50");
  await expect(panel.getByText("50%", { exact: true })).toBeVisible();
  await expect(panel.locator("code")).toContainText(/input\.set\(0\.50+\)/);
  await expect(scene).toHaveAttribute(
    "data-active-piece",
    CONSTRUCTION_PIECES[4].id,
  );
  await expect(scene).toHaveAttribute("data-phase", "approach");
  await expect(scene).toHaveAttribute("data-attached", "false");
  await expect(scene).toHaveAttribute("data-placed", "false");
  await expect(scene).toHaveAttribute("data-placed-count", "4");
  await expect
    .poll(async () => Number(await scene.getAttribute("data-progress")))
    .toBeCloseTo(0.5, 2);

  const lift = panel.getByRole("combobox", { name: "Inspect a lift" });
  await expect(lift.locator("option")).toHaveCount(CONSTRUCTION_PIECES.length);
  await lift.selectOption("7");
  await expect(slider).toHaveValue("93.8");
  await expect(scene).toHaveAttribute(
    "data-active-piece",
    CONSTRUCTION_PIECES[7].id,
  );
  await expect(scene).toHaveAttribute("data-phase", "slew");
  await expect(scene).toHaveAttribute("data-attached", "true");
  await expect(scene).toHaveAttribute("data-placed-count", "7");
  await lift.selectOption("2");
  await expect(slider).toHaveValue("31.3");
  await expect(scene).toHaveAttribute(
    "data-active-piece",
    CONSTRUCTION_PIECES[2].id,
  );
  await expect(scene).toHaveAttribute("data-phase", "slew");
  await expect(scene).toHaveAttribute("data-placed-count", "2");

  await panel.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(slider).toHaveValue("100");
  await expect(scene).toHaveAttribute("data-phase", "completed");
  await expect(scene).toHaveAttribute("data-placed", "true");
  await expect(scene).toHaveAttribute("data-attached", "false");
  await expect(scene).toHaveAttribute(
    "data-placed-count",
    String(CONSTRUCTION_PIECES.length),
  );
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await expect(scene).toHaveAttribute("data-phase", "approach");
  await expect(scene).toHaveAttribute("data-placed", "false");
  await expect(scene).toHaveAttribute("data-placed-count", "0");
  await slider.press("End");
  await expect(slider).toHaveValue("100");
  await expect(scene).toHaveAttribute("data-phase", "completed");
  await expect(scene).toHaveAttribute("data-placed", "true");
  await expect(scene).toHaveAttribute(
    "data-placed-count",
    String(CONSTRUCTION_PIECES.length),
  );
});

test("the workbench fits 320px and reduced motion keeps manual controls usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page.locator("#inside-the-build");
  for (const tab of ["Structure", "Components", "Motion"]) {
    await section.getByRole("tab", { name: new RegExp(tab) }).click();
    const width = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ),
    }));
    expect(
      width.content,
      `${tab} panel must not widen the page`,
    ).toBeLessThanOrEqual(width.viewport + 1);
  }
  const panel = section.getByRole("tabpanel", { name: /Motion/ });
  const scene = panel.getByTestId("desktop-construction-scene");
  await expect(scene).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20_000,
  });
  await expect(
    panel.getByText("Reduced motion · instant updates"),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(
    panel.getByRole("slider", { name: /Assembly progress/ }),
  ).toHaveValue("100");
  await expect(scene).toHaveAttribute("data-phase", "completed");
  await expect(scene).toHaveAttribute("data-placed", "true");
  await expect(scene).toHaveAttribute(
    "data-placed-count",
    String(CONSTRUCTION_PIECES.length),
  );
  await panel.getByRole("button", { name: "Start", exact: true }).click();
  await expect(scene).toHaveAttribute("data-phase", "approach");
  await expect(scene).toHaveAttribute("data-placed", "false");
  await expect(scene).toHaveAttribute("data-placed-count", "0");
  expect(errors).toEqual([]);
});
