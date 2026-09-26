// Content for the About section. Icons use the "<set>:<name>" form understood by <Icon />.

export const aboutSummary = `Lead Software Engineer and Application Architect with 15+ years of enterprise software delivery across the UAE public sector. Deep expertise in .NET / ASP.NET Core, Angular, OAuth 2.0 / OIDC, multi-tenant IAM, and Azure DevOps CI/CD. I own end-to-end solution architecture — from requirements through production operations — for mission-critical government platforms serving multiple Sharjah entities, with a strong focus on clean code, developer experience, and AI tooling to accelerate engineering velocity.`;

export const professionalHighlights: string[] = [
  'Engineering lead for a cross-functional team of 8 (2 front-end, 6 full-stack) at Sharjah Digital Department',
  'Application Architect for OnePortal IAM — multi-tenant OAuth 2.0 / OIDC, UAE PASS & Azure Entra ID SSO federation',
  'Architected a suite of MCP servers (Azure DevOps, Active Directory, TransLynk) integrating AI agents with internal systems',
  'Sole administrator of on-premises Azure DevOps Server 2022.2 — 20+ team projects, dozens of self-hosted agents, org-wide YAML pipeline templates',
  'Primary engineering liaison with Sharjah Cyber Security & IT Security — security-by-design across the application estate',
  'Designed reusable, API-first integration patterns (REST, event-driven, webhook) adopted across SDD platforms'
];

export const professionalStats: { value: string; label: string }[] = [
  { value: '15+', label: 'Years Experience' },
  { value: '8', label: 'Engineers Led' },
  { value: '20+', label: 'Enterprise Projects' }
];

export interface PersonalInfo {
  label: string;
  value: string;
  icon: string;
  isLink: boolean;
  linkPrefix?: string;
  isExternal?: boolean;
}

export const personalInfo: PersonalInfo[] = [
  {
    label: 'Name',
    value: 'Shakoor Hussain Attari',
    icon: 'fa6-solid:user',
    isLink: false
  },
  {
    label: 'Email',
    value: 'binmushtaq@gmail.com',
    icon: 'fa6-solid:envelope',
    isLink: true,
    linkPrefix: 'mailto:',
    isExternal: false
  },
  {
    label: 'Phone',
    value: '+971 50 806 6735',
    icon: 'fa6-solid:phone',
    isLink: true,
    linkPrefix: 'tel:+',
    isExternal: false
  },
  {
    label: 'Location',
    value: 'Sharjah, UAE',
    icon: 'fa6-solid:location-dot',
    isLink: false
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/shakoorattari',
    icon: 'fa6-brands:linkedin',
    isLink: true,
    linkPrefix: 'https://www.',
    isExternal: true
  },
  {
    label: 'Availability',
    value: 'Open to Opportunities',
    icon: 'fa6-regular:calendar-check',
    isLink: false
  }
];

export const endorsements: { skill: string; count: number }[] = [
  { skill: '.NET / ASP.NET Core', count: 18 },
  { skill: 'Angular & TypeScript', count: 15 },
  { skill: 'OAuth 2.0 / OIDC & IAM', count: 12 },
  { skill: 'Azure DevOps & CI/CD', count: 14 },
  { skill: 'Microservices & REST APIs', count: 13 },
  { skill: 'AI Tooling & MCP Servers', count: 9 }
];

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  icon: string;
  link?: string;
}

export const certifications: Certification[] = [
  {
    name: 'MCTS — .NET 4.0 Web Applications',
    issuer: 'Microsoft',
    year: 'Microsoft',
    icon: 'fa6-brands:microsoft',
    link: 'https://learn.microsoft.com/en-us/credentials/'
  },
  {
    name: 'MCTS — SharePoint 2010 / 2013',
    issuer: 'Microsoft',
    year: 'Microsoft',
    icon: 'fa6-brands:microsoft',
    link: 'https://learn.microsoft.com/en-us/credentials/'
  },
  {
    name: 'Angular Development Training (v9–17)',
    issuer: 'Professional Training',
    year: 'Angular',
    icon: 'fa6-brands:angular',
    link: 'https://angular.dev'
  },
  {
    name: 'OutSystems Web Application Development',
    issuer: 'OutSystems',
    year: 'Low-Code',
    icon: 'fa6-solid:cubes',
    link: 'https://www.outsystems.com/'
  },
  {
    name: 'Flutter — Cross-Platform App Development',
    issuer: 'Professional Training',
    year: 'iOS · Android · Web · Desktop',
    icon: 'fa6-solid:mobile-screen',
    link: 'https://flutter.dev'
  },
  {
    name: 'Splunk — Searching, Monitoring & Analysing Machine Data',
    issuer: 'Professional Training',
    year: 'Observability',
    icon: 'fa6-solid:chart-line',
    link: 'https://www.splunk.com/'
  }
];
