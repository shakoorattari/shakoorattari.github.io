// Minimal typings for the parts of Chrome's built-in AI APIs this site uses: the Prompt API (`LanguageModel`) and the
// Summarizer API. TypeScript's DOM library does not include them. Both are absent in other browsers, so always
// feature-detect before use (see support.ts). Quota and measuring members have been renamed between Chrome versions,
// so both spellings are optional here and runtime.ts reads whichever exists.
export {};

declare global {
  type AiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

  interface AiDownloadProgressEvent extends Event {
    /** A fraction from 0 to 1. */
    readonly loaded: number;
    readonly total?: number;
  }
  interface AiCreateMonitor {
    addEventListener(type: 'downloadprogress', listener: (event: AiDownloadProgressEvent) => void): void;
  }

  interface AiTextSpec {
    type: 'text';
    languages?: string[];
  }

  // ---- Prompt API
  interface LanguageModelMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  interface LanguageModelOptions {
    expectedInputs?: AiTextSpec[];
    expectedOutputs?: AiTextSpec[];
  }
  interface LanguageModelCreateOptions extends LanguageModelOptions {
    initialPrompts?: LanguageModelMessage[];
    monitor?: (monitor: AiCreateMonitor) => void;
    signal?: AbortSignal;
  }
  interface LanguageModelPromptOptions {
    /** A JSON Schema the response must follow. */
    responseConstraint?: object;
    omitResponseConstraintInput?: boolean;
    signal?: AbortSignal;
  }
  interface LanguageModelSession {
    prompt(input: string, options?: LanguageModelPromptOptions): Promise<string>;
    /** A new session that starts from this one's context (its system prompt), without reloading the model. */
    clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
    destroy(): void;
    readonly contextWindow?: number;
    readonly contextUsage?: number;
    readonly inputQuota?: number;
    readonly inputUsage?: number;
    measureContextUsage?(input: string, options?: LanguageModelPromptOptions): Promise<number>;
    measureInputUsage?(input: string, options?: LanguageModelPromptOptions): Promise<number>;
  }
  interface LanguageModelStatic {
    availability(options?: LanguageModelOptions): Promise<AiAvailability>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  }

  // ---- Summarizer API
  interface SummarizerOptions {
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    sharedContext?: string;
    expectedInputLanguages?: string[];
    outputLanguage?: string;
  }
  interface SummarizerCreateOptions extends SummarizerOptions {
    monitor?: (monitor: AiCreateMonitor) => void;
    signal?: AbortSignal;
  }
  interface SummarizerSession {
    summarize(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<string>;
    destroy(): void;
    readonly inputQuota?: number;
    measureInputUsage?(input: string, options?: { context?: string; signal?: AbortSignal }): Promise<number>;
  }
  interface SummarizerStatic {
    availability(options?: SummarizerOptions): Promise<AiAvailability>;
    create(options?: SummarizerCreateOptions): Promise<SummarizerSession>;
  }

  // `undefined` outside browsers that ship the APIs.
  var LanguageModel: LanguageModelStatic | undefined;
  var Summarizer: SummarizerStatic | undefined;
}
