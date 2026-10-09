// Quote brief helper: reads what the visitor typed in the project description and suggests the form's drop-downs
// plus the details that are still missing. The model can only choose from the form's own options (the same lists the
// form is built from), the visitor applies each suggestion with a click, and nothing is submitted.
import type { FeatureFactory } from '../feature';
import { quoteOptions } from '../../../data/quote';
import { h, reveal } from '../dom';
import { ENGLISH_ONLY, isMostlyArabic, isString, parseObject, stringList, tidy } from '../guard';
import { fitToContext, openPromptSession, promptStructured, reportFailure } from '../runtime';

type SelectName = 'project' | 'timeline' | 'budget';

const FIELDS: {
  name: SelectName;
  label: string;
  key: 'projectType' | 'timeline' | 'budget';
  options: readonly string[];
}[] = [
  { name: 'project', label: 'Project type', key: 'projectType', options: quoteOptions.projectTypes },
  { name: 'timeline', label: 'Timeline', key: 'timeline', options: quoteOptions.timelines },
  { name: 'budget', label: 'Budget', key: 'budget', options: quoteOptions.budgets },
];
const UNSPECIFIED = 'unspecified';

const SYSTEM = `You help a visitor fill in a quote request form for a web design and software engineering service in the UAE.
Read the visitor's description of their project and answer in JSON.
- projectType: the best match from the allowed list.
- timeline and budget: choose one only if the visitor states it (for example a deadline or an amount); otherwise answer "${UNSPECIFIED}". Never guess.
- missing: up to 4 short questions about details the developer would need that the description does not give, such as the current website address, the pages or features needed, languages, or a deadline. Do not ask for contact details and do not repeat what is already stated.
Write in English.`;

const schema = {
  type: 'object',
  properties: {
    projectType: { type: 'string', enum: [...quoteOptions.projectTypes] },
    timeline: { type: 'string', enum: [...quoteOptions.timelines, UNSPECIFIED] },
    budget: { type: 'string', enum: [...quoteOptions.budgets, UNSPECIFIED] },
    missing: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 120 } },
  },
  required: ['projectType', 'timeline', 'budget', 'missing'],
  additionalProperties: false,
};

const quote: FeatureFactory = (panel, ui) => {
  const form = document.getElementById('quote-form') as HTMLFormElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const output = panel.querySelector<HTMLElement>('[data-ai-output]')!;
  const suggestions = output.querySelector<HTMLElement>('[data-ai-suggestions]')!;
  const missing = output.querySelector<HTMLElement>('[data-ai-missing]')!;
  const missingBox = output.querySelector<HTMLElement>('[data-ai-missing-box]')!;
  let running = false;

  const select = (name: SelectName) => form.elements.namedItem(name) as HTMLSelectElement;

  // Setting a value from script fires no events, and the form's own validation and WhatsApp text listen for them.
  const apply = (name: SelectName, value: string) => {
    const control = select(name);
    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return {
    async handle() {
      if (running) return;
      const brief = message.value.trim();
      if (brief.length < 20) {
        ui.say('Write a few lines about the project in the box above first, then ask for suggestions.');
        message.focus();
        return;
      }
      if (isMostlyArabic(brief)) {
        ui.say(ENGLISH_ONLY);
        return;
      }

      running = true;
      const controller = new AbortController();
      ui.busy(true, () => controller.abort());
      try {
        const session = await openPromptSession(ui, { system: SYSTEM, signal: controller.signal });
        if (!session) return;
        try {
          ui.say('Reading your description…');
          const fitted = await fitToContext(session, brief);
          const raw = await promptStructured(
            session,
            `Project description:\n${fitted.text}`,
            schema,
            controller.signal,
          );
          const answer = parseObject(raw);
          if (!answer) {
            ui.say('The on-device model gave an answer that could not be read. Try again.', 'error');
            return;
          }

          // Only values that exist in the form can be suggested, and "unspecified" means "do not touch".
          const rows = FIELDS.flatMap((field) => {
            const value = answer[field.key];
            return isString(value) && field.options.includes(value) ? [{ field, value }] : [];
          });
          const questions = stringList(answer.missing)
            .map((q) => tidy(q, 120))
            .filter(Boolean)
            .slice(0, 4);

          suggestions.replaceChildren(
            ...rows.map(({ field, value }) => {
              const already = select(field.name).value === value;
              // The accessible name starts with the visible words (WCAG 2.5.3) and adds what they refer to.
              const name = (visible: string) => `${visible} ${field.label.toLowerCase()}: ${value}`;
              const button = h(
                'button',
                {
                  type: 'button',
                  class: 'btn secondary-btn ai-apply',
                  'aria-label': name(already ? 'Already set' : 'Use this'),
                },
                already ? 'Already set' : 'Use this',
              );
              if (already) button.setAttribute('aria-disabled', 'true');
              else
                button.addEventListener('click', () => {
                  apply(field.name, value);
                  button.textContent = 'Applied';
                  button.setAttribute('aria-label', name('Applied'));
                  button.setAttribute('aria-disabled', 'true');
                  ui.say(`${field.label} set to “${value}”. You can change it in the form.`);
                });
              return h(
                'li',
                {},
                h('span', { class: 'ai-field-name' }, field.label),
                h('span', { class: 'ai-value' }, value),
                button,
              );
            }),
          );
          missing.replaceChildren(...questions.map((q) => h('li', {}, q)));
          missingBox.hidden = questions.length === 0;
          reveal(output);
          ui.say(
            rows.length || questions.length
              ? 'Suggestions are ready. Nothing in the form has changed until you press “Use this”.'
              : 'No suggestions this time. The description may already say it all.',
          );
        } finally {
          session.destroy();
        }
      } catch (error) {
        reportFailure(ui, error);
      } finally {
        running = false;
        ui.busy(false);
      }
    },
  };
};

export default quote;
