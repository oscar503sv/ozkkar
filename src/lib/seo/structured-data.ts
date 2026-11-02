/**
 * schema.org builders for JSON-LD (rendered by components/seo/JsonLd.astro).
 * Every builder returns a plain object; URLs must already be absolute.
 */
import { LOCALES, type Lang } from '../../i18n/config';
import { SITE, SOCIALS } from '../../data/site';

export type Schema = Record<string, unknown>;

/** Absolute URLs of the page being rendered, passed to schema factories. */
export interface SchemaContext {
  canonical: URL;
  image: URL;
}

export type SchemaFactory = (context: SchemaContext) => Schema[];

const SITE_URL = `https://${SITE.domain}/`;
const PERSON_ID = `${SITE_URL}#person`;
const WEBSITE_ID = `${SITE_URL}#website`;

const JOB_TITLE: Record<Lang, string> = {
  es: 'Desarrollador full-stack',
  en: 'Full-stack developer',
};

export function personSchema(lang: Lang, image?: URL): Schema {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.author,
    url: SITE_URL,
    jobTitle: JOB_TITLE[lang],
    ...(image && { image: image.href }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Salvador',
      addressCountry: 'SV',
    },
    knowsAbout: ['Full-stack development', 'Python', 'TypeScript', 'React', 'Linux', 'Docker'],
    sameAs: SOCIALS.map((social) => social.href),
  };
}

export function websiteSchema(description: string): Schema {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE.domain,
    description,
    inLanguage: ['es', 'en'],
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

export function profilePageSchema(lang: Lang, url: URL, image?: URL): Schema {
  return {
    '@type': 'ProfilePage',
    url: url.href,
    inLanguage: LOCALES[lang],
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: personSchema(lang, image),
  };
}

interface BlogPostingInput {
  lang: Lang;
  url: URL;
  title: string;
  description: string;
  image: URL;
  published: Date;
  modified?: Date;
  tags: string[];
}

export function blogPostingSchema(post: BlogPostingInput): Schema {
  return {
    '@type': 'BlogPosting',
    mainEntityOfPage: post.url.href,
    url: post.url.href,
    headline: post.title,
    description: post.description,
    image: post.image.href,
    datePublished: post.published.toISOString(),
    dateModified: (post.modified ?? post.published).toISOString(),
    inLanguage: LOCALES[post.lang],
    keywords: post.tags.join(', '),
    author: { '@id': PERSON_ID, '@type': 'Person', name: SITE.author, url: SITE_URL },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function breadcrumbSchema(items: { name: string; url: URL }[]): Schema {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.href,
    })),
  };
}
