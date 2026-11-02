---
title: 'Sesiones seguras en una SPA: cookies httpOnly + CSRF con FastAPI y React'
description: 'Por qué no guardo el JWT en localStorage, cómo configuro las cookies de sesión y cómo implementé la protección CSRF con el patrón double-submit en MediCore.'
pubDate: 2026-10-06
cover: ../../../assets/blog/secure-sessions-fastapi.webp
coverAlt: 'Esquema de sesiones seguras entre una SPA en React y una API en FastAPI'
tags: [fastapi, python, react, security, auth]
---

En [MediCore](https://github.com/oscar503sv/medicore), un sistema de gestión de clínicas, manejamos expedientes médicos. Ahí la seguridad de la sesión no es negociable. Este es el enfoque que usé y por qué.

## El problema con localStorage

El tutorial típico de JWT dice: haz login, guarda el token en `localStorage` y mándalo en el header `Authorization`. Funciona, pero cualquier script que corra en tu página puede leer `localStorage`. Un solo XSS (una dependencia comprometida, un HTML mal escapado) y el atacante se lleva el token.

## Cookies httpOnly

La alternativa es que el backend guarde el token en una cookie `httpOnly`. El navegador la envía sola en cada petición y **JavaScript no puede leerla**.

En FastAPI:

```python
response.set_cookie(
    "session",
    token,
    max_age=max_age,
    httponly=True,   # invisible para JavaScript
    samesite="lax",  # no se envía en POST desde otros sitios
    secure=is_production,  # solo HTTPS en producción
    path="/",
)
```

En el frontend solo hay que decirle a Axios que envíe las cookies:

```ts
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});
```

## Pero ahora tienes CSRF

Como el navegador envía la cookie automáticamente, otro sitio podría provocar una petición a tu API usando la sesión del usuario. Eso es CSRF. `SameSite=Lax` ya bloquea la mayoría de casos, pero prefiero tener una segunda capa.

## Double-submit cookie

La idea: al hacer login, el backend crea **una segunda cookie**, esta sí legible desde JavaScript, con un valor aleatorio. En cada petición que modifica datos, el frontend copia ese valor a un header. Un sitio externo no puede leer tus cookies, así que no puede poner el header correcto.

Al hacer login:

```python
response.set_cookie(
    "csrf_token",
    secrets.token_urlsafe(32),  # nuevo en cada login
    max_age=max_age,
    httponly=False,  # la SPA necesita leerla
    samesite="lax",
    secure=is_production,
)
```

En el frontend, un interceptor de Axios:

```ts
const SAFE_METHODS = new Set(['get', 'head', 'options']);

api.interceptors.request.use((config) => {
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    const csrf = readCookie('csrf_token');
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});
```

Y en el backend, la dependencia que resuelve la sesión valida que coincidan:

```python
if is_mutating(request.method):
    csrf_cookie = request.cookies.get("csrf_token", "")
    csrf_header = request.headers.get("X-CSRF-Token", "")
    if not csrf_cookie or not secrets.compare_digest(csrf_cookie, csrf_header):
        raise ApiError(403, "CSRF token missing or invalid")
```

Uso `secrets.compare_digest` en lugar de `==` para que la comparación tarde lo mismo sin importar cuántos caracteres coincidan.

## Detalles que suman

- **Sesiones en el servidor.** El JWT lleva un `sid` que apunta a una sesión guardada en la base de datos. Así puedo cerrar sesiones de forma remota: el usuario ve sus dispositivos activos y un administrador puede revocarlos. Un JWT puro no se puede invalidar antes de que expire.
- **Sesiones separadas por consola.** La consola de administración de la plataforma usa su propia sesión, independiente de la de cada clínica.
- **Rotación del token CSRF.** Se genera uno nuevo en cada login, así un valor viejo no sirve para una sesión nueva.
- **401 → logout.** Un interceptor de respuesta limpia el estado cuando la cookie expira y el router manda al login.

## Conclusión

Cookies `httpOnly` + double-submit no es más complicado que el JWT en `localStorage`, y elimina el problema más común de las SPAs. Si tu app maneja datos sensibles, vale la pena hacerlo desde el principio.
