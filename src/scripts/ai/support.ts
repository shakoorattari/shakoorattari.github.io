// Can this browser run on-device AI at all? Decided by feature detection, never by the browser's name: a browser that
// ships the API simply works. The user agent only picks the wording (Chrome, Edge, anything else) and the numbers in it,
// because the browsers differ: Chrome's Prompt API is stable from 148; Edge's is an experimental preview (a flag, a
// different model, different hardware limits) while its Summarizer is already on; Safari and Firefox have neither.
export type AiApi = 'prompt' | 'summarizer';
export type Browser = 'chrome' | 'edge' | 'chromium' | 'other';

/** The Chromium version that shipped each API to web pages (Prompt API: 148, Summarizer: 138). */
const MIN_CHROMIUM: Record<AiApi, number> = { prompt: 148, summarizer: 138 };

/** The on-device model is English-only for the Prompt API on the web (en, es, ja, de, fr), and so is this site. */
export const PROMPT_LANGUAGES: LanguageModelOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

/**
 * A browser that rejects an option Chrome accepts (language hints, a schema) throws one of these. Chrome's Prompt API is the
 * reference; Edge's is an experimental preview that documents fewer options.
 */
export const isDialectProblem = (error: unknown): boolean =>
  error instanceof TypeError ||
  (error instanceof Error &&
    ['NotSupportedError', 'SyntaxError', 'DataError', 'InvalidStateError'].includes(error.name));

/** The Prompt API's availability, asked with the language hints and, if the browser rejects those, without. Reads state only. */
export async function promptAvailability(): Promise<AiAvailability> {
  const api = globalThis.LanguageModel!;
  try {
    return await api.availability(PROMPT_LANGUAGES);
  } catch (error) {
    if (!isDialectProblem(error)) throw error;
    return api.availability();
  }
}

export const hasApi = (api: AiApi): boolean =>
  api === 'prompt' ? typeof globalThis.LanguageModel !== 'undefined' : typeof globalThis.Summarizer !== 'undefined';

/** Which family the browser is in, for wording only. "chromium" is Brave, Opera, Vivaldi and the like. */
export function detectBrowser(ua: string = navigator.userAgent): Browser {
  if (/\bEdg(?:e|A|iOS)?\//.test(ua)) return 'edge';
  if (/CriOS|FxiOS|Firefox/.test(ua) || !/\bChrome\//.test(ua)) return 'other';
  if (/OPR\/|Opera|Vivaldi|YaBrowser|SamsungBrowser/.test(ua) || 'brave' in navigator) return 'chromium';
  return 'chrome';
}

/** "Chrome", "Edge" or "your browser", for sentences such as "<name> needs to download…". */
export function browserName(ua?: string): string {
  const browser = detectBrowser(ua);
  return browser === 'chrome' ? 'Chrome' : browser === 'edge' ? 'Edge' : 'your browser';
}

/** "Chrome’s", "Edge’s" or "your browser’s". */
export const browserPossessive = (ua?: string): string => {
  const name = browserName(ua);
  return `${name}’s`;
};

export interface Notice {
  title: string;
  body: string;
}

export function describeUnsupported(api: AiApi, ua: string = navigator.userAgent): Notice {
  const minimum = MIN_CHROMIUM[api];
  if (/Android|iPhone|iPad|iPod|Mobi/i.test(ua)) {
    return {
      title: 'Open this on a desktop or laptop',
      body: 'On-device AI does not run on phones or tablets yet. Open this page in Chrome on a desktop or laptop to try it.',
    };
  }
  const browser = detectBrowser(ua);
  if (browser === 'other') {
    return {
      title: 'Open this page in Chrome',
      body: 'On-device AI runs inside Chrome on a desktop or laptop. Copy the link and open it in Chrome to try it.',
    };
  }
  const major = Number(/\bChrome\/(\d+)/.exec(ua)?.[1] ?? 0);
  if (browser === 'edge') {
    return major < minimum
      ? {
          title: 'Update Edge to use this',
          body: `This needs a recent Microsoft Edge (it is on version ${major}). Update it from the Edge menu, then reload the page, or open this page in Chrome.`,
        }
      : api === 'prompt'
        ? {
            title: 'Turn on Edge’s experimental AI, or use Chrome',
            body: 'Edge’s built-in AI is still an experimental preview. In Edge, open edge://flags, turn on “Prompt API for on-device language model”, restart Edge and reload this page. Chrome on a desktop or laptop works without any setting.',
          }
        : {
            title: 'On-device AI is switched off here',
            body: 'Edge does not offer its built-in AI on this computer. It may be turned off by your organisation or not supported on this hardware. Chrome on a desktop or laptop is the best place to try it.',
          };
  }
  if (major < minimum) {
    return {
      title: browser === 'chrome' ? 'Update Chrome to use this' : 'Update your browser to use this',
      body:
        browser === 'chrome'
          ? `This needs Chrome ${minimum} or newer, and this browser is on version ${major}. Update it from the Chrome menu, then reload the page.`
          : `This needs a browser based on Chromium ${minimum} or newer, and this one reports ${major}. Update it, or open this page in Chrome.`,
    };
  }
  return {
    title: 'On-device AI is switched off here',
    body:
      browser === 'chrome'
        ? 'This browser does not offer Chrome’s built-in AI. It may be turned off by your organisation or not supported on this computer. Chrome on a desktop or laptop is the best place to try it.'
        : 'This browser does not offer built-in AI, or has switched it off. Chrome on a desktop or laptop is the best place to try it.',
  };
}

/** Fill a panel's notice and wire its "copy link" button. */
export function showNotice(panel: HTMLElement, api: AiApi): void {
  const notice = panel.querySelector<HTMLElement>('[data-ai-notice]');
  if (!notice) return;
  const { title, body } = describeUnsupported(api);
  notice.querySelector('[data-ai-notice-title]')!.textContent = title;
  notice.querySelector('[data-ai-notice-body]')!.textContent = body;

  const copy = notice.querySelector<HTMLButtonElement>('[data-ai-copy]');
  if (copy) {
    if (!navigator.clipboard) copy.hidden = true;
    else
      copy.addEventListener('click', () => {
        navigator.clipboard.writeText(location.href).then(
          () => (copy.textContent = 'Link copied'),
          () => (copy.textContent = 'Could not copy: copy the address bar instead'),
        );
      });
  }
  notice.hidden = false;
}
