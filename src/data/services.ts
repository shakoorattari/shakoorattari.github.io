// Service landing pages. Every claim here is drawn from the résumé / experience data — keep it that way.
// metaTitle <= 60 chars and metaDescription <= 155 chars are enforced by `npm run check:seo`.

export interface Service {
  slug: string;
  /** Short label used in cards and navigation. */
  name: string;
  /** One-to-two sentence summary for cards and the hub page. */
  blurb: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  deliver: { title: string; text: string }[];
  selectedWork: { name: string; text: string; href?: string }[];
  stack: string[];
  /** Case-study slugs (see caseStudies.ts). */
  caseStudies: string[];
  /** Other service slugs to cross-link. */
  related: string[];
}

export const services: Service[] = [
  {
    slug: 'web-application-development',
    name: 'Web & Application Development',
    blurb: 'Custom web platforms, portals and CMS built end to end with ASP.NET Core and Angular.',
    icon: 'fa6-solid:laptop-code',
    metaTitle: 'Web & Application Development, UAE | Shakoor Attari',
    metaDescription:
      "Custom web and enterprise apps with ASP.NET Core and Angular: portals, CMS, workflows and real-time features. UAE-based engineer, 15+ years' experience.",
    h1: 'Web & Application Development',
    intro: [
      'I design and build web applications end to end: requirements, architecture, back end, front end, deployment and support. Over 15+ years most of that work has been production systems for UAE government entities — public portals, internal platforms, approval workflows and real-time tools that had to be secure, auditable and easy to maintain.',
      'My core stack is ASP.NET Core / .NET 8 with C#, Angular (TypeScript) and Microsoft SQL Server or Oracle. The same discipline applies whether the brief is a public website with a CMS or a multi-role enterprise platform: clear module boundaries, API-first contracts, sensible security defaults and code that other people can pick up.',
      'This portfolio is a small example of the same care on the front end: a static site that scores 100 in all four Lighthouse categories in lab tests and ships about 2 KB of JavaScript.',
    ],
    deliver: [
      {
        title: 'Enterprise web platforms',
        text: 'Multi-role, tenant-aware applications with role-based access control, configurable approval workflows, scheduling and audit trails — for example an announcements and campaign platform with a rich content editor, templates and department-based targeting.',
      },
      {
        title: 'Public websites and CMS',
        text: 'Public-facing portals with content management, online bookings and admin approval flows, built as Angular single-page apps with lazy-loaded modules and SEO best practices.',
      },
      {
        title: 'Real-time features',
        text: 'Live chat, voting and notifications with SignalR — including a parliamentary-session platform with real-time voting and a chat module with offline message queuing.',
      },
      {
        title: 'Integrations that make it useful',
        text: 'Microsoft 365 (Teams, Planner, To Do via MS Graph), Exchange and Outlook add-ins, SMTP distribution and push notifications.',
      },
      {
        title: 'Quality built in',
        text: 'Unit and integration tests, Playwright and Selenium automation, SonarQube quality gates and load testing, wired into CI/CD.',
      },
    ],
    selectedWork: [
      {
        name: 'OnePortal — unified digital workplace',
        text: '.NET Core, Angular, MS Graph. Service catalogue, knowledge hub and workflow automation for a government service hub.',
        href: '/projects/oneportal-digital-workplace/',
      },
      {
        name: 'SDD Announce — multi-tenant announcement platform',
        text: '.NET 8, Angular 14, SQL Server. Tenant-aware platform with configurable templates, multi-level approval workflows, scheduling and automated SMTP distribution.',
      },
      {
        name: 'Legal Department of Sharjah — public web portal & CMS',
        text: '.NET Core 6, Angular 14. Multi-role CMS for public content, training-application bookings and admin approval workflows.',
      },
      {
        name: 'Sessions Management System',
        text: '.NET 4.8, SignalR, Angular 9. Session agendas, attendance, committee requests and real-time voting.',
      },
    ],
    stack: [
      'ASP.NET Core / .NET 8',
      'C#',
      'Angular',
      'TypeScript',
      'MS SQL Server',
      'Oracle',
      'SignalR',
      'Redis',
      'MS Graph API',
      'Playwright',
      'SonarQube',
    ],
    caseStudies: ['oneportal-digital-workplace'],
    related: ['api-integration-microservices', 'devops-ci-cd', 'architecture-technical-leadership'],
  },
  {
    slug: 'identity-sso-oauth',
    name: 'Identity, SSO & OAuth 2.0 / OIDC',
    blurb: 'Multi-tenant authorization servers, UAE PASS and Azure Entra ID SSO, RBAC and secure API design.',
    icon: 'fa6-solid:shield-halved',
    metaTitle: 'OAuth 2.0 / OIDC, SSO & UAE PASS Consulting | S. Attari',
    metaDescription:
      'OAuth 2.0 / OIDC architecture, multi-tenant IAM, UAE PASS and Azure Entra ID SSO for .NET platforms, from an engineer who built it for UAE government.',
    h1: 'Identity, SSO & OAuth 2.0 / OIDC',
    intro: [
      "Identity is the part of a platform that is hardest to retrofit. I've been the application architect for a multi-tenant identity and access management (IAM) platform serving multiple Sharjah government entities — an OAuth 2.0 / OpenID Connect authorization server that other teams' applications and APIs rely on.",
      'That work covers the whole chain: how tokens are issued and validated, how tenants stay isolated, how scopes and roles map to permissions, and how sign-in federates in through UAE PASS and Azure Entra ID.',
      "If you're integrating UAE PASS, adding single sign-on to an existing platform, or designing an authorization server for several tenants, this is the work I can help with.",
    ],
    deliver: [
      {
        title: 'OAuth 2.0 / OIDC flow design',
        text: 'Authorization Code with PKCE, Client Credentials and On-Behalf-Of flows, token issuance strategy, audience validation and secure API protection patterns.',
      },
      {
        title: 'Multi-tenant IAM',
        text: 'Tenant isolation, tenant-aware RBAC and fine-grained scope definitions, so each entity sees and controls only its own data.',
      },
      {
        title: 'UAE PASS and Azure Entra ID federation',
        text: 'Identity-propagation contracts, trust boundaries and integration standards for the applications that consume sign-in.',
      },
      {
        title: 'Security-by-design reviews',
        text: 'Threat modelling, least-privilege access, secure-by-default API configuration, secrets management and audit-log readiness, plus security architecture reviews of new initiatives and vendor-supplied components.',
      },
      {
        title: 'Guidance for your team',
        text: 'Architecture guidelines, structured code reviews and coaching on OAuth edge cases and secure coding practices.',
      },
    ],
    selectedWork: [
      {
        name: 'OnePortal IAM — authorization server',
        text: ".NET 8, ASP.NET Core. Multi-tenant OAuth 2.0 / OIDC authority with UAE PASS and Azure Entra ID federation, adopted across the department's services.",
        href: '/projects/oneportal-iam/',
      },
      {
        name: 'Cyber-security alignment',
        text: "Primary engineering liaison with Sharjah's Cyber Security and IT Security teams, translating security policy into concrete architectural controls across the application estate.",
      },
    ],
    stack: [
      'OAuth 2.0',
      'OpenID Connect',
      'JWT',
      'PKCE',
      'UAE PASS',
      'Azure Entra ID',
      'ASP.NET Core / .NET 8',
      'RBAC',
      'Threat modelling',
    ],
    caseStudies: ['oneportal-iam'],
    related: ['api-integration-microservices', 'architecture-technical-leadership'],
  },
  {
    slug: 'api-integration-microservices',
    name: 'APIs, Integration & Microservices',
    blurb:
      'REST and event-driven integration, G2G data exchange, and Microsoft 365 / Exchange / Active Directory integrations.',
    icon: 'fa6-solid:diagram-project',
    metaTitle: 'API, Integration & Microservices Development | S. Attari',
    metaDescription:
      'REST API design, microservices and integrations (MS Graph, Exchange, Active Directory, G2G) for .NET platforms, from a UAE-based senior engineer.',
    h1: 'APIs, Integration & Microservices',
    intro: [
      'Most enterprise software is really integration work: getting systems that were never designed together to exchange data safely. I design API-first architectures and the integration patterns around them — REST, event-driven and webhook — and I have led government-to-government (G2G) integrations where inter-agency contracts, secure data exchange and compliance all had to line up.',
      'I also build the integrations themselves: Microsoft 365 through MS Graph (Teams, Planner, To Do), Exchange and Outlook through EWS, Active Directory / LDAP, SMTP and push-notification services.',
    ],
    deliver: [
      {
        title: 'API-first design',
        text: 'Module boundaries, API contracts and data-ownership decisions that let several teams build in parallel.',
      },
      {
        title: 'G2G and cross-entity integration',
        text: 'Inter-agency API contracts, secure data-exchange protocols and compliance requirements across Sharjah government entities.',
      },
      {
        title: 'Reusable integration patterns',
        text: 'REST, event-driven and webhook patterns packaged as platform components adopted organisation-wide, so new projects onboard faster.',
      },
      {
        title: 'Microsoft ecosystem integrations',
        text: 'MS Graph with least-privilege access, Exchange calendar sync through EWS subscription events (via a Windows Service), Outlook task-pane add-ins and Active Directory / LDAP lookups.',
      },
      {
        title: 'Performance and resilience',
        text: 'Redis distributed caching for session management and scale; SignalR for real-time updates.',
      },
    ],
    selectedWork: [
      {
        name: 'OnePortal — unified digital workplace',
        text: 'MS Graph integrations for Teams, Planner and To Do with least-privilege API access, plus a service catalogue and workflow automation.',
        href: '/projects/oneportal-digital-workplace/',
      },
      {
        name: 'Meeting Rooms Booking System',
        text: 'A custom Outlook add-in with real-time free/busy validation against Exchange resource mailboxes, and a Windows Service that syncs calendar events via EWS.',
      },
      {
        name: 'Vision eForm — visa processing platform',
        text: 'Redis distributed cache for session management, multi-channel payments and automated visa generation through a Windows Service.',
      },
    ],
    stack: [
      'REST',
      'Microservices',
      'MS Graph API',
      'Exchange / EWS',
      'Active Directory / LDAP',
      'SignalR',
      'Redis',
      'Webhooks',
      '.NET',
    ],
    caseStudies: ['oneportal-digital-workplace'],
    related: ['web-application-development', 'identity-sso-oauth', 'architecture-technical-leadership'],
  },
  {
    slug: 'architecture-technical-leadership',
    name: 'Architecture & Technical Leadership',
    blurb: 'Solution architecture, architecture reviews, vendor due diligence and leading engineering teams.',
    icon: 'fa6-solid:sitemap',
    metaTitle: 'Solution Architecture & Tech Leadership | S. Attari',
    metaDescription:
      'End-to-end solution architecture, architecture reviews and engineering leadership from a lead engineer running a team of eight in the UAE public sector.',
    h1: 'Architecture & Technical Leadership',
    intro: [
      "I lead engineering for Sharjah Digital Department's enterprise platform portfolio: a team of eight engineers (two front-end, six full-stack) and the architecture behind several concurrent projects.",
      'That means owning delivery from requirements decomposition through architecture review to release sign-off, and being the technical point of contact for government-to-government integrations, vendors and security teams.',
    ],
    deliver: [
      {
        title: 'Solution architecture',
        text: 'Module boundaries, API contracts, integration patterns, data ownership and security controls — documented so teams can build against them.',
      },
      {
        title: 'Architecture reviews and consultancy',
        text: 'Technology selection, integration patterns and system boundaries across concurrent projects, plus architecture reviews of new initiatives.',
      },
      {
        title: 'Vendor due diligence',
        text: 'Evaluating third-party platforms, negotiating integration approaches and overseeing vendor delivery against agreed SLAs.',
      },
      {
        title: 'Team leadership',
        text: 'Mentoring, performance reviews, sprint goals and capacity planning aligned with organisational objectives.',
      },
      {
        title: 'Delivery governance',
        text: 'Structured code reviews, quality gates, branch strategies and release sign-off.',
      },
    ],
    selectedWork: [
      {
        name: 'OnePortal — architect and technical lead',
        text: 'Solution architecture for a unified digital workplace: module boundaries, API contracts, integration patterns and code-review governance.',
        href: '/projects/oneportal-digital-workplace/',
      },
      {
        name: 'OnePortal IAM — architect and technical lead',
        text: 'Architecture and standards for a multi-tenant identity platform used across the department.',
        href: '/projects/oneportal-iam/',
      },
    ],
    stack: [
      'Solution architecture',
      'Agile / Scrum / Kanban',
      'Azure DevOps',
      'Code review',
      'Technical due diligence',
    ],
    caseStudies: ['oneportal-iam', 'oneportal-digital-workplace'],
    related: ['identity-sso-oauth', 'api-integration-microservices', 'devops-ci-cd'],
  },
  {
    slug: 'devops-ci-cd',
    name: 'DevOps & CI/CD',
    blurb: 'Azure DevOps administration, YAML pipeline templates, quality gates and environment promotion.',
    icon: 'fa6-solid:gears',
    metaTitle: 'Azure DevOps & CI/CD Pipelines | Shakoor Attari',
    metaDescription:
      'Azure DevOps Server administration, YAML pipeline templates, SonarQube quality gates and release governance from a UAE-based engineer.',
    h1: 'DevOps & CI/CD',
    intro: [
      "I'm the sole owner and administrator of my organisation's on-premises Azure DevOps Server 2022.2 — from initial setup and upgrades to capacity planning and day-to-day platform health.",
      "On top of that platform I've standardised how teams build and ship: organisation-wide YAML pipeline templates, SonarQube quality gates, branch policies and multi-stage environment promotion.",
    ],
    deliver: [
      {
        title: 'Azure DevOps Server administration',
        text: '20+ team projects with tailored process templates, repository policies, branch protection rules and work-item configuration.',
      },
      {
        title: 'Build agent infrastructure',
        text: 'Dozens of self-hosted agents across multiple VM environments, with agent-pool strategy and pipeline-queue optimisation.',
      },
      {
        title: 'Standard pipeline templates',
        text: 'Reusable YAML covering build, test, code-quality analysis, artefact publishing and multi-stage environment promotion.',
      },
      {
        title: 'Quality gates and release governance',
        text: 'SonarQube quality gates, branch strategies and release sign-off that reduce deployment risk and cycle time.',
      },
      {
        title: 'Other CI/CD tooling',
        text: 'GitHub Actions and Jenkins.',
      },
    ],
    selectedWork: [
      {
        name: 'Azure DevOps MCP server',
        text: 'Exposes the on-premises Azure DevOps Server as structured context for AI agents — projects, repositories, pipelines, work items and build history.',
        href: '/services/ai-tooling-mcp/',
      },
      {
        name: 'This site',
        text: 'GitHub Actions type-checks, builds and deploys this portfolio to GitHub Pages on every merge.',
      },
    ],
    stack: [
      'Azure DevOps Server 2022.2',
      'YAML pipelines',
      'SonarQube',
      'GitHub Actions',
      'Jenkins',
      'Self-hosted agents',
    ],
    caseStudies: [],
    related: ['architecture-technical-leadership', 'ai-tooling-mcp', 'web-application-development'],
  },
  {
    slug: 'ai-tooling-mcp',
    name: 'AI Tooling & MCP Servers',
    blurb:
      'Model Context Protocol servers, RAG pipelines and agent orchestration that bring internal systems into AI workflows safely.',
    icon: 'fa6-solid:robot',
    metaTitle: 'MCP Servers, RAG & AI Agent Tooling | Shakoor Attari',
    metaDescription:
      'Model Context Protocol (MCP) servers, RAG pipelines and guarded AI agents built on .NET to connect internal engineering systems to AI safely.',
    h1: 'AI Tooling & MCP Servers',
    intro: [
      'I build the plumbing that lets AI agents work with real internal systems without exposing sensitive data. At Sharjah Digital Department I architected a suite of Model Context Protocol (MCP) servers and engineered agents, retrieval-augmented generation (RAG) pipelines and guardrails on the AIRIA orchestration platform.',
    ],
    deliver: [
      {
        title: 'MCP servers',
        text: 'Structured, permission-aware interfaces to internal systems: an Azure DevOps Server MCP server (projects, repositories, pipelines, work items, build history), an Active Directory MCP server for identity and group lookups, and a localisation MCP server.',
      },
      {
        title: 'Localisation automation',
        text: 'The TransLynk MCP server scans application source for UI strings, generates English and Arabic translations, diffs them against existing translations and upserts only net-new entries.',
      },
      {
        title: 'Agents, RAG and guardrails',
        text: 'AI agents, RAG pipelines, security guardrails and intent-based tool routing for policy-compliant automation.',
      },
      {
        title: 'Internal AI assistants',
        text: 'A context-aware assistant that answers from governance, HR and IT policy content and the service catalogue using RAG.',
      },
      {
        title: 'AI-assisted engineering',
        text: 'GitHub Copilot and prompt engineering to accelerate day-to-day development workflows.',
      },
    ],
    selectedWork: [
      {
        name: 'AI Tooling Suite — MCP servers & AIRIA orchestration',
        text: '.NET, MCP server SDK, Azure DevOps REST API, LDAP / Active Directory, AIRIA platform.',
        href: '/projects/ai-tooling-suite/',
      },
      {
        name: 'OnePortal AI Assistant',
        text: 'A context-aware chatbot inside OnePortal using AIRIA RAG pipelines over policy content and the service catalogue.',
      },
    ],
    stack: [
      'Model Context Protocol (MCP)',
      '.NET',
      'AIRIA',
      'RAG',
      'Azure DevOps REST API',
      'LDAP / Active Directory',
      'GitHub Copilot',
    ],
    caseStudies: ['ai-tooling-suite'],
    related: ['devops-ci-cd', 'identity-sso-oauth'],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
