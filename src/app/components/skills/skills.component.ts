import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements OnInit {
  private readonly isBrowser: boolean;

  skillCategories = [
    {
      title: 'Leadership & Architecture',
      skills: [
        'Technical Team Leadership (team of 8)',
        'End-to-End Solution Architecture',
        'Organization-Wide Architectural Consultancy',
        'G2G (Government-to-Government) Integration Design',
        'Vendor Engagement & Technical Due-Diligence',
        'Performance Reviews, Mentoring & Growth Planning'
      ]
    },
    {
      title: '.NET & Backend',
      skills: [
        'ASP.NET Core / .NET 8, 10',
        'ASP.NET Web APIs & MVC, C#',
        'Microservices & RESTful API Design',
        'Windows Services & Background Workers',
        'Entity Framework Core, LINQ',
        'MS Graph APIs & Microsoft 365 Integration'
      ]
    },
    {
      title: 'Frontend',
      skills: [
        'Angular 7–18 (TypeScript)',
        'SPA, Lazy-Loading Modules, Standalone APIs',
        'RxJS, Reactive Forms, State Management',
        'HTML5, CSS3 / SCSS, Responsive Design',
        'Bootstrap, Material, PWA'
      ]
    },
    {
      title: 'Identity, Security & IAM',
      skills: [
        'OAuth 2.0 / OIDC / JWT (PKCE, On-Behalf-Of, Client Credentials)',
        'UAE PASS & Azure Entra ID SSO Federation',
        'Multi-Tenant IAM Design',
        'RBAC & Scoped Authorization',
        'Threat Modelling & Security-by-Design',
        'Secrets Management & Audit-Log Readiness'
      ]
    },
    {
      title: 'Databases',
      skills: [
        'Microsoft SQL Server (T-SQL)',
        'Oracle DB & PL/SQL',
        'Schema Design & Performance Tuning',
        'Stored Procedures, Functions, Triggers, Views'
      ]
    },
    {
      title: 'DevOps & CI/CD',
      skills: [
        'Azure DevOps Server 2022.2 (admin & owner)',
        'YAML Pipeline Templates (build / test / deploy)',
        'GitHub Actions, Jenkins',
        'SonarQube Quality Gates',
        'Self-Hosted Agents & Environment Promotion',
        'Branch Policies & Release Governance'
      ]
    },
    {
      title: 'Real-Time, Caching & Integration',
      skills: [
        'SignalR for live chat, voting, and notifications',
        'Redis Distributed Cache & Session Management',
        'Event-Driven & Webhook Integration Patterns',
        'MS Exchange / EWS, Active Directory / LDAP'
      ]
    },
    {
      title: 'Testing & Quality',
      skills: [
        'Playwright Test Automation',
        'Selenium (Parallel Frameworks)',
        'HP LoadRunner Performance Testing',
        'Unit & Integration Testing'
      ]
    },
    {
      title: 'AI Tooling & Agentic Workflows',
      skills: [
        'Model Context Protocol (MCP) Server Development',
        'AIRIA Orchestration: agents, RAG, guardrails, intent routing',
        'Retrieval-Augmented Generation (RAG) Pipelines',
        'GitHub Copilot & Prompt Engineering',
        'Engineering Workflow Automation'
      ]
    },
    {
      title: 'Methodology & Tooling',
      skills: [
        'Agile / Scrum / Kanban',
        'Azure Boards, JIRA, TFS',
        'OutSystems (Service & Integration Studio)',
        'Splunk — Observability & Log Analysis'
      ]
    }
  ];

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Reset scroll position when navigating to this component
    if (this.isBrowser) {
      window.scrollTo(0, 0);
    }
  }
}
