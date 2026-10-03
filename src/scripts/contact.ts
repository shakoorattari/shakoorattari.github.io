// Contact form: validation and submission. Toast, Turnstile, rate limit and delivery are shared (form-kit.ts).
import {
  bindCopyButtons,
  clean,
  createToast,
  lazyTurnstile,
  rateLimit,
  sendToWeb3Forms,
  track,
  trackLeadClicks,
} from './form-kit';

const { show: showToast } = createToast(document.getElementById('contact-toast'));
bindCopyButtons(showToast);
trackLeadClicks();

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

  const turnstile = lazyTurnstile(form, showToast, (value) => {
    token = value;
    renderSubmit();
  });

  // ------------------------------------------------------------ reset
  const resetForm = () => {
    form.reset();
    touched.clear();
    submitted = false;
    token = null;
    for (const name of names) renderField(name);
    renderCount();
    turnstile.reset();
    renderSubmit();
  };
  form.querySelector('.reset-btn')?.addEventListener('click', resetForm);

  // ------------------------------------------------------------ submit
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
    const wait = rateLimit.waitSeconds();
    if (wait > 0) {
      showToast('error', `Please wait ${wait}s before sending another message.`);
      return;
    }

    submitting = true;
    renderSubmit();
    const result = await sendToWeb3Forms(
      {
        subject: clean(fields.subject.value, 150),
        name: clean(fields.name.value, 100),
        email: clean(fields.email.value, 150),
        message: clean(fields.message.value, 5000),
      },
      "Your message has been sent! I'll get back to you soon.",
    );

    if (result.ok) {
      rateLimit.mark();
      track('generate_lead', { method: 'contact_form' });
      submitting = false;
      showToast('success', result.message);
      resetForm();
      return;
    }
    showToast('error', result.message);

    // Failed: a Turnstile token is single-use, so ask for a fresh one.
    submitting = false;
    token = null;
    turnstile.reset();
    renderSubmit();
  });

  renderCount();
  renderSubmit();
}
