# Tian Pok — Ideas Under Construction

A responsive portfolio built with Next.js App Router, TypeScript, and Tailwind CSS. Based on the supplied construction-themed design, with the original vector logo and real project imagery.

## Run locally

Use Node.js 22.12 or newer within the supported Node 22, 24, or 26+ release lines.

```sh
npm install
npm run dev
```

Open http://localhost:3000.

```sh
npm run build       # Optimized production build
npm start           # Serve the production build
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test:e2e    # Chromium browser checks
```

For a fresh machine, install the test browser once with `npx playwright install chromium`. The test configuration starts a local server automatically if one is not running.

To verify a production build, run `npm run build` and `npm start -- --port 3001`, then run `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e` in another terminal.

## Storybook and component tests

```sh
npm run storybook              # Open Storybook at http://localhost:6006
npm run test:storybook         # Run component + accessibility tests in Chromium
npm run test:storybook:watch   # Re-run component tests as you edit
npm run build-storybook        # Generate the static site in storybook-static/
```

Stories are colocated with components in `src/**/*.stories.tsx`. They cover the header, footer, exact vector wordmark, project cards, category filters, and the complete home page at desktop and mobile sizes. Play functions test keyboard filtering, menu dismissal and focus restoration, route selection, link destinations, real image loading, and empty collections. Accessibility violations fail the suite through `@storybook/addon-a11y`.

Vitest runs these tests through Storybook's Next.js Vite integration in a real Chromium browser. It does not need the Next.js development server. The existing Playwright suite remains responsible for actual page navigation and the production application's responsive behavior.

Storybook shares the site's Tailwind styles and font definitions. `.storybook/redirect-boundary.tsx` is a Storybook-only compatibility adapter for Next.js 16.4's new layout cache context; it preserves the real redirect boundary and leaves production bundling unchanged. Remove the adapter when Storybook's router provider supports `parentRenderTree`.

## Content and structure

- `src/data/projects.ts` — project names, descriptions, categories, images, and original external links.
- `src/app/page.tsx` — landing page.
- `src/app/projects/` — filterable project index and individual project pages.
- `src/components/construction-scene.tsx` — original SVG crane, city, excavator, and architecture artwork.
- `src/app/globals.css` — visual theme, responsive layouts, and animation.
- `public/logo.svg` — logo extracted from the provided vector file; also used as the app icon.
- `public/wordmark.svg` — exact outlined TIAN POK lettering from the provided vector, used in the header and footer.
- `public/images/` — locally served, optimized WebP project images.

Email actions use `hello@tianpok.com`. The GitHub footer link uses the repository owner's profile. Project links open their original destinations in a new tab. There is no contact-form service, authentication, database, or environment-variable setup to configure.

## Design and behavior

The page includes a mobile navigation menu, section-aware navigation, subtle crane and excavator motion, entrance animations, hover transitions, keyboard focus styling, project category filters, and a custom 404 page. Reduced-motion preferences suppress decorative animation and smooth scrolling. Content remains visible without JavaScript.

Google fonts are self-hosted by `next/font` at build time; an internet connection is needed for the first font download. Project images are local and served through Next.js image optimization.

## Search and sharing

`src/lib/seo.ts` is the source of truth for the site's identity and canonical origin, `https://www.tianpok.com`, matching the existing production redirect. Every page has its own title, description, canonical URL, Open Graph metadata, and Twitter card. Project previews use their actual images; the home and project index use a branded 1200 × 630 PNG generated at build time at `/share-image`.

`/sitemap.xml` lists the home page, project index, and every project in `src/data/projects.ts`. `/robots.txt` allows crawling and points to that sitemap. Sitemap modification dates are omitted until genuine content-update dates are available. Server-rendered JSON-LD describes Tian Pok, the website, the project collection, individual creative works, and project breadcrumbs.

`npm run test:e2e` includes crawler checks with JavaScript disabled for metadata, structured data, sitemap coverage, social-image responses, canonical query handling, and 404 indexing behavior. Once deployed, submit `https://www.tianpok.com/sitemap.xml` in Google Search Console and inspect the live URLs. Search Console ownership verification is account-specific and is not configured in this repository.

## Asset and content sources

The logo comes from the supplied **Tian Pok Vectors** folder. Project descriptions and links are adapted from [the previous portfolio](https://github.com/liang799/portfolio/blob/main/components/Portfolio.tsx), and project images come from its [public images directory](https://github.com/liang799/portfolio/tree/main/public/images). The OST image comes from the original portfolio's public Cloudinary asset, `dald44vq9/ost-freelance-2_u4ri8d`.

Images are resized to a maximum width of 1200 pixels and saved as WebP for the web. Working original destinations are preserved. The BellCurveHero live-site button and Onesystem blog button are omitted because their destinations failed DNS resolution and returned 404, respectively, when checked on 7 October 2026; their project pages remain available.
