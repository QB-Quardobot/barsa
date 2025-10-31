# 🚀 Deploy NOW - Quick Start Guide

## Domain: illariooo.ru → 217.198.5.230

**Git-Based Production Deployment - 3 команды и готово!**

---

## ⚡ Quick Deploy (5 минут)

### Шаг 1: Настроить SSH (30 секунд)

```bash
ssh-copy-id root@217.198.5.230
# Введите пароль root
```

### Шаг 2: Первоначальная настройка (3 минуты)

```bash
./deploy-git.sh setup
```

Это установит:
- ✅ Nginx
- ✅ Node.js 20
- ✅ Firewall
- ✅ Git repository на сервере
- ✅ Первую сборку проекта

### Шаг 3: Установить SSL (1 минута)

```bash
# Подождите 5-10 минут для DNS propagation
./deploy-git.sh ssl
```

### ✅ Готово!

Сайт доступен: **https://illariooo.ru**

---

## 🔄 Обновления (30 секунд)

Каждый раз когда нужно обновить сайт:

```bash
# Внести изменения в код
git add .
git commit -m "Update: описание"

# Задеплоить
./deploy-git.sh deploy
```

**Всё!** Сайт обновится автоматически.

---

## 📋 Checklist

### Перед деплоем:
- [ ] DNS настроен: `dig illariooo.ru +short` → `217.198.5.230`
- [ ] SSH работает: `ssh root@217.198.5.230`
- [ ] Код закоммичен: `git status`

### После деплоя:
- [ ] Сайт открывается: `open https://illariooo.ru`
- [ ] SSL работает (зеленый замок)
- [ ] Telegram bot настроен (@BotFather → /setmenubutton → https://illariooo.ru)

---

## 🎯 Команды

```bash
./deploy-git.sh setup      # Первоначальная настройка
./deploy-git.sh ssl        # Установить SSL
./deploy-git.sh deploy     # Обновить сайт
./deploy-git.sh verify     # Проверить статус
./deploy-git.sh logs       # Посмотреть логи
./deploy-git.sh rollback   # Откатить на предыдущую версию
```

---

## 🐛 Если что-то не работает

### DNS не настроен?

```bash
# Проверить
dig illariooo.ru +short

# Если вернул что-то другое или ничего:
# 1. Зайти в панель регистратора
# 2. Добавить A-record:
#    illariooo.ru → 217.198.5.230
#    www.illariooo.ru → 217.198.5.230
# 3. Подождать 5-30 минут
```

### SSH не работает?

```bash
# Попробовать с паролем
ssh root@217.198.5.230

# Если не работает - проверить:
# - IP правильный?
# - Сервер включен?
# - Пароль правильный?
```

### SSL не устанавливается?

```bash
# Убедиться что DNS propagation завершился
dig illariooo.ru +short
# Должен вернуть: 217.198.5.230

# Подождать еще 10 минут и повторить
./deploy-git.sh ssl
```

---

## 📱 Telegram Bot Setup

После деплоя:

1. Открыть **@BotFather**
2. Команда: `/setmenubutton`
3. Выбрать бота
4. URL: `https://illariooo.ru`
5. Текст: `Открыть AI Model 2.0`

**Готово!** Кнопка появится в боте.

---

## 📊 Мониторинг

```bash
# Проверить что сайт работает
curl https://illariooo.ru/health

# Посмотреть логи
./deploy-git.sh logs

# SSH на сервер
ssh root@217.198.5.230

# Проверить Nginx
systemctl status nginx
```

---

## 🔄 Типичный рабочий процесс

```bash
# 1. Внести изменения
code src/pages/index.astro

# 2. Протестировать локально
npm run dev

# 3. Закоммитить
git add .
git commit -m "Feature: новая фича"

# 4. Задеплоить
./deploy-git.sh deploy

# 5. Проверить
open https://illariooo.ru
```

---

## ✅ Всё готово!

Подробная документация: `PRODUCTION_DEPLOY.md`

**Время деплоя:** 5 минут первый раз, 30 секунд для обновлений

**Zero downtime!** Сайт не падает при обновлениях.

---

## 🎉 Production Features

✅ Автоматический git pull  
✅ SSL сертификат (Let's Encrypt)  
✅ HTTP/2 и Gzip compression  
✅ Security headers  
✅ Rate limiting  
✅ Firewall configured  
✅ Automatic backups (git history)  
✅ One-command rollback  
✅ Health check endpoint  

**Professional Senior DevOps Setup!** 🚀
