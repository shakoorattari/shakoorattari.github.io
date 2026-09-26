# Portfolio

Personal portfolio of **Shakoor Hussain Attari** — Lead Software Engineer, Full-Stack Developer & Application Architect.

**Live:** <https://shakoorattari.com>

A single-page site (hero, about, skills, experience, case studies, contact) built with Angular and prerendered to static HTML at build time, hosted on GitHub Pages.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 16 (NgModules), SCSS |
| Rendering | Build-time prerender (SSG) via `@nguniversal/builders:prerender` |
| Hosting | GitHub Pages, custom domain via `src/CNAME` |
| CI/CD | GitHub Actions — `.github/workflows/deploy.yml` |
| Contact form | [Web3Forms](https://web3forms.com) + [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) + honeypot + client-side rate limit |
| Icons / fonts | Font Awesome 6 and Inter (Google Fonts), both loaded from CDNs |

## Getting started

Requirements: Node 20+ (CI uses 20). The repo has a `pnpm-lock.yaml`; `npm` works too.

```bash
pnpm install        # or: npm install
pnpm start          # https://localhost:4272 (self-signed cert from ./ssl)
```

Your browser will warn about the self-signed certificate on first visit — that's expected for local dev.

### Scripts

| Script | What it does |
| --- | --- |
| `start` | Dev server on `https://localhost:4272` with live reload |
| `build` | Production browser build into `dist/shakoor-portfolio`, then writes `sitemap.xml` |
| `prerender` | Production build **plus** static prerender of every route, then writes `sitemap.xml`. This is what CI runs |
| `build:ssr` / `serve:ssr` / `dev:ssr` | Express-based SSR variants (not used in production) |
| `watch` | Development build in watch mode |

To preview the production output locally:

```bash
npm run prerender
python3 -m http.server 4321 --directory dist/shakoor-portfolio    # or any static file server
```

## Project structure

```
src/
├── index.html                 Head metadata: SEO, Open Graph, Twitter, JSON-LD
├── apple-touch-icon.png       180×180 iOS home-screen icon
├── favicon.svg
├── robots.txt
├── CNAME                      Custom domain for GitHub Pages
├── assets/
│   ├── og-image.jpg           1200×630 social-sharing card
│   └── files/                 Résumé PDFs / markdown, profile photo
├── environments/              Contact-form and Turnstile keys (dev / prod)
└── app/
    ├── components/            hero, about, skills, experience, projects, contact, header, footer
    ├── pages/home/            Composes every section into the single page
    └── services/contact.service.ts   Posts the contact form to Web3Forms
scripts/
└── generate-sitemap.mjs       Writes dist/…/sitemap.xml with a real <lastmod>
docs/                          Audit notes and the SEO / performance roadmap
```

## Updating content

Most content is plain data inside the component classes:

| Section | File |
| --- | --- |
| Hero text and rotating job titles | `src/app/components/hero/hero.component.html` (`data-rotate`) |
| About summary, highlights, stats, contact details | `src/app/components/about/about.component.ts` |
| Skills | `src/app/components/skills/skills.component.ts` |
| Work history | `src/app/components/experience/experience.component.ts` |
| Architecture case studies | `src/app/components/projects/projects.component.ts` |

Keep these in sync when something changes:

- **Contact details** appear in `index.html` (JSON-LD), the hero, About and Contact components, and the résumé markdown. The public email is `binmushtaq@gmail.com`; the Outlook address is listed as a Teams ID only. The phone number is deliberately **not** in the JSON-LD.
- **Title / description / job title** are duplicated in `index.html` across `<title>`, `description`, Open Graph, Twitter and JSON-LD.
- **Social card:** to change it, replace `src/assets/og-image.jpg` with a 1200×630 JPEG (keep it under ~100 KB). The dimensions are declared in `index.html`.
- **Sitemap:** generated at build time — don't edit it by hand. Routes are listed in `scripts/generate-sitemap.mjs`.

## Contact form configuration

Keys live in `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod). Both the Web3Forms access key and the Turnstile **site** key are designed to be public.

- Development uses Cloudflare's always-pass test site key.
- Turnstile's script is **lazy-loaded**: it is requested only when the form is within ~400px of the viewport or a field receives focus, not on page load.
- Spam controls: a hidden honeypot field (`botcheck`), a 60 s client-side rate limit, and the Turnstile widget gating the submit button.

> **Known limitation:** the Turnstile token is not yet forwarded to Web3Forms for server-side verification, so the widget currently only gates the UI. See [the roadmap](docs/seo-performance-roadmap.md#known-issues).

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`:

1. Check out the full history (needed so the sitemap's `lastmod` reflects the last real change to `src/`).
2. `npm install`, then `npm run prerender`.
3. Add `.nojekyll` and copy `index.html` to `404.html`.
4. Upload `dist/shakoor-portfolio/` and deploy to GitHub Pages.

The site is served at the domain in `src/CNAME`. GitHub Pages does not allow custom response headers, so cache lifetime is fixed at 10 minutes.

## SEO and performance

In place today:

- Fully prerendered HTML — crawlers and link-preview bots see real content without running JavaScript.
- Canonical URL, meta description, Open Graph and Twitter Card tags with a 1200×630 image.
- JSON-LD `Person` structured data.
- `robots.txt` and a build-generated `sitemap.xml`.
- Non-blocking fonts and icon CSS, preloaded hero image with `fetchpriority="high"`, and a lazy-loaded Turnstile script.

The largest remaining cost is the Angular runtime (~105 KB gzipped JS for a mostly static page). The plan to remove it — including a migration to Astro — is in **[docs/seo-performance-roadmap.md](docs/seo-performance-roadmap.md)**.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/seo-performance-roadmap.md](docs/seo-performance-roadmap.md) | Phased SEO / performance plan with status, measurements, known issues |
| [docs/performance-enhancement-v001.md](docs/performance-enhancement-v001.md) | Original Lighthouse-based audit, annotated with current status |

## License

[MIT](LICENSE) © Shakoor Hussain Attari
