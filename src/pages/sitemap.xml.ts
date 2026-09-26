import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { services } from '../data/services';
import { caseStudies } from '../data/caseStudies';
import { getPublishedPosts } from '../lib/blog';
import { lastModified } from '../lib/lastmod';

export const GET: APIRoute = async () => {
  const lastmod = lastModified();
  const posts = await getPublishedPosts();

  // Every indexable page, once. Drafts and outlines never appear; /blog/ only exists in the index once it has posts.
  const pages: { path: string; lastmod: string }[] = [
    { path: '/', lastmod },
    { path: '/services/', lastmod },
    ...services.map((s) => ({ path: `/services/${s.slug}/`, lastmod })),
    { path: '/projects/', lastmod },
    ...caseStudies.map((c) => ({ path: `/projects/${c.slug}/`, lastmod })),
    ...(posts.length
      ? [
          { path: '/blog/', lastmod: (posts[0].data.updated ?? posts[0].data.date).toISOString().slice(0, 10) },
          ...posts.map((p) => ({
            path: `/blog/${p.id}/`,
            lastmod: (p.data.updated ?? p.data.date).toISOString().slice(0, 10),
          })),
        ]
      : []),
  ];

  const urls = pages
    .map((page) => `  <url>\n    <loc>${site.url}${page.path}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
