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
      title: 'Legal Department CMS',
      description: 'Content management system with multi-role capabilities. Features SEO optimization and smooth user experience with Angular\'s lazy loading.',
      technologies: ['.NET Core 6', 'Angular 14', 'MS SQL']
    },
    {
      title: 'Meeting Rooms Booking System',
      description: 'Multi-role application for meeting room management with Outlook integration, custom add-in, and Exchange sync service.',
      technologies: ['.NET Core 6', 'Angular 12', 'Exchange Web Services']
    },
    {
      title: 'Sessions Management System',
      description: 'Role-based application managing session agendas, attendance, and real-time voting using SignalR.',
      technologies: ['ASP.NET 4.8', 'Angular 9', 'SignalR']
    },
    {
      title: 'Announcements Management',
      description: 'Designed announcements app with text/graphics editor, multi-level approvals, and desktop notifications.',
      technologies: ['ASP.NET 6', 'Angular 14', 'SignalR']
    },
    {
      title: 'Smart Channels',
      description: 'UAE Visa application system with document handling, multiple payment channels, and workflow management.',
      technologies: ['Outsystems', 'ASP.NET 4.5', 'Oracle']
    },
    {
      title: 'Vision Tracker (ETL Dashboard)',
      description: 'Dashboard application for monitoring application statuses with rich visualization and reporting features.',
      technologies: ['ASP.NET 4.5', 'jQuery Charts', 'Oracle']
    }
  ];

  ngOnInit(): void {
    // Reset scroll position when navigating to this component
    window.scrollTo(0, 0);
  }
}
