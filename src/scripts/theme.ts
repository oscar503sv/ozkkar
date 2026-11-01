import { storage } from './storage';

type Theme = 'light' | 'dark';

const root = document.documentElement;
const REVEAL_MS = 600;

function applyTheme(theme: Theme): void {
  root.dataset.theme = theme;
}

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Switches the theme with a circular reveal that grows from `origin`
 * (View Transitions API). Falls back to an instant switch when the API
 * is unavailable or the visitor prefers reduced motion.
 */
function switchTheme(next: Theme, origin: { x: number; y: number }): void {
  const commit = () => {
    applyTheme(next);
    storage.set('theme', next);
  };

  if (!document.startViewTransition || prefersReducedMotion()) {
    commit();
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  // Color transitions would otherwise animate inside the new snapshot.
  root.dataset.themeSwitching = '';
  const transition = document.startViewTransition(commit);

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: REVEAL_MS,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {});

  transition.finished.finally(() => delete root.dataset.themeSwitching);
}

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const rect = button.getBoundingClientRect();
    switchTheme(next, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  });
});

// Follow the OS setting until the visitor picks a theme explicitly.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!storage.get('theme')) applyTheme(event.matches ? 'dark' : 'light');
});
