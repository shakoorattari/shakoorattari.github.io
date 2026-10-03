// Quote form: validation, then the same composed text goes to Web3Forms (email) or into a WhatsApp message.
import { clean, createToast, lazyTurnstile, rateLimit, sendToWeb3Forms, track, trackLeadClicks } from './form-kit';

const { show: showToast } = createToast(document.getElementById('quote-toast'));
trackLeadClicks();

const form = document.querySelector<HTMLFormElement>('#quote-form');

if (form) {
  type FieldName = 'name' | 'email' | 'phone' | 'project' | 'timeline' | 'budget' | 'message';
  type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const names: FieldName[] = ['name', 'email', 'phone', 'project', 'timeline', 'budget', 'message'];
  const fields = Object.fromEntries(names.map((n) => [n, form.elements.namedItem(n) as Field])) as Record<
    FieldName,
    Field
  >;

  const honeypot = form.elements.namedItem('botcheck') as HTMLInputElement;
  const submitButton = form.querySelector<HTMLButtonElement>('.submit-btn')!;
  const submitLabel = submitButton.querySelector<HTMLElement>('.submit-label')!;
  const spinner = submitButton.querySelector<HTMLElement>('.spinner')!;
  const charCount = document.getElementById('quote-char-count')!;
  const hint = form.querySelector<HTMLElement>('.turnstile-hint');
  const whatsapp = document.querySelector<HTMLAnchorElement>('[data-wa-compose]')!;
  const sent = document.getElementById('quote-sent')!;
  const sentWhatsapp = sent.querySelector<HTMLAnchorElement>('a[data-wa-sent]')!;
  const waBase = whatsapp.dataset.waBase!;
  const greeting = form.dataset.greeting ?? '';

  const touched = new Set<FieldName>();
  let submitted = false;
  let submitting = false;
  let token: string | null = null;

  // ------------------------------------------------------------ validation (phone, timeline and budget are optional)
  const fieldError = (name: FieldName): string | null => {
    const el = fields[name];
    const value = el.value.trim();
    switch (name) {
      case 'name':
        return !value ? 'Name is required' : value.length < 2 ? 'Name must be at least 2 characters' : null;
      case 'email':
        return !value
          ? 'Email is required'
          : (el as HTMLInputElement).validity.typeMismatch
            ? 'Please enter a valid email'
            : null;
      case 'phone':
        return value && value.replace(/\D/g, '').length < 7 ? 'Please enter a valid phone number' : null;
      case 'project':
        return value ? null : 'Please choose a project type';
      case 'message':
        return !value
          ? 'Please tell me about the project'
          : value.length < 20
            ? 'Please give a little more detail (at least 20 characters)'
            : null;
      default:
        return null;
    }
  };

  const renderField = (name: FieldName): string | null => {
    const el = fields[name];
    const error = fieldError(name);
    const visible = !!error && (submitted || touched.has(name));
    const box = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    el.classList.toggle('invalid', visible);
    el.setAttribute('aria-invalid', String(visible));
    if (box) {
      box.hidden = !visible;
      box.querySelector('span')!.textContent = visible ? error : '';
    }
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
    charCount.textContent = `${length}/800 characters`;
    charCount.classList.toggle('warning', length > 650);
  };

  // ------------------------------------------------------------ one text, two channels
  const compose = (): string => {
    const value = (name: FieldName, max: number) => clean(fields[name].value, max);
    const details: [string, string][] = [
      ['Name', value('name', 100)],
      ['Project', value('project', 100)],
      ['Timeline', value('timeline', 60)],
      ['Budget', value('budget', 60)],
      ['Email', value('email', 150)],
      ['Phone', value('phone', 40)],
    ];
    const filled = details.filter(([, text]) => text).map(([label, text]) => `${label}: ${text}`);
    const message = value('message', 800);
    return [greeting, ...(filled.length ? ['', ...filled] : []), ...(message ? ['', message] : [])].join('\n');
  };
  const whatsappHref = (text: string) => `${waBase}?text=${encodeURIComponent(text)}`;
  const syncWhatsapp = () => {
    whatsapp.href = whatsappHref(compose());
  };

  for (const name of names) {
    const el = fields[name];
    const onChange = () => {
      touched.add(name);
      renderField(name);
      if (name === 'message') renderCount();
      syncWhatsapp();
    };
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
    el.addEventListener('blur', () => {
      touched.add(name);
      renderField(name);
    });
  }

  // The form is near the top of /quote/, so it must not load Turnstile with the page: wait for the first interaction.
  const turnstile = lazyTurnstile(
    form,
    showToast,
    (value) => {
      token = value;
      renderSubmit();
    },
    { nearViewport: false },
  );

  const resetForm = () => {
    form.reset();
    touched.clear();
    submitted = false;
    token = null;
    for (const name of names) renderField(name);
    renderCount();
    syncWhatsapp();
    turnstile.reset();
    renderSubmit();
  };

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
      showToast('error', `Please wait ${wait}s before sending another request.`);
      return;
    }

    submitting = true;
    renderSubmit();
    const text = compose();
    const result = await sendToWeb3Forms(
      {
        from_name: 'Portfolio Quote Request',
        subject: clean(`Quote request: ${fields.project.value} (${fields.name.value})`, 150),
        name: clean(fields.name.value, 100),
        email: clean(fields.email.value, 150),
        message: text,
      },
      "Your request has been sent! I'll reply within 24 hours.",
    );

    if (result.ok) {
      rateLimit.mark();
      track('generate_lead', { method: 'quote_form' });
      submitting = false;
      showToast('success', result.message);
      // Keep the sent text one tap away on WhatsApp, then clear the form.
      sentWhatsapp.href = whatsappHref(text);
      sent.hidden = false;
      resetForm();
      sent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  syncWhatsapp();
}
