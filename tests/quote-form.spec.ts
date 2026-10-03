import { expect, test, type Page } from '@playwright/test';
import { mockContactBackends } from './helpers';

// Every test mocks Web3Forms and Turnstile: nothing here reaches a real service.

const GREETING = "Hello Shakoor, I'd like a quote for a project.";
const brief = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+971 50 000 0000',
  project: 'New business website',
  timeline: 'Within a month',
  budget: 'AED 5,000 – 15,000',
  message: 'We are a small trading company and need a fast website with a quote form.',
};
const expectedText = [
  GREETING,
  '',
  `Name: ${brief.name}`,
  `Project: ${brief.project}`,
  `Timeline: ${brief.timeline}`,
  `Budget: ${brief.budget}`,
  `Email: ${brief.email}`,
  `Phone: ${brief.phone}`,
  '',
  brief.message,
].join('\n');

const submit = (page: Page) => page.locator('#quote-form .submit-btn');
const whatsapp = (page: Page) => page.locator('[data-wa-compose]');
const visibleErrors = (page: Page) =>
  page
    .locator('#quote-form .error-message:not([hidden])')
    .evaluateAll((nodes) => nodes.map((n) => n.textContent!.trim()));

/** The text a WhatsApp link would pre-fill. */
const whatsappText = async (link: ReturnType<typeof whatsapp>) => {
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.origin + url.pathname).toBe('https://wa.me/971508066735');
  return url.searchParams.get('text');
};

async function fill(page: Page, values: Partial<typeof brief>) {
  for (const [name, value] of Object.entries(values)) {
    const field = page.locator(`#quote-form [name="${name}"]`);
    if (name === 'project' || name === 'timeline' || name === 'budget') await field.selectOption(value);
    else await field.fill(value);
  }
}

/** Focusing a field is what loads Turnstile; the (mocked) token then enables the button. */
async function ready(page: Page) {
  await page.locator('#q-name').focus();
  await expect(submit(page)).toBeEnabled();
}

test('Turnstile is not requested with the page, only once someone starts using the form', async ({ page }) => {
  const { cloudflareRequests } = await mockContactBackends(page);
  await page.goto('/quote/');
  await page.waitForLoadState('networkidle');
  expect(cloudflareRequests()).toBe(0);
  await expect(submit(page)).toBeDisabled();

  await page.locator('#q-name').focus();
  await expect.poll(cloudflareRequests).toBe(1);
  await expect(submit(page)).toBeEnabled();
});

test('before anything is typed, WhatsApp opens the right number with a greeting, and the call link is a tel: link', async ({
  page,
}) => {
  await page.goto('/quote/');
  expect(await whatsappText(whatsapp(page))).toBe(GREETING);
  await expect(whatsapp(page)).toHaveAttribute('target', '_blank');
  await expect(whatsapp(page)).toHaveAttribute('rel', /noopener/);
  await expect(page.getByRole('link', { name: /Call \+971 50 806 6735/ })).toHaveAttribute('href', 'tel:+971508066735');
});

test('an empty submit shows the required errors, sends nothing and focuses the first field', async ({ page }) => {
  const { sent } = await mockContactBackends(page);
  await page.goto('/quote/');
  await ready(page);
  await submit(page).click();

  expect(await visibleErrors(page)).toEqual([
    'Name is required',
    'Email is required',
    'Please choose a project type',
    'Please tell me about the project',
  ]);
  await expect(page.locator('#q-name')).toBeFocused();
  expect(sent).toHaveLength(0);
});

test('phone is optional but must look like a number when given', async ({ page }) => {
  await mockContactBackends(page);
  await page.goto('/quote/');
  await fill(page, { phone: 'abc' });
  expect(await visibleErrors(page)).toEqual(['Please enter a valid phone number']);
  await fill(page, { phone: '' });
  expect(await visibleErrors(page)).toEqual([]);
});

test('the WhatsApp message follows the form, and the email carries exactly the same text', async ({ page }) => {
  const { sent } = await mockContactBackends(page);
  await page.goto('/quote/');
  await fill(page, brief);
  await ready(page);

  expect(await whatsappText(whatsapp(page))).toBe(expectedText);

  await submit(page).click();
  await expect(page.locator('#quote-toast')).toHaveClass(/success/);
  expect(sent).toHaveLength(1);
  expect(sent[0].message).toBe(expectedText);
  expect(sent[0]).toMatchObject({
    name: brief.name,
    email: brief.email,
    subject: `Quote request: ${brief.project} (${brief.name})`,
    from_name: 'Portfolio Quote Request',
    botcheck: '',
  });
  expect(sent[0].access_key.length).toBeGreaterThan(10);
});

test('after sending, the same text stays one tap away on WhatsApp and the form is cleared', async ({ page }) => {
  await mockContactBackends(page);
  await page.goto('/quote/');
  await fill(page, brief);
  await ready(page);
  await submit(page).click();

  const sentPanel = page.locator('#quote-sent');
  await expect(sentPanel).toBeVisible();
  expect(await whatsappText(sentPanel.locator('a[data-wa-sent]'))).toBe(expectedText);

  await expect(page.locator('#q-name')).toHaveValue('');
  await expect(page.locator('#q-project')).toHaveValue('');
  expect(await whatsappText(whatsapp(page))).toBe(GREETING);
  await expect(submit(page)).toBeDisabled(); // needs a fresh token
});

test('a server error keeps what was typed and the WhatsApp text', async ({ page }) => {
  await mockContactBackends(page, { status: 429, body: { message: 'Rate limited by server' } });
  await page.goto('/quote/');
  await fill(page, brief);
  await ready(page);
  await submit(page).click();

  await expect(page.locator('#quote-toast')).toHaveClass(/error/);
  await expect(page.locator('#quote-toast .toast-text')).toHaveText('Rate limited by server');
  await expect(page.locator('#q-name')).toHaveValue(brief.name);
  expect(await whatsappText(whatsapp(page))).toBe(expectedText);
  await expect(page.locator('#quote-sent')).toBeHidden();
});

test('a filled honeypot is refused without sending anything', async ({ page }) => {
  const { sent } = await mockContactBackends(page);
  await page.goto('/quote/');
  await fill(page, brief);
  await ready(page);
  await page.locator('#quote-form [name="botcheck"]').evaluate((el: HTMLInputElement) => (el.value = 'spam'));
  await submit(page).click();
  await expect(page.locator('#quote-toast .toast-text')).toHaveText('Invalid submission.');
  expect(sent).toHaveLength(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the WhatsApp and call links still work', async ({ page }) => {
    await page.goto('/quote/');
    expect(await whatsappText(whatsapp(page))).toBe(GREETING);
    await expect(page.getByRole('link', { name: /Call \+971 50 806 6735/ })).toHaveAttribute(
      'href',
      'tel:+971508066735',
    );
  });
});
