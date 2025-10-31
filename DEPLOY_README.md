# 🚀 Production Deployment - Quick Start

Server: **217.198.5.230** (root)

## 📋 Prerequisites Checklist

- [ ] SSH access to server (password or key)
- [ ] Node.js 20+ installed locally
- [ ] Project tested locally (`npm run dev`)
- [ ] Domain configured (optional)

---

## ⚡ Quick Deploy (3 варианта)

### Вариант 1: Автоматический (рекомендуется)

**Если есть SSH ключ:**
```bash
# Первый раз (настройка сервера)
./deploy.sh setup

# Деплой
./deploy.sh deploy
```

**Если нет SSH ключа, настроить:**
```bash
ssh-copy-id root@217.198.5.230
# Введите пароль root
```

---

### Вариант 2: Ручной деплой через SCP

```bash
# 1. Собрать проект
./build-for-deploy.sh

# 2. Загрузить на сервер
scp dist.tar.gz root@217.198.5.230:/tmp/

# 3. На сервере
ssh root@217.198.5.230
mkdir -p /var/www/ai-model-landing
cd /var/www/ai-model-landing
tar -xzf /tmp/dist.tar.gz --strip-components=1

# 4. Настроить Nginx (первый раз)
# См. DEPLOY_MANUAL.md секция "Настроить Nginx"
```

---

### Вариант 3: Cloudflare Pages (бесплатно, без VPS)

```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=ai-model-landing
```

Получите бесплатный URL: `ai-model-landing.pages.dev`

---

## 📁 Deployment Files

- **`deploy.sh`** - Автоматический деплой скрипт
- **`build-for-deploy.sh`** - Быстрая сборка для ручного деплоя  
- **`DEPLOYMENT.md`** - Полная документация
- **`DEPLOY_MANUAL.md`** - Ручной деплой step-by-step

---

## 🔧 Post-Deployment

### Проверить работу
```bash
curl -I http://217.198.5.230
```

### Настроить SSL (если есть домен)
```bash
ssh root@217.198.5.230
certbot --nginx -d yourdomain.com
```

### Настроить Telegram Bot
1. Открыть @BotFather
2. `/setmenubutton`
3. Ввести URL: `https://yourdomain.com` или `http://217.198.5.230`

---

## 🆘 Проблемы?

| Проблема | Решение |
|----------|---------|
| SSH не работает | `ssh-copy-id root@217.198.5.230` |
| Nginx не стартует | `nginx -t` на сервере |
| Сайт недоступен | Проверить firewall: `ufw status` |
| Permission denied | `chown -R www-data:www-data /var/www/ai-model-landing` |

Подробно в `DEPLOY_MANUAL.md`

---

## 📊 Monitoring

```bash
# На сервере
systemctl status nginx
tail -f /var/log/nginx/access.log
htop
df -h
```

---

## 🔄 Updates

```bash
# Автоматический
./deploy.sh deploy

# Ручной
./build-for-deploy.sh
scp dist.tar.gz root@217.198.5.230:/tmp/
ssh root@217.198.5.230 "cd /var/www/ai-model-landing && tar -xzf /tmp/dist.tar.gz --strip-components=1 && systemctl reload nginx"
```

---

## ✅ Production Checklist

- [ ] Проект собрался без ошибок
- [ ] Сайт доступен по IP
- [ ] SSL настроен (если домен)
- [ ] Telegram WebApp работает
- [ ] Haptics работают
- [ ] Fullscreen активируется
- [ ] Мониторинг настроен

---

**Готово! 🎉**

Для детальной информации см. `DEPLOYMENT.md`
