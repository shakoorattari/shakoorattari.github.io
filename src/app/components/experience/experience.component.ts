import { Component, OnInit } from '@angular/core';

interface Job {
  period: string;
  title: string;
  company: string;
  description: string;
  technologies: string[];
}

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent implements OnInit {
  jobs: Job[] = [
    {
      period: 'Jan 2023 — Present',
      title: 'Lead Software Engineer / Application Architect',
      company: 'Sharjah Digital Department (SDD) — formerly Department of eGovernment',
      description: 'Engineering lead for a team of 8 (2 front-end, 6 full-stack). Own end-to-end architecture across SDD\'s enterprise platform portfolio: OnePortal IAM (OAuth 2.0/OIDC, UAE PASS, Azure Entra ID), OnePortal digital workplace (MS Graph), SDD Announce, and an in-house AI tooling suite. Sole administrator of on-premises Azure DevOps Server 2022.2 — 20+ team projects, dozens of self-hosted agents, org-wide YAML pipeline templates. Primary engineering liaison with Sharjah\'s Cyber Security and IT Security departments.',
      technologies: ['.NET 8/10', 'ASP.NET Core', 'Angular 14–18', 'OAuth 2.0 / OIDC', 'UAE PASS', 'Azure Entra ID', 'MS SQL', 'Azure DevOps', 'MCP / AIRIA']
    },
    {
      period: '2018 — Dec 2022',
      title: 'Senior Full-Stack Developer',
      company: 'Department of eGovernment (now Sharjah Digital Department)',
      description: 'Delivered enterprise platforms across Sharjah government: Legal Department public portal & CMS, Announcements Management with OneSignal push, Meeting Rooms Booking with a custom Outlook add-in and Exchange EWS sync service, Sessions Management with SignalR real-time voting, and a government Event Management platform with native SignalR chat and a Selenium parallel-test framework.',
      technologies: ['.NET Core 6 / .NET 4.8', 'Angular 9–14', 'Web APIs', 'SignalR', 'MS SQL', 'EWS / MS Exchange', 'OneSignal']
    },
    {
      period: '2014 — 2019',
      title: 'Full-Stack Software Engineer',
      company: 'Emaratech, Dubai',
      description: 'Built and shipped GDRFA Smart Channels (OutSystems + .NET) with EIDA biometric verification and OCR passport scanning; Vision eForm visa processing pipeline (.NET 4.5, Redis, Oracle) with SonarQube and Jenkins CI; and Vision Tracker, a BI dashboard giving operations real-time visibility into ETL pipeline failures across channels.',
      technologies: ['.NET 4.5', 'C#', 'MVC / ASP.NET', 'OutSystems', 'Oracle DB', 'Redis', 'Selenium', 'Jenkins / SonarQube']
    },
    {
      period: '2007 — 2013',
      title: 'Application & IT Support Engineer — eGates / Smart Gates',
      company: 'Emaratech, Sharjah',
      description: 'Application and field support for Emaratech\'s biometric eGate systems at Dubai and Sharjah airports, Ajman and UAQ immigration points — passport verifiers, facial-capture cameras, and iris scanners.',
      technologies: ['Windows Apps', 'Biometric Devices', 'SQL', 'Field Operations']
    }
  ];

  ngOnInit(): void {
    // Reset scroll position when navigating to this component
    window.scrollTo(0, 0);
  }
}
