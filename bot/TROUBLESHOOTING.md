# Troubleshooting Barcelona Bot

## Бот в статусе "errored"

Если бот падает с ошибкой, выполните следующие шаги:

### 1. Проверьте логи

```bash
# На сервере
cd /var/www/illariooo.ru/bot
pm2 logs barcelona-bots --lines 50
```

Или посмотрите файлы логов:
```bash
cat logs/pm2-error.log
cat logs/pm2-out.log
```

### 2. Проверьте .env файл

```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
cat .env
```

Убедитесь, что все переменные заполнены:
- `USER_TOKEN` - токен пользовательского бота
- `ADMIN_TOKEN` - токен админ-бота
- `ADMIN_IDS` - ID админов (через запятую)
- `DATABASE_URL` - путь к базе данных

### 3. Проверьте виртуальное окружение

```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
python --version  # Должен быть Python 3.8+
which python      # Должен указывать на .venv/bin/python
```

### 4. Проверьте зависимости

```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
pip list | grep aiogram
```

Если aiogram не установлен:
```bash
pip install -r requirements.txt
```

### 5. Попробуйте запустить вручную

```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
python main.py
```

Это покажет реальную ошибку, которая происходит при запуске.

### 6. Частые проблемы

#### Проблема: "ModuleNotFoundError"
**Решение:** Установите зависимости:
```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
pip install -r requirements.txt
```

#### Проблема: "Token is invalid"
**Решение:** Проверьте токены в .env файле

#### Проблема: "Permission denied"
**Решение:** Проверьте права доступа:
```bash
chmod +x /var/www/illariooo.ru/bot/barcelona_bots/main.py
chown -R root:root /var/www/illariooo.ru/bot
```

#### Проблема: "Database error" или "unable to open database file"
**Решение:** Проверьте путь к базе данных и права на запись:
```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
mkdir -p database
chmod 755 database
touch database/client.db
chmod 644 database/client.db
```

**Если проблема с асинхронным драйвером SQLite:**
Убедитесь, что в `.env` используется правильный формат:
```
DATABASE_URL=sqlite:///./database/client.db
```
Код автоматически конвертирует это в `sqlite+aiosqlite://` для асинхронной работы.

### 7. Перезапуск бота

После исправления проблем:
```bash
cd /var/www/illariooo.ru/bot
pm2 restart barcelona-bots
pm2 logs barcelona-bots --lines 20
```

### 8. Полный перезапуск

Если ничего не помогает:
```bash
cd /var/www/illariooo.ru/bot
pm2 delete barcelona-bots
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs barcelona-bots
```

