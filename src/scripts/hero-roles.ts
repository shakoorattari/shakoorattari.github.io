// Typing effect for the role line. The first role is already in the HTML (so crawlers and
// no-JS visitors see it); this only animates from there. Skipped for reduced-motion users.

const el = document.querySelector<HTMLElement>('.dynamic-text');

if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const roles: string[] = JSON.parse(el.dataset.roles ?? '[]');

  if (roles.length > 1) {
    let index = 0;
    let chars = roles[0].length;
    let deleting = false;

    const step = () => {
      const text = roles[index];
      chars += deleting ? -1 : 1;
      el.textContent = text.slice(0, chars);

      let delay = deleting ? 50 : 100;
      if (!deleting && chars === text.length) {
        deleting = true;
        delay = 2000; // hold the full role
      } else if (deleting && chars === 0) {
        deleting = false;
        index = (index + 1) % roles.length;
        delay = 500;
      }
      setTimeout(step, delay);
    };

    // Show the first role for a beat before erasing it.
    setTimeout(() => {
      deleting = true;
      step();
    }, 2000);
  }
}
