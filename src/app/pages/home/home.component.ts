import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  showScrollBtn = false;
  currentSection = 'home';
  sectionList = [
    { id: 'home', name: 'Home' },
    { id: 'about', name: 'About' },
    { id: 'skills', name: 'Skills' },
    { id: 'experience', name: 'Experience' },
    { id: 'projects', name: 'Projects' },
    { id: 'contact', name: 'Contact' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.checkScroll();
    this.detectSection();
  }

  @HostListener('window:scroll', [])
  checkScroll() {
    this.showScrollBtn = window.pageYOffset > 300;
    this.detectSection();
  }

  detectSection() {
    const sections = document.querySelectorAll('.section');
    const scrollPosition = window.pageYOffset + 300;

    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
      const sectionId = section.getAttribute('id') || '';

      if (scrollPosition >= sectionTop &&
        scrollPosition <= sectionTop + section.clientHeight) {
        this.currentSection = sectionId;
      }
    });
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  navigateToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
