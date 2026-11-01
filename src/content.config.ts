import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { PROJECT_CATEGORIES } from './data/project-categories';

const localized = z.object({ es: z.string(), en: z.string() });

/**
 * Blog posts live in `src/content/blog/<lang>/<slug>.md`.
 * The language comes from the folder; a translation uses the same file name
 * (or the same `translationKey`) in the other language folder.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: image(),
      coverAlt: z.string(),
      translationKey: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

/**
 * Projects live in `src/content/projects/<slug>.yaml`, one file per project.
 * See `src/content/projects/README.md` for how to add one.
 */
const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Lower numbers appear first. */
      order: z.number().default(100),
      categories: z.array(z.enum(PROJECT_CATEGORIES)).min(1),
      role: z.enum(['author', 'contributor']).default('author'),
      /** Phosphor icon name. Defaults to the icon of the first category. */
      icon: z.string().optional(),
      kind: localized,
      description: localized,
      stack: z.array(z.string()).default([]),
      repo: z.url().optional(),
      live: z.url().optional(),
      download: z.url().optional(),
      stat: z.object({ value: z.string(), label: localized }).optional(),
      /** Shown in the "Featured projects" grid on the home page. */
      featured: z.boolean().default(false),
      /** Shown as the large spotlight card on the home page (use on one project). */
      spotlight: z
        .object({
          status: localized,
          note: localized.optional(),
          screenshot: image().optional(),
          screenshotDark: image().optional(),
        })
        .optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog, projects };
