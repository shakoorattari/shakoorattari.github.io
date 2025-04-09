import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Section {
  id: string;
  name: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  showScrollButton = false;
  currentSectionIndex = 0;
  
  sections: Section[] = [
    { id: 'home', name: 'Home' },
    { id: 'about', name: 'About' },
    { id: 'skills', name: 'Skills' },
    { id: 'experience', name: 'Experience' },
    { id: 'projects', name: 'Projects' },
    { id: 'contact', name: 'Contact' }
  ];

  constructor(private router: Router) {
    // Listen for route changes to scroll to the appropriate section
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const path = event.url.substring(1); // Remove the leading slash
        
        if (path) {
          setTimeout(() => {
            this.scrollToElement(path);
          }, 100);
        } else {
          // If we're navigating to the home page, scroll to top
          window.scrollTo(0, 0);
        }
      });
  }

  ngOnInit(): void {
    // Initial check of scroll position
    this.checkScrollPosition();
  }
  
  ngAfterViewInit(): void {
    // After view is initialized, check if we have a hash in the URL to scroll to
    setTimeout(() => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        this.scrollToElement(hash);
      }
    }, 100);
  }

  @HostListener('window:scroll', [])
  checkScrollPosition(): void {
    // Show/hide scroll button based on scroll position
    this.showScrollButton = window.pageYOffset > 300;
    
    // Determine current section
    this.updateCurrentSection();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update URL without triggering navigation
      const url = elementId === 'home' ? '/' : `/${elementId}`;
      history.replaceState(null, '', url);
    }
  }

  private updateCurrentSection(): void {
    // Find which section is currently in view
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.scrollY + (viewportHeight / 3);
    
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(this.sections[i].id);
      if (section) {
        const sectionTop = section.offsetTop;
        if (scrollPosition >= sectionTop) {
          // Update URL to reflect current section without page reload
          const url = this.sections[i].id === 'home' ? '/' : `/${this.sections[i].id}`;
          if (window.location.pathname !== url) {
            history.replaceState(null, '', url);
          }
          
          this.currentSectionIndex = i;
          break;
        }
      }
    }
  }
}
