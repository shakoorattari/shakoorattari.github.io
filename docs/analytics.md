# Analytics

How visits are measured on shakoorattari.com, how Google Analytics is wired in, and what you need to do to turn it on.

**Short version:** the code is finished and **off until you add a Measurement ID**. Google Analytics is **opt-in**: Google's script is only requested after a visitor clicks *Accept*. Setup is in [Turn it on](#turn-it-on-your-steps).

## "How much is my site's rating?" — which tool answers what

Google Analytics measures **visitors and behaviour**. It has no rating, score or ranking. These tools answer the different questions:

| Question | Tool | Notes |
|---|---|---|
| How many people visit? Where from? Which pages? Did anyone download my résumé or contact me? | **Google Analytics 4** (this doc) | Only counts visitors who accept the notice |
| How many people visit, *counting everyone*? | **Cloudflare Web Analytics** (optional, [visibility-playbook §3.3](visibility-playbook.md)) | Cookieless, so it needs no consent; it complements GA |
| Does Google show my site? For which searches? At what position? Is the site indexed? | **Google Search Console** | The closest thing to a "rating in Google": impressions, clicks, average position, indexing problems |
| How fast and healthy is it for real visitors? | **Search Console → Core Web Vitals**, and [PageSpeed Insights](https://pagespeed.web.dev/) | Real-user data appears only once there is enough traffic |
| Is the site's quality (performance, accessibility, SEO) holding up? | **Lighthouse CI** (runs on every PR; see [ci-cd.md](ci-cd.md)) | Currently 100 / 100 / 100 / 100 in the lab |

Search Console can be linked into Google Analytics (step 9 below), so queries and positions show up beside the traffic.

## How Google Analytics is wired in

Design goals, in priority order: protect visitors' privacy, keep the site fast, keep your numbers clean. They follow the project rules in [CLAUDE.md](../CLAUDE.md) §6 ("no third-party requests on load").

**Opt-in.** The flow:

1. A visitor with no stored choice sees a small notice once the page has loaded and the browser is idle. *Accept* and *Decline* are styled identically on purpose.
2. **Accept** → the Measurement ID is configured and Google's `gtag.js` is requested. **Decline** → nothing is ever requested.
3. The choice is stored in the browser (`analytics-consent` in `localStorage`) for 12 months, then asked again.
4. A **Privacy choices** button in the footer lets a visitor change their mind at any time. Withdrawing stops measurement (`ga-disable-<ID>`, consent update) and deletes the `_ga*` cookies.
5. Visitors sending the **Global Privacy Control** signal are never asked and never measured, even if they accepted earlier.

**It stays dormant**, with no notice, no script and no requests, in these cases:

- no Measurement ID is configured (the default);
- `astro dev` (development builds), so local work never reaches your property;
- any hostname other than `shakoorattari.com` / `www.shakoorattari.com` (override with `PUBLIC_GA_HOSTS`), so a production build served from localhost or a preview URL can't pollute the data;
- the CI **test** builds (Playwright, Lighthouse), which are built with the ID blanked. Without that, every CI run would send fake visits from GitHub's servers to your real property once the variable is set.

**What is configured when it runs**

- Consent Mode v2: `ad_storage`, `ad_user_data`, `ad_personalization` are denied permanently (no advertising features); `analytics_storage` is granted because the code only runs after acceptance.
- `allow_google_signals: false` and `allow_ad_personalization_signals: false`.
- Cookie lifetime 13 months (Google's default is 2 years). Google states that GA4 doesn't log or store IP addresses.
- One custom event: **`generate_lead`** with `{ method }` — `contact_form` or `quote_form` when a form is sent successfully, `whatsapp` or `phone` when a WhatsApp or call button on the quote page or in the Contact section is clicked (`data-lead`, wired by `trackLeadClicks()` in `src/scripts/form-kit.ts`). Only the channel is sent, never what was typed. It never includes anything the visitor typed. GA4's enhanced measurement adds page views, scrolls, outbound clicks and file downloads (the résumé PDF) with no extra code.
- A malformed `PUBLIC_GA_MEASUREMENT_ID` **fails the build** with an explanatory error, instead of silently shipping nothing.

**What it costs.** Measured with a placeholder ID and the recording endpoints blocked:

| Visitor | Google requests | Extra weight |
|---|---|---|
| Hasn't decided, or declined | **0** | the inlined script (about 1.2 KB gzipped) plus the notice markup |
| Accepted | 1 (`gtag.js`) | about **150 KB** over the wire, more than the whole home page (about 95 KB); no main-thread long tasks |

That cost is the reason it is opt-in: nobody pays it, and nobody is tracked, until they agree. A real property's script may differ somewhat from the placeholder's.

The privacy page ([`/privacy/`](../src/pages/privacy.astro)) is generated from the same build configuration, so it only describes tools that are actually enabled.

## Turn it on (your steps)

Needs your Google account, so it can't be done from the repo. About 15 minutes. Google renames menu items now and then, so go by the names.

1. **Create the property.** [analytics.google.com](https://analytics.google.com) → *Admin* → *Create* → *Property*. Name `shakoorattari.com`, time zone *United Arab Emirates*, currency *AED*.
2. **Create a web data stream.** *Admin* → *Data streams* → *Add stream* → *Web*. URL `https://shakoorattari.com`.
3. **Tune enhanced measurement.** In the stream, open *Enhanced measurement* (gear icon). Leave *Page views*, *Scrolls*, *Outbound clicks* and *File downloads* on. **Turn off *Page changes based on browser history events*:** this is a single-page site with `#anchor` navigation, and leaving it on counts an extra page view every time someone uses the menu.
4. **Copy the Measurement ID** (`G-XXXXXXXXXX`, top right of the stream details).
5. **Give it to the site.** GitHub → the repository → *Settings* → *Secrets and variables* → *Actions* → *Variables* → *New repository variable*: name `GA_MEASUREMENT_ID`, value the ID. (It's public by design: it is visible in the page source of any site that uses it.)
6. **Deploy.** *Actions* → *Deploy to GitHub Pages* → *Run workflow* on `main` (or merge any change). The deployed build now carries the notice.
7. **Set data retention to 14 months.** *Admin* → *Data collection and modification* → *Data retention* → *Event data retention* → 14 months. The default is only 2 months, which would make year-over-year comparison impossible. The privacy page says "a maximum of 14 months".
8. **Mark `generate_lead` as a key event** once it has appeared (*Admin* → *Events*, or *Data display* → *Events*): that makes "contact form sent" show up as a conversion.
9. **Link Search Console.** *Admin* → *Product links* → *Search Console links* → *Link*. You need the site verified in Search Console first ([visibility-playbook §3.1](visibility-playbook.md)).
10. **Keep your own visits out.** Click *Decline* in the browsers you use for the site (that's remembered), or define your IP as internal traffic under *Data streams* → *Configure tag settings* → *Define internal traffic* and activate the filter.

## Check it works

1. Open the live site in a normal (non-incognito, extensions off) window. After a moment the notice appears.
2. Click **Accept**. In DevTools → Network you should see `gtag/js?id=G-…` and then `collect` requests; the footer now offers **Privacy choices**.
3. In Google Analytics → *Reports* → *Realtime*, your visit appears within about a minute.
4. Open the contact form and send yourself a test message; `generate_lead` appears in *Realtime* → *Event count by Event name*.
5. Click **Privacy choices → Decline**; the `_ga` cookies disappear and no more `collect` requests go out.

If nothing shows up: an ad blocker or browser privacy feature is blocking Google (common, and a normal reason GA under-counts); or the deploy ran before the variable was set (check the page source for `data-ga-id="G-…"`).

## Reading the numbers

- **GA will undercount.** It counts only visitors who accept (and don't block it). Treat it as "the engaged, consenting slice". For total traffic use Cloudflare Web Analytics, and for search performance use Search Console.
- A single-page site has few "pages": look at *Reports* → *Engagement* → *Events* (scroll, `file_download`, `click`, `generate_lead`) and *Acquisition* → *Traffic acquisition* (where visitors come from).
- Expect small numbers for months. Judge trends, not days.

## Changing the approach later

- **See more visitors, with less privacy rigour** — "advanced" consent mode loads Google's script for everyone and sends cookieless pings until consent. It raises coverage but sends data to Google without a choice and loads ~150 KB for every visitor, which breaks the "no third-party requests on load" rule. Not done.
- **Remove Google Analytics** — delete the `GA_MEASUREMENT_ID` variable and redeploy; the notice, the footer button and the script disappear.
- **Move Google's script off the main thread** — Partytown / Zaraz are options if the opt-in cost ever matters. Not needed today (no long tasks measured).

## Tests

- `npm run test:e2e` — the default build (no ID) must ship **no** analytics, no notice and no footer button, and the privacy page must say so.
- `npm run test:analytics` — builds once with a *fake* ID (`G-TEST123456`) into `dist-analytics/` and runs 15 tests with Google's endpoints mocked: asks first (no requests, cookies or `gtag`), Accept/Decline equally prominent, the exact consent and config calls, returning visitors, Decline, GPC, expiry after a year, the hostname guard, withdrawal deleting cookies and restoring focus, keyboard order, `generate_lead` without any form content (contact form, and the quote form with its WhatsApp and call buttons by channel), and nothing reported without consent.
- Both run in CI. Each behaviour above was mutation-tested: eight deliberate regressions (tracking before consent, ignoring GPC, leaving cookies, removing the hostname guard, leaking an email into an event, granting ad storage, making Accept more prominent, enabling Google signals) were each caught by its test.
- Lighthouse CI was also run against the opt-in build with the notice showing: 100 / 100 / 100 / 100 on all six pages, unchanged LCP and CLS.

## Troubleshooting

- **The build fails with "not a valid GA4 Measurement ID"** — the variable holds something other than `G-` plus letters/digits (for example an old `UA-` ID, or a Tag Manager `GTM-` ID). Copy the ID from *Data streams*.
- **The notice never appears on the live site** — the page was built without the variable, or you're on a hostname that isn't `shakoorattari.com`, or your browser sends Global Privacy Control (which suppresses the notice by design).
- **The notice keeps coming back** — the browser blocks `localStorage` (private mode), or the stored choice is over a year old.
- **Local testing** — `PUBLIC_GA_MEASUREMENT_ID=G-TEST123456 PUBLIC_GA_HOSTS=localhost npx astro build`, then `node scripts/serve-dist.mjs` (not `astro preview`, which daemonizes in Astro 7). Use a fake ID so nothing reaches the real property.
