# Portfolio — project memory

The log of **what was decided and why**, and where assets came from. `CLAUDE.md` holds the rules for how we work; this file holds the history behind them. Append new entries (with a date) rather than rewriting old ones, and keep it factual.

## Purpose

`shakoorattari.com` is Shakoor Hussain Attari's portfolio. It started as an Angular 16 app prerendered to GitHub Pages, and was rebuilt with Astro in September 2026. The goal moved from "have a nice site" to "be found and hired": audience is both employers and clients, region UAE/GCC first with remote work worldwide (decided 2026-09-26).

## Timeline

| Date | What happened | Where |
| --- | --- | --- |
| Up to 2026-06-13 | Angular 16 + Angular Universal prerender, deployed to GitHub Pages by Actions. Last deploy of that version: 2026-06-13 | git history before PR #1 |
| 2026-09-26 | **Phase 0** quick wins: social card, touch icon, JSON-LD fixes, lazy Turnstile, dead code removed, 2 MB PNG and a committed build folder deleted | PR #1 (first commits) |
| 2026-09-26 | **Astro migration**: same design and content, one page, ~2 KB of JavaScript, no third-party requests | PR #1, merged |
| 2026-09-26 | **Discovery diagnosis**, then service/case-study pages, blog, tracking hooks, SEO guard | PR #2 |
| 2026-09-26 | **CI quality gates** modelled on the sibling `earthcone` project; `CLAUDE.md`, `.claude/`, this file | PR #2 |

## Decisions and why

- **Astro instead of upgrading Angular.** Static content plus one form; Angular 16 was out of support and shipped ~116 KiB of JavaScript. Astro ships none by default.
- **Content extracted programmatically** from the Angular components into `src/data/*.ts` (a bracket-matching script), not retyped — no transcription errors.
- **`scopedStyleStrategy: 'class'`.** Angular's emulated encapsulation gives component styles higher specificity than global ones; the `class` strategy keeps that. (Astro's default `attribute` strategy weighs the same; the `where` strategy adds none and would change the cascade. An earlier note claimed the default adds none — that was wrong, and was corrected after testing.)
- **Invalid CSS was fixed, not preserved.** Six `font: 700 13px/1.4 inherit` declarations are invalid (`inherit` can't be in the shorthand) and were silently ignored, so the old Experience section rendered labels at 16px instead of the 12/10/13px written. The port uses the written sizes.
- **`content-visibility: auto` dropped.** On the one real `<section>` it reserved 900px for a ~430px section and made the page height jump.
- **JetBrains Mono dropped** (system monospace stack for the logo); **Inter** self-hosted as a Latin variable font.
- **`/sitemap.xml` is an endpoint**, not `@astrojs/sitemap`, so the URL that search engines may already know stays stable.
- **Legacy `/projects` redirect removed** once `/projects/` became a real page: an Astro `redirects` entry silently shadows a page at the same path.
- **Blog is draft-by-default** and launches empty; the owner writes or edits every article. Outlines contain prompts, not invented experience.
- **Analytics: Cloudflare Web Analytics** (cookieless, no consent banner) — the owner's choice. Search Console is separate and needs no script.
- **Prettier uses this repo's existing style** (2-space, single quotes, width 120), not earthcone's 4-space config, to avoid rewriting every file. The Astro plugin did not honour `htmlWhitespaceSensitivity: 'strict'` (the output was identical with and without it), so whitespace-sensitive inline markup is guarded with `<!-- prettier-ignore -->` (verified: element geometry is identical before/after across 7 pages at 2 viewports).
- **Playwright is served by `scripts/serve-dist.mjs`**, not `astro preview`, which daemonizes in Astro 7 and reads as a crashed server. Uses system Chrome (`channel: 'chrome'`, preinstalled on GitHub runners).
- **Lighthouse CI pinned to 0.14.0** (same as earthcone) for reproducible results; the local `npm run lighthouse` writes to disk and never uploads.
- **Deploy waits for the gates** via reusable workflows (`ci.yml`, `lighthouse.yml`) and publishes the tested artifact.

## Search-visibility diagnosis (2026-09-26)

Checks run with a web-search tool (not literally Google — confirm in Search Console):

- `site:shakoorattari.com` returned none of the site's pages (only GitHub pages mentioning the domain). The exact name "Shakoor Hussain Attari" returned ZoomInfo, SoundCloud and a Medium comment, not the site.
- The site was technically crawlable (HTTP 200, canonical, valid sitemap, no blocking headers); it had no analytics and no verification tags. Cause: a new domain with no inbound links and no Search Console setup.
- Broad queries are dominated by Indeed/Bayt/Glassdoor and freelance marketplaces; niche technical queries (UAE PASS + OAuth/OIDC + .NET) return mostly Medium posts and small agency blogs — the realistic opportunity.
- The owner's GitHub profile links to the site but lists the location as **Dubai** (the site and résumé say **Sharjah**); 15 public repos, mostly forks/samples, no profile README.
- A public GitHub repo for a client website the owner built (`Attari-Home/earthcone`) appeared in results. It could evidence "website development" as a case study; that is the owner's call, and nothing was added.
- A SoundCloud account under the same name ranks for name searches.

## Branch protection (checked 2026-09-26)

`main` already has an active ruleset, **"Protect main — owner direct push only"**: no deletion, no force-push, PRs need 1 approving review (last-push approval, resolved threads), repository admins bypass always. It has **no required-status-checks rule**, so CI results don't block merges. An earlier note in these docs wrongly said protection was not enabled; it was corrected after reading the ruleset through the API.

## Measurements

Lighthouse 13.5 (mobile, simulated throttling, gzip server, median of 3), Angular Phase 0 build → Astro: performance 87 → 100, accessibility 92 → 100, LCP 3.75 s → 1.50 s, JavaScript transferred 116 KiB → 2.4 KiB, requests 19 → 6, third-party hosts on load 3 → 0. Lighthouse CI 0.14.0 on the six gated pages: 100 / 100 / 100 / 100, LCP 1.05–1.43 s, CLS ≤ 0.001, TBT 0. The first gated run found the `/projects/` hub at 0.98 accessibility (heading order); fixed.

## Asset provenance

| Asset | Origin |
| --- | --- |
| `public/assets/og-image.jpg` (1200×630, ~70 KB) | Generated with Python/Pillow: `#0d1117` base, purple/blue radial glows and a faint grid (matching the hero), a circular portrait with a blue→purple ring, name and role set in Helvetica Neue. The generator script was **not** committed. To change the card, rebuild or replace the file (keep 1200×630, under ~100 KB) and use a new filename — link-preview caches key on the URL. |
| `public/apple-touch-icon.png` (180×180) | Drawn with Pillow from the `favicon.svg` geometry (hexagon + "S", blue→purple gradient) on the `#0d1117` background, full-bleed (iOS applies its own rounding). |
| `public/favicon.svg` | The original logo from the Angular site. |
| `src/assets/profile.jpg` (335×335) | A copy of `public/assets/files/shakoor_pic.jpeg`, the photo the site has always shown. **Lesson:** an early port pulled a _different_ image (the professional portrait) and it was only caught by comparing screenshots side by side — verify an asset by looking at it, not by its filename. |
| `public/assets/files/shakoor-photo.jpg` (280×280, 12 KB) | The professional portrait used by the résumé markdown, resized from the original 1254 px `shakoor-photo.png` (2 MB; deleted from the tree in Phase 0, recoverable from git history at `486e846`). A Phase 0 commit briefly repointed the résumé at the casual photo by mistake; the portrait was restored in the Astro migration. |
| `public/assets/files/ShakoorHussain_Resume_V2.pdf` | The résumé the site links to. `Shakoor_Hussain_Resume.pdf` is an older copy that is published but not linked. |
| `src/content/blog/rebuilding-portfolio-angular-to-astro.md` | Draft article written from the real migration measurements and bugs; unpublished (`draft: true`). |

## Gotchas learned the hard way

- **Prettier and inline whitespace.** The Astro plugin inserted line breaks between adjacent inline spans, widening the header logo by ~20px on every page and adding a space before the period after the LinkedIn link. Found only by comparing every element's bounding box between builds.
- **`astro preview` daemonizes** in Astro 7 (launcher exits, server keeps running) — Playwright's `webServer` sees a crash and a stray server is left running (`npx astro preview stop`).
- **Astro `redirects` shadow real pages** silently (`/projects`).
- **A test harness can lie.** Resizing the viewport to full-page height made `100vh` heroes enormous, so two blank screenshots "matched"; always check that a check can fail.
- **zsh doesn't word-split unquoted variables**, so a `set -- $pair` loop ran six Lighthouse audits against `http://localhost/`; verify the URL recorded in each result.
- **Lighthouse comparisons need a gzip-enabled server** (plain `python -m http.server` doesn't compress).
- The owner's old `ng serve` kept running and recreated `.angular/` in the working tree; it is gitignored.
- Both `pnpm-lock.yaml` and `package-lock.json` used to be gitignored, so CI never had a lockfile.
