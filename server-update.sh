#!/bin/bash
# Команды для обновления сайта на сервере illariooo.ru

echo "=== 1. Найдена структура проекта ==="
echo "Директория сайта: /var/www/illariooo.ru/dist/"
cd /var/www/illariooo.ru 2>/dev/null && pwd || echo "Переход в /var/www/illariooo.ru"

echo -e "\n=== 2. Проверка git репозитория ==="
if [ -d ".git" ]; then
  echo "✓ Git репозиторий найден"
  echo "Текущая ветка:"
  git branch --show-current
  echo "Последний коммит:"
  git log -1 --oneline
  echo -e "\nОбновление из GitHub:"
  git fetch origin
  git pull origin master || git pull origin main
else
  echo "✗ Git репозиторий не найден в /var/www/illariooo.ru"
  echo "Ищем в других местах:"
  find ~ -name ".git" -type d 2>/dev/null | head -3
fi

echo -e "\n=== 3. Проверка package.json ==="
if [ -f "package.json" ]; then
  echo "✓ package.json найден"
  echo "Обновление зависимостей:"
  npm install
  echo "Сборка проекта:"
  npm run build
else
  echo "✗ package.json не найден"
  echo "Нужно клонировать репозиторий или переместить проект"
fi

echo -e "\n=== 4. Проверка что dist собран ==="
if [ -d "dist" ]; then
  echo "✓ dist директория найдена"
  echo "Размер:"
  du -sh dist/
  echo "Ключевые файлы:"
  ls -lh dist/index.html dist/_astro/*.js 2>/dev/null | head -5
  
  echo -e "\nПроверка что EarningsTicker в HTML:"
  grep -q "earnings-ticker" dist/index.html && echo "✓ EarningsTicker найден" || echo "✗ EarningsTicker НЕ найден"
  
  echo "Проверка Telegram API:"
  grep -q "telegram-web-app.js" dist/index.html && echo "✓ Telegram API найден" || echo "✗ Telegram API НЕ найден"
fi

echo -e "\n=== 5. Настройка Nginx (если нужно) ==="
echo "Проверка конфига:"
nginx -t 2>&1 | head -5

echo -e "\n=== 6. Перезагрузка Nginx ==="
systemctl reload nginx && echo "✓ Nginx перезагружен" || echo "✗ Ошибка перезагрузки"

