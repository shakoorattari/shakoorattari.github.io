import { expect, test } from '@playwright/test';
import { pages } from './helpers';

// Catches the breakage screenshots hide: a broken <img> just renders blank, a failed font or
// script is easy to miss. Also guards the "light" promise: no third-party requests, tiny JS.
const ANALYTICS_HOSTS = /cloudflareinsights\.com/; // the optional analytics beacon is the only allowed third party

for (const path of pages) {
  test(`${path} loads with no errors, failed requests or third-party requests`, async ({ page, baseURL }) => {
    const problems: string[] = [];
    const thirdParty: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('requestfailed', (request) => {
      if (!ANALYTICS_HOSTS.test(request.url())) problems.push(`request failed: ${request.url()}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && !ANALYTICS_HOSTS.test(response.url())) {
        problems.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith(baseURL!) && !url.startsWith('data:') && !ANALYTICS_HOSTS.test(url)) thirdParty.push(url);
    });

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    expect(problems, problems.join('\n')).toEqual([]);
    expect(thirdParty, `unexpected third-party requests:\n${thirdParty.join('\n')}`).toEqual([]);
  });
}

test('the home page ships almost no JavaScript', async ({ page }) => {
  let scriptBytes = 0;
  const pending: Promise<void>[] = [];
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') {
      pending.push(response.body().then((body) => void (scriptBytes += body.length)));
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await Promise.all(pending);

  // Budget: 20 KB of (uncompressed) external JavaScript. It is ~5 KB today; blowing this budget
  // means a framework or a heavy library crept in.
  expect(scriptBytes).toBeGreaterThan(0);
  expect(scriptBytes).toBeLessThan(20_000);
});

test('every image has alt text and explicit dimensions (no layout shift)', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const bad = await page.$$eval('img', (images) =>
      images
        .filter((img) => !img.hasAttribute('alt') || !img.getAttribute('width') || !img.getAttribute('height'))
        .map((img) => img.getAttribute('src')),
    );
    expect(bad, `${path} has images missing alt/width/height`).toEqual([]);
  }
});

test('the skip link is the first focusable element and reaches <main>', async ({ page }) => {
  await page.goto('/services/');
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('main#main')).toHaveCount(1);
});
