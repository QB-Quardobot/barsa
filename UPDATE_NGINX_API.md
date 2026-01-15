# 🔧 Обновление Nginx конфигурации для API

## Проблема
Nginx не проксирует запросы `/api/*` на бэкенд. Нужно обновить конфигурацию.

## Быстрое решение

Выполните на сервере следующие команды:

```bash
ssh root@217.198.5.230

# Создаем бэкап
cp /etc/nginx/sites-available/illariooo.ru /etc/nginx/sites-available/illariooo.ru.backup.$(date +%Y%m%d_%H%M%S)

# Проверяем текущий блок location /api/
grep -A 5 "location /api/" /etc/nginx/sites-available/illariooo.ru

# Удаляем старый блок (если есть)
sed -i '/location \/api\/ {/,/^    }/d' /etc/nginx/sites-available/illariooo.ru

# Добавляем новый блок после location / {
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
    }' /etc/nginx/sites-available/illariooo.ru

# Проверяем конфигурацию
nginx -t

# Если OK - перезагружаем
systemctl reload nginx

# Проверяем логи
tail -f /var/log/nginx/api-access.log
```

## Альтернативный способ (через Python)

Если sed не работает, используйте Python:

```bash
ssh root@217.198.5.230

python3 << 'PYTHON'
import re

config_file = '/etc/nginx/sites-available/illariooo.ru'

# Читаем файл
with open(config_file, 'r') as f:
    content = f.read()

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
content = re.sub(r'    # API.*?\n    location /api/.*?\n    }', '', content, flags=re.DOTALL)

# Находим место после location / { и добавляем новый блок
content = re.sub(
    r'(    location / \{[^}]*\})',
    r'\1\n' + new_api_block,
    content,
    flags=re.DOTALL
)

# Сохраняем
with open(config_file, 'w') as f:
    f.write(content)

print("✅ Конфигурация обновлена")
PYTHON

# Проверяем и перезагружаем
nginx -t && systemctl reload nginx
```

## Проверка работы

После обновления проверьте:

1. **Проверьте, что файл логов создался:**
   ```bash
   ls -la /var/log/nginx/api-access.log
   ```

2. **Проверьте работу API напрямую:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/offer-confirmation \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@test.com","payment_type":"tariff_1_rub"}'
   ```

3. **Проверьте через Nginx:**
   ```bash
   curl -X POST https://illariooo.ru/api/offer-confirmation \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Test","last_name":"User","email":"test@test.com","payment_type":"tariff_1_rub"}'
   ```

4. **Проверьте логи:**
   ```bash
   tail -f /var/log/nginx/api-access.log
   pm2 logs barcelona-bots | grep "INCOMING REQUEST"
   ```

## Что должно появиться в логах

После успешного обновления в логах API сервера (`pm2 logs barcelona-bots`) должны появиться записи:
```
=== INCOMING REQUEST ===
Method: POST, URL: http://127.0.0.1:8000/api/offer-confirmation
...
```

В логах Nginx (`/var/log/nginx/api-access.log`) должны появиться записи о запросах к `/api/offer-confirmation`.
