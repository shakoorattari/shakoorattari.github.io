import { Component } from '@angular/core';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent {
  skillCategories = [
    {
      title: '.NET Development',
      skills: [
        'ASP.NET Web APIs and MVC (.Net 3, 4, 6, 8)',
        'REST APIs, Web Services, API Authentication',
        'Azure SSO, UAE Pass Authentication',
        'Windows Services, MS Exchange, Graph APIs',
        'SignalR for live chat and notifications',
        'Redis Distributed Cache and Session Management'
      ]
    },
    {
      title: 'Web Development',
      skills: [
        'Angular (7 to 17)',
        'HTML5, CSS3',
        'Responsive Design with Material and Bootstrap',
        'JavaScript, jQuery, TypeScript'
      ]
    },
    {
      title: 'Database Development',
      skills: [
        'Oracle and Microsoft SQL Database',
        'Creating and debugging database objects',
        'Tables, Triggers, Views, Functions, Packages, Procedures'
      ]
    },
    {
      title: 'QA & Automation',
      skills: [
        'Selenium Test Automation',
        'Puppeteer, Power BI',
        'HP Unified Functional Testing (UFT, QTP)',
        'HP LoadRunner for Performance Testing'
      ]
    },
    {
      title: 'Other Skills',
      skills: [
        'OutSystems (Service Studio, Integration Studio)',
        'SonarQube, Jenkins, Azure DevOps',
        'GIT, GitHub, TFS',
        'CICD, Agile, Scrum, Kanban'
      ]
    },
    {
      title: 'Certifications',
      skills: [
        'Microsoft Certified: Azure Developer Associate',
        'Angular Developer Certification',
        'Oracle Database SQL Certified Associate'
      ]
    },
    {
      title: 'Soft Skills',
      skills: [
        'Team Leadership and Mentoring',
        'Effective Communication',
        'Problem Solving and Critical Thinking',
        'Adaptability and Time Management'
      ]
    }
  ];
}
