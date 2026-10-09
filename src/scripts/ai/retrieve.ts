// Find the few chunks of the site that could answer a question: plain BM25 over the chunk text, with a short
// alias list for the way people phrase things ("SSO" is "OAuth / OIDC / federation" on this site). No model involved.
import type { KnowledgeChunk } from '../../lib/ai-knowledge';

const STOP = new Set(
  `a about an and any are as at be been by can could did do does for from get give has have he her him his how i if in into is it its
   me more my of on or our she should so some tell than that the their them there they this to up us was we were what when where
   which who whom why will with would you your`.split(/\s+/),
);

// query word -> related words that appear in the data
const ALIASES: Record<string, string[]> = {
  sso: ['oauth', 'oidc', 'federation', 'uae', 'pass', 'entra'],
  login: ['oauth', 'oidc', 'sso', 'identity'],
  auth: ['oauth', 'oidc', 'identity', 'authorization'],
  authentication: ['oauth', 'oidc', 'identity'],
  iam: ['identity', 'access', 'oauth'],
  identity: ['oauth', 'oidc', 'iam'],
  ai: ['mcp', 'agent', 'rag', 'airia'],
  llm: ['mcp', 'agent', 'rag'],
  chatbot: ['chatbot', 'airia', 'rag'],
  team: ['lead', 'mentor', 'engineers'],
  manage: ['lead', 'mentor'],
  leadership: ['lead', 'mentor', 'team'],
  website: ['site', 'seo', 'astro', 'quote'],
  websites: ['site', 'seo', 'astro', 'quote'],
  web: ['website', 'angular', 'asp.net'],
  frontend: ['angular', 'front-end'],
  backend: ['.net', 'asp.net', 'api'],
  cloud: ['azure'],
  database: ['sql', 'oracle'],
  remote: ['remotely', 'worldwide'],
  remotely: ['remote', 'worldwide'],
  based: ['location', 'sharjah', 'uae'],
  location: ['sharjah', 'uae'],
  hire: ['roles', 'open', 'availability'],
  hiring: ['roles', 'open', 'availability'],
  available: ['roles', 'open', 'availability'],
  availability: ['roles', 'open'],
  contact: ['touch', 'quote', 'form', 'whatsapp'],
  price: ['quote'],
  cost: ['quote'],
  pipeline: ['ci/cd', 'azure', 'devops', 'yaml'],
  cicd: ['ci/cd', 'azure', 'devops', 'pipelines'],
  testing: ['playwright', 'selenium', 'loadrunner'],
  mcp: ['model', 'context', 'protocol', 'agent'],
  oauth: ['oidc', 'jwt', 'identity', 'sso'],
  oidc: ['oauth', 'jwt', 'identity', 'sso'],
  jwt: ['oauth', 'oidc', 'identity'],
  angular: ['frontend', 'typescript', 'spa'],
  rag: ['retrieval', 'airia', 'agent'],
  sql: ['database', 'oracle'],
  site: ['website', 'work', 'overview'],
  sites: ['website', 'work', 'overview'],
  app: ['application', 'website', 'overview'],
  apps: ['application', 'website', 'overview'],
  built: ['build', 'overview'],
  portfolio: ['overview', 'work'],
  career: ['timeline', 'role'],
  history: ['timeline'],
  timeline: ['career', 'role'],
  summary: ['overview'],
  technology: ['overview', 'stack'],
  tech: ['technology', 'stack', 'overview'],
  stack: ['technology', 'overview'],
  most: ['overview'],
  many: ['overview'],
};

const NAME = new Set(['shakoor', 'attari', 'hussain']);

const stem = (word: string): string => {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

/**
 * Lower-case words, keeping the characters that matter in this domain (.net, c#, ci/cd, front-end). A hyphenated
 * compound is kept whole and also split, so "due diligence" finds "Due-Diligence".
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.#+/-]+/)
    .map((word) => word.replace(/^[-/]+|[-/.]+$/g, ''))
    .filter((word) => word.length > 1 && !STOP.has(word))
    .flatMap((word) => (word.includes('-') ? [word, ...word.split('-').filter((part) => part.length >= 4)] : [word]))
    .map(stem);
}

// Words that say little about a requirement on their own: "experience" is in half the site.
const GENERIC = new Set(
  `experience experienced knowledge strong good excellent proven ability skill skills year years working work ability
   understanding hands-on required essential desired preferred highly plus bonus responsible responsibility`.split(
    /\s+/,
  ),
);

export type Relation = 'direct' | 'related' | 'none';

/**
 * Does this chunk of the site actually speak to a requirement? "direct": it shares at least two of the requirement's
 * words, or most of a short one; "related": it shares only a word from the alias list (login -> OAuth); "none":
 * nothing, or a single shared word out of several. That last rule is deliberate: "Terraform modules" must not be backed
 * by "Lazy-Loading Modules". This is the check that stops a model from citing evidence that merely sounds close.
 */
export function relation(requirement: string, chunk: KnowledgeChunk): Relation {
  const terms = [...new Set(tokenize(requirement).filter((term) => !GENERIC.has(term)))];
  if (terms.length === 0) return 'none';
  const words = new Set(tokenize(`${chunk.title} ${chunk.text}`));
  const covered = terms.filter((term) => words.has(term)).length;
  if (covered >= 2 || covered / terms.length >= 0.75) return 'direct';
  const related = terms.flatMap((term) => (ALIASES[term] ?? []).flatMap(tokenize));
  return related.some((term) => words.has(term)) ? 'related' : 'none';
}

export interface Hit {
  chunk: KnowledgeChunk;
  score: number;
}

/** The best matches for `query`, highest first. A chunk must contain at least one word the visitor actually used. */
export function rank(chunks: KnowledgeChunk[], query: string, limit = 5, context = ''): Hit[] {
  let asked = [...new Set(tokenize(query))];
  // What the conversation was just about. A question with no searchable words of its own ("tell me more about that")
  // is looked up by it; a question with its own words only gets a little help from it, never a different topic.
  let remembered = [...new Set(tokenize(context))].filter((term) => !asked.includes(term));
  if (asked.length === 0) [asked, remembered] = [remembered, []];
  if (asked.length === 0 || chunks.length === 0) return [];

  // His name is in half the chunks, so it counts for little; "Who is Shakoor?" still finds the introduction.
  const weights = new Map<string, number>(asked.map((term) => [term, NAME.has(term) ? 0.25 : 1]));
  for (const term of remembered) weights.set(term, 0.3);
  for (const term of asked) {
    for (const alias of ALIASES[term] ?? [])
      for (const t of tokenize(alias)) weights.set(t, Math.max(weights.get(t) ?? 0, 0.5));
  }

  // The title counts twice: a chunk about "Identity, Security & IAM" should beat one that merely mentions it.
  const docs = chunks.map((chunk) => tokenize(`${chunk.title} ${chunk.title} ${chunk.text}`));
  const average = docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length;
  const documentFrequency = new Map<string, number>();
  for (const doc of docs)
    for (const term of new Set(doc)) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);

  const k1 = 1.2;
  const b = 0.75;
  const hits: Hit[] = [];
  docs.forEach((doc, i) => {
    const frequency = new Map<string, number>();
    for (const term of doc) frequency.set(term, (frequency.get(term) ?? 0) + 1);
    let score = 0;
    let usedAskedWord = false;
    for (const [term, weight] of weights) {
      const tf = frequency.get(term);
      if (!tf) continue;
      if (asked.includes(term)) usedAskedWord = true;
      const n = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      score += weight * idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / average)));
    }
    if (usedAskedWord && score > 0) hits.push({ chunk: chunks[i], score });
  });
  return hits.sort((a, c) => c.score - a.score).slice(0, limit);
}
