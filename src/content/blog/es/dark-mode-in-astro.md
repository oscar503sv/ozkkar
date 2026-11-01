---
title: "Implementación de modo oscuro en Astro con Tailwind CSS"
description: "Guía detallada para implementar un modo oscuro en tu proyecto Astro utilizando Tailwind CSS y la media query prefers-color-scheme."
pubDate: 2024-08-16
updatedDate: 2024-08-16
cover: ../../../assets/blog/dark-mode-in-astro.webp
coverAlt: "Astro logo with a dark background"
tags: ["astro", "tailwind", "dark-mode", "preact", "css", "framework"]
---

Mejorar la accesibilidad de un sitio web es sencillo con la adición de un modo oscuro. En esta guía completa, demostraremos cómo integrar perfectamente un modo oscuro en tu proyecto Astro utilizando Tailwind CSS. Aunque puedes usar tu framework preferido, aprovecharemos Preact para el desarrollo de la interfaz de usuario.

## Primeros pasos

Comienza creando un nuevo proyecto Astro:

```sh
npm create astro@latest
```

A continuación, instala las integraciones de TailwindCSS y Preact:

```sh
npm install -D @astrojs/tailwind @astrojs/preact
npm install preact
```

Añade ambas integraciones a tu archivo `astro.config.mjs`:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";

export default defineConfig({
  integrations: [preact(), tailwind()],
});
```

Ahora, crea un archivo de configuración mínimo de Tailwind CSS en el directorio raíz del proyecto. Asegúrate de modificar la propiedad content para incluir todos los archivos que contienen tus estilos. También, establece la propiedad darkMode como "class" para habilitar el modo oscuro:

```js title="tailwind.config.cjs"
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}"],
  darkMode: "class",
  theme: {},
  plugins: [],
};
```

## Implementación práctica

Astro ofrece la capacidad de añadir scripts en línea directamente a tus archivos Astro, que se ejecutan tan pronto como se carga el HTML. Este enfoque evita el problema común de "flash de tema de color incorrecto" al implementar el modo oscuro con hidratación. Puedes encontrar más detalles sobre scripts en línea en la [documentación de Astro](https://docs.astro.build/en/reference/directives-reference/#isinline).

El siguiente código extrae el tema preferido del usuario y lo aplica al elemento HTML. Puedes copiar, pegar o personalizar este fragmento de código en tu proyecto Astro. Explicaremos cada línea en la siguiente sección.

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

La variable `theme` es una expresión de función inmediatamente invocada (IIFE) que devuelve el tema actual basado en la preferencia del usuario. La primera declaración `if` comprueba si el usuario tiene un tema previamente guardado en localStorage. Si es así, devuelve ese tema. La segunda declaración `if` comprueba si el usuario prefiere el modo oscuro según la configuración de su sistema. Si es así, devuelve `"dark"`. Si ninguna de las condiciones se cumple, devuelve `"light"`. Una vez que se define el tema, lo usamos para añadir o eliminar la clase `"dark"` del elemento HTML y guardamos el tema en localStorage.

## Creando la interfaz de usuario

En Astro, puedes usar cualquier framework de interfaz de usuario de tu elección. Para este ejemplo, usaremos **Preact** debido a su pequeño tamaño y rendimiento. El siguiente fragmento de código muestra un botón que alterna entre el modo oscuro y claro:

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

## Renderizando componentes en el servidor

Independientemente del framework de interfaz de usuario que utilices, si estás usando Generación de Sitios Estáticos (SSG), Astro renderizará tus componentes de interfaz de usuario en el servidor durante el tiempo de compilación y los hidratará en el lado del cliente. Esta característica mejora el rendimiento del sitio web, la accesibilidad y el SEO.

Sin embargo, esta característica también tiene algunas desventajas. Dado que los componentes se renderizan en el servidor, las APIs web como `localStorage` o `window` no están disponibles.

### Estado inicial de respaldo

Para superar esta limitación, puedes añadir un estado inicial de respaldo que se utilizará durante el tiempo de compilación y luego se actualizará al estado correcto después de la hidratación. Por ejemplo:

```jsx
const [theme, setTheme] = useState(localStorage.getItem("theme") ?? "light");
```

En el código anterior, intentamos obtener el tema de `localStorage`, y si no está disponible, usamos `"light"` como estado inicial. Usar un estado inicial de respaldo es un enfoque común para resolver este problema. Sin embargo, puede llevar a un problema de "desajuste de estado cliente/servidor", donde el estado inicial difiere del estado después de la hidratación.

### Abordando el desajuste cliente/servidor

Una forma de abordar el desajuste cliente/servidor es añadiendo un estado `mounted`. Este estado asegura que la renderización de tu componente espere hasta que esté montado en el DOM, haciendo que todas las APIs web estén disponibles y asegurando que el estado inicial coincida con el estado después de la hidratación. Puedes lograr esto usando los hooks `useState` y `useEffect` para crear un estado montado. Aquí hay un ejemplo:

```jsx title="ThemeToggle.tsx"
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) {
  return <FallbackUI />; // o null;
}

return <button>{theme === "light" ? "🌙" : "🌞"}</button>;
```

Al verificar el estado `isMounted`, podemos renderizar una interfaz de usuario de respaldo o `null` hasta que el componente esté montado. Una vez que está montado, se renderizará la interfaz de usuario real.
