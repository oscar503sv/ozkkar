/**
 * Build-time helpers for @astrojs/sitemap (imported by astro.config.ts, so
 * they read the Markdown files directly instead of using astro:content).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = join(process.cwd(), 'src/content/blog');
const LANGS = ['es', 'en'] as const;
const DEFAULT_LANG = 'es';

interface PostFile {
  lang: (typeof LANGS)[number];
  slug: string;
  key: string;
  lastmod: string;
  draft: boolean;
}

function frontmatterValue(source: string, field: string): string | undefined {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?([^'"\\n]+?)['"]?\\s*$`, 'm'));
  return match?.[1];
}

function readPosts(): PostFile[] {
  return LANGS.flatMap((lang) =>
    readdirSync(join(BLOG_DIR, lang))
      .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
      .map((file) => {
        const source = readFileSync(join(BLOG_DIR, lang, file), 'utf8');
        const slug = file.replace(/\.mdx?$/, '');
        const date = frontmatterValue(source, 'updatedDate') ?? frontmatterValue(source, 'pubDate');
        return {
          lang,
          slug,
          key: frontmatterValue(source, 'translationKey') ?? slug,
          lastmod: date ? new Date(date).toISOString() : '',
          draft: frontmatterValue(source, 'draft') === 'true',
        };
      }),
  );
}

const postUrl = (site: string, lang: string, slug: string) =>
  new URL(`${lang === DEFAULT_LANG ? '' : `/${lang}`}/blog/${slug}/`, site).href;

/**
 * - `exclude`: posts rendered in the other language's UI only because they have
 *   no translation. Their canonical points to the original, so they stay out.
 * - `lastmod`: last update date of each real post URL.
 */
export function blogSitemapData(site: string) {
  const posts = readPosts().filter((post) => !post.draft);
  const exclude = new Set<string>();
  const lastmod = new Map<string, string>();

  for (const post of posts) {
    lastmod.set(postUrl(site, post.lang, post.slug), post.lastmod);
    for (const other of LANGS.filter((lang) => lang !== post.lang)) {
      const translated = posts.some((p) => p.lang === other && p.key === post.key);
      if (!translated) exclude.add(postUrl(site, other, post.slug));
    }
  }

  return { exclude, lastmod };
}
