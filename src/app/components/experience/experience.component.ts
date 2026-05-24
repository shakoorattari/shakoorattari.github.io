import { Component, OnInit } from '@angular/core';

interface Project {
  name: string;
  period: string;
  stack: string[];
  role: string;
  highlights: string[];
}

interface CategorySection {
  title: string;
  icon: string;
  highlights: string[];
}

interface Job {
  period: string;
  isCurrent: boolean;
  title: string;
  company: string;
  location: string;
  summary: string;
  categories: CategorySection[];
  projects: Project[];
  technologies: string[];
  showDetails: boolean;
}

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent implements OnInit {

  toggleDetails(job: Job): void {
    job.showDetails = !job.showDetails;
  }

  jobs: Job[] = [
    {
      period: 'Jan 2023 — Present',
      isCurrent: true,
      title: 'Lead Software Engineer / Application Architect',
      company: 'Sharjah Digital Department (SDD)',
      location: 'Sharjah, UAE',
      summary: 'Engineering lead and organization-wide technical authority for a team of 8 engineers (2 front-end, 6 full-stack). End-to-end ownership of SDD\'s enterprise platform portfolio. Primary technical point of contact for G2G (Government-to-Government) service integrations, vendor engagements, and security compliance initiatives in partnership with Sharjah\'s Cyber Security and IT Security departments.',
      showDetails: true,
      categories: [
        {
          title: 'People Leadership & Delivery',
          icon: '👥',
          highlights: [
            'Lead, mentor, and conduct performance reviews for a cross-functional team of 8 engineers; define sprint goals, capacity plans, and individual growth paths aligned with organizational OKRs.',
            'Own delivery governance end-to-end — from requirements decomposition and architecture review through release sign-off — using Azure DevOps boards, pipelines, and quality gates.',
            'Drive CI/CD maturity across SDD: standardized pipeline templates, automated code-quality gates (SonarQube), branch strategies, and environment promotion workflows, reducing deployment risk and cycle time.'
          ]
        },
        {
          title: 'Architectural Consultancy & G2G Integration',
          icon: '🏗️',
          highlights: [
            'Organization-wide architectural consultant across multiple concurrent projects — advising on technology selection, integration patterns, data contracts, and system boundaries.',
            'Lead architecture and delivery of G2G (Government-to-Government) service integrations: inter-agency API contracts, secure data-exchange protocols, and compliance requirements across Sharjah government entities.',
            'Manage end-to-end vendor relationships and technical due-diligence: evaluating third-party platforms, negotiating integration approaches, and overseeing vendor delivery against agreed SLAs.',
            'Designed multi-tenant, API-first architectures with SSO (UAE PASS, Azure Entra ID), RBAC, and audit-ready security controls across all platforms.',
            'Defined reusable integration patterns (REST, event-driven, webhook) and platform components adopted org-wide, accelerating new project onboarding.'
          ]
        },
        {
          title: 'Cyber Security & IT Security Alignment',
          icon: '🔐',
          highlights: [
            'Primary engineering liaison with Sharjah Cyber Security Department and IT Security teams — translating security policies into actionable architectural controls and ensuring full compliance across the application estate.',
            'Embedded security-by-design principles: threat modelling, least-privilege RBAC, secure-by-default API configurations, secrets management, and audit-log readiness across all platforms.',
            'Led OAuth 2.0 / OIDC implementation (PKCE, token validation, audience scoping) and UAE PASS / Azure Entra ID SSO federation in alignment with Sharjah\'s identity governance standards.',
            'Conducted security architecture reviews for new initiatives and vendor-supplied components; tracked and remediated findings in collaboration with the Cyber Security Department.'
          ]
        },
        {
          title: 'Azure DevOps Administration & CI/CD Platform',
          icon: '⚙️',
          highlights: [
            'Sole owner and administrator of SDD\'s on-premises Azure DevOps Server 2022.2 — responsible for initial environment setup, upgrades, capacity planning, and ongoing platform health.',
            'Configured and maintain 20+ team projects with tailored process templates, repository policies, branch protection rules, and work-item configurations aligned to each team\'s delivery workflow.',
            'Provisioned and manage dozens of self-hosted build agents across multiple virtual machine environments; own agent pool strategy, resource allocation, and pipeline queue optimization.',
            'Authored and standardized organization-wide CI/CD pipeline templates (YAML) covering build, test, code-quality (SonarQube), artefact publishing, and multi-stage environment promotion.'
          ]
        },
        {
          title: 'AI Tooling — MCP Servers & Agentic Workflows',
          icon: '🤖',
          highlights: [
            'Architected and built a suite of Model Context Protocol (MCP) servers to integrate AI agents with SDD\'s internal systems, enabling context-aware automation across engineering and operational workflows.',
            'Azure DevOps MCP Server: exposes on-prem Azure DevOps Server 2022.2 as a structured context source for AI agents — covering projects, repositories, pipelines, work items, and build history.',
            'TransLynk MCP Server: scans application source code to extract all localization strings, auto-generates EN/AR translations, diffs against existing translations, and upserts only net-new entries.',
            'Active Directory MCP Server: structured query interface into on-prem AD — enabling identity lookups, group membership queries, and org-chart context resolution within agentic workflows.',
            'AIRIA Orchestration Platform: engineered AI agents, RAG pipelines, security guardrails, and intent-routing models within SDD\'s enterprise AIRIA environment for policy-compliant agentic automation.',
            'OnePortal AI Assistant: context-aware chatbot using AIRIA RAG pipelines — ingesting GRC policies, HR policies, IT help content, and the OnePortal service catalogue.'
          ]
        }
      ],
      projects: [
        {
          name: 'OnePortal IAM — Identity & Access Management',
          period: '2024 — Present',
          stack: ['.NET 8', 'ASP.NET Core', 'OAuth 2.0 / OIDC', 'Azure Entra ID', 'UAE PASS'],
          role: 'Application Architect & Technical Lead',
          highlights: [
            'Defined multi-tenant OAuth 2.0/OIDC flows (Authorization Code, Client Credentials, PKCE, On-Behalf-Of), token issuance strategy, and secure API protection patterns adopted across all SDD services.',
            'Established UAE PASS and Azure Entra ID SSO federation design — identity propagation contracts, trust boundaries, and integration standards for consuming applications.',
            'Authored tenant-aware RBAC architectural guidelines with fine-grained scope definitions; structured code reviews to ensure implementation fidelity and enforce security standards.',
            'Guided team on threat modelling, secure coding practices, and OAuth edge-case handling; reviewed pull requests and provided actionable, standards-aligned feedback.'
          ]
        },
        {
          name: 'OnePortal — Unified Digital Workplace',
          period: '2024 — Present',
          stack: ['.NET Core', 'Angular 18', 'MS Graph API', 'Microsoft 365', 'MS SQL Server'],
          role: 'Application Architect & Technical Lead',
          highlights: [
            'Defined end-to-end solution architecture: module boundaries, API contracts, integration patterns, data ownership, and security-by-design controls.',
            'Architected core platform modules — Service Catalog, Knowledge Hub, Microsoft 365 integrations (Teams / Planner / To Do via MS Graph API), and announcement engine.',
            'Designed workflow automation patterns for service requests, multi-level approval routing, and task orchestration; established least-privilege API access for all MS Graph integrations.',
            'Defined reporting and analytics dashboard architecture for KPI visibility on service adoption and usage trends.'
          ]
        },
        {
          name: 'SDD Announce — Multi-Tenant Campaign Platform',
          period: '2023 — Present',
          stack: ['.NET 8', 'ASP.NET Core Web APIs', 'Angular 14', 'SMTP Relay', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Designed and delivered a tenant-aware announcements platform with a rich content editor, configurable templates, and department-based targeting.',
            'Implemented customisable multi-level approval workflows per announcement type and organizational unit; enabled scheduling and automated SMTP distribution.',
            'Hardened platform for enterprise operations: auditability, RBAC, extensible configuration, and maintainable modular architecture.'
          ]
        },
        {
          name: 'AI Tooling Suite — MCP Servers & AIRIA Orchestration',
          period: '2024 — Present',
          stack: ['.NET', 'MCP Server SDK', 'Azure DevOps REST API', 'LDAP / Active Directory', 'AIRIA Platform'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Designed and delivered a suite of MCP servers bringing SDD\'s internal systems into AI agent context: Azure DevOps Server, Active Directory, and TransLynk localization platform.',
            'AIRIA Orchestration: engineered AI agents, RAG pipelines, security guardrails, and intent-routing models within SDD\'s enterprise environment for policy-compliant agentic automation.'
          ]
        }
      ],
      technologies: ['.NET 8 / .NET 10', 'ASP.NET Core', 'Angular 14–18', 'OAuth 2.0 / OIDC', 'UAE PASS', 'Azure Entra ID', 'MS SQL Server', 'Azure DevOps', 'SignalR', 'MCP Servers', 'AIRIA Platform', 'MS Graph API', 'Redis', 'SonarQube']
    },
    {
      period: '2018 — Dec 2022',
      isCurrent: false,
      title: 'Senior Full-Stack Developer',
      company: 'Department of eGovernment (now Sharjah Digital Department)',
      location: 'Sharjah, UAE',
      summary: 'Delivered enterprise platforms across Sharjah government entities. Built and shipped mission-critical applications covering legal services, employee engagement, room booking with Exchange integration, parliamentary session management, and large-scale government event orchestration.',
      showDetails: false,
      categories: [],
      projects: [
        {
          name: 'Legal Department of Sharjah — Public Web Portal & CMS',
          period: 'Sep 2022 — Dec 2022',
          stack: ['.NET Core 6', 'C#', 'Web APIs', 'Angular 14', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Built a multi-role CMS for public-facing content management, training application bookings, and admin approval workflows.',
            'Implemented Angular lazy-loading modules for optimised SPA performance; applied SEO best practices for public discoverability.'
          ]
        },
        {
          name: 'Announcements Management — Enterprise Notification Platform',
          period: 'Apr 2022 — Aug 2023',
          stack: ['.NET 6', 'C#', 'Web APIs', 'SignalR', 'Angular 14', 'OneSignal', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Designed a role-based announcement platform with a web-based rich text/graphics editor and multi-level approval workflows.',
            'Integrated OneSignal desktop push notifications; enabled team collaboration via inline HTML commenting.',
            'Built social engagement features for employee recognition (birthdays, promotions).'
          ]
        },
        {
          name: 'Meeting Rooms Booking System — Enterprise Room Management',
          period: 'Aug 2021 — 2022',
          stack: ['.NET Core 6', 'C#', 'Web APIs', 'Angular 12', 'EWS', 'Outlook Add-in', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Delivered a multi-role room booking platform covering tablet-based ad-hoc booking, entity admin management, and end-user Outlook integration.',
            'Developed a custom Outlook task-pane add-in with real-time free/busy validation against Exchange resource mailboxes.',
            'Built a Windows Service to synchronise Exchange calendar events with the application database via EWS subscription events.'
          ]
        },
        {
          name: 'Sessions Management System — Parliamentary Platform',
          period: 'Sep 2020 — Jan 2021',
          stack: ['.NET 4.8', 'C#', 'Web APIs', 'SignalR', 'Angular 9', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Delivered a multi-role platform managing session agendas, attendance, committee requests (leave/speak), and real-time voting.',
            'Implemented fully asynchronous server–client communication using SignalR and the Angular Observer pattern for instant polling with configurable timeouts.',
            'Integrated on-premises MS Exchange / Active Directory for authentication.'
          ]
        },
        {
          name: 'Event Management Solution — Government Event Platform',
          period: 'Mar 2019 — Oct 2019',
          stack: ['.NET 4.5', 'C#', 'MVC', 'SignalR', 'Selenium', 'MS SQL Server'],
          role: 'Senior Software Engineer (Full Stack)',
          highlights: [
            'Built a multi-module event platform: registrations/approvals, VIP management, Majlis bookings, live chat, large-file sharing, and audit logging.',
            'Created a native real-time chat module with SignalR (agent online/offline, offline message queuing).',
            'Built a Selenium-based parallel test automation framework with a web UI for test execution — accessible to all team members and managers.',
            'Authored and executed HP LoadRunner performance test scripts for key workflows.'
          ]
        }
      ],
      technologies: ['.NET Core 6 / .NET 4.8', 'Angular 9–14', 'C#', 'Web APIs', 'SignalR', 'MS SQL Server', 'EWS / MS Exchange', 'OneSignal', 'Selenium', 'HP LoadRunner']
    },
    {
      period: '2014 — 2019',
      isCurrent: false,
      title: 'Full-Stack Software Engineer',
      company: 'Emaratech, Dubai',
      location: 'Dubai, UAE',
      summary: 'Full-stack development across UAE government visa and immigration systems. Worked across the full software delivery lifecycle: feature development, CI/CD integration, test automation, performance testing, and BI dashboard engineering.',
      showDetails: false,
      categories: [],
      projects: [
        {
          name: 'Smart Channels — UAE Visa Application Portal (GDRFA)',
          period: 'Apr 2018 — Mar 2019',
          stack: ['OutSystems', '.NET 4.5', 'C#', 'Oracle DB', 'Selenium'],
          role: 'Full-Stack Developer',
          highlights: [
            'Delivered full-stack features for the GDRFA visa application portal serving typing centres, establishments, and individuals across Dubai and the GCC.',
            'Implemented EIDA (Emirates ID) biometric verification and OCR-based passport scanning to pre-fill application forms.',
            'Extended parallel Selenium test automation framework with a responsive web-based execution dashboard.'
          ]
        },
        {
          name: 'Vision eForm — UAE Visa Processing Platform',
          period: '2016 — 2018',
          stack: ['.NET 4.5', 'C#', 'MVC', 'ASP.NET', 'Redis Cache', 'Oracle DB', 'SonarQube', 'Jenkins'],
          role: 'Full-Stack Developer',
          highlights: [
            'Developed features across the visa processing pipeline: document management, multi-channel payments, approval routing, and automated visa generation via Windows Service.',
            'Implemented Redis distributed cache for session management, improving application scalability and resilience.',
            'Integrated SonarQube and Jenkins for continuous build and code quality analysis; authored unit tests for legacy code coverage.',
            'Added EIDA biometric and fingerprint verification for web application authentication.'
          ]
        },
        {
          name: 'Vision Tracker — ETL Monitoring Dashboard',
          period: '2014 — 2016',
          stack: ['.NET 4.5', 'ASP.NET', 'Web APIs', 'jQuery Charts', 'Oracle DB'],
          role: 'Full-Stack Developer (sole owner)',
          highlights: [
            'Designed and built a BI dashboard from scratch giving the operations team real-time visibility into ETL pipeline failures, error reasons, and application statuses across channels.',
            'Delivered interactive charts, filterable data tables, and a reporting module with export capabilities (Excel / PDF).'
          ]
        }
      ],
      technologies: ['.NET 4.5', 'C#', 'MVC / ASP.NET', 'OutSystems', 'Oracle DB', 'Redis Cache', 'Selenium', 'Jenkins', 'SonarQube', 'Windows Services']
    },
    {
      period: '2007 — 2013',
      isCurrent: false,
      title: 'Application & IT Support Engineer — eGates / Smart Gates',
      company: 'Emaratech, Sharjah',
      location: 'Sharjah, UAE',
      summary: 'Application and field support for Emaratech\'s biometric eGate systems at Dubai and Sharjah airports, Ajman, and UAQ immigration points — covering passport verifiers, facial-capture cameras, and iris scanners.',
      showDetails: false,
      categories: [],
      projects: [],
      technologies: ['Windows Applications', 'Biometric Systems', 'SQL Server', 'Field Operations', 'Passport Verifiers', 'Iris Scanners']
    }
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
