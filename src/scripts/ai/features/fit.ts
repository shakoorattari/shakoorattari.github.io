// Job-fit check for recruiters: paste a job description, see which of its requirements the site gives evidence for.
//
// The model only extracts the requirements and points at catalog ids. What is shown as evidence is the site's own
// text for those ids; an id that does not exist is dropped, and a "strong" or "partial" claim with no valid evidence
// is turned into "not found". The counts are computed here, not by the model. The job description never leaves the
// browser.
import type { KnowledgeChunk } from '../../../lib/ai-knowledge';
import type { FeatureFactory } from '../feature';
import { h, link, reveal } from '../dom';
import { ENGLISH_ONLY, clip, isMostlyArabic, parseObject, stringList, tidy } from '../guard';
import { loadKnowledge } from '../knowledge';
import { rank, relation } from '../retrieve';
import { fitToContext, openPromptSession, reportFailure } from '../runtime';

type Match = 'strong' | 'partial' | 'none';
interface Row {
  requirement: string;
  match: Match;
  evidence: KnowledgeChunk[];
}

/** What counts as evidence: skills, highlights, roles, case studies and apps built. */
const EVIDENCE = new Set(['skill', 'highlight', 'job', 'case-study', 'work']);
const MIN_LENGTH = 80;

const SYSTEM = `You compare a job description with a catalog of evidence about one software engineer.
Use only the catalog. Never use outside knowledge about the engineer and never assume a skill that the catalog does not show.
List up to 8 of the most important requirements in the job description, each in 12 words or fewer, in the job description's own terms. For each, set match to:
- "strong" when the catalog names the same technology or responsibility,
- "partial" when the catalog shows closely related experience,
- "none" when the catalog shows nothing relevant.
evidence holds the ids of the catalog entries that support the match (at most 3) and is empty for "none".`;

const LABEL: Record<Match, string> = {
  strong: 'Strong evidence',
  partial: 'Partial evidence',
  none: 'Not found on this site',
};

const fit: FeatureFactory = (panel, ui) => {
  const input = panel.querySelector<HTMLTextAreaElement>('[data-ai-input]')!;
  const output = panel.querySelector<HTMLElement>('[data-ai-output]')!;
  const summary = output.querySelector<HTMLElement>('[data-ai-summary]')!;
  const list = output.querySelector<HTMLElement>('[data-ai-list]')!;
  let running = false;

  return {
    async handle() {
      if (running) return;
      const description = input.value
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (description.length < MIN_LENGTH) {
        ui.say('Paste the job description first (at least a few lines).');
        input.focus();
        return;
      }
      if (isMostlyArabic(description)) {
        ui.say(ENGLISH_ONLY);
        return;
      }

      running = true;
      const controller = new AbortController();
      ui.busy(true, () => controller.abort());
      try {
        ui.say('Loading what the site says…');
        const catalog = (await loadKnowledge()).filter((chunk) => EVIDENCE.has(chunk.kind));
        const byId = new Map(catalog.map((chunk) => [chunk.id, chunk]));
        const ids = new Set(byId.keys());
        const lines = catalog.map((chunk) => `[${chunk.id}] ${chunk.title}: ${clip(chunk.text, 240)}`).join('\n');
        const promptFor = (jd: string) => `Catalog:\n${lines}\n\nJob description:\n${jd}`;

        const schema = {
          type: 'object',
          properties: {
            requirements: {
              type: 'array',
              maxItems: 8,
              items: {
                type: 'object',
                properties: {
                  requirement: { type: 'string', maxLength: 140 },
                  match: { type: 'string', enum: ['strong', 'partial', 'none'] },
                  evidence: { type: 'array', maxItems: 3, items: { type: 'string', enum: [...ids] } },
                },
                required: ['requirement', 'match', 'evidence'],
                additionalProperties: false,
              },
            },
          },
          required: ['requirements'],
          additionalProperties: false,
        };

        const session = await openPromptSession(ui, { system: SYSTEM, signal: controller.signal });
        if (!session) return;
        try {
          ui.say('Comparing the job description with the site…');
          const fitted = await fitToContext(session, description, promptFor, 900);
          const raw = await session.prompt(promptFor(fitted.text), {
            responseConstraint: schema,
            signal: controller.signal,
          });
          const answer = parseObject(raw);
          const items = answer && Array.isArray(answer.requirements) ? answer.requirements : null;
          if (!items) {
            ui.say('The on-device model gave an answer that could not be read. Try again.', 'error');
            return;
          }

          const rows: Row[] = items.slice(0, 8).flatMap((item): Row[] => {
            if (!item || typeof item !== 'object') return [];
            const entry = item as Record<string, unknown>;
            const requirement = tidy(entry.requirement, 140);
            if (!requirement) return [];
            const claimed: Match = entry.match === 'strong' || entry.match === 'partial' ? entry.match : 'none';
            if (claimed === 'none') return [{ requirement, match: 'none', evidence: [] }];

            // A small model cites evidence that merely sounds close. Keep a citation only if the site's text really
            // shares a word with the requirement; if none survives, look the requirement up in the site directly.
            const cited = stringList(entry.evidence, ids)
              .slice(0, 3)
              .map((id) => byId.get(id)!)
              .filter((chunk) => relation(requirement, chunk) !== 'none');
            const evidence =
              cited.length > 0
                ? cited
                : rank(catalog, requirement, 3)
                    .map((hit) => hit.chunk)
                    .filter((chunk) => relation(requirement, chunk) === 'direct')
                    .slice(0, 2);
            if (evidence.length === 0) return [{ requirement, match: 'none', evidence: [] }];
            // "Strong" needs the site to use the requirement's own words; anything looser is "partial".
            const direct = evidence.some((chunk) => relation(requirement, chunk) === 'direct');
            return [{ requirement, match: claimed === 'strong' && direct ? 'strong' : 'partial', evidence }];
          });
          if (rows.length === 0) {
            ui.say(
              'No requirements could be read from that text. Paste the responsibilities and requirements section.',
              'error',
            );
            return;
          }

          const count = (match: Match) => rows.filter((row) => row.match === match).length;
          summary.textContent =
            `${count('strong')} of ${rows.length} requirements have strong evidence on this site, ` +
            `${count('partial')} partial, ${count('none')} not found.`;
          list.replaceChildren(
            ...rows.map((row) =>
              h(
                'li',
                { class: 'ai-row' },
                h('p', { class: 'ai-requirement' }, row.requirement),
                h('span', { class: `ai-chip ai-${row.match}` }, LABEL[row.match]),
                row.evidence.length > 0 &&
                  h(
                    'ul',
                    { class: 'ai-evidence' },
                    ...row.evidence.map((chunk) =>
                      h('li', {}, link(chunk.href, chunk.title), h('span', {}, ` ${clip(chunk.text, 150)}`)),
                    ),
                  ),
              ),
            ),
          );
          reveal(output);
          ui.say(
            fitted.trimmed
              ? 'Done. Only the first part of a long job description was used.'
              : 'Done. Read the linked evidence before relying on a result.',
          );
        } finally {
          session.destroy();
        }
      } catch (error) {
        reportFailure(ui, error);
      } finally {
        running = false;
        ui.busy(false);
      }
    },
  };
};

export default fit;
