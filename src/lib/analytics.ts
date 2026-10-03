import { site, tracking } from '../data/site';

/** GA4 web stream Measurement IDs look like "G-ABC123XYZ9". */
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,14}$/;

export interface AnalyticsConfig {
  /** Google Analytics 4: opt-in, loaded only after the visitor accepts. */
  ga: {
    enabled: boolean;
    measurementId: string;
    /** Hostnames allowed to send analytics. */
    hosts: string[];
  };
  /** Cloudflare Web Analytics: cookieless, loaded for everyone. */
  cloudflare: boolean;
}

/**
 * What analytics this build ships, resolved at build time.
 *
 * - Nothing is enabled in development (`astro dev`), so local work never reaches a real property.
 * - Google Analytics needs a valid Measurement ID. A value that is set but malformed fails the build
 *   instead of silently shipping no analytics.
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  const id = String(tracking.googleAnalyticsId ?? '').trim();
  if (id && !MEASUREMENT_ID.test(id)) {
    throw new Error(
      `PUBLIC_GA_MEASUREMENT_ID "${id}" is not a valid GA4 Measurement ID (expected "G-" followed by letters/digits, e.g. G-ABC123XYZ9). ` +
        'Copy it from Google Analytics → Admin → Data streams.',
    );
  }

  const siteHost = new URL(site.url).hostname;
  const configuredHosts = String(tracking.googleAnalyticsHosts ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  const production = import.meta.env.PROD;
  return {
    ga: {
      enabled: production && id !== '',
      measurementId: id,
      hosts: configuredHosts.length > 0 ? configuredHosts : [siteHost, `www.${siteHost}`],
    },
    cloudflare: production && String(tracking.cloudflareToken ?? '') !== '',
  };
}
