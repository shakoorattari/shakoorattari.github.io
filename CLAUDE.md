# CLAUDE.md

This file guides Claude Code (and any contributor) working in this repository. It defines the purpose, architecture, conventions, quality bar and workflow for Shakoor Hussain Attari's portfolio site. Keep it updated as decisions change — it is the source of truth for _how we work_; `docs/project-memory.md` is the log of _what was decided and why_.

## 1. Project overview

**shakoorattari.com** is the personal portfolio of **Shakoor Hussain Attari** — Lead Software Engineer, Full-Stack Developer & Application Architect, based in Sharjah, UAE, with 15+ years of enterprise delivery for UAE government entities (.NET / ASP.NET Core, Angular, OAuth 2.0 / OIDC, multi-tenant IAM, Azure DevOps, MCP servers / AI tooling).

The site's job is to get the owner **found and hired**. Audience (decided 2026-09-26): **both** employers/recruiters hiring senior engineers and architects, **and** clients who need websites or applications built. Region: **UAE/GCC first, open to remote work worldwide.**

- The site had **no search visibility** at the start of this work (not in the index, not even findable by name) and **no analytics**. Getting discovered is a first-class goal, not an afterthought — see `docs/visibility-playbook.md`.
- Broad terms ("hire .NET developer UAE") are owned by job boards. Win on **name searches** and **niche technical queries** (UAE PASS, multi-tenant OIDC, MCP servers). Don't chase rankings with volume.

Non-negotiable quality bar for every page shipped: **fast, accessible, SEO-optimized, AI/answer-engine friendly, and truthful.**

### Content rules (read before writing any copy)

- **The résumé is the source of truth** (`public/assets/files/ShakoorHussain_Resume.md`) together with `src/data/*`. Every claim on service, case-study and blog pages must come from them.
- **Never invent** clients, employers, numbers, prices, testimonials, awards or experiences. If a fact isn't in the résumé, ask the owner.
- **Blog posts are drafts until the owner finishes them.** Never set `draft: false` or publish on their behalf. Outlines use bracketed prompts for details only the owner knows.
- Government work is sensitive: no internal hostnames, tenant names, client IDs or unreleased details in public copy.
- The owner's public email is `binmushtaq@gmail.com`; `shakoorattari@outlook.com` is a Teams ID only. The phone number is public on the page but deliberately **not** in structured data.

## 2. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | [Astro 7](https://astro.build/) (static output, Node ≥ 22.12) | Ships no JavaScript by default; the site is static content plus one form |
| Styling | SCSS, scoped per component + one global stylesheet | Ported from the original Angular design; `scopedStyleStrategy: 'class'` keeps component styles beating global ones |
| Interactivity | Three small vanilla-TS scripts in `src/scripts/` | No UI framework; ~2 KB of JS in total |
| Icons | Font Awesome 6 glyphs inlined as SVG via `<Icon />` (Iconify JSON packages) | No icon font, no runtime cost |
| Fonts | Inter (Latin subset, variable), self-hosted via `@fontsource-variable/inter`, preloaded | No third-party font requests |
| Images | `astro:assets` `<Picture>` → AVIF/WebP with explicit dimensions | Small, no layout shift |
| Content | Astro Content Collections (Markdown) for the blog | Schema-validated; `draft` defaults to `true` |
| Forms | Web3Forms + Cloudflare Turnstile (lazy) + honeypot + client rate limit | No backend needed |
| Hosting | GitHub Pages (Actions deploy) at `shakoorattari.com` via `public/CNAME` | Free, simple |
| Analytics | **Google Analytics 4, opt-in** behind a consent notice (optional, off until `GA_MEASUREMENT_ID` is set) and/or Cloudflare Web Analytics (optional, cookieless, off until a token is set) | Owner asked for GA on 2026-10-03; Cloudflare was the 2026-09-26 choice and stays. GA's script is ~150 KB, so it is opt-in to keep the "no third-party requests on load" rule — see `docs/analytics.md` |
| Language | TypeScript (strict) | |
| Quality gates | Prettier, `astro check`, `scripts/check-seo.mjs`, Playwright, Lighthouse CI | Mirrors the sibling `earthcone` project — see §10 |

Do not introduce a second frontend framework (React/Vue/etc.). If a feature truly needs interactivity, write a small script or an Astro island — and keep the JS budget (§6).

The gates and conventions deliberately mirror the sibling project at `../earthcone` (Earth Cone, `Attari-Home/earthcone`). When that project's CI changes, consider whether this one should follow.

## 3. Target architecture

```
public/                 Served as-is at the same URLs as the old Angular site (do not move these)
  CNAME  .nojekyll  robots.txt  favicon.svg  apple-touch-icon.png
  assets/og-image.jpg    1200×630 social card (generated; see docs/project-memory.md)
  assets/files/          Résumé PDFs + markdown, shakoor_pic.jpeg, shakoor-photo.jpg — public URLs, keep names
src/
  data/                  ALL content and site config — edit these, not the components
    site.ts              Identity, SEO copy, contact details, socials, `contactConfig`, `tracking` (GA id, Cloudflare token, verification tags)
    about.ts skills.ts experience.ts projects.ts
    services.ts          The six service pages (copy, deliverables, selected work, related links)
    caseStudies.ts       Case-study pages = projects.ts joined with the detailed bullets in experience.ts
  content/blog/          Articles + outlines (Markdown). `draft: true` until the owner finishes; `outline: true` never renders
  content.config.ts      Blog schema (title ≤ 70, optional seoTitle ≤ 60, description 70–160)
  components/            Header, Hero, About, Services, Skills, Experience, Projects, Contact, SocialProof, Footer,
                         Icon, Breadcrumbs, CtaPanel, AnalyticsConsent — one .astro file each, styles scoped inside it
  layouts/
    Base.astro           <head>: title/description/canonical, Open Graph, Twitter, JSON-LD, verification tags, analytics, font preload
    Page.astro           Content-page layout (breadcrumbs + BreadcrumbList JSON-LD + shared page styles)
  pages/
    index.astro          Home: hero, about, services, skills, experience, case studies, contact, trust signals
    services/            /services/ hub + /services/<slug>/
    projects/            /projects/ hub + /projects/<slug>/   (NOT redirected — see §4)
    blog/                /blog/ + /blog/<slug>/ (dev previews drafts; production builds only published posts)
    privacy.astro        /privacy/ — generated from the build config: describes only the tools that are enabled
    404.astro  sitemap.xml.ts  rss.xml.ts  llms.txt.ts  version.json.ts
  scripts/               nav.ts (menu, scroll-spy, footer year) · hero-roles.ts (role rotator) · contact.ts (the form) ·
                         analytics.ts (opt-in GA4: consent, load, withdraw; bundled only when an ID is set)
  lib/                   lastmod.ts (git date), blog.ts (published vs preview), schema.ts (Person/WebSite JSON-LD refs),
                         version.ts (build info: version + commit, resolved at build time),
                         analytics.ts (what this build ships; a malformed GA id fails the build)
  styles/global.scss     Design tokens (--gh-* GitHub-dark palette) and shared utilities
  assets/profile.jpg     Source photo Astro resizes to AVIF/WebP (a 335px source — do not request wider variants)
scripts/                 check-seo.mjs (post-build SEO guard) · check-version.mjs · release.mjs · release-notes.mjs ·
                         serve-dist.mjs (static server for tests) · lib/release.mjs (+ unit tests)
tests/                   Playwright: health, navigation, mobile, contact-form, seo (+ helpers.ts)
CHANGELOG.md             Keep a Changelog; the source of the GitHub Release notes
docs/                    ci-cd, versioning, roadmap, visibility playbook, migration notes, original audit, project-memory
.github/                 workflows: ci.yml · lighthouse.yml · deploy.yml — and the PR template
.claude/launch.json      Dev / preview server configs for the Claude app
astro.config.mjs         site URL, trailingSlash 'always', inlined CSS, legacy redirects
```

Keep one component per file; colocate its styles in a `<style lang="scss">` block. Shared styles for content pages live in `Page.astro`'s `<style is:global>`.

## 4. SEO strategy

- **Structured data is generated from `src/data/site.ts`** so it can't drift from the page. The home page carries the full `Person` + `WebSite` + `ProfilePage` graph; other pages carry self-describing references (`src/lib/schema.ts`: type + `@id` + name + url) plus `Service`, `WebPage`, `BlogPosting`, `CollectionPage` and `BreadcrumbList` as appropriate. Never leave an `@id`-only reference dangling on a page.
- **Titles ≤ 60 characters, descriptions 70–160**, unique per page — enforced by `npm run check:seo`. Blog posts may set `seoTitle`.
- **One page, one intent.** Service pages (`/services/<slug>/`) target skill/role searches; case studies (`/projects/<slug>/`) are the proof. **Do not mass-generate thin "X in [city]" or "skill of the week" pages** — that is doorway spam and gets penalised. Add a page only when there is genuinely unique, résumé-backed content for it.
- **Keyword ↔ page map** lives in `docs/visibility-playbook.md` §6. Update it when pages are added.
- **Technical basics:** self-canonical URLs, trailing slashes everywhere, `robots.txt` → sitemap, `sitemap.xml` (every indexable page, own `lastmod`), `rss.xml`, `llms.txt`, breadcrumbs, no orphan pages (everything reachable from nav, footer or a page body).
- **Legacy URLs:** `/about`, `/skills`, `/experience`, `/contact` redirect to the home anchors (`astro.config.mjs` `redirects`, HTML meta-refresh — GitHub Pages cannot do 301s). **A `redirects` entry silently shadows a real page at the same path** (Astro warns about nothing): `/projects` was removed from the list for exactly this reason. `check:seo` catches it via the sitemap comparison.
- **The blog launches empty on purpose.** `/blog/` is `noindex` and the nav/footer/RSS/sitemap entries appear only once a post is published.
- **Off-site work** (Search Console, analytics token, LinkedIn/GitHub/Medium links, publishing articles) needs the owner's accounts and voice — it is tracked in `docs/visibility-playbook.md`, not automated here.

## 5. AI-friendliness / Answer Engine Optimization (AEO)

- `llms.txt` is generated from the same data files as the sitemap (`src/pages/llms.txt.ts`); it stays in sync automatically.
- Clean semantic HTML that reads correctly with CSS and JS disabled: `<header>`, `<main>`, `<nav aria-label>`, `<section aria-labelledby>`, one `<h1>`, no skipped heading levels. The whole résumé content is in the HTML (collapsed experience details are `<details>`, still in the DOM).
- Descriptive `alt` text on every image; explicit `width`/`height`.
- Write direct, specific answers in copy ("what I deliver", "selected work"). Add `FAQPage` JSON-LD only where there is real client Q&A — never invented questions.

## 6. Performance budget

Enforced by Lighthouse CI (`lighthouserc.json`, mobile, median of 3 runs, six representative pages):

| Assertion | Threshold | Measured at last review |
| --- | --- | --- |
| Performance / Accessibility / Best practices / SEO | ≥ 0.95 / **= 1** / ≥ 0.95 / **= 1** | 1.00 across the board |
| LCP · CLS · TBT | ≤ 2000 ms · ≤ 0.05 · ≤ 150 ms | 1.05–1.43 s · ≤ 0.001 · 0 ms |
| JavaScript transferred | ≤ 20 KB | 2.6 KB (home) |
| Third-party requests | ≤ 2 | 0 |
| Total page weight | ≤ 200 KB | 60–95 KB |

Rules to stay inside the budget:

- **No third-party requests on load.** Turnstile loads lazily (form within 400px, or a field focused); the optional Cloudflare beacon is the only third party that loads for everyone. **Google Analytics is opt-in:** `gtag.js` (~150 KB on the wire, measured) is requested only after a visitor clicks Accept, so a visitor who hasn't agreed makes zero Google requests. Never load Google's script before consent, and don't switch to "advanced" consent mode, without the owner deciding it.
- CSS is inlined (`inlineStylesheets: 'always'`); fonts self-hosted and preloaded; images through `astro:assets`; icons inlined SVG.
- No client-side framework, no polyfills, no libraries for things a few lines of vanilla TS can do.
- Don't apply `content-visibility: auto` to real sections: with `contain-intrinsic-size` it reserved a wrong height and made the page height jump (it was a bug in the old Angular version).
- These are lab numbers. Confirm with field data (Search Console → Core Web Vitals) once the site has traffic.

## 7. Accessibility

- WCAG 2.1 AA minimum; Lighthouse Accessibility must stay at **1.0**.
- Colour contrast: text on `--gh-canvas-*` surfaces needs 4.5:1. The accent blue `#2f81f7` is only 4.06:1 on `--gh-canvas-overlay`; use `#58a6ff` for small text there (see `a.action-btn` in `Contact.astro`).
- `<html>` sets `color-scheme: dark` so native controls (buttons, scrollbars) render light-on-dark; without it default button text is black on a dark page.
- Every icon-only link or button needs an accessible name; the skip link and visible focus states must keep working; `prefers-reduced-motion` disables the role animation and animations globally.
- Forms: labelled inputs, inline errors with `aria-invalid`, toast is `role="status"`.

## 8. Coding conventions

- TypeScript strict; no `any` without a comment. Content lives in `src/data/`, never hard-coded in a component.
- **Prettier is the formatter of record** (`npm run format` / `npm run lint`), 2-space indent, single quotes, print width 120. Don't hand-format.
- **Inline whitespace is significant in HTML.** The Astro Prettier plugin adds line breaks between adjacent inline elements, which changes rendering. Four spots are protected with `<!-- prettier-ignore -->` (logo text, the hero role line, the period after the LinkedIn link, the footer version link) and pinned by tests. If you add markup where whitespace matters, wrap it the same way — and put the explanation in a _separate_ comment, because Prettier only honours a comment that is exactly `prettier-ignore`.
- Icons: `<Icon name="fa6-solid:envelope" />` (`fa6-solid`, `fa6-brands`, `fa6-regular`); an unknown name fails the build. In scoped styles, target an icon or a `<Picture>` `<img>` from the parent with `:global(.icon)` / `:global(img)`.
- The `hidden` attribute must win over component `display:` rules — `global.scss` has a `[hidden] { display: none !important }` guard.
- Component files are PascalCase `.astro`; scripts are lower-case `.ts` in `src/scripts/`.
- Commit messages follow the repo's conventional style: `feat(scope):`, `fix:`, `perf:`, `ci:`, `docs:`, `chore:` — a short subject and a body that explains _why_. End with the `Co-Authored-By` trailer when Claude authored the change.

## 9. Git workflow & branch protection

- `main` is production: **every push to `main` deploys to https://shakoorattari.com** (after the gates pass, §10). All changes land through a pull request; the owner reviews and merges.
- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`. Keep PRs coherent; a PR that changes behaviour and formatting should say so and keep the formatting whitespace-only.
- **Versioning follows SemVer 2.0.0 + Keep a Changelog + Conventional Commits** (details: `docs/versioning.md`). `package.json` `version` is the single source of truth; it is shown in the footer (`v1.2.0`, linked to its GitHub Release), served at `/version.json` (with build metadata `1.2.0+abc1234`), and recorded in `CHANGELOG.md`. For a website: **MAJOR** = a public URL or the whole site breaks/is rebuilt, **MINOR** = new visible capability, **PATCH** = fixes, copy, dependency and performance updates; tooling/docs-only changes don't need their own release.
- **Releasing is part of the PR that should ship a version:** `npm run release` (or `-- minor|major|patch|x.y.z`, `-- --dry-run` first) bumps `package.json` + lockfile and writes the changelog section; review it, commit `chore(release): vX.Y.Z`, merge. CI then deploys, verifies the live `/version.json`, and creates the tag + GitHub Release. Never hand-edit the version without a matching changelog section (`npm run check:version` fails), and never tag manually.
- **Don't push, open PRs, or merge without the owner's say-so.** Ask, then act. Never enable auto-merge unless asked.
- Merge with a **merge commit** or squash as the owner prefers (PR #1 was a merge commit); never force-push `main`.
- **Branch protection is a GitHub setting, not code.** As checked on 2026-09-26, `main` has an active ruleset, **"Protect main — owner direct push only"** (id 16798191): it blocks deletion and force-pushes and requires a pull request with 1 approving review (approval of the last push, resolved review threads). Repository admins **bypass it always**, so the owner can merge their own PRs and push directly. **It has no required-status-checks rule**, so a failing CI check reports but does not block a merge (see §14).
- Status checks that should be required (job names): `Lint, type-check, build & site checks`, `End-to-end tests (Playwright)`, `Lighthouse budget check`. Note GitHub never lets an author approve their own PR, and the admin bypass is what lets a solo owner merge; removing the owner from the bypass list would make the checks binding for them too but would also block their direct pushes.

## 10. CI/CD

Workflows in `.github/workflows/` (details and thresholds: `docs/ci-cd.md`):

- `ci.yml` — on PRs to `main` (and callable): Prettier check → `astro check && astro build` → `check:seo` → uploads `dist`; separate job runs the Playwright suite against the build.
- `lighthouse.yml` — on PRs (and callable): builds, then `lhci autorun` with **`@lhci/cli` pinned to 0.14.0** (same as earthcone; bump deliberately, run `npm run lighthouse` locally first — version drift caused a CI-only false positive there once).
- `deploy.yml` — on push to `main` / manual: **calls both workflows above, then deploys the exact `dist` that passed**, only from `main`; then verifies the live `/version.json` reports the deployed commit, and finally creates the `vX.Y.Z` tag and GitHub Release if that version is new. Running it manually on another branch is a safe dry run.
- Pages is configured with `build_type: workflow` (Settings → Pages → Source: GitHub Actions). The old committed `docs/` build folder was removed; nothing is served from a branch.
- CI checks out full git history (`fetch-depth: 0`) because `lastmod` comes from `git log`.
- Node 22 (`.nvmrc`). Both lockfile formats used to be gitignored; `package-lock.json` is now committed and CI uses `npm ci`.
- **Every new gate must be mutation-tested** before it is trusted: break the build on purpose and confirm the gate fails (that is how the redirect-shadowing bug and the heading-order bug were found).
- `.github/actions/{checkout,gh-pages,setup-node}` are unused leftovers from the old CI and can be deleted.
- **Dependencies:** Actions are on the Node 24 majors (`checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `download-artifact@v8`, `upload-pages-artifact@v5` with `include-hidden-files: true` to keep `.nojekyll`, `deploy-pages@v5`). **Never run `npm audit fix --force`** — for the current advisory it proposes downgrading Astro to 2.x. `typescript` stays on 6.x (`@astrojs/check` peer range) and `@types/node` on 22.x (the runtime). Policy, the held-back packages and the one known advisory (`http-cache-semantics`, no patched release, build-time-only, unused here) are in `docs/ci-cd.md` → "Keeping dependencies current".

## 11. Environment & secrets

- Nothing here is a secret. The Web3Forms access key and the Turnstile **site** key are designed to be public and live in `src/data/site.ts` (`contactConfig`); development uses a different Web3Forms key and Cloudflare's always-pass Turnstile test key (`import.meta.env.DEV`).
- Optional public values (analytics IDs/tokens, search-engine verification tags) are read from `PUBLIC_*` env vars (`.env.example`). In CI they come from GitHub **repository variables** `GA_MEASUREMENT_ID`, `CF_ANALYTICS_TOKEN`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`. Nothing is emitted while empty.
- **Analytics rules** (details in `docs/analytics.md`): only the *deployed* build (the `ci.yml` quality job) gets the real IDs; the **Playwright and Lighthouse builds blank them** (`PUBLIC_GA_MEASUREMENT_ID: ''`, `PUBLIC_CF_ANALYTICS_TOKEN: ''`) so CI can never send fake visits to the real properties. GA is also dormant in `astro dev`, on any hostname other than the production domain (`PUBLIC_GA_HOSTS`), and for Global Privacy Control visitors. Test GA only with a **fake** ID (`G-TEST123456`) and mocked Google endpoints (`npm run test:analytics`); never with the real ID. Send no personal data in events (the form's content, email, name). Update `/privacy/` (`src/pages/privacy.astro`) whenever a data-handling tool is added or removed.
- Never commit real secrets. The repo needs no GitHub Actions secrets.

## 12. Getting started

```bash
nvm use                 # Node 22 (.nvmrc)
npm ci
npm start               # http://localhost:4321 (previews blog drafts)
npm run verify          # format check + type-check + build + SEO checks — run before pushing
npm run test:e2e        # Playwright against the build (npm run build first)
npm run lighthouse      # Lighthouse CI thresholds locally (reports in .lighthouseci/reports)
npm run release -- --dry-run   # preview the next version and changelog section
```

## 13. QA workflow

- **Before pushing:** `npm run verify`, then `npm run test:e2e` if you touched behaviour, layout or markup.
- **Playwright** (`tests/`) runs against the production build, never `astro dev`, and uses the system Google Chrome (`channel: 'chrome'`). It is served by `scripts/serve-dist.mjs` because **Astro 7's `astro preview` daemonizes** — the launcher exits immediately, which test runners read as a crashed server. Web3Forms, Turnstile, the clipboard and Google's endpoints are always mocked; tests must never contact a real service. The analytics tests need a separate fake-ID build: `npm run test:analytics` (it builds into `dist-analytics/` and serves it through `DIST_DIR`); in the default run they check that **no** analytics ships.
- **Look at the page, don't just trust green.** Assertions guard what you already know about; screenshots and computed geometry surface the rest. Useful techniques from this project: screenshot each section of old vs new builds side by side (use `captureBeyondViewport` — resizing the viewport to full-page height breaks `100vh` heroes and gives false "no difference"); compare the bounding box of _every element_ between two builds to prove a formatting or refactor change moved nothing.
- **Mutation-test gates and tests:** deliberately break the site and confirm the right check fails.
- Prefer a targeted assertion over eyeballing once; screenshots catch what you thought to look at, assertions catch the regression next time.

## 14. Known gaps and open decisions

Owner actions (need their accounts — see `docs/visibility-playbook.md`):

- Verify the domain in **Search Console**, submit the sitemap, request indexing; add the **analytics tokens**.
- **Turn on Google Analytics:** create the GA4 property + web stream and set the `GA_MEASUREMENT_ID` repository variable (10 steps in `docs/analytics.md`, including turning off "Page changes based on browser history events" for this anchor-navigated single page, and setting 14-month data retention). Until then nothing GA-related ships.
- **Review `/privacy/`**: it is a draft written from the site's actual behaviour (contact form via Web3Forms/Turnstile, GitHub Pages hosting, analytics), including "I use what you send only to reply to you"; confirm it matches how you really handle messages.
- **Make the checks required:** add a "Require status checks to pass" rule with the three checks in §9 to the existing `main` ruleset, so a failing check blocks merges (the ruleset currently has none).
- Fix the **GitHub profile location** (says Dubai; site and résumé say Sharjah), add a profile README linking here, and link the site from LinkedIn.
- **Finish and publish the first article** (a full draft plus three outlines are in `src/content/blog/`).

Engineering / decisions:

- `npm audit` reports **1 high advisory** (`http-cache-semantics`, via Astro's remote-image caching) with **no patched version anywhere**. Not exploitable here (no remote images, build-time only). Re-check periodically; see `docs/ci-cd.md`.

- **Turnstile is not enforced server-side:** `contact.ts` does not forward the token to Web3Forms, so the widget only gates the submit button. Fix needs `cf-turnstile-response` in the payload plus enabling verification in the Web3Forms dashboard (owner).
- The **résumé markdown and both PDFs are public** in `public/assets/files/` and contain the phone number and email; decide which PDF to keep and whether to keep publishing the `.md`.
- Whether to add the client website the owner built (`Attari-Home/earthcone`) as a case study to evidence "website development" — owner decision; do not add it unasked.
- The hero/about photo is a 335px source (`src/assets/profile.jpg`); a higher-resolution portrait exists in history if a sharper hero is wanted.
- Possible later: an Arabic version (`hreflang`), genuine client testimonials for the trust-signals section, `rel="me"` links once more profiles exist, Cloudflare Pages for headers/redirects/previews (GitHub Pages fixes `max-age=600` and can't 301).
