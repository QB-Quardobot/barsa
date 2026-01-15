#!/bin/bash
# Скрипт для обновления Nginx конфигурации с API proxy на сервере

SERVER_USER="root"
SERVER_IP="217.198.5.230"

echo "🔧 Обновляю Nginx конфигурацию на сервере..."

ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
set -e

DOMAIN="illariooo.ru"
CONFIG_FILE="/etc/nginx/sites-available/${DOMAIN}"

echo "📦 Создаю бэкап текущей конфигурации..."
cp "${CONFIG_FILE}" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "📝 Обновляю конфигурацию через Python..."

python3 << 'PYTHON'
import re
import datetime
import sys

config_file = '/etc/nginx/sites-available/illariooo.ru'

try:
    # Читаем файл
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Сохраняем бэкап
    backup_file = config_file + '.backup.' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"✅ Бэкап сохранен: {backup_file}")
    
    # Новый блок API proxy
    new_api_block = '''    # API Proxy to Backend
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        
        # Proxy settings
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Logging
        access_log /var/log/nginx/api-access.log;
        error_log /var/log/nginx/api-error.log;
    }'''
    
    # Удаляем старый блок location /api/ если есть
    patterns = [
        r'    # API.*?\n    location /api/.*?\n    }',
        r'    location /api/.*?\n    }',
        r'    # API Rate Limiting.*?\n    location /api/.*?\n    }',
    ]
    
    for pattern in patterns:
        old_content = content
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        if old_content != content:
            print(f"✅ Удален старый блок: {pattern[:30]}...")
    
    # Находим блок location / { и добавляем после него новый блок
    # Ищем: location / { ... limit_req ... try_files ... }
    location_pattern = r'(    location / \{.*?limit_req.*?try_files.*?\n    \})'
    
    match = re.search(location_pattern, content, flags=re.DOTALL)
    if match:
        # Добавляем новый блок после location /
        insert_pos = match.end()
        content = content[:insert_pos] + '\n' + new_api_block + content[insert_pos:]
        print("✅ Блок API proxy добавлен после location /")
    else:
        # Альтернативный способ - ищем просто location / {
        location_simple = r'(    location / \{.*?\n    \})'
        match = re.search(location_simple, content, flags=re.DOTALL)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + '\n' + new_api_block + content[insert_pos:]
            print("✅ Блок API proxy добавлен (альтернативный способ)")
        else:
            print("❌ Не могу найти блок location / для вставки API proxy")
            print("Проверьте конфигурацию вручную")
            sys.exit(1)
    
    # Сохраняем
    with open(config_file, 'w') as f:
        f.write(content)
    
    print("✅ Конфигурация обновлена успешно")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при обновлении конфигурации!"
    exit 1
fi

echo ""
echo "✅ Тестирую конфигурацию Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация валидна!"
    echo ""
    echo "🔄 Перезагружаю Nginx..."
    systemctl reload nginx
    echo ""
    echo "✅ Готово! Nginx перезагружен."
    echo ""
    echo "📋 Проверка:"
    echo "  - Логи API: tail -f /var/log/nginx/api-access.log"
    echo "  - Ошибки API: tail -f /var/log/nginx/api-error.log"
    echo "  - Проверка работы: curl -X POST http://127.0.0.1:8000/api/offer-confirmation -H 'Content-Type: application/json' -d '{\"first_name\":\"Test\",\"last_name\":\"User\",\"email\":\"test@test.com\",\"payment_type\":\"tariff_1_rub\"}'"
else
    echo "❌ Ошибка в конфигурации Nginx!"
    echo "📦 Восстановите из бэкапа:"
    echo "  cp ${CONFIG_FILE}.backup.* ${CONFIG_FILE}"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Успешно! Nginx конфигурация обновлена."
    echo ""
    echo "📋 Следующие шаги:"
    echo "  1. Проверьте логи: ssh ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/api-access.log'"
    echo "  2. Протестируйте форму на сайте"
    echo "  3. Проверьте логи бэкенда: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs barcelona-bots --lines 50'"
else
    echo ""
    echo "❌ Ошибка при выполнении скрипта!"
    exit 1
fi
