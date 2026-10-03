import { expect, test, type Page } from '@playwright/test';
import { mockContactBackends } from './helpers';

// The theme follows the system by default; the header button cycles system -> light -> dark -> system.
// A stored choice is applied by an inline script before first paint (so there is no flash), and with none stored CSS
// alone decides. Colours below are the canvas colours from global.scss.

const DARK = 'rgb(13, 17, 23)';
const LIGHT = 'rgb(255, 255, 255)';

const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const colourScheme = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
const attribute = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));
const toggle = (page: Page) => page.locator('[data-theme-toggle]');
const themeColours = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content),
  );

test.describe('follows the system by default', () => {
  test.describe('dark system', () => {
    test.use({ colorScheme: 'dark' });

    test('dark page and dark native controls, with no data-theme and nothing stored', async ({ page }) => {
      await page.goto('/');
      expect(await background(page)).toBe(DARK);
      expect(await colourScheme(page)).toBe('dark');
      expect(await attribute(page)).toBeNull();
      expect(await stored(page)).toBeNull();
      await expect(toggle(page)).toHaveAttribute('data-pref', 'system');
    });
  });

  test.describe('light system', () => {
    test.use({ colorScheme: 'light' });

    test('light page and light native controls', async ({ page }) => {
      await page.goto('/');
      expect(await background(page)).toBe(LIGHT);
      expect(await colourScheme(page)).toBe('light');
      expect(await attribute(page)).toBeNull();
    });

    test('while "system" is chosen the page follows the system live, without a reload', async ({ page }) => {
      await page.goto('/');
      expect(await background(page)).toBe(LIGHT);
      await page.emulateMedia({ colorScheme: 'dark' });
      expect(await background(page)).toBe(DARK);
      await page.emulateMedia({ colorScheme: 'light' });
      expect(await background(page)).toBe(LIGHT);
    });
  });
});

test.describe('the theme button', () => {
  test.use({ colorScheme: 'dark' });

  test('cycles system, light, dark, system; stores the choice, labels itself and announces it', async ({ page }) => {
    await page.goto('/');
    const live = page.locator('[data-theme-status]');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Theme: follows your device. Switch to light.');

    await toggle(page).click();
    expect(await attribute(page)).toBe('light');
    expect(await stored(page)).toBe('light');
    expect(await background(page)).toBe(LIGHT);
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Theme: light. Switch to dark.');
    await expect(live).toHaveText('Theme: light');

    await toggle(page).click();
    expect(await attribute(page)).toBe('dark');
    expect(await stored(page)).toBe('dark');
    expect(await background(page)).toBe(DARK);
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Theme: dark. Switch to follow your device.');

    await toggle(page).click();
    expect(await attribute(page)).toBeNull();
    expect(await stored(page)).toBeNull(); // back to following the system, not a stored "dark"
    await expect(toggle(page)).toHaveAttribute('data-pref', 'system');
    await expect(live).toHaveText('Theme: follows your device');
  });

  test('the icon shows the current choice, and only one icon at a time', async ({ page }) => {
    await page.goto('/');
    const visible = () =>
      page
        .locator('.theme-toggle .theme-icon')
        .evaluateAll((icons) =>
          icons
            .filter((icon) => getComputedStyle(icon).display !== 'none')
            .map((icon) => [...icon.classList].find((name) => name.startsWith('theme-icon-'))),
        );
    expect(await visible()).toEqual(['theme-icon-system']);
    await toggle(page).click();
    expect(await visible()).toEqual(['theme-icon-light']);
    await toggle(page).click();
    expect(await visible()).toEqual(['theme-icon-dark']);
  });

  test('is keyboard-operable and has a visible focus ring', async ({ page }) => {
    await page.goto('/');
    await toggle(page).focus();
    await page.keyboard.press('Enter');
    expect(await attribute(page)).toBe('light');
    await page.keyboard.press('Space');
    expect(await attribute(page)).toBe('dark');
    const outline = await toggle(page).evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('the browser UI colour (theme-color) follows an explicit choice, and goes back to the system', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await themeColours(page)).toEqual(['#ffffff', '#0d1117']); // light-media tag, dark-media tag
    await toggle(page).click(); // light
    expect(await themeColours(page)).toEqual(['#ffffff', '#ffffff']);
    await toggle(page).click(); // dark
    expect(await themeColours(page)).toEqual(['#0d1117', '#0d1117']);
    await toggle(page).click(); // system
    expect(await themeColours(page)).toEqual(['#ffffff', '#0d1117']);
  });

  test('Turnstile renders in the page theme', async ({ page }) => {
    await mockContactBackends(page);
    await page.goto('/quote/');
    await toggle(page).click(); // light, on a dark system
    await page.locator('#q-name').focus();
    await expect(page.locator('#quote-form .submit-btn')).toBeEnabled();
    expect(await page.evaluate(() => (window as unknown as { __tsOptions: { theme: string } }).__tsOptions.theme)).toBe(
      'light',
    );
  });
});

test.describe('an explicit choice', () => {
  test.use({ colorScheme: 'dark' });

  test('beats the system, survives a reload and carries across pages', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click(); // light
    await page.reload();
    expect(await attribute(page)).toBe('light');
    expect(await background(page)).toBe(LIGHT);
    await page.goto('/services/');
    expect(await background(page)).toBe(LIGHT);
    await expect(toggle(page)).toHaveAttribute('data-pref', 'light');
  });

  test('is applied before the body exists, by the inline script in <head> (no flash)', async ({ page }) => {
    // Record the theme at the moment <body> is created. Bundled scripts (theme.ts) run after parsing, so only the
    // inline script in <head> can have set it by then.
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      new MutationObserver((_records, observer) => {
        if (!document.body) return;
        (window as unknown as { __themeAtBody: string | null }).__themeAtBody =
          document.documentElement.getAttribute('data-theme');
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true }); // <html> may not exist yet
    });
    await page.goto('/');
    expect(await page.evaluate(() => (window as unknown as { __themeAtBody: string | null }).__themeAtBody)).toBe(
      'light',
    );
    expect(await background(page)).toBe(LIGHT);
  });

  test('ignores a junk stored value and falls back to the system', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'purple'));
    await page.goto('/');
    expect(await attribute(page)).toBeNull();
    expect(await background(page)).toBe(DARK);
    await expect(toggle(page)).toHaveAttribute('data-pref', 'system');
  });

  test('still works when storage is unavailable (the choice lasts for the page)', async ({ page }) => {
    await page.addInitScript(() => {
      const fail = () => {
        throw new Error('storage blocked');
      };
      Storage.prototype.getItem = fail;
      Storage.prototype.setItem = fail;
      Storage.prototype.removeItem = fail;
    });
    await page.goto('/');
    expect(await background(page)).toBe(DARK);
    await toggle(page).click();
    expect(await attribute(page)).toBe('light');
    expect(await background(page)).toBe(LIGHT);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'dark' });

  test('the system theme still applies and the (useless) button is hidden', async ({ page }) => {
    await page.goto('/');
    expect(await background(page)).toBe(DARK);
    await expect(toggle(page)).toBeHidden();
  });
});

// ---------------------------------------------------------------------------------------------------------
// Lighthouse audits each theme on a handful of pages; this guards the tokens themselves, for both themes at once.
// A text colour must reach 4.5:1 (WCAG AA) on every surface it is used on, including its own tinted background.
type Rgb = [number, number, number];
// The build minifies CSS, so a token can arrive as #rgb, #rrggbb, #rrggbbaa or rgba(...).
const parse = (value: string): { rgb: Rgb; alpha: number } => {
  const v = value.trim();
  if (v.startsWith('#')) {
    let hex = v.slice(1);
    if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('');
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return { rgb: [n(0), n(2), n(4)], alpha: hex.length === 8 ? n(6) / 255 : 1 };
  }
  const [r, g, b, a = '1'] = v
    .replace(/rgba?\(|\)/g, '')
    .split(',')
    .map((part) => part.trim());
  return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(a) };
};
const over = (top: { rgb: Rgb; alpha: number }, bottom: Rgb): Rgb =>
  top.rgb.map((c, i) => Math.round(c * top.alpha + bottom[i] * (1 - top.alpha))) as Rgb;
const luminance = ([r, g, b]: Rgb) => {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TOKENS = [
  'canvas',
  'canvas-subtle',
  'canvas-overlay',
  'canvas-elevated',
  'fg-default',
  'fg-muted',
  'fg-subtle',
  'fg-onEmphasis',
  'accent-fg',
  'accent-text',
  'accent-emphasis',
  'accent-emphasis-hover',
  'success-fg',
  'success-subtle',
  'danger-fg',
  'danger-subtle',
  'attention-fg',
  'chip-fg',
  'chip-bg',
  'purple-fg',
  'purple-subtle',
];

for (const scheme of ['light', 'dark'] as const) {
  test(`${scheme} theme: every text colour reaches 4.5:1 on the surfaces it is used on`, async ({ page }) => {
    await page.goto('/');
    const values = await page.evaluate(
      ([theme, names]) => {
        document.documentElement.setAttribute('data-theme', theme);
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--gh-${n}`).trim()]));
      },
      [scheme, TOKENS] as const,
    );
    const token = (name: string) => parse(values[name]);
    const solid = (name: string) => token(name).rgb;

    const surfaces = ['canvas', 'canvas-subtle'] as const;
    const failures: string[] = [];
    const check = (label: string, foreground: Rgb, background: Rgb) => {
      const ratio = contrast(foreground, background);
      if (!(ratio >= 4.5)) failures.push(`${label}: ${ratio.toFixed(2)}:1`);
    };

    for (const s of surfaces) {
      for (const t of [
        'fg-default',
        'fg-muted',
        'fg-subtle',
        'accent-fg',
        'accent-text',
        'success-fg',
        'danger-fg',
        'attention-fg',
      ])
        check(`${t} on ${s}`, solid(t), solid(s));
      // each coloured text on its own tint, drawn over the surface
      for (const [fg, tint] of [
        ['chip-fg', 'chip-bg'],
        ['purple-fg', 'purple-subtle'],
        ['success-fg', 'success-subtle'],
        ['danger-fg', 'danger-subtle'],
      ])
        check(`${fg} on ${tint} over ${s}`, solid(fg), over(token(tint), solid(s)));
    }
    for (const s of ['canvas-overlay', 'canvas-elevated'] as const) {
      for (const t of ['fg-default', 'fg-muted', 'accent-text']) check(`${t} on ${s}`, solid(t), solid(s));
    }
    // white text on the filled blue (buttons and the nav's quote button), at rest and on hover
    for (const bg of ['accent-emphasis', 'accent-emphasis-hover'])
      check(`fg-onEmphasis on ${bg}`, solid('fg-onEmphasis'), solid(bg));

    expect(failures, `${scheme} theme:\n${failures.join('\n')}`).toEqual([]);
  });
}
