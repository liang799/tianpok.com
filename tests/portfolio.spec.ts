import { expect, test } from "@playwright/test";

const projectRoutes = [
  {
    slug: "vigour",
    title: "Vigour",
    url: "https://github.com/liang799/Vigour",
  },
  {
    slug: "bellcurvehero",
    title: "BellCurveHero",
    url: undefined,
  },
  {
    slug: "tree",
    title: "TREE",
    url: "https://github.com/liang799/CSAD-Project",
  },
  {
    slug: "poketeams",
    title: "PokéTeams",
    url: "https://xd.adobe.com/view/9d1e5b95-4673-45ea-be94-07db8f1edcc0-c84d/",
  },
  {
    slug: "mindfulhacks-bot",
    title: "MindfulHacks Bot",
    url: "https://github.com/liang799/mental-health-sol",
  },
  {
    slug: "onesystem-technologies",
    title: "Onesystem Technologies",
    url: undefined,
  },
];

test("home presents the construction headline and six linked projects", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(
    "Tian Pok — Developer & Builder of Digital Things",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Ideas\s*Under\s*Construction/,
  );
  await expect(
    page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 3 }) }),
  ).toHaveCount(6);

  for (const project of projectRoutes) {
    const card = page.getByRole("link", {
      name: new RegExp(project.title),
    });
    await expect(card).toHaveAttribute("href", `/projects/${project.slug}`);
    const image = card.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }

  await page
    .getByRole("link", { name: "View all projects", exact: true })
    .click();
  await expect(page).toHaveURL("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Built with curiosity.",
  );
});

for (const project of projectRoutes) {
  test(`${project.title} has a working detail page and contact action`, async ({
    page,
  }) => {
    const response = await page.goto(`/projects/${project.slug}`);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${project.title} | Tian Pok`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      project.title,
    );
    await expect(
      page.getByRole("heading", { name: "Overview", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Built with", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to projects", exact: true }),
    ).toHaveAttribute("href", "/projects");

    const image = page.locator(".detail-art").getByRole("img");
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    const projectLink = page.getByRole("link", {
      name: /^(View on GitHub|View design|Visit project)$/,
    });
    if (project.url) {
      await expect(projectLink).toHaveAttribute("href", project.url);
      await expect(projectLink).toHaveAttribute("target", "_blank");
    } else {
      await expect(projectLink).toHaveCount(0);
    }

    const contactHref = await page
      .getByRole("link", { name: "Ask me about this project" })
      .getAttribute("href");
    expect(contactHref).toBe(
      `mailto:hello@tianpok.com?subject=${encodeURIComponent(`Let’s talk about ${project.title}`)}`,
    );
  });
}

test("an unknown project returns the helpful 404 page", async ({ page }) => {
  const response = await page.goto("/projects/this-project-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A little off-plan.",
  );
  await expect(
    page.getByRole("link", { name: "Back home", exact: true }),
  ).toHaveAttribute("href", "/");
  await page.getByRole("link", { name: "View projects", exact: true }).click();
  await expect(page).toHaveURL("/projects");
});

test("project filters update both the visible cards and selection state", async ({
  page,
}) => {
  await page.goto("/projects");
  const filters = page.getByRole("group", {
    name: "Filter projects by category",
  });

  for (const [category, count] of [
    ["All", 6],
    ["Apps", 1],
    ["Web", 3],
    ["Experiments", 2],
    ["All", 6],
  ] as const) {
    const button = filters.getByRole("button", { name: category, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(filters.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(
      page
        .getByRole("link")
        .filter({ has: page.getByRole("heading", { level: 3 }) }),
    ).toHaveCount(count);
    await expect(page.getByRole("status")).toContainText(`Showing ${count}`);
  }
});

test("mobile navigation opens, closes with Escape, and follows a section link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });

  await expect(navigation).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(navigation).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close menu" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(navigation).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.getByRole("button", { name: "Open menu" }).click();
  await navigation.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL("/#projects");
  await expect(navigation).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(
    page.getByRole("heading", { name: "Portfolio", exact: true }),
  ).toBeInViewport();
});

test("contact navigation and email icon address the portfolio owner", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Contact", exact: true }),
  ).toHaveAttribute("href", "mailto:hello@tianpok.com");
  await expect(
    page
      .getByRole("navigation", { name: "Footer navigation" })
      .getByRole("link", { name: "Contact", exact: true }),
  ).toHaveAttribute("href", "mailto:hello@tianpok.com");
  await expect(
    page.getByRole("link", { name: "Email hello@tianpok.com", exact: true }),
  ).toHaveAttribute("href", "mailto:hello@tianpok.com");
});

test("About is the active navigation section at the end of the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const about = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About", exact: true });
  await about.click();
  await expect(about).toHaveAttribute("aria-current", "location");
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`pages fit a ${width}px viewport without horizontal scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const route of [
      "/",
      "/projects",
      "/projects/onesystem-technologies",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
      }));

      expect(
        dimensions.content,
        `${route} overflows at ${width}px`,
      ).toBeLessThanOrEqual(dimensions.viewport + 1);

      if (route === "/") {
        const heading = await page
          .locator(".hero-heading span")
          .last()
          .boundingBox();
        expect(
          heading,
          "The construction heading should have visible bounds",
        ).not.toBeNull();
        expect(
          heading!.x,
          `The hero heading is clipped on the left at ${width}px`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          heading!.x + heading!.width,
          `The hero heading is clipped on the right at ${width}px`,
        ).toBeLessThanOrEqual(dimensions.viewport + 1);
      }
    }
  });
}

test("reduced motion suppresses decorative motion and smooth scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const motion = await page.evaluate(() => {
    const animatedElements = [
      ...document.querySelectorAll(".hero-enter, .hero-art svg g"),
    ];
    const activeDurations = animatedElements.flatMap((element) => {
      const style = getComputedStyle(element);
      return style.animationName === "none"
        ? []
        : style.animationDuration
            .split(",")
            .map((duration) => parseFloat(duration));
    });
    return {
      prefersReducedMotion: matchMedia("(prefers-reduced-motion: reduce)")
        .matches,
      activeDurations,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });

  expect(motion.prefersReducedMotion).toBe(true);
  expect(motion.activeDurations.every((duration) => duration < 0.1)).toBe(true);
  expect(motion.scrollBehavior).toBe("auto");
});
