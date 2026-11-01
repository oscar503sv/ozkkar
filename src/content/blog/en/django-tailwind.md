---
title: Starting a Django project with Tailwind CSS
description: In this tutorial you'll create a Django project and integrate Tailwind CSS to improve your app's design.
pubDate: 2024-10-20
updatedDate: 2024-10-20
cover: ../../../assets/blog/django-tailwind.webp
coverAlt: "Integrating Tailwind with Django"
tags: ["django", "tailwind", "css", "python", "node.js"]
---
In this tutorial you'll create a Django project and integrate it with Tailwind CSS to improve your app's design.

## Requirements

- Python 3.7 or later
- Basic knowledge of Django
- Node.js (to compile Tailwind CSS)

## 1. Create a virtual environment and install Django

First, create a virtual environment to keep your dependencies organized:

```bash
python -m venv env
```

### Activate the virtual environment

Windows:
```bash
env\Scripts\activate
```

macOS/Linux:
```bash
source env/bin/activate
```

Install Django:

```bash
pip install django
```

## 2. Start a Django project and app

Create a new Django project:

```bash
django-admin startproject my_project
cd my_project
```

Create an app (for example, "web"):

```bash
python manage.py startapp web
```

## 3. Integrate Tailwind CSS

To integrate Tailwind with Django, we'll use the django-tailwind package.

### 3.1 Install django-tailwind

Inside the virtual environment, install the package:
```bash
pip install django-tailwind
```

### 3.2 Configure django-tailwind

1. Add `'tailwind'` and the theme app to `INSTALLED_APPS` in `my_project/settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'tailwind',
    'theme',  # This will be the name of your theme app
    # ...
]
```

2. Set the name of the Tailwind app in your settings:
```python
TAILWIND_APP_NAME = 'theme'
```

3. Create the theme app:
```bash
python manage.py tailwind init theme
```

### 3.3 Configure and build Tailwind

Install the Node.js dependencies for Tailwind:
```bash
cd theme
npm install
```

Build the CSS files:
```bash
npm run dev
```

## 4. Run the project

Go back to the root folder and start the development server:
```bash
cd ..
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser to see your app in action.

## Conclusion

With these steps you have a Django project set up and integrated with Tailwind CSS. From here you can keep customizing the styles and building your app.
