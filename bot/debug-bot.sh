#!/bin/bash
# Скрипт для диагностики проблем с ботом на сервере

echo "=== Диагностика Barcelona Bot ==="
echo ""

echo "1. Проверка логов PM2:"
pm2 logs barcelona-bots --lines 30 --nostream

echo ""
echo "2. Проверка логов ошибок:"
cat logs/pm2-error.log | tail -30

echo ""
echo "3. Проверка .env файла:"
cd barcelona_bots
if [ -f .env ]; then
    echo "✓ .env файл существует"
    echo "Проверка переменных:"
    grep -E "USER_TOKEN|ADMIN_TOKEN|ADMIN_IDS" .env | sed 's/=.*/=***/' 
else
    echo "✗ .env файл НЕ найден!"
fi

echo ""
echo "4. Проверка Python окружения:"
if [ -d .venv ]; then
    echo "✓ Виртуальное окружение существует"
    source .venv/bin/activate
    python --version
    which python
else
    echo "✗ Виртуальное окружение НЕ найдено!"
fi

echo ""
echo "5. Проверка зависимостей:"
if [ -f requirements.txt ]; then
    echo "✓ requirements.txt найден"
    pip list | grep -E "aiogram|python-dotenv" || echo "⚠ Зависимости не установлены"
else
    echo "✗ requirements.txt НЕ найден!"
fi

echo ""
echo "6. Попытка запуска вручную:"
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
python main.py 2>&1 | head -20

