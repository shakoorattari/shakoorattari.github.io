// Recommendations received on LinkedIn, shown verbatim (the owner supplied a screenshot of the "Received" tab on
// 2026-10-03; each is visible to all LinkedIn members). Never edit the wording, and never add one that is not on
// LinkedIn. Only fix whitespace. Role and relationship are as LinkedIn displays them.

export interface Recommendation {
  name: string;
  /** Title as shown on the recommender's LinkedIn profile. */
  role: string;
  /** How they know Shakoor, as LinkedIn words it. */
  relationship: string;
  /** ISO date the recommendation was written. */
  date: string;
  text: string;
}

export const recommendationsUrl = 'https://www.linkedin.com/in/shakoorattari/details/recommendations/';

/** Newest first, as on LinkedIn. */
export const recommendations: Recommendation[] = [
  {
    name: 'Ahmed Bahaa',
    role: 'Product Manager at emaratech',
    relationship: 'Worked with Shakoor on the same team',
    date: '2022-07-13',
    text: "I've worked for quite a long time with Shakoor. Shakoor is a very good person both professionally and personally. He was an important member of the team and was producing high quality deliverables. He was passionate about learning more and increasing his skills. Shakoor will be a very good asset to any company needs a great member in their team.",
  },
  {
    name: 'Rizwan Iqbal',
    role: 'Senior IT Professional',
    relationship: 'Managed Shakoor directly',
    date: '2022-04-20',
    text: 'Shakoor is one of the best people I have as a colleague. He is the most profound person I have met, and his ability to tackle any problem is remarkable and with a warm smile. He is a hardworking and dedicated person who will complete assigned projects in a given time frame. Shakoor would become an appreciated member of any team.',
  },
  {
    name: 'Dominick Antony',
    role: 'Engineering Manager – Payment Solutions',
    relationship: 'Was senior to Shakoor but did not manage directly',
    date: '2020-01-02',
    text: 'It was fantastic working with Shakoor. Most hardworking and responsible person. Always like to learn new things. In simple words, you can achieve any project delivery having him in your team.',
  },
];

export const formatRecommendationDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
