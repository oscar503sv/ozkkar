---
title: "Instalación y configuración de Nginx con Let’s Encrypt y iptables en Ubuntu"
description: "En este tutorial, te mostraremos cómo instalar y proteger Nginx en un servidor Ubuntu 22.04, 20.04, 18.04 utilizando Let's Encrypt e iptables"
pubDate: 2024-11-15
updatedDate: 2024-11-15
cover: ../../../assets/blog/install-nginx-secure.webp
coverAlt: "Nginx secure on Ubuntu"
tags: ["nginx", "ubuntu", "linux", "webserver", "security", "firewall", "iptables", "letsencrypt", "certbot"]
---

En este tutorial, te mostraremos cómo instalar y proteger Nginx en un servidor Ubuntu 22.04, 20.04, 18.04 utilizando Let's Encrypt e iptables.

## Prerrequisitos

- Un servidor con Ubuntu 22.04, 20.04, 18.04.
- Un usuario no-root con privilegios sudo.
- Asegúrate de que tu sistema esté actualizado.

```bash
sudo apt update && sudo apt upgrade -y
```

## Instalar Paquetes Requeridos

Primero, necesitarás instalar los paquetes requeridos en tu sistema. Puedes instalarlos todos con el siguiente comando:

```bash
sudo apt install nginx iptables-persistent certbot python3-certbot-nginx curl -y
```

Una vez que todos los paquetes estén instalados, puedes proceder al siguiente paso.

## Configurar el Firewall

A continuación, necesitarás configurar el firewall para permitir el tráfico HTTP y HTTPS. Puedes hacerlo con el siguiente comando:

```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

Luego, limita el número de conexiones por dirección IP para prevenir ataques DDoS:

```bash
sudo iptables -A INPUT -p tcp --syn --dport 80 -m connlimit --connlimit-above 20 --connlimit-mask 24 -j DROP
sudo iptables -A INPUT -p tcp --syn --dport 443 -m connlimit --connlimit-above 20 --connlimit-mask 24 -j DROP
```

A continuación, permite el tráfico SSH:

```bash
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

Luego, bloquea los paquetes inválidos y los nuevos paquetes entrantes que no sean SYN:

```bash
iptables -t mangle -A PREROUTING -m conntrack --ctstate INVALID -j DROP
iptables -t mangle -A PREROUTING -p tcp ! --syn -m conntrack --ctstate NEW -j DROP
```

A continuación, permite el tráfico entrante establecido y relacionado:

```bash
sudo iptables -A INPUT -p tcp --dport 80,443 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 80,443 -m conntrack --ctstate ESTABLISHED -j ACCEPT
```

Luego, bloquea los paquetes falsificados:

```bash
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,SYN FIN,SYN -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,RST FIN,RST -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,ACK FIN -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ACK,URG URG -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ACK,PSH PSH -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ALL NONE -j DROP
```

Finalmente, bloquea todo el resto del tráfico entrante:

```bash
iptables -t mangle -A PREROUTING -s 224.0.0.0/3 -j DROP 
iptables -t mangle -A PREROUTING -s 169.254.0.0/16 -j DROP 
iptables -t mangle -A PREROUTING -s 172.16.0.0/12 -j DROP 
iptables -t mangle -A PREROUTING -s 192.0.2.0/24 -j DROP 
iptables -t mangle -A PREROUTING -s 192.168.0.0/16 -j DROP 
iptables -t mangle -A PREROUTING -s 10.0.0.0/8 -j DROP 
iptables -t mangle -A PREROUTING -s 0.0.0.0/8 -j DROP 
iptables -t mangle -A PREROUTING -s 240.0.0.0/5 -j DROP 
iptables -t mangle -A PREROUTING -s 127.0.0.0/8 ! -i lo -j DROP
```

## Certbot

Necesitarás editar el archivo de configuración de Nginx y añadir tu nombre de dominio. Puedes hacerlo con el siguiente comando:

```bash
sudo nano /etc/nginx/sites-available/default
```

Edita cada línea donde dice `server_name` y reemplázala con tu nombre de dominio. Así:

```bash
server {
    server_name _; # reemplaza con tu nombre de dominio server_name ejemplo.com www.ejemplo.com;
}
```

A continuación, necesitarás obtener un certificado SSL de Let's Encrypt. Puedes hacerlo con el siguiente comando:

```bash
sudo certbot --nginx -d ejemplo.com -d www.ejemplo.com
```

Reemplaza `ejemplo.com` con tu nombre de dominio. Se te pedirá que proporciones tu dirección de correo electrónico y aceptes los términos de servicio.

## Configurar Nginx

A continuación, necesitarás configurar Nginx para redirigir todo el tráfico HTTP a HTTPS. Puedes hacerlo con el siguiente comando:

```bash
sudo nano /etc/nginx/sites-available/default
```

Reemplaza todas las líneas con las siguientes:

```bash
server_tokens off;

server {
    listen 80;
    server_name ejemplo.com www.ejemplo.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ejemplo.com www.ejemplo.com;
    
    ssl_certificate /etc/letsencrypt/live/ejemplo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ejemplo.com/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "no-referrer-when-downgrade";
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'";
    add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()";

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ /\.ht {
        deny all;
    }

    location ~* \.(?:css|gif|htc|ico|jpg|js|png|svg|woff|woff2|otf)$ {
        expires 1M;
        access_log off;
        add_header Cache-Control "public";
    }

    location ~* \.(?:html|htm|txt)$ {
        expires 1M;
        access_log off;
        add_header Cache-Control "public";
    }

    location ~* \.(?:ttf|eot)$ {
        expires 1M;
        access_log off;
        add_header Cache-Control "public";
    }

    location ~* \.(?:xml|rss|svg|svgz|atom)$ {
        expires 1h;
        access_log off;
        add_header Cache-Control "public";
    }

    location ~* \.(?:js|css)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }

    location ~* \.(?:json|map)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }
}
```

Guarda y cierra el archivo cuando hayas terminado. Luego, prueba la configuración de Nginx con el siguiente comando:

```bash
sudo nginx -t
```

Deberías obtener la siguiente salida:

```bash
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

A continuación, reinicia el servicio Nginx para aplicar los cambios:

```bash
sudo systemctl restart nginx
```

## Gracias por leer

En este tutorial, has aprendido cómo instalar y proteger Nginx en un servidor Ubuntu 22.04, 20.04, 18.04 utilizando Let's Encrypt e iptables. Ahora puedes alojar tu sitio web en tu propio servidor.
