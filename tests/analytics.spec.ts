import { expect, test, type Page } from '@playwright/test';
import { fillForm, mockContactBackends, scrollToForm, validMessage } from './helpers';

// Two builds are covered:
//   - the default build has no Measurement ID: it must ship no analytics at all (runs in `npm run test:e2e`);
//   - a build with a FAKE ID (`npm run test:analytics`, ANALYTICS_BUILD=1) must behave correctly across the
//     consent flows. Google's endpoints are mocked, so nothing leaves the machine.

const analyticsBuild = process.env.ANALYTICS_BUILD === '1';
const GA_ID = 'G-TEST123456';
const GOOGLE = /(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net)/;
const STORAGE_KEY = 'analytics-consent';

type DataLayerEntry = unknown[];

/** Stand in for Google's endpoints and record every request made to them. */
async function mockGoogle(page: Page) {
  const requests: string[] = [];
  await page.route(GOOGLE, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      contentType: 'text/javascript',
      body: 'window.__googleScriptRuns = (window.__googleScriptRuns || 0) + 1;',
    });
  });
  return requests;
}

const dataLayer = (page: Page): Promise<DataLayerEntry[]> =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)),
  );

const banner = (page: Page) => page.locator('#analytics-consent');
const settingsButton = (page: Page) => page.locator('[data-consent-settings]');
const storedChoice = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { choice: string }).choice : null;
  }, STORAGE_KEY);
const isDisabled = (page: Page) =>
  page.evaluate((id) => (window as unknown as Record<string, boolean>)[`ga-disable-${id}`], GA_ID);
const storeChoice = (page: Page, choice: string, at = Date.now()) =>
  page.addInitScript(
    ([key, value, when]) => localStorage.setItem(key as string, JSON.stringify({ choice: value, at: when })),
    [STORAGE_KEY, choice, at] as const,
  );

// ---------------------------------------------------------------------------------------------------------
test.describe('default build: no Measurement ID', () => {
  test.skip(analyticsBuild, 'covered by the analytics build below');

  test('ships no analytics, no consent notice and no privacy-choices button', async ({ page, request }) => {
    for (const path of ['/', '/services/', '/privacy/']) {
      const html = await (await request.get(path)).text();
      expect(html, `${path} should not mention Google's script`).not.toMatch(
        /googletagmanager|google-analytics|gtag\(/,
      );
      expect(html, `${path} should not include the notice`).not.toContain('analytics-consent');
    }
    await page.goto('/');
    await expect(banner(page)).toHaveCount(0);
    await expect(settingsButton(page)).toHaveCount(0);
  });

  test('the privacy page says so, and every page links to it', async ({ page }) => {
    await page.goto('/services/');
    await expect(page.locator('footer a[href="/privacy/"]')).toHaveText('Privacy');
    await page.goto('/privacy/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
    await expect(page.locator('main')).toContainText('does not currently use analytics');
    await expect(page.locator('main')).not.toContainText('Google Analytics');
  });
});

test.describe('privacy page text', () => {
  // Prettier would put a link's trailing punctuation on its own line, which renders as "link ." — the block
  // is guarded with prettier-ignore, and this pins it.
  test('has no stray space before punctuation that follows a link', async ({ page }) => {
    await page.goto('/privacy/');
    const text = (await page.locator('main .prose').textContent()) ?? '';
    expect(text).not.toMatch(/\s[.,;)]/);
    expect(text).toContain('email me at binmushtaq@gmail.com.');
  });
});

// ---------------------------------------------------------------------------------------------------------
test.describe('build with a (fake) Measurement ID', () => {
  test.skip(!analyticsBuild, 'run with `npm run test:analytics`');

  test('asks first: no Google requests, no cookies and no gtag until the visitor decides', async ({
    page,
    context,
  }) => {
    const google = await mockGoogle(page);
    await page.goto('/');
    await expect(banner(page)).toBeVisible(); // revealed once the page has loaded and the browser is idle
    await page.waitForTimeout(1200);

    expect(google).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag)).toBe('undefined');
    expect(await storedChoice(page)).toBeNull();
    expect(await isDisabled(page)).toBe(true);
    await expect(banner(page)).toHaveAttribute('role', 'region');
    await expect(banner(page)).toHaveAttribute('aria-label', 'Analytics consent');
    await expect(banner(page).getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', '/privacy/');
  });

  test('Accept and Decline are equally prominent', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    const style = (name: string) =>
      banner(page)
        .getByRole('button', { name })
        .evaluate((el) => {
          const box = el.getBoundingClientRect();
          const css = getComputedStyle(el);
          return {
            w: Math.round(box.width),
            h: Math.round(box.height),
            bg: css.backgroundColor,
            color: css.color,
            weight: css.fontWeight,
            size: css.fontSize,
          };
        });
    expect(await style('Accept')).toEqual(await style('Decline'));
  });

  test('Accept loads Google once, with ad signals denied and Google signals off', async ({ page, context }) => {
    const google = await mockGoogle(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Accept' }).click();

    await expect(banner(page)).toBeHidden();
    await expect.poll(() => google.length).toBe(1);
    expect(google[0]).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    expect(await storedChoice(page)).toBe('granted');
    expect(await isDisabled(page)).toBe(false);

    const layer = await dataLayer(page);
    const names = layer.map((entry) => entry[0]);
    expect(names).toEqual(['consent', 'js', 'config']); // consent is set before anything is configured
    expect(layer[0]).toEqual([
      'consent',
      'default',
      { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' },
    ]);
    expect(layer[2]).toEqual([
      'config',
      GA_ID,
      { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 34128000 },
    ]);
    expect(context).toBeDefined();
  });

  test('an earlier acceptance loads Google after the page has loaded, without asking again', async ({ page }) => {
    await storeChoice(page, 'granted');
    const google = await mockGoogle(page);
    await page.goto('/');
    await expect.poll(() => google.length).toBe(1);
    await expect(banner(page)).toBeHidden();
  });

  test('Decline never loads Google, and is remembered', async ({ page }) => {
    const google = await mockGoogle(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Decline' }).click();
    await expect(banner(page)).toBeHidden();
    expect(await storedChoice(page)).toBe('denied');

    await page.reload();
    await page.waitForTimeout(1500);
    await expect(banner(page)).toBeHidden();
    expect(google).toEqual([]);
    expect(await isDisabled(page)).toBe(true);
  });

  test('Global Privacy Control is honoured, even over an earlier acceptance', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
    await storeChoice(page, 'granted');
    const google = await mockGoogle(page);
    await page.goto('/');
    await page.waitForTimeout(1500);

    expect(google).toEqual([]);
    await expect(banner(page)).toHaveCount(0);
    await expect(settingsButton(page)).toHaveCount(0);
  });

  test('a choice older than a year is asked again', async ({ page }) => {
    const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
    await storeChoice(page, 'granted', twoYearsAgo);
    const google = await mockGoogle(page);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    expect(google).toEqual([]);
  });

  test('other hostnames stay dormant (a production build served elsewhere cannot pollute the property)', async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === '/',
      async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replace('data-hosts="localhost"', 'data-hosts="example.com"');
        await route.fulfill({ response, body });
      },
    );
    await storeChoice(page, 'granted');
    const google = await mockGoogle(page);
    await page.goto('/');
    await page.waitForTimeout(1500);

    expect(google).toEqual([]);
    await expect(banner(page)).toHaveCount(0);
    await expect(settingsButton(page)).toHaveCount(0);
  });

  test('"Privacy choices" reopens the notice; withdrawing stops measurement and deletes the cookies', async ({
    page,
  }) => {
    await storeChoice(page, 'granted');
    const google = await mockGoogle(page);
    await page.goto('/privacy/');
    await expect.poll(() => google.length).toBe(1);
    await page.evaluate(() => (document.cookie = '_ga=GA1.1.111.222; path=/'));
    await page.evaluate(() => (document.cookie = '_ga_TEST123456=GS1.1.333; path=/'));
    await page.evaluate(() => (document.cookie = 'unrelated=keep; path=/'));

    const privacyChoices = settingsButton(page);
    await privacyChoices.click();
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toBeFocused(); // moved into the notice, since the visitor asked for it

    await banner(page).getByRole('button', { name: 'Decline' }).click();
    await expect(banner(page)).toBeHidden();
    await expect(privacyChoices).toBeFocused(); // and handed back

    expect(await storedChoice(page)).toBe('denied');
    expect(await isDisabled(page)).toBe(true);
    expect((await dataLayer(page)).at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('_ga');
    expect(cookies).toContain('unrelated=keep'); // only analytics cookies are touched
  });

  test('the notice is reachable by keyboard before the rest of the page', async ({ page }) => {
    await mockGoogle(page);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(banner(page).getByRole('link', { name: 'Privacy notice' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(banner(page).getByRole('button', { name: 'Decline' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(banner(page).getByRole('button', { name: 'Accept' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banner(page)).toBeHidden();
  });

  test('a contact-form submission is reported as generate_lead, with none of its content', async ({ page }) => {
    await mockGoogle(page);
    await mockContactBackends(page);
    await page.goto('/');
    await banner(page).getByRole('button', { name: 'Accept' }).click();
    await expect.poll(async () => (await dataLayer(page)).length).toBeGreaterThan(0);

    await scrollToForm(page);
    await fillForm(page, validMessage);
    await page.locator('.submit-btn').click();
    await expect(page.locator('#contact-toast')).toHaveClass(/success/);

    const layer = await dataLayer(page);
    expect(layer).toContainEqual(['event', 'generate_lead', { method: 'contact_form' }]);
    const serialised = JSON.stringify(layer);
    for (const secret of [validMessage.name, validMessage.email, validMessage.subject, validMessage.message]) {
      expect(serialised).not.toContain(secret);
    }
  });

  test('without consent a submission reports nothing', async ({ page }) => {
    const google = await mockGoogle(page);
    await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await page.locator('.submit-btn').click();
    await expect(page.locator('#contact-toast')).toHaveClass(/success/);

    expect(await dataLayer(page)).toEqual([]);
    expect(google).toEqual([]);
  });

  test('the privacy page describes Google Analytics and how to change the choice', async ({ page }) => {
    await page.goto('/privacy/');
    const main = page.locator('main');
    await expect(main).toContainText('Google Analytics 4');
    await expect(main).toContainText('It is opt-in.');
    await expect(main).toContainText('Privacy choices');
    await expect(main).not.toContainText('does not currently use analytics');
  });
});
