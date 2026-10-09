// The parts of a panel every feature shares: the status line, download progress, the "download the model?" question
// and the Stop button. Loaded together with the feature, i.e. only once someone uses the panel.
import { browserPossessive } from './support';

export interface PanelUi {
  /** The polite live region under the controls. */
  say(text: string, tone?: 'info' | 'error'): void;
  /** Model download progress as a fraction, or null to hide the bar. */
  progress(fraction: number | null): void;
  /** Ask before a large download. Resolves true only on an explicit click (which also gives Chrome the user activation it needs). */
  confirm(message: string, accept: string): Promise<boolean>;
  /** Mark the panel busy; pass a callback to offer a Stop button. */
  busy(on: boolean, onStop?: () => void): void;
}

export function createPanelUi(panel: HTMLElement): PanelUi {
  const status = panel.querySelector<HTMLElement>('[data-ai-status]')!;
  const bar = panel.querySelector<HTMLProgressElement>('[data-ai-progress]')!;
  const box = panel.querySelector<HTMLElement>('[data-ai-confirm]')!;
  const boxText = box.querySelector<HTMLElement>('[data-ai-confirm-text]')!;
  const yes = box.querySelector<HTMLButtonElement>('[data-ai-confirm-yes]')!;
  const no = box.querySelector<HTMLButtonElement>('[data-ai-confirm-no]')!;
  const stop = panel.querySelector<HTMLButtonElement>('[data-ai-stop]')!;
  let lastBucket = -1;
  let onStop: (() => void) | undefined;

  stop.addEventListener('click', () => onStop?.());

  return {
    say(text, tone = 'info') {
      status.textContent = text;
      status.dataset.tone = tone;
    },

    progress(fraction) {
      if (fraction === null) {
        bar.hidden = true;
        lastBucket = -1;
        return;
      }
      bar.hidden = false;
      // 100% means "downloaded", not "ready": create() still has to load the model, and that can take a while. An
      // indeterminate bar (no value) and the word "Preparing" say so, instead of a full bar that seems stuck.
      if (fraction >= 1) {
        bar.removeAttribute('value');
        if (lastBucket !== 4) {
          lastBucket = 4;
          status.textContent = `Preparing ${browserPossessive()} on-device model…`;
          status.dataset.tone = 'info';
        }
        return;
      }
      bar.value = Math.min(1, Math.max(0, fraction));
      // The bar itself is exposed as a progressbar; the live region only hears every quarter so it is not chatty.
      const bucket = Math.floor(bar.value * 4);
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        status.textContent = `Downloading ${browserPossessive()} on-device model… ${Math.round(bar.value * 100)}%`;
        status.dataset.tone = 'info';
      }
    },

    confirm(message, accept) {
      return new Promise<boolean>((resolve) => {
        const opener = document.activeElement as HTMLElement | null;
        // The question has its own "Not now"; Stop could not dismiss it, and the old status would only be noise.
        const stopWasShown = !stop.hidden;
        stop.hidden = true;
        status.textContent = '';
        boxText.textContent = message;
        yes.textContent = accept;
        box.hidden = false;
        yes.focus();

        const finish = (answer: boolean) => {
          box.hidden = true;
          stop.hidden = !stopWasShown;
          box.removeEventListener('keydown', onKey);
          yes.removeEventListener('click', onYes);
          no.removeEventListener('click', onNo);
          opener?.focus?.();
          resolve(answer);
        };
        const onYes = () => finish(true);
        const onNo = () => finish(false);
        const onKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape') finish(false);
        };
        yes.addEventListener('click', onYes);
        no.addEventListener('click', onNo);
        box.addEventListener('keydown', onKey);
      });
    },

    busy(on, stopCallback) {
      panel.setAttribute('aria-busy', String(on));
      // aria-disabled, not disabled: a focused button that becomes disabled drops keyboard focus.
      panel
        .querySelectorAll('[data-ai-action], [data-ai-form] button[type="submit"]')
        .forEach((control) =>
          on ? control.setAttribute('aria-disabled', 'true') : control.removeAttribute('aria-disabled'),
        );
      onStop = on ? stopCallback : undefined;
      stop.hidden = !(on && stopCallback);
    },
  };
}
