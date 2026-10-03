# CI/CD and quality gates

The goal: performance, accessibility and SEO can't quietly regress. Every pull request, and every deploy, has to pass the same gates. The setup mirrors the sibling `earthcone` project (formatting → type-check → build → Lighthouse CI with hard thresholds → Playwright), plus SEO-specific checks and a deploy that waits for all of it.

## What runs when

| Workflow | Runs on | Jobs |
|---|---|---|
| `ci.yml` | pull requests to `main`; called by `deploy.yml` | **Lint, type-check, build & site checks** · **End-to-end tests (Playwright)** (including the analytics integration tests) |
| `lighthouse.yml` | pull requests to `main`; called by `deploy.yml` | **Lighthouse budget check** |
| `deploy.yml` | push to `main`; manual (`workflow_dispatch`) | calls both workflows above, then **Deploy** (only if every job passed, and only from `main`) → verifies the live site serves the deployed commit → **Tag & publish release** if the version is new |

Deploy publishes the exact `dist/` that passed the gates (the artifact uploaded by `ci.yml`), not a fresh build. After deploying, it polls `/version.json` on the live site until it reports the commit that was just deployed (up to 5 minutes). Only then does the **release** job create the git tag `vX.Y.Z` and a GitHub Release with the changelog section as its notes, and only if that version has no tag yet (see [versioning.md](versioning.md)). A manual run of `deploy.yml` on any other branch is a safe dry run: the gates execute, the deploy and release jobs are skipped.

## The gates

| Gate | Command | Fails when |
|---|---|---|
| Formatting | `npm run lint` | Any source file differs from Prettier's output |
| Unit tests | `npm run test:unit` | The SemVer / Conventional Commits / changelog logic behind `npm run release` misbehaves (Node's built-in test runner) |
| Types + build | `npm run build` (`astro check && astro build`) | A type error, a broken import, an unknown icon, invalid blog frontmatter |
| SEO checks | `npm run check:seo` | See below |
| Version checks | `npm run check:version` | `package.json`, `package-lock.json`, `CHANGELOG.md` and the git tags disagree (see [versioning.md](versioning.md)) |
| End-to-end tests | `npm run test:e2e` | Any of the 101 Playwright tests that run against the default build fails |
| Analytics tests | `npm run test:analytics` | Any of the 14 consent/analytics tests fails (separate build with a *fake* Google Analytics ID; Google is mocked) |
| Lighthouse CI | `npm run lighthouse` | A page misses a threshold below (3 runs per page, median) |

### SEO checks (`scripts/check-seo.mjs`)
For every indexable page: `<title>` ≤ 60 characters; meta description 70–160; exactly one `<h1>`, first heading is the `<h1>`, **no skipped heading levels**; self-canonical URL; complete Open Graph tags and an `og:image` that exists; unique titles and descriptions; valid JSON-LD with no dangling `@id` references; every `<img>` has `alt`, `width` and `height`; no broken internal links or `#anchors`; `target="_blank"` links carry `rel="noopener"`. And: `sitemap.xml` must list exactly the indexable pages (no more, no fewer), and `robots.txt` must point at it.

### Playwright suite (`tests/`)
Runs against the production build (`scripts/serve-dist.mjs` serves `dist/` the way GitHub Pages does).

- **health** — each page loads with no console errors, failed requests or third-party requests; the home page ships < 20 KB of JavaScript; every image has alt and dimensions; the skip link works.
- **version** — every page's footer shows `v<package version>` linked to its GitHub Release; `/version.json` is well-formed and matches the footer and the `<html>` attributes.
- **navigation** — header state, scroll-spy for all six sections, anchor landing under the fixed header, the Services link, `<details>` expand/collapse (and that collapsed text stays indexable), the role animation and reduced motion, and guards for whitespace-sensitive markup (see below).
- **mobile** — the menu (open, choose a link, Escape), no horizontal overflow on any page, tap-target size.
- **contact-form** — Turnstile loads lazily (not on load, not while far away, yes when near or focused), validation messages, character counter, the submission payload, success reset, client rate limit, server 429, network failure, honeypot, reset, copy button. Web3Forms, Turnstile and the clipboard are all mocked; nothing real is contacted.
- **seo** — every sitemap URL resolves and is canonical; each page's social preview image is served (absolute URL, JPEG, 1200×630) and its structured data parses with the right types; `robots.txt`, `llms.txt` and the RSS feed; legacy redirects and the 404; the blog is `noindex` until it has a published post.

### Lighthouse thresholds (`lighthouserc.json`)
Six representative pages (home, services hub, two service pages, projects hub, one case study), mobile profile, 3 runs each, **median** must satisfy:

| Assertion | Threshold | Measured today |
|---|---|---|
| Performance | ≥ 0.95 | 1.00 |
| Accessibility | = 1.00 | 1.00 |
| Best practices | ≥ 0.95 | 1.00 |
| SEO | = 1.00 | 1.00 |
| Largest Contentful Paint | ≤ 2000 ms | 1.05–1.43 s |
| Cumulative Layout Shift | ≤ 0.05 | ≤ 0.001 |
| Total Blocking Time | ≤ 150 ms | 0 ms |
| JavaScript transferred | ≤ 20 KB | 2.6 KB (home) |
| Third-party requests | ≤ 2 | 0 |
| Total page weight | ≤ 200 KB | 60–95 KB |
| Console errors, crawlability, canonical | none / pass | pass |

The category minimums match earthcone's. The metric and byte budgets are tighter than the category scores alone would enforce; they leave roughly 2× headroom over today's values so normal content growth passes but a regression doesn't. Change them deliberately, in `lighthouserc.json`, in the PR that needs it.

The site has a light and a dark theme, so both are audited: `lighthouserc.json` forces light (`--blink-settings=preferredColorScheme=1`; Chrome's flag is 0 = dark, 1 = light) and `scripts/lighthouse-dark.mjs` derives a dark run from the same file, so the thresholds live in one place. Without the explicit flag a browser audits whatever scheme its host prefers.

Lighthouse CI is pinned (`@lhci/cli@0.14.0`, the same version earthcone uses), so results don't shift when a new Lighthouse or axe-core ships. Bump it on purpose and run `npm run lighthouse` locally first. Reports are uploaded to Lighthouse's temporary public storage, and the links appear in the job log.

> These are lab measurements. They keep regressions out; they don't replace field data (Search Console's Core Web Vitals report).

## Run everything locally

```bash
npm run verify         # format check + type-check + build + SEO checks
npm run test:e2e       # Playwright, against the build (run `npm run build` first)
npm run lighthouse     # Lighthouse CI, against the build, light theme; reports go to .lighthouseci/reports and nothing is uploaded
npm run lighthouse:dark # the same budgets with the dark theme forced, on six pages (reports in .lighthouseci/reports-dark)
                       # (uses system Chrome; set CHROME_PATH if needed)
npm run format         # fix formatting
```

Node 22 is required (`.nvmrc`). Playwright uses the system Google Chrome (`channel: 'chrome'`), so no browser download is needed; set `PW_CHANNEL=` (empty) to use Playwright's bundled Chromium after `npx playwright install chromium`.

## Formatting and inline whitespace

Prettier (with `prettier-plugin-astro`) is the formatter of record. Inline whitespace is significant in HTML, and the Astro plugin will add line breaks between adjacent inline elements. Four places rely on tags staying adjacent and are protected with `<!-- prettier-ignore -->`:

- the header logo (`<SHA />`), otherwise it widens by ~20px;
- the hero role line (`I'm a` + the rotating role);
- the period after the "LinkedIn profile" link in the trust-signals section;
- the version link in the footer (`v1.2.0`, no whitespace inside the link).

Tests in `navigation.spec.ts` and `version.spec.ts` pin all four. If you add markup like this, wrap it the same way (put the explanation in a separate comment: Prettier only honors a comment that is exactly `prettier-ignore`).

## Branch protection (GitHub settings, not code)

CI only *reports*; a check blocks a merge only if the branch protection requires it.

**Current state** (read from the GitHub API on 2026-09-26): `main` has an active ruleset, **"Protect main — owner direct push only"**. It

- blocks branch deletion and force-pushes;
- requires a pull request with **1 approving review**, approval of the last push, and resolved review threads;
- lets **repository admins bypass it always**, which is how the owner merges their own PRs (GitHub never lets an author approve their own PR) and pushes directly.

**The gap:** it has **no required-status-checks rule**. A failing Lint / Playwright / Lighthouse job would show a red ✗ on the PR but would not stop anyone from merging.

**To close it**, in **Settings → Rules → Rulesets**, edit the ruleset and add **Require status checks to pass** with these three checks:

- `Lint, type-check, build & site checks`
- `End-to-end tests (Playwright)`
- `Lighthouse budget check`

Earthcone works the same way (ruleset + required CI check). One design choice remains: with the admin bypass set to *always*, the owner can still merge past a failing check. Removing repository admins from the bypass list makes the checks binding for everyone, at the cost of also blocking direct pushes to `main`; setting the bypass to *pull requests only* keeps direct pushes blocked while letting the owner merge a PR deliberately.

## Optional configuration

Set as repository **variables** (Settings → Secrets and variables → Actions → Variables): `GA_MEASUREMENT_ID`, `CF_ANALYTICS_TOKEN`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`. The `ci.yml` quality job passes them to the build, and that build is the artifact that gets deployed. **The Playwright and Lighthouse builds deliberately blank the analytics IDs**: those jobs run from GitHub's servers, and with a real ID every run would send fake visits to the real Google Analytics / Cloudflare properties. The integration itself is covered by `npm run test:analytics` (fake ID, mocked Google). Consequence: the deployed build differs from the tested ones only by the analytics snippet and notice. See [`.env.example`](../.env.example) and [visibility-playbook.md](visibility-playbook.md).

## Keeping dependencies current

Check both sides every month or so (`npm outdated`, `npm audit`, and the **Annotations** on a workflow run, which is where GitHub announces runtime deprecations).

**GitHub Actions** are pinned to the major versions that run on Node 24 (GitHub is retiring the Node 20 runtime): `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `download-artifact@v8`, `upload-pages-artifact@v5`, `deploy-pages@v5`. Notes for the next bump:

- `upload-pages-artifact` has left out **dotfiles** since v4. `deploy.yml` sets `include-hidden-files: true` so `dist/.nojekyll` keeps being published; remove that only if you decide `.nojekyll` isn't needed (it isn't for Actions-based Pages deploys, but keeping it costs nothing).
- `upload-artifact` and `download-artifact` are bumped as a pair (the artifact is produced in `ci.yml` and consumed in `deploy.yml`).
- The deploy-only steps (`download-artifact`, `upload-pages-artifact`, `deploy-pages`, and the release job) **can't run on a pull request**: they are first exercised when the change reaches `main`. A failed deploy leaves the live site on its previous version, and the next push retries it.

**npm** — what is deliberately *not* at the "latest" version, and why:

| Package | Held at | Why |
|---|---|---|
| `typescript` | 6.x | `@astrojs/check` declares `typescript ^5 \|\| ^6`; 7.x is outside the supported range. Revisit when `@astrojs/check` widens it |
| `@types/node` | 22.x | Types should match the runtime we ship on (Node 22, `.nvmrc`), not the newest Node |
| `@lhci/cli` | 0.14.0 | Pinned deliberately (see "Lighthouse thresholds"): a version drift once caused a CI-only false positive. Bump on purpose, run `npm run lighthouse` locally first |

**Never run `npm audit fix --force` on this repo.** For the current advisory it proposes installing **Astro 2.10.9**, a downgrade across five majors that would break the site.

**Known advisory (checked 2026-10-03): `http-cache-semantics` ≤ 4.2.0, high** ([GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)). It has **no patched version** (4.2.0 is the newest release), so no update can fix it. It comes in through `astro`, which uses it only to cache **remote** images at build time (`astro/dist/assets/build/remote.js`). This site uses only local images, so that code never runs, and nothing of it is in the built site. Accepted and documented rather than hidden. Re-check with `npm audit` (and `npm view http-cache-semantics version`); when a patched release or a new Astro appears, `npm update` will pick it up.

## When a gate fails

- **Formatting:** `npm run format`, then check `git diff` for whitespace-sensitive markup.
- **SEO check:** the message names the page and the problem (e.g. `heading level skips from <h1> to <h3>`).
- **Playwright:** download the `playwright-report` artifact from the failed run (trace viewer included); `retries: 1` in CI absorbs a rare flake, but a repeat failure is real.
- **Lighthouse:** the log lists the failing assertion and the report link. Fix the cause; only loosen a threshold if the change is intended.
- **Workflow files:** lint them with `actionlint` before pushing.
