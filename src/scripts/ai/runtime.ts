// Opening Chrome's on-device models: availability, the download question, progress, and friendly errors.
// Everything here runs only after a click, and only when the browser exposes the API (see support.ts).
import { PROMPT_LANGUAGES } from './support';
import type { PanelUi } from './ui';

const UNAVAILABLE =
  'This computer cannot run Chrome’s on-device AI. It needs a desktop or laptop with Windows 10/11, macOS 13 or later, or Linux, about 22 GB of free disk space, and either a graphics card with more than 4 GB of memory or 16 GB of RAM with four or more CPU cores.';
const DOWNLOAD_QUESTION =
  'Chrome needs to download its on-device AI model first. It is a large, one-time download that Chrome keeps and shares with other sites that use it. Your text stays on this computer. Download it now?';

/** A friendly sentence for a failure, or null when the visitor stopped it on purpose. */
export function describeFailure(error: unknown): string | null {
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'AbortError':
      return null;
    case 'NotAllowedError':
      return 'Chrome needs a fresh click before it can start the download. Press the button again.';
    case 'QuotaExceededError':
      return 'That is too long for the on-device model. Try something shorter.';
    case 'NotSupportedError':
      return 'The on-device model cannot handle that request.';
    default:
      return 'On-device AI could not finish that. Try again in a moment.';
  }
}

/** Show the outcome of a failed or stopped run in the panel. */
export function reportFailure(ui: PanelUi, error: unknown): void {
  const message = describeFailure(error);
  ui.say(message ?? 'Stopped.', message ? 'error' : 'info');
}

/**
 * Download progress, but only when a download is happening. Chrome always fires `downloadprogress` (0, then 1), even
 * for a model that is already on the computer, so showing it unconditionally printed "Downloading… 100%" on every
 * question and then sat there while the model loaded.
 */
const monitorTo = (ui: PanelUi, downloading: boolean) =>
  downloading
    ? (monitor: AiCreateMonitor) =>
        monitor.addEventListener('downloadprogress', (event) => {
          // Chrome reports a fraction; older builds reported bytes loaded out of a total.
          ui.progress(event.loaded > 1 && event.total ? event.loaded / event.total : event.loaded);
        })
    : undefined;

/** Check availability and, for a first download, ask first. Returns the state, or null when the visitor should not go on. */
async function ready(check: () => Promise<AiAvailability>, ui: PanelUi): Promise<AiAvailability | null> {
  let state: AiAvailability;
  try {
    state = await check();
  } catch {
    ui.say('On-device AI could not start. Try again in a moment.', 'error');
    return null;
  }
  if (state === 'unavailable') {
    ui.say(UNAVAILABLE, 'error');
    return null;
  }
  if (state === 'downloadable' && !(await ui.confirm(DOWNLOAD_QUESTION, 'Download and continue'))) {
    ui.say('Cancelled. Nothing was downloaded.');
    return null;
  }
  return state;
}

// ---------------------------------------------------------------- keeping the model warm
// Chrome unloads the model "after a period of time if there are no living sessions", and loading it again is what makes
// a question feel slow. So the first question opens one base session per system prompt, every question works on a cheap
// clone of it (a clone starts from the system prompt without reloading anything), and the base is released after a few
// idle minutes to give the memory back. The base is created with its own AbortController, never a request's signal:
// aborting the signal given to create() later destroys the session.
const IDLE_MS = 5 * 60_000;
const warm = new Map<string, { session: { destroy(): void }; timer: number }>();

function forget(key: string): void {
  const entry = warm.get(key);
  if (!entry) return;
  window.clearTimeout(entry.timer);
  warm.delete(key);
  try {
    entry.session.destroy();
  } catch {
    // Chrome already released it
  }
}

/** Keep `session` for the next question; it is released after IDLE_MS without use. */
function remember<T extends { destroy(): void }>(key: string, session: T): T {
  forget(key);
  warm.set(key, { session, timer: window.setTimeout(() => forget(key), IDLE_MS) });
  return session;
}

/** The kept session, with its idle timer restarted. */
function recall<T>(key: string): T | undefined {
  const entry = warm.get(key);
  if (!entry) return undefined;
  window.clearTimeout(entry.timer);
  entry.timer = window.setTimeout(() => forget(key), IDLE_MS);
  return entry.session as T;
}

/**
 * A Prompt API session primed with a system prompt, or null (the panel already says why). It is a clone of a kept base
 * session, so destroy it when done: that frees the clone and leaves the model loaded.
 */
export async function openPromptSession(
  ui: PanelUi,
  init: { system: string; signal?: AbortSignal },
): Promise<LanguageModelSession | null> {
  const api = globalThis.LanguageModel;
  if (!api) return null;
  const key = `prompt:${init.system}`;

  const kept = recall<LanguageModelSession>(key);
  if (kept) {
    try {
      return await kept.clone({ signal: init.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        reportFailure(ui, error);
        return null;
      }
      forget(key); // Chrome released the base: start again below
    }
  }

  const state = await ready(() => api.availability(PROMPT_LANGUAGES), ui);
  if (!state) return null;
  ui.say('Starting the on-device model…');
  const loading = new AbortController();
  const forward = () => loading.abort();
  init.signal?.addEventListener('abort', forward, { once: true });
  try {
    const base = await api.create({
      ...PROMPT_LANGUAGES,
      initialPrompts: [{ role: 'system', content: init.system }],
      monitor: monitorTo(ui, state !== 'available'),
      signal: loading.signal,
    });
    init.signal?.removeEventListener('abort', forward); // from here on, Stop must not destroy the shared base
    remember(key, base);
    return await base.clone({ signal: init.signal });
  } catch (error) {
    reportFailure(ui, error);
    return null;
  } finally {
    init.signal?.removeEventListener('abort', forward);
    ui.progress(null);
  }
}

/** A summarizer for these options. It keeps no conversation, so one instance serves every call: do not destroy it. */
export async function openSummarizer(
  ui: PanelUi,
  options: SummarizerOptions,
  signal?: AbortSignal,
): Promise<SummarizerSession | null> {
  const api = globalThis.Summarizer;
  if (!api) return null;
  const key = `summarizer:${JSON.stringify(options)}`;

  const kept = recall<SummarizerSession>(key);
  if (kept) return kept;

  const state = await ready(() => api.availability(options), ui);
  if (!state) return null;
  ui.say('Starting the on-device model…');
  const loading = new AbortController();
  const forward = () => loading.abort();
  signal?.addEventListener('abort', forward, { once: true });
  try {
    const session = await api.create({
      ...options,
      monitor: monitorTo(ui, state !== 'available'),
      signal: loading.signal,
    });
    signal?.removeEventListener('abort', forward);
    return remember(key, session);
  } catch (error) {
    reportFailure(ui, error);
    return null;
  } finally {
    signal?.removeEventListener('abort', forward);
    ui.progress(null);
  }
}

// ---------------------------------------------------------------- fitting the input into the model's context
// The context window is small and varies by Chrome version, so measure instead of guessing: cut the input by a
// quarter until it fits, and tell the visitor when that happened.
interface Measurable {
  contextWindow?: number;
  contextUsage?: number;
  inputQuota?: number;
  inputUsage?: number;
  measureContextUsage?(input: string): Promise<number>;
  measureInputUsage?(input: string): Promise<number>;
}

export async function fitToContext(
  session: Measurable,
  text: string,
  wrap: (text: string) => string = (t) => t,
  reserve = 700,
): Promise<{ text: string; trimmed: boolean }> {
  const quota = session.contextWindow ?? session.inputQuota;
  const measure = session.measureContextUsage?.bind(session) ?? session.measureInputUsage?.bind(session);
  if (typeof quota !== 'number' || !measure) return { text, trimmed: false };
  const room = quota - (session.contextUsage ?? session.inputUsage ?? 0) - reserve;

  let current = text;
  let trimmed = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    let used: number;
    try {
      used = await measure(wrap(current));
    } catch {
      break;
    }
    if (used <= room) break;
    current = current.slice(0, Math.floor(current.length * 0.75));
    trimmed = true;
  }
  return { text: current, trimmed };
}
