# Portfolio

Personal portfolio of **Shakoor Hussain Attari** — Lead Software Engineer, Full-Stack Developer & Application Architect.

**Live:** <https://shakoorattari.com>

A single-page site (hero, about, skills, experience, case studies, contact) built with [Astro](https://astro.build) as fully static HTML, with ~2 KB of JavaScript, hosted on GitHub Pages.

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
| CI/CD | GitHub Actions — `.github/workflows/deploy.yml` |
| Contact form | [Web3Forms](https://web3forms.com) + [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) + honeypot + client-side rate limit |

## Getting started

Requires **Node 22.12+** (Astro's minimum; CI uses 22).

```bash
npm ci          # or: npm install
npm start       # dev server on http://localhost:4321
```

| Script | What it does |
|---|---|
| `npm start` / `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check `.astro` and `.ts` files (`astro check`) — also runs in CI |

## Project structure

```
public/                      Served as-is, at the same URLs as before
├── CNAME  robots.txt  favicon.svg  apple-touch-icon.png
└── assets/
    ├── og-image.jpg         1200×630 social-sharing card
    └── files/               Résumé PDFs / markdown, shakoor_pic.jpeg, shakoor-photo.jpg
src/
├── data/                    All content and site config (edit these)
│   ├── site.ts              Identity, SEO copy, contact details, socials, contact-form keys
│   ├── about.ts  skills.ts  experience.ts  projects.ts
├── components/              Header, Hero, About, Skills, Experience, Projects,
│                            Contact, SocialProof, Footer, Icon
├── layouts/Base.astro       <head>: SEO, Open Graph, Twitter, JSON-LD, font preload
├── pages/
│   ├── index.astro          The single page
│   ├── 404.astro            Not-found page (noindex)
│   └── sitemap.xml.ts       Generates /sitemap.xml at build time
├── scripts/                 nav.ts (menu, scroll-spy) · hero-roles.ts · contact.ts (form)
├── styles/global.scss       Design tokens and shared utilities
├── assets/profile.jpg       Source photo that Astro resizes to AVIF/WebP
└── lib/lastmod.ts           Last-modified date from git, for sitemap + structured data
astro.config.mjs             Site URL, trailing slashes, legacy-URL redirects
docs/                        Roadmap, migration notes, original audit
```

## Updating content

Content lives in `src/data/`, not in the components:

| To change… | Edit |
|---|---|
| Name, title, meta description, keywords, socials, email/phone, rotating roles | `src/data/site.ts` |
| About summary, highlights, stats, details, endorsements, certifications | `src/data/about.ts` |
| Skills | `src/data/skills.ts` |
| Work history and notable projects | `src/data/experience.ts` (`showDetails: true` starts a job expanded) |
| Architecture case studies | `src/data/projects.ts` |

Notes:

- **Structured data is generated** from `site.ts` (Person + WebSite + ProfilePage in `Base.astro`), so the title, description, email and profile links can't drift from the visible page. The phone number is deliberately **not** in the structured data.
- **Contact details:** the public email is `binmushtaq@gmail.com`; the Outlook address is listed as a Teams ID only.
- **Icons:** use `<Icon name="fa6-solid:envelope" />` (`fa6-solid`, `fa6-brands` or `fa6-regular`). An unknown name fails the build.
- **Social card:** replace `public/assets/og-image.jpg` with a 1200×630 JPEG (keep it under ~100 KB); the dimensions are declared in `Base.astro`.
- **Profile photo:** replace `src/assets/profile.jpg`; Astro generates the sizes and formats.
- **Sitemap:** generated — add new indexable routes to the `routes` array in `src/pages/sitemap.xml.ts`.

## Contact form

Configured in `src/data/site.ts` (`contactConfig`). The Web3Forms access key and the Turnstile **site** key are designed to be public. `npm start` uses Cloudflare's always-pass Turnstile test key and the development Web3Forms key; production builds use the production keys.

- The Turnstile script is **lazy-loaded**: only when the form is within ~400px of the viewport or a field receives focus.
- Spam controls: a hidden honeypot field, a 60 s client-side rate limit, and Turnstile gating the submit button.
- The form needs JavaScript; a `<noscript>` note points visitors to email instead.

> **Known limitation:** the Turnstile token is not yet forwarded to Web3Forms for server-side verification, so the widget only gates the UI. See [the roadmap](docs/seo-performance-roadmap.md#known-issues).

## Deployment

`.github/workflows/deploy.yml`:

- **Pull requests to `main`:** install (`npm ci`), type-check, build — nothing is deployed.
- **Push to `main`:** the same, then upload `dist/` and deploy to GitHub Pages.

It checks out full git history because the sitemap and JSON-LD `lastmod` come from `git log`. GitHub Pages can't set custom response headers, so the cache lifetime is fixed at 10 minutes.

### Old URLs

The Angular version served `/about`, `/skills`, `/experience`, `/projects` and `/contact` as separate pages. They now redirect to the matching anchor (e.g. `/about/` → `/#about`) via `redirects` in `astro.config.mjs`, so existing links keep working.

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

In place: full HTML content with JavaScript disabled, one `<h1>` with no skipped heading levels, canonical URL, Open Graph / Twitter tags with a 1200×630 image, linked JSON-LD, `robots.txt`, a generated sitemap, self-hosted preloaded font, inlined CSS, and no render-blocking third-party requests.

## Documentation

| Document | Contents |
|---|---|
| [docs/seo-performance-roadmap.md](docs/seo-performance-roadmap.md) | Phased SEO / performance plan with status, measurements, known issues |
| [docs/astro-migration-notes.md](docs/astro-migration-notes.md) | What changed in the Angular → Astro move, deliberate differences, how it was verified |
| [docs/performance-enhancement-v001.md](docs/performance-enhancement-v001.md) | Original Lighthouse audit, annotated with current status |

## License

[MIT](LICENSE) © Shakoor Hussain Attari
