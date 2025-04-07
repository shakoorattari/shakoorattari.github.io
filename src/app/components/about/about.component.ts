import { Component, OnInit } from '@angular/core';
import { ViewportScroller } from '@angular/common';

// Declare AOS (Animate On Scroll) library if you're using it
declare const AOS: any;

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  isAvailableForWork = true;

  aboutSummary = `I'm a Senior Full Stack Developer with 15+ years of experience crafting robust, 
  scalable applications using .NET and Angular. My expertise spans both front-end and back-end development, 
  with a strong focus on delivering high-quality solutions that solve real business problems. 
  I excel at translating complex requirements into elegant code while maintaining best practices.`;

  professionalHighlights = [
    'Expert in Angular development with deep knowledge of RxJS, NgRx, and performance optimization',
    'Comprehensive experience with .NET ecosystem including ASP.NET Core, EF Core, and Azure integration',
    'Extensive background in building secure, scalable API architectures and microservices',
    'Strong database design and optimization skills across SQL Server, Oracle, and NoSQL solutions',
    'Proven ability to lead development teams and mentor junior developers'
  ];

  professionalStats = [
    { value: '15+', label: 'Years Experience' },
    { value: '30+', label: 'Projects Completed' },
    { value: '5+', label: 'Large Enterprise Solutions' }
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
      value: '+971 50 8066 735',
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
    { skill: '.NET Development', count: 15 },
    { skill: 'Angular', count: 12 },
    { skill: 'Database Development', count: 10 },
    { skill: 'Full Stack Development', count: 18 },
    { skill: 'API Design', count: 14 },
    { skill: 'Azure DevOps', count: 9 }
  ];

  certifications = [
    {
      name: 'Microsoft Certified: Azure Developer Associate',
      issuer: 'Microsoft',
      year: '2022',
      icon: 'fab fa-microsoft',
      link: '#'
    },
    {
      name: 'Angular Developer Certification',
      issuer: 'Google',
      year: '2021',
      icon: 'fab fa-angular',
      link: '#'
    },
    {
      name: 'Oracle Database SQL Certified Associate',
      issuer: 'Oracle',
      year: '2020',
      icon: 'fas fa-database',
      link: '#'
    }
  ];

  constructor(private viewportScroller: ViewportScroller) { }

  ngOnInit(): void {
    // Initialize AOS animation library if available
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
    }
  }

  scrollToContact(): void {
    this.viewportScroller.scrollToAnchor('contact');
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
