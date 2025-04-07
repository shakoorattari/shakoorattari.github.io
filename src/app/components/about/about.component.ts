import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  personalInfo = [
    { label: 'Name', value: 'Shakoor Hussain Attari' },
    { label: 'Email', value: 'binmushtaq@gmail.com' },
    { label: 'Phone', value: '+971 50 8066 735' },
    { label: 'Location', value: 'Sharjah, UAE' },
    { label: 'LinkedIn', value: 'linkedin.com/in/shakoorattari' }
  ];

  endorsements = [
    { skill: '.NET Development', count: 15 },
    { skill: 'Angular', count: 12 },
    { skill: 'Database Development', count: 10 },
    { skill: 'Full Stack Development', count: 18 }
  ];
}
