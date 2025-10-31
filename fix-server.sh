#!/bin/bash
# Скрипт для диагностики и исправления на сервере illariooo.ru

echo "=== 1. Проверка структуры файлов ==="
echo "Где находится сайт:"
find /var/www -name "index.html" 2>/dev/null | head -3
find ~ -name "dist" -type d 2>/dev/null

echo -e "\n=== 2. Проверка что Telegram API подключается ==="
find /var/www -name "index.html" 2>/dev/null | head -1 | xargs grep -o 'telegram-web-app.js' && echo "✓ Telegram API найден" || echo "✗ Telegram API НЕ найден"

echo -e "\n=== 3. Проверка CSP в конфиге Nginx ==="
grep -r "Content-Security-Policy" /etc/nginx/sites-enabled/ 2>/dev/null | head -3

echo -e "\n=== 4. Проверка последних ошибок ==="
tail -20 /var/log/nginx/error.log 2>/dev/null | grep -i "error\|warn" | tail -5

echo -e "\n=== 5. Если нужно обновить сборку ==="
echo "# Перейти в проект:"
echo "cd /path/to/project"
echo "# Запушить изменения:"
echo "git pull origin master"
echo "# Пересобрать:"
echo "npm install && npm run build"
echo "# Обновить файлы:"
echo "sudo cp -r dist/* /var/www/html/"
echo "sudo systemctl reload nginx"

