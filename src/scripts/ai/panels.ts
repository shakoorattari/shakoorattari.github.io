// On-device AI panels. This is the only AI code that loads with a page, and it does very little: for each panel it
// checks (synchronously, with no model call) whether this browser offers the API, then either shows the panel or a
// "use Chrome" notice. A feature's code, and the model, are only fetched when someone presses a button.
import { PROMPT_LANGUAGES, hasApi, showNotice, type AiApi } from './support';
import type { AiFeature, FeatureFactory } from './feature';

type Loader = () => Promise<{ default: FeatureFactory }>;

const features: Record<string, Loader> = {
  summary: () => import('./features/summary'),
  quote: () => import('./features/quote'),
  fit: () => import('./features/fit'),
  chat: () => import('./features/chat'),
};

async function load(panel: HTMLElement): Promise<AiFeature> {
  const loader = features[panel.dataset.aiFeature ?? ''];
  if (!loader) throw new Error(`unknown AI feature "${panel.dataset.aiFeature}"`);
  const [{ createPanelUi }, module] = await Promise.all([import('./ui'), loader()]);
  return module.default(panel, createPanelUi(panel));
}

document.querySelectorAll<HTMLElement>('[data-ai-panel]').forEach((panel) => {
  const api = panel.dataset.aiApi as AiApi;
  if (!hasApi(api)) {
    showNotice(panel, api);
    return;
  }
  panel.querySelector<HTMLElement>('[data-ai-body]')!.hidden = false;

  let feature: Promise<AiFeature> | undefined;
  const run = (element: HTMLElement, event: Event) => {
    feature ??= load(panel);
    feature.then(
      (instance) => instance.handle(element, event),
      () => {
        feature = undefined; // allow another try
        const status = panel.querySelector<HTMLElement>('[data-ai-status]');
        if (status) status.textContent = 'Could not load this feature. Check your connection and try again.';
      },
    );
  };

  panel.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('[data-ai-action]');
    if (button && panel.contains(button)) run(button, event);
  });
  panel.addEventListener('submit', (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.hasAttribute('data-ai-form')) {
      event.preventDefault();
      run(form, event);
    }
  });
});

// ---- the "Ask AI" button and window, on every page. Shown only where this browser can run the model: a visitor in
// another browser (most of them) never sees a floating button, and one whose computer cannot run it does not either.
// availability() only reads state: it starts no download and no model.
const launcher = document.querySelector<HTMLButtonElement>('[data-ai-launcher]');
const dialog = document.querySelector<HTMLDialogElement>('[data-ai-dialog]');
if (launcher && dialog && hasApi('prompt')) {
  const check = () =>
    globalThis.LanguageModel!.availability(PROMPT_LANGUAGES).then(
      (state) => {
        launcher.hidden = state === 'unavailable';
      },
      () => undefined,
    );
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => void check());
  else setTimeout(() => void check(), 1500);

  launcher.addEventListener('click', () => {
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-ai-input]')?.focus();
  });
  dialog.querySelector('[data-ai-close]')?.addEventListener('click', () => dialog.close());
  // A click on the backdrop lands on the <dialog> element itself; clicks inside land on its children.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
