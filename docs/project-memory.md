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
| 2026-09-27 | **Versioning** (1.2.0): SemVer + changelog + footer display + `/version.json` + release tooling. Retroactive v1.0.0 (`e730451`) and v1.1.0 (`4b6c5f6`) | `feat/versioning` |
| 2026-10-09 | **On-device AI features** (Chrome's Prompt and Summarizer APIs): chat (home page + an Ask AI button on every page), job-fit check, quote brief helper, key points, and a promotion band under the hero. See `docs/ai-features.md` | `feat/ai-features` |

## IELTS app linked (2026-10-04)

The owner's free IELTS study app (`shakoorattari/ielts`, React + Vite, hash routes) is already served at `shakoorattari.com/ielts/`: with a custom domain on the user site, GitHub Pages serves each project site's repo under `domain/<repo>/`. The request was to link it from the portfolio and make its SEO proper.

- **Portfolio side:** a `WorkPage` entry (`ielts-collocations`, kind `project`, screenshot of the dashboard), footer link, `llms.txt` section, privacy paragraph, `robots.txt` lists the app's sitemap and disallows the third-party essay PDF, `check-seo.mjs` `EXTERNAL_APPS`. Facts on the page were read from the app's README, data and code, not assumed (1000 collocations = 10 themes × 100 topics, 202 essays, SM-2 style scheduler, optional private-Gist sync, themes, no analytics or cookies).
- **App side (its own PR):** Lighthouse already gave it SEO 100, which is shallow: the raw HTML was an empty `<div id="root">` with no `<h1>`, no canonical, Open Graph, structured data or sitemap, a template favicon, and hash routes mean there is only one indexable URL. Added a static, truthful shell in `#root` (replaced by React with measured CLS 0), canonical/OG/Twitter/theme-color/icons, `WebApplication` JSON-LD (no ratings: there are none), a generated `sitemap.xml`, a `noindex` 404, per-screen titles, and `scripts/check-seo.mjs` run in CI (25 deliberate regressions each fail it). Accessibility went 94 → 100 across all routes and six themes (axe): `text-on-brand` and `text-*-ink` tokens replaced white-on-brand and 500-weight status text, and unlabeled `<select>`s got names.
- **Decision: essays get no indexable pages.** They are © Hardev Sir's IELTS Institute with no permission statement found. Prerendering 202 essay URLs would put third-party text in search under the owner's domain. Open for the owner: confirm permission, and whether `200-Essays-Mobile.pdf` should stay public.
- **Deploy order:** the app's PR first (the sitemap this repo's `robots.txt` references and the claims on the work page ("a check in the pipeline", contrast) come from it), then this one.

## On-device AI (2026-10-09)

The owner asked where the site could use AI, preferring Chrome's built-in AI or the Prompt API, with a notice to use Chrome elsewhere. The Prompt API *is* one of the built-in APIs, so the choice was per job: the Summarizer (stable since Chrome 138) for key points and the Prompt API (stable for web pages since Chrome 148, with structured output) for the rest. Design, guardrails and test notes: `docs/ai-features.md`.

- **Decisions the owner approved:** the "use Chrome" notice lives only inside the AI panels (no site-wide banner, which would nag every Safari and phone visitor, most of them recruiters); build in order shared kit + key points, quote helper, job-fit check, ask assistant.
- **Why truthfulness drove the design.** A small on-device model hallucinates and this site's rule is never to state what the data does not say. So the model only proposes and plain code decides: retrieval before generation (no match, no model call), schema-constrained replies, citations validated against the chunks the model was shown, numbers in an answer must appear in those chunks, evidence rendered from the site's data rather than the model's words, suggestions limited to the form's own options.
- **Reach is a minority** (desktop Chrome, ~22 GB free, a multi-GB one-time download), so this is a showcase of the owner's AI-tooling skills, never a path the owner depends on. The download is always asked about first.
- **Second round, same day.** The owner tried the job-fit check on a real model (a screenshot), liked it, and asked for it to be highlighted and promoted, and for a chatbot "that will give details from my sites and projects and different insights". Built: a multi-turn chat (the single-answer "Ask" box became a conversation, with memory for follow-ups), an **Ask AI** button and window on every page, computed overview chunks for "insights" (counts, technologies used most, timeline: derived from the data, so the answers are stated facts), a "Try the AI on this site" band under the hero, and the job-fit panel moved to the top of `/services/`. **Decision:** the floating button appears only where the browser can run the model (feature detection plus one idle `availability()` read), so the promotion never nags visitors who cannot use it; everyone else meets the AI inside the panels and the band.
- **The first real-model run found what the mock could not.** In the screenshot one row was marked "strong" but cited "Methodology & Tooling" for "Solution architecture": the claim was right, the citation was wrong. A small model cites evidence that merely sounds close. The fix is in code: a citation counts only if it shares two of the requirement's words (or most of a short one, or an alias), a failed citation is replaced by the best match from the site's own text, "strong" needs direct support, and one shared word out of several counts for nothing.
- **Not validated against a real model for the chat, quote helper and key points.** The mock proves behaviour and every guard (21 mutations, 58 tests, 48 further axe states, Lighthouse 1.00 in accessibility/best practices/SEO in both themes), and a real Chrome 152 and 155 confirmed the API calls and the pre-download flow. Answer quality for those three is unverified; the checklist is in `docs/ai-features.md`.

Lessons from building it:

- **My own refusal tests passed for the wrong reason.** They cited a case-study id that retrieval never put in the top five, so the answer was rejected for "cites a note it was not shown", not for the guard the test was named after. Look at what the code actually receives before trusting a negative test, and mutation-test each guard.
- **A substring number check is not a number check.** `"12".includes` matched the id `[ex12]` inside the notes; the guard now compares whole numbers and strips ids.
- **Axe found a WCAG 2.5.3 (Label in Name) failure** that Lighthouse (one route, one theme, no interaction) never could: a "Use this" button named "Use timeline: …".
- **A Stop button must be able to do what it says.** During the download question it could not dismiss the question, so it is hidden there.
- **`aria-disabled`, not `disabled`, while busy:** a focused button that becomes disabled drops keyboard focus.
- **Chrome's API names move.** `inputQuota`/`contextWindow` and `measureInputUsage`/`measureContextUsage` both exist across versions, so the runtime reads either.
- **Third round: "why does it keep downloading the model?"** The owner sent a screenshot from their real Chrome: a full progress bar, "Downloading Chrome's on-device model… 100%" and a Stop button, on a question asked after the model was already on their computer. Two bugs of mine. (1) Chrome's spec says `downloadprogress` "will always" fire 0 and 1, even for a cached model, and `loaded = 1` is not "ready": I labelled it "Downloading" on every question. (2) I created and destroyed a session per question, so Chrome, which unloads the model when no session is alive, reloaded it each time; its docs recommend one kept session and `clone()`. Fixed with a warm base session per system prompt (idle release at 5 minutes), progress only for real downloads, and "Preparing" at 100%. The mock had the same blind spot (it only fired progress for real downloads and had no `clone`), so it could not have caught this: **a mock that is more forgiving than the real API will pass the bug**. It now follows the spec on those points.
- **A mutant that survives can be a gap in the test.** Tying the shared base session to a request's abort signal survived because the Stop test pressed Stop on the *second* question; it only bites when the *first* request is aborted after the model has loaded.
- Prettier re-indented `projects/[slug].astro` when a wrapper `<div id="study-body">` was added (67 changed lines, no change in output).
- **A selector with a `!` hides a typo from the type-checker.** `panel.querySelector('[data-ai-clear]')!` returned null because the markup said `data-ai-action="clear"`; the first question then crashed after drawing the user's bubble. Only the e2e test noticed. Prefer a check that throws a readable error over `!` on DOM lookups in code that is only exercised in the browser.
- **A lexical fallback needs a rule against single shared words.** The first version of "repair a wrong citation" let "Terraform modules" be backed by "Lazy-Loading Modules" and "Kubernetes in production" by any text containing "production". Measuring word frequencies in the catalog showed why a rarity threshold would not work ("module" is rare *because* only one chunk uses it); the rule that did is coverage (two shared words, or most of a short requirement).
- **Weight the previous topic, don't merge it.** Merging the last answer's topic into the next question's text made "What is his salary expectation?" return unrelated sections as "closest matches". Context words now count a third as much and can never satisfy the match on their own.
- **Two mutants survived, for a good reason.** After the context change, over-weighting or over-applying the previous topic could no longer cause the bug, because a hit must match a word of the question itself. Surviving mutants deserve a look before a new test: here the code was already safe, and only mutating back to the original design proved the regression test.
- **`role="log"` is not allowed on an `<ol>`**, and axe then fails each `<li>` ("parent has a role that is not list"). Use a `<div role="log">` with `<div>` turns. An empty live region must exist before it is written to, so keep it in the page and give it no height instead of hiding it.
- **CSS is inlined into every page**, so an id mentioned in a selector (`#analytics-consent`) is in the HTML of a build that has no such element, and a test that greps for it fails. Use the element's class, or none.
- **`serve-dist.mjs` joins `DIST_DIR` onto the working directory**: pass a relative path.

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
- **Analytics: Cloudflare Web Analytics** (cookieless, no consent banner) — the owner's choice on 2026-09-26. Search Console is separate and needs no script.
- **Google Analytics 4 added (2026-10-03), opt-in.** The owner asked for GA "to know the stats and the site's rating". Decisions: (1) GA has no rating; Search Console (rankings, Core Web Vitals) and Lighthouse cover that, and `docs/analytics.md` says so. (2) **Opt-in, not "advanced consent mode"**: Google's `gtag.js` measured ~150 KB over the wire (placeholder ID) — more than the whole home page — so it loads only after Accept; that keeps CLAUDE.md §6's "no third-party requests on load" true and means a visitor who declines or never decides makes zero Google requests. The price is that GA under-counts; Cloudflare Web Analytics (kept) covers total traffic. (3) Accept/Decline are styled identically (regulators treat a more prominent Accept as a dark pattern); Global Privacy Control suppresses the notice and measurement; choices expire after 12 months; withdrawal deletes the `_ga*` cookies. (4) Google signals and ad personalisation off, ad consent signals permanently denied, cookie lifetime 13 months. (5) Dormant in dev, on foreign hostnames, and in CI test builds (a real ID there would send fake visits from GitHub's servers). (6) A `/privacy/` page was needed anyway (the contact form collects personal data); it is generated from the build config. (7) The notice is first in the DOM (GOV.UK pattern) so keyboard users reach it before the page; it is `position: fixed`, hidden until the page is idle, so no layout shift. Verified with 14 fake-ID tests (mutation-tested with 8 regressions) and Lighthouse 100/100/100/100 on the opt-in build with the notice showing.
- **Prettier uses this repo's existing style** (2-space, single quotes, width 120), not earthcone's 4-space config, to avoid rewriting every file. The Astro plugin did not honour `htmlWhitespaceSensitivity: 'strict'` (the output was identical with and without it), so whitespace-sensitive inline markup is guarded with `<!-- prettier-ignore -->` (verified: element geometry is identical before/after across 7 pages at 2 viewports).
- **Playwright is served by `scripts/serve-dist.mjs`**, not `astro preview`, which daemonizes in Astro 7 and reads as a crashed server. Uses system Chrome (`channel: 'chrome'`, preinstalled on GitHub runners).
- **Lighthouse CI pinned to 0.14.0** (same as earthcone) for reproducible results; the local `npm run lighthouse` writes to disk and never uploads.
- **Deploy waits for the gates** via reusable workflows (`ci.yml`, `lighthouse.yml`) and publishes the tested artifact.
- **Versioning (2026-09-27).** `package.json` is the single source of truth; the version is shown in the footer (linked to the GitHub Release) and served at `/version.json`. The displayed date is the **commit date**, not a build timestamp, so builds stay reproducible. Bumps come from Conventional Commits via a small tested script (`npm run release`) that writes the changelog but **does not commit or tag**; CI tags and publishes the GitHub Release only after a deploy whose live `/version.json` reports the deployed commit. release-please and semantic-release were considered and not adopted (PRs opened with `GITHUB_TOKEN` need a repository setting and don't trigger CI; semantic-release releases on every merge) — see `docs/versioning.md`. `npm run release` refuses to prepare a second release while the previous one is untagged (a scenario test found the script would otherwise double-bump).

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
| `src/assets/profile.jpg` (460×460) | **Replaced 2026-10-03 with the owner's GitHub avatar** (`avatars.githubusercontent.com/u/16268189`, fetched at `size=512`, which GitHub serves at 460 px). `public/assets/files/shakoor_pic.jpeg` (the structured-data image) is the same file. Before that it was a 335 px copy of the casual photo the site always showed. The avatar is the same portrait as the social card, so the page and link previews now match; `shakoor-photo.jpg` (the résumé portrait, 280 px) was left alone. **Lesson:** an early port pulled a _different_ image (the professional portrait) and it was only caught by comparing screenshots side by side — verify an asset by looking at it, not by its filename. |
| `public/assets/files/shakoor-photo.jpg` (280×280, 12 KB) | The professional portrait used by the résumé markdown, resized from the original 1254 px `shakoor-photo.png` (2 MB; deleted from the tree in Phase 0, recoverable from git history at `486e846`). A Phase 0 commit briefly repointed the résumé at the casual photo by mistake; the portrait was restored in the Astro migration. |
| `public/assets/files/ShakoorHussain_Resume_V2.pdf` | The résumé the site links to. `Shakoor_Hussain_Resume.pdf` is an older copy that is published but not linked. |
| `src/content/blog/rebuilding-portfolio-angular-to-astro.md` | Draft article written from the real migration measurements and bugs; unpublished (`draft: true`). |

## Dependency update (2026-10-03)

Prompted by GitHub's Node 20 deprecation warnings on deploy #37 and `npm install` reporting 2 high-severity vulnerabilities.

- **Actions** moved to the Node 24 majors (see `docs/ci-cd.md`). Release notes were read for every intermediate major: the only behavioural trap was `upload-pages-artifact` dropping dotfiles since v4, handled with `include-hidden-files: true`.
- **npm**: only in-range updates (62 package versions, no majors: sharp 0.35.5, Vite/rolldown, shiki 4.5, sass 1.105.1, `@types/node` 22.20.5). TypeScript 7 skipped because `@astrojs/check` declares `^5 || ^6`; `@types/node` stays on 22.x to match the runtime.
- **The "2 high vulnerabilities" are one advisory with no fix.** `http-cache-semantics` ≤ 4.2.0; the latest release (4.2.0) is still affected. `npm audit fix --force` proposes Astro 2.10.9 (a five-major downgrade), so it is a trap. Astro uses the package only for build-time caching of remote images, which this site never does.
- **Verified**: the previous `main` was built with its old dependencies in a scratch worktree and compared with the new build file by file after normalising commit/hash differences: **54/54 files byte-identical, images included**. Full verify, 101 + 14 Playwright tests and actionlint pass.
- **Not provable before merge**: the deploy-only Action steps (they only run on `main`).

## Gotchas learned the hard way

- **Prettier and inline whitespace.** The Astro plugin inserted line breaks between adjacent inline spans, widening the header logo by ~20px on every page and adding a space before the period after the LinkedIn link. Found only by comparing every element's bounding box between builds.
- **`npm audit fix --force` can propose a downgrade across majors** (Astro 7 → 2.10.9) when the vulnerable package has no patched release. Read what it would install before running it, and prefer `npm view <pkg> version` plus the advisory's `first_patched_version`.
- **`astro preview` daemonizes** in Astro 7 (launcher exits, server keeps running) — Playwright's `webServer` sees a crash and a stray server is left running (`npx astro preview stop`).
- **Astro `redirects` shadow real pages** silently (`/projects`).
- **A test harness can lie.** Resizing the viewport to full-page height made `100vh` heroes enormous, so two blank screenshots "matched"; always check that a check can fail.
- **zsh doesn't word-split unquoted variables**, so a `set -- $pair` loop ran six Lighthouse audits against `http://localhost/`; verify the URL recorded in each result.
- **Lighthouse comparisons need a gzip-enabled server** (plain `python -m http.server` doesn't compress).
- The owner's old `ng serve` kept running and recreated `.angular/` in the working tree; it is gitignored.
- Both `pnpm-lock.yaml` and `package-lock.json` used to be gitignored, so CI never had a lockfile.
