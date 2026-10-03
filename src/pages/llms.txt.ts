import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { services } from '../data/services';
import { caseStudies } from '../data/caseStudies';
import { work, hasPage } from '../data/work';
import { getPublishedPosts } from '../lib/blog';

// https://llmstxt.org — a plain-text map of the site for AI assistants and crawlers, kept in sync with the data files.
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const abs = (path: string) => new URL(path, site.url).href;
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    site.availability,
    '',
    '## Key pages',
    `- [Home](${abs('/')}): overview, experience, skills and contact`,
    `- [Services](${abs('/services/')}): what I can help with, for roles and projects`,
    `- [Work](${abs('/work/')}): websites and apps built for businesses`,
    `- [Request a quote](${abs('/quote/')}): send a project brief by form, WhatsApp or phone`,
    `- [Case studies](${abs('/projects/')}): architecture case studies`,
    '',
    '## Services',
    ...services.map((s) => `- [${s.name}](${abs(`/services/${s.slug}/`)}): ${s.blurb}`),
    '',
    '## Websites and apps',
    ...work.map((w) =>
      hasPage(w)
        ? `- [${w.name}](${abs(`/work/${w.slug}/`)}): ${w.metaDescription}`
        : `- [${w.name}](${w.repo}): ${w.blurb}`,
    ),
    '',
    '## Case studies',
    ...caseStudies.map((c) => `- [${c.title}](${abs(`/projects/${c.slug}/`)}): ${c.metaDescription}`),
  ];
  if (posts.length) {
    lines.push(
      '',
      '## Articles',
      ...posts.map((p) => `- [${p.data.title}](${abs(`/blog/${p.id}/`)}): ${p.data.description}`),
    );
  }
  lines.push(
    '',
    '## Contact',
    `- Email: ${site.email}`,
    `- LinkedIn: ${site.social.linkedin}`,
    `- GitHub: ${site.social.github}`,
    '',
  );
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
