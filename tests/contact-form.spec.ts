import { expect, test, type Page } from '@playwright/test';
import { fillForm, jumpTo, mockContactBackends, scrollToForm, validMessage } from './helpers';

// Every test mocks Web3Forms, Turnstile and the clipboard: nothing here reaches a real service.

const toast = (page: Page) => page.locator('#contact-toast');
const visibleErrors = (page: Page) =>
  page
    .locator('#contact-form .error-message:not([hidden])')
    .evaluateAll((nodes) => nodes.map((n) => n.textContent!.trim()));
const submit = (page: Page) => page.locator('.submit-btn').click();
const newToken = (page: Page, token = 'next-token') =>
  page.evaluate(
    (t) => (window as unknown as { __tsOptions: { callback: (v: string) => void } }).__tsOptions.callback(t),
    token,
  );

test.describe('Turnstile loads lazily', () => {
  test('not on page load; when the form scrolls near', async ({ page }) => {
    const { cloudflareRequests } = await mockContactBackends(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(cloudflareRequests()).toBe(0);
    await expect(page.locator('.submit-btn')).toBeDisabled(); // no token yet

    await jumpTo(page, '#contact-form', 'center');
    await expect.poll(cloudflareRequests).toBe(1);
    await expect(page.locator('.submit-btn')).toBeEnabled();
    await expect(page.locator('.turnstile-hint')).toBeHidden();
  });

  test('not while the form is still far below the viewport', async ({ page }) => {
    const { cloudflareRequests } = await mockContactBackends(page);
    await page.goto('/');
    const formTop = await page.locator('#contact-form').evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y - 800 - 1200, behavior: 'instant' }), formTop);
    await page.waitForTimeout(800);
    expect(cloudflareRequests()).toBe(0);
  });

  test('when a field takes focus, even without scrolling', async ({ page }) => {
    const { cloudflareRequests } = await mockContactBackends(page);
    await page.goto('/');
    await page.locator('#contact-form [name="name"]').evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
    await expect.poll(cloudflareRequests).toBe(1);
  });
});

test.describe('validation', () => {
  test('an empty submit shows every required error, sends nothing and focuses the first field', async ({ page }) => {
    const { sent } = await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await submit(page);

    expect(await visibleErrors(page)).toHaveLength(4);
    await expect(page.locator('#contact-form [name="name"]')).toBeFocused();
    expect(sent).toHaveLength(0);
  });

  test('short or invalid values get specific messages and aria-invalid', async ({ page }) => {
    await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, { name: 'a', email: 'abc', subject: 'hey', message: 'too short' });

    expect(await visibleErrors(page)).toEqual([
      'Name must be at least 2 characters',
      'Please enter a valid email',
      'Subject must be at least 4 characters',
      'Message must be at least 20 characters',
    ]);
    await expect(page.locator('#contact-form [aria-invalid="true"]')).toHaveCount(4);
  });

  test('the character counter updates and warns past 400', async ({ page }) => {
    await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, { message: 'x'.repeat(450) });
    await expect(page.locator('#char-count')).toHaveText('450/500 characters');
    await expect(page.locator('#char-count')).toHaveClass(/warning/);
  });
});

test.describe('submission', () => {
  test('sends the expected payload once, confirms, resets the form and the widget', async ({ page }) => {
    const { sent } = await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await submit(page);

    await expect(toast(page)).toHaveClass(/success/);
    await expect(page.locator('#contact-toast .toast-text')).toHaveText('Sent!');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ ...validMessage, botcheck: '' });
    expect(sent[0].access_key.length).toBeGreaterThan(10);
    expect(sent[0].from_name).toBeTruthy();

    await expect(page.locator('#contact-form [name="name"]')).toHaveValue('');
    await expect(page.locator('.submit-btn')).toBeDisabled(); // needs a fresh token
    expect(await page.evaluate(() => (window as unknown as { __tsResets: number }).__tsResets)).toBeGreaterThanOrEqual(
      1,
    );
  });

  test('blocks a second submission within a minute (client-side)', async ({ page }) => {
    const { sent } = await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await submit(page);
    await expect(toast(page)).toHaveClass(/success/);

    await newToken(page);
    await fillForm(page, validMessage);
    await submit(page);
    await expect(page.locator('#contact-toast .toast-text')).toContainText(/Please wait \d+s/);
    expect(sent).toHaveLength(1);
  });

  test('a server error shows its message, keeps the input and asks for a fresh token', async ({ page }) => {
    await mockContactBackends(page, { status: 429, body: { message: 'Rate limited by server' } });
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await submit(page);

    await expect(toast(page)).toHaveClass(/error/);
    await expect(page.locator('#contact-toast .toast-text')).toHaveText('Rate limited by server');
    await expect(page.locator('#contact-form [name="name"]')).toHaveValue(validMessage.name);
    await expect(page.locator('.submit-btn')).toBeDisabled();
  });

  test('a network failure shows a network error', async ({ page }) => {
    await mockContactBackends(page, { offline: true });
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await submit(page);
    await expect(page.locator('#contact-toast .toast-text')).toContainText('Network error');
  });

  test('a filled honeypot is refused without sending anything', async ({ page }) => {
    const { sent } = await mockContactBackends(page);
    await page.goto('/');
    await scrollToForm(page);
    await fillForm(page, validMessage);
    await page.locator('#contact-form [name="botcheck"]').evaluate((el: HTMLInputElement) => (el.value = 'spam'));
    await submit(page);
    await expect(page.locator('#contact-toast .toast-text')).toHaveText('Invalid submission.');
    expect(sent).toHaveLength(0);
  });
});

test('Reset Form clears the fields and hides every error', async ({ page }) => {
  await mockContactBackends(page);
  await page.goto('/');
  await scrollToForm(page);
  await fillForm(page, { name: 'a', email: 'abc' });
  await page.getByRole('button', { name: 'Reset Form' }).click();
  await expect(page.locator('#contact-form [name="name"]')).toHaveValue('');
  expect(await visibleErrors(page)).toEqual([]);
});

test('the copy button copies the email and confirms; the toast can be dismissed', async ({ page }) => {
  await mockContactBackends(page);
  await page.goto('/');
  await jumpTo(page, '[data-copy]', 'center');
  await page.locator('[data-copy]').first().click();
  await expect(page.locator('#contact-toast .toast-text')).toHaveText('Email copied to clipboard!');
  expect(await page.evaluate(() => (window as unknown as { __copied: string }).__copied)).toBe('binmushtaq@gmail.com');

  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(toast(page)).not.toHaveClass(/show/);
});
