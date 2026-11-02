---
title: 'Mi VPS como plataforma de despliegue: Hetzner + Coolify + Cloudflare'
description: 'Cómo monté mi propio "mini Vercel": un servidor Ubuntu endurecido, apps en contenedores con Coolify, DNS y TLS con Cloudflare y monitoreo con Uptime Kuma.'
pubDate: 2026-10-20
cover: ../../../assets/blog/self-hosted-vps.webp
coverAlt: 'Servidor Hetzner con Coolify, Cloudflare y Uptime Kuma como plataforma de despliegue'
tags: [linux, ubuntu, docker, devops, self-hosting]
---

Los PaaS como Vercel o Railway son geniales hasta que tienes varios proyectos con base de datos, workers y alguna herramienta interna: la factura crece rápido. Por eso tengo un VPS en Hetzner que uso como plataforma de despliegue. Así lo armé.

## La arquitectura

- **Hetzner**: un VPS con Ubuntu Server.
- **Coolify**: un PaaS self-hosted. Despliega desde Git, maneja contenedores, bases de datos y certificados.
- **Cloudflare**: DNS, proxy y TLS en el borde.
- **Uptime Kuma**: me avisa si algo se cae.

## 1. Endurecer el servidor

Antes de instalar cualquier cosa, lo básico. Crea un usuario con sudo (con un nombre que no sea obvio) y entra solo con llave SSH:

```bash
adduser <usuario>
usermod -aG sudo <usuario>
# desde tu máquina:
ssh-copy-id <usuario>@<ip-del-servidor>
```

En `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart ssh
sudo apt install unattended-upgrades fail2ban -y
```

**Ojo con el firewall y Docker.** Docker escribe sus propias reglas de iptables y los puertos publicados se saltan `ufw`. Por eso prefiero el **Cloud Firewall de Hetzner**, que filtra antes de que el tráfico llegue al servidor. La regla es simple: abrir solo lo indispensable (HTTP, HTTPS y SSH, idealmente limitado a tus IPs).

## 2. Instalar Coolify

Coolify se instala con un solo script:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Al terminar entras al panel, creas tu cuenta y conectas GitHub. Desde ahí cada proyecto es una "aplicación": eliges el repo y la rama, y Coolify construye la imagen (con Nixpacks o tu `Dockerfile`) y la despliega en cada push.

Las bases de datos (PostgreSQL, Redis…) también se crean desde el panel, con backups programados.

Cuando ya tengas un dominio, pon el panel detrás de él y cierra en el firewall el puerto de acceso directo.

## 3. Cloudflare: DNS y TLS

En Cloudflare apunto un registro `A` al servidor con el proxy activado (nube naranja) y en **SSL/TLS** elijo **Full (strict)**. Coolify usa Traefik, que obtiene certificados de Let's Encrypt para cada dominio, así que el tráfico va cifrado de punta a punta.

Bonus: con el proxy activo la IP del servidor no queda expuesta en el DNS y tienes caché y protección DDoS gratis.

## 4. Monitoreo con Uptime Kuma

Uptime Kuma también se despliega desde Coolify como un servicio más. Agrego un monitor HTTP por proyecto y me llegan notificaciones si algo deja de responder. No necesito más.

## Herramientas internas

Una ventaja de tener tu propio servidor es que puedes alojar herramientas para ti. Yo tengo:

- **Stirling PDF**, con OCR en español, para unir, firmar o convertir PDFs sin subirlos a webs desconocidas.
- **Excalidraw**, para diagramas rápidos.

## ¿Vale la pena?

Para mí sí. Pago un precio fijo al mes por un servidor que aloja varios proyectos, y aprendí mucho de Linux, redes y Docker en el camino. A cambio, el mantenimiento es mío: actualizaciones, backups y estar pendiente del monitoreo.

Si solo tienes una landing estática, quédate con Vercel. Pero si tienes varios backends, Coolify en un VPS es una gran opción.
