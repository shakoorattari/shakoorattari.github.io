// A tiny element builder. Strings become text nodes, never HTML, so anything the model (or the visitor) wrote
// cannot inject markup.
type Child = string | Node | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  for (const child of children) if (child) element.append(child);
  return element;
}

/** A link to a path on this site, or an https URL (opens in a new tab). Anything else becomes plain text. */
export function link(href: string, label: string): HTMLElement {
  if (href.startsWith('/')) return h('a', { href }, label);
  if (/^https:\/\//.test(href)) return h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  return h('span', {}, label);
}

/** Show a result and move focus to it, so screen-reader users land on the answer. */
export function reveal(output: HTMLElement): void {
  output.hidden = false;
  output.setAttribute('tabindex', '-1');
  output.focus({ preventScroll: false });
}
