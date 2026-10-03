// Google Analytics 4 — strictly opt-in.
//
// - Google's script is requested only after the visitor clicks Accept (or accepted on an earlier visit).
//   Until then there are no Google requests, no cookies, and no data leaves the page.
// - Dormant on any hostname that isn't in `data-hosts` (so previews and local builds can't pollute the
//   property) and for visitors who send the Global Privacy Control signal.
// - Consent Mode v2: advertising signals stay denied permanently; Google signals and ad personalisation
//   are switched off in the config. Declining or withdrawing deletes the analytics cookies.
//
// The consent notice and the footer "Privacy choices" button are rendered by AnalyticsConsent.astro /
// Footer.astro only when a Measurement ID is configured. See docs/analytics.md.

type Choice = 'granted' | 'denied';

interface GtagFunction {
  (...args: unknown[]): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

const STORAGE_KEY = 'analytics-consent';
/** Ask again after a year, rather than treating an old answer as permanent. */
const CHOICE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
/** Analytics cookies live 13 months at most (the default is 2 years). */
const COOKIE_LIFETIME_SECONDS = 395 * 24 * 60 * 60;

const banner = document.getElementById('analytics-consent');
if (banner) start(banner);

function start(banner: HTMLElement): void {
  const measurementId = banner.dataset.gaId ?? '';
  const hosts = (banner.dataset.hosts ?? '').split(',');
  const settingsButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-consent-settings]'));

  const globalPrivacyControl =
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  const allowedHost = hosts.includes(location.hostname);

  const setDisabled = (disabled: boolean) => {
    // Google's documented kill switch: stops any measurement for this ID on the page.
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = disabled;
  };

  if (!measurementId || !allowedHost || globalPrivacyControl) {
    setDisabled(true);
    banner.remove();
    settingsButtons.forEach((button) => button.remove());
    if (globalPrivacyControl && allowedHost) clearAnalyticsCookies(); // honour it retroactively too
    return;
  }

  // ------------------------------------------------------------------ stored choice
  let choice: Choice | null = null;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { choice?: string; at?: number } | null;
    const fresh = typeof stored?.at === 'number' && Date.now() - stored.at < CHOICE_TTL_MS;
    if (fresh && (stored?.choice === 'granted' || stored?.choice === 'denied')) choice = stored.choice;
  } catch {
    /* storage unavailable or corrupt: behave as "no choice yet" */
  }

  const saveChoice = (value: Choice) => {
    choice = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: value, at: Date.now() }));
    } catch {
      /* the choice then lasts for this page view only */
    }
  };

  // ------------------------------------------------------------------ Google Analytics
  let loaded = false;

  const gtag = function () {
    // gtag.js expects the `arguments` object itself, not an array copy.
    window.dataLayer!.push(arguments);
  } as GtagFunction;

  const load = () => {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = gtag;

    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted', // this code only runs after the visitor accepted
    });
    gtag('js', new Date());
    gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: COOKIE_LIFETIME_SECONDS,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };

  const applyChoice = (value: Choice) => {
    saveChoice(value);
    if (value === 'granted') {
      setDisabled(false);
      if (loaded) gtag('consent', 'update', { analytics_storage: 'granted' });
      else load();
    } else {
      setDisabled(true);
      if (loaded) gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
  };

  // ------------------------------------------------------------------ notice
  let opener: HTMLElement | null = null;

  const show = (moveFocus: boolean) => {
    banner.hidden = false;
    if (moveFocus) banner.focus();
  };
  const hide = () => {
    banner.hidden = true;
    opener?.focus();
    opener = null;
  };

  banner.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((button) => {
    button.addEventListener('click', () => {
      applyChoice(button.dataset.consent === 'granted' ? 'granted' : 'denied');
      hide();
    });
  });
  settingsButtons.forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      show(true);
    });
  });

  // ------------------------------------------------------------------ start-up
  // Nothing happens before the page has loaded and the browser is idle, so none of this can slow it down.
  const whenIdle = (task: () => void) => {
    const run = () =>
      'requestIdleCallback' in window ? window.requestIdleCallback(task, { timeout: 2000 }) : setTimeout(task, 300);
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  };

  if (choice === 'granted') {
    setDisabled(false);
    whenIdle(load);
  } else if (choice === 'denied') {
    setDisabled(true);
    clearAnalyticsCookies(); // e.g. cookies left over from an earlier acceptance
  } else {
    setDisabled(true); // until the visitor decides
    whenIdle(() => show(false));
  }
}

/** Delete Google Analytics cookies (`_ga`, `_ga_<id>`, `_gid`, `_gat*`) on this host and its parent domains. */
function clearAnalyticsCookies(): void {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_') || name === '_gid' || name.startsWith('_gat'));

  const labels = location.hostname.split('.');
  const domains = ['', ...labels.map((_, index) => `.${labels.slice(index).join('.')}`)]; // '' = host-only cookie
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}; SameSite=Lax`;
    }
  }
}

export {};
