// Opening Chrome's on-device models: availability, the download question, progress, and friendly errors.
// Everything here runs only after a click, and only when the browser exposes the API (see support.ts).
import {
  PROMPT_LANGUAGES,
  browserName,
  detectBrowser,
  isDialectProblem,
  promptAvailability,
  type Browser,
} from './support';
import type { PanelUi } from './ui';

// The numbers differ by browser, so the message does too (Chrome: developer.chrome.com/docs/ai/prompt-api; Edge:
// learn.microsoft.com/microsoft-edge/web-platform/prompt-api, where it is an experimental preview).
const UNAVAILABLE: Record<Browser, string> = {
  chrome:
    'This computer cannot run Chrome’s on-device AI. It needs a desktop or laptop with Windows 10/11, macOS 13 or later, or Linux, about 22 GB of free disk space, and either a graphics card with more than 4 GB of memory or 16 GB of RAM with four or more CPU cores.',
  edge: 'This computer cannot run Edge’s on-device AI, which is still an experimental preview. It needs Windows 10/11 or macOS 13.3 or later, at least 20 GB of free disk space, a graphics card with 5.5 GB or more of memory and an unmetered connection for the one-time download. Chrome on a desktop or laptop is the other thing to try.',
  chromium:
    'This computer cannot run this browser’s on-device AI. It typically needs a desktop or laptop with a graphics card with several GB of memory and about 20 GB of free disk space. Chrome on a desktop or laptop is the best place to try it.',
  other:
    'This computer cannot run on-device AI. It typically needs a desktop or laptop with a graphics card with several GB of memory and about 20 GB of free disk space. Chrome on a desktop or laptop is the best place to try it.',
};
const downloadQuestion = () =>
  `${browserName()} needs to download its on-device AI model first. It is a large, one-time download that is kept and shared with other sites that use it. Your text stays on this computer. Download it now?`;

/** What went wrong, in a few words, for the people who have to fix it: "TypeError: responseConstraint is not supported". */
export function detailOf(error: unknown): string {
  const name = error instanceof Error ? error.name : typeof error;
  const message = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').trim().slice(0, 140);
  return message ? `${name}: ${message}` : name;
}

/** A friendly sentence for a failure, or null when the visitor stopped it on purpose. */
export function describeFailure(error: unknown): string | null {
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'AbortError':
      return null;
    case 'NotAllowedError':
      return 'The browser needs a fresh click before it can start the download. Press the button again.';
    case 'QuotaExceededError':
      return 'That is too long for the on-device model. Try something shorter.';
    case 'NotSupportedError':
      return 'The on-device model cannot handle that request.';
    default:
      // Unexpected: say why, so a browser or a hardware quirk can be told apart from a passing glitch.
      return `On-device AI could not finish that. Try again in a moment. Details: ${detailOf(error)}`;
  }
}

/** Show the outcome of a failed or stopped run in the panel (and, for a surprise, in the console for whoever debugs it). */
export function reportFailure(ui: PanelUi, error: unknown): void {
  const message = describeFailure(error);
  if (message && !/^(The browser needs|That is too long|The on-device model cannot)/.test(message)) {
    console.warn('[on-device AI]', error);
  }
  ui.say(message ?? 'Stopped.', message ? 'error' : 'info');
}

// ---------------------------------------------------------------- browsers speak slightly different dialects
// Chrome's Prompt API is the reference; Edge's is an experimental preview that documents fewer options. A browser that
// rejects an option the page sends (language hints, a JSON schema, clone) should get a plainer request, not a failure.
const mustSurface = (error: unknown): boolean =>
  error instanceof Error && ['AbortError', 'QuotaExceededError', 'NotAllowedError'].includes(error.name);

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
  } catch (error) {
    console.warn('[on-device AI]', error);
    ui.say(`On-device AI could not start. Try again in a moment. Details: ${detailOf(error)}`, 'error');
    return null;
  }
  if (state === 'unavailable') {
    ui.say(UNAVAILABLE[detectBrowser()], 'error');
    return null;
  }
  if (state === 'downloadable' && !(await ui.confirm(downloadQuestion(), 'Download and continue'))) {
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
 * session, so destroy it when done: that frees the clone and leaves the model loaded. In a browser without `clone()` it
 * is a session of its own, created per question (slower, but it works).
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
      forget(key); // the browser released the base: start again below
    }
  }

  const state = await ready(promptAvailability, ui);
  if (!state) return null;
  ui.say('Starting the on-device model…');
  const loading = new AbortController();
  const forward = () => loading.abort();
  init.signal?.addEventListener('abort', forward, { once: true });
  try {
    const options: LanguageModelCreateOptions = {
      initialPrompts: [{ role: 'system', content: init.system }],
      monitor: monitorTo(ui, state !== 'available'),
      signal: loading.signal,
    };
    // Language hints are a Chrome detail: a browser that rejects them is asked again without.
    const base = await createWithFallback(
      () => api.create({ ...PROMPT_LANGUAGES, ...options }),
      () => api.create(options),
    );
    init.signal?.removeEventListener('abort', forward); // from here on, Stop must not destroy the shared base
    if (typeof base.clone !== 'function') return base; // no clone(): one session per question
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

/** Ask with options; if the browser rejects them as unsupported, ask once more without. Anything else is a real failure. */
async function createWithFallback<T>(withOptions: () => Promise<T>, plain: () => Promise<T>): Promise<T> {
  try {
    return await withOptions();
  } catch (error) {
    if (mustSurface(error) || !isDialectProblem(error)) throw error;
    console.warn('[on-device AI] retrying with plainer options after', error);
    return await plain();
  }
}

async function availabilityOf(withOptions: () => Promise<AiAvailability>, plain: () => Promise<AiAvailability>) {
  return createWithFallback(withOptions, plain);
}

let constraintWorks = true;

/**
 * Prompt for a JSON object that follows `schema`. Chrome can enforce the schema while it generates; a browser that cannot
 * (or rejects this one) is asked again, plainly, to reply with only JSON of that shape. Either way the caller still
 * validates every field, so a looser reply is no less safe, only less tidy. One failed attempt is retried once; only a
 * browser that actually rejected the schema is asked the plain way from then on, so a passing glitch does not switch
 * enforcement off for the rest of the visit.
 */
export async function promptStructured(
  session: LanguageModelSession,
  input: string,
  schema: object,
  signal?: AbortSignal,
): Promise<string> {
  let rejectedSchema = false;
  if (constraintWorks) {
    try {
      return await session.prompt(input, { responseConstraint: schema, signal });
    } catch (error) {
      if (mustSurface(error)) throw error;
      rejectedSchema = isDialectProblem(error);
      console.warn('[on-device AI] the constrained prompt failed; asking for plain JSON instead', error);
    }
  }
  const reply = await session.prompt(
    `${input}\n\nReply with only a JSON object that follows this JSON Schema, with no other text:\n${JSON.stringify(schema)}`,
    { signal },
  );
  if (rejectedSchema) constraintWorks = false;
  return reply;
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

  // Language hints are optional: a browser that rejects them is asked again without.
  const plain: SummarizerOptions = { ...options, expectedInputLanguages: undefined, outputLanguage: undefined };
  const state = await ready(
    () =>
      availabilityOf(
        () => api.availability(options),
        () => api.availability(plain),
      ),
    ui,
  );
  if (!state) return null;
  ui.say('Starting the on-device model…');
  const loading = new AbortController();
  const forward = () => loading.abort();
  signal?.addEventListener('abort', forward, { once: true });
  try {
    const extra = { monitor: monitorTo(ui, state !== 'available'), signal: loading.signal };
    const session = await createWithFallback(
      () => api.create({ ...options, ...extra }),
      () => api.create({ ...plain, ...extra }),
    );
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
