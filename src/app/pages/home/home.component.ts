import { Component, OnInit, AfterViewInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  private readonly isBrowser: boolean;
  private scrollRafPending = false;
  
  sections: Section[] = [
    { id: 'home', name: 'Home' },
    { id: 'about', name: 'About' },
    { id: 'skills', name: 'Skills' },
    { id: 'experience', name: 'Experience' },
    { id: 'projects', name: 'Projects' },
    { id: 'contact', name: 'Contact' }
  ];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

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
          if (this.isBrowser) {
            window.scrollTo(0, 0);
          }
        }
      });
  }

  ngOnInit(): void {
    // Initial check of scroll position
    this.checkScrollPosition();
  }
  
  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

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
    if (!this.isBrowser) {
      return;
    }

    if (this.scrollRafPending) {
      return;
    }

    this.scrollRafPending = true;
    window.requestAnimationFrame(() => {
      this.runScrollComputations();
      this.scrollRafPending = false;
    });
  }

  scrollToTop(): void {
    if (!this.isBrowser) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToElement(elementId: string): void {
    if (!this.isBrowser) {
      return;
    }

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update URL without triggering navigation
      const url = elementId === 'home' ? '/' : `/${elementId}`;
      history.replaceState(null, '', url);
    }
  }

  private updateCurrentSection(): void {
    if (!this.isBrowser) {
      return;
    }

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

  private runScrollComputations(): void {
    this.showScrollButton = window.pageYOffset > 300;
    this.updateCurrentSection();
  }
}
