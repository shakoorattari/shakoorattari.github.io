import { Component } from '@angular/core';

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
export class ExperienceComponent {
  jobs: Job[] = [
    {
      period: '2022 - Present',
      title: 'Full Stack Senior Developer',
      company: 'Department of eGovernment, Sharjah',
      description: 'Developed multiple applications including Legal Department CMS, Meeting Rooms Booking System, Covid Portal, Sessions Management System, and Announcements Management.',
      technologies: ['DotNet Core 6.0', 'Angular 12-14', 'MS SQL', 'SignalR']
    },
    {
      period: '2018 - 2019',
      title: 'Full Stack Software Engineer',
      company: 'Emaratech, Dubai',
      description: 'Worked on Smart Channels project for UAE Visas application system with features like user registration, document handling, payment integration, and workflow approvals.',
      technologies: ['Outsystems', 'ASP.Net 4.5', 'C#', 'Oracle']
    },
    {
      period: '2016 - 2018',
      title: 'Full Stack Developer',
      company: 'Emaratech, Dubai',
      description: 'Worked on Vision E-Form project for UAE visa applications, featuring document attachment, payment processing, and approval workflows.',
      technologies: ['ASP.Net 4.5', 'C#', 'MVC', 'Redis', 'Oracle']
    },
    {
      period: '2015 - 2016',
      title: 'Software Engineer',
      company: 'Emaratech, Dubai',
      description: 'Handled production issues and provided enhancements for E-Channels applications including Fawri, eservices and eform.',
      technologies: ['ASP.Net 4.5', 'C#', 'jQuery', 'Oracle']
    }
  ];
}
