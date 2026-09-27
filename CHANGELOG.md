# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). What a version number means for a website is defined in
[docs/versioning.md](docs/versioning.md). Versions before 1.0.0 (the Angular site) were not versioned.

## [Unreleased]

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

[Unreleased]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/shakoorattari/shakoorattari.github.io/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/shakoorattari/shakoorattari.github.io/releases/tag/v1.0.0
