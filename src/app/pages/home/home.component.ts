import { Component, OnInit, HostListener } from '@angular/core';
import { ViewportScroller } from '@angular/common';

interface Section {
  id: string;
  name: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
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

  constructor(private viewportScroller: ViewportScroller) {}

  ngOnInit(): void {
    this.checkScrollPosition();
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

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
          this.currentSectionIndex = i;
          break;
        }
      }
    }
  }
}
