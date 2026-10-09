// The chat: a conversation drawn into a transcript, on the home page and in the "Ask AI" window. The answering itself
// (retrieval, model, checks) is in chat-core.ts.
import type { KnowledgeChunk } from '../../../lib/ai-knowledge';
import type { FeatureFactory } from '../feature';
import { h, link } from '../dom';
import { ENGLISH_ONLY, isMostlyArabic } from '../guard';
import { loadKnowledge } from '../knowledge';
import { reportFailure } from '../runtime';
import { respond, type Turn } from '../chat-core';

const chat: FeatureFactory = (panel, ui) => {
  const transcript = panel.querySelector<HTMLElement>('[data-ai-transcript]')!;
  const input = panel.querySelector<HTMLInputElement>('[data-ai-input]')!;
  const examples = panel.querySelector<HTMLElement>('[data-ai-examples]')!;
  const clear = panel.querySelector<HTMLElement>('[data-ai-action="clear"]')!;
  const history: Turn[] = [];
  let running = false;

  const sourcesLine = (label: string, chunks: KnowledgeChunk[]) =>
    chunks.length > 0 &&
    h(
      'p',
      { class: 'ai-sources-line' },
      `${label}: `,
      ...chunks.flatMap((chunk, i) => [i > 0 && ', ', link(chunk.href, chunk.title)]),
    );

  const reset = () => {
    history.length = 0;
    transcript.replaceChildren();
    examples.hidden = false;
    clear.hidden = true;
    ui.say('Conversation cleared.');
    input.focus();
  };

  return {
    async handle(element) {
      if (element.dataset.aiAction === 'clear') {
        if (!running) reset();
        return;
      }
      if (running) return;

      const question = (element.dataset.question ?? input.value).replace(/\s+/g, ' ').trim();
      if (question.length < 3) {
        ui.say('Type a question first.');
        input.focus();
        return;
      }
      if (isMostlyArabic(question)) {
        ui.say(ENGLISH_ONLY);
        return;
      }

      running = true;
      input.value = '';
      const asked = h(
        'div',
        { class: 'ai-turn ai-turn-q' },
        h('p', {}, h('span', { class: 'sr-only' }, 'You asked: '), question),
      );
      transcript.append(asked);
      transcript.scrollTop = transcript.scrollHeight;
      // If there is no answer (download declined, Stop pressed, an error) the question goes back in the box.
      const takeBack = () => {
        asked.remove();
        input.value = question;
      };
      clear.hidden = false;

      const controller = new AbortController();
      ui.busy(true, () => controller.abort());
      try {
        ui.say('Looking through the site…');
        const reply = await respond(ui, await loadKnowledge(), question, history, controller.signal);
        if (!reply) {
          takeBack(); // the panel already says why (not available, download declined)
          return;
        }

        const answer = h(
          'div',
          { class: `ai-turn ai-turn-a${reply.grounded ? '' : ' ai-fallback'}` },
          h('p', { class: 'ai-a-label' }, reply.grounded ? 'On-device AI' : 'Not on this site'),
          h('p', { class: 'ai-a-text' }, reply.text),
          sourcesLine(reply.grounded ? 'Based on' : 'Closest sections', reply.sources),
        );
        transcript.append(answer);
        answer.scrollIntoView({ block: 'nearest' });

        if (reply.grounded) {
          history.push({ question, answer: reply.text, topics: reply.sources.map((chunk) => chunk.title).join(' ') });
          if (history.length > 6) history.shift();
          examples.hidden = true; // the example questions come back after an answer the site could not give
        } else {
          examples.hidden = false;
        }
        ui.say(
          reply.grounded
            ? 'Answer added. It was written by an on-device AI model: check the sections it is based on.'
            : 'No answer from the site for that question.',
        );
      } catch (error) {
        takeBack();
        reportFailure(ui, error);
      } finally {
        running = false;
        ui.busy(false);
        input.focus();
      }
    },
  };
};

export default chat;
