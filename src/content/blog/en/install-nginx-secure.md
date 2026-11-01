---
title: "Installing Nginx with Let’s Encrypt and iptables on Ubuntu"
description: "How to install and secure Nginx on an Ubuntu 22.04, 20.04 or 18.04 server using Let's Encrypt and iptables."
pubDate: 2024-11-15
updatedDate: 2024-11-15
cover: ../../../assets/blog/install-nginx-secure.webp
coverAlt: "Nginx secure on Ubuntu"
tags: ["nginx", "ubuntu", "linux", "webserver", "security", "firewall", "iptables", "letsencrypt", "certbot"]
---

In this tutorial, we'll show you how to install and secure Nginx on an Ubuntu 22.04, 20.04 or 18.04 server using Let's Encrypt and iptables.

## Prerequisites

- A server running Ubuntu 22.04, 20.04 or 18.04.
- A non-root user with sudo privileges.
- Make sure your system is up to date.

```bash
sudo apt update && sudo apt upgrade -y
```

## Install the required packages

First, install the required packages on your system. You can install them all with the following command:

```bash
sudo apt install nginx iptables-persistent certbot python3-certbot-nginx curl -y
```

Once every package is installed, you can move on to the next step.

## Configure the firewall

Next, configure the firewall to allow HTTP and HTTPS traffic:

```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

Then limit the number of connections per IP address to help prevent DDoS attacks:

```bash
sudo iptables -A INPUT -p tcp --syn --dport 80 -m connlimit --connlimit-above 20 --connlimit-mask 24 -j DROP
sudo iptables -A INPUT -p tcp --syn --dport 443 -m connlimit --connlimit-above 20 --connlimit-mask 24 -j DROP
```

Next, allow SSH traffic:

```bash
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

Then drop invalid packets and new incoming packets that aren't SYN:

```bash
iptables -t mangle -A PREROUTING -m conntrack --ctstate INVALID -j DROP
iptables -t mangle -A PREROUTING -p tcp ! --syn -m conntrack --ctstate NEW -j DROP
```

Next, allow established and related incoming traffic:

```bash
sudo iptables -A INPUT -p tcp --dport 80,443 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT
sudo iptables -A OUTPUT -p tcp --sport 80,443 -m conntrack --ctstate ESTABLISHED -j ACCEPT
```

Then block spoofed packets:

```bash
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,SYN FIN,SYN -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,RST FIN,RST -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags FIN,ACK FIN -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ACK,URG URG -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ACK,PSH PSH -j DROP
iptables -t mangle -A PREROUTING -p tcp --tcp-flags ALL NONE -j DROP
```

Finally, block the rest of the unwanted incoming traffic:

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

You'll need to edit the Nginx configuration file and add your domain name:

```bash
sudo nano /etc/nginx/sites-available/default
```

Edit every line that contains `server_name` and replace it with your domain name, like this:

```nginx
server {
    server_name _; # replace with your domain: server_name example.com www.example.com;
}
```

Next, get an SSL certificate from Let's Encrypt:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Replace `example.com` with your domain name. You'll be asked for your email address and to accept the terms of service.

## Configure Nginx

Next, configure Nginx to redirect all HTTP traffic to HTTPS. Open the configuration file again:

```bash
sudo nano /etc/nginx/sites-available/default
```

Replace its contents with the following:

```nginx
server_tokens off;

server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
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

Save and close the file when you're done. Then test the Nginx configuration:

```bash
sudo nginx -t
```

You should see the following output:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Finally, restart Nginx to apply the changes:

```bash
sudo systemctl restart nginx
```

## Thanks for reading

In this tutorial, you learned how to install and secure Nginx on an Ubuntu 22.04, 20.04 or 18.04 server using Let's Encrypt and iptables. You can now host your website on your own server.
