import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { pages } from './helpers';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; version: string };
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('package.json holds a valid SemVer version', () => {
  expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
});

// The version is part of every page's footer (including the 404), linked to its GitHub Release, with
// the build's commit and date in the tooltip.
for (const path of [...pages, '/404.html']) {
  test(`${path} shows the version in the footer, linked to its release`, async ({ page }) => {
    await page.goto(path);
    const link = page.locator('footer a.version');
    await expect(link).toHaveText(`v${pkg.version}`);
    expect(await link.textContent(), 'no stray whitespace inside the link').toBe(`v${pkg.version}`);
    await expect(link).toHaveAttribute('href', new RegExp(`/releases/tag/v${escape(pkg.version)}$`));
    await expect(link).toHaveAttribute('title', new RegExp(`^Version ${escape(pkg.version)} · build [0-9a-f]{7}`));
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
}

test('/version.json describes the build and matches the footer and the <html> attributes', async ({
  page,
  request,
}) => {
  const response = await request.get('/version.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');

  const info = await response.json();
  expect(info).toMatchObject({
    name: pkg.name,
    version: pkg.version,
    environment: 'production',
    repository: 'https://github.com/shakoorattari/shakoorattari.github.io',
  });
  expect(info.versionFull).toMatch(new RegExp(`^${escape(pkg.version)}\\+[0-9a-f]{7}$`)); // SemVer build metadata
  expect(info.commit).toMatch(/^[0-9a-f]{40}$/);
  expect(info.commitDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(typeof info.dirty).toBe('boolean');
  expect(info.releaseNotes).toMatch(new RegExp(`/releases/tag/v${escape(pkg.version)}$`));

  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-version', pkg.version);
  await expect(html).toHaveAttribute('data-commit', info.commit.slice(0, 7));
});
