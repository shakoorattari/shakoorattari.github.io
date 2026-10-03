import { expect, test } from '@playwright/test';
import { recommendations, recommendationsUrl } from '../src/data/recommendations';

// Not imported from src/data/work.ts: that file imports the screenshots, which Playwright cannot load.
const pageItems = [
  {
    slug: 'earth-cone',
    name: 'Earth Cone Building Contracting',
    url: 'https://earthconecontracting.com/',
    services: ['website-design-development', 'seo-performance'],
  },
  {
    slug: 'lail-o-nahar',
    name: 'Lail O Nahar Machinery Rentals',
    url: 'https://lailonahar-website.pages.dev/',
    services: ['website-design-development', 'seo-performance'],
  },
  {
    slug: 'komorebi-cameron',
    name: 'Komorebi Cameron',
    url: 'https://attari-home.github.io/Komorebi-Cameron/',
    services: ['website-design-development'],
  },
  {
    slug: 'uae-information-chatbot',
    name: 'UAE Information AI Chatbot',
    url: 'https://attari-home.github.io/ai-chatbot-ali/',
    services: ['web-application-development'],
  },
];
// Too small for a page of its own: the card links straight to the repository.
const linkItem = {
  slug: 'hand-gesture-ai',
  name: 'HandGestureAI',
  repo: 'https://github.com/Attari-Home/HandGestureAI',
};
const cardCount = pageItems.length + 1;

test('the nav links to Work and ends with a Get a quote button that is current on the quote page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nav-links a[href="/work/"]')).toHaveText('Work');
  const cta = page.locator('.nav-links a.nav-cta');
  await expect(cta).toHaveText('Get a quote');
  await expect(cta).toHaveAttribute('href', '/quote/');

  await cta.click();
  await expect(page).toHaveURL(/\/quote\/$/);
  await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveText('Get a quote');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Request a quote');
});

test('the home page shows the work gallery: page cards open their page, the experiment opens GitHub', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#work .work-card')).toHaveCount(cardCount);
  for (const item of pageItems) {
    await expect(page.locator(`#work a[href="/work/${item.slug}/"]`)).toHaveText(item.name);
  }
  await expect(page.locator('#work img')).toHaveCount(pageItems.length); // the link-only card has an icon, not a screenshot

  const repoLink = page.locator(`#work a[href="${linkItem.repo}"]`);
  await expect(repoLink).toContainText(linkItem.name);
  await expect(repoLink).toHaveAttribute('target', '_blank');
  await expect(repoLink).toHaveAttribute('rel', /noopener/);
  await expect(repoLink).toHaveAttribute('aria-label', /opens in a new tab/);
});

test('/work/ separates client websites from own projects, and labels each card', async ({ page }) => {
  await page.goto('/work/');
  await expect(page.locator('#clients-title')).toHaveText('Client websites');
  await expect(page.locator('#projects-title')).toHaveText('Own projects & experiments');
  const clients = page.locator('section[aria-labelledby="clients-title"] .work-card');
  const projects = page.locator('section[aria-labelledby="projects-title"] .work-card');
  await expect(clients).toHaveCount(2);
  await expect(projects).toHaveCount(3);
  await expect(clients.locator('.work-kind')).toHaveText(['Client project', 'Client project']);
  await expect(projects.locator('.work-kind')).toHaveText(['Own project', 'Own project', 'Own project']);
});

test('the experiment has no page of its own: not routable, not in the sitemap, but listed in llms.txt', async ({
  page,
  request,
}) => {
  expect((await request.get(`/work/${linkItem.slug}/`)).status()).toBe(404);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain(linkItem.slug);
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain(linkItem.repo);
  await page.goto('/work/');
  await expect(page.locator(`a[href="${linkItem.repo}"]`)).toHaveCount(1);
});

for (const item of pageItems) {
  test(`/work/${item.slug}/ links to the live site safely and shows its screenshot`, async ({ page }) => {
    await page.goto(`/work/${item.slug}/`);
    const live = page.locator('.page-meta a.live-link');
    await expect(live).toHaveAttribute('href', item.url);
    await expect(live).toHaveAttribute('target', '_blank');
    await expect(live).toHaveAttribute('rel', /noopener/);
    const shot = page.locator('.work-shot img');
    expect(((await shot.getAttribute('alt')) ?? '').length).toBeGreaterThan(30);
    expect(await shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    // the service pages it evidences link back to it
    for (const slug of item.services) await expect(page.locator(`a[href="/services/${slug}/"]`).first()).toBeVisible();
  });
}

test('the chatbot page says plainly what it is not', async ({ page }) => {
  await page.goto('/work/uae-information-chatbot/');
  await expect(page.locator('.page-meta')).toContainText('Project type');
  const scope = page.locator('section[aria-labelledby="scope-title"]');
  await expect(scope).toContainText('not backed by a large language model');
  await expect(scope).toContainText('PictoBlox');
  await expect(page.locator('.page-meta a.repo-link')).toHaveAttribute(
    'href',
    'https://github.com/Attari-Home/ai-chatbot-ali',
  );
  await expect(page.locator('.cta-panel h2')).toHaveText('Need a web app?');
});

test('the services hub offers the website and SEO services and the quote path', async ({ page }) => {
  await page.goto('/services/');
  await expect(page.locator('a[href="/services/website-design-development/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/services/seo-performance/"]').first()).toBeVisible();
  await expect(page.locator('.info-card a.more[href="/quote/"]')).toBeVisible();
  await expect(page.locator('.cta-panel a[href="/quote/"]')).toBeVisible();
});

test.describe('recommendations', () => {
  test('the home page shows each LinkedIn recommendation exactly as written, with who wrote it', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#recommendations');
    const quotes = await section.locator('blockquote p').allTextContents();
    expect(quotes).toEqual(recommendations.map((r) => r.text));

    const captions = await section.locator('figcaption').allTextContents();
    recommendations.forEach((r, i) => {
      expect(captions[i]).toContain(r.name);
      expect(captions[i]).toContain(r.role);
      expect(captions[i]).toContain(r.relationship);
    });
  });

  test('the section links to the full recommendations on LinkedIn', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('.social-proof-link a');
    await expect(link).toHaveAttribute('href', recommendationsUrl);
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('the services hub repeats them', async ({ page }) => {
    await page.goto('/services/');
    await expect(page.locator('#says-title')).toBeVisible();
    expect(await page.locator('.rec blockquote p').allTextContents()).toEqual(recommendations.map((r) => r.text));
  });
});
