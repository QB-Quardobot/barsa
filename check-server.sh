#!/bin/bash
# Команды для проверки сервера illariooo.ru

echo "=== Проверка статуса Nginx ==="
systemctl status nginx --no-pager | head -20

echo -e "\n=== Проверка конфига Nginx ==="
nginx -t

echo -e "\n=== Проверка директории сайта ==="
ls -lah /var/www/html/ || ls -lah ~/dist/ || find /var/www -name "index.html" 2>/dev/null | head -5

echo -e "\n=== Проверка последних логов Nginx (ошибки) ==="
tail -30 /var/log/nginx/error.log 2>/dev/null | grep -i error || echo "Нет ошибок в логах"

echo -e "\n=== Проверка последних логов Nginx (доступ) ==="
tail -10 /var/log/nginx/access.log 2>/dev/null

echo -e "\n=== Проверка что index.html содержит JS ==="
find /var/www -name "index.html" 2>/dev/null | head -1 | xargs grep -l "earnings-ticker\|Telegram" 2>/dev/null && echo "✓ JS найден" || echo "✗ JS не найден"

echo -e "\n=== Проверка структуры dist ==="
if [ -d "dist" ]; then
  echo "Размер dist:"
  du -sh dist/
  echo "Ключевые файлы:"
  ls -lh dist/index.html dist/_astro/*.js 2>/dev/null | head -5
fi

