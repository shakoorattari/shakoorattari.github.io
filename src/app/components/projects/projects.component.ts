import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Project {
  title: string;
  challenge: string;
  architecture: string;
  impact: string;
  technologies: string[];
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  private readonly isBrowser: boolean;

  projects: Project[] = [
    {
      title: 'OnePortal IAM — Authorization Server',
      challenge: 'Unify identity, SSO, and authorization for multiple government entities while preserving strict tenant isolation.',
      architecture: 'Designed a multi-tenant OAuth 2.0 / OIDC authority with PKCE, Client Credentials, and On-Behalf-Of flows, tenant-aware RBAC scopes, and federation to UAE PASS + Azure Entra ID.',
      impact: 'Standardized secure token and scope contracts across SDD platforms, reduced integration ambiguity for teams, and strengthened security posture for cross-entity services.',
      technologies: ['.NET 8', 'ASP.NET Core', 'OAuth 2.0 / OIDC', 'UAE PASS', 'Azure Entra ID']
    },
    {
      title: 'OnePortal — Unified Digital Workplace Core',
      challenge: 'Consolidate fragmented departmental service workflows into one secure, scalable platform with measurable adoption.',
      architecture: 'Implemented modular domain boundaries for Service Catalog, Knowledge Hub, and Microsoft 365 integrations (Teams, Planner, To Do) using API-first contracts and policy-based authorization.',
      impact: 'Improved delivery throughput for cross-team features, reduced duplicated workflows, and enabled clearer KPI visibility through centralized service telemetry.',
      technologies: ['.NET Core', 'Angular', 'MS Graph API', 'Microsoft 365']
    },
    {
      title: 'AI Tooling Suite — MCP Servers & AIRIA',
      challenge: 'Bring internal engineering systems into safe AI context without exposing sensitive enterprise data.',
      architecture: 'Built MCP servers for Azure DevOps, Active Directory, and localization workflows, then orchestrated AIRIA agents through RAG pipelines, guardrails, and intent-based tool routing.',
      impact: 'Cut manual operational lookup time, accelerated engineering workflows with context-aware AI actions, and maintained policy-aligned access boundaries.',
      technologies: ['.NET', 'MCP SDK', 'Azure DevOps API', 'LDAP / AD', 'AIRIA / RAG']
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
