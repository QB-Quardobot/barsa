#!/bin/bash
# Скрипт для безопасного обновления Nginx конфигурации

cat << 'SCRIPT' | ssh root@217.198.5.230 bash
set -e

DOMAIN="illariooo.ru"
CONFIG_FILE="/etc/nginx/sites-available/${DOMAIN}"

echo "🔧 Восстанавливаю конфигурацию Nginx..."

# Восстанавливаем из бэкапа если есть
if [ -f "${CONFIG_FILE}.backup" ]; then
    echo "📦 Восстанавливаю из бэкапа..."
    cp "${CONFIG_FILE}.backup" "${CONFIG_FILE}"
else
    echo "⚠️  Бэкап не найден, проверяю текущую конфигурацию..."
    if ! nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo "❌ Текущая конфигурация повреждена!"
        echo "Проверьте файл: ${CONFIG_FILE}"
        exit 1
    fi
fi

echo "📝 Обновляю конфигурацию через Python..."

python3 << 'PYTHON'
import re
import sys

config_file = '/etc/nginx/sites-available/illariooo.ru'

try:
    # Читаем файл
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Сохраняем бэкап
    with open(config_file + '.backup.' + __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S'), 'w') as f:
        f.write(content)
    
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
    
    # Удаляем старый блок location /api/ если есть (с разными вариантами)
    patterns = [
        r'    # API.*?\n    location /api/.*?\n    }',
        r'    location /api/.*?\n    }',
        r'    # API Rate Limiting.*?\n    location /api/.*?\n    }',
    ]
    
    for pattern in patterns:
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Находим место после location / { и добавляем новый блок
    # Ищем location / { ... } блок
    location_pattern = r'(    location / \{[^\}]*limit_req[^\}]*try_files[^\}]*\})'
    
    if re.search(location_pattern, content, flags=re.DOTALL):
        # Заменяем, добавляя новый блок после location /
        content = re.sub(
            location_pattern,
            r'\1\n' + new_api_block,
            content,
            flags=re.DOTALL
        )
    else:
        # Если не нашли точный паттерн, ищем просто location / {
        location_simple = r'(    location / \{.*?\n    \})'
        if re.search(location_simple, content, flags=re.DOTALL):
            content = re.sub(
                location_simple,
                r'\1\n' + new_api_block,
                content,
                flags=re.DOTALL
            )
        else:
            print("❌ Не могу найти блок location / для вставки API proxy")
            sys.exit(1)
    
    # Сохраняем
    with open(config_file, 'w') as f:
        f.write(content)
    
    print("✅ Конфигурация обновлена")
    
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

echo "✅ Тестирую конфигурацию..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация валидна, перезагружаю Nginx..."
    systemctl reload nginx
    echo "✅ Nginx перезагружен!"
    echo ""
    echo "📋 Проверка:"
    echo "  - Проверьте логи: tail -f /var/log/nginx/api-access.log"
    echo "  - Проверьте ошибки: tail -f /var/log/nginx/api-error.log"
else
    echo "❌ Ошибка в конфигурации Nginx!"
    echo "📦 Восстановите из бэкапа:"
    echo "  cp ${CONFIG_FILE}.backup.* ${CONFIG_FILE}"
    exit 1
fi
SCRIPT
