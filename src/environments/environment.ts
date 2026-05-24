export const environment = {
  production: false,
  // Get your free access key from https://web3forms.com
  // The access key is safe to expose in client code — it only identifies the
  // destination inbox configured on Web3Forms. Spam is mitigated via honeypot
  // and client-side rate limiting; Web3Forms also applies abuse protection.
  web3formsAccessKey: '29ad9670-c951-4a6e-9139-59f867564769',
  contactFromName: 'Portfolio Contact Form',
  // Cloudflare Turnstile site key — safe to expose in client code.
  // Get a free site key at https://dash.cloudflare.com/?to=/:account/turnstile
  // Test key '1x00000000000000000000AA' always passes (use for local dev).
  turnstileSiteKey: '1x00000000000000000000AA',
};
