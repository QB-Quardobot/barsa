# 🚀 Настройка Telegram Mini App для тестирования

## Быстрый старт

### 1. Настройте ngrok (если еще не настроен)

```bash
# Получите authtoken на https://dashboard.ngrok.com/
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 2. Запустите приложение с ngrok туннелем

Одной командой запускаются оба сервера (Astro dev + ngrok):

```bash
npm run dev:ngrok
```

Или альтернативная команда:

```bash
npm run dev:tunnel
```

### 3. Скопируйте HTTPS URL

После запуска в консоли вы увидите что-то вроде:

```
Forwarding https://abc123.ngrok.io -> http://localhost:4321
```

Скопируйте этот HTTPS URL (например: `https://abc123.ngrok.io`)

### 4. Настройте бота в Telegram

1. Откройте [BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/setdomain`
3. Выберите вашего бота
4. Вставьте HTTPS URL из шага 3 (например: `https://abc123.ngrok.io`)

### 5. Создайте кнопку Web App (если еще не создана)

В BotFather отправьте:

```
/setmenubutton
```

Выберите бота и укажите:
- **Button text**: например, "Открыть лендинг" или "AI Model 2.0"
- **URL**: ваш HTTPS URL

### 6. Тестируйте!

Откройте вашего бота в Telegram и нажмите на кнопку меню.

## Структура команд

- `npm run dev` - обычный dev сервер на localhost:4321
- `npm run dev:ngrok` - запускает dev сервер + ngrok туннель
- `npm run dev:tunnel` - то же самое, что и выше

## Важные замечания

⚠️ **Временный URL:**
Бесплатный ngrok дает новый URL при каждом запуске. Для постоянного домена нужна платная подписка.

⚠️ **Для России:**
Если ngrok не работает, используйте альтернативы:
- [Tuna](https://tuna.io/)
- [LocalTunnel](https://localtunnel.github.io/www/)
- [VS Code Port Forwarding](https://code.visualstudio.com/docs/editor/port-forwarding)

## Остановка сервера

Нажмите `Ctrl+C` в терминале, чтобы остановить оба процесса.

## Troubleshooting

**Ngrok не подключен:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

**Порт занят:**
```bash
# Убейте процесс на порту 4321
lsof -ti:4321 | xargs kill -9
```

**Ошибка "ngrok command not found":**
- Установите ngrok: https://ngrok.com/download
- Или используйте: `brew install ngrok` (на macOS)
