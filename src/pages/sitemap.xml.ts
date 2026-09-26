import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { lastModified } from '../lib/lastmod';

// Only the home page is indexable; /about, /skills, … are anchors on the same page.
const routes = [{ path: '/', changefreq: 'monthly', priority: '1.0' }];

export const GET: APIRoute = () => {
  const lastmod = lastModified();
  const urls = routes
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${site.url}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
