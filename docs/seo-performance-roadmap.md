# SEO & Performance Roadmap

**Site:** https://shakoorattari.com · **Last reviewed:** 2026-09-26 · **Stack:** Astro 7 (static), GitHub Pages

The working plan for making the portfolio as search-friendly and light as possible. It supersedes the recommendations in [`performance-enhancement-v001.md`](performance-enhancement-v001.md), which is kept as the original audit. For how the Angular → Astro move was done and verified, see [`astro-migration-notes.md`](astro-migration-notes.md).

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| 0 | Quick wins on the Angular site | ✅ Done |
| 1 | Migrate to Astro | ✅ Done |
| 2 | Weight: icons, fonts, images, budgets | 🟡 Mostly done — budgets and résumé assets open |
| 3 | SEO: structured data, semantic HTML, indexable case studies | 🟡 Foundations done — copy lengths, case-study pages, `llms.txt` open |
| 4 | Hosting & headers (Cloudflare Pages) | ⬜ Optional, not started |
| 5 | CI hygiene and quality gates | 🟡 Lockfile, type-check, PR builds done — Lighthouse CI open |

## Measurements

Lighthouse 13.5.0, mobile profile with simulated throttling, served from a local gzip-enabled static server, **median of 3 runs**. "Before" is the Angular build as of Phase 0 (not the older build currently live). These are lab numbers on a local server, so treat them as relative; field data (Search Console / CrUX) is the real measure.

| | Angular (Phase 0 build) | Astro |
|---|---|---|
| Performance | 87 (runs: 87, 87, 97) | **100** (100, 100, 100) |
| Accessibility | 92 | **100** |
| Best practices / SEO | 100 / 100 | 100 / 100 |
| First Contentful Paint | 2.10 s | 0.90 s |
| Largest Contentful Paint | 3.75 s | 1.50 s |
| Total Blocking Time | 12 ms | 0 ms |
| Cumulative Layout Shift | 0.005 | 0.001 |
| JavaScript transferred | 116 KiB | 2.4 KiB |
| Total transferred / requests | 509 KiB / 19 | 90 KiB / 6 |
| Third-party hosts on page load | 3 (cdnjs, fonts.googleapis.com, fonts.gstatic.com) | 0 |

Build output (Astro): one 2.3 KB-gzipped script chunk (contact form); the nav and role-rotator scripts are small enough that Astro inlines them. The prerendered HTML is ~155 KB raw / ~31 KB gzipped, including all CSS and inline SVG icons.

Accessibility findings the migration removed: near-invisible copy buttons (1.37:1 contrast — black button text on a dark surface), skipped heading levels (`h3 → h5/h6`), and a missing `<main>` landmark. Lighthouse is automated only; it does not replace a manual screen-reader pass.

## Findings that drove the plan

| Finding | Status |
|---|---|
| ~117 KB gzipped JS (Angular + polyfills + Zone.js) for a mostly static page | ✅ 2.4 KiB (Phase 1) |
| Angular 16 out of support; `@nguniversal` deprecated | ✅ Removed (Phase 1) |
| Font Awesome 6.0.0 loaded in full from cdnjs; only 28 icons used | ✅ Inline SVG (Phase 1) |
| Inter ×6 weights + JetBrains Mono from Google Fonts | ✅ One self-hosted variable Inter; logo uses the system monospace stack |
| `/about`, `/skills`, … were partial duplicate pages canonicalised to `/`; scrolling rewrote the URL | ✅ One page; legacy URLs redirect to anchors |
| Sitemap listed only `/` with a hard-coded `lastmod` | ✅ Generated, real `lastmod` (Phase 0/1) |
| Social image was a 335×335 headshot | ✅ 1200×630 card (Phase 0) |
| JSON-LD email differed from the page; phone number in markup | ✅ Generated from one data file; phone removed (Phase 0/1) |
| Turnstile loaded on every page view | ✅ Lazy-loaded (Phase 0) |
| `#about` was defined twice (host element and inner section) | ✅ No duplicate IDs |
| No CI lockfile — both `pnpm-lock.yaml` and `package-lock.json` were gitignored | ✅ `package-lock.json` committed; CI uses `npm ci` |
| GitHub Pages fixes `cache-control: max-age=600`, no headers, no brotli | ⬜ Phase 4 |
| Title is 70 chars, description 243 chars (both longer than search results show) | ⬜ Phase 3 |

## Phase 0 — Quick wins ✅

- [x] 1200×630 `og-image.jpg`; `og:image` / `twitter:image` and dimensions updated
- [x] `theme-color` and `apple-touch-icon`
- [x] JSON-LD email matches the page; phone removed
- [x] Sitemap with real `lastmod`
- [x] Removed dead `particlesJS` / `AOS` code
- [x] Turnstile lazy-loaded on viewport proximity or field focus
- [x] Removed the unused 2 MB PNG and the stale committed build in `docs/`
- [x] Accessible name for the toast close button

## Phase 1 — Migrate to Astro ✅

- [x] Astro scaffold; `site`, `trailingSlash: 'always'`, `CNAME` in `public/`
- [x] Content moved from component classes to `src/data/*.ts` (extracted programmatically, not retyped)
- [x] One canonical `/` page with anchor sections; URL-rewriting scroll logic deleted
- [x] Interactivity as small vanilla scripts: mobile menu, scroll-spy (`IntersectionObserver`), role rotator (first role rendered statically), contact form with lazy Turnstile
- [x] Experience expand/collapse is native `<details>` — collapsed content stays in the HTML
- [x] SCSS ported as scoped component styles
- [x] Legacy URLs (`/about`, `/skills`, …) redirect to the matching anchors
- [x] Verified: visual comparison with the Angular build, 55 end-to-end behaviour checks, JS-disabled render
- [ ] Preview deploy before switching the domain — **not possible on GitHub Pages** (no per-branch previews). PRs are build-verified only; previews arrive with Phase 4

## Phase 2 — Weight 🟡

- [x] Font Awesome → inline SVG (`<Icon />`, build-time, no runtime cost)
- [x] Inter: Latin-subset variable WOFF2, self-hosted, preloaded, with a metric-matched fallback; JetBrains Mono dropped
- [x] `<Picture>` with AVIF / WebP, `srcset`, explicit dimensions; `fetchpriority="high"` on the hero photo only
- [ ] Keep one résumé PDF and stop publishing the `.md` résumé (both PDFs and the `.md` are still in `public/assets/files/`)
- [ ] Size budgets in CI (e.g. JS ≤ 20 KB gzip, images ≤ 150 KB)

## Phase 3 — SEO 🟡

- [x] Structured data generated from `src/data/site.ts`: `Person` + `WebSite` + `ProfilePage`, linked by `@id`, no dangling references
- [x] Semantic HTML: `<header>` / `<main>` / `<nav aria-label>` / `<section aria-labelledby>`; one `<h1>`; no skipped levels; skip link
- [ ] Trim the title to ≤ 60 chars and the description to ≤ 160 (current: 70 / 243 — carried over from the original copy, so it's a wording decision)
- [ ] Indexable case-study pages, e.g. `/projects/<case-study>/`, each with its own `<h1>`, description and self-canonical
- [ ] `rel="me"` on profile links; `BreadcrumbList` once sub-pages exist
- [ ] `llms.txt`
- [ ] Search Console: verify the domain, submit `sitemap.xml`, watch coverage and Core Web Vitals
- [ ] Validate structured data with Google's Rich Results Test (locally verified: valid JSON, all `@id` references resolve)

## Phase 4 — Hosting & headers (optional)

GitHub Pages can't set headers, redirects or brotli. Cloudflare Pages is free, gives per-branch preview URLs, and you already use Cloudflare for Turnstile.

- [ ] Move hosting; keep the custom domain
- [ ] `_headers`: `cache-control: public, max-age=31536000, immutable` for `/_astro/*`; CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] `_redirects` (real 301s in place of the meta-refresh pages) for the legacy URLs

## Phase 5 — CI hygiene and quality gates 🟡

- [x] One package manager (npm) with a committed `package-lock.json`; CI runs `npm ci`
- [x] `astro check` (type-check) in CI; pull requests are built but not deployed
- [x] `ssl/` (Angular dev-server TLS files) removed from the tree
- [x] Crawler check with JavaScript disabled: content, headings, JSON-LD all present
- [ ] Lighthouse CI on every push with assertions (Performance ≥ 95, SEO 100, Accessibility ≥ 95, LCP < 2.0 s, CLS < 0.05)

## Known issues

1. **Turnstile is not enforced server-side.** `src/scripts/contact.ts` does not send the Turnstile token to Web3Forms, so the widget only disables the submit button in the browser; anyone can POST directly using the (public) access key. Fix: send `cf-turnstile-response` and enable Turnstile verification in the Web3Forms dashboard. (Behaviour was deliberately preserved in the migration.)
2. **`ssl/server.key` remains in git history.** It was a localhost development certificate for the Angular dev server and is no longer used, so there is nothing to rotate — but it can't be removed from history without a rewrite.
3. **Résumé files are public.** `public/assets/files/ShakoorHussain_Resume.md` contains the phone number and email in plain text and is downloadable (unchanged from before).
4. **Lighthouse results are lab-only.** Confirm with field data once the site has been live for a few weeks.
