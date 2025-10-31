# Команды для проверки и деплоя на сервер illariooo.ru

## Подключение к серверу
```bash
ssh root@217.198.5.230
# или
ssh root@illariooo.ru
```

## 1. Проверка текущего состояния
```bash
# Запустить скрипт проверки
bash check-server.sh

# Или вручную:
systemctl status nginx
nginx -t
tail -30 /var/log/nginx/error.log
ls -lah /var/www/html/
```

## 2. Проверка что сайт отдает правильные файлы
```bash
# Найти где лежат файлы сайта
find /var/www -name "index.html" 2>/dev/null
find ~ -name "dist" -type d 2>/dev/null

# Проверить содержимое index.html
cat /var/www/html/index.html | grep -i "earnings-ticker\|Telegram" | head -5

# Проверить доступность JS файлов
curl -I https://illariooo.ru/_astro/index.js 2>&1 | head -10
```

## 3. Обновление сайта (если нужно)
```bash
# Перейти в директорию проекта (нужно узнать путь)
cd /path/to/project  # замените на реальный путь

# Запушить последние изменения
git pull origin master

# Пересобрать проект
npm install
npm run build

# Скопировать dist в директорию nginx
# Вариант 1: если сайт в /var/www/html
sudo cp -r dist/* /var/www/html/

# Вариант 2: если используется symlink
sudo rm /var/www/html
sudo ln -s $(pwd)/dist /var/www/html

# Перезагрузить nginx
sudo systemctl reload nginx
```

## 4. Проверка CSP (Content Security Policy)
Проблема может быть в строгом CSP. Нужно проверить конфиг nginx:
```bash
# Найти конфиг сайта
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/illariooo.ru  # или другое имя

# Проверить CSP заголовки
curl -I https://illariooo.ru 2>&1 | grep -i "content-security"
```

Если CSP блокирует inline скрипты, нужно добавить nonce или разрешить 'unsafe-inline' для script-src:
```
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; ...";
```

## 5. Проверка что Telegram WebApp API загружается
```bash
# Проверить доступность telegram.org скрипта
curl -I https://telegram.org/js/telegram-web-app.js 2>&1 | head -5

# Проверить в браузере: открыть консоль на https://illariooo.ru
# Должна быть доступна window.Telegram
```

## 6. Быстрая проверка через curl
```bash
# Получить HTML и проверить наличие компонентов
curl -s https://illariooo.ru | grep -i "earnings-ticker" && echo "✓ EarningsTicker найден" || echo "✗ EarningsTicker НЕ найден"
curl -s https://illariooo.ru | grep -i "telegram-web-app" && echo "✓ Telegram API подключен" || echo "✗ Telegram API НЕ подключен"
```

## 7. Проверка логов браузера (локально)
Откройте https://illariooo.ru в браузере с открытой консолью (F12) и проверьте ошибки:
- Ошибки загрузки скриптов
- CSP блокировки
- Ошибки выполнения JavaScript

