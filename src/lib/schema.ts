import { site } from '../data/site';

/**
 * schema.org references reused by every page. The full Person and WebSite nodes live in the home page's
 * graph; other pages carry these self-describing references (type + @id + name + url) so each page can be
 * understood on its own, while the shared @id still ties them to the same entity.
 */
export const personRef = {
  '@type': 'Person',
  '@id': `${site.url}/#person`,
  name: site.name,
  url: `${site.url}/`,
} as const;

export const websiteRef = {
  '@type': 'WebSite',
  '@id': `${site.url}/#website`,
  name: site.siteName,
  url: `${site.url}/`,
} as const;
