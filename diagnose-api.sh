#!/bin/bash
# Полная диагностика API проблемы

SERVER_USER="root"
SERVER_IP="217.198.5.230"

echo "🔍 Полная диагностика API проблемы..."
echo ""

ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
set -e

echo "=== 1. Проверка API сервера ==="
echo "Проверяю, запущен ли API сервер на порту 8000..."
pm2 list | grep barcelona-bots || echo "❌ Бот не запущен!"
netstat -tlnp | grep 8000 || ss -tlnp | grep 8000 || echo "❌ Порт 8000 не слушается!"

echo ""
echo "=== 2. Проверка Nginx конфигурации ==="
echo "Проверяю блок location /api/ в Nginx..."
grep -A 20 "location /api/" /etc/nginx/sites-available/illariooo.ru | head -25

echo ""
echo "=== 3. Тест API напрямую (минуя Nginx) ==="
echo "Отправляю запрос напрямую на API сервер..."
curl -X POST http://127.0.0.1:8000/api/offer-confirmation \
  -H "Content-Type: application/json" \
  -d '{"first_name":"DirectTest","last_name":"User","email":"direct@test.com","payment_type":"tariff_1_rub"}' \
  -v 2>&1 | head -30

echo ""
echo "=== 4. Тест API через Nginx ==="
echo "Отправляю запрос через Nginx..."
curl -X POST https://illariooo.ru/api/offer-confirmation \
  -H "Content-Type: application/json" \
  -d '{"first_name":"NginxTest","last_name":"User","email":"nginx@test.com","payment_type":"tariff_1_rub"}' \
  -v 2>&1 | head -30

echo ""
echo "=== 5. Проверка логов Nginx ==="
echo "Последние 20 строк логов API..."
tail -20 /var/log/nginx/api-access.log 2>/dev/null || echo "Файл логов еще не создан (будет создан при первом запросе)"
echo ""
echo "Ошибки API в Nginx..."
tail -20 /var/log/nginx/api-error.log 2>/dev/null || echo "Нет ошибок"

echo ""
echo "=== 6. Проверка логов бэкенда ==="
echo "Последние 30 строк логов бэкенда..."
pm2 logs barcelona-bots --lines 30 --nostream 2>/dev/null | tail -30

echo ""
echo "=== 7. Проверка переменных окружения ==="
echo "GOOGLE_SHEETS настройки:"
pm2 env barcelona-bots 2>/dev/null | grep GOOGLE || echo "Не найдено в pm2 env"

echo ""
echo "=== 8. Проверка файла credentials ==="
ls -la /var/www/illariooo.ru/bot/credentials.json 2>/dev/null || echo "❌ Файл credentials.json не найден!"

echo ""
echo "=== 9. Проверка последних записей в БД ==="
python3 << 'PYTHON'
import sqlite3
import os

db_path = '/var/www/illariooo.ru/bot/barcelona_bots/database/client.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, payment_type, created_at FROM offer_confirmations ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Последние 5 записей в БД:")
    for row in rows:
        print(f"  ID={row[0]}, Email={row[1]}, Type={row[2]}, Created={row[3]}")
    conn.close()
else:
    print(f"❌ БД не найдена: {db_path}")
PYTHON

echo ""
echo "=== Диагностика завершена ==="
ENDSSH

echo ""
echo "✅ Диагностика выполнена. Проверьте вывод выше."
