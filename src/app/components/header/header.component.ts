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
  
  constructor(private viewportScroller: ViewportScroller) {}

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
    this.viewportScroller.scrollToAnchor(elementId);
  }
}
