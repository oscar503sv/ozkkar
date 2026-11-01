---
title: Iniciar un proyecto en Django e integrarlo con Tailwind CSS
description: En este tutorial aprenderás a crear un proyecto en Django y a integrarlo con Tailwind CSS para mejorar el diseño de tu aplicación.
pubDate: 2024-10-20
updatedDate: 2024-10-20
cover: ../../../assets/blog/django-tailwind.webp
coverAlt: "Integrar Tailwind con Django"
tags: ["django", "tailwind", "css", "python", "node.js"]
---
En este tutorial aprenderás a crear un proyecto en Django y a integrarlo con Tailwind CSS para mejorar el diseño de tu aplicación.

## Requisitos

- Python 3.7 o superior
- Conocimientos básicos de Django
- Node.js (para compilar Tailwind CSS)

## 1. Crear un entorno virtual e instalar Django

Primero, crea un entorno virtual para mantener las dependencias organizadas:

```bash
python -m venv env
``` 

### Activa el entorno virtual:

Windows:
```bash
env\Scripts\activate
```

MacOS/Linux:
```bash
source env/bin/activate
```

Instala Django:

```bash
pip install django
```

## 2. Iniciar un proyecto y una aplicación en Django
Crea un nuevo proyecto Django:

```bash
django-admin startproject mi_proyecto
cd mi_proyecto
```

Crea una aplicación (por ejemplo, "web"):

```bash
python manage.py startapp web
```

## 3. Integrar Tailwind CSS
Para integrar Tailwind en Django, usaremos el paquete django-tailwind.

### 3.1 Instalar django-tailwind
Dentro del entorno virtual, instala el paquete:
```bash
pip install django-tailwind
```

### 3.2. Configurar django-tailwind
1. Agrega 'tailwind' y la aplicación de tema a la lista de INSTALLED_APPS en mi_proyecto/settings.py:
```python
INSTALLED_APPS = [
    # ...
    'tailwind',
    'theme',  # Este será el nombre de tu app de tema
    # ...
]
```

2. Define el nombre de la app de Tailwind en el settings:
```python
TAILWIND_APP_NAME = 'theme'
```

3. Crea la aplicación de tema:
```python
python manage.py tailwind init theme
```

### 3.3. Configurar y compilar Tailwind
Instala las dependencias de Node.js para Tailwind:
```bash
cd theme
npm install
```

Compila los archivos CSS:
```bash
npm run dev
```

### 4. Ejecutar el proyecto
Regresa a la carpeta raíz y levanta el servidor de desarrollo:
```bash
cd ..
python manage.py runserver
```

Abre el navegador en http://127.0.0.1:8000 para ver tu aplicación en acción.

### Conclusión
Con estos pasos ya tienes un proyecto Django configurado e integrado con Tailwind CSS. Puedes continuar personalizando los estilos y desarrollando tu aplicación.