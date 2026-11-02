---
title: 'Secure sessions in a SPA: httpOnly cookies + CSRF with FastAPI and React'
description: 'Why I do not store the JWT in localStorage, how I configure session cookies, and how I implemented CSRF protection with the double-submit pattern in MediCore.'
pubDate: 2026-11-01
cover: ../../../assets/blog/secure-sessions-fastapi.webp
coverAlt: 'Diagram of secure sessions between a React SPA and a FastAPI API'
tags: [fastapi, python, react, security, auth]
---

In [MediCore](https://github.com/oscar503sv/medicore), a clinic management system, we handle medical records. Session security there is not negotiable. This is the approach I used and why.

## The problem with localStorage

The typical JWT tutorial says: log in, store the token in `localStorage` and send it in the `Authorization` header. It works, but any script running on your page can read `localStorage`. A single XSS (a compromised dependency, badly escaped HTML) and the attacker walks away with the token.

## httpOnly cookies

The alternative is for the backend to store the token in an `httpOnly` cookie. The browser sends it automatically on every request and **JavaScript cannot read it**.

In FastAPI:

```python
response.set_cookie(
    "session",
    token,
    max_age=max_age,
    httponly=True,   # invisible to JavaScript
    samesite="lax",  # not sent on cross-site POSTs
    secure=is_production,  # HTTPS only in production
    path="/",
)
```

On the frontend you only need to tell Axios to send cookies:

```ts
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});
```

## But now you have CSRF

Because the browser sends the cookie automatically, another site could trigger a request to your API using the user's session. That is CSRF. `SameSite=Lax` already blocks most cases, but I prefer a second layer.

## Double-submit cookie

The idea: on login, the backend sets **a second cookie**, this one readable from JavaScript, with a random value. On every request that changes data, the frontend copies that value into a header. An external site cannot read your cookies, so it cannot set the right header.

On login:

```python
response.set_cookie(
    "csrf_token",
    secrets.token_urlsafe(32),  # new on every login
    max_age=max_age,
    httponly=False,  # the SPA needs to read it
    samesite="lax",
    secure=is_production,
)
```

On the frontend, an Axios interceptor:

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

And on the backend, the dependency that resolves the session checks that they match:

```python
if is_mutating(request.method):
    csrf_cookie = request.cookies.get("csrf_token", "")
    csrf_header = request.headers.get("X-CSRF-Token", "")
    if not csrf_cookie or not secrets.compare_digest(csrf_cookie, csrf_header):
        raise ApiError(403, "CSRF token missing or invalid")
```

I use `secrets.compare_digest` instead of `==` so the comparison takes the same time no matter how many characters match.

## Details that add up

- **Server-side sessions.** The JWT carries a `sid` that points to a session stored in the database. That lets me end sessions remotely: users see their active devices and an admin can revoke them. A plain JWT cannot be invalidated before it expires.
- **Separate sessions per console.** The platform admin console uses its own session, independent from each clinic's.
- **CSRF token rotation.** A new one is generated on every login, so an old value is useless for a new session.
- **401 → logout.** A response interceptor clears the state when the cookie expires, and the router sends the user to the login page.

## Conclusion

`httpOnly` cookies + double-submit are no harder than a JWT in `localStorage`, and they remove the most common SPA problem. If your app handles sensitive data, it is worth doing from day one.
