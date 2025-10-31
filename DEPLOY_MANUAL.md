# Manual Production Deployment Guide

Если автоматический деплой не работает из-за SSH доступа, следуйте этой инструкции.

## Вариант 1: Настройка SSH ключа (рекомендуется)

### На локальной машине:
```bash
# Сгенерировать SSH ключ (если еще нет)
ssh-keygen -t ed25519 -C "deploy@ai-model"

# Скопировать публичный ключ на сервер
ssh-copy-id root@217.198.5.230
# Введите пароль root

# Проверить подключение
ssh root@217.198.5.230 "echo 'SSH работает'"
```

После настройки SSH можно использовать:
```bash
./deploy.sh setup   # Первый раз
./deploy.sh deploy  # Для деплоя
```

---

## Вариант 2: Деплой через SCP (без rsync)

### Шаг 1: Собрать проект локально
```bash
# Установить зависимости
npm ci

# Собрать проект
npm run build

# Создать архив
tar -czf dist.tar.gz dist/
```

### Шаг 2: Загрузить на сервер
```bash
# Загрузить архив
scp dist.tar.gz root@217.198.5.230:/tmp/

# Подключиться к серверу
ssh root@217.198.5.230
```

### Шаг 3: На сервере выполнить
```bash
# Установить необходимые пакеты
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Создать директорию
mkdir -p /var/www/ai-model-landing

# Распаковать файлы
cd /var/www/ai-model-landing
tar -xzf /tmp/dist.tar.gz --strip-components=1

# Установить права
chown -R www-data:www-data /var/www/ai-model-landing
find /var/www/ai-model-landing -type d -exec chmod 755 {} \;
find /var/www/ai-model-landing -type f -exec chmod 644 {} \;

# Настроить Nginx
nano /etc/nginx/sites-available/ai-model-landing
```

Скопируйте конфигурацию из `deploy.sh` (секция NGINX CONFIG) или используйте минимальную:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    root /var/www/ai-model-landing;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
    
    # Cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files $uri $uri/ /index.html =404;
    }
    
    # Health check
    location /health {
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Включить сайт
ln -sf /etc/nginx/sites-available/ai-model-landing /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
systemctl enable nginx

# Настроить firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Проверить
curl http://localhost
```

---

## Вариант 3: Docker деплой (продвинутый)

### Создать Dockerfile
```dockerfile
FROM nginx:alpine

# Copy built files
COPY dist/ /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Команды
```bash
# Собрать образ
docker build -t ai-model-landing .

# Запустить
docker run -d -p 80:80 --name ai-model ai-model-landing

# Проверить
docker ps
curl http://localhost
```

---

## Вариант 4: Использование Cloudflare Pages (бесплатно)

```bash
# Установить Wrangler
npm install -g wrangler

# Логин
wrangler login

# Деплой
npm run build
wrangler pages deploy dist --project-name=ai-model-landing
```

Преимущества:
- Бесплатный хостинг
- Глобальный CDN
- Автоматический SSL
- Нет нужды в VPS

---

## Быстрая проверка после деплоя

```bash
# Проверить сайт работает
curl -I http://217.198.5.230

# Проверить Nginx
systemctl status nginx

# Проверить логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Проверить место на диске
df -h

# Проверить память
free -h
```

---

## Настройка SSL (после деплоя)

```bash
# На сервере
certbot --nginx

# Следуйте инструкциям:
# 1. Введите email
# 2. Согласитесь с ToS
# 3. Введите домен (или оставьте IP для тестирования)

# Проверить автообновление
certbot renew --dry-run
```

---

## Обновление сайта в будущем

### С SSH доступом:
```bash
./deploy.sh deploy
```

### Без автоматизации:
```bash
# Локально
npm run build
tar -czf dist.tar.gz dist/

# Загрузить
scp dist.tar.gz root@217.198.5.230:/tmp/

# На сервере
cd /var/www/ai-model-landing
tar -xzf /tmp/dist.tar.gz --strip-components=1
systemctl reload nginx
```

---

## Troubleshooting

### Nginx не стартует
```bash
# Проверить конфигурацию
nginx -t

# Проверить логи
journalctl -u nginx -n 50

# Проверить порты
netstat -tlnp | grep nginx
```

### Сайт недоступен
```bash
# Проверить firewall
ufw status

# Проверить Nginx работает
systemctl status nginx

# Проверить файлы существуют
ls -la /var/www/ai-model-landing/

# Проверить права
ls -la /var/www/ai-model-landing/index.html
```

### Permission denied
```bash
chown -R www-data:www-data /var/www/ai-model-landing
chmod 755 /var/www/ai-model-landing
```

---

## Мониторинг

### Установить мониторинг
```bash
# Htop для CPU/RAM
apt-get install htop
htop

# Disk usage
df -h
du -sh /var/www/ai-model-landing

# Network
apt-get install nethogs
nethogs
```

### Настроить алерты (опционально)
```bash
# Установить простой health check
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -sf http://localhost/health > /dev/null; then
    echo "Site is down!" | mail -s "Alert: Site Down" your@email.com
    systemctl restart nginx
fi
EOF

chmod +x /usr/local/bin/health-check.sh

# Добавить в cron (каждые 5 минут)
crontab -e
# Добавить: */5 * * * * /usr/local/bin/health-check.sh
```

---

## Нужна помощь?

1. **SSH доступ не работает**: Проверьте пароль root или настройте SSH ключ
2. **Nginx ошибки**: Запустите `nginx -t` для диагностики
3. **Сайт медленный**: Проверьте `htop` и добавьте swap если нужно
4. **SSL проблемы**: Убедитесь что домен указывает на сервер

Для автоматического деплоя настройте SSH ключ - это самый простой вариант!
