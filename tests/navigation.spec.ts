import { expect, test } from '@playwright/test';
import { freezeMotion, jumpTo } from './helpers';

const sections = ['home', 'about', 'skills', 'experience', 'projects', 'contact'];

test('the header gains a background once the page scrolls', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.site-header');
  await expect(header).not.toHaveClass(/scrolled/);
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await expect(header).toHaveClass(/scrolled/);
});

for (const id of sections) {
  test(`scroll-spy marks #${id} as the current section`, async ({ page }) => {
    await page.goto('/');
    await jumpTo(page, `#${id}`);
    const active = page.locator('.nav-links a.active');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('href', `#${id}`);
    await expect(active).toHaveAttribute('aria-current', 'location');
  });
}

test('clicking a nav link lands below the fixed header and does not rewrite the path', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-links a[href="#skills"]').click();
  await expect(page).toHaveURL(/#skills$/);
  await expect
    .poll(async () => {
      const top = await page.locator('#skills').evaluate((el) => Math.round(el.getBoundingClientRect().top));
      return top >= 50 && top <= 80;
    })
    .toBe(true);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('the Services link is a real page and is marked current there', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-links a[href="/services/"]').click();
  await expect(page).toHaveURL(/\/services\/$/);
  await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveText('Services');
  // From a sub-page, anchor links must point back to the home page sections.
  await expect(page.locator('.nav-links a', { hasText: 'About' })).toHaveAttribute('href', '/#about');
});

test('experience details expand and collapse, and collapsed text stays in the DOM', async ({ page }) => {
  await page.goto('/');
  const jobs = page.locator('.job-more');
  await expect(jobs).toHaveCount(3);
  await expect(jobs.nth(0)).toHaveAttribute('open', ''); // the current job starts expanded
  await expect(jobs.nth(1)).not.toHaveAttribute('open', '');

  // Indexable even while collapsed.
  const collapsedText = await jobs.nth(2).locator('.job-details').textContent();
  expect((collapsedText ?? '').trim().length).toBeGreaterThan(300);

  await jumpTo(page, '.job-more >> nth=1', 'center');
  await jobs.nth(1).locator('summary').click();
  await expect(jobs.nth(1)).toHaveAttribute('open', '');
  await expect(jobs.nth(1).locator('.when-open')).toBeVisible();
  await expect(jobs.nth(1).locator('.when-closed')).toBeHidden();
  await expect(jobs.nth(1).locator('.job-details')).toBeVisible();
});

test('the role line types through several roles', async ({ page }) => {
  await page.goto('/');
  const role = page.locator('.dynamic-text');
  const first = await role.textContent();
  expect(first?.length).toBeGreaterThan(0); // rendered in the HTML, not injected
  await expect.poll(async () => role.textContent(), { timeout: 10_000 }).not.toBe(first);
});

test('reduced motion: the role line stays still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const role = page.locator('.dynamic-text');
  const first = await role.textContent();
  await page.waitForTimeout(3500); // longer than the 2 s the animation would wait before it starts
  expect(await role.textContent()).toBe(first);
});

// Prettier reformats markup, and inline whitespace is significant in HTML. These pin the places that
// are guarded with <!-- prettier-ignore --> so a formatter or a refactor can't silently widen them.
test.describe('whitespace-sensitive markup', () => {
  test('the logo text has no stray spaces', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('.logo-text').first().textContent()).toBe('<SHA />');
  });

  test('the role line has no whitespace between its two spans', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // "I'm a" must run straight into the role text; the visible gap comes from CSS margin.
    expect(await page.locator('.role').textContent()).toMatch(/I'm a\S/);
  });

  test('the period follows the LinkedIn link directly', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('.social-proof-link').textContent()) ?? '';
    expect(text.trim()).toMatch(/LinkedIn profile\.$/);
  });
});

test('layout is stable: the hero has no unexpected shift after load', async ({ page }) => {
  await page.goto('/');
  await freezeMotion(page);
  const before = await page.locator('.hero-content h1').boundingBox();
  await page.waitForTimeout(800);
  const after = await page.locator('.hero-content h1').boundingBox();
  expect(after).toEqual(before);
});
