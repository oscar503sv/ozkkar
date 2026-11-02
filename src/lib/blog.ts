import { getCollection, type CollectionEntry } from 'astro:content';

import { isLang, otherLang, type Lang } from '../i18n/config';
import { postPath } from '../i18n/routes';

export type PostEntry = CollectionEntry<'blog'>;

export interface PostListing {
  entry: PostEntry;
  slug: string;
  /** Language the post is written in. */
  contentLang: Lang;
  /** Language of the UI the post is listed in. */
  uiLang: Lang;
  url: string;
  /** Set when the post has no version in `uiLang`. */
  onlyIn?: Lang;
}

/** `es/my-post` → `{ lang: 'es', slug: 'my-post' }` */
export function parsePostId(id: string): { lang: Lang; slug: string } {
  const [lang, ...rest] = id.split('/');
  if (!isLang(lang) || rest.length === 0) {
    throw new Error(`Blog post "${id}" must live in src/content/blog/<es|en>/`);
  }
  return { lang, slug: rest.join('/') };
}

export function translationKey(entry: PostEntry): string {
  return entry.data.translationKey ?? parsePostId(entry.id).slug;
}

let cache: Promise<PostEntry[]> | undefined;

/** All published posts, newest first. */
export function getAllPosts(): Promise<PostEntry[]> {
  cache ??= getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft).then((posts) =>
    posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()),
  );
  return cache;
}

/**
 * Posts listed under the blog of `uiLang`: every post written in that
 * language, plus posts that only exist in the other language (flagged
 * with `onlyIn`).
 */
export async function getPostListings(uiLang: Lang): Promise<PostListing[]> {
  const posts = await getAllPosts();
  const native = posts.filter((p) => parsePostId(p.id).lang === uiLang);
  const nativeKeys = new Set(native.map(translationKey));

  return posts
    .filter((p) => parsePostId(p.id).lang === uiLang || !nativeKeys.has(translationKey(p)))
    .map((entry) => {
      const { lang: contentLang, slug } = parsePostId(entry.id);
      return {
        entry,
        slug,
        contentLang,
        uiLang,
        url: postPath(slug, uiLang),
        onlyIn: contentLang === uiLang ? undefined : contentLang,
      };
    });
}

/** URL of the same post in the other UI language (used by the language toggle). */
export async function getAlternatePostUrl(listing: PostListing): Promise<string> {
  const target = otherLang(listing.uiLang);
  const listings = await getPostListings(target);
  const key = translationKey(listing.entry);
  const match = listings.find((l) => translationKey(l.entry) === key);
  return match?.url ?? postPath(listing.slug, target);
}

/** Whether the post is also written in the other language (a real translation). */
export async function hasTranslation(listing: PostListing): Promise<boolean> {
  const target = otherLang(listing.contentLang);
  const key = translationKey(listing.entry);
  const posts = await getAllPosts();
  return posts.some((p) => parsePostId(p.id).lang === target && translationKey(p) === key);
}

/** Unique tags, most used first (ties keep first-seen order). */
export function getAllTags(listings: PostListing[]): string[] {
  const counts = new Map<string, number>();
  for (const tag of listings.flatMap((l) => l.entry.data.tags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}
