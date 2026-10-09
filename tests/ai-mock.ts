import type { Page } from '@playwright/test';

// A stand-in for Chrome's on-device AI. Tests never depend on a real model: it would be slow, need a multi-gigabyte
// download, and give a different answer each run. The mock follows the real API's rules where the site depends on
// them: `create()` needs user activation when the model must be downloaded, `downloadprogress` always fires (0, then 1)
// even for a model that is already on the computer, a session is not ready until the model has loaded, a clone does not
// reload the model, and a response constraint is recorded so tests can check what the page asked for.

export type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export interface MockOptions {
  /** Whether the browser exposes the APIs at all. */
  apis?: 'both' | 'none';
  availability?: Availability;
  /** How long `prompt()` and `summarize()` take, so a test can press Stop. */
  delay?: number;
}

export interface MockState {
  availability: Availability;
  availabilityCalls: number;
  /** Sessions created from scratch (the model loaded). */
  created: number;
  /** Sessions cloned from a kept base session (the model stays loaded). */
  clones: number;
  destroyed: number;
  delay: number;
  quota: number;
  /** What `prompt()` receives, in order. */
  prompts: { input: string; system: string; constraint: unknown }[];
  /** What `summarize()` receives. */
  summarized: string[];
  /** Queued replies. An object is sent as JSON; { __throw: 'Name' } throws a DOMException of that name. */
  responses: unknown[];
  summaries: string[];
}

type MockWindow = Window & { __ai: MockState };

export async function installChromeAi(page: Page, options: MockOptions = {}) {
  await page.addInitScript(
    ({ apis, availability, delay }) => {
      if (apis === 'none') {
        Object.defineProperty(window, 'LanguageModel', { value: undefined, configurable: true });
        Object.defineProperty(window, 'Summarizer', { value: undefined, configurable: true });
        return;
      }
      const state: MockState = {
        availability,
        availabilityCalls: 0,
        created: 0,
        clones: 0,
        destroyed: 0,
        delay,
        quota: 8000,
        prompts: [],
        summarized: [],
        responses: [],
        summaries: ['- First point\n- Second point\n- Third point'],
      };
      (window as unknown as MockWindow).__ai = state;

      const wait = (ms: number, signal?: AbortSignal) =>
        new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, ms);
          signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });

      // Like Chrome: `downloadprogress` always fires (loaded 0, then 1), even when the model is already on the computer,
      // and 1 only means "downloaded": the session is not ready until the model has been loaded, a moment more.
      const open = async (create: { monitor?: (m: EventTarget) => void; signal?: AbortSignal }) => {
        state.created++;
        const downloading = state.availability === 'downloadable' || state.availability === 'downloading';
        if (state.availability === 'downloadable' && !navigator.userActivation?.isActive) {
          throw new DOMException('Requires user activation', 'NotAllowedError');
        }
        const monitor = new EventTarget();
        create.monitor?.(monitor);
        for (const loaded of downloading ? [0, 0.25, 0.6, 1] : [0, 1]) {
          const event = new Event('downloadprogress');
          Object.assign(event, { loaded });
          monitor.dispatchEvent(event);
          await wait(5, create.signal);
        }
        await wait(20, create.signal); // loading the model
        if (downloading) state.availability = 'available';
      };

      // As in Chrome, aborting the signal given to create() destroys that session, even long after it was created.
      const makeSession = (system: string, signal?: AbortSignal): Record<string, unknown> => {
        let destroyed = false;
        signal?.addEventListener('abort', () => {
          if (!destroyed) state.destroyed++;
          destroyed = true;
        });
        return {
          contextWindow: state.quota,
          contextUsage: 20,
          async measureContextUsage(input: string) {
            return Math.ceil(String(input).length / 4);
          },
          async prompt(input: string, call: { responseConstraint?: unknown; signal?: AbortSignal } = {}) {
            state.prompts.push({ input, system, constraint: call.responseConstraint });
            await wait(state.delay, call.signal);
            const next = state.responses.shift();
            if (next && typeof next === 'object' && '__throw' in next) {
              throw new DOMException('mock failure', String((next as { __throw: string }).__throw));
            }
            return typeof next === 'string' ? next : JSON.stringify(next ?? {});
          },
          async clone(options: { signal?: AbortSignal } = {}) {
            if (destroyed) throw new DOMException('The session is destroyed', 'InvalidStateError');
            state.clones++;
            return makeSession(system, options.signal);
          },
          destroy() {
            if (!destroyed) state.destroyed++;
            destroyed = true;
          },
        };
      };

      Object.defineProperty(window, 'LanguageModel', {
        configurable: true,
        value: {
          async availability() {
            state.availabilityCalls++;
            return state.availability;
          },
          async create(create: {
            initialPrompts?: { content: string }[];
            monitor?: (m: EventTarget) => void;
            signal?: AbortSignal;
          }) {
            await open(create);
            return makeSession(create.initialPrompts?.[0]?.content ?? '', create.signal);
          },
        },
      });

      Object.defineProperty(window, 'Summarizer', {
        configurable: true,
        value: {
          async availability() {
            state.availabilityCalls++;
            return state.availability;
          },
          async create(create: { monitor?: (m: EventTarget) => void; signal?: AbortSignal }) {
            await open(create);
            return {
              inputQuota: state.quota,
              async measureInputUsage(input: string) {
                return Math.ceil(String(input).length / 4);
              },
              async summarize(input: string, call: { signal?: AbortSignal } = {}) {
                state.summarized.push(input);
                await wait(state.delay, call.signal);
                return state.summaries.shift() ?? '';
              },
              destroy() {
                state.destroyed++;
              },
            };
          },
        },
      });
    },
    { apis: options.apis ?? 'both', availability: options.availability ?? 'available', delay: options.delay ?? 10 },
  );

  // "Copy page link" in the notice.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => ((window as unknown as { __copied: string }).__copied = text) },
      configurable: true,
    });
  });
}

/** Queue replies for the next `prompt()` calls. */
export const queueResponses = (page: Page, ...responses: unknown[]) =>
  page.evaluate((items) => (window as unknown as MockWindow).__ai.responses.push(...items), responses);

/** Everything the page asked the mock to do. */
export const aiState = (page: Page): Promise<MockState> =>
  page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as MockWindow).__ai)) as MockState);

/**
 * Record everything a panel's status line says, and whether its progress bar was ever shown, from now on. Read it back
 * with `statusLog`. Used to prove what the visitor was told, not just what the page ended up saying.
 */
export const watchStatus = (page: Page, panelId: string) =>
  page.evaluate((id) => {
    const panel = document.getElementById(id)!;
    const log: string[] = [];
    const bar = panel.querySelector<HTMLElement>('[data-ai-progress]')!;
    const status = panel.querySelector<HTMLElement>('[data-ai-status]')!;
    (
      window as unknown as { __statusLog: { texts: string[]; barShown: boolean; barIndeterminate: boolean } }
    ).__statusLog = { texts: log, barShown: false, barIndeterminate: false };
    const record = () => {
      const w = (
        window as unknown as { __statusLog: { texts: string[]; barShown: boolean; barIndeterminate: boolean } }
      ).__statusLog;
      if (!bar.hidden) {
        w.barShown = true;
        if (!bar.hasAttribute('value')) w.barIndeterminate = true;
      }
    };
    new MutationObserver(() => {
      if (status.textContent) log.push(status.textContent);
    }).observe(status, { childList: true, characterData: true, subtree: true });
    new MutationObserver(record).observe(bar, { attributes: true });
  }, panelId);

export const statusLog = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __statusLog: { texts: string[]; barShown: boolean; barIndeterminate: boolean } })
        .__statusLog,
  );
