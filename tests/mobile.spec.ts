import { expect, test } from '@playwright/test';
import { pages } from './helpers';

test.describe('mobile menu', () => {
  test('opens, closes when a link is chosen, and closes on Escape', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.menu-toggle');
    const menu = page.locator('#primary-navigation');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect((await menu.boundingBox())!.x).toBeLessThan(0); // parked off-screen

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(async () => (await menu.boundingBox())!.x).toBeGreaterThanOrEqual(0);

    await menu.locator('a[href="#projects"]').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#projects$/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

for (const path of pages) {
  test(`${path} does not scroll horizontally`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('the primary calls to action are tappable (at least 40px tall)', async ({ page }) => {
  await page.goto('/');
  const heights = await page.$$eval('.hero-buttons a', (links) => links.map((l) => l.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(40);
});
