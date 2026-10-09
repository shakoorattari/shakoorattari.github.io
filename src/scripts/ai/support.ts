// Can this browser run Chrome's on-device AI at all? Decided by feature detection, never by the browser's name:
// the user agent only picks the wording of the notice (so Edge, or any browser that ships the API, simply works).
export type AiApi = 'prompt' | 'summarizer';

/** The Chrome version that shipped each API to web pages (Prompt API: 148, Summarizer: 138). */
const MIN_CHROME: Record<AiApi, number> = { prompt: 148, summarizer: 138 };

/** The on-device model is English-only for the Prompt API on the web (en, es, ja, de, fr), and so is this site. */
export const PROMPT_LANGUAGES: LanguageModelOptions = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

export const hasApi = (api: AiApi): boolean =>
  api === 'prompt' ? typeof globalThis.LanguageModel !== 'undefined' : typeof globalThis.Summarizer !== 'undefined';

export interface Notice {
  title: string;
  body: string;
}

export function describeUnsupported(api: AiApi, ua: string = navigator.userAgent): Notice {
  const minimum = MIN_CHROME[api];
  if (/Android|iPhone|iPad|iPod|Mobi/i.test(ua)) {
    return {
      title: 'Open this on a desktop or laptop',
      body: 'On-device AI does not run on phones or tablets yet. Open this page in Chrome on a desktop or laptop to try it.',
    };
  }
  const chrome = /\bChrome\/(\d+)/.exec(ua);
  if (!chrome || /CriOS|Firefox|FxiOS/.test(ua)) {
    return {
      title: 'Open this page in Chrome',
      body: 'On-device AI runs inside Chrome on a desktop or laptop. Copy the link and open it in Chrome to try it.',
    };
  }
  const major = Number(chrome[1]);
  if (major < minimum) {
    return {
      title: 'Update Chrome to use this',
      body: `This needs Chrome ${minimum} or newer, and this browser is on version ${major}. Update it from the Chrome menu, then reload the page.`,
    };
  }
  return {
    title: 'On-device AI is switched off here',
    body: 'This browser does not offer Chrome’s built-in AI. It may be turned off by your organisation or not supported on this computer. Chrome on a desktop or laptop is the best place to try it.',
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
