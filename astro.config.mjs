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
  // Emit `.foo.astro-xyz` (specificity 0,2,0) instead of `:where()`, so component styles
  // keep beating the global stylesheet exactly as Angular's emulated encapsulation did.
  scopedStyleStrategy: 'class',
  compressHTML: true,
  // The old Angular build prerendered these as separate URLs. Keep them working as
  // redirects into the single-page anchors so existing links don't 404.
  redirects: {
    '/about': '/#about',
    '/skills': '/#skills',
    '/experience': '/#experience',
    '/projects': '/#projects',
    '/contact': '/#contact',
  },
});
