import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

// Declare AOS (Animate On Scroll) library if you're using it
declare const AOS: any;

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  private readonly isBrowser: boolean;
  isAvailableForWork = true;

  aboutSummary = `Lead Software Engineer and Application Architect with 15+ years of enterprise software delivery across the UAE public sector. Deep expertise in .NET / ASP.NET Core, Angular, OAuth 2.0 / OIDC, multi-tenant IAM, and Azure DevOps CI/CD. I own end-to-end solution architecture — from requirements through production operations — for mission-critical government platforms serving multiple Sharjah entities, with a strong focus on clean code, developer experience, and AI tooling to accelerate engineering velocity.`;

  professionalHighlights = [
    'Engineering lead for a cross-functional team of 8 (2 front-end, 6 full-stack) at Sharjah Digital Department',
    'Application Architect for OnePortal IAM — multi-tenant OAuth 2.0 / OIDC, UAE PASS & Azure Entra ID SSO federation',
    'Architected a suite of MCP servers (Azure DevOps, Active Directory, TransLynk) integrating AI agents with internal systems',
    'Sole administrator of on-premises Azure DevOps Server 2022.2 — 20+ team projects, dozens of self-hosted agents, org-wide YAML pipeline templates',
    'Primary engineering liaison with Sharjah Cyber Security & IT Security — security-by-design across the application estate',
    'Designed reusable, API-first integration patterns (REST, event-driven, webhook) adopted across SDD platforms'
  ];

  professionalStats = [
    { value: '15+', label: 'Years Experience' },
    { value: '8', label: 'Engineers Led' },
    { value: '20+', label: 'Enterprise Projects' }
  ];

  personalInfo = [
    {
      label: 'Name',
      value: 'Shakoor Hussain Attari',
      icon: 'fas fa-user',
      isLink: false
    },
    {
      label: 'Email',
      value: 'binmushtaq@gmail.com',
      icon: 'fas fa-envelope',
      isLink: true,
      linkPrefix: 'mailto:',
      isExternal: false
    },
    {
      label: 'Phone',
      value: '+971 50 806 6735',
      icon: 'fas fa-phone',
      isLink: true,
      linkPrefix: 'tel:+',
      isExternal: false
    },
    {
      label: 'Location',
      value: 'Sharjah, UAE',
      icon: 'fas fa-map-marker-alt',
      isLink: false
    },
    {
      label: 'LinkedIn',
      value: 'linkedin.com/in/shakoorattari',
      icon: 'fab fa-linkedin',
      isLink: true,
      linkPrefix: 'https://www.',
      isExternal: true
    },
    {
      label: 'Availability',
      value: 'Open to Opportunities',
      icon: 'far fa-calendar-check',
      isLink: false
    }
  ];

  endorsements = [
    { skill: '.NET / ASP.NET Core', count: 18 },
    { skill: 'Angular & TypeScript', count: 15 },
    { skill: 'OAuth 2.0 / OIDC & IAM', count: 12 },
    { skill: 'Azure DevOps & CI/CD', count: 14 },
    { skill: 'Microservices & REST APIs', count: 13 },
    { skill: 'AI Tooling & MCP Servers', count: 9 }
  ];

  certifications = [
    {
      name: 'MCTS — .NET 4.0 Web Applications',
      issuer: 'Microsoft',
      year: 'Microsoft',
      icon: 'fab fa-microsoft',
      link: 'https://learn.microsoft.com/en-us/credentials/'
    },
    {
      name: 'MCTS — SharePoint 2010 / 2013',
      issuer: 'Microsoft',
      year: 'Microsoft',
      icon: 'fab fa-microsoft',
      link: 'https://learn.microsoft.com/en-us/credentials/'
    },
    {
      name: 'Angular Development Training (v9–17)',
      issuer: 'Professional Training',
      year: 'Angular',
      icon: 'fab fa-angular',
      link: 'https://angular.dev'
    },
    {
      name: 'OutSystems Web Application Development',
      issuer: 'OutSystems',
      year: 'Low-Code',
      icon: 'fas fa-cubes',
      link: 'https://www.outsystems.com/'
    },
    {
      name: 'Flutter — Cross-Platform App Development',
      issuer: 'Professional Training',
      year: 'iOS · Android · Web · Desktop',
      icon: 'fas fa-mobile-screen',
      link: 'https://flutter.dev'
    },
    {
      name: 'Splunk — Searching, Monitoring & Analysing Machine Data',
      issuer: 'Professional Training',
      year: 'Observability',
      icon: 'fas fa-chart-line',
      link: 'https://www.splunk.com/'
    }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    // Initialize AOS animation library if available
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
    }
    
    // Reset scroll position when navigating to this component
    window.scrollTo(0, 0);
  }

  scrollToContact(): void {
    // Update URL
    this.router.navigate(['/contact']);
    
    // Scroll to contact section if it exists on the current page
    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById('contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  getEndorsementPercentage(count: number): number {
    const maxCount = Math.max(...this.endorsements.map(e => e.count));
    return (count / maxCount) * 100;
  }

  getEndorsementLevel(count: number): number {
    if (count >= 15) return 3; // Expert
    if (count >= 10) return 2; // Advanced
    return 1; // Intermediate
  }
}
