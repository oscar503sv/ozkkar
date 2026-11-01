import { DEFAULT_LANG, type Lang } from './config';

/** Localized path segments for each top-level page. */
export const ROUTES = {
  home: { es: '', en: '' },
  projects: { es: 'proyectos', en: 'projects' },
  blog: { es: 'blog', en: 'blog' },
  about: { es: 'sobre-mi', en: 'about' },
  contact: { es: 'contacto', en: 'contact' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;

/** Prefixes a path with the language segment (none for the default language). */
export function withLang(lang: Lang, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  return clean ? `${prefix}/${clean}` : `${prefix}/`;
}

export function routePath(route: RouteKey, lang: Lang): string {
  return withLang(lang, ROUTES[route][lang]);
}

export function postPath(slug: string, lang: Lang): string {
  return withLang(lang, `${ROUTES.blog[lang]}/${slug}`);
}
