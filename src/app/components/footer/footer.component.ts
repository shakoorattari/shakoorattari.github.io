import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  
  socialLinks = [
    { icon: 'linkedin', url: 'https://www.linkedin.com/in/shakoorattari/', label: 'LinkedIn' },
    { icon: 'github', url: 'https://github.com/shakoorattari', label: 'GitHub' },
    { icon: 'twitter', url: 'https://twitter.com/shakoorattari', label: 'Twitter' }
  ];
}
