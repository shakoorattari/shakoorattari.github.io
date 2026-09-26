---
title: 'Rebuilding my portfolio from Angular to Astro: Lighthouse 87 to 100'
seoTitle: 'Angular to Astro: my portfolio from Lighthouse 87 to 100'
description: 'What I changed, measured and got wrong moving a prerendered Angular portfolio to Astro: 116 KiB of JavaScript down to 2.4 KiB.'
date: 2026-09-26
tags: ['Astro', 'Angular', 'Web performance', 'Lighthouse', 'SEO']
draft: true
---

> **Draft for review.** Written from the actual migration work and measurements. Edit it into your own voice, check every number, then set `draft: false` to publish.

My portfolio was an Angular 16 app that I prerendered at build time. It looked right, crawlers could read it, and it still shipped about 116 KiB of JavaScript to display text that never changes. I rebuilt it with [Astro](https://astro.build). This is what I measured, what I changed, and the bugs the move turned up.

## The starting point

I measured the Angular build with Lighthouse 13.5 (mobile profile, simulated throttling, a local gzip-enabled static server, median of three runs):

| | Angular 16 |
|---|---|
| Performance | 87 |
| Accessibility | 92 |
| Largest Contentful Paint | 3.75 s |
| JavaScript transferred | 116 KiB |
| Requests / transfer | 19 / 509 KiB |
| Third-party hosts on load | 3 |

These are lab numbers on a local server, so read them as relative, not absolute. The three third-party hosts were the Font Awesome CDN and two Google Fonts origins.

The site is one page of content plus a contact form. Almost nothing on it needs a client-side framework.

## Why not just upgrade Angular

Angular 16 is out of support, so staying meant an upgrade project regardless. But even a current Angular would still ship a framework runtime and change-detection machinery for content that is identical on every visit. Astro's default is the opposite: it renders to HTML at build time and ships no JavaScript unless a component asks for it.

## Getting the content out of components

The portfolio's content lived in TypeScript arrays inside component classes (work history, skills, projects). Rather than retype hundreds of lines, I wrote a small script that finds each array by name, matches its brackets while skipping string contents, and writes it out as a typed data module. The content moved across without a single transcription error, and the data now lives in `src/data/*.ts`, separate from the markup.

## Keeping the design identical

Angular's default view encapsulation stamps an attribute onto every element and onto every selector, which raises the specificity of component styles above the global stylesheet. Astro lets you choose how scoping is compiled: the `where` strategy adds no specificity and would have changed the cascade, while `attribute` (the default) and `class` keep the extra weight. I set `scopedStyleStrategy: 'class'` explicitly so that precedence is a documented decision rather than a default I happen to rely on.

To prove the two sites matched, I screenshotted every section of both builds in headless Chrome at desktop and phone widths and compared them side by side and by pixel difference.

## Bugs the comparison exposed

**1. CSS that never worked.** Six declarations looked like `font: 700 13px/1.4 inherit`. `inherit` cannot appear inside the `font` shorthand, so browsers dropped the whole declaration. The live site had been rendering the timeline's date labels at 16px instead of 12px and project names at 10.7px. Nothing errors, so nobody notices. Matching screenshots is what made it visible.

**2. A `content-visibility` jump.** A `content-visibility: auto` rule with `contain-intrinsic-size: 900px` had been applied to a section whose real height was about 430px. Until it scrolled into view the page reserved 900px for it, so the page height jumped as you reached the bottom. The same rule sat on inline custom elements, where it does nothing.

**3. A false pass in my own test.** My first comparison reported "0% difference" for the hero. The cause: I had resized the viewport to the full page height to take clipped screenshots, which made the hero's `min-height: 100vh` about 12,000px tall, so its content sat far below the clip on both sides. Two blank images match perfectly. Always check that a test can fail.

**4. The wrong photo.** The port initially pulled a different image file from the one the site actually displayed. Side-by-side screenshots caught it immediately; a code review would not have.

**5. A shell quirk that produced six useless Lighthouse runs.** I looped over `"name port"` strings and split them with `set --`. In zsh an unquoted variable is not word-split, so the port was empty and every run hit `http://localhost/`. The results were valid JSON full of interstitial-error audits. Check the URL recorded in each result before you trust a number.

## Removing the third-party dependencies

- **Icons.** Font Awesome loaded a full stylesheet and webfonts for 28 icons. Now each icon is inlined as SVG at build time from Iconify's Font Awesome 6 data. An unknown icon name fails the build.
- **Fonts.** Inter is self-hosted as a Latin-subset variable WOFF2, preloaded, with a metric-matched fallback face so the swap does not shift the layout.
- **Images.** Astro's `<Picture>` turns one source photo into AVIF and WebP at the sizes actually displayed; the small variants are a few kilobytes.

## Interactivity without a framework

Everything interactive is a small vanilla script:

- The header's scrolled state and the mobile menu, plus scroll-spy using `IntersectionObserver`.
- The expand/collapse for each job is a native `<details>` element, so collapsed content stays in the HTML.
- The rotating job title renders its first value in the HTML and animates from there; it is skipped entirely for visitors who prefer reduced motion.
- The contact form loads Cloudflare Turnstile only when the form is within 400px of the viewport or a field takes focus.

The scripts total about 2.4 KiB gzipped.

## Testing the behaviour, not just the looks

I drove headless Chrome over the DevTools protocol with 55 checks: header state, scroll-spy for every section, anchor offsets under the fixed header, the mobile menu, the `<details>` toggles, reduced motion, and the whole contact form against a mocked Turnstile, a mocked submission endpoint and a mocked clipboard (empty and invalid states, success, client rate limiting, a server 429, a network failure, the honeypot). I also ran the same probes against the old build to confirm they fail where they should.

## The result

| | Angular 16 | Astro |
|---|---|---|
| Performance | 87 | 100 |
| Accessibility | 92 | 100 |
| Largest Contentful Paint | 3.75 s | 1.50 s |
| JavaScript transferred | 116 KiB | 2.4 KiB |
| Requests / transfer | 19 / 509 KiB | 6 / 90 KiB |
| Third-party hosts on load | 3 | 0 |

The accessibility gain came mostly from things a framework migration exposed: unreadable button text on a dark page (contrast 1.37:1), skipped heading levels, and a missing `<main>` landmark.

## Caveats

These are lab measurements from a local server, not field data. Astro 7 needs Node 22.12 or newer, so the CI pipeline had to move off Node 20. And a Lighthouse 100 says little about whether anyone finds the site: that is a separate job.

The source is on [GitHub](https://github.com/shakoorattari/shakoorattari.github.io).
