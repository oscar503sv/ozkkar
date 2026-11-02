# Proyectos

Cada proyecto es un archivo `.yaml` en esta carpeta. Para agregar uno nuevo, copia
este ejemplo en `mi-proyecto.yaml` y ajústalo. El esquema completo está en
`src/content.config.ts`; si falta un campo obligatorio, el build te lo dirá.

```yaml
name: Mi proyecto
order: 10 # menor = aparece antes
categories: [backend, web] # backend | web | mobile | infra | oss
role: author # author (propio) | team (en equipo) | contributor (open source)
icon: rocket # opcional: icono de Phosphor (https://phosphoricons.com)
kind:
  es: API REST de ejemplo
  en: Sample REST API
description:
  es: Descripción corta en español.
  en: Short description in English.
stack: [Python, FastAPI, PostgreSQL]
repo: https://github.com/oscar503sv/mi-proyecto # opcional
live: https://mi-proyecto.ozkkar.dev # opcional
download: https://github.com/…/releases/latest # opcional
status: production # opcional: production | development (badge en la tarjeta)
screenshot: ../../assets/projects/mi-proyecto.png # opcional: captura horizontal
featured: true # opcional: aparece en "Proyectos destacados" del inicio
stat: # opcional: pill de métrica
  value: '120'
  label:
    es: usuarios activos
    en: active users
draft: false # opcional: true lo oculta
```

## Spotlight

El proyecto con `spotlight` aparece como tarjeta grande en el inicio (usa solo uno).
Las capturas van en `src/assets/projects/` y las rutas son relativas a este archivo:

```yaml
spotlight:
  badge: { es: Ya disponible, en: Now available }
  note: { es: Licencia MIT, en: MIT license } # opcional
  screenshot: ../../assets/projects/mi-proyecto.png
  screenshotDark: ../../assets/projects/mi-proyecto-dark.png # opcional
```
