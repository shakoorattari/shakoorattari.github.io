import { Component, AfterViewInit, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.7s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HeroComponent implements AfterViewInit {
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => this.initTypingEffect(), 120);
  }

  scrollToContact(): void {
    // Update URL
    this.router.navigate(['/contact']);
    
    // Smooth scroll if element exists on current page
    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById('contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  scrollToProjects(): void {
    this.router.navigate(['/projects']);

    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById('projects');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  scrollToAbout(): void {
    // Update URL
    this.router.navigate(['/about']);
    
    // Smooth scroll if element exists on current page
    if (!this.isBrowser) {
      return;
    }

    setTimeout(() => {
      const element = document.getElementById('about');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  private initTypingEffect(): void {
    const element = this.elementRef.nativeElement.querySelector('.dynamic-text');
    if (!element) return;

    const texts = JSON.parse(element.getAttribute('data-rotate') || '[]');
    let index = 0;
    let charIndex = 0;
    let currentText = '';
    let isDeleting = false;

    const type = () => {
      if (!texts.length) return;

      currentText = texts[index];
      
      if (isDeleting) {
        element.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        element.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
      }

      if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        setTimeout(type, 2000); // Wait before deleting
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        index = (index + 1) % texts.length;
        setTimeout(type, 500); // Wait before typing next text
      } else {
        setTimeout(type, isDeleting ? 50 : 100); // Delete faster than type
      }
    };

    type();
  }
}
