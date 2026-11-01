---
title: "Integrar JWT en un proyecto de Laravel 10: Guía paso a paso"
description: En este tutorial aprenderás a integrar JSON Web Tokens (JWT) en un proyecto Laravel 10 para autenticar y proteger tus rutas de forma segura.
pubDate: 2024-09-21
updatedDate: 2024-09-21
cover: ../../../assets/blog/laravel-jwt.webp
coverAlt: "JWT en Laravel"
tags: ["laravel", "jwt", "php", "framework", "backend", "authentication"]
---
En este tutorial aprenderás a integrar JSON Web Tokens (JWT) en un proyecto Laravel 10 para autenticar y proteger tus rutas de forma segura.

## Requisitos

- Laravel 10 instalado
- Composer
- Conocimientos básicos de Laravel

## 1. Instalar la librería JWT

Utilizaremos el paquete [tymon/jwt-auth](https://github.com/tymondesigns/jwt-auth). En la raíz de tu proyecto Laravel, ejecuta:

```bash
    composer require tymon/jwt-auth
```

## 2. Publicar el archivo de configuración
Publica el archivo de configuración de JWT:
```bash
    php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
```

Esto creará el archivo `config/jwt.php`.

## 3. Generar la clave secreta
Genera la clave secreta necesaria para firmar los tokens JWT:
```bash
    php artisan jwt:secret
```

Este comando agregará la variable `JWT_SECRET` en el archivo `.env`.

## 4. Configurar la autenticación
Asegúrate de que el sistema de autenticación de Laravel esté configurado correctamente. Puedes modificar el archivo `config/auth.php` para ajustar el controlador y los proveedores según tus necesidades.

## 5. Implementar el middleware de autenticación JWT
Crea un middleware para proteger tus rutas. Por ejemplo, edita el archivo `app/Http/Kernel.php` y registra el middleware:
```php
'jwt.verify' => \App\Http\Middleware\JwtMiddleware::class,
```

Luego crea el middleware:
```bash
php artisan make:middleware JwtMiddleware
```

En el archivo `app/Http/Middleware/JwtMiddleware.php`, añade la siguiente lógica:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtMiddleware
{
    public function handle($request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (Exception $e) {
            return response()->json(['error' => 'Token inválido o ausente'], 401);
        }
        return $next($request);
    }
}
```

## 6. Proteger las rutas con JWT
En tu archivo de rutas (por ejemplo, `routes/api.php`), utiliza el middleware para proteger las rutas que requieran autenticación:
```php
Route::group(['middleware' => ['jwt.verify']], function() {
    Route::get('user-profile', function() {
        return auth()->user();
    });
});
```

## 7. Autenticación y generación del token
Crea un controlador de autenticación (por ejemplo, `AuthController`) para manejar el inicio de sesión y la generación del token:
```bash
php artisan make:controller AuthController
```

Dentro de `AuthController.php`, implementa métodos para registrar, iniciar sesión y obtener el token. Un ejemplo básico para el inicio de sesión sería:
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        return response()->json(compact('token'));
    }
}
```

Registra la ruta en `routes/api.php`:
```php
Route::post('login', [AuthController::class, 'login']);
```

## Conclusión
Con estos pasos hemos integrado JWT en un proyecto Laravel 10, permitiendo proteger rutas y gestionar la autenticación de forma segura. Ahora puedes ampliar la funcionalidad para registrar usuarios, refrescar tokens y más.