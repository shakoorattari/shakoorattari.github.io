# Angular → Astro migration notes

**Date:** 2026-09-26 · **Previous stack:** Angular 16 + Angular Universal prerender · **Now:** Astro 7, static output

The last Angular version lives in git history on the `chore/seo-perf-phase0` branch (and everything before it), so it can be restored if ever needed.

## Why

The site is static content plus one form. Angular shipped ~117 KB of gzipped JavaScript to render text that was already prerendered, needed an out-of-support framework, and pulled in three third-party origins (Font Awesome, Google Fonts). See [`seo-performance-roadmap.md`](seo-performance-roadmap.md) for measurements.

## What maps to what

| Angular | Astro |
|---|---|
| `AppModule`, `RouterModule`, `HomeComponent` | `src/pages/index.astro` — one page, sections in order |
| `*.component.ts` data arrays | `src/data/*.ts` (extracted programmatically) |
| `*.component.html` | `src/components/*.astro` |
| `*.component.scss` (emulated encapsulation) | `<style lang="scss">` scoped per component; `scopedStyleStrategy: 'class'` keeps the same specificity |
| `styles.scss` | `src/styles/global.scss` (tokens and shared utilities unchanged) |
| `index.html` head, JSON-LD | `src/layouts/Base.astro`, generated from `src/data/site.ts` |
| `environment*.ts` | `contactConfig` in `src/data/site.ts` (dev / prod keys via `import.meta.env.DEV`) |
| `ContactService` + `ContactComponent` | `src/scripts/contact.ts` |
| Header / Home scroll handlers | `src/scripts/nav.ts` (scroll-spy via `IntersectionObserver`) |
| Typing effect in `HeroComponent` | `src/scripts/hero-roles.ts` |
| Font Awesome webfont | `<Icon />` — inline SVG resolved at build time |
| `src/sitemap.xml` + build script | `src/pages/sitemap.xml.ts` endpoint (keeps the `/sitemap.xml` URL stable) |
| Angular routes `/about`, `/skills`, `/experience`, `/contact` | Redirects to `/#about`, … (`astro.config.mjs`). `/projects` is now a real page (the case-study hub) and is not redirected |
| `server.ts`, Express SSR, `ssl/` | Removed |
| pnpm / untracked lockfiles | npm with a committed `package-lock.json` |

## Deliberate differences from the Angular site

Most of the page is visually identical. Share of pixels that changed (desktop / mobile): Hero 0.3% / 0.5%, About 0.8% / 1.7%, Skills 0% / 0%, Projects 1.1% / 1.8%, Contact 2.2% / 0.9%, Social Proof + footer 0.2% / 1.9% — mostly sub-pixel text rendering and the icon swaps below. Experience differs by 8–10% because of difference 1. These differences are intentional:

**Visual**

1. **Experience typography now matches what the stylesheet says.** Six declarations of the form `font: 700 13px/1.4 inherit` are invalid CSS (`inherit` can't appear inside the shorthand), so browsers silently dropped them. The Angular site therefore rendered the date labels and the "Current" badge at 16px, project names at 10.7px, and company names at 16px instead of the 12 / 10 / 13 / 13px written. They are now valid declarations with the written sizes. Effect: the Experience section is ~95px shorter on desktop (+43px on mobile), and timeline cards are slightly wider.
2. **`color-scheme: dark`** on the page. Native controls and scrollbars are dark, which fixes the black-on-dark "Copy Email / Phone / Teams ID" buttons (contrast 1.37:1).
3. **Link-style action buttons** ("Open Map", "View Profile") use `#58a6ff` instead of the accent `#2f81f7` — 4.06:1 failed the 4.5:1 requirement.
4. **Logo text** uses the system monospace stack; JetBrains Mono is no longer loaded.
5. **Inter** is now the self-hosted variable font (a different build from Google's), so there are tiny glyph-level differences.

**Behaviour**

6. **Navigation** is plain `#anchor` links. The URL is no longer rewritten to `/about`, `/skills`, … as you scroll, and the browser Back button behaves normally.
7. **Experience details** use native `<details>`. Collapsed content stays in the HTML; open/close animates in Chrome/Edge 131+ and snaps elsewhere.
8. **Typing effect:** the first role is rendered in the HTML and the animation starts from it; it's skipped entirely for `prefers-reduced-motion`. The role line is a `<div>` rather than an `<h2>`.
9. **Contact form:** minimum-length errors now show a message (before, the field just turned red); values are trimmed before validation; inputs have `maxlength`, `autocomplete` and `aria-invalid`; the toast is `role="status"`. Turnstile lazy-loading, the honeypot, the 60 s rate limit and the submission payload are unchanged.
10. **Legacy URLs** (`/about/`, …) are HTML meta-refresh redirects, not HTTP 301s — GitHub Pages can't do server redirects.

**Structure / accessibility**

11. Headings no longer skip levels (`h3 → h5/h6` became `h3 → h4`), there is a `<main>` landmark and a skip link, and `#about` is no longer defined twice.
12. JSON-LD gained `WebSite` and `ProfilePage` nodes linked to `Person`, and X/Twitter in `sameAs`.
13. The footer's third link now uses the X logo and is labelled "X (Twitter)" (it was the Twitter bird; the URL is x.com).

**Removed because it did nothing**

`content-visibility: auto` rules (on Angular's inline `<app-*>` hosts they had no effect, but on the one real `<section class="section social-proof">` they did: a 900px placeholder for a ~430px section, so the page height jumped as you scrolled to the bottom), an `.animated` hover class with no CSS, an unused `--endorsement-level` variable, and a `--mouse-x/--mouse-y` glow whose variables nothing ever set.

## How it was verified

Ad-hoc scripts driving headless Chrome over the DevTools protocol; they are **not** committed to the repo.

- **Visual:** both builds screenshotted per section at 1280px and 390px and compared side by side and by pixel difference.
- **Behaviour (55 checks):** header state, scroll-spy for all six sections, anchor landing offset, mobile menu (open, close on link, Escape), `<details>`, typing effect and reduced motion, and the whole contact form against a mocked Turnstile / Web3Forms / clipboard (empty and invalid states, success, client rate limit, server 429, network failure, honeypot, reset, copy buttons), plus the legacy redirects and the 404 page.
- **Crawler view:** JavaScript disabled — content, heading outline, JSON-LD validity and `@id` references, meta tags, alt text, labels.
- **Lighthouse:** 3 runs per build; see the roadmap for the table.
- **Discrimination check:** the same probes run against the old build fail where they should (third-party requests on load, URL rewriting), which confirms the tests can fail.
- **CI simulation:** clean `npm ci` → `npm run check` → `npm run build`.

Not verified: the live Web3Forms and Turnstile services (mocked; the real Turnstile script *request* was observed), real-device Safari/Firefox, and a manual screen-reader pass. Adding a committed Playwright suite would make these checks repeatable.

## Adding things

- **A job or project:** add an object to `src/data/experience.ts` / `projects.ts`.
- **A section:** create `src/components/Foo.astro` with `<section id="foo" aria-labelledby="foo-title">`, add it to `src/pages/index.astro`, and add a nav entry in `Header.astro` (the scroll-spy picks it up from the link's `href`).
- **An indexable sub-page:** add it under `src/pages/`, give it its own `title` / `description` / `path` through `Base.astro`, and list it in `src/pages/sitemap.xml.ts`.
