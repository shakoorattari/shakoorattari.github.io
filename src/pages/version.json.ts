import type { APIRoute } from 'astro';
import { getBuildInfo } from '../lib/version';

// Machine-readable version of the deployed site. CI polls this after a deploy to confirm the live site is
// serving the commit that was just published; it is also handy for support ("which version are you on?").
export const GET: APIRoute = () => {
  const { commitShort: _short, releaseUrl, ...info } = getBuildInfo();
  return new Response(`${JSON.stringify({ ...info, releaseNotes: releaseUrl }, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
