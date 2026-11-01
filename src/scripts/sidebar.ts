import { storage } from './storage';

const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>('[data-sidebar-toggle]');

function sync(): void {
  if (!toggle) return;
  const collapsed = root.dataset.sidebar === 'collapsed';
  const label = collapsed ? toggle.dataset.labelExpand : toggle.dataset.labelCollapse;
  toggle.setAttribute('aria-expanded', String(!collapsed));
  if (label) {
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }
}

toggle?.addEventListener('click', () => {
  const collapse = root.dataset.sidebar !== 'collapsed';
  if (collapse) root.dataset.sidebar = 'collapsed';
  else delete root.dataset.sidebar;
  storage.set('ozk-side', collapse ? '1' : '0');
  sync();
});

sync();
