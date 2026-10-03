// Websites and apps: the gallery at /work/ and the home-page section. Every claim here was checked against the
// live site and the project's own repository (2026-10-03), not just its README: one README promised an AI
// integration that the code only mentions as future work. No traffic, ranking or enquiry numbers are published:
// none were provided, so none are claimed.
import type { ImageMetadata } from 'astro';
import earthCone from '../assets/work/earth-cone.jpg';
import lailONahar from '../assets/work/lail-o-nahar.jpg';
import uaeChatbot from '../assets/work/uae-chatbot.jpg';
import komorebi from '../assets/work/komorebi-cameron.jpg';

interface WorkBase {
  slug: string;
  name: string;
  /** 'client' = built for a business; 'project' = an own project or experiment (labelled as such on the page). */
  kind: 'client' | 'project';
  /** Small line above the title: what the client does, or what the project is. */
  label: string;
  /** One or two sentences for cards. */
  blurb: string;
  tags: string[];
  /** The live site, if there is one. */
  url?: string;
  /** Source code on GitHub, if public. */
  repo?: string;
}

/** A full entry: a screenshot card and its own page at /work/<slug>/. */
export interface WorkPage extends WorkBase {
  /** Home-page screenshot (1440×900); Astro resizes it. */
  image: ImageMetadata;
  imageAlt: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  /** The owner's role, where it is known. Left out when it is not. */
  role?: string;
  /** What the site or app is for. */
  goal: string;
  built: { title: string; text: string }[];
  /** Anything the page should say plainly about what it does not do. */
  scope?: string;
  stack: string[];
  /** Service slugs this work evidences (see services.ts). */
  services: string[];
}

/** A card that links straight to the repository: too small to deserve a page of its own (no thin pages). */
export interface WorkLink extends WorkBase {
  repo: string;
  /** Icon for the card banner, which stands in for a screenshot. */
  icon: string;
}

export type WorkItem = WorkPage | WorkLink;

export const hasPage = (item: WorkItem): item is WorkPage => 'metaTitle' in item;

export const work: WorkItem[] = [
  {
    slug: 'earth-cone',
    name: 'Earth Cone Building Contracting',
    kind: 'client',
    label: 'Construction & maintenance contractor, Dubai',
    url: 'https://earthconecontracting.com/',
    image: earthCone,
    imageAlt:
      'Home page of the Earth Cone Building Contracting website: a villa photo behind the headline "Building and maintaining properties across the UAE" and a Request a quote button',
    blurb:
      'A lead-generation website for a contractor licensed across all seven Emirates: service pages, project galleries, a quote form and WhatsApp.',
    tags: ['Astro', 'Tailwind CSS', 'Local SEO', 'WhatsApp leads'],
    metaTitle: 'Earth Cone Website: Contractor Lead-Gen Build | S. Attari',
    metaDescription:
      'A fast, search-friendly website for a UAE building contractor: six service pages, project galleries, a quote form, WhatsApp and local-search structured data.',
    h1: 'Earth Cone Building Contracting — contractor website',
    intro: [
      'Earth Cone is a construction and maintenance contractor headquartered in Dubai and licensed to work in all seven Emirates. The company needed a website that turns people searching for a contractor anywhere in the UAE into phone calls, WhatsApp messages and quote requests.',
      'I designed and built the site as a static Astro project: each trade gets its own service page, the work is shown in photo and video galleries by trade, and every page keeps a quote request or WhatsApp message one click away.',
    ],
    role: 'Website design and development',
    goal: 'Generate qualified enquiries — calls, WhatsApp messages and quote requests — from people searching for a contractor across the UAE.',
    built: [
      {
        title: 'One page per service',
        text: 'Six service pages — construction, interior fit-out, custom kitchens, Korean artificial marble, electrical installation and water systems — so each search intent has its own page.',
      },
      {
        title: 'Project galleries by trade',
        text: 'Photo and video galleries organised by trade. Videos are compressed with a poster frame and only load when played, so galleries stay light.',
      },
      {
        title: 'Quote request and WhatsApp',
        text: 'A quote form, request-a-quote buttons throughout, and a floating WhatsApp button, so a visitor can enquire in whichever way they prefer.',
      },
      {
        title: 'One service-areas page, not dozens',
        text: 'A single page covers all seven Emirates with a map, instead of thin per-city pages that search engines penalise.',
      },
      {
        title: 'Local-search foundations',
        text: 'GeneralContractor structured data listing every Emirate served, a sitemap, robots rules and an llms.txt file for AI assistants, plus a FAQ section and a step-by-step process section.',
      },
    ],
    stack: ['Astro', 'Tailwind CSS', 'TypeScript', 'Web3Forms', 'Cloudflare', 'Structured data (JSON-LD)'],
    services: ['website-design-development', 'seo-performance'],
  },
  {
    slug: 'lail-o-nahar',
    name: 'Lail O Nahar Machinery Rentals',
    kind: 'client',
    label: 'Crane and aerial-work-platform rental, UAE',
    url: 'https://lailonahar-website.pages.dev/',
    image: lailONahar,
    imageAlt:
      'Home page of the Lail O Nahar website: a truck-mounted aerial work platform behind the headline "Heavy Machinery. Cranes & Aerial Work Platforms in the UAE" with Get a Free Quote and View Our Fleet buttons',
    blurb:
      'A rental website for a crane and man-lift company serving eight areas across the UAE: a fleet catalogue, 24/7 call and WhatsApp buttons and a free-quote form.',
    tags: ['Astro', 'Tailwind CSS', 'Local SEO', 'Light/dark theme'],
    metaTitle: 'Lail O Nahar Website: Equipment Rental Build | S. Attari',
    metaDescription:
      'A rental website for a UAE crane and man-lift company: fleet catalogue, 24/7 call and WhatsApp buttons, a free-quote form and local-business structured data.',
    h1: 'Lail O Nahar Machinery Rentals — equipment rental website',
    intro: [
      'Lail O Nahar rents cranes, man-lifts and aerial work platforms for construction, industrial and oil and gas projects, with certified operators and 24/7 availability across the UAE. Customers usually want a price quickly and often from a phone, so the site is built around getting a quote request or a call started in one tap.',
      'I designed and built it as a static Astro site: a fleet catalogue with a page per machine, a gallery, an about and a contact page, and a free-quote path that is always visible.',
    ],
    role: 'Website design and development',
    goal: 'Make it quick for contractors to see what machines are available and to ask for a quote by phone, WhatsApp or form.',
    built: [
      {
        title: 'Fleet catalogue',
        text: 'A page for each machine — boom lifts, scissor lifts, telescopic and truck-mounted man-lifts — written as structured content so adding a machine means adding one file.',
      },
      {
        title: 'Built for phones',
        text: 'A header call button, a floating WhatsApp button that opens a ready-written enquiry message, and a sticky call-to-action bar on mobile.',
      },
      {
        title: 'Free-quote form',
        text: 'A validated quote form delivered by Web3Forms, so the site needs no server of its own.',
      },
      {
        title: 'Local-business structured data',
        text: 'LocalBusiness data with the services and offers listed and the eight areas served, plus canonical URLs, social-sharing metadata and a sitemap.',
      },
      {
        title: 'Light and dark themes',
        text: 'A theme toggle that remembers the visitor’s choice, and page transitions that make the site feel like an app without the weight of a JavaScript framework.',
      },
    ],
    stack: [
      'Astro',
      'Tailwind CSS',
      'TypeScript',
      'MDX content collections',
      'View Transitions',
      'Web3Forms',
      'Cloudflare Pages',
    ],
    services: ['website-design-development', 'seo-performance'],
  },
  {
    slug: 'komorebi-cameron',
    name: 'Komorebi Cameron',
    kind: 'project',
    label: 'Studio website · Creative engineering',
    url: 'https://attari-home.github.io/Komorebi-Cameron/',
    image: komorebi,
    imageAlt:
      'Home page of the Komorebi Cameron studio website: a dark page with glowing pink petals behind the headline "Crafting Unforgettable Digital Experiences" and a theme toggle',
    blurb:
      'A flagship studio website with a custom canvas animation engine: drifting petals, a guide petal, selectable colour palettes and a light and dark theme.',
    tags: ['Astro', 'React islands', 'Canvas', 'Tailwind CSS'],
    metaTitle: 'Komorebi Cameron: Creative Studio Website | S. Attari',
    metaDescription:
      'A studio website with a custom canvas animation engine, colour palettes, light and dark themes and reduced-motion support, built with Astro and React islands.',
    h1: 'Komorebi Cameron — creative studio website',
    intro: [
      'Komorebi Cameron presents itself as a web development and creative engineering studio, and its website is built to show that: a dark, minimal page where a procedural blossom branch and falling petals are drawn on a canvas, and a guide petal drifts down the margins beside the content.',
      'It is shown here as one of my own projects, an example of how far a fast static site can go on motion and atmosphere without giving up performance or accessibility.',
    ],
    goal: 'A studio homepage that feels crafted: strong first impression, motion that respects the visitor, and the usual fundamentals (speed, accessibility, search markup) kept intact.',
    built: [
      {
        title: 'A custom canvas engine',
        text: 'Petals and a blossom branch are drawn by a small framework-free engine with a pooled petal system, seeded branch generation, wind sway, a quality governor that adapts to the device, and a pause when the tab is hidden. Phones get a lighter configuration.',
      },
      {
        title: 'Light and dark themes, and palettes',
        text: 'A theme applied before first paint so there is no flash, plus selectable petal palettes that drive both the animation and the interface accents. Light-mode colours are tuned for readable text contrast.',
      },
      {
        title: 'Motion that respects people',
        text: 'Reduced-motion fallbacks, large touch targets, a skip link and cursor-aware text effects that add atmosphere without hiding content.',
      },
      {
        title: 'Static by default, interactive where it counts',
        text: 'Astro renders the sections as static HTML; only the canvas, theme and palette controls, smooth scrolling and the contact form are React islands.',
      },
      {
        title: 'Search and sharing basics',
        text: 'Structured data for a professional service, a sitemap, font preloads and a social preview image.',
      },
    ],
    stack: ['Astro', 'React', 'TypeScript', 'Tailwind CSS', 'Canvas 2D', 'Lenis', 'GitHub Pages'],
    services: ['website-design-development'],
  },
  {
    slug: 'uae-information-chatbot',
    name: 'UAE Information AI Chatbot',
    kind: 'project',
    label: 'School robotics competition entry',
    url: 'https://attari-home.github.io/ai-chatbot-ali/',
    repo: 'https://github.com/Attari-Home/ai-chatbot-ali',
    image: uaeChatbot,
    imageAlt:
      "Home page of the robotics team's web app: a welcome headline and navigation to the AI chatbot, tourist spots, transport, events and emergency pages",
    blurb:
      'An Angular app built as a school robotics competition entry: a UAE information chatbot with 40 curated answers and Wikipedia look-ups, plus travel and emergency guides.',
    tags: ['Angular 17', 'TypeScript', 'Tailwind CSS', 'GitHub Pages'],
    metaTitle: 'UAE Information Chatbot: Angular 17 App | S. Attari',
    metaDescription:
      'An Angular 17 app for a school robotics competition: a UAE information chatbot with curated answers and Wikipedia look-ups, plus travel and emergency guides.',
    h1: 'UAE Information AI Chatbot — Angular web app',
    intro: [
      'This web app was built as an entry for a school robotics competition whose challenge was a UAE information chatbot. It pairs a chatbot with guide pages for the things visitors and residents ask about most: tourist spots, transport, events and emergency services.',
      'It is my own project rather than client work, and I show it as a compact example of an Angular 17 build that is live and deployed.',
    ],
    goal: 'The competition challenge: a chatbot that gives people information about UAE tourist spots, transport, cultural events and emergency services.',
    built: [
      {
        title: 'Chatbot with a curated question bank',
        text: 'Forty ready-made questions and answers about UAE attractions, getting around and culture, matched to what the visitor types, with quick-start buttons for each topic.',
      },
      {
        title: 'Live look-ups for UAE topics',
        text: 'For UAE-related questions the chatbot also searches Wikipedia and shows linked summaries, with a typing and searching indicator and a friendly fallback message if the look-up fails.',
      },
      {
        title: 'Guide pages',
        text: 'Separate pages for tourist spots, transport, events and emergency services, plus about, contact and privacy-policy pages. Every route is loaded on demand.',
      },
      {
        title: 'Modern Angular, deployed automatically',
        text: 'Standalone Angular components with lazy-loaded routes, Tailwind CSS styling, a light and dark theme service, and a GitHub Actions workflow that builds and publishes it to GitHub Pages on every push.',
      },
    ],
    scope:
      'Answers come from the curated bank and live Wikipedia look-ups. It is not backed by a large language model, and the PictoBlox AI integration named in the competition brief is not implemented yet.',
    stack: ['Angular 17', 'TypeScript', 'Tailwind CSS', 'RxJS', 'GitHub Actions', 'GitHub Pages'],
    services: ['web-application-development'],
  },
  {
    slug: 'hand-gesture-ai',
    name: 'HandGestureAI',
    kind: 'project',
    label: 'Open-source experiment · Computer vision',
    repo: 'https://github.com/Attari-Home/HandGestureAI',
    icon: 'fa6-solid:hand',
    blurb:
      'A Python program that reads the webcam, tracks both hands with MediaPipe and OpenCV, shows which fingers are raised and recognises an open hand, a fist and a peace sign.',
    tags: ['Python', 'MediaPipe', 'OpenCV', 'MIT licence'],
  },
];

/** Entries that have their own page (and a sitemap entry). */
export const workPages = work.filter(hasPage);

export const getWork = (slug: string) => workPages.find((w) => w.slug === slug);
