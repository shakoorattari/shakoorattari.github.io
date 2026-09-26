# SEO & Performance Roadmap

**Site:** https://shakoorattari.com · **Last reviewed:** 2026-09-26 · **Stack at review:** Angular 16.2, prerendered, GitHub Pages

This is the working plan for making the portfolio as search-friendly and light as possible, including whether to leave Angular. It supersedes the recommendations in [`performance-enhancement-v001.md`](performance-enhancement-v001.md), which is kept as the original audit.

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| 0 | Quick wins on the current Angular site | ✅ Done |
| 1 | Migrate to Astro | ⬜ Not started |
| 2 | Weight: icons, fonts, images, budgets | ⬜ Not started |
| 3 | SEO: structured data, semantic HTML, indexable case studies | ⬜ Not started |
| 4 | Hosting & headers (Cloudflare Pages) | ⬜ Optional |
| 5 | CI hygiene and automated quality gates | ⬜ Not started |

## Measurements

Taken from `npm run prerender` output, sizes with `gzip -9`. **No Lighthouse run has been made since prerendering went live** — the 64 / 88 / 100 / 92 scores in the v001 audit predate it.

| Asset | Before Phase 0 (raw / gzip) | After Phase 0 (raw / gzip) |
|---|---|---|
| `main.*.js` | 369,274 B / 105,273 B | 369,047 B / 105,042 B |
| `polyfills.*.js` | 33,859 B / 12,002 B | 33,859 B / 12,002 B |
| `styles.*.css` | 8,600 B / 2,676 B | 8,600 B / 2,676 B |
| Home HTML (prerendered) | 138 KB raw / ~24 KB gzip | 138 KB raw |

Phase 0 was about metadata, hygiene and *when* things load (Turnstile), so JavaScript weight barely moved. The JS reduction is Phase 1.

## Findings that drive the plan

| Finding | Why it matters | Addressed in |
|---|---|---|
| ~117 KB gzipped of JS (Angular + polyfills + Zone.js) for a mostly static page | Dominates load time and Total Blocking Time | Phase 1 |
| Angular 16 is out of support; `@nguniversal` is deprecated | Staying means a framework upgrade project | Phase 1 |
| Font Awesome 6.0.0 loaded in full from cdnjs; only 28 icons used | Cross-origin render-path cost | Phase 2 |
| Inter in 6 weights plus JetBrains Mono from Google Fonts | Extra connections, layout-shift risk | Phase 2 |
| `/about`, `/skills`, … are prerendered as partial duplicates that all canonicalise to `/`, and scrolling rewrites the URL with `history.replaceState` | Thin duplicate pages; misleading shared / analytics URLs | Phase 1 & 3 |
| Sitemap listed only `/`, with a hard-coded `lastmod` | Stale freshness signal | ✅ Phase 0 |
| Social image was a 335×335 headshot | Cropped or ignored by large-card previews | ✅ Phase 0 |
| JSON-LD email differed from the page; phone number in markup | Inconsistent entity data; scraper exposure | ✅ Phase 0 |
| Turnstile script loaded on every page view | Third-party JS for visitors who never use the form | ✅ Phase 0 |
| `particlesJS` / `AOS` referenced but never loaded | Dead code | ✅ Phase 0 |
| 2 MB unused PNG and a stale committed build in `docs/` | Repo and asset bloat | ✅ Phase 0 |
| GitHub Pages fixes `cache-control: max-age=600`, no custom headers, no brotli | Repeat visits re-fetch hashed assets | Phase 4 |

## Phase 0 — Quick wins ✅

Completed on branch `chore/seo-perf-phase0`.

- [x] 1200×630 `og-image.jpg`; `og:image` / `twitter:image` and declared dimensions updated
- [x] `theme-color` and `apple-touch-icon`
- [x] JSON-LD: email matches the page, phone number removed
- [x] Sitemap generated at build time (`scripts/generate-sitemap.mjs`) with `lastmod` from the last commit touching `src/`; CI fetches full history for this
- [x] Removed dead `particlesJS` / `AOS` code
- [x] Turnstile lazy-loaded on viewport proximity (400px) or field focus; widget height reserved to avoid layout shift
- [x] Deleted the unused 2 MB `shakoor-photo.png` and the stale `docs/` build; `.DS_Store` ignored
- [x] Gave the contact toast's icon-only close button an accessible name (the one unlabeled control found in a template sweep)

Verified with a production prerender and headless Chrome: zero Cloudflare requests on load, script loads when the form nears the viewport or a field is focused, and stays unloaded while the form is ~1,200px away.

## Phase 1 — Migrate to Astro

**Decision:** move to Astro. The site is static content plus one form; Astro ships no JavaScript by default. Upgrading to Angular 20 (standalone, zoneless) would still ship roughly 60–90 KB gzipped of framework for static text.

- [ ] Scaffold Astro with `@astrojs/sitemap`; `site: 'https://shakoorattari.com'`, `trailingSlash: 'always'`; keep `CNAME` in `public/`
- [ ] Move content out of component classes into `src/data/*.ts` (about, skills, experience, projects) and render as plain `.astro` components
- [ ] One canonical `/` page with anchor sections; delete the URL-rewriting scroll logic
- [ ] Replace interactivity with small islands / vanilla JS:
  - mobile menu → `<details>` or ~15 lines
  - scroll-spy → `IntersectionObserver`
  - typing effect → drop, or CSS-only, so the role text is in the HTML
  - contact form → plain `<form>`; keep honeypot, rate limit, and lazy Turnstile
- [ ] Port SCSS to scoped styles; let Astro inline small stylesheets
- [ ] Preview-deploy on a branch before switching the domain

## Phase 2 — Weight

- [ ] Replace Font Awesome with ~28 inline SVGs (or `astro-icon`)
- [ ] Self-host Inter as a Latin-subset variable WOFF2 with `font-display: swap`; drop JetBrains Mono or use the system monospace stack; preload one font file
- [ ] Use Astro `<Image>` for AVIF / WebP, `srcset`, explicit dimensions; `fetchpriority="high"` on the hero photo only
- [ ] Keep one résumé PDF; stop shipping the `.md` résumé as a public asset
- [ ] Add size budgets to CI (e.g. JS ≤ 20 KB gzip, images ≤ 150 KB)

## Phase 3 — SEO

- [ ] Unique `<title>` (≤ 60 chars) and description (≤ 160) per page
- [ ] Structured data generated from the data files: `Person` + `WebSite` + `ProfilePage` linked by `@id`; `BreadcrumbList` on sub-pages; complete `sameAs`
- [ ] Real indexable pages where they earn it — e.g. `/projects/<case-study>/`, each with its own `<h1>`, description and self-canonical
- [ ] Semantic HTML: `<header>` / `<main>` / `<nav aria-label>`, `<section aria-labelledby>`, one `<h1>`, no skipped heading levels (case-study labels are currently `<h4>`)
- [ ] Internal links from hero / About to the case studies; `rel="me"` on profile links
- [ ] Visible location and specialisation copy (Sharjah, UAE; .NET, OAuth 2.0 / OIDC, IAM) — metadata alone does not carry it
- [ ] Add `llms.txt`
- [ ] Search Console: verify domain, submit sitemap, watch coverage and Core Web Vitals

## Phase 4 — Hosting & headers (optional)

GitHub Pages cannot set headers, redirects or brotli. Cloudflare Pages is free and you already use Cloudflare for Turnstile.

- [ ] Move hosting; keep the custom domain
- [ ] `_headers`: `cache-control: public, max-age=31536000, immutable` for hashed assets; CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] `_redirects` for any moved URLs

## Phase 5 — CI hygiene and quality gates

- [ ] Use one package manager and commit its lockfile. Today the repo has `pnpm-lock.yaml`, `.gitignore` excludes `package-lock.json`, and CI runs `npm install` — so CI builds are not reproducible
- [ ] Remove `ssl/server.key` from the repo and rotate it (see Known issues)
- [ ] Lighthouse CI on every push
- [ ] Validate structured data (Rich Results Test / Schema.org validator)
- [ ] Crawler check: `curl -s https://shakoorattari.com/ | grep -c "<h1"` returns content with no JavaScript

### Targets (goals, not yet measured)

| Metric | Target |
|---|---|
| JS shipped | ≤ 20 KB gzipped |
| Lighthouse Performance / SEO / Accessibility | ≥ 95 / 100 / ≥ 95 |
| LCP | < 2.0 s |
| CLS | < 0.05 |

## Known issues

Not fixed by Phase 0 and worth tracking:

1. **Turnstile is not enforced server-side.** `contact.service.ts` never sends the Turnstile token to Web3Forms, so the widget only disables the submit button in the browser. Anyone can POST directly using the (public) access key. Fix: send `cf-turnstile-response` in the payload and enable Turnstile verification in the Web3Forms dashboard.
2. **Dev TLS private key is committed** (`ssl/server.key`). It is a localhost certificate, but private keys should not live in the repo — regenerate locally and gitignore `ssl/`.
3. **CI installs with `npm install` without a lockfile** (see Phase 5).
4. **`index.original.html`** is produced by the Universal prerender step and deployed alongside `index.html`. It is harmless (same canonical) and disappears with the Astro migration.
5. **Accessibility not re-audited.** Icon links have `aria-label`s, but colour-contrast compliance has not been re-checked since the v001 audit.
