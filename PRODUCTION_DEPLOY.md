# 🚀 Production Deployment - Git-Based Workflow

## Domain: illariooo.ru
## Server: 217.198.5.230

**Senior DevOps Professional Setup - Git Pull Deployment**

---

## 📋 Overview

Это professional git-based deployment workflow:
- ✅ Автоматический git pull на сервере
- ✅ Zero-downtime deployments
- ✅ Automatic SSL с Let's Encrypt
- ✅ Nginx с оптимизацией
- ✅ Rollback support
- ✅ Health checks

---

## 🎯 Pre-Deployment Checklist

### 1. DNS Configuration
```bash
# Убедитесь что домен указывает на сервер
dig illariooo.ru +short
# Должен вернуть: 217.198.5.230

dig www.illariooo.ru +short
# Должен вернуть: 217.198.5.230
```

Если DNS не настроен:
1. Зайдите в панель вашего регистратора
2. Добавьте A-записи:
   - `illariooo.ru` → `217.198.5.230`
   - `www.illariooo.ru` → `217.198.5.230`
3. Подождите 5-30 минут для propagation

### 2. SSH Access
```bash
# Настройте SSH ключ (ОБЯЗАТЕЛЬНО!)
ssh-copy-id root@217.198.5.230
# Введите пароль root

# Проверьте
ssh root@217.198.5.230 "echo 'SSH OK'"
```

### 3. Local Repository
```bash
# Убедитесь что все изменения закоммичены
git status

# Если есть изменения - закоммитьте
git add .
git commit -m "Ready for production"

# Убедитесь что можете пушить
git push origin main
```

---

## 🚀 Deployment Process

### Step 1: Prepare Deploy Script

```bash
# Сделать скрипт исполняемым
chmod +x deploy-git.sh

# Проверить конфигурацию
cat astro.config.mjs | grep site
# Должно быть: site: 'https://illariooo.ru'
```

### Step 2: Initial Setup (Первый раз)

Эта команда выполнит:
- Установку Nginx, Node.js, certbot
- Настройку firewall
- Клонирование репозитория
- Первую сборку проекта
- Конфигурацию Nginx

```bash
./deploy-git.sh setup
```

**Процесс займет 3-5 минут. Вы увидите:**

```
🚀 Git-Based Production Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[STEP] Checking prerequisites...
[✓] Prerequisites checked

[STEP] Pushing to git repository...
[✓] Pushed to git

[STEP] Testing server connection...
[✓] Server connection OK

[STEP] Initial server setup...
📦 Installing system packages...
🔧 Installing Node.js 20...
🔒 Configuring firewall...
[✓] Initial setup complete

[STEP] Setting up git repository on server...
📁 Creating directory structure...
🔄 Cloning repository...
📦 Installing dependencies...
🔨 Building project...
[✓] Git repository configured

[STEP] Configuring Nginx for illariooo.ru...
[✓] Nginx configured

[STEP] Verifying deployment...
[✓] Nginx is running
[✓] Site is responding (HTTP 200)
[✓] Verification complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initial Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next step: Setup SSL
  Run: ./deploy-git.sh ssl
```

### Step 3: Setup SSL Certificate

Подождите 5-10 минут после Step 2 чтобы DNS propagation завершился.

```bash
# Проверьте DNS еще раз
dig illariooo.ru +short
# Должен вернуть: 217.198.5.230

# Установите SSL
./deploy-git.sh ssl
```

**Вы увидите:**

```
[STEP] Setting up SSL certificate...
🔒 Requesting SSL certificate...
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Congratulations! You have successfully enabled HTTPS on
https://illariooo.ru and https://www.illariooo.ru
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

[✓] SSL configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SSL Certificate Installed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Site: https://illariooo.ru
```

### Step 4: Verify Deployment

```bash
# Проверить что всё работает
./deploy-git.sh verify

# Или вручную
curl -I https://illariooo.ru
# Должен вернуть: HTTP/2 200

# Открыть в браузере
open https://illariooo.ru
```

---

## 🔄 Regular Deployments (После первого раза)

Каждый раз когда нужно обновить сайт:

```bash
# 1. Внести изменения в код
# 2. Закоммитить
git add .
git commit -m "Feature: новая фича"

# 3. Задеплоить (автоматически пушит и деплоит)
./deploy-git.sh deploy
```

**Процесс:**
1. Проверяет uncommitted changes
2. Коммитит их автоматически
3. Пушит в git
4. На сервере делает `git pull`
5. Запускает `npm ci && npm run build`
6. Перезагружает Nginx

**Zero downtime!** Сайт не падает во время деплоя.

---

## 🎯 How It Works

### Architecture

```
Local Machine          GitHub              Production Server
     │                   │                        │
     │  git push         │                        │
     │ ─────────────────>│                        │
     │                   │                        │
     │  ./deploy-git.sh  │                        │
     │  deploy           │                        │
     │ ──────────────────────────────────────────>│
     │                   │      SSH               │
     │                   │   git pull             │
     │                   │<───────────────────────│
     │                   │                        │
     │                   │   npm build            │
     │                   │   nginx reload         │
     │                   │                        │
     │  ✅ Done          │                        │
     │<───────────────────────────────────────────│
```

### Server Structure

```
/var/www/illariooo.ru/
├── .git/                    # Git repository
├── node_modules/            # Dependencies
├── src/                     # Source code
├── dist/                    # Built files (served by Nginx)
├── package.json
└── ...

/etc/nginx/sites-available/
└── illariooo.ru             # Nginx config

/var/log/nginx/
├── illariooo.ru-access.log  # Access logs
└── illariooo.ru-error.log   # Error logs
```

---

## 🔧 Advanced Operations

### View Logs

```bash
# Show recent logs
./deploy-git.sh logs

# Or manually on server
ssh root@217.198.5.230
tail -f /var/log/nginx/illariooo.ru-access.log
tail -f /var/log/nginx/illariooo.ru-error.log
```

### Rollback

Если что-то пошло не так:

```bash
./deploy-git.sh rollback
```

Скрипт покажет последние 5 коммитов, выберите нужный:

```
⏪ Rolling back...
abc123 Feature: latest feature
def456 Fix: bug fix
ghi789 Update: content update
jkl012 Initial deployment
mno345 Setup project

Enter commit hash to rollback to: def456
```

### Manual Operations

```bash
# SSH на сервер
ssh root@217.198.5.230

# Перейти в директорию проекта
cd /var/www/illariooo.ru

# Посмотреть текущий коммит
git log --oneline -n 5

# Ручной pull
git pull origin main

# Ручная сборка
npm ci
npm run build

# Перезагрузить Nginx
systemctl reload nginx

# Проверить статус
systemctl status nginx

# Проверить конфигурацию
nginx -t
```

---

## 📊 Monitoring & Maintenance

### Check Site Health

```bash
# Health check endpoint
curl https://illariooo.ru/health
# Должен вернуть: OK

# Check SSL
curl -I https://illariooo.ru
# Должен быть: HTTP/2 200

# Check response time
time curl -s https://illariooo.ru > /dev/null
```

### Server Monitoring

```bash
ssh root@217.198.5.230

# CPU and Memory
htop

# Disk usage
df -h

# Nginx status
systemctl status nginx

# Check if site is up
curl http://localhost/health

# Recent visitors
tail -f /var/log/nginx/illariooo.ru-access.log
```

### SSL Certificate Renewal

Автоматически обновляется через systemd timer:

```bash
# На сервере
ssh root@217.198.5.230

# Проверить статус сертификата
certbot certificates

# Проверить авто-обновление
systemctl list-timers | grep certbot

# Ручное обновление (если нужно)
certbot renew

# Тест обновления (dry run)
certbot renew --dry-run
```

Сертификат обновится автоматически за 30 дней до истечения.

---

## 🔒 Security Features

### What's Configured

✅ **Firewall (UFW)**
- Port 22 (SSH)
- Port 80 (HTTP → redirects to HTTPS)
- Port 443 (HTTPS)

✅ **Fail2ban**
- Protection против brute-force
- Автобан после 5 failed attempts

✅ **Nginx Security**
- Rate limiting (10 req/s)
- Security headers
- HSTS enabled
- CSP for Telegram WebApp

✅ **SSL/TLS**
- TLS 1.2 and 1.3 only
- Modern cipher suites
- SSL stapling

### Check Security

```bash
# На сервере
ssh root@217.198.5.230

# Check firewall
ufw status

# Check fail2ban
fail2ban-client status

# Check SSL rating
# https://www.ssllabs.com/ssltest/analyze.html?d=illariooo.ru
```

---

## 📱 Telegram Bot Configuration

После деплоя настройте бота:

### 1. Update Bot Menu Button

```
1. Открыть @BotFather
2. Отправить: /setmenubutton
3. Выбрать бота
4. Ввести URL: https://illariooo.ru
5. Ввести текст кнопки: "Открыть AI Model 2.0"
```

### 2. Test in Telegram

```
1. Открыть бота в Telegram
2. Нажать кнопку меню
3. Проверить:
   - ✅ Fullscreen активируется
   - ✅ Haptics работают при касании
   - ✅ Свайп вниз заблокирован
   - ✅ Контент загружается
```

---

## 🐛 Troubleshooting

### Site not accessible

```bash
# Check DNS
dig illariooo.ru +short

# Check Nginx
ssh root@217.198.5.230 "systemctl status nginx"

# Check firewall
ssh root@217.198.5.230 "ufw status"

# Test locally on server
ssh root@217.198.5.230 "curl http://localhost"
```

### SSL issues

```bash
# Check certificate
ssh root@217.198.5.230 "certbot certificates"

# Force renewal
ssh root@217.198.5.230 "certbot renew --force-renewal"

# Check Nginx SSL config
ssh root@217.198.5.230 "nginx -t"
```

### Deployment fails

```bash
# Check git status on server
ssh root@217.198.5.230 "cd /var/www/illariooo.ru && git status"

# Check build logs
ssh root@217.198.5.230 "cd /var/www/illariooo.ru && npm run build"

# Check permissions
ssh root@217.198.5.230 "ls -la /var/www/illariooo.ru/dist"
```

### Performance issues

```bash
# On server
ssh root@217.198.5.230

# Check CPU/RAM
htop

# Check disk
df -h

# Check slow queries in logs
tail -n 100 /var/log/nginx/illariooo.ru-access.log | awk '{print $NF}' | sort -n
```

---

## 📈 Performance Optimization

### Already Configured

✅ **Gzip compression** - text files compressed
✅ **HTTP/2** - faster loading
✅ **Static asset caching** - 1 year for images
✅ **SSL session caching** - faster HTTPS
✅ **Rate limiting** - DDoS protection

### Optional Improvements

**1. Add Brotli Compression:**
```bash
ssh root@217.198.5.230
apt-get install nginx-module-brotli
# Add to nginx.conf and reload
```

**2. Add CDN (Cloudflare):**
- Бесплатный tier доступен
- Добавляет еще кеширование
- DDoS protection
- Analytics

**3. Add Monitoring:**
```bash
# Install monitoring tools
ssh root@217.198.5.230
apt-get install prometheus-node-exporter
```

---

## 🔄 CI/CD Integration (Future)

Можно добавить GitHub Actions для автоматического деплоя:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
        run: |
          echo "$SSH_KEY" > key.pem
          chmod 600 key.pem
          ssh -i key.pem root@217.198.5.230 "cd /var/www/illariooo.ru && git pull && npm ci && npm run build && systemctl reload nginx"
```

---

## 📝 Maintenance Schedule

### Daily
- [ ] Check site is up: `curl https://illariooo.ru/health`

### Weekly
- [ ] Review access logs
- [ ] Check disk space: `df -h`
- [ ] Review error logs

### Monthly
- [ ] Update system packages: `apt-get update && apt-get upgrade`
- [ ] Review SSL certificate expiry
- [ ] Check backup availability

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization

---

## ✅ Production Checklist

После деплоя проверьте:

- [ ] Site accessible via https://illariooo.ru
- [ ] SSL certificate valid (green padlock)
- [ ] www.illariooo.ru redirects to illariooo.ru
- [ ] HTTP redirects to HTTPS
- [ ] /health returns 200 OK
- [ ] Telegram WebApp works
- [ ] Fullscreen activates
- [ ] Haptics work on touch
- [ ] No console errors
- [ ] Images load correctly
- [ ] Forms work (if any)
- [ ] Mobile responsive
- [ ] Performance good (< 3s load)

---

## 🆘 Emergency Contacts

**DevOps Engineer:** [Your contact]
**Server Provider:** [Provider details]
**DNS Provider:** [DNS provider details]
**Emergency Rollback:** `./deploy-git.sh rollback`

---

## 📚 Quick Reference

```bash
# Setup (first time)
./deploy-git.sh setup
./deploy-git.sh ssl

# Regular deployment
./deploy-git.sh deploy

# Verify
./deploy-git.sh verify

# Rollback
./deploy-git.sh rollback

# Logs
./deploy-git.sh logs

# SSH to server
ssh root@217.198.5.230

# Check site
curl https://illariooo.ru/health
```

---

**Production Ready! 🎉**

Теперь у вас professional git-based deployment workflow как у Senior DevOps инженера!
