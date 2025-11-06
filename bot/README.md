# Barcelona Telegram Bot

Python бот на aiogram для обработки Mini App и управления пользователями.

## Структура проекта

```
bot/
├── barcelona_bots/          # Основной код бота
│   ├── main.py              # Точка входа
│   ├── config/              # Конфигурация
│   ├── handlers/             # Обработчики сообщений
│   ├── database/             # Работа с БД
│   ├── utils/                # Утилиты
│   ├── materials/            # Материалы
│   └── .env                  # Переменные окружения
├── ecosystem.config.js       # Конфигурация PM2
└── logs/                     # Логи

```

## Установка

1. Перейдите в папку бота:
   ```bash
   cd bot/barcelona_bots
   ```

2. Создайте виртуальное окружение (если еще не создано):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   # или
   .venv\Scripts\activate     # Windows
   ```

3. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```

4. Настройте `.env` файл:
   ```bash
   cd barcelona_bots
   # Отредактируйте .env и добавьте токены ботов
   ```

## Запуск

### Ручной запуск
```bash
cd bot/barcelona_bots
python main.py
```

### Через PM2 (рекомендуется для продакшена)
```bash
cd bot
pm2 start ecosystem.config.js
pm2 save
```

## Интеграция с Mini App

Бот обрабатывает события из Telegram Mini App. См. `examples/bot-handler-example.js` для примеров интеграции.
