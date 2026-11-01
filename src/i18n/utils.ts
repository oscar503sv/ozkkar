import { DEFAULT_LANG, LOCALES, isLang, type Lang } from './config';
import { ui, type Dictionary } from './ui';

export function getLang(currentLocale: string | undefined): Lang {
  return isLang(currentLocale) ? currentLocale : DEFAULT_LANG;
}

export function useTranslations(lang: Lang): Dictionary {
  return ui[lang];
}

/** Replaces `{key}` placeholders in a translated string. */
export function format(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(
    date,
  );
}
