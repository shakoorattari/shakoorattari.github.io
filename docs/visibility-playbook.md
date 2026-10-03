# Visibility playbook

How to get found by people looking for a software engineer, website or application development, or the skills on the résumé. The site is now technically sound and content-rich; most of what remains needs your accounts and your voice, so it lives here as a checklist.

**Last reviewed:** 2026-09-26

## 1. Where things stood

Checks run on 2026-09-26 (the search tool used is not Google itself, so confirm in Search Console):

- `site:shakoorattari.com` returned **none of the site's pages** — only GitHub pages that mention the domain.
- Searching the exact name **"Shakoor Hussain Attari"** did not surface the site either (ZoomInfo, SoundCloud and a Medium comment ranked instead).
- The site was technically crawlable: HTTP 200, correct canonical, valid `sitemap.xml`, nothing blocking robots. So the cause is **discovery**, not a technical fault: a new domain with no inbound links and no Search Console setup.
- The site had **no analytics**, so any visits that did occur were invisible.
- Broad queries ("hire .NET Angular developer UAE") are dominated by Indeed, Bayt, Glassdoor and freelance marketplaces. **Niche technical queries are winnable** — e.g. "UAE PASS OAuth OIDC integration .NET" mostly returns Medium posts and small agency blogs.
- GitHub lists the location as **Dubai** while the site and résumé say **Sharjah**.

## 2. Realistic expectations

| Timeframe | What is plausible |
|---|---|
| 1–2 weeks | Pages discovered and indexed once Search Console is set up and indexing is requested |
| 1–2 months | The site ranks first for your own name plus a role word ("Shakoor Attari software engineer") |
| 3–6 months | First impressions and clicks for niche technical queries, *if* you publish useful articles and earn a few real links |
| Ongoing | Broad terms ("software engineer UAE", "website development") stay owned by job boards and agencies; treat them as a long game, not a goal |

Also: most recruiters find engineers on **LinkedIn**, not Google. The site's main job is to validate you when they look, and to catch niche technical searches.

## 3. Do these first (about 30 minutes)

### 3.1 Google Search Console
1. Go to <https://search.google.com/search-console> and add a **Domain** property for `shakoorattari.com` (verify with a DNS TXT record at your registrar), *or* a **URL-prefix** property for `https://shakoorattari.com/`.
2. For URL-prefix, choose the HTML-tag method, copy the `content` value, and set it as a repository **variable** named `GOOGLE_SITE_VERIFICATION` (GitHub → Settings → Secrets and variables → Actions → **Variables**). Re-run the *Build and Deploy* workflow, then click Verify.
3. **Sitemaps** → submit `https://shakoorattari.com/sitemap.xml`.
4. **URL inspection** → paste each of these and click *Request indexing*: `/`, `/services/`, and each `/services/…` and `/projects/…` page.
5. Come back in a week: **Pages** shows what is indexed and, for anything not, the reason.

### 3.2 Bing Webmaster Tools
<https://www.bing.com/webmasters> → *Import from Google Search Console*, or add the site and submit the sitemap. Bing also feeds DuckDuckGo and others. (Optional repository variable: `BING_SITE_VERIFICATION`.)

### 3.3 Analytics
Two tools, complementary. **Google Analytics 4** (opt-in, consented visitors only; full steps in [analytics.md](analytics.md)) and **Cloudflare Web Analytics** (below; cookieless, counts everyone). Note that neither gives a "rating": Search Console (§3.1) is the closest thing to how Google rates the site.

**Cloudflare Web Analytics:**
1. Cloudflare dashboard → **Web Analytics** → *Add a site* → `shakoorattari.com` (no DNS change needed).
2. Copy the **token** from the snippet.
3. Set a repository **variable** `CF_ANALYTICS_TOKEN` to that token and re-run the workflow. The beacon is cookieless, so no consent banner is needed. Nothing is loaded until the token is set.

## 4. Links from places that already have authority

Links from established profiles are how a new site gets discovered and trusted. Do these (all free, all legitimate):

- **LinkedIn** — put `https://shakoorattari.com` in *Contact info → Website*; add it and a case study to the **Featured** section; make the headline searchable (e.g. "Lead Software Engineer | .NET, Angular, OAuth/OIDC | Sharjah, UAE"); use the same photo and name spelling as the site.
- **GitHub** — set the location to **Sharjah, UAE** to match the site; create a profile README (a repo named `shakoorattari` with a `README.md`) that links to the portfolio; pin your best repositories; add descriptions and topics to them.
- **Medium** (`@binmushtaq` appears to be yours) — complete the bio, add the website link, and cross-post articles with the **canonical URL** pointing back to your site.
- **dev.to / Hashnode / Stack Overflow** — a profile with a link back; useful answers on OAuth, UAE PASS or .NET build credibility.
- **Your employer's or community pages**, meetup and conference speaker pages, or open-source projects you contribute to — where the link is natural.

Avoid: buying links, link exchanges, directory or comment spam. They can cause penalties and are not worth the risk.

Once these profiles exist, add them to `site.social` and the `sameAs` list in `src/data/site.ts` and `src/layouts/Base.astro` so the structured data ties them to you.

## 5. Publish articles

The blog is built but launches empty on purpose: **nothing publishes until you finish it.** In `src/content/blog/` there are:

| File | What it is |
|---|---|
| `rebuilding-portfolio-angular-to-astro.md` | A complete draft article about this site's rebuild (real numbers, real bugs). Edit it in your voice, check every figure, set `draft: false` |
| `outline-multi-tenant-oauth-oidc-dotnet.md` | Outline with prompts only you can answer |
| `outline-uae-pass-entra-id-federation.md` | Outline — likely your best niche opportunity |
| `outline-mcp-servers-azure-devops-ad.md` | Outline |

To publish an outline: fill in the prompts with your real experience (keep it confidential-safe), rename the file, set `outline: false` and `draft: false`, and give it a `seoTitle` of 60 characters or fewer if the headline is longer. Preview drafts with `npm start` (drafts show only in dev). The build's SEO check fails if a published post has a bad title or description.

After publishing: request indexing in Search Console, share on LinkedIn, and cross-post with a canonical link. A useful cadence is one solid article every month or two, not many thin ones.

## 6. Target queries and the page that answers each

| Someone searches for… | Page |
|---|---|
| Shakoor Hussain Attari / Shakoor Attari software engineer | `/` |
| software engineer Sharjah / UAE, full-stack developer UAE | `/`, `/services/` |
| web / application development UAE, .NET Angular developer | `/services/web-application-development/` |
| OAuth 2.0 / OIDC consultant, multi-tenant IAM .NET, UAE PASS integration | `/services/identity-sso-oauth/`, `/projects/oneportal-iam/`, articles |
| API / integration developer, MS Graph, Exchange EWS, G2G integration | `/services/api-integration-microservices/` |
| solution architect UAE, technical lead | `/services/architecture-technical-leadership/` |
| Azure DevOps Server administrator, YAML pipeline templates | `/services/devops-ci-cd/` |
| MCP server .NET, Azure DevOps MCP, enterprise RAG | `/services/ai-tooling-mcp/`, articles |

## 7. Measure, monthly

- **Search Console → Performance:** impressions, clicks, average position and the actual queries. Queries with impressions but low clicks need a better title or description; queries at positions 8–20 are worth improving with content.
- **Cloudflare Web Analytics:** visits (everyone, cookieless), referrers (which links bring people), top pages.
- **Google Analytics 4:** engagement of the visitors who accepted: sources, countries, devices, `file_download` (résumé), outbound clicks, `generate_lead` (contact form). Expect it to under-count — see [analytics.md](analytics.md#reading-the-numbers).
- **Judge on trends over months**, not days.

## 8. What was deliberately not done

- No keyword stuffing, hidden text, or near-duplicate "doorway" pages: each service page has its own substance drawn from the résumé.
- No invented testimonials, reviews, client names, prices or numbers. Every claim on the new pages comes from your résumé and existing site data.
- No purchased or exchanged links.

## 9. Housekeeping and optional ideas

- **Consistency:** keep the name spelled "Shakoor Hussain Attari" and the location "Sharjah, UAE" on LinkedIn, GitHub, Medium, the résumé and the site.
- **Privacy:** the email and phone number are public on the site, so expect some spam. You can point visitors to the contact form instead of a `mailto:` link, and request removal from data brokers such as ZoomInfo.
- **A SoundCloud account under the same name** ranks for name searches. You can't remove it; stronger role-plus-name signals (above) are how the site wins those results.
- **Genuine testimonials** (with the giver's permission) would strengthen the Trust Signals section.
- **An Arabic version** with `hreflang` could reach local searches in Arabic.
- **Google Business Profile** only makes sense if you operate as a registered service business.
- Optional: **IndexNow** notifications on deploy speed up Bing/Yandex indexing.
