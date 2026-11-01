import { storage } from './storage';

type Theme = 'light' | 'dark';

const root = document.documentElement;

function applyTheme(theme: Theme): void {
  root.dataset.theme = theme;
}

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('theme', next);
  });
});

// Follow the OS setting until the visitor picks a theme explicitly.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!storage.get('theme')) applyTheme(event.matches ? 'dark' : 'light');
});
