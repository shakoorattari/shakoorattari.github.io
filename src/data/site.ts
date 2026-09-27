// Single source of truth for site-wide identity, SEO copy and contact configuration.

export const site = {
  url: 'https://shakoorattari.com',
  name: 'Shakoor Hussain Attari',
  siteName: 'Shakoor Hussain Attari — Portfolio',
  /** Source repository (releases and the changelog live here). */
  repository: 'https://github.com/shakoorattari/shakoorattari.github.io',
  title: 'Shakoor Hussain Attari — Full-Stack Software Engineer, UAE',
  jobTitle: 'Lead Software Engineer, Full-Stack Developer & Application Architect',
  description:
    'Software engineer and architect in Sharjah, UAE. 15+ years building web and enterprise apps with .NET, Angular and OAuth/OIDC. Open to roles and projects.',
  shortDescription:
    'Full-stack software engineer and application architect in Sharjah, UAE. 15+ years of enterprise web and application development: .NET, Angular, OAuth 2.0 / OIDC, multi-tenant IAM and AI tooling.',
  schemaDescription:
    'Lead Software Engineer, Full-Stack Developer & Application Architect with 15+ years building enterprise platforms across the UAE public sector. Specializing in .NET, Angular, OAuth 2.0/OIDC, multi-tenant IAM, and AI tooling.',
  heroIntro:
    'Full-stack software engineer and application architect in Sharjah, UAE. 15+ years building web and enterprise applications for the UAE public sector — .NET, Angular, OAuth 2.0 / OIDC, multi-tenant IAM and AI tooling. Open to senior roles and select projects, in the UAE and remotely worldwide.',
  keywords:
    'Shakoor Hussain Attari, Lead Software Engineer, Full-Stack Developer, Application Architect, .NET Developer, Angular Developer, OAuth 2.0, OIDC, IAM, UAE, Enterprise Software, Software Architect',
  /** Public contact email (also shown on the page). The Outlook address is a Teams ID only. */
  email: 'binmushtaq@gmail.com',
  teamsId: 'shakoorattari@outlook.com',
  phone: '+971508066735',
  phoneDisplay: '+971 50 806 6735',
  region: 'Sharjah',
  country: 'AE',
  locationLabel: 'Sharjah, UAE',
  /** 1200x630 social card; lives in /public. */
  ogImage: '/assets/og-image.jpg',
  ogImageAlt: 'Shakoor Hussain Attari — Lead Software Engineer & Full-Stack Developer',
  /** Square headshot used for schema.org `image`. */
  photo: '/assets/files/shakoor_pic.jpeg',
  social: {
    linkedin: 'https://www.linkedin.com/in/shakoorattari/',
    github: 'https://github.com/shakoorattari',
    x: 'https://x.com/shakoorHA',
  },
  knowsAbout: [
    '.NET',
    'C#',
    'Angular',
    'TypeScript',
    'OAuth 2.0',
    'OIDC',
    'Identity & Access Management',
    'Microservices',
    'Azure',
    'Full-Stack Development',
    'Enterprise Architecture',
    'AI Tooling',
  ],
  /** Rotating roles shown under the name; the first one is rendered statically. */
  roles: [
    'Lead Software Engineer',
    'Full-Stack Developer',
    'Application Architect',
    '.NET / Angular Specialist',
    'IAM & AI Tooling Engineer',
  ],
  /** Short pitch reused on the Services pages. */
  availability:
    'Open to senior engineering and architecture roles, and to select project work — based in Sharjah, working with teams across the UAE and GCC and remotely worldwide.',
  resume: '/assets/files/ShakoorHussain_Resume_V2.pdf',
  resumeMarkdown: '/assets/files/ShakoorHussain_Resume.md',
} as const;

/**
 * Contact form configuration. Both the Web3Forms access key and the Turnstile *site* key are
 * designed to be public. Development uses Cloudflare's always-pass Turnstile test key.
 */
export const contactConfig = {
  endpoint: 'https://api.web3forms.com/submit',
  fromName: 'Portfolio Contact Form',
  accessKey: import.meta.env.DEV ? '29ad9670-c951-4a6e-9139-59f867564769' : '0bd977b0-237c-45e6-81eb-6330c3c179cc',
  turnstileSiteKey: import.meta.env.DEV ? '1x00000000000000000000AA' : '0x4AAAAAADVjdm_ulnG-5yBk',
  rateLimitMs: 60_000,
} as const;

/**
 * Measurement + search-engine verification. All optional: nothing is emitted while a value is empty.
 * Set them here, or as GitHub Actions *variables* (Settings → Secrets and variables → Actions → Variables):
 *   CF_ANALYTICS_TOKEN, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION
 * (the workflow exposes them to the build as PUBLIC_* env vars). These values are public by design.
 */
export const tracking = {
  /** Cloudflare Web Analytics token (cookieless, no consent banner needed). */
  cloudflareToken: import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN ?? '',
  /** <meta name="google-site-verification"> content, for a Search Console "URL prefix" property. */
  googleVerification: import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  /** <meta name="msvalidate.01"> content, for Bing Webmaster Tools. */
  bingVerification: import.meta.env.PUBLIC_BING_SITE_VERIFICATION ?? '',
} as const;
