# On-device AI features

Added 2026-10-09 (branch `feat/ai-features`). The site offers optional features that run on Chrome's built-in AI, on the visitor's own computer. Nothing is sent to a server, nothing runs until a button is pressed, and in any other browser a panel says what is needed instead.

## What and where

| Feature | Where | API | What it does |
| --- | --- | --- | --- |
| **Chat: "Ask about Shakoor"** | Home page, above Contact (`#ask`), and the **Ask AI** button on every page, which opens the same chat in a window | Prompt API | Answers from the site's own content: the websites and apps built, the projects, the skills and the experience, including overviews ("which technologies does he use most?", the career timeline). Remembers the conversation for follow-ups. Every answer links to the sections it came from |
| **Job-fit check** | `/services/`, first after the introduction (`#ai-fit`) | Prompt API | A recruiter pastes a job description; the page lists its requirements and which the site gives evidence for, and which it does not |
| **Quote brief helper** | `/quote/`, inside the form (`#ai-quote`) | Prompt API | Reads the project description and suggests the form's project type, timeline and budget, and details worth adding. Nothing is applied until the visitor presses "Use this" |
| **Key points** | Case-study pages, blog posts (`#ai-summary`) | Summarizer API | A few bullet points of the page |
| **"Try the AI on this site" band** | Home page, under the hero (`#ai`) | none | Three plain links to the tools above. It works in every browser and costs nothing on load: it is the promotion |

Writer, Rewriter and Proofreader are not used: as of 2026-10-09 they were still origin trials (a token that expires), and the Prompt API covers the same ground. The Translator was skipped because Chrome already translates whole pages.

## Chrome's status (checked 2026-10-09)

- **Prompt API** (`LanguageModel`): stable for web pages from Chrome 148 (May 2026), with structured output (`responseConstraint`). Only the sampling parameters (`temperature`, `topK`) are still an origin trial on the web; the site does not use them.
- **Summarizer**: stable from Chrome 138.
- **Desktop only**: Windows 10/11, macOS 13+, Linux (and ChromeOS on Chromebook Plus). Not Android or iOS.
- **Hardware**: about 22 GB of free disk space and either a GPU with more than 4 GB of memory or 16 GB of RAM with 4+ CPU cores.
- **Language**: the Prompt API on the web handles English, Spanish, Japanese, German and French. The site declares English and says "English only" if the text is mostly Arabic. Arabic is the obvious gap for a UAE audience.
- **User activation**: `create()` needs a click when the model must be downloaded, so the site asks first and downloads only on "Download and continue".
- Sources: developer.chrome.com/docs/ai/built-in-apis and /prompt-api, and the Chrome I/O 2026 post. Re-check them before changing anything: the API has been renamed between versions (`inputQuota` / `contextWindow`, `measureInputUsage` / `measureContextUsage`), which is why `runtime.ts` reads both spellings.

## Browsers

Feature detection decides what works; the user agent only picks the wording and the numbers. What is known (checked 2026-10-09) and what is not:

| Browser | Prompt API (chat, job fit, quote helper) | Summarizer (key points) | What the visitor sees if it is missing |
| --- | --- | --- | --- |
| **Chrome 148+**, desktop | Stable | Stable from 138 | n/a. Needs ~22 GB free and a GPU with more than 4 GB, or 16 GB RAM and 4+ cores |
| **Edge**, desktop | **Experimental preview**: the flag "Prompt API for on-device language model" at `edge://flags` (a fresh Edge 154 had no `LanguageModel` without it; with the flag its session members are identical to Chrome's). Phi-4-mini model. Needs Windows 10/11 or macOS 13.3+, 20 GB free, 5.5 GB VRAM, an unmetered connection | Present in Edge 154 | "Turn on Edge's experimental AI, or use Chrome", with the flag name. Hardware messages use Edge's numbers |
| **Brave, Opera, Vivaldi** and other Chromium browsers | Untested: shows if the browser exposes it | Untested | "On-device AI is switched off here", or "Update your browser" if it reports Chromium below 148/138 |
| **Safari, Firefox**, Chrome on iOS | None | None | "Open this page in Chrome", with a Copy link button |
| **Phones and tablets** | None | None | "Open this on a desktop or laptop" |

Because only Chrome's dialect is documented in detail, the code does not assume it:

- **Language hints** (`expectedInputs`/`expectedOutputs`, `expectedInputLanguages`/`outputLanguage`) are sent first; a browser that rejects them is asked again without. The launcher's availability read uses the same fallback (`promptAvailability()` in `support.ts`).
- **A JSON schema** is enforced with `responseConstraint` when the browser accepts it. If not, `promptStructured()` asks once more in plain words ("reply with only a JSON object that follows this JSON Schema") and the reply is read leniently (the outermost braces, so a code fence or a sentence around it does not matter). A browser that actually rejected the schema is then asked the plain way for the rest of the visit; a passing glitch is only retried once. Every field is validated either way, so a looser reply is no less safe.
- **No `clone()`**: each question gets a session of its own and releases it (slower, but it works).
- **Unexpected errors** say what they were ("Details: TypeError: …") and are logged with `console.warn('[on-device AI]', error)`. Found because an Edge user got a bare "could not finish that" and nothing could tell why.
- **Wording** names the browser ("Edge needs to download…", "Preparing Edge's on-device model…"); panel badges and fine print say "your browser".
- Not verified: how a real model in Edge behaves. A fresh Edge profile here reports `unavailable`, so only the API's shape and the page's flows were checked. If a failure appears in Edge, the "Details:" line is what to send.

## How it behaves

1. Every page loads one small script (`src/scripts/ai/panels.ts`, about 2 KB gzipped, from `AiChatLauncher.astro` in `Base.astro`) and carries a hidden `<dialog>` with the chat. **No model call is made on load** except one: the launcher reads `availability()` once, when the browser is idle, to hide itself where the computer cannot run the model. That reads state only; it starts nothing and downloads nothing.
2. **The "Ask AI" button** is shown only if the browser has the API and `availability()` is not `unavailable`. A visitor in another browser (most of them) never sees a floating button, and neither does one whose computer cannot run it. On a phone it sits above the analytics notice. It opens a modal `<dialog>`: Escape, the close button and a click on the backdrop close it, focus returns to the button, and the conversation stays until the page is left or cleared.
3. **Panels** (`AiPanel.astro`) check for the API by feature detection, never by browser name. Missing: the panel shows a notice (the user agent only picks the wording: "Open this page in Chrome", "needs Chrome 148 or newer", "open this on a desktop", "switched off here") and a "Copy page link" button. Present: the controls show. The notice appears only inside panels: there is deliberately no site-wide "switch to Chrome" banner, which would nag every Safari and phone visitor, most of whom are recruiters.
4. On the first button press the feature module and `ui.ts` load (2–6 KB gzipped, plus `/ai/knowledge.json` for the chat and the job-fit check).
5. `runtime.ts` calls `availability()`. `unavailable`: a plain explanation of the requirements. `downloadable`: a question ("a large, one-time download... Download it now?"); only the explicit click starts it, with a percentage and a progress bar, which turns indeterminate with "Preparing Chrome's on-device model…" at 100%. `available`: it goes straight on with "Starting the on-device model…" and no progress bar at all.
6. A status line (`role="status"`) says what is happening; the chat transcript is a `role="log"`; other results move focus to the result box. A Stop button aborts a running request. If nothing can be answered (download declined, Stop pressed, an error) the visitor's question goes back in the box.

## Keeping the model warm (and not saying "Downloading" when nothing downloads)

Found from a screenshot of the real thing: every question showed "Downloading Chrome's on-device model… 100%" and then sat there. Two causes, both mine, both confirmed against Chrome's documentation:

- **A wrong label.** Chrome always fires `downloadprogress` (loaded 0, then 1), even for a model already on the computer, and `loaded = 1` only means "downloaded": the session is ready when `create()` resolves, after the model has loaded. The page now shows progress only when `availability()` said `downloadable` or `downloading`, and at 100% says "Preparing…" with an indeterminate bar.
- **A model reloaded for every question.** Chrome unloads the model "after a period of time if there are no living sessions" and recommends keeping one session alive and cloning it. The page used to create and destroy a session per question. Now `runtime.ts` keeps one **base session per system prompt** (and one summarizer per option set), each question works on `clone()` of it (a clone starts from the system prompt without reloading the model), and the base is released after 5 idle minutes to return the memory. The home chat and the chat window share it. The base is created with its own `AbortController`, never a request's signal: Chrome destroys a session when the signal given to `create()` is aborted, even later, so tying it to a request would make a Stop throw the loaded model away.
- The first question after a page load (or after the idle release) still has to load the model, which takes a few seconds on a typical machine; that is Chrome, and the status line now says so honestly. Later questions are quick.
- If the download itself ever repeats, check `chrome://on-device-internals`: Chrome removes the model when free disk space falls below about 10 GB and downloads it again once there is room.

## Why the output can be trusted (as far as it can)

A small on-device model will sometimes be wrong, and this site's rule is that it never states what the data files do not say. So the model proposes and plain code decides:

- **Grounding.** The chat and the job-fit check read `/ai/knowledge.json`, built at build time from the same data files as the pages and `llms.txt` (`src/lib/ai-knowledge.ts`). It holds public content only: **no email or phone number** (a test enforces this) and nothing the pages do not already say. `robots.txt` disallows `/ai/`. Besides one chunk per fact it holds computed **overviews** (kind `insight`): the websites and apps built, the technologies used across them with counts, the enterprise projects, the career timeline, the skills, the services. They are derived from the data, so a question about "all" or "most" has an answer that is actually stated in the notes.
- **Chat** (`chat-core.ts`): the question is first matched against the chunks with plain BM25 (`retrieve.ts`, no model). No match means the fixed "This site does not say" answer, and no model or download is involved. Otherwise the model sees only the top five chunks and the last two answers (context only). Its reply is shown only if it says `answerable`, cites a note it was actually given, and every number in the answer appears in those notes (whole numbers; ids such as `[ex12]` cannot vouch for one). Sources are rendered from the site's data, not from the model's words. Anything else becomes the fallback plus "Closest sections", and is not remembered as something the site said. A follow-up with no words of its own ("tell me more about that") is looked up by the topics of the last answer; a question that has its own words only gets a little help from them and still needs a match of its own.
- **Job fit** (`fit.ts`): the model extracts requirements and cites catalog ids (the schema enumerates the valid ids). Each citation is then checked against the site's own text (`relation()` in `retrieve.ts`): it counts only if it shares at least two of the requirement's words, or most of a short one, or a word from the alias list (login → OAuth). A citation that fails is replaced by the best lexical match from the site's data, or dropped. "Strong" needs direct support; a looser link is "partial"; nothing supporting means "not found". One shared word out of several counts for nothing ("Terraform modules" is not backed by "Lazy-Loading Modules"). The counts are computed in code. **This came from the first real-model run** (see below).
- **Quote helper:** the schema enumerates the form's own options (imported from `src/data/quote.ts`, so they cannot drift). Anything else is ignored; "unspecified" means "do not touch"; a suggestion is applied only by a click, and applying fires the form's own `change` event so validation and the WhatsApp text stay in step. Nothing is submitted.
- **Rendering.** Everything the model or visitor wrote goes through `textContent` (`dom.ts`), never `innerHTML`.
- Every panel says it runs on the device, can be wrong, and where to check.

## Files

```
src/components/AiPanel.astro        shell: heading, notice, status, progress, download question, fine print (all panel styles; tokens only)
src/components/AiChatLauncher.astro the Ask AI button + <dialog>, and the one script every AI panel needs (in Base.astro)
src/components/ChatBox.astro        transcript, question box, example chips (used by the home chat and the window)
src/components/AskAssistant.astro   the chat on the home page          AiShowcase.astro  the band under the hero
src/components/AiJobFit.astro  AiSummary.astro   QuoteForm.astro contains the quote helper panel
src/data/aiChat.ts                  the example questions (a test checks each finds something to answer from)
src/scripts/ai/panels.ts            support check per panel, lazy feature load, launcher and dialog
src/scripts/ai/support.ts           feature detection, notice wording, English-only language spec     chrome-ai.d.ts  typings
src/scripts/ai/runtime.ts           availability, download question, progress, errors, fitting input to the context window
src/scripts/ai/chat-core.ts         one answer: retrieval, model, checks      ui.ts  dom.ts  feature.ts  guard.ts  knowledge.ts  retrieve.ts
src/scripts/ai/features/            chat.ts  fit.ts  quote.ts  summary.ts
src/lib/ai-knowledge.ts             data files -> chunks and overviews        src/pages/ai/knowledge.json.ts  the endpoint
tests/ai-mock.ts  tests/ai.spec.ts  the mock of Chrome's AI (with switches for another browser's dialect) and the specs (81 tests)
```

To add a feature: a module in `features/` (default-export a `FeatureFactory`), an entry in the `features` map in `panels.ts`, markup inside an `<AiPanel>`, and tests against the mock. Keep the model's choices constrained by a schema, validate in code, and render with `h()`.

## Testing

- **CI never uses a real model.** `tests/ai-mock.ts` stands in for `LanguageModel` and `Summarizer`, follows the real API where the site depends on it (a download needs user activation; `downloadprogress` always fires, 0 then 1, and a session is not ready until the model has loaded; a clone does not reload the model; aborting the signal given to `create()` destroys that session; a constraint is recorded; quota members exist) and lets tests queue replies. It first lacked the "progress always fires" and "clone" rules, which is why it could not catch the repeated-download problem. The suite covers the notice for Safari, an old Chrome, a phone and an API that is off; nothing running on load; the download question; Stop; every rejection path above; multi-turn memory and follow-ups; the launcher (shown, hidden where the model cannot run, hidden without the API) and the window's focus, Escape and backdrop behaviour; the form integration; and the knowledge file.
- **Mutation-tested** (2026-10-09): 36 deliberate breakages, each caught by the matching test (numbers vouched for by ids, claims kept without evidence, unknown ids kept, suggestions outside the form's options, answers with no cited source, support check always true, model called on page load, a no-match question still using the model, download without asking, Stop left visible during the question, snippets cut mid-word, one shared word counting as support, citations not verified, "strong" without direct support, the launcher shown where the model cannot run, the conversation not remembered, follow-ups not resolved, refused answers remembered as facts, the question lost when the download is declined, no backdrop close, the original design that merged the last topic into the query text, progress shown when nothing downloads, a full bar at 100%, a new session for every question, a model never released, a new summarizer for every call, the base session tied to a request's signal, and for other browsers: failures that hide their cause, Edge told to update Chrome, a rejected schema or rejected language hints treated as failures, the launcher giving up on such a browser, a browser without `clone()`, one glitch switching schema enforcement off for good, a JSON reply wrapped in prose rejected, and Edge given Chrome's hardware numbers). Two further mutants survived because they are equivalent: a hit must match a word of the question itself, so previous-topic words cannot pull in unrelated sections however they are weighted.
- **Accessibility**: axe-core over every panel state (notice, ready, download question, results, fallback, unavailable, conversation, the open window, the launcher, the home band) in both themes at 1100 px and 375 px. It found two real issues, both fixed: button names not containing their visible text (WCAG 2.5.3), and `role="log"` on a list (which also strips the list context from its items). The existing analytics test caught a third: the launcher's CSS named the analytics notice by id, and CSS is inlined into every page, so the "default build mentions no analytics" test failed; the CSS now uses the notice's class. Lighthouse is 1.00 in accessibility, best practices and SEO on every page in both themes; home performance is 0.99 with LCP 1.8 s (budget 2.0 s), CLS at most 0.001. Cost: about 2 KB gzipped script and 2.5 KB gzipped HTML on every page.
- **Existing hero findings (not from this work):** axe also reports `label-content-name-mismatch` on the hero's "LinkedIn Verified Professional" link (its `aria-label` omits the visible text) and on the scroll indicator.
- **Real Chrome.** Chrome 155 (Playwright) and 152 (the built-in browser) both expose the APIs and accepted the exact options the site passes; the built-in browser showed the real "download the model?" question, the chat window and the launcher, and declining downloaded nothing. Chrome 152's session class has `clone`, `destroy`, `measureContextUsage`, `contextWindow` and `contextUsage` (the newer names; `inputQuota` and `measureInputUsage` are gone there, which `runtime.ts` tolerates).
- **First real-model run (the owner, 2026-10-09, desktop Chrome, job-fit check):** it worked end to end and the results were mostly right, but one row cited the wrong evidence: "Solution architecture for digital transformation projects" was marked strong with "Methodology & Tooling", which says nothing about it (the right evidence was "Leadership & Architecture"). That is why citations are now verified against the site's text and repaired from it. A mock could never have shown this.
- **Still unverified with a real model:** the chat's answers, the quote helper's suggestions and key points. Check them with the list below.

### Manual check in a desktop Chrome that can run the model

1. Open the home page, press an example question, accept the download once, and wait.
2. These should be answered from the site, with the right sources: "What has he built for clients?", "What identity and SSO work has he done?", "What AI and MCP tooling has he built?", "Which technologies does he use most?", "Does he lead a team?", "Where is he based, and does he work remotely?", "How many websites has he built?", "What is his career timeline?".
3. A follow-up such as "Tell me more about that" should stay on the previous topic.
4. These should give "This site does not say": "What is his salary?", "Is he available in March?", "How old is he?", "Does he know Rust?" (the site never mentions it).
5. Job fit: paste a real job description with a mix of matches and gaps. Gaps must read "Not found"; check nothing marked strong is overstated and every evidence link really supports its requirement.
6. Quote helper: describe a small business website with a deadline and no budget. Budget must not be suggested.
7. Key points on a case study: the bullets should match the page.
8. If an answer is wrong or the model ignores the schema, record the exact prompt and reply; the fix is almost always in the system prompt, the retrieval aliases in `retrieve.ts` or the `relation()` rule.

## Limits and open decisions

- **Reach is a minority.** Desktop Chrome with the model downloaded (or willing to download it, with 22 GB free). Everything else sees the notice. The home band says so in one line. Treat the features as a way to show the engineer builds with on-device AI, never as the way to reach the owner.
- **English only** for now. If Chrome adds Arabic to the Prompt API, change `PROMPT_LANGUAGES` in `support.ts`, the Arabic check in `guard.ts` and the system prompts.
- **A conversation is not kept across pages** (the site is static, so every link is a full page load). Persisting it in `sessionStorage` would be a small change if wanted; it would store what the visitor typed in their own browser, so the privacy text would need a line.
- **No analytics events** for the AI features. `generate_lead` stays the only custom event; add one only if the owner asks (and send no text).
- **WebMCP** (Chrome's proposal for exposing site tools to browser agents; experimental origin trial from Chrome 149) fits the owner's MCP positioning but is a different feature and needs an origin-trial token from the owner. Not built.
- The quote panel makes the form slightly longer for Chrome visitors, and one line longer for everyone else (the compact notice). If it hurts conversion, remove `<AiPanel id="ai-quote">` from `QuoteForm.astro`.
- The floating button is the most visible thing on every page for visitors who can use it. If it ever feels intrusive, the dismiss-and-remember option (`sessionStorage`) is the next step; today it is simply absent for everyone who cannot use it.
