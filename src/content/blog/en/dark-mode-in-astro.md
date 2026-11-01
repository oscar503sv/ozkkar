---
title: "Dark mode in Astro with Tailwind CSS"
description: "A detailed guide to adding dark mode to your Astro project using Tailwind CSS and the prefers-color-scheme media query."
pubDate: 2024-08-16
updatedDate: 2024-08-16
cover: ../../../assets/blog/dark-mode-in-astro.webp
coverAlt: "Astro logo with a dark background"
tags: ["astro", "tailwind", "dark-mode", "preact", "css", "framework"]
---

Adding a dark mode is an easy way to make a website more accessible. In this guide, we'll show how to add a dark mode to your Astro project using Tailwind CSS. You can use any UI framework you like; here we'll use Preact for the interface.

## Getting started

Start by creating a new Astro project:

```sh
npm create astro@latest
```

Next, install the Tailwind CSS and Preact integrations:

```sh
npm install -D @astrojs/tailwind @astrojs/preact
npm install preact
```

Add both integrations to your `astro.config.mjs` file:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";

export default defineConfig({
  integrations: [preact(), tailwind()],
});
```

Now create a minimal Tailwind CSS configuration file in the project root. Make sure the `content` property includes every file that contains your styles, and set `darkMode` to `"class"` to enable dark mode:

```js title="tailwind.config.cjs"
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}"],
  darkMode: "class",
  theme: {},
  plugins: [],
};
```

## Implementation

Astro lets you add inline scripts directly to your Astro files, and they run as soon as the HTML loads. This avoids the common "flash of the wrong color theme" problem when implementing dark mode with hydration. You can find more about inline scripts in the [Astro documentation](https://docs.astro.build/en/reference/directives-reference/#isinline).

The following code reads the user's preferred theme and applies it to the HTML element. You can copy, paste or customize this snippet in your Astro project. We'll explain each line in the next section.

```astro title="Layout.astro"
<script is:inline>
  const theme = (() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme");
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  })();

  if (theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
  window.localStorage.setItem("theme", theme);
</script>
```

The `theme` variable is an immediately invoked function expression (IIFE) that returns the current theme based on the user's preference. The first `if` checks whether the user already saved a theme in localStorage and, if so, returns it. The second `if` checks whether the user's system prefers dark mode and, if so, returns `"dark"`. If neither condition is met, it returns `"light"`. Once the theme is known, we add or remove the `"dark"` class on the HTML element and save the theme in localStorage.

## Building the UI

In Astro you can use any UI framework you like. For this example we'll use **Preact** because of its small size and performance. The following snippet shows a button that toggles between dark and light mode:

```tsx title="ThemeToggle.tsx"
import { useEffect, useState } from "preact/hooks";
import type { FunctionalComponent } from "preact";

export default function ThemeToggle(): FunctionalComponent {
  const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");

  const handleClick = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button onClick={handleClick}>{theme === "light" ? "🌙" : "🌞"}</button>
  );
}
```

## Rendering components on the server

Whatever UI framework you use, with static site generation (SSG) Astro renders your UI components on the server at build time and hydrates them on the client. This improves performance, accessibility and SEO.

It also has a drawback: since components are rendered on the server, web APIs such as `localStorage` or `window` aren't available.

### Fallback initial state

To work around this, you can add a fallback initial state that's used at build time and then updated to the correct state after hydration. For example:

```jsx
const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");
```

Here we try to read the theme from `localStorage` and fall back to `"light"` if it isn't available. A fallback initial state is a common way to solve this, but it can cause a "client/server state mismatch", where the initial state differs from the state after hydration.

### Handling the client/server mismatch

One way to handle the mismatch is to add a `mounted` state. It makes your component wait until it's mounted in the DOM before rendering, so every web API is available and the initial state matches the state after hydration. You can do this with the `useState` and `useEffect` hooks:

```jsx title="ThemeToggle.tsx"
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) {
  return <FallbackUI />; // or null;
}

return <button>{theme === "light" ? "🌙" : "🌞"}</button>;
```

By checking `isMounted`, we render a fallback UI (or `null`) until the component is mounted. Once it is, the real UI renders.
