import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { aiState, installChromeAi, queueResponses, statusLog, watchStatus, type MockOptions } from './ai-mock';
import { mockContactBackends } from './helpers';
import { chatExamples } from '../src/data/aiChat';

// On-device AI (Chrome's Prompt and Summarizer APIs). The browser's AI is always replaced by the mock in ai-mock.ts:
// no test needs a real model, a download, or a network call.

interface Chunk {
  id: string;
  kind: string;
  title: string;
  text: string;
  href: string;
}
const knowledge = async (request: APIRequestContext) =>
  ((await (await request.get('/ai/knowledge.json')).json()) as { chunks: Chunk[] }).chunks;
const idOf = (chunks: Chunk[], kind: string, titleStart: string) => {
  const found = chunks.find((c) => c.kind === kind && c.title.startsWith(titleStart));
  if (!found) throw new Error(`no ${kind} chunk starting with "${titleStart}"`);
  return found.id;
};

const launcher = (page: Page) => page.getByRole('button', { name: 'Ask AI' });
const panel = (page: Page, id: string) => page.locator(`#${id}`);
const status = (page: Page, id: string) => panel(page, id).locator('[data-ai-status]');
const enterJobDescription =
  'We are hiring a senior backend engineer. You will design OAuth 2.0 and OIDC single sign-on for several tenants, ' +
  'run Kubernetes clusters in production, and mentor a team of engineers on cloud platforms.';

async function open(page: Page, path: string, options: MockOptions = {}) {
  await installChromeAi(page, options);
  await page.goto(path);
}

// ------------------------------------------------------------------------------------------------ the site data
test('the knowledge file holds the site content, without contact details, and crawlers are told to skip it', async ({
  request,
}) => {
  const chunks = await knowledge(request);
  expect(chunks.length).toBeGreaterThan(50);
  expect(new Set(chunks.map((c) => c.id)).size, 'ids are unique').toBe(chunks.length);
  for (const chunk of chunks) {
    expect(chunk.text.length, chunk.id).toBeGreaterThan(20);
    expect(chunk.href, chunk.id).toMatch(/^(\/|https:\/\/)/);
  }
  const everything = JSON.stringify(chunks);
  for (const secret of ['binmushtaq', 'outlook.com', '+971', '971508', 'shakoorattari@']) {
    expect(everything, `must not contain ${secret}`).not.toContain(secret);
  }
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /ai/');
});

// ------------------------------------------------------------------------------------------------ unsupported browsers
const UA = {
  safari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  oldChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};
const aiPages: { path: string; id: string; api: 'prompt' | 'summarizer' }[] = [
  { path: '/', id: 'ask', api: 'prompt' },
  { path: '/services/', id: 'ai-fit', api: 'prompt' },
  { path: '/quote/', id: 'ai-quote', api: 'prompt' },
  { path: '/projects/oneportal-iam/', id: 'ai-summary', api: 'summarizer' },
];

const notices: [string, string, RegExp, (api: 'prompt' | 'summarizer') => RegExp][] = [
  ['Safari', UA.safari, /Open this page in Chrome/, () => /open it in Chrome/],
  [
    'an old Chrome',
    UA.oldChrome,
    /Update Chrome to use this/,
    (api) => (api === 'prompt' ? /Chrome 148/ : /Chrome 138/),
  ],
  ['a phone', UA.iphone, /Open this on a desktop or laptop/, () => /phones or tablets/],
  ['a current Chrome with the API off', UA.chrome, /switched off here/, () => /turned off by your organisation/],
];
for (const [name, userAgent, title, body] of notices) {
  test.describe(`in ${name}`, () => {
    test.use({ userAgent });

    for (const { path, id, api } of aiPages) {
      test(`${path} explains what is needed instead of offering a broken button`, async ({ page }) => {
        await open(page, path, { apis: 'none' });
        const box = panel(page, id);
        await expect(box.locator('[data-ai-notice]')).toBeVisible();
        await expect(box.locator('[data-ai-notice-title]')).toHaveText(title);
        await expect(box.locator('[data-ai-notice-body]')).toHaveText(body(api));
        await expect(box.locator('[data-ai-body]')).toBeHidden();
        await expect(box.getByRole('heading')).toBeVisible(); // the feature is still described
      });
    }
  });
}

test('"Copy page link" in the notice copies this page', async ({ page }) => {
  await open(page, '/quote/', { apis: 'none' });
  await panel(page, 'ai-quote').getByRole('button', { name: 'Copy page link' }).click();
  await expect(panel(page, 'ai-quote').getByRole('button', { name: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __copied: string }).__copied)).toBe(page.url());
});

// ------------------------------------------------------------------------------------------------ nothing runs on load
for (const { path, id } of aiPages) {
  test(`${path} offers the panel but runs nothing until a button is pressed`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await open(page, path);
    await page.waitForLoadState('networkidle');

    await expect(panel(page, id).locator('[data-ai-body]')).toBeVisible();
    await expect(panel(page, id).locator('[data-ai-notice]')).toBeHidden();
    const calls = await aiState(page);
    // The "Ask AI" button reads availability() once, to hide itself where the model cannot run. That starts nothing.
    expect(calls.availabilityCalls).toBeLessThanOrEqual(1);
    expect(calls.created, 'no model was started').toBe(0);
    expect(calls.prompts).toEqual([]);
    expect(requests.filter((url) => url.includes('/ai/knowledge.json'))).toEqual([]);
  });
}

// ------------------------------------------------------------------------------------------------ the download question
test.describe('first use, when Chrome must download its model', () => {
  const summarise = (page: Page) => panel(page, 'ai-summary').getByRole('button', { name: 'Summarise this page' });

  test('asks first, downloads only on "Download and continue", then works', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/', { availability: 'downloadable' });
    await summarise(page).click();

    const question = panel(page, 'ai-summary').locator('[data-ai-confirm]');
    await expect(question).toBeVisible();
    await expect(question).toContainText('large, one-time download');
    expect((await aiState(page)).created, 'nothing downloaded yet').toBe(0);

    // The question has its own "Not now"; a Stop button that could not dismiss it would be a dead control.
    await expect(panel(page, 'ai-summary').getByRole('button', { name: 'Stop' })).toBeHidden();

    await question.getByRole('button', { name: 'Download and continue' }).click();
    await expect(panel(page, 'ai-summary').locator('[data-ai-list] li')).toHaveCount(3);
    expect((await aiState(page)).created).toBe(1);
    await expect(question).toBeHidden();
  });

  test('"Not now" downloads nothing and says so', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/', { availability: 'downloadable' });
    await summarise(page).click();
    await panel(page, 'ai-summary').getByRole('button', { name: 'Not now' }).click();

    await expect(status(page, 'ai-summary')).toHaveText('Cancelled. Nothing was downloaded.');
    expect((await aiState(page)).created).toBe(0);
    await expect(summarise(page)).toBeFocused(); // focus goes back to where the visitor was
  });

  test('a computer that cannot run the model is told why, plainly', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/', { availability: 'unavailable' });
    await summarise(page).click();
    await expect(status(page, 'ai-summary')).toContainText('22 GB of free disk space');
    expect((await aiState(page)).created).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ loading the model
// Chrome always reports download progress (0, then 1), even for a model that is already on the computer, and "1" only
// means downloaded: the session is ready when create() resolves. Both were wrong once: every question said
// "Downloading… 100%" and then sat there, because the page also made Chrome reload the model for each question.
test.describe('loading the model', () => {
  const identity = 'What identity and SSO work has he done?';
  const ask = async (page: Page, text: string) => {
    await page.locator('#ask-input').fill(text);
    await page.locator('#ask-input').press('Enter');
  };

  test('never says "Downloading" for a model that is already on the computer', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await watchStatus(page, 'ask');
    await queueResponses(page, {
      answerable: true,
      answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.',
      sources: [study],
    });
    await ask(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);

    const log = await statusLog(page);
    expect(log.texts.join(' | ')).toContain('Starting the on-device model');
    expect(
      log.texts.filter((text) => /Download/i.test(text)),
      'nothing was downloaded',
    ).toEqual([]);
    expect(log.barShown, 'no progress bar either').toBe(false);
  });

  test('a real download shows its percentage, then "Preparing" instead of a full bar that looks stuck', async ({
    page,
  }) => {
    await open(page, '/', { availability: 'downloadable' });
    await ask(page, identity);
    await watchStatus(page, 'ask');
    await panel(page, 'ask').getByRole('button', { name: 'Download and continue' }).click();
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);

    const log = await statusLog(page);
    expect(log.texts.some((text) => /Downloading.*60%/.test(text))).toBe(true);
    expect(log.texts, '100% is "downloaded", not "ready"').toContain('Preparing Chrome’s on-device model…');
    expect(log.texts.filter((text) => /100%/.test(text))).toEqual([]);
    expect(log.barIndeterminate, 'the bar becomes indeterminate while the model loads').toBe(true);
    await expect(panel(page, 'ask').locator('[data-ai-progress]')).toBeHidden();
  });

  test('loads the model once for a whole conversation, then reuses it', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    const reply = { answerable: true, answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.', sources: [study] };
    await queueResponses(page, reply, reply, reply);
    for (const [i] of [1, 2, 3].entries()) {
      await ask(page, identity);
      await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(i + 1);
    }
    const calls = await aiState(page);
    expect(calls.created, 'the model was loaded once').toBe(1);
    expect(calls.clones, 'each question used a clone of it').toBe(3);
    expect(calls.destroyed, 'only the clones were released').toBe(3);
  });

  test('the same session serves the home chat and the chat window', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    const reply = { answerable: true, answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.', sources: [study] };
    await queueResponses(page, reply, reply);
    await ask(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);
    await launcher(page).click();
    await page.locator('#ai-chat-input').fill(identity);
    await page.locator('#ai-chat-input').press('Enter');
    await expect(panel(page, 'ai-chat').locator('.ai-turn-a')).toHaveCount(1);
    expect((await aiState(page)).created).toBe(1);
  });

  test('pressing Stop mid-answer on the very first question leaves the kept session for the next one', async ({
    page,
    request,
  }) => {
    // Chrome destroys a session when the signal passed to create() is aborted, even later. The shared base session must
    // therefore never be created with a request's signal, or a Stop would silently throw the loaded model away.
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/', { delay: 5000 });
    await ask(page, identity);
    await expect.poll(async () => (await aiState(page)).clones, 'the model is loaded and answering').toBe(1);
    await panel(page, 'ask').getByRole('button', { name: 'Stop' }).click();
    await expect(status(page, 'ask')).toHaveText('Stopped.');

    await page.evaluate(() => ((window as unknown as { __ai: { delay: number } }).__ai.delay = 10));
    await queueResponses(page, {
      answerable: true,
      answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.',
      sources: [study],
    });
    await ask(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);
    expect((await aiState(page)).created, 'the model was not loaded a second time').toBe(1);
  });

  test('lets the model go after five idle minutes, and loads it again when asked', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await page.clock.install();
    await open(page, '/');
    const reply = { answerable: true, answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.', sources: [study] };
    await queueResponses(page, reply, reply);
    await ask(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);
    expect((await aiState(page)).destroyed, 'the clone only').toBe(1);

    await page.clock.fastForward('04:00');
    expect((await aiState(page)).destroyed, 'still kept after four minutes').toBe(1);
    await page.clock.fastForward('02:00');
    expect((await aiState(page)).destroyed, 'the base session was released').toBe(2);

    await ask(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(2);
    expect((await aiState(page)).created, 'loaded again').toBe(2);
  });

  test('key points reuse one summarizer', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/');
    await page.evaluate(() => {
      (window as unknown as { __ai: { summaries: string[] } }).__ai.summaries = ['- One\n- Two', '- Three\n- Four'];
    });
    const button = panel(page, 'ai-summary').getByRole('button', { name: 'Summarise this page' });
    await button.click();
    await expect(panel(page, 'ai-summary').locator('[data-ai-list] li').first()).toHaveText('One');
    await button.click();
    await expect(panel(page, 'ai-summary').locator('[data-ai-list] li').first()).toHaveText('Three');
    const calls = await aiState(page);
    expect(calls.created).toBe(1);
    expect(calls.destroyed, 'a shared summarizer is not destroyed after each use').toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ key points
test.describe('key points', () => {
  test('summarises the page body only, shows plain-text bullets and moves focus to them', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/');
    await page.evaluate(() => {
      (window as unknown as { __ai: { summaries: string[] } }).__ai.summaries = [
        '* **Multi-tenant** OAuth 2.0 / OIDC authority\n* <img src=x onerror=alert(1)> federation to UAE PASS',
      ];
    });
    await panel(page, 'ai-summary').getByRole('button', { name: 'Summarise this page' }).click();

    const items = panel(page, 'ai-summary').locator('[data-ai-list] li');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toHaveText('Multi-tenant OAuth 2.0 / OIDC authority');
    await expect(items.nth(1)).toContainText('<img src=x onerror=alert(1)>'); // shown as text, never as markup
    await expect(panel(page, 'ai-summary').locator('[data-ai-output] img')).toHaveCount(0);
    await expect(panel(page, 'ai-summary').locator('[data-ai-output]')).toBeFocused();

    const [text] = (await aiState(page)).summarized;
    expect(text).toContain('The challenge');
    expect(text).toContain('Technologies');
    expect(text, 'the panel itself is not part of what it summarises').not.toContain('Short on time');
  });

  test('Stop cancels a run in progress', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/', { delay: 5000 });
    await panel(page, 'ai-summary').getByRole('button', { name: 'Summarise this page' }).click();
    await panel(page, 'ai-summary').getByRole('button', { name: 'Stop' }).click();
    await expect(status(page, 'ai-summary')).toHaveText('Stopped.');
    await expect(panel(page, 'ai-summary').locator('[data-ai-output]')).toBeHidden();
    await expect(panel(page, 'ai-summary').getByRole('button', { name: 'Stop' })).toBeHidden();
  });
});

// ------------------------------------------------------------------------------------------------ quote brief helper
test.describe('quote brief helper', () => {
  const brief = 'We run a small trading company in Sharjah and need a fast website with a quote form by next month.';
  const suggest = (page: Page) => page.getByRole('button', { name: 'Suggest fields and missing details' });

  test('suggests only real options, changes nothing until "Use this", and feeds the form and WhatsApp text', async ({
    page,
  }) => {
    const { sent } = await mockContactBackends(page);
    await open(page, '/quote/');
    await page.locator('#q-message').fill(brief);
    await queueResponses(page, {
      projectType: 'New business website',
      timeline: 'Within a month',
      budget: 'unspecified',
      missing: ['What is your current website address?', 'Which pages do you need?'],
    });
    await suggest(page).click();

    const rows = panel(page, 'ai-quote').locator('[data-ai-suggestions] li');
    await expect(rows).toHaveCount(2); // budget was "unspecified": not suggested
    await expect(rows.nth(0)).toContainText('Project type');
    await expect(rows.nth(0)).toContainText('New business website');
    await expect(page.locator('#q-project')).toHaveValue('');
    await expect(panel(page, 'ai-quote').locator('[data-ai-missing] li')).toHaveText([
      'What is your current website address?',
      'Which pages do you need?',
    ]);

    await rows.nth(0).getByRole('button', { name: 'Use this project type: New business website' }).click();
    await expect(page.locator('#q-project')).toHaveValue('New business website');
    await expect(page.locator('#q-timeline')).toHaveValue(''); // the other suggestion is still only a suggestion
    await expect(rows.nth(0).getByRole('button')).toHaveText('Applied');

    // The form's own listeners saw the change: the WhatsApp message carries it.
    const href = (await page.locator('[data-wa-compose]').getAttribute('href'))!;
    expect(new URL(href).searchParams.get('text')).toContain('Project: New business website');
    expect(sent, 'suggesting never submits anything').toEqual([]);
  });

  test("the model is held to the form's own lists, and anything else it says is ignored", async ({ page }) => {
    await open(page, '/quote/');
    await page.locator('#q-message').fill(brief);
    await queueResponses(page, {
      projectType: 'Enterprise portal', // not an option on the form
      timeline: 'Yesterday',
      budget: 'AED 1',
      missing: [],
    });
    await suggest(page).click();
    await expect(status(page, 'ai-quote')).toContainText('No suggestions this time');
    await expect(panel(page, 'ai-quote').locator('[data-ai-suggestions] li')).toHaveCount(0);

    const { prompts } = await aiState(page);
    const optionsOf = (id: string) =>
      page
        .locator(`${id} option`)
        .evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value).filter(Boolean));
    const constraint = prompts[0].constraint as { properties: Record<string, { enum: string[] }> };
    expect(constraint.properties.projectType.enum).toEqual(await optionsOf('#q-project'));
    expect(constraint.properties.timeline.enum).toEqual([...(await optionsOf('#q-timeline')), 'unspecified']);
    expect(constraint.properties.budget.enum).toEqual([...(await optionsOf('#q-budget')), 'unspecified']);
  });

  test('asks for a description first, and says English only for Arabic, without calling the model', async ({
    page,
  }) => {
    await open(page, '/quote/');
    await suggest(page).click();
    await expect(status(page, 'ai-quote')).toContainText('Write a few lines about the project');
    await page
      .locator('#q-message')
      .fill('نحتاج إلى موقع إلكتروني سريع لشركتنا التجارية في الشارقة مع نموذج لطلب عرض سعر');
    await suggest(page).click();
    await expect(status(page, 'ai-quote')).toContainText('English only');
    const calls = await aiState(page);
    expect(calls.prompts).toEqual([]);
    expect(calls.created).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ job fit
test.describe('job-fit check', () => {
  const check = (page: Page) => page.getByRole('button', { name: 'Check the fit' });

  test("shows the site's own evidence, and drops claims the site cannot back", async ({ page, request }) => {
    const chunks = await knowledge(request);
    const iam = idOf(chunks, 'skill', 'Identity, Security & IAM');
    const devops = idOf(chunks, 'skill', 'DevOps & CI/CD');
    await open(page, '/services/');
    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(page, {
      requirements: [
        { requirement: 'OAuth 2.0 and OIDC single sign-on', match: 'strong', evidence: [iam] },
        { requirement: 'Kubernetes in production', match: 'strong', evidence: ['zz99'] }, // an id that does not exist
        { requirement: 'Cloud platform experience', match: 'partial', evidence: [devops] },
        { requirement: 'Terraform modules', match: 'strong', evidence: [] }, // a claim with nothing behind it
        { requirement: '<img src=x onerror=alert(1)>', match: 'none', evidence: [] },
      ],
    });
    await check(page).click();

    const output = panel(page, 'ai-fit').locator('[data-ai-output]');
    await expect(output).toBeVisible();
    await expect(output.locator('[data-ai-summary]')).toHaveText(
      '1 of 5 requirements have strong evidence on this site, 1 partial, 3 not found.',
    );
    const rows = output.locator('.ai-row');
    await expect(rows.nth(0).locator('.ai-chip')).toHaveText('Strong evidence');
    await expect(rows.nth(0).getByRole('link', { name: 'Identity, Security & IAM' })).toHaveAttribute(
      'href',
      '/#skills',
    );
    await expect(rows.nth(1).locator('.ai-chip')).toHaveText('Not found on this site');
    await expect(rows.nth(1).locator('.ai-evidence')).toHaveCount(0);
    await expect(rows.nth(2).locator('.ai-chip')).toHaveText('Partial evidence');
    await expect(rows.nth(3).locator('.ai-chip')).toHaveText('Not found on this site');
    await expect(output.locator('img')).toHaveCount(0);
    await expect(rows.nth(4)).toContainText('<img src=x');

    // Evidence snippets are cut at a word or skill boundary, never in the middle of one.
    const shown = (await rows.nth(0).locator('.ai-evidence li span').innerText()).trim();
    const original = chunks.find((c) => c.id === iam)!.text;
    expect(shown.endsWith('…'), 'a long skill list is shortened').toBe(true);
    const kept = shown.slice(0, -1);
    expect(original.startsWith(kept)).toBe(true);
    expect(original[kept.length], 'cut at a boundary').toMatch(/[ ;]/);

    const [call] = (await aiState(page)).prompts;
    expect(call.input).toContain(enterJobDescription);
    expect(call.input).toContain(`[${iam}] Identity, Security & IAM`);
    const allowed = (
      call.constraint as {
        properties: { requirements: { items: { properties: { evidence: { items: { enum: string[] } } } } } };
      }
    ).properties.requirements.items.properties.evidence.items.enum;
    expect(allowed).toContain(iam);
    expect(allowed, 'only catalog ids can be cited').not.toContain('zz99');
  });

  test('too little text, Arabic text and unreadable replies never produce a result', async ({ page }) => {
    await open(page, '/services/');
    await check(page).click();
    await expect(status(page, 'ai-fit')).toContainText('Paste the job description first');

    await page
      .locator('#ai-fit-input')
      .fill('نحن نبحث عن مهندس برمجيات خبير في تطوير الأنظمة والتطبيقات المؤسسية والخدمات السحابية في الإمارات');
    await check(page).click();
    await expect(status(page, 'ai-fit')).toContainText('English only');
    expect((await aiState(page)).prompts).toEqual([]);

    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(page, 'this is not json');
    await check(page).click();
    await expect(status(page, 'ai-fit')).toContainText('could not be read');
    await expect(panel(page, 'ai-fit').locator('[data-ai-output]')).toBeHidden();
  });

  test('replaces a citation the site does not support with the evidence it does have', async ({ page, request }) => {
    // Seen on a real model: "Solution architecture" cited "Methodology & Tooling", which says nothing about it.
    const chunks = await knowledge(request);
    const methodology = idOf(chunks, 'skill', 'Methodology & Tooling');
    await open(page, '/services/');
    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(page, {
      requirements: [
        {
          requirement: 'Solution architecture for digital transformation projects',
          match: 'strong',
          evidence: [methodology],
        },
      ],
    });
    await check(page).click();

    const row = panel(page, 'ai-fit').locator('.ai-row').first();
    await expect(row.locator('.ai-chip')).toHaveText('Strong evidence');
    await expect(row.getByRole('link', { name: 'Leadership & Architecture' })).toBeVisible();
    await expect(row.getByRole('link', { name: 'Methodology & Tooling' })).toHaveCount(0);
  });

  test('"strong" needs the site to use the requirement\'s own words; a looser link is only partial', async ({
    page,
    request,
  }) => {
    const chunks = await knowledge(request);
    const iam = idOf(chunks, 'skill', 'Identity, Security & IAM');
    const frontend = idOf(chunks, 'skill', 'Frontend');
    await open(page, '/services/');
    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(page, {
      requirements: [
        { requirement: 'Login flows', match: 'strong', evidence: [iam] }, // related by alias only (login -> OAuth)
        { requirement: 'Terraform modules', match: 'strong', evidence: [frontend] }, // one shared word out of two
        { requirement: 'Mentoring a team', match: 'strong', evidence: [] }, // found in the site's own text instead
      ],
    });
    await check(page).click();

    const chips = panel(page, 'ai-fit').locator('.ai-row .ai-chip');
    await expect(chips).toHaveText(['Partial evidence', 'Not found on this site', 'Strong evidence']);
    await expect(
      panel(page, 'ai-fit').locator('.ai-row').nth(2).getByRole('link', { name: 'Leadership & Architecture' }),
    ).toBeVisible();
  });

  test('a model that runs out of room gets a friendly message, and the session is cleaned up', async ({ page }) => {
    await open(page, '/services/');
    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(page, { __throw: 'QuotaExceededError' });
    await check(page).click();
    await expect(status(page, 'ai-fit')).toContainText('too long for the on-device model');
    expect((await aiState(page)).destroyed).toBe(1);
  });
});

// ------------------------------------------------------------------------------------------------ chat
test.describe('chat', () => {
  const question = 'What identity and SSO work has he done?';
  const answerText =
    'Shakoor designs and delivers OAuth 2.0 / OIDC single sign-on, including UAE PASS and Azure Entra ID.';
  const turns = (page: Page, id = 'ask') => panel(page, id).locator('.ai-turn-a');
  const ask = async (page: Page, text: string, id = 'ask') => {
    await page.locator(`#${id}-input`).fill(text);
    await page.locator(`#${id}-input`).press('Enter');
  };
  const grounded = (sources: string[], answer = answerText) => ({ answerable: true, answer, sources });

  test('every example question finds something on the site to answer from', async ({ page }) => {
    await open(page, '/');
    for (const [i, example] of chatExamples.entries()) {
      await page.locator('#ask').getByRole('button', { name: example, exact: true }).click();
      await expect(turns(page)).toHaveCount(i + 1); // answered or not, it got as far as the model
      expect((await aiState(page)).prompts.length, `"${example}" matched nothing`).toBe(i + 1);
    }
  });

  test('answers with its sources as links, and the examples make way for the conversation', async ({
    page,
    request,
  }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await queueResponses(page, grounded([study]));
    await page.locator('#ask').getByRole('button', { name: question, exact: true }).click();

    await expect(panel(page, 'ask').locator('.ai-turn-q')).toContainText(question);
    await expect(turns(page)).toHaveCount(1);
    await expect(turns(page).locator('.ai-a-text')).toHaveText(answerText);
    await expect(turns(page).locator('.ai-a-label')).toHaveText('On-device AI');
    await expect(turns(page).getByRole('link', { name: 'Identity, SSO & OAuth 2.0 / OIDC' })).toHaveAttribute(
      'href',
      '/services/identity-sso-oauth/',
    );
    await expect(panel(page, 'ask').locator('[data-ai-examples]')).toBeHidden();
    await expect(panel(page, 'ask').getByRole('button', { name: 'Clear conversation' })).toBeVisible();
    await expect(page.locator('#ask-input')).toBeFocused(); // ready for the next question
    await expect(page.locator('#ask-input')).toHaveValue('');

    const [call] = (await aiState(page)).prompts;
    expect(call.input).toContain(`Question: ${question}`);
    const given = (call.constraint as { properties: { sources: { items: { enum: string[] } } } }).properties.sources
      .items.enum;
    expect(given, 'the model could only cite notes it was shown').toContain(study);
    expect(given.length).toBeLessThanOrEqual(5);
  });

  test('remembers the conversation: "tell me more about that" is understood from the last answer', async ({
    page,
    request,
  }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await queueResponses(
      page,
      grounded([study]),
      grounded([study], 'Shakoor delivers it as a service, including OAuth 2.0 and OIDC design.'),
    );
    await ask(page, question);
    await expect(turns(page)).toHaveCount(1);
    await ask(page, 'Tell me more about that');
    await expect(turns(page)).toHaveCount(2);

    const [, second] = (await aiState(page)).prompts;
    expect(second.input, 'the last exchange is passed along as context').toContain(`Q: ${question}`);
    expect(second.input).toContain(`A: ${answerText}`);
    expect(second.input, "and the question is looked up with the last answer's topic").toContain(`[${study}]`);
    await expect(panel(page, 'ask').locator('.ai-turn-q')).toHaveCount(2);
  });

  test('"Clear conversation" empties it and brings the examples back', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await queueResponses(page, grounded([study]));
    await ask(page, question);
    await expect(turns(page)).toHaveCount(1);

    await panel(page, 'ask').getByRole('button', { name: 'Clear conversation' }).click();
    await expect(panel(page, 'ask').locator('.ai-turn-q, .ai-turn-a')).toHaveCount(0);
    await expect(panel(page, 'ask').locator('[data-ai-examples]')).toBeVisible();
    await expect(panel(page, 'ask').getByRole('button', { name: 'Clear conversation' })).toBeHidden();
    await expect(page.locator('#ask-input')).toBeFocused();
  });

  test('a new question is not bent towards the previous topic', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await queueResponses(page, grounded([study]));
    await ask(page, question);
    await expect(turns(page)).toHaveCount(1);

    // Short, with words of its own and nothing on the site about them: the answer is "this site does not say", not
    // sections about the earlier topic dressed up as closest matches.
    await ask(page, 'What is his salary expectation?');
    await expect(turns(page)).toHaveCount(2);
    await expect(turns(page).nth(1).locator('.ai-a-text')).toContainText('This site does not say');
    await expect(turns(page).nth(1).getByText('Closest sections')).toHaveCount(0);
    expect((await aiState(page)).prompts.length, 'the model was not asked').toBe(1);
  });

  test('answers questions about all the sites and projects from computed overviews', async ({ page, request }) => {
    const overview = idOf(await knowledge(request), 'insight', 'Technologies across the websites and apps');
    await open(page, '/');
    await queueResponses(
      page,
      grounded(
        [overview],
        'Tailwind CSS and TypeScript are used by all 5 of the websites and apps that have their own page.',
      ),
    );
    await ask(page, 'Which technologies does he use most?');

    await expect(turns(page).locator('.ai-a-text')).toContainText('all 5 of the websites');
    const [call] = (await aiState(page)).prompts;
    expect(call.input).toContain('Technologies used across the 5 websites and apps');
    expect(call.input).toMatch(/Tailwind CSS \(5\)/);
  });

  test('a question the site cannot answer gets the plain fallback, with no model and no download', async ({ page }) => {
    await open(page, '/', { availability: 'downloadable' });
    await ask(page, 'What is his salary expectation?');

    await expect(turns(page).locator('.ai-a-text')).toContainText('This site does not say');
    await expect(turns(page).locator('.ai-a-label')).toHaveText('Not on this site');
    const calls = await aiState(page);
    expect(calls.created, 'no model was needed').toBe(0);
    expect(calls.prompts).toEqual([]);
    await expect(panel(page, 'ask').locator('[data-ai-confirm]')).toBeHidden();
    await expect(panel(page, 'ask').locator('[data-ai-examples]')).toBeVisible(); // offered again
  });

  const refusals: [string, (study: string) => unknown][] = [
    ['says it cannot answer', (study) => ({ answerable: false, answer: '', sources: [study] })],
    ['cites nothing', () => ({ answerable: true, answer: 'Shakoor has done a lot of identity work.', sources: [] })],
    [
      'cites a note it was not shown',
      () => ({ answerable: true, answer: 'Shakoor has done a lot of identity work.', sources: ['zz99'] }),
    ],
    [
      // 11 is inside the id of one of the notes it was shown (ex11): an id must not vouch for a number
      'states a number that is not in the notes',
      (study) => ({ answerable: true, answer: 'Shakoor has done identity work for 11 years.', sources: [study] }),
    ],
    ['sends something that is not JSON', () => 'Sure! He knows everything.'],
  ];
  for (const [name, reply] of refusals) {
    test(`an answer is dropped when the model ${name}`, async ({ page, request }) => {
      const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
      await open(page, '/');
      await queueResponses(page, reply(study));
      await ask(page, question);

      await expect(turns(page).locator('.ai-a-text')).toContainText('This site does not say');
      await expect(turns(page).getByText('Closest sections')).toBeVisible();
      expect((await aiState(page)).destroyed).toBe(1);
      // A refused answer is not remembered as something the site said.
      await queueResponses(page, grounded([study]));
      await ask(page, question);
      await expect(turns(page)).toHaveCount(2);
      expect((await aiState(page)).prompts[1].input).not.toContain('Earlier in this conversation');
    });
  }

  test('numbers that are in the notes are allowed', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    await queueResponses(page, grounded([study], 'Shakoor designs OAuth 2.0 / OIDC sign-in on .NET 8.'));
    await ask(page, question);
    await expect(turns(page).locator('.ai-a-text')).toContainText('on .NET 8');
  });

  test('declining the download, or pressing Stop, puts the question back in the box', async ({ page }) => {
    await open(page, '/', { availability: 'downloadable' });
    await ask(page, question);
    await panel(page, 'ask').getByRole('button', { name: 'Not now' }).click();
    await expect(page.locator('#ask-input')).toHaveValue(question);
    await expect(panel(page, 'ask').locator('.ai-turn-q')).toHaveCount(0);
    expect((await aiState(page)).created).toBe(0);
  });

  test('Arabic gets "English only", with nothing sent to the model', async ({ page }) => {
    await open(page, '/');
    await ask(page, 'ما هي الخدمات التي يقدمها شاكور للشركات في الإمارات؟');
    await expect(status(page, 'ask')).toContainText('English only');
    expect((await aiState(page)).prompts).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------ the "Ask AI" button and window
test.describe('"Ask AI" button and window', () => {
  const launcher = (page: Page) => page.getByRole('button', { name: 'Ask AI' });
  const dialog = (page: Page) => page.locator('dialog.ai-dialog');

  for (const path of ['/', '/work/', '/privacy/', '/quote/']) {
    test(`${path}: shown where the browser can run the model, hidden everywhere else`, async ({ browser }) => {
      for (const [label, options, visible] of [
        ['a browser that can', {}, true],
        ['a computer that cannot', { availability: 'unavailable' as const }, false],
        ['a browser without the API', { apis: 'none' as const }, false],
      ] as const) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await open(page, path, options);
        if (visible) await expect(launcher(page), label).toBeVisible();
        else {
          await expect
            .poll(async () => (await aiState(page).catch(() => null))?.availabilityCalls ?? 1, { message: label })
            .toBeGreaterThanOrEqual(0);
          await page.waitForTimeout(600); // let the idle check run
          await expect(launcher(page), label).toBeHidden();
        }
        await context.close();
      }
    });
  }

  test('opens a chat window, answers in it, closes with Escape and gives focus back', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/work/');
    await launcher(page).click();

    await expect(dialog(page)).toHaveAttribute('open', '');
    await expect(page.locator('#ai-chat-input')).toBeFocused();
    await queueResponses(page, {
      answerable: true,
      answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.',
      sources: [study],
    });
    await page.locator('#ai-chat-input').fill('What identity and SSO work has he done?');
    await page.locator('#ai-chat-input').press('Enter');
    await expect(dialog(page).locator('.ai-turn-a .ai-a-text')).toContainText('OAuth 2.0 / OIDC');

    await page.keyboard.press('Escape');
    await expect(dialog(page)).not.toHaveAttribute('open', '');
    await expect(launcher(page)).toBeFocused();

    await launcher(page).click(); // the conversation is still there
    await expect(dialog(page).locator('.ai-turn-a')).toHaveCount(1);
  });

  test('closes from its close button and from a click on the backdrop', async ({ page }) => {
    await open(page, '/');
    await launcher(page).click();
    await dialog(page).getByRole('button', { name: 'Close the chat' }).click();
    await expect(dialog(page)).not.toHaveAttribute('open', '');

    await launcher(page).click();
    await page.mouse.click(4, 4); // outside the window: the backdrop
    await expect(dialog(page)).not.toHaveAttribute('open', '');
  });
});

// ------------------------------------------------------------------------------------------------ promotion
test.describe('promotion', () => {
  test('the home page points to all three tools, in any browser', async ({ browser }) => {
    const context = await browser.newContext({ userAgent: UA.safari });
    const page = await context.newPage();
    await open(page, '/', { apis: 'none' });
    const band = page.locator('#ai');
    await expect(band.getByRole('heading', { name: 'Try the AI on this site' })).toBeVisible();
    const hrefs = await band.locator('a.ai-tool').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['/#ask', '/services/#ai-fit', '/quote/#ai-quote']);
    await expect(launcher(page)).toBeHidden(); // no floating button for a browser that cannot use it
    await context.close();
  });

  test('the job-fit check is the first thing on the services page after the introduction', async ({ page }) => {
    await open(page, '/services/');
    const headings = await page.locator('main h2').allInnerTexts();
    expect(headings[0]).toBe('Hiring? Check the fit against your job description');
  });
});

// ------------------------------------------------------------------------------------------------ other browsers
// Chrome is the reference. Edge's Prompt API is an experimental preview (a flag, another model, other hardware limits);
// Safari and Firefox have nothing. Each gets wording and numbers that are true for it, and a browser that rejects an
// option Chrome accepts gets a plainer request instead of a failure.
const EDGE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0';
const EDGE_OLD = EDGE.replaceAll('154', '120');
const OPERA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 OPR/120.0.0.0';
const askHome = async (page: Page, text: string) => {
  await page.locator('#ask-input').fill(text);
  await page.locator('#ask-input').press('Enter');
};

test.describe('Edge', () => {
  test.use({ userAgent: EDGE });

  test('without the Prompt API it explains the experimental flag, not "update Chrome"', async ({ page }) => {
    await open(page, '/', { apis: 'none' });
    const notice = panel(page, 'ask').locator('[data-ai-notice]');
    await expect(notice.locator('[data-ai-notice-title]')).toHaveText('Turn on Edge’s experimental AI, or use Chrome');
    await expect(notice.locator('[data-ai-notice-body]')).toContainText('edge://flags');
    await expect(notice.locator('[data-ai-notice-body]')).toContainText('Prompt API for on-device language model');
    await expect(notice).not.toContainText('Chrome menu');
  });

  test('without the Summarizer it says the browser does not offer it, not "update Chrome"', async ({ page }) => {
    await open(page, '/projects/oneportal-iam/', { apis: 'none' });
    const notice = panel(page, 'ai-summary').locator('[data-ai-notice]');
    await expect(notice.locator('[data-ai-notice-title]')).toHaveText('On-device AI is switched off here');
    await expect(notice.locator('[data-ai-notice-body]')).toContainText('Edge does not offer');
  });

  test("a computer that cannot run it hears Edge's numbers, not Chrome's", async ({ page }) => {
    await open(page, '/', { availability: 'unavailable' });
    await askHome(page, 'What identity and SSO work has he done?');
    const message = status(page, 'ask');
    await expect(message).toContainText('Edge’s on-device AI');
    await expect(message).toContainText('experimental preview');
    await expect(message).toContainText('20 GB');
    await expect(message).toContainText('5.5 GB');
    await expect(message).not.toContainText('22 GB');
  });

  test('the download question and the progress name Edge', async ({ page }) => {
    await open(page, '/', { availability: 'downloadable' });
    await askHome(page, 'What identity and SSO work has he done?');
    await expect(panel(page, 'ask').locator('[data-ai-confirm-text]')).toContainText('Edge needs to download');
    await watchStatus(page, 'ask');
    await panel(page, 'ask').getByRole('button', { name: 'Download and continue' }).click();
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);
    const log = await statusLog(page);
    expect(log.texts.some((text) => /Downloading Edge’s on-device model/.test(text))).toBe(true);
    expect(log.texts).toContain('Preparing Edge’s on-device model…');
  });

  test('an Edge that is too old is told to update Edge', async ({ browser }) => {
    const context = await browser.newContext({ userAgent: EDGE_OLD });
    const page = await context.newPage();
    await open(page, '/', { apis: 'none' });
    await expect(panel(page, 'ask').locator('[data-ai-notice-title]')).toHaveText('Update Edge to use this');
    await expect(panel(page, 'ask').locator('[data-ai-notice-body]')).toContainText('Edge menu');
    await context.close();
  });
});

test.describe('another Chromium browser', () => {
  test.use({ userAgent: OPERA });

  test('without the API it does not talk about the Chrome menu or Chrome versions', async ({ page }) => {
    await open(page, '/', { apis: 'none' });
    const notice = panel(page, 'ask').locator('[data-ai-notice]');
    await expect(notice.locator('[data-ai-notice-title]')).toHaveText('On-device AI is switched off here');
    await expect(notice).not.toContainText('Chrome menu');
    await expect(notice).toContainText('Chrome on a desktop or laptop is the best place to try it');
  });

  test('its numbers are cautious, because nobody has published them', async ({ page }) => {
    await open(page, '/', { availability: 'unavailable' });
    await askHome(page, 'What identity and SSO work has he done?');
    await expect(status(page, 'ask')).toContainText('this browser’s on-device AI');
    await expect(status(page, 'ask')).toContainText('typically needs');
  });
});

test.describe('a browser that does not speak Chrome’s dialect', () => {
  const identity = 'What identity and SSO work has he done?';
  const reply = (study: string) => ({
    answerable: true,
    answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.',
    sources: [study],
  });

  test('rejects the language hints: it is asked again without them and works', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/', { dialect: { languageHints: 'rejected' } });
    await queueResponses(page, reply(study));
    await askHome(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a .ai-a-text')).toContainText('OAuth 2.0 / OIDC');
    const calls = await aiState(page);
    expect(calls.rejected.length, 'the launcher, the model check and create() each had to retry').toBe(3);
    expect(new Set(calls.rejected)).toEqual(new Set(['languageHints']));
    await expect(launcher(page), 'the Ask AI button still appears in such a browser').toBeVisible();
    expect(calls.created).toBe(1);
  });

  test('cannot enforce a response schema: it is asked for plain JSON and a wrapped reply is read', async ({
    page,
    request,
  }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/', { dialect: { constraint: 'rejected' } });
    const wrapped = (answer: string) =>
      `Sure! Here is the JSON:\n\`\`\`json\n${JSON.stringify({ answerable: true, answer, sources: [study] })}\n\`\`\``;
    await queueResponses(
      page,
      wrapped('Shakoor designs OAuth 2.0 / OIDC sign-in.'),
      wrapped('Shakoor also delivers it as a service.'),
    );
    await askHome(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a .ai-a-text')).toHaveText(
      'Shakoor designs OAuth 2.0 / OIDC sign-in.',
    );
    await askHome(page, 'What AI and MCP tooling has he built?');
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(2);

    const calls = await aiState(page);
    expect(calls.rejected, 'the schema was refused once, then not tried again').toEqual(['constraint']);
    expect(calls.prompts).toHaveLength(2);
    for (const prompt of calls.prompts) {
      expect(prompt.constraint).toBeUndefined();
      expect(prompt.input, 'the shape is asked for in words instead').toContain(
        'Reply with only a JSON object that follows this JSON Schema',
      );
    }
  });

  test('the answer checks still apply when the reply is only plain JSON', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/', { dialect: { constraint: 'rejected' } });
    await queueResponses(
      page,
      `{"answerable": true, "answer": "Shakoor has done identity work for 11 years.", "sources": ["${study}"]}`,
    );
    await askHome(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a .ai-a-text')).toContainText('This site does not say');
  });

  test('the job-fit check and the quote helper also work without an enforced schema', async ({ page, request }) => {
    const chunks = await knowledge(request);
    const iam = idOf(chunks, 'skill', 'Identity, Security & IAM');
    await open(page, '/services/', { dialect: { constraint: 'rejected' } });
    await page.locator('#ai-fit-input').fill(enterJobDescription);
    await queueResponses(
      page,
      `Here you go: {"requirements":[{"requirement":"OAuth 2.0 and OIDC single sign-on","match":"strong","evidence":["${iam}"]}]}`,
    );
    await page.getByRole('button', { name: 'Check the fit' }).click();
    await expect(panel(page, 'ai-fit').locator('.ai-row .ai-chip')).toHaveText(['Strong evidence']);
  });

  test('has no clone(): each question gets a session of its own, and still works', async ({ page, request }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/', { dialect: { clone: 'missing' } });
    await queueResponses(page, reply(study), reply(study));
    await askHome(page, identity);
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(1);
    await askHome(page, 'What AI and MCP tooling has he built?');
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(2);
    const calls = await aiState(page);
    expect(calls.clones).toBe(0);
    expect(calls.created, 'one session per question').toBe(2);
    expect(calls.destroyed, 'and each released afterwards').toBe(2);
  });
});

test.describe('when something unexpected goes wrong', () => {
  test('it says what, so a browser quirk can be told from a passing glitch, and keeps the question', async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (message) => message.type() === 'warning' && warnings.push(message.text()));
    await open(page, '/');
    // Two failures in a row: a single one is retried, plainly, once.
    await queueResponses(page, { __throw: 'DataCloneError' }, { __throw: 'DataCloneError' });
    await askHome(page, 'What identity and SSO work has he done?');

    await expect(status(page, 'ask')).toContainText('On-device AI could not finish that. Try again in a moment.');
    await expect(status(page, 'ask')).toContainText('Details: DataCloneError: mock failure');
    await expect(page.locator('#ask-input')).toHaveValue('What identity and SSO work has he done?');
    expect(warnings.some((text) => text.includes('[on-device AI]'))).toBe(true);
  });

  test('one failed attempt is retried once, plainly, without switching schema enforcement off for good', async ({
    page,
    request,
  }) => {
    const study = idOf(await knowledge(request), 'service', 'Identity, SSO');
    await open(page, '/');
    const good = { answerable: true, answer: 'Shakoor designs OAuth 2.0 / OIDC sign-in.', sources: [study] };
    await queueResponses(page, { __throw: 'DataCloneError' }, good, good);
    await askHome(page, 'What identity and SSO work has he done?');
    await expect(panel(page, 'ask').locator('.ai-turn-a .ai-a-text')).toContainText('OAuth 2.0 / OIDC');
    await askHome(page, 'What AI and MCP tooling has he built?');
    await expect(panel(page, 'ask').locator('.ai-turn-a')).toHaveCount(2);

    const { prompts } = await aiState(page);
    // The mock records a call before it fails: [0] the attempt that failed, [1] the plain retry, [2] the next question.
    expect(prompts).toHaveLength(3);
    expect(prompts[0].constraint, 'first asked with the schema').toBeDefined();
    expect(prompts[1].constraint, 'the retry asked in plain words').toBeUndefined();
    expect(prompts[2].constraint, 'a passing glitch did not disable the schema for the next question').toBeDefined();
  });

  test('the usual failures stay friendly, with no technical detail', async ({ page }) => {
    await open(page, '/');
    await queueResponses(page, { __throw: 'QuotaExceededError' });
    await askHome(page, 'What identity and SSO work has he done?');
    await expect(status(page, 'ask')).toHaveText('That is too long for the on-device model. Try something shorter.');
  });

  test('panels name no particular browser in their badge or fine print', async ({ page }) => {
    await open(page, '/');
    await expect(panel(page, 'ask').locator('.ai-badge')).toHaveText('On-device AI');
    await expect(panel(page, 'ask').locator('.ai-fine')).not.toContainText('Chrome');
  });
});
