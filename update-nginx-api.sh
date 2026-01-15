#!/bin/bash
# Скрипт для обновления только Nginx конфигурации с API proxy

SERVER_USER="root"
SERVER_IP="217.198.5.230"
DOMAIN="illariooo.ru"

echo "🔄 Обновляю Nginx конфигурацию с API proxy..."

ssh ${SERVER_USER}@${SERVER_IP} bash << 'ENDSSH'
    DOMAIN="illariooo.ru"
    
    echo "📝 Обновляю Nginx конфигурацию..."
    
    # Создаем бэкап текущей конфигурации
    cp /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-available/${DOMAIN}.backup.$(date +%Y%m%d_%H%M%S)
    
    # Обновляем только блок location /api/
    # Сначала читаем текущий файл
    if grep -q "location /api/" /etc/nginx/sites-available/${DOMAIN}; then
        echo "✅ Найден блок location /api/, обновляю..."
        # Используем sed для замены блока
        sed -i '/location \/api\/ {/,/^    }/c\
    # API Proxy to Backend\
    location /api/ {\
        limit_req zone=api burst=10 nodelay;\
        \
        # Proxy settings\
        proxy_pass http://127.0.0.1:8000/api/;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_set_header X-Forwarded-Host $server_name;\
        \
        # Timeouts\
        proxy_connect_timeout 60s;\
        proxy_send_timeout 60s;\
        proxy_read_timeout 60s;\
        \
        # Buffering\
        proxy_buffering off;\
        proxy_request_buffering off;\
        \
        # Logging\
        access_log /var/log/nginx/api-access.log;\
        error_log /var/log/nginx/api-error.log;\
    }' /etc/nginx/sites-available/${DOMAIN}
    else
        echo "❌ Блок location /api/ не найден, добавляю после location / {"
        # Добавляем после location / {
        sed -i '/location \/ {/,/^    }/a\
\
    # API Proxy to Backend\
    location /api/ {\
        limit_req zone=api burst=10 nodelay;\
        \
        # Proxy settings\
        proxy_pass http://127.0.0.1:8000/api/;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_set_header X-Forwarded-Host $server_name;\
        \
        # Timeouts\
        proxy_connect_timeout 60s;\
        proxy_send_timeout 60s;\
        proxy_read_timeout 60s;\
        \
        # Buffering\
        proxy_buffering off;\
        proxy_request_buffering off;\
        \
        # Logging\
        access_log /var/log/nginx/api-access.log;\
        error_log /var/log/nginx/api-error.log;\
    }' /etc/nginx/sites-available/${DOMAIN}
    fi
    
    echo "✅ Тестирую конфигурацию..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Конфигурация валидна, перезагружаю Nginx..."
        systemctl reload nginx
        echo "✅ Nginx перезагружен!"
        echo ""
        echo "📋 Проверка:"
        echo "  - Логи API: tail -f /var/log/nginx/api-access.log"
        echo "  - Ошибки API: tail -f /var/log/nginx/api-error.log"
    else
        echo "❌ Ошибка в конфигурации Nginx!"
        echo "📋 Восстановите из бэкапа:"
        echo "  cp /etc/nginx/sites-available/${DOMAIN}.backup.* /etc/nginx/sites-available/${DOMAIN}"
        exit 1
    fi
ENDSSH

echo ""
echo "✅ Готово! Nginx конфигурация обновлена."
