import { Component, HostListener } from '@angular/core';
import { ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  menuOpen = false;
  scrolled = false;
  lastScrollTop = 0;
  headerTransform = 'translateY(0)';
  
  constructor(private viewportScroller: ViewportScroller) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add background color when scrolled
    this.scrolled = scrollTop > 50;
    
    // Header hide/show on scroll
    if (scrollTop > this.lastScrollTop) {
      // Scrolling down
      this.headerTransform = 'translateY(-100%)';
    } else {
      // Scrolling up
      this.headerTransform = 'translateY(0)';
    }
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  
  scrollToSection(elementId: string) {
    this.menuOpen = false;
    this.viewportScroller.scrollToAnchor(elementId);
  }
}
