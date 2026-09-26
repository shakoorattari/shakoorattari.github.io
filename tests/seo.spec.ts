import { expect, test } from '@playwright/test';
import { pages } from './helpers';

const SITE = 'https://shakoorattari.com';
const pathOf = (url: string) => new URL(url).pathname;

test('the sitemap lists exactly the indexable pages, and each one resolves', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => pathOf(m[1]));

  for (const path of pages) expect(locs, `sitemap is missing ${path}`).toContain(path);
  // Anything else in the sitemap must be the blog (only present once a post is published).
  for (const path of locs) {
    if (!pages.includes(path)) expect(path.startsWith('/blog/'), `unexpected sitemap URL ${path}`).toBe(true);
    const response = await request.get(path);
    expect(response.status(), `${path} should resolve`).toBe(200);
    expect(await response.text()).toContain(`<link rel="canonical" href="${SITE}${path}"`);
  }
});

for (const path of pages) {
  test(`${path} has a working social preview and valid structured data`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (selector: string) => page.locator(selector).first().getAttribute('content');

    const ogImage = await meta('meta[property="og:image"]');
    expect(ogImage, 'og:image is an absolute URL').toMatch(/^https:\/\//);
    expect(await meta('meta[name="twitter:image"]')).toBe(ogImage);
    expect(await meta('meta[property="og:image:width"]')).toBe('1200');
    expect(await meta('meta[property="og:image:height"]')).toBe('630');
    expect(await meta('meta[property="og:url"]')).toBe(`${SITE}${path}`);

    // The URL points at the production origin; the same file must be served by the preview.
    const image = await request.get(pathOf(ogImage!));
    expect(image.ok(), 'og:image is served').toBe(true);
    expect(image.headers()['content-type']).toContain('image/jpeg');

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, 'has JSON-LD').toBeGreaterThan(0);
    const types: string[] = [];
    for (const raw of blocks) {
      const data = JSON.parse(raw);
      expect(data['@context']).toBe('https://schema.org');
      for (const node of data['@graph'] ?? [data]) types.push(node['@type']);
    }
    if (path === '/') expect(types).toEqual(expect.arrayContaining(['Person', 'WebSite', 'ProfilePage']));
    else expect(types).toContain('BreadcrumbList');
    if (path.startsWith('/services/') && path !== '/services/') expect(types).toContain('Service');
  });
}

test('robots.txt, llms.txt and the RSS feed are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);

  const llms = await (await request.get('/llms.txt')).text();
  for (const path of ['/services/', '/projects/', '/services/identity-sso-oauth/'])
    expect(llms).toContain(`${SITE}${path}`);

  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<rss');
});

test.describe('legacy URLs and errors', () => {
  for (const id of ['about', 'skills', 'experience', 'contact']) {
    test(`/${id}/ redirects to /#${id}`, async ({ page }) => {
      await page.goto(`/${id}/`);
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
      await expect(page.locator(`#${id}`)).toBeVisible();
    });
  }

  test('/projects/ is the case-study hub, not a redirect', async ({ page }) => {
    await page.goto('/projects/');
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Architecture case studies');
  });

  test('the 404 page is noindex and links home', async ({ page, request }) => {
    const response = await request.get('/definitely-not-a-page/');
    expect(response.status()).toBe(404);
    await page.goto('/404.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('link', { name: 'Back to the portfolio' })).toHaveAttribute('href', '/');
  });
});

test('the blog is only indexable once it has published posts', async ({ page, request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  const listed = xml.includes(`${SITE}/blog/`);
  await page.goto('/blog/');
  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  if (listed) expect(robots).toMatch(/^index/);
  else expect(robots).toMatch(/noindex/);
  // Drafts and outlines must never leak into a production build.
  expect(await page.content()).not.toContain('Outline, not an article');
});
