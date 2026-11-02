// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { codeBlockTransformer } from './src/lib/shiki/code-block-transformer';
import { blogSitemapData } from './src/lib/seo/sitemap';

const SITE = 'https://ozkkar.dev';
const blogSitemap = blogSitemapData(SITE);

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  adapter: vercel(),

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    // hreflang alternates are emitted per page in BaseHead (routes are translated).
    sitemap({
      filter: (page) => !page.includes('/api/') && !blogSitemap.exclude.has(page),
      serialize: (item) => {
        const lastmod = blogSitemap.lastmod.get(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      transformers: [codeBlockTransformer()],
    },
  },

  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'hello@ozkkar.dev',
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        default: 'ozkkar.dev <contact@ozkkar.dev>',
      }),
    },
  },
});
