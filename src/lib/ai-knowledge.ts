// The text the on-device AI features may use, built from the same data files as the pages and llms.txt so it
// cannot drift from the site. It is served at /ai/knowledge.json and fetched only when someone uses an AI panel.
//
// Rules: public site content only (no phone number or email, nothing the pages do not already say), and one
// self-contained fact per chunk so an answer can point at exactly where it came from.
import { site } from '../data/site';
import { aboutSummary, professionalHighlights } from '../data/about';
import { skillCategories } from '../data/skills';
import { jobs } from '../data/experience';
import { caseStudies } from '../data/caseStudies';
import { services } from '../data/services';
import { work, hasPage } from '../data/work';

export type ChunkKind =
  'about' | 'highlight' | 'skill' | 'job' | 'experience' | 'project' | 'case-study' | 'service' | 'work' | 'insight';

export interface KnowledgeChunk {
  /** Short and unique, e.g. "sk3". The model refers to chunks by this id. */
  id: string;
  kind: ChunkKind;
  title: string;
  text: string;
  /** Where the visitor can read it: a path on this site, or an https URL for a repository-only card. */
  href: string;
}

export interface Knowledge {
  version: 1;
  chunks: KnowledgeChunk[];
}

const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

export function buildKnowledge(): Knowledge {
  const chunks: KnowledgeChunk[] = [];
  const counts = new Map<string, number>();
  const add = (kind: ChunkKind, prefix: string, title: string, text: string, href: string) => {
    const n = (counts.get(prefix) ?? 0) + 1;
    counts.set(prefix, n);
    chunks.push({ id: `${prefix}${n}`, kind, title: flat(title), text: flat(text), href });
  };

  // ---- who, where, how to reach
  add('about', 'ab', 'Who Shakoor is', aboutSummary, '/#about');
  add('about', 'ab', 'Location and availability', `Based in ${site.locationLabel}. ${site.availability}`, '/services/');
  add(
    'about',
    'ab',
    'Team for larger projects',
    `For larger website and application projects Shakoor works with ${site.team}.`,
    '/services/',
  );
  add(
    'about',
    'ab',
    'How to get in touch',
    'There is a contact form on the home page. For a website or app project there is a quote page with a form, a WhatsApp button and a call button.',
    '/quote/',
  );
  for (const item of professionalHighlights) add('highlight', 'hl', 'Professional highlight', item, '/#about');

  // ---- skills: one chunk per category, listing its skills
  for (const category of skillCategories) {
    add('skill', 'sk', category.title, category.skills.join('; '), '/#skills');
  }

  // ---- experience
  for (const job of jobs) {
    add(
      'job',
      'jb',
      `${job.title}, ${job.company} (${job.period})`,
      `${job.summary} Technologies: ${job.technologies.join(', ')}.`,
      '/#experience',
    );
    for (const category of job.categories) {
      for (const highlight of category.highlights) {
        add('experience', 'ex', `${category.title} (${job.company})`, highlight, '/#experience');
      }
    }
    for (const project of job.projects) {
      add(
        'project',
        'pj',
        `${project.name} (${project.period})`,
        `Role: ${project.role}. Stack: ${project.stack.join(', ')}. ${project.highlights.join(' ')}`,
        '/#experience',
      );
    }
  }

  // ---- case studies, services, work
  for (const study of caseStudies) {
    add(
      'case-study',
      'cs',
      study.title,
      `Challenge: ${study.challenge} Architecture: ${study.architecture} Impact: ${study.impact}`,
      `/projects/${study.slug}/`,
    );
  }
  for (const service of services) {
    add(
      'service',
      'sv',
      service.name,
      `${service.blurb} Delivers: ${service.deliver.map((d) => d.title).join('; ')}. Stack: ${service.stack.join(', ')}.`,
      `/services/${service.slug}/`,
    );
  }
  for (const item of work) {
    const own = item.kind === 'project' ? 'Own project (not client work). ' : '';
    if (hasPage(item)) {
      add(
        'work',
        'wk',
        `${item.name}: ${item.label}`,
        `${own}${item.blurb} Goal: ${item.goal} Stack: ${item.stack.join(', ')}. Built: ${item.built.map((b) => b.title).join('; ')}.${item.scope ? ` Scope: ${item.scope}` : ''}`,
        `/work/${item.slug}/`,
      );
    } else {
      add('work', 'wk', `${item.name}: ${item.label}`, `${own}${item.blurb}`, item.repo);
    }
  }

  // ---- insights: overviews and counts computed from the data above, so questions about "all" or "most" have an
  // answer that is stated in the notes (and so passes the check that every number must appear in them).
  const tally = (lists: string[][], top: number) => {
    const counts = new Map<string, number>();
    for (const list of lists) for (const name of new Set(list)) counts.set(name, (counts.get(name) ?? 0) + 1);
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, top)
      .map(([name, n]) => `${name} (${n})`)
      .join(', ');
  };
  const family = (tech: string) => (tech.startsWith('.NET') ? '.NET' : tech.replace(/[\s\d.–-]+$/, ''));

  const clients = work.filter((item) => item.kind === 'client');
  const own = work.filter((item) => item.kind === 'project');
  add(
    'insight',
    'in',
    'Websites and apps built (overview)',
    `${work.length} websites and apps in total: ${clients.length} built for clients and ${own.length} own projects. ` +
      work
        .map((item) => `${item.name} (${item.kind === 'client' ? 'client work' : 'own project'}; ${item.label})`)
        .join('; ') +
      '.',
    '/work/',
  );
  const pages = work.filter(hasPage);
  add(
    'insight',
    'in',
    'Technologies across the websites and apps (overview)',
    `Technologies used across the ${pages.length} websites and apps that have their own page, with how many of them use each: ${tally(
      pages.map((item) => item.stack),
      10,
    )}.`,
    '/work/',
  );

  const allProjects = jobs.flatMap((job) => job.projects);
  add(
    'insight',
    'in',
    'Enterprise projects delivered (overview)',
    `${allProjects.length} enterprise projects are listed in the experience section: ${allProjects
      .map((project) => `${project.name} (${project.period})`)
      .join('; ')}.`,
    '/#experience',
  );
  add(
    'insight',
    'in',
    'Technologies across the enterprise projects (overview)',
    `Technologies used across the ${allProjects.length} enterprise projects, with how many of them use each: ${tally(
      allProjects.map((project) => project.stack.map(family)),
      12,
    )}.`,
    '/#experience',
  );
  add(
    'insight',
    'in',
    'Career timeline (overview)',
    jobs.map((job) => `${job.period}: ${job.title} at ${job.company}`).join('; ') + '.',
    '/#experience',
  );
  add(
    'insight',
    'in',
    'Skills (overview)',
    `${skillCategories.length} skill areas: ${skillCategories.map((c) => `${c.title} (${c.skills.length} skills)`).join('; ')}.`,
    '/#skills',
  );
  add(
    'insight',
    'in',
    'Services and case studies (overview)',
    `${services.length} services: ${services.map((service) => service.name).join('; ')}. ${caseStudies.length} case studies: ${caseStudies
      .map((study) => study.title)
      .join('; ')}.`,
    '/services/',
  );

  return { version: 1, chunks };
}
