import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { LOCALES, type Lang } from '../i18n/config';
import { useTranslations } from '../i18n/utils';
import { getPostListings } from './blog';

/** RSS feed for the blog of one UI language. */
export async function blogFeed(context: APIContext, lang: Lang): Promise<Response> {
  const t = useTranslations(lang);
  const posts = await getPostListings(lang);

  return rss({
    title: t.blog.rss,
    description: t.blog.intro,
    site: context.site!,
    items: posts.map(({ entry, url }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: url,
      categories: entry.data.tags,
    })),
    customData: `<language>${LOCALES[lang]}</language>`,
  });
}
