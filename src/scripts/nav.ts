// Header behaviour: scrolled state, mobile menu, scroll-spy, footer year.
// Navigation itself is plain anchor links; the browser handles the scrolling.

const header = document.querySelector<HTMLElement>('.site-header');
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.getElementById('primary-navigation');
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]'));

// --- scrolled state (adds the background once the page moves)
let ticking = false;
const syncScrolled = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    header?.classList.toggle('scrolled', window.scrollY > 50);
    ticking = false;
  });
};
window.addEventListener('scroll', syncScrolled, { passive: true });
syncScrolled();

// --- mobile menu
const setMenu = (open: boolean) => {
  menu?.classList.toggle('active', open);
  toggle?.classList.toggle('active', open);
  toggle?.setAttribute('aria-expanded', String(open));
};
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (event) => {
  if ((event.target as Element).closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

// --- scroll-spy: highlight the link of the section crossing ~35% down the viewport
const linkById = new Map(links.map((a) => [a.getAttribute('href')!.slice(1), a]));
const setActive = (id: string) => {
  links.forEach((a) => {
    const active = a === linkById.get(id);
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
};

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: '-35% 0px -60% 0px' },
  );
  for (const id of linkById.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

// --- keep the footer year current without a rebuild
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
