import { storage } from './storage';

// Remember a manual language choice so `/` never auto-redirects against it.
document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((link) => {
  link.addEventListener('click', () => {
    const lang = link.dataset.langSwitch;
    if (lang) storage.set('lang', lang);
  });
});
