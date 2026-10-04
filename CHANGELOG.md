# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). What a version number means for a website is defined in
[docs/versioning.md](docs/versioning.md). Versions before 1.0.0 (the Angular site) were not versioned.

## [Unreleased]

### Added

- The free IELTS study app at `/ielts/` (a separate site that GitHub Pages serves under this domain) is now linked from the portfolio: an own-project page at `/work/ielts-collocations/` with its screenshot, a card in the Work gallery on the home page and `/work/`, an "IELTS app" link in every footer, a "Live apps on this domain" section in `llms.txt`, and a paragraph about it on the privacy page.
- `robots.txt` also lists the app's own sitemap (`/ielts/sitemap.xml`; crawlers only read `robots.txt` at the domain root) and keeps the third-party essay PDF inside the app out of search results.

### Changed

- `npm run check:seo` knows about separate sites served under this domain: links into `/ielts/` are not treated as broken, `robots.txt` must list their sitemap, and a page built into `dist/ielts/` (which would shadow the app) fails the check.

## [1.5.1] - 2026-10-04

### Fixed

- The theme button is the same height as the nav links on desktop (it was taller). On phones it keeps its larger size beside the menu button.

## [1.5.0] - 2026-10-03

### Added

- The Credly badge for WES International Academic Qualifications, shown first under Certifications in About, linking to its public Credly page. It is a local image, not Credly's embed script, which would load a third-party script on every page view.

### Fixed

- At widths between about 920 and 1100 px the header wrapped onto two lines (the theme button took the space); it now collapses to the menu button below 1100 px.

## [1.4.0] - 2026-10-03

### Added

- **Light and dark themes.** The site follows the visitor's system by default; a header button cycles system → light → dark and remembers the choice. A stored choice is applied before first paint (no flash), native controls and the browser's UI colour follow the theme, and without JavaScript the system theme still applies. Contrast is checked in both themes by `tests/theme.spec.ts`, and Lighthouse audits both (`npm run lighthouse:dark` is new and runs in CI).
- **Komorebi Cameron** (a creative studio website with a custom canvas engine) joins the own projects on `/work/`, with a live link.

### Changed

- Every colour in the site now comes from a theme token; the dark theme looks as before. The nav's quote button now darkens instead of lightening on hover or when current, to keep its text contrast.
- Lighthouse CI is pinned to the light theme explicitly (a browser otherwise audits whatever its host prefers).

## [1.3.0] - 2026-10-03

### Added

- **A quote path for clients:** `/quote/` has a quote form, a WhatsApp button that opens a chat pre-filled with the same text as the email, and a call button. A "Get a quote" button joins the nav, the hero, the footer, the call-to-action panels and the Contact section.
- **Websites & apps gallery:** `/work/` and `/work/<slug>/` show Earth Cone and Lail O Nahar with live screenshots, an Angular UAE-information chatbot (with a plain note on what it does not do), and a link card for HandGestureAI. Own projects are labelled as such. The home page has a matching section.
- **Two client-facing services:** website design & development, and SEO & performance.
- **LinkedIn recommendations:** three, verbatim and attributed, on the home page (above Contact) and on `/services/`, replacing the earlier unsourced "feedback themes".
- **The team:** the site now says the owner works with a team of developers and specialists in front-end, back-end, web design and SEO (the owner's own words; no names or numbers).
- `generate_lead` now reports its channel (`contact_form`, `quote_form`, `whatsapp`, `phone`) and never anything typed. New end-to-end tests for the quote form, the work gallery and the recommendations, and an analytics test for the lead channels.
- Google Analytics 4, **opt-in and off until a Measurement ID is set**: a small consent notice (Accept and Decline styled identically); Google's script is requested only after a visitor accepts, with Consent Mode v2 (advertising signals permanently denied), Google signals off, and a 13-month cookie lifetime. A footer "Privacy choices" button changes the decision and deletes the analytics cookies; Global Privacy Control is honoured.
- A `generate_lead` event when the contact form is sent (never the content of the message).
- A `/privacy/` page, linked from the footer on every page and generated from the build configuration, so it only describes the tools that are actually enabled.
- `docs/analytics.md`: how it works, what it costs, setup steps, and which tool answers which question (Google Analytics measures visitors, not a rating; Search Console and Lighthouse cover search performance and quality).
- `npm run test:analytics`: builds with a fake Measurement ID and runs 15 consent/analytics tests with Google's endpoints mocked; runs in CI.

### Changed

- **Profile photo:** the GitHub avatar (460×460, up from 335 px), now the same portrait as the social card.
- Home page copy, the services hub and the Contact section now speak to clients as well as employers; the nav gains "Work" and a "Get a quote" button and collapses to the menu below 920 px instead of 768 px.
- `/privacy/` describes the quote form and the WhatsApp and phone buttons.
- Lighthouse CI also covers `/work/`, a work page and `/quote/`. The contact and quote forms share one module for the toast, lazy Turnstile, rate limit and Web3Forms delivery.
- GitHub Actions updated to the versions that run on Node 24 (`checkout`, `setup-node`, `upload-artifact`, `download-artifact`, `upload-pages-artifact`, `deploy-pages`), clearing GitHub's Node 20 deprecation warnings. The Pages artifact keeps including `.nojekyll`.
- Dependencies updated within their ranges (sharp, Vite, shiki, sass and others; no major bumps). The built site is byte-identical to before.
- CI test builds (Playwright, Lighthouse) now carry no analytics configuration, so test runs can never send fake visits to the real Google Analytics or Cloudflare properties.
- The Cloudflare Web Analytics beacon is gated by the same build-time configuration helper as Google Analytics.

### Fixed

- Links inside a sentence on content pages are underlined, so they no longer rely on colour alone (WCAG 1.4.1).

## [1.2.0] - 2026-09-27

### Added

- The site version in the footer (for example "v1.2.0"), linked to its GitHub Release, with the build's commit and date in the tooltip.
- `/version.json`: the version, SemVer build metadata (`1.2.0+abc1234`), commit and commit date, plus `data-version` and `data-commit` on `<html>`.
- Release tooling: `npm run release` chooses the next SemVer version from Conventional Commits and writes the changelog section; `npm run check:version` (in CI) keeps `package.json`, `package-lock.json`, `CHANGELOG.md` and git tags consistent; unit tests cover the release logic (`npm run test:unit`).
- After every deploy, CI verifies the live site serves the commit that was just deployed, then tags the version and publishes a GitHub Release (only when the version is new).
- `CHANGELOG.md` (Keep a Changelog format) and `docs/versioning.md`, the versioning policy.

### Changed

- `package.json` now declares the repository, homepage, bugs URL, author and license.

## [1.1.0] - 2026-09-26

### Added

- Six service pages and a "Work with me" hub (web and application development, identity/SSO/OAuth, APIs and integration, architecture and leadership, DevOps/CI-CD, AI tooling and MCP), for employers and clients.
- Three case-study pages and a hub, built from the existing case-study text and the detailed project bullets.
- A blog with draft-by-default posts, RSS and `BlogPosting` structured data, plus a full draft article on this site's rebuild and three outlines (all unpublished).
- A "How I can help" section and case-study links on the home page, footer links and breadcrumbs.
- Structured data for services, case studies, the blog and breadcrumbs; a sitemap listing every page with its own `lastmod`; `llms.txt`.
- Optional Cloudflare Web Analytics and Search Console / Bing verification (off until configured).
- Quality gates: a Prettier check, SEO checks (`npm run check:seo`), a 79-test Playwright suite, and Lighthouse CI with performance, accessibility, best-practices, SEO, Core Web Vitals and size budgets.
- Project instructions (`CLAUDE.md`), `.claude/launch.json`, a project-memory log, and documentation for CI/CD and search visibility.

### Changed

- The home page title is now 58 characters and its description 154 (they were 70 and 243).
- Deploys run every quality gate first and publish the exact build that passed.
- The codebase is formatted with Prettier (whitespace only; the rendered layout was verified identical).

### Fixed

- The `/projects/` hub had an `<h1>` followed by `<h3>` headings (accessibility 0.98), and the blog index had the same latent flaw.
- The old `/projects` redirect no longer hides the case-study hub.

## [1.0.0] - 2026-09-26

### Added

- The site rebuilt with Astro 7 as static HTML: the same design and content, about 2 KB of JavaScript and no third-party requests on load.
- Content moved from component classes into `src/data/*.ts`; SEO metadata and JSON-LD are generated from one data file.
- Inline SVG icons, a self-hosted and preloaded Inter font, and AVIF/WebP images.
- A generated `/sitemap.xml`, a real 404 page, and redirects from the old `/about`, `/skills`, `/experience` and `/contact` URLs to the matching anchors.
- A 1200×630 social sharing card, an apple-touch icon and `theme-color`.

### Changed

- Experience typography now uses the sizes the stylesheet always specified; six invalid `font:` declarations had been silently ignored.
- Navigation is plain anchor links, and the URL is no longer rewritten while scrolling.
- Turnstile loads lazily; the structured-data email now matches the page and the phone number was removed.
- CI moved to Node 22 with a committed `package-lock.json`.

### Fixed

- Unreadable "Copy" buttons (contrast 1.37:1), skipped heading levels, a missing `<main>` landmark and a duplicate `#about` id.
- The résumé markdown uses its original professional portrait again.

### Removed

- The Angular 16 app, its Express server, a 2 MB unused PNG, the committed `docs/` build output and the dev TLS files.

[Unreleased]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.5.1...HEAD
[1.5.1]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/shakoorattari/shakoorattari.github.io/releases/tag/v1.0.0
