// Plumbing shared by the site's two forms (contact + quote): toast, lazily loaded Cloudflare Turnstile,
// a best-effort client-side rate limit, Web3Forms delivery and the optional Google Analytics event.
import { contactConfig } from '../data/site';

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
}
const getTurnstile = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const RATE_LIMIT_KEY = 'contact_last_submit';

// Google Analytics event helper. `gtag` exists only after a visitor has accepted analytics (see analytics.ts), so
// this is a no-op for everyone else. Never pass anything the visitor typed.
export const track = (name: string, params: Record<string, string>) => {
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params);
};

/** Clicks on elements marked data-lead="whatsapp|phone" count as a lead event. Only the channel is sent. */
export const trackLeadClicks = () =>
  document.querySelectorAll<HTMLElement>('[data-lead]').forEach((el) => {
    el.addEventListener('click', () => track('generate_lead', { method: el.dataset.lead ?? 'unknown' }));
  });

export const clean = (value: string, max: number) => value.trim().slice(0, max);

// ---------------------------------------------------------------- toast
export type ToastType = 'success' | 'error';

export function createToast(toast: HTMLElement | null) {
  const text = toast?.querySelector<HTMLElement>('.toast-text');
  let timer: number | undefined;

  const hide = () => toast?.classList.remove('show');
  const show = (type: ToastType, message: string) => {
    if (!toast || !text) return;
    window.clearTimeout(timer);
    toast.classList.remove('success', 'error');
    toast.classList.add('show', type);
    text.textContent = message;
    timer = window.setTimeout(hide, 5000);
  };
  toast?.querySelector('.toast-close')?.addEventListener('click', hide);
  return { show, hide };
}

// ---------------------------------------------------------------- copy buttons
export function bindCopyButtons(show: (type: ToastType, message: string) => void) {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!navigator.clipboard) {
        show('error', 'Clipboard is unavailable in this environment.');
        return;
      }
      navigator.clipboard.writeText(button.dataset.copy ?? '').then(
        () => show('success', `${button.dataset.label} copied to clipboard!`),
        () => show('error', 'Failed to copy. Please try manually.'),
      );
    });
  });
}

// ---------------------------------------------------------------- Turnstile (lazy)
const INTERACTION_EVENTS = ['focusin', 'pointerdown', 'input'] as const;

/**
 * Loads Cloudflare's script only when the form takes focus, is tapped or typed in, and (unless `nearViewport` is
 * false) when it comes within 400px of the viewport. A form that sits at the top of its page, like /quote/, must
 * pass `nearViewport: false`, or the script would load with the page. Then it renders the widget.
 * `onToken` receives a token, or null when it expires or errors. `reset()` asks for a fresh single-use token.
 */
export function lazyTurnstile(
  form: HTMLFormElement,
  show: (type: ToastType, message: string) => void,
  onToken: (token: string | null) => void,
  { nearViewport = true }: { nearViewport?: boolean } = {},
) {
  let requested = false;
  let widgetId: string | undefined;
  let observer: IntersectionObserver | undefined;

  const disarm = () => {
    observer?.disconnect();
    for (const type of INTERACTION_EVENTS) form.removeEventListener(type, load);
  };

  function load() {
    if (requested) return;
    requested = true;
    disarm();

    const mount = () => {
      const api = getTurnstile();
      const container = form.querySelector<HTMLElement>('[data-turnstile]');
      if (!api || !container) return;
      widgetId = api.render(container, {
        sitekey: contactConfig.turnstileSiteKey,
        theme: 'dark',
        appearance: 'always',
        callback: (value: string) => onToken(value),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    if (getTurnstile()) return mount();
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = mount;
    script.onerror = () => show('error', 'Could not load bot protection. Please refresh and try again.');
    document.head.appendChild(script);
  }

  for (const type of INTERACTION_EVENTS) form.addEventListener(type, load);
  if (nearViewport) {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) load();
        },
        { rootMargin: '400px 0px' },
      );
      observer.observe(form);
    } else {
      load();
    }
  }

  return {
    reset() {
      const api = getTurnstile();
      if (!api || !widgetId) return;
      try {
        api.reset(widgetId);
      } catch {
        /* widget already gone */
      }
    },
  };
}

// ---------------------------------------------------------------- rate limit (client-side, best effort)
export const rateLimit = {
  /** Seconds left before another submission is allowed, or 0. */
  waitSeconds(): number {
    let last = 0;
    try {
      last = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
    } catch {
      /* storage unavailable */
    }
    return last ? Math.max(0, Math.ceil((contactConfig.rateLimitMs - (Date.now() - last)) / 1000)) : 0;
  },
  mark() {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  },
};

// ---------------------------------------------------------------- delivery
/** Sends the fields to Web3Forms. Returns the message to show; `ok` is true only when the service accepted it. */
export async function sendToWeb3Forms(
  fields: Record<string, string>,
  successFallback: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(contactConfig.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: contactConfig.accessKey,
        from_name: contactConfig.fromName,
        ...fields,
        botcheck: '',
      }),
    });
    const data: { success?: boolean; message?: string } | null = await response.json().catch(() => null);

    if (response.ok && data?.success) return { ok: true, message: data.message || successFallback };

    let message = data?.message || 'Sorry, there was an error sending your message. Please try again.';
    if (response.status === 429) message = data?.message || 'Too many requests. Please try again later.';
    else if (response.status === 400) message = data?.message || 'Invalid submission.';
    return { ok: false, message };
  } catch {
    return { ok: false, message: 'Network error. Please check your connection and try again.' };
  }
}
