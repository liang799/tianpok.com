# Tian Pok — Ideas Under Construction

A responsive portfolio built with Next.js App Router, TypeScript, and Tailwind CSS. Based on the supplied construction-themed design, with the original vector logo and real project imagery.

## Run locally

Use Node.js 22 or newer.

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

## Asset and content sources

The logo comes from the supplied **Tian Pok Vectors** folder. Project descriptions and links are adapted from [the previous portfolio](https://github.com/liang799/portfolio/blob/main/components/Portfolio.tsx), and project images come from its [public images directory](https://github.com/liang799/portfolio/tree/main/public/images). The OST image comes from the original portfolio's public Cloudinary asset, `dald44vq9/ost-freelance-2_u4ri8d`.

Images are resized to a maximum width of 1200 pixels and saved as WebP for the web. Original destinations are preserved; their continued availability is controlled by the external services.
