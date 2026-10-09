// One answer for the chat: retrieval first, then the model, then the checks. Used by the home-page chat and the
// "Ask AI" window, which differ only in where they are drawn.
//
// 1. The question is matched against the site's own content (retrieve.ts), no model involved. With no match, the visitor
//    gets the fixed fallback straight away and nothing is downloaded or run.
// 2. Otherwise the model sees only the few matching notes (and the last two answers, as context for "tell me more")
//    and must reply in a fixed JSON shape.
// 3. The reply is shown only if it claims to be grounded, cites notes it was actually given, and every number in it
//    appears in those notes. Anything else becomes the fallback. Sources are rendered from the site's data, not from the
//    model's words.
import type { KnowledgeChunk } from '../../lib/ai-knowledge';
import type { PanelUi } from './ui';
import { clip, numbersAreGrounded, parseObject, stringList, tidy } from './guard';
import { rank, tokenize } from './retrieve';
import { fitToContext, openPromptSession } from './runtime';

export interface Turn {
  question: string;
  /** Only answers that passed the checks are kept. */
  answer: string;
  /** Titles of the sections it was based on: what "tell me more about that" refers to. */
  topics: string;
}

export interface Reply {
  grounded: boolean;
  text: string;
  /** The sections the answer is based on, or for a fallback the closest ones. */
  sources: KnowledgeChunk[];
}

export const FALLBACK = 'This site does not say. Try one of the example questions, or get in touch and ask directly.';

const SYSTEM = `You are the assistant on the portfolio website of the software engineer Shakoor Hussain Attari. You answer visitors' questions about his work, websites, projects, skills and experience.
Use only the numbered notes you are given. They are written by Shakoor in the first person; answer in the third person.
You may count, list or compare items that appear in the notes. Earlier turns are context for what a question refers to, never a source of facts.
If the notes do not answer the question, set answerable to false.
Answer in at most four plain sentences. Do not add numbers, names, employers or technologies that are not in the notes. Never state salary, rates, availability dates or personal details.
sources holds the ids of the notes you used.`;

// "Tell me more about that", "and the second one?": the question alone says too little to look up, so the sections the
// last answer was based on are searched too (see rank).
const ANAPHORA =
  /\b(it|its|that|those|these|them|they|more|else|also|another|other|same|first|second|third|last|previous)\b/i;
const needsContext = (question: string) => tokenize(question).length === 0 || ANAPHORA.test(question);

export async function respond(
  ui: PanelUi,
  chunks: KnowledgeChunk[],
  question: string,
  history: Turn[],
  signal: AbortSignal,
): Promise<Reply | null> {
  const previous = history.at(-1);
  const hits = rank(chunks, question, 5, previous && needsContext(question) ? previous.topics : '');
  if (hits.length === 0) return { grounded: false, text: FALLBACK, sources: [] };

  const session = await openPromptSession(ui, { system: SYSTEM, signal });
  if (!session) return null;
  try {
    ui.say('Writing an answer from those sections…');
    const earlier = history
      .slice(-2)
      .map((turn) => `Q: ${turn.question}\nA: ${clip(turn.answer, 300)}`)
      .join('\n');
    const promptFor = (notes: string) =>
      `${earlier ? `Earlier in this conversation (context only):\n${earlier}\n\n` : ''}Notes:\n${notes}\n\nQuestion: ${question}`;
    const notesFull = hits
      .map(({ chunk }) => `[${chunk.id}] ${chunk.title}: ${clip(chunk.text, chunk.kind === 'insight' ? 900 : 650)}`)
      .join('\n');
    // Highest-ranked notes come first, so trimming from the end drops the weakest.
    const fitted = await fitToContext(session, notesFull, promptFor, 700);
    const given = hits.map(({ chunk }) => chunk).filter((chunk) => fitted.text.includes(`[${chunk.id}]`));
    const givenIds = new Set(given.map((chunk) => chunk.id));

    const schema = {
      type: 'object',
      properties: {
        answerable: { type: 'boolean' },
        answer: { type: 'string', maxLength: 700 },
        sources: { type: 'array', maxItems: 4, items: { type: 'string', enum: [...givenIds] } },
      },
      required: ['answerable', 'answer', 'sources'],
      additionalProperties: false,
    };
    const raw = await session.prompt(promptFor(fitted.text), { responseConstraint: schema, signal });
    const reply = parseObject(raw);

    const text = tidy(reply?.answer, 700);
    const cited = given.filter((chunk) => stringList(reply?.sources, givenIds).includes(chunk.id));
    const grounded =
      reply?.answerable === true &&
      text.length > 0 &&
      cited.length > 0 &&
      numbersAreGrounded(text, `${fitted.text} ${question} ${earlier}`);

    return grounded
      ? { grounded: true, text, sources: cited }
      : { grounded: false, text: FALLBACK, sources: given.slice(0, 3) };
  } finally {
    session.destroy();
  }
}
