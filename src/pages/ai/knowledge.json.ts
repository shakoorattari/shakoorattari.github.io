import type { APIRoute } from 'astro';
import { buildKnowledge } from '../../lib/ai-knowledge';

// Read by the on-device AI panels (src/scripts/ai/) when someone uses them; never fetched on page load.
// robots.txt keeps crawlers out of /ai/: it is a copy of pages that are indexed in their own right.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildKnowledge()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
