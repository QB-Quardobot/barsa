# Деплой Barcelona Bot

## Быстрый старт

### 1. Настройка .env файла

Файл `.env` уже создан с токенами. Если нужно добавить ADMIN_IDS или ALEX_KLYAUZER_ID, отредактируйте:
```bash
cd bot/barcelona_bots
nano .env
```

Добавьте ваш Telegram User ID в `ADMIN_IDS` (можно узнать у бота @userinfobot):
```
ADMIN_IDS=123456789,987654321
```

### 2. Деплой на сервер

Запустите скрипт деплоя:
```bash
cd bot
./deploy-bot.sh
```

Скрипт автоматически:
- Проверит .env файл
- Скопирует файлы на сервер
- Установит зависимости
- Запустит бота через PM2

### 3. Проверка работы

После деплоя проверьте статус:
```bash
ssh root@217.198.5.230 'pm2 status'
```

Просмотр логов:
```bash
ssh root@217.198.5.230 'pm2 logs barcelona-bots'
```

## Ручной деплой

Если нужно задеплоить вручную:

1. **На сервере:**
```bash
ssh root@217.198.5.230
cd /var/www/illariooo.ru
git pull  # Обновить код
cd bot/barcelona_bots
```

2. **Установить зависимости:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. **Настроить .env:**
```bash
nano .env
# Добавьте токены и другие переменные
```

4. **Установить PM2 (если не установлен):**
```bash
npm install -g pm2
```

5. **Запустить через PM2:**
```bash
cd /var/www/illariooo.ru/bot
pm2 start ecosystem.config.cjs
pm2 save
```

## Альтернативные способы запуска

### Вариант 1: Через systemd (рекомендуется, если PM2 недоступен)

1. Скопируйте service файл:
```bash
sudo cp bot/barcelona-bot.service /etc/systemd/system/
```

2. Перезагрузите systemd и запустите:
```bash
sudo systemctl daemon-reload
sudo systemctl enable barcelona-bot
sudo systemctl start barcelona-bot
```

3. Проверка статуса:
```bash
sudo systemctl status barcelona-bot
sudo journalctl -u barcelona-bot -f
```

### Вариант 2: Через screen (простой способ)

```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
screen -S barcelona-bot
python main.py
# Нажмите Ctrl+A, затем D для отсоединения
```

Вернуться к сессии: `screen -r barcelona-bot`

## Управление ботом

### Остановить:
```bash
ssh root@217.198.5.230 'pm2 stop barcelona-bots'
```

### Перезапустить:
```bash
ssh root@217.198.5.230 'pm2 restart barcelona-bots'
```

### Просмотр логов:
```bash
ssh root@217.198.5.230 'pm2 logs barcelona-bots --lines 50'
```

### Удалить из PM2:
```bash
ssh root@217.198.5.230 'pm2 delete barcelona-bots'
```

## Структура на сервере

```
/var/www/illariooo.ru/
├── bot/
│   ├── barcelona_bots/      # Код бота
│   │   ├── .env             # Переменные окружения
│   │   ├── main.py          # Точка входа
│   │   └── ...
│   ├── ecosystem.config.js  # PM2 конфигурация
│   └── logs/                # Логи
```

## Troubleshooting

### Бот не запускается
1. Проверьте логи: `pm2 logs barcelona-bots`
2. Проверьте .env файл: `cat barcelona_bots/.env`
3. Проверьте Python: `python3 --version` (нужен Python 3.8+)

### Ошибки зависимостей
```bash
cd /var/www/illariooo.ru/bot/barcelona_bots
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Бот не отвечает
1. Проверьте токены в .env
2. Проверьте, что бот запущен: `pm2 status`
3. Проверьте логи на ошибки

