// Options for the /quote/ form. Edit the lists here; the form and the WhatsApp message both read them.
// The values are what the visitor sees, and what arrives in the email and in WhatsApp.

export const quoteOptions = {
  projectTypes: [
    'New business website',
    'Redesign or speed-up of an existing website',
    'Web or enterprise application',
    'SEO and website performance',
    'API, integration or login/SSO (OAuth, UAE PASS)',
    'Not sure yet',
  ],
  timelines: ['As soon as possible', 'Within a month', 'In 1–3 months', 'Flexible'],
  // The visitor's own budget, not a price list. Adjust the ranges to suit the work you want to attract.
  budgets: ['Not sure yet', 'Under AED 5,000', 'AED 5,000 – 15,000', 'AED 15,000 – 50,000', 'Over AED 50,000'],
} as const;

/** First line of the WhatsApp message (and of the email), before any details the visitor has typed. */
export const quoteGreeting = "Hello Shakoor, I'd like a quote for a project.";
