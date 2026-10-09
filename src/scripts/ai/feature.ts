import type { PanelUi } from './ui';

/** What a feature module gives the panel: one handler for the panel's buttons and forms. */
export interface AiFeature {
  handle(element: HTMLElement, event: Event): void | Promise<void>;
}

/** Each feature module's default export. Created on first use, so nothing here costs anything until then. */
export type FeatureFactory = (panel: HTMLElement, ui: PanelUi) => AiFeature;
