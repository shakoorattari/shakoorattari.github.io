// Contact form: validation, Web3Forms submission, Cloudflare Turnstile (lazy), copy buttons.
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
const track = (name: string, params: Record<string, string>) => {
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', name, params);
};

// ---------------------------------------------------------------- toast
const toast = document.getElementById('contact-toast');
const toastText = toast?.querySelector<HTMLElement>('.toast-text');
let toastTimer: number | undefined;

function showToast(type: 'success' | 'error', message: string) {
  if (!toast || !toastText) return;
  window.clearTimeout(toastTimer);
  toast.classList.remove('success', 'error');
  toast.classList.add('show', type);
  toastText.textContent = message;
  toastTimer = window.setTimeout(hideToast, 5000);
}
function hideToast() {
  toast?.classList.remove('show');
}
toast?.querySelector('.toast-close')?.addEventListener('click', hideToast);

// ---------------------------------------------------------------- copy buttons
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!navigator.clipboard) {
      showToast('error', 'Clipboard is unavailable in this environment.');
      return;
    }
    navigator.clipboard.writeText(button.dataset.copy ?? '').then(
      () => showToast('success', `${button.dataset.label} copied to clipboard!`),
      () => showToast('error', 'Failed to copy. Please try manually.'),
    );
  });
});

// ---------------------------------------------------------------- form
const form = document.querySelector<HTMLFormElement>('#contact-form');

if (form) {
  type FieldName = 'name' | 'email' | 'subject' | 'message';
  const rules: Record<FieldName, { min?: number; email?: boolean; messages: Record<string, string> }> = {
    name: { min: 2, messages: { required: 'Name is required', min: 'Name must be at least 2 characters' } },
    email: { email: true, messages: { required: 'Email is required', email: 'Please enter a valid email' } },
    subject: { min: 4, messages: { required: 'Subject is required', min: 'Subject must be at least 4 characters' } },
    message: { min: 20, messages: { required: 'Message is required', min: 'Message must be at least 20 characters' } },
  };
  const names = Object.keys(rules) as FieldName[];

  const fields = Object.fromEntries(
    names.map((n) => [n, form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement]),
  ) as Record<FieldName, HTMLInputElement | HTMLTextAreaElement>;
  const honeypot = form.elements.namedItem('botcheck') as HTMLInputElement;
  const submitButton = form.querySelector<HTMLButtonElement>('.submit-btn')!;
  const submitLabel = submitButton.querySelector<HTMLElement>('.submit-label')!;
  const spinner = submitButton.querySelector<HTMLElement>('.spinner')!;
  const charCount = document.getElementById('char-count')!;
  const hint = form.querySelector<HTMLElement>('.turnstile-hint');

  const touched = new Set<FieldName>();
  let submitted = false;
  let submitting = false;
  let token: string | null = null;
  let widgetId: string | undefined;

  const fieldError = (name: FieldName): string | null => {
    const el = fields[name];
    const rule = rules[name];
    const value = el.value.trim();
    if (!value) return rule.messages['required'];
    if (rule.email && (el as HTMLInputElement).validity.typeMismatch) return rule.messages['email'];
    if (rule.min && value.length < rule.min) return rule.messages['min'];
    return null;
  };

  const renderField = (name: FieldName): string | null => {
    const el = fields[name];
    const error = fieldError(name);
    const visible = !!error && (submitted || touched.has(name));
    const box = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`)!;
    el.classList.toggle('invalid', visible);
    el.setAttribute('aria-invalid', String(visible));
    box.hidden = !visible;
    box.querySelector('span')!.textContent = visible ? error : '';
    return error;
  };

  const renderSubmit = () => {
    submitButton.disabled = submitting || !token;
    submitButton.classList.toggle('loading', submitting);
    submitLabel.hidden = submitting;
    spinner.hidden = !submitting;
    if (hint) hint.hidden = !!token;
  };

  const renderCount = () => {
    const length = fields.message.value.length;
    charCount.textContent = `${length}/500 characters`;
    charCount.classList.toggle('warning', length > 400);
  };

  for (const name of names) {
    fields[name].addEventListener('input', () => {
      touched.add(name);
      renderField(name);
      if (name === 'message') renderCount();
    });
    fields[name].addEventListener('blur', () => {
      touched.add(name);
      renderField(name);
    });
  }

  // ------------------------------------------------------------ Turnstile (lazy)
  let turnstileRequested = false;
  const loadTurnstile = () => {
    if (turnstileRequested) return;
    turnstileRequested = true;
    disarm();

    const mount = () => {
      const api = getTurnstile();
      const container = form.querySelector<HTMLElement>('[data-turnstile]');
      if (!api || !container) return;
      widgetId = api.render(container, {
        sitekey: contactConfig.turnstileSiteKey,
        theme: 'dark',
        appearance: 'always',
        callback: (value: string) => {
          token = value;
          renderSubmit();
        },
        'expired-callback': () => {
          token = null;
          renderSubmit();
        },
        'error-callback': () => {
          token = null;
          renderSubmit();
        },
      });
    };

    if (getTurnstile()) return mount();
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = mount;
    script.onerror = () => showToast('error', 'Could not load bot protection. Please refresh and try again.');
    document.head.appendChild(script);
  };

  // Load the (heavy, third-party) script only when the form nears the viewport or takes focus.
  let observer: IntersectionObserver | undefined;
  const disarm = () => {
    observer?.disconnect();
    form.removeEventListener('focusin', loadTurnstile);
  };
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadTurnstile();
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(form);
    form.addEventListener('focusin', loadTurnstile);
  } else {
    loadTurnstile();
  }

  // ------------------------------------------------------------ rate limit (client-side, best effort)
  const lastSubmit = (): number => {
    try {
      return Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
    } catch {
      return 0;
    }
  };
  const markSubmitted = () => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  // ------------------------------------------------------------ reset
  const resetForm = () => {
    form.reset();
    touched.clear();
    submitted = false;
    token = null;
    for (const name of names) renderField(name);
    renderCount();
    const api = getTurnstile();
    if (api && widgetId) {
      try {
        api.reset(widgetId);
      } catch {
        /* widget already gone */
      }
    }
    renderSubmit();
  };
  form.querySelector('.reset-btn')?.addEventListener('click', resetForm);

  // ------------------------------------------------------------ submit
  const clean = (value: string, max: number) => value.trim().slice(0, max);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitted = true;

    const invalid = names.filter((name) => renderField(name));
    if (invalid.length) {
      const first = fields[invalid[0]];
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first.focus({ preventScroll: true });
      return;
    }

    if (!token) {
      showToast('error', 'Please complete the bot verification before sending.');
      return;
    }
    if (honeypot.value) {
      showToast('error', 'Invalid submission.');
      return;
    }
    const wait = Math.ceil((contactConfig.rateLimitMs - (Date.now() - lastSubmit())) / 1000);
    if (lastSubmit() && wait > 0) {
      showToast('error', `Please wait ${wait}s before sending another message.`);
      return;
    }

    submitting = true;
    renderSubmit();
    try {
      const response = await fetch(contactConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: contactConfig.accessKey,
          from_name: contactConfig.fromName,
          subject: clean(fields.subject.value, 150),
          name: clean(fields.name.value, 100),
          email: clean(fields.email.value, 150),
          message: clean(fields.message.value, 5000),
          botcheck: '',
        }),
      });
      const data: { success?: boolean; message?: string } | null = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        markSubmitted();
        track('generate_lead', { method: 'contact_form' });
        submitting = false;
        showToast('success', data.message || "Your message has been sent! I'll get back to you soon.");
        resetForm();
        return;
      }

      let message = data?.message || 'Sorry, there was an error sending your message. Please try again.';
      if (response.status === 429) message = data?.message || 'Too many requests. Please try again later.';
      else if (response.status === 400) message = data?.message || 'Invalid submission.';
      showToast('error', message);
    } catch {
      showToast('error', 'Network error. Please check your connection and try again.');
    }

    // Failed: a Turnstile token is single-use, so ask for a fresh one.
    submitting = false;
    token = null;
    const api = getTurnstile();
    if (api && widgetId) {
      try {
        api.reset(widgetId);
      } catch {
        /* noop */
      }
    }
    renderSubmit();
  });

  renderCount();
  renderSubmit();
}
