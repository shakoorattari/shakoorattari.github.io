// Small, pure checks that keep the model's output honest. The model proposes; these decide what is shown.

/**
 * Parse the model's JSON, or null when it is not an object. A constrained reply is exactly JSON; one from a browser that
 * could not constrain it may come wrapped in a sentence or a code fence, so the outermost braces are tried too.
 */
export function parseObject(raw: string): Record<string, unknown> | null {
  const attempt = (text: string): Record<string, unknown> | null => {
    try {
      const value: unknown = JSON.parse(text);
      return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const whole = attempt(raw);
  if (whole) return whole;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  return start >= 0 && end > start ? attempt(raw.slice(start, end + 1)) : null;
}

export const isString = (value: unknown): value is string => typeof value === 'string';

/** A string array with only the entries that are strings and, when `allowed` is given, members of it. Order kept, duplicates dropped. */
export function stringList(value: unknown, allowed?: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) if (isString(item) && (!allowed || allowed.has(item))) seen.add(item);
  return [...seen];
}

/** Tidy a short model-written string for display: collapsed whitespace, no markdown emphasis, capped length. */
export function tidy(text: unknown, max: number): string {
  if (!isString(text)) return '';
  const clean = text
    .replace(/[*_`#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Cut text to at most `max` characters at a clean boundary (the last "; " or space), with an ellipsis. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max - 1);
  const cut = Math.max(head.lastIndexOf('; '), head.lastIndexOf(' '));
  const kept = cut > max * 0.5 ? head.slice(0, cut) : head;
  return `${kept.trimEnd().replace(/[;,]$/, '')}…`;
}

/**
 * Every number in an answer must be a whole number that appears in the notes it was built from (years, team sizes,
 * versions). A model that invents "12 years" or a price fails this, and the answer is replaced by the plain fallback.
 * Note ids such as [ex12] are ignored so they cannot vouch for a number, and "1" does not match inside "2018".
 */
export function numbersAreGrounded(answer: string, notes: string): boolean {
  const numbers = (text: string) => (text.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[.,]+$/, ''));
  const known = new Set(numbers(notes.replace(/\[[a-z]+\d+\]/g, ' ')));
  return numbers(answer).every((n) => known.has(n));
}

/** True when most letters are Arabic: the model only handles English here, so say so instead of guessing. */
export function isMostlyArabic(text: string): boolean {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  const arabic = text.match(/[؀-ۿݐ-ݿ]/g)?.length ?? 0;
  return letters > 0 && arabic / letters > 0.3;
}

export const ENGLISH_ONLY = 'On-device AI works in English only for now. Please write in English to use it.';
