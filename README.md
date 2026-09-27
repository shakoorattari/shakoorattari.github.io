# Portfolio

Personal portfolio of **Shakoor Hussain Attari** — Lead Software Engineer, Full-Stack Developer & Application Architect.

**Live:** <https://shakoorattari.com>

A fast, static site built with [Astro](https://astro.build) and hosted on GitHub Pages, with ~2 KB of JavaScript. It has a single-page home (hero, about, services, skills, experience, case studies, contact) plus indexable pages for [services](https://shakoorattari.com/services/), [case studies](https://shakoorattari.com/projects/) and an articles section, all written to be found by people searching for a software engineer or for specific skills.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Astro 7 — static output, components are plain `.astro` files |
| Styling | SCSS, scoped per component (`scopedStyleStrategy: 'class'`) plus one global stylesheet |
| Interactivity | Three small vanilla-TS scripts in `src/scripts/` (no UI framework) |
| Icons | Font Awesome 6 glyphs inlined as SVG at build time (`<Icon />`, via Iconify JSON) — no webfont |
| Fonts | Inter (Latin, variable), self-hosted and preloaded via `@fontsource-variable/inter` |
| Images | `astro:assets` `<Picture>` → AVIF / WebP with explicit dimensions |
| Hosting | GitHub Pages, custom domain via `public/CNAME` |
| CI/CD | GitHub Actions: formatting, type-check, build, SEO checks, Playwright and Lighthouse CI gate every PR and every deploy — see [docs/ci-cd.md](docs/ci-cd.md) |
| Contact form | [Web3Forms](https://web3forms.com) + [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) + honeypot + client-side rate limit |

## Getting started

Requires **Node 22.12+** (Astro's minimum; `.nvmrc` pins 22, which CI uses).

```bash
npm ci          # or: npm install
npm start       # dev server on http://localhost:4321
```

| Script | What it does |
|---|---|
| `npm start` / `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (`astro check`) and production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check only (`astro check`) |
| `npm run lint` / `npm run format` | Check / fix formatting with Prettier |
| `npm run test:e2e` | Playwright suite against the build (run `npm run build` first) |
| `npm run lighthouse` | Lighthouse CI thresholds against the build (reports written locally, nothing uploaded) |
| `npm run verify` | Formatting + type-check + build + SEO checks + version checks + unit tests — what to run before pushing |
| `npm run release` | Prepare a release: recommended SemVer bump from your commits, `CHANGELOG.md` section, `package.json` + lockfile (`-- --dry-run` to preview) — see [docs/versioning.md](docs/versioning.md) |
| `npm run check:version` / `npm run test:unit` | Keep `package.json`, the lockfile, `CHANGELOG.md` and git tags consistent / unit-test the release logic — both run in CI |
| `npm run check:seo` | After a build, verify every page's title/description length, canonical, single `<h1>`, structured data, internal links and anchors, and that `sitemap.xml` matches the indexable pages — also runs in CI |

## Project structure

```
public/                      Served as-is, at the same URLs as before
├── CNAME  robots.txt  favicon.svg  apple-touch-icon.png
└── assets/
    ├── og-image.jpg         1200×630 social-sharing card
    └── files/               Résumé PDFs / markdown, shakoor_pic.jpeg, shakoor-photo.jpg
src/
├── data/                    All content and site config (edit these)
│   ├── site.ts              Identity, SEO copy, contact details, socials, form keys, tracking config
│   ├── about.ts  skills.ts  experience.ts  projects.ts
│   ├── services.ts          The six service pages
│   └── caseStudies.ts       Case-study pages (projects.ts joined with experience.ts)
├── content/blog/            Articles and outlines (Markdown, unpublished until `draft: false`)
├── content.config.ts        Blog schema (title/description limits, `draft` defaults to true)
├── components/              Header, Hero, About, Services, Skills, Experience, Projects,
│                            Contact, SocialProof, Footer, Icon, Breadcrumbs, CtaPanel
├── layouts/
│   ├── Base.astro           <head>: SEO, Open Graph, Twitter, JSON-LD, verification, analytics
│   └── Page.astro           Layout for services / case studies / blog (breadcrumbs, shared styles)
├── pages/
│   ├── index.astro          The home page
│   ├── services/            /services/ hub + /services/<slug>/
│   ├── projects/            /projects/ hub + /projects/<slug>/
│   ├── blog/                /blog/ + /blog/<slug>/ (dev previews drafts)
│   ├── 404.astro            Not-found page (noindex)
│   ├── sitemap.xml.ts       /sitemap.xml — every indexable page, with its own lastmod
│   ├── rss.xml.ts           /rss.xml (published posts)
│   ├── llms.txt.ts          /llms.txt — plain-text site map for AI assistants
│   └── version.json.ts      /version.json — version + build metadata of the deployed site
├── scripts/                 nav.ts (menu, scroll-spy) · hero-roles.ts · contact.ts (form)
├── styles/global.scss       Design tokens and shared utilities
├── assets/profile.jpg       Source photo that Astro resizes to AVIF/WebP
└── lib/                     lastmod.ts (git date), blog.ts (published vs preview), schema.ts (Person/WebSite refs),
                             version.ts (build info: version + commit)
scripts/                     check-seo.mjs · check-version.mjs · release.mjs · release-notes.mjs · serve-dist.mjs · lib/release.mjs (+ tests)
CHANGELOG.md                 Keep a Changelog; the source of the GitHub Release notes
tests/                       Playwright suite: health, navigation, mobile, contact form, SEO
playwright.config.ts  lighthouserc.json  .prettierrc.json  .nvmrc  .env.example
.github/                     workflows (ci, lighthouse, deploy) and the PR template
astro.config.mjs             Site URL, trailing slashes, legacy-URL redirects
docs/                        CI/CD, roadmap, visibility playbook, migration notes, project memory, original audit
CLAUDE.md                    Project instructions (rules, architecture, workflow) for Claude Code and contributors
.claude/launch.json          Dev / preview server configs for the Claude app
```

## Updating content

Content lives in `src/data/`, not in the components:

| To change… | Edit |
|---|---|
| Name, title, meta description, keywords, socials, email/phone, rotating roles | `src/data/site.ts` |
| About summary, highlights, stats, details, endorsements, certifications | `src/data/about.ts` |
| Skills | `src/data/skills.ts` |
| Work history and notable projects | `src/data/experience.ts` (`showDetails: true` starts a job expanded) |
| Architecture case-study cards | `src/data/projects.ts` (challenge / architecture / impact) |
| Case-study pages | `src/data/caseStudies.ts` — titles, descriptions and related services; the detailed bullets are pulled from `experience.ts` |
| Service pages | `src/data/services.ts` — copy, deliverables, selected work; `metaTitle` ≤ 60 and `metaDescription` ≤ 155 characters |
| Articles | Markdown files in `src/content/blog/` |

Notes:

- **Structured data is generated** from `site.ts` (Person + WebSite + ProfilePage in `Base.astro`), so the title, description, email and profile links can't drift from the visible page. The phone number is deliberately **not** in the structured data.
- **Contact details:** the public email is `binmushtaq@gmail.com`; the Outlook address is listed as a Teams ID only.
- **Icons:** use `<Icon name="fa6-solid:envelope" />` (`fa6-solid`, `fa6-brands` or `fa6-regular`). An unknown name fails the build.
- **Social card:** replace `public/assets/og-image.jpg` with a 1200×630 JPEG (keep it under ~100 KB); the dimensions are declared in `Base.astro`.
- **Profile photo:** replace `src/assets/profile.jpg`; Astro generates the sizes and formats.
- **Sitemap:** generated from the data files and published posts — a new hand-written page must be added to the list in `src/pages/sitemap.xml.ts` (`npm run check:seo` fails if the sitemap and the pages disagree).
- **Writing rule for the service and case-study pages:** every claim must come from the résumé or the existing site data. Don't add numbers, clients or testimonials that aren't real.

## Articles

Posts live in `src/content/blog/*.md`. **A post is a draft unless it sets `draft: false`**, and outlines (`outline: true`) never render. In `npm start` drafts are previewable at `/blog/`; the production build includes only published posts, and the Blog link, RSS feed and sitemap entries appear once there is at least one.

```md
---
title: 'Headline (max 70 characters)'
seoTitle: 'Optional shorter <title> (max 60)'
description: '70–160 characters: becomes the meta description'
date: 2026-10-01
tags: ['OAuth 2.0', '.NET']
draft: false
---
```

## Analytics and search-engine verification

All optional and off by default. Set them as GitHub repository **variables** (Settings → Secrets and variables → Actions → Variables) and re-run the workflow, or edit `tracking` in `src/data/site.ts`:

| Variable | Purpose |
|---|---|
| `CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics (cookieless) beacon token |
| `GOOGLE_SITE_VERIFICATION` | Search Console "URL prefix" verification meta tag |
| `BING_SITE_VERIFICATION` | Bing Webmaster Tools verification meta tag |

The step-by-step setup is in [docs/visibility-playbook.md](docs/visibility-playbook.md).

## Contact form

Configured in `src/data/site.ts` (`contactConfig`). The Web3Forms access key and the Turnstile **site** key are designed to be public. `npm start` uses Cloudflare's always-pass Turnstile test key and the development Web3Forms key; production builds use the production keys.

- The Turnstile script is **lazy-loaded**: only when the form is within ~400px of the viewport or a field receives focus.
- Spam controls: a hidden honeypot field, a 60 s client-side rate limit, and Turnstile gating the submit button.
- The form needs JavaScript; a `<noscript>` note points visitors to email instead.

> **Known limitation:** the Turnstile token is not yet forwarded to Web3Forms for server-side verification, so the widget only gates the UI. See [the roadmap](docs/seo-performance-roadmap.md#known-issues).

## CI/CD and quality gates

Modelled on the sibling `earthcone` project. Three workflows in `.github/workflows/`:

| Workflow | When | What |
|---|---|---|
| `ci.yml` | pull requests | Prettier check · unit tests · type-check + build · SEO checks · version checks · the Playwright suite |
| `lighthouse.yml` | pull requests | Lighthouse CI (pinned `@lhci/cli@0.14.0`): performance ≥ 0.95, accessibility = 1, best practices ≥ 0.95, SEO = 1, plus LCP, CLS, TBT, JavaScript and page-weight budgets |
| `deploy.yml` | push to `main` | **Calls both workflows above and deploys to GitHub Pages only if every job passed**, publishing the exact build that was tested; then verifies the live `/version.json` and creates the `vX.Y.Z` tag + GitHub Release if the version is new |

The gates are proven to fail: each one has been mutation-tested with a deliberate regression. Thresholds, what each check covers, how to run them locally and how to make the checks required on `main` (so a failing check actually blocks a merge) are in **[docs/ci-cd.md](docs/ci-cd.md)**.

`deploy.yml` also runs manually on any branch as a dry run (gates run, deploy is skipped). It checks out full git history because the sitemap and JSON-LD `lastmod` come from `git log`. GitHub Pages can't set custom response headers, so the cache lifetime is fixed at 10 minutes.

### Old URLs

The Angular version served `/about`, `/skills`, `/experience`, `/projects` and `/contact` as separate pages. `/about/`, `/skills/`, `/experience/` and `/contact/` now redirect to the matching anchor (e.g. `/about/` → `/#about`) via `redirects` in `astro.config.mjs`, so existing links keep working. `/projects/` is now a real page (the case-study hub), so it is intentionally not redirected.

## Versioning and releases

The site follows [Semantic Versioning](https://semver.org), keeps a [Keep a Changelog](https://keepachangelog.com) `CHANGELOG.md`, and reads its bumps from [Conventional Commits](https://www.conventionalcommits.org). The current version is in `package.json` (the single source of truth), **shown in the footer** (`v1.2.0`, linked to its GitHub Release, with the build's commit and date in the tooltip), and served as machine-readable JSON at `/version.json` (`{ "version": "1.2.0", "versionFull": "1.2.0+abc1234", "commit": "…", … }`).

To ship a version: run `npm run release` in the PR (it picks the bump, writes the changelog section and bumps `package.json` and the lockfile), review and commit it. On merge, CI deploys, checks the live `/version.json`, and creates the tag and GitHub Release. What MAJOR / MINOR / PATCH mean for a website, the full workflow and troubleshooting are in **[docs/versioning.md](docs/versioning.md)**.

## SEO and performance

Measured with Lighthouse 13.5 (mobile profile, simulated throttling, gzip-enabled local server, median of 3 runs):

| | Angular (Phase 0 build) | Astro (now) |
|---|---|---|
| Performance | 87 | **100** |
| Accessibility | 92 | **100** |
| Best practices / SEO | 100 / 100 | 100 / 100 |
| LCP | 3.75 s | 1.50 s |
| Total blocking time | 12 ms | 0 ms |
| JavaScript transferred | 116 KiB | 2.4 KiB |
| Total transfer / requests | 509 KiB / 19 | 90 KiB / 6 |
| Third-party hosts on load | 3 (cdnjs, Google Fonts ×2) | 0 |

These are local lab numbers, not field data; treat them as relative. Details and remaining work: **[docs/seo-performance-roadmap.md](docs/seo-performance-roadmap.md)**.

In place: full HTML content with JavaScript disabled; unique titles (≤ 60 chars) and descriptions (≤ 160) on every page; one `<h1>` per page with no skipped levels; self-canonical URLs; Open Graph / Twitter tags with a 1200×630 image; linked JSON-LD (`Person`, `WebSite`, `ProfilePage`, `Service`, `BlogPosting`, `BreadcrumbList`); breadcrumbs; `robots.txt`, a generated sitemap, an RSS feed and `llms.txt`; a self-hosted preloaded font, inlined CSS and no render-blocking third-party requests. `npm run check:seo` guards these in CI.

Getting *found* is a separate job from being fast: see **[docs/visibility-playbook.md](docs/visibility-playbook.md)** for indexing, links, articles and measurement.

## Documentation

| Document | Contents |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Project instructions for Claude Code and contributors: purpose, content rules, architecture, conventions, quality bar, workflow, known gaps |
| [docs/project-memory.md](docs/project-memory.md) | Decision log, asset provenance and hard-won gotchas |
| [docs/versioning.md](docs/versioning.md) | The versioning standards, what each bump means for this site, how to release, and what CI verifies |
| [docs/ci-cd.md](docs/ci-cd.md) | The quality gates, thresholds, running them locally, and branch protection |
| [docs/seo-performance-roadmap.md](docs/seo-performance-roadmap.md) | Phased SEO / performance plan with status, measurements, known issues |
| [docs/visibility-playbook.md](docs/visibility-playbook.md) | How to get indexed, earn links, publish articles and measure — the parts that need your accounts |
| [docs/astro-migration-notes.md](docs/astro-migration-notes.md) | What changed in the Angular → Astro move, deliberate differences, how it was verified |
| [docs/performance-enhancement-v001.md](docs/performance-enhancement-v001.md) | Original Lighthouse audit, annotated with current status |

## License

[MIT](LICENSE) © Shakoor Hussain Attari
