# ozkkar.dev

Sitio personal de Oscar Aragón: portafolio y blog bilingüe (ES/EN) hecho con
[Astro 7](https://astro.build), desplegado en Vercel.

## Desarrollo

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + build
npm run format     # Prettier
```

Requiere Node.js ≥ 22.

### Variables de entorno

Copia `.env.example` a `.env`. El formulario de contacto envía el correo con
[Resend](https://resend.com):

| Variable             | Uso                                      | Por defecto                       |
| -------------------- | ---------------------------------------- | --------------------------------- |
| `RESEND_API_KEY`     | API key de Resend (secreta)              | —                                 |
| `CONTACT_TO_EMAIL`   | Dónde llegan los mensajes                | `hello@ozkkar.dev`                |
| `CONTACT_FROM_EMAIL` | Remitente (dominio verificado en Resend) | `ozkkar.dev <contact@ozkkar.dev>` |

En Vercel, configúralas en _Project → Settings → Environment Variables_.

## Contenido

### Agregar un post

1. Crea `src/content/blog/es/mi-post.md` (la carpeta define el idioma).
2. Pon la portada en `src/assets/blog/mi-post.webp`.
3. Frontmatter:

```md
---
title: Título del post
description: Extracto que aparece en la tarjeta y bajo el título.
pubDate: 2026-11-01
updatedDate: 2026-11-02 # opcional
cover: ../../../assets/blog/mi-post.webp
coverAlt: Descripción de la imagen
tags: [astro, css]
draft: false # opcional: true lo oculta en producción
---
```

**Traducción:** crea `src/content/blog/en/mi-post.md` con el mismo nombre de
archivo. Si los nombres difieren, usa el mismo `translationKey` en ambos. Si un
post no tiene traducción, aparece igualmente en el otro idioma con el badge
"Spanish only" / "Solo en inglés".

### Agregar un proyecto

Crea un archivo `.yaml` en `src/content/projects/`. La guía completa con un
ejemplo está en [`src/content/projects/README.md`](src/content/projects/README.md).

### Textos, habilidades y clientes

- Textos de la interfaz (ES/EN): `src/i18n/ui.ts`
- Rutas traducidas (`/proyectos` ↔ `/en/projects`): `src/i18n/routes.ts`
- Habilidades: `src/data/skills.ts`
- Trabajo con clientes: `src/data/clients.ts`
- Email y redes: `src/data/site.ts`

## Estructura

```
src/
  assets/            imágenes optimizadas por astro:assets
  components/
    ui/              piezas genéricas (Icon, Button, Badge, FilterChip…)
    layout/          head, sidebar, header móvil, footer
    home/ projects/ blog/ about/ contact/
  content/           blog (Markdown) y proyectos (YAML)
  data/              datos tipados (sitio, skills, clientes)
  i18n/              idiomas, diccionario y rutas
  layouts/           AppLayout
  lib/               consultas de contenido, contacto, transformer de Shiki
  pages/             rutas finas que delegan en views/ (ES en raíz, EN en /en)
  scripts/           JS de cliente (tema, sidebar, idioma, portapapeles)
  styles/            tokens globales y estilos del contenido de los posts
  views/             una vista por página, compartida por ambos idiomas
```

## Detalles

- **Tema** claro/oscuro sin parpadeo: un script inline en el `<head>` aplica
  `data-theme` antes del primer render (`localStorage.theme`, si no
  `prefers-color-scheme`).
- **Idioma**: en la primera visita a `/`, si el navegador no está en español se
  redirige a `/en/`. La elección manual se guarda en `localStorage.lang`.
- **Código en posts**: Shiki con un transformer propio que añade la cabecera
  con el lenguaje y el botón "Copiar".
- **Iconos**: Phosphor, renderizados como SVG en el build (sin JS ni fuentes).
- **SEO**: canonical, hreflang (`es`, `en`, `x-default`), Open Graph/Twitter y
  JSON-LD (`WebSite`, `Person`, `ProfilePage`, `BlogPosting`, `BreadcrumbList`)
  desde `src/components/layout/BaseHead.astro` y `src/lib/seo/`. Los posts sin
  traducción apuntan su canonical al original para no duplicar contenido.
- **Sitemap**: `/sitemap-index.xml`, con `lastmod` en los posts y sin las copias
  de posts no traducidos.
