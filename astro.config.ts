// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import { codeBlockTransformer } from './src/lib/shiki/code-block-transformer';

export default defineConfig({
  site: 'https://ozkkar.dev',
  trailingSlash: 'ignore',
  adapter: vercel(),

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: [
    // hreflang alternates are emitted per page in BaseHead (routes are translated).
    sitemap({ filter: (page) => !page.includes('/api/') }),
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
