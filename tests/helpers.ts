import { expect, type Page } from '@playwright/test';

/** Every indexable page on the site (kept in sync with the sitemap by seo.spec.ts). */
export const pages = [
  '/',
  '/services/',
  '/services/website-design-development/',
  '/services/web-application-development/',
  '/services/seo-performance/',
  '/services/identity-sso-oauth/',
  '/services/api-integration-microservices/',
  '/services/architecture-technical-leadership/',
  '/services/devops-ci-cd/',
  '/services/ai-tooling-mcp/',
  '/work/',
  '/work/earth-cone/',
  '/work/lail-o-nahar/',
  '/work/uae-information-chatbot/',
  '/quote/',
  '/projects/',
  '/privacy/',
  '/projects/oneportal-iam/',
  '/projects/oneportal-digital-workplace/',
  '/projects/ai-tooling-suite/',
];

/** Turn off animations/transitions so geometry and text are deterministic. */
export async function freezeMotion(page: Page) {
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
}

/** Jump straight to an element (overrides the site's smooth scrolling). */
export async function jumpTo(page: Page, selector: string, block: ScrollLogicalPosition = 'start') {
  await page
    .locator(selector)
    .first()
    .evaluate((el, b) => el.scrollIntoView({ behavior: 'instant', block: b }), block);
}

/**
 * Replace the network-facing pieces of the contact form with mocks so a test never sends a real
 * message, loads Cloudflare, or touches the clipboard. Returns what the page tried to send.
 */
export async function mockContactBackends(
  page: Page,
  opts: { status?: number; body?: object; offline?: boolean } = {},
) {
  const sent: Record<string, string>[] = [];
  const { status = 200, body = { success: true, message: 'Sent!' }, offline = false } = opts;

  await page.route('https://api.web3forms.com/submit', async (route) => {
    sent.push(route.request().postDataJSON());
    if (offline) return route.abort('failed');
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });

  // Stand-in for Cloudflare's script: renders "instantly" and hands back a token.
  let scriptRequests = 0;
  await page.route('https://challenges.cloudflare.com/**', async (route) => {
    scriptRequests++;
    await route.fulfill({
      contentType: 'text/javascript',
      body: `window.__tsResets = 0;
             window.turnstile = {
               render: (el, options) => { window.__tsOptions = options; setTimeout(() => options.callback('test-token'), 20); return 'widget'; },
               reset: () => { window.__tsResets++; },
             };`,
    });
  });

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => ((window as unknown as { __copied: string }).__copied = text) },
      configurable: true,
    });
  });

  return { sent, cloudflareRequests: () => scriptRequests };
}

export async function scrollToForm(page: Page) {
  await jumpTo(page, '#contact-form', 'center');
  await expect(page.locator('.submit-btn')).toBeEnabled(); // enabled once the (mocked) token arrives
}

export async function fillForm(page: Page, values: Partial<Record<'name' | 'email' | 'subject' | 'message', string>>) {
  for (const [name, value] of Object.entries(values)) {
    await page.locator(`#contact-form [name="${name}"]`).fill(value);
  }
}

export const validMessage = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'Hello there',
  message: 'This is a valid message that is long enough.',
};
