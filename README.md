# Tian Pok — Software Engineer

A responsive portfolio built with Next.js App Router, TypeScript, and Tailwind CSS. The desktop hero uses a procedural 3D worksite; mobile preserves its original construction illustration, alongside the original vector logo and real project imagery.

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

### Published component workshop

`npm run build` builds Storybook, stages it in `public/storybook/`, then builds Next.js. The same deployment serves the working component workshop at `/storybook/index.html`; no separate hosting or account is required. Generated Storybook files are ignored by Git and excluded from subsequent Storybook asset inputs, so repeated builds cannot nest copies of the workshop.

`npm run dev` prepares that URL on first run. Run `npm run prepare-storybook` to refresh the published local snapshot after editing stories, or use `npm run storybook` for the live development server. `npm run build-storybook` remains a standalone build into `storybook-static/`. The production browser suite checks the published manager, iframe, story index, keyboard animation controls, and asset requests. Storybook responses and HTML carry `noindex`; the portfolio's crawl settings remain unchanged.

## Content and structure

- `src/data/projects.ts` — project names, descriptions, categories, images, and original external links.
- `src/app/page.tsx` — landing page.
- `src/components/inside-build.tsx` — public interactive workbench for inspecting the page structure, real project cards, and construction motion.
- `src/components/construction-hero.tsx` — desktop scroll progress, responsive scene layout, and phase labels.
- `src/components/desktop-construction-scene.tsx` — 3D scene boundary for the desktop hero and motion workbench, viewport-based loading, and WebGL fallback handling.
- `src/components/mobile-construction-art.tsx` — original mobile illustration and restrained scroll parallax.
- `src/components/construction-3d/models.tsx` — procedural crane, trolley, hook, eight structural pieces, staging pallets, scaffolding, workers, and city geometry.
- `src/components/construction-3d/canvas.tsx` — React Three Fiber canvas, orthographic camera, lighting, shadows, and scene updates.
- `src/components/construction-3d/fallback.tsx` — inline SVG architecture for server rendering and unavailable WebGL.
- `src/lib/construction-plan.ts` — the eight-piece TP assembly plan, with each part's dimensions, staging position, final position, and lifting eyes.
- `src/lib/crane-choreography.ts` — deterministic crane poses and pickup/placement timing across all eight lifts.
- `src/lib/construction-motion.ts` — spring settings shared by the hero and the workbench.
- `src/app/projects/` — filterable project index and individual project pages.
- `src/app/globals.css` — visual theme, responsive layouts, and animation.
- `public/logo.svg` — logo extracted from the provided vector file; also used as the app icon.
- `public/wordmark.svg` — exact outlined TIAN POK lettering from the provided vector, used in the header and footer.
- `public/images/` — locally served WebP project images and mobile construction artwork.

Email actions use `hello@tianpok.com`. The GitHub footer link uses the repository owner's profile. Project links open their original destinations in a new tab. There is no contact-form service, authentication, database, or environment-variable setup to configure.

## Design and behavior

The page includes a mobile navigation menu, section-aware navigation, entrance animations, hover transitions, keyboard focus styling, project category filters, and a custom 404 page.

The **Inside the build** section makes the implementation inspectable. Its Structure tab outlines the real page containers and exposes component boundaries; Escape or the floating exit control restores the normal view, and navigation cleans up inspection mode. Its Components tab renders the actual project card with selectable project data. Its Motion tab renders the actual 3D crane with the desktop hero's shared spring settings and keyboard-accessible progress controls. This manually controlled workbench remains available at mobile sizes. Reduced-motion users can still scrub directly without spring interpolation. Source links point to the choreography and browser tests; the public Storybook workshop exposes isolated components and interaction stories. Code snippets are explanatory excerpts, not a separate implementation.

The desktop footer follows the dark three-column design with the original wordmark, navigation, GitHub, LinkedIn, and email. Mobile uses a compact two-column layout with the brand and tagline beside the location and copyright. Its LinkedIn destination is the profile supplied by Tian Pok.

The light desktop hero presents a real-time 3D worksite built with Three.js and React Three Fiber (`three` and `@react-three/fiber`). Geometry is authored in TypeScript from primitives; the crane, cables, lifting slings, load, buildings, workers, and equipment are individual objects. The transparent WebGL canvas sits over a CSS background. The desktop scene does not load generated artwork, external 3D models, or texture images.

A shared Motion spring smooths native desktop scroll input. All eight structural pieces begin on staging pallets. The crane builds the TP structure through eight complete lifts: the lower T and P columns, their upper columns, the P crossbeam, outer column and roof beam, then the T crown beam. For each piece it lowers the hook, attaches the rigging, lifts clear of the site, moves into position, seats the piece, releases the slings, and travels toward the next pickup. Completed pieces stay in place while the remaining pieces wait on their pallets; the scene never swaps in a finished model. `sampleCrane(progress)` calculates the active lift and every piece's pose from one normalized progress value, so scrolling backward also reverses transitions between lifts. The hero stays in view during the sequence, then releases into the portfolio grid. Section links skip ahead normally, and browser Back restores those destinations even while the offscreen 3D scene remains unloaded.

Mobile preserves its original dark composition, centered headline, orange CTA, and full-width generated construction illustration. `mobile-construction.webp` supplies the artwork, with restrained scroll parallax and no pinned crane sequence or playback controls. Reduced-motion preferences disable that parallax and the desktop's extended scroll track, while the workbench remains manually seekable. The portfolio shows all six projects in a three-column desktop grid, two columns on tablets, and a single column on mobile. Each card includes its image, description, technology tags, and a link to the project page. All navigation and project links remain usable without JavaScript.

The 3D canvas loads as the desktop scene or selected motion workbench approaches the viewport. It renders on demand, caps device pixel ratio at 1.5, and updates Three.js transforms directly instead of rendering React for every frame. The server renders an inline SVG of the completed desktop worksite while WebGL loads. Browsers without JavaScript, unavailable WebGL, and lost graphics contexts retain that static vector scene with ordinary scrolling. The mobile hero retains its original image. The page copy remains server-rendered.

Storybook includes a keyboard-accessible progress slider for inspecting the complete assembly. The Motion workbench also has an **Inspect a lift** selector that seeks to the carrying phase of any of the eight pieces, alongside Start, Halfway, and Complete presets. Browser tests cover every placement, reversal across lift boundaries, actual canvas changes, pinning, section links, navigation back, the original mobile illustration without a hero WebGL canvas, responsive layouts, and fallbacks. The pure choreography tests densely sample the timeline to check cable and sling continuity, safe traversal height, accurate pickup and placement, bounded movement between cycles, and identical poses when seeking backward.

Google fonts are self-hosted by `next/font` at build time; an internet connection is needed for the first font download. Project images are local and served through Next.js image optimization.

## Search and sharing

`src/lib/seo.ts` is the source of truth for the site's identity and canonical origin, `https://www.tianpok.com`, matching the existing production redirect. Every page has its own title, description, canonical URL, Open Graph metadata, and Twitter card. Project previews use their actual images; the home and project index use a branded 1200 × 630 PNG generated at build time at `/share-image`.

`/sitemap.xml` lists the home page, project index, and every project in `src/data/projects.ts`. `/robots.txt` allows crawling and points to that sitemap. Sitemap modification dates are omitted until genuine content-update dates are available. Server-rendered JSON-LD describes Tian Pok, the website, the project collection, individual creative works, and project breadcrumbs.

`npm run test:e2e` includes crawler checks with JavaScript disabled for metadata, structured data, sitemap coverage, social-image responses, canonical query handling, and 404 indexing behavior. Once deployed, submit `https://www.tianpok.com/sitemap.xml` in Google Search Console and inspect the live URLs. Search Console ownership verification is account-specific and is not configured in this repository.

## Asset and content sources

The logo comes from the supplied **Tian Pok Vectors** folder. Project descriptions and links are adapted from [the previous portfolio](https://github.com/liang799/portfolio/blob/main/components/Portfolio.tsx), and project images come from its [public images directory](https://github.com/liang799/portfolio/tree/main/public/images). The OST image comes from the original portfolio's public Cloudinary asset, `dald44vq9/ost-freelance-2_u4ri8d`.

Images are resized to a maximum width of 1200 pixels and saved as WebP for the web. Working original destinations are preserved. The BellCurveHero live-site button and Onesystem blog button are omitted because their destinations failed DNS resolution and returned 404, respectively, when checked on 7 October 2026; their project pages remain available.

The desktop construction geometry and inline SVG fallback are authored locally in `src/components/construction-3d/`. Their orange, warm concrete, and graphite palette follows the supplied design references. There are no downloaded model assets or image textures in the 3D scene. The wordmark and navigation logo remain the supplied original vectors.

The mobile hero uses `public/images/mobile-construction.webp` (1080 × 1440), generated from the supplied design references and compressed to WebP. The earlier desktop images, `desktop-construction.webp` and `desktop-construction-site.webp`, remain as historical design material and are unused by the current desktop hero and motion workbench. The following prompts record how the mobile artwork and former desktop reference images were created.

## Artwork prompts

### Mobile construction illustration

Create a premium cinematic 3D editorial construction illustration for a mobile software engineer portfolio. The attached phone mockup is the composition and style reference ONLY. Output JUST the artwork: absolutely no phone frame, screen, UI, headline, buttons, typography, or watermark. Portrait 3:4 composition. Deep near-black charcoal #0c1011 background seamlessly fading to black at the top and bottom edges. Towering fine orange lattice construction crane on the left, its jib extending across the upper part, hoisting a small pale concrete block with a geometric orange TP monogram. The main building is huge architectural sculptural block initials T and P in pale warm concrete, construction in progress, supported by intricate black scaffolding and orange rails. Orange sunset disc at lower left behind dark city silhouettes. Tiny workers in orange safety vests on scaffolding. Sophisticated realistic materials, warm orange rim light, subtle concrete grain, dramatic shadows. Match the reference's hero illustration composition closely, clean readable silhouette on a small screen. Crane fits fully in the canvas. Building and crane occupy most of the art, not large empty margins. No legible text beyond the architectural TP initials.

### Former desktop construction illustration

Create ONLY the construction artwork from the attached desktop website reference, as a premium wide 3D architectural illustration. NO website UI, text, headline, logo wordmark, buttons, borders, or cards. Canvas landscape 3:2. Warm white #faf9f6 background. Main subject in center-right: sculptural building made from giant T and P letters in pale warm concrete and orange sides, black steel scaffolding below, small workers wearing orange helmets. Orange tower crane behind and to the right, long horizontal jib across the top, a concrete cube hanging at upper center. Minimal pale peach skyline receding behind, smaller construction crane at left, restrained construction blocks on the ground, dark horizontal ground baseline. Closely match the reference artwork's clean realistic isometric style, warm orange light, crisp geometry, soft concrete textures. All crane and building fully visible within canvas; foreground ground meets bottom edge. Composition fills frame, don't leave huge margins. Do not include any typography other than the architectural TP letterforms themselves. Purpose: this will be layered and animated as a hero artwork in a real website; preserve large clear shapes and clean background.

### Former desktop worksite background plate

Edit the attached construction illustration into a clean animation background plate. Keep exact canvas size, camera, all pixel positions, palette, lighting, skyline, left small crane, large top orange tower crane, crane cables/hook, clouds, drone, ground and side buildings unchanged. Remove ONLY the giant central foreground TP concrete-letter building, its supporting black scaffold towers below and beside it, workers standing on this central structure, and the orange concrete cube hanging from the main crane hook. Fill those removed areas with the same warm almost-white sky and distant pale skyline behind. The main orange crane tower must continue naturally to the ground. Keep side worker on ground at right, left side small buildings and foreground blocks. This is the empty worksite before the TP structure is assembled. Do not move or redesign anything else; exact alignment with the original is critical for overlay animation. No text.
