// "Key points": the Summarizer API reads the page's own text and returns a few bullets. Nothing is sent anywhere.
import type { FeatureFactory } from '../feature';
import { h, reveal } from '../dom';
import { fitToContext, openSummarizer, reportFailure } from '../runtime';

const OPTIONS: SummarizerOptions = {
  type: 'key-points',
  format: 'markdown',
  length: 'short',
  expectedInputLanguages: ['en'],
  outputLanguage: 'en',
  sharedContext: 'A page from the portfolio website of a software engineer based in the UAE.',
};

/** The readable text of the element the panel points at, without the panel itself, in reading order. */
function pageText(panel: HTMLElement): string {
  const root = document.querySelector(panel.dataset.aiSource ?? 'main');
  if (!root) return '';
  const copy = root.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll('[data-ai-panel], script, style, nav, [hidden], [aria-hidden="true"]')
    .forEach((node) => node.remove());
  return [...copy.querySelectorAll('h1, h2, h3, p, li:not(:has(p, li))')]
    .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Bullets from the model's markdown, as plain text. */
function bullets(markdown: string): string[] {
  const lines = markdown
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
        .replace(/[*_`#]+/g, '')
        .trim(),
    )
    .filter(Boolean);
  return lines.slice(0, 8);
}

const summary: FeatureFactory = (panel, ui) => {
  const output = panel.querySelector<HTMLElement>('[data-ai-output]')!;
  const list = output.querySelector<HTMLElement>('[data-ai-list]')!;
  let running = false;

  return {
    async handle() {
      if (running) return;
      const text = pageText(panel);
      if (text.length < 200) {
        ui.say('There is not enough text on this page to summarise.');
        return;
      }

      running = true;
      const controller = new AbortController();
      ui.busy(true, () => controller.abort());
      try {
        const summarizer = await openSummarizer(ui, OPTIONS, controller.signal);
        if (!summarizer) return;
        // The summarizer is kept for the next call (runtime.ts), so it is not destroyed here.
        ui.say('Reading the page…');
        const fitted = await fitToContext(
          {
            inputQuota: summarizer.inputQuota,
            measureInputUsage: summarizer.measureInputUsage?.bind(summarizer),
          },
          text,
          (t) => t,
          0,
        );
        const points = bullets(await summarizer.summarize(fitted.text, { signal: controller.signal }));
        if (points.length === 0) {
          ui.say('The on-device model returned nothing useful. Try again.', 'error');
          return;
        }
        list.replaceChildren(...points.map((point) => h('li', {}, point)));
        reveal(output);
        ui.say(
          fitted.trimmed
            ? 'Done. This covers the first part of a long page. Check it against the page.'
            : 'Done. Check these points against the page.',
        );
      } catch (error) {
        reportFailure(ui, error);
      } finally {
        running = false;
        ui.busy(false);
      }
    },
  };
};

export default summary;
