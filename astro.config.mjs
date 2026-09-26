// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shakoorattari.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // One page, no repeat navigation: inline the (small) CSS to avoid a render-blocking request.
    inlineStylesheets: 'always',
  },
  // Scoped selectors compile to `.foo.astro-xyz` (specificity 0,2,0), the same weight as Angular's
  // emulated encapsulation, so component styles keep beating the global stylesheet. (Astro's default
  // 'attribute' strategy weighs the same; the 'where' strategy adds none and would change the cascade.)
  scopedStyleStrategy: 'class',
  compressHTML: true,
  // The old Angular build prerendered these as separate URLs. Keep them working as
  // redirects into the single-page anchors so existing links don't 404. (/projects is now a real
  // page — the case-study hub — so it is deliberately not listed here: a redirect would shadow it.)
  redirects: {
    '/about': '/#about',
    '/skills': '/#skills',
    '/experience': '/#experience',
    '/contact': '/#contact',
  },
});
