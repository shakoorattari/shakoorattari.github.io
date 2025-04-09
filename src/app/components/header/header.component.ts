import { Component, HostListener } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  menuOpen = false;
  scrolled = false;
  currentSection = '';
  
  constructor(
    private viewportScroller: ViewportScroller,
    private router: Router
  ) {
    // Listen for route changes to update the current section
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentSection = event.url.replace('/', '') || 'home';
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Simple check for scroll position to add background
    this.scrolled = window.pageYOffset > 50;
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  
  scrollToSection(elementId: string) {
    this.menuOpen = false;
    
    // Update URL using router navigation
    if (elementId === 'home') {
      this.router.navigate(['']);
    } else {
      this.router.navigate([elementId]);
    }
    
    // If we're on the same page where the section exists, scroll to it
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
