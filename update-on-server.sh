#!/bin/bash
# Команды для выполнения на сервере через SSH

echo "=== Переход в директорию проекта ==="
cd /var/www/illariooo.ru

echo -e "\n=== Проверка git статуса ==="
git status --short

echo -e "\n=== Обновление из GitHub ==="
git fetch origin
git pull origin master || git pull origin main

echo -e "\n=== Установка зависимостей (если нужно) ==="
npm install

echo -e "\n=== Пересборка проекта ==="
npm run build

echo -e "\n=== Проверка что EarningsTicker в новой сборке ==="
grep -q "earnings-ticker" dist/index.html && echo "✓ EarningsTicker найден" || echo "✗ EarningsTicker НЕ найден"

echo -e "\n=== Проверка Telegram API ==="
grep -q "telegram-web-app.js" dist/index.html && echo "✓ Telegram API найден" || echo "✗ Telegram API НЕ найден"

echo -e "\n=== Перезагрузка Nginx ==="
systemctl reload nginx && echo "✓ Готово!" || echo "✗ Ошибка"
