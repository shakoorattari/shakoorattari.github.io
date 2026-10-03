// Theme: light, dark, or follow the system (the default). A choice is stored under "theme" as "light" or "dark"; no
// stored value means "system", where CSS alone decides (prefers-color-scheme) and <html> has no data-theme. The inline
// script in Base.astro applies a stored choice before first paint, so there is no flash; this file wires the button,
// keeps the browser's UI colour (<meta name="theme-color">) in step and follows the system while "system" is chosen.

type Pref = 'system' | 'light' | 'dark';

const KEY = 'theme';
const ORDER: Pref[] = ['system', 'light', 'dark'];
const NAME: Record<Pref, string> = { system: 'follows your device', light: 'light', dark: 'dark' };
const ACTION: Record<Pref, string> = { system: 'follow your device', light: 'light', dark: 'dark' };
// Keep in step with --gh-canvas in global.scss.
const COLOUR = { light: '#ffffff', dark: '#0d1117' };

const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const announcer = document.querySelector<HTMLElement>('[data-theme-status]');
const system = matchMedia('(prefers-color-scheme: dark)');

const read = (): Pref => {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
};
const write = (pref: Pref) => {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* storage unavailable: the choice lasts until the page closes */
  }
};

let pref = read();

function paint() {
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);

  // The browser's own UI (address bar on phones): an explicit choice overrides both media-specific tags.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const dark = pref === 'system' ? meta.media.includes('dark') : pref === 'dark';
    meta.content = dark ? COLOUR.dark : COLOUR.light;
  });

  if (!button) return;
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  const label = `Theme: ${NAME[pref]}. Switch to ${ACTION[next]}.`;
  button.dataset.pref = pref;
  button.setAttribute('aria-label', label);
  button.title = label;
}

button?.addEventListener('click', () => {
  pref = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
  write(pref);
  paint();
  if (announcer) announcer.textContent = `Theme: ${NAME[pref]}`;
});

// Another tab changed the choice, or the system theme flipped while "system" is chosen.
window.addEventListener('storage', (event) => {
  if (event.key !== KEY) return;
  pref = read();
  paint();
});
system.addEventListener('change', () => {
  if (pref === 'system') paint();
});

paint();
