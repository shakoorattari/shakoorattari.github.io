import { Component, OnInit } from '@angular/core';

interface Project {
  title: string;
  description: string;
  technologies: string[];
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [
    {
      title: 'OnePortal IAM — Authorization Server',
      description: 'Multi-tenant Identity & Access Management platform powering all SDD services: OAuth 2.0 / OIDC flows (Authorization Code + PKCE, Client Credentials, On-Behalf-Of), tenant-aware RBAC with fine-grained scopes, and SSO federation with UAE PASS and Azure Entra ID.',
      technologies: ['.NET 8', 'ASP.NET Core', 'OAuth 2.0 / OIDC', 'UAE PASS', 'Azure Entra ID']
    },
    {
      title: 'OnePortal — Unified Digital Workplace',
      description: 'Government service hub for SDD: Service Catalog, Knowledge Hub, announcement engine, and Microsoft 365 collaboration (Teams / Planner / To Do via MS Graph) with multi-level approval workflows and least-privilege API access standards.',
      technologies: ['.NET Core', 'Angular', 'MS Graph API', 'Microsoft 365']
    },
    {
      title: 'AI Tooling Suite — MCP Servers & AIRIA',
      description: 'Suite of Model Context Protocol servers bringing SDD\'s internal systems into AI agent context — Azure DevOps Server, Active Directory, and the TransLynk localization platform. AIRIA orchestration of agents, RAG pipelines, security guardrails, and intent-routing.',
      technologies: ['.NET', 'MCP SDK', 'Azure DevOps API', 'LDAP / AD', 'AIRIA / RAG']
    },
    {
      title: 'SDD Announce — Multi-Tenant Announcements',
      description: 'Tenant-aware announcements platform with rich content editor, configurable templates, department-based targeting, customisable multi-level approval workflows, scheduling, and automated SMTP distribution.',
      technologies: ['.NET 8', 'Angular 14', 'SMTP Relay', 'MS SQL']
    },
    {
      title: 'Meeting Rooms Booking System',
      description: 'Multi-role room booking platform with tablet-based ad-hoc booking, entity admin management, custom Outlook task-pane add-in with real-time free/busy validation, and a Windows Service that synchronises Exchange calendar events via EWS subscription.',
      technologies: ['.NET Core 6', 'Angular 12', 'EWS', 'Outlook Add-in', 'MS SQL']
    },
    {
      title: 'Sessions Management System',
      description: 'Parliamentary / committee session platform: agendas, attendance, leave/speak requests, and real-time voting using fully asynchronous SignalR communication with configurable timeouts and Exchange / AD authentication.',
      technologies: ['.NET 4.8', 'Angular 9', 'SignalR', 'MS SQL']
    },
    {
      title: 'Smart Channels (GDRFA Visa Portal)',
      description: 'Full-stack delivery of the GDRFA visa application portal for typing centres, establishments and individuals across Dubai and the GCC — EIDA biometric verification, OCR passport scanning, and a parallel Selenium test execution dashboard.',
      technologies: ['OutSystems', '.NET 4.5', 'Oracle DB', 'Selenium']
    },
    {
      title: 'Vision Tracker — ETL Monitoring Dashboard',
      description: 'BI dashboard giving the operations team real-time visibility into ETL pipeline failures, error reasons, and application statuses across channels — interactive charts, filterable data tables, and Excel / PDF reporting.',
      technologies: ['.NET 4.5', 'Web APIs', 'jQuery Charts', 'Oracle DB']
    }
  ];

  ngOnInit(): void {
    // Reset scroll position when navigating to this component
    window.scrollTo(0, 0);
  }
}
