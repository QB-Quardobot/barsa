# 🚀 Настройка Telegram Mini App для тестирования

## Быстрый старт

### 1. Настройте ngrok (если еще не настроен)

```bash
# Шаг 1: Зарегистрируйтесь на https://ngrok.com/
# Шаг 2: Получите authtoken на https://dashboard.ngrok.com/get-started/your-authtoken
# Шаг 3: Замените YOUR_TOKEN_HERE на ваш реальный токен:

ngrok config add-authtoken YOUR_TOKEN_HERE

# Например:
# ngrok config add-authtoken 2XXXXXXXXXXXXXXXXXXXXXXXXXX
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
- **Cloudflare Tunnel (БЕСПЛАТНО, без регистрации!)** - см. ниже
- [Tuna](https://tuna.io/)
- [LocalTunnel](https://localtunnel.github.io/www/)
- [VS Code Port Forwarding](https://code.visualstudio.com/docs/editor/port-forwarding)

## 🌐 Cloudflare Tunnel (Рекомендуется! Без регистрации)

Cloudflared - самый простой вариант, работает сразу без регистрации:

```bash
# 1. Запустите с cloudflared туннелем
npm run dev:cloudflare

# 2. В консоли вы увидите URL вида: https://xxx.trycloudflare.com
# 3. Скопируйте этот HTTPS URL
# 4. Используйте в BotFather как домен для вашего бота!
```

**Преимущества:**
- ✅ Работает без регистрации
- ✅ Бесплатно
- ✅ HTTPS автоматически
- ✅ Работает везде (включая Россию)

## 🚀 Альтернатива: Деплой на Cloudflare Pages (бесплатно!)

Если ngrok не работает или нужен постоянный URL, деплойте на Cloudflare Pages:

### Быстрый деплой через Wrangler CLI:

```bash
# 1. Авторизуйтесь в браузере
npx wrangler login

# 2. Соберите и задеплойте проект
npm run deploy:cf

# 3. Получите URL вида: https://ai-model-landing.pages.dev
# 4. Используйте этот URL в BotFather как домен для вашего бота!
```

**Важно:** При первом запуске `wrangler login` откроется браузер для авторизации.

### Через GitHub (автоматический деплой):

1. Загрузите код в GitHub репозиторий
2. Перейдите в [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/)
3. Create a project → Connect to Git → выберите репозиторий
4. Настройки сборки:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Framework preset**: Astro
5. Deploy!
6. Получите URL и используйте в BotFather

**Преимущества:**
- ✅ Бесплатно
- ✅ Постоянный URL
- ✅ HTTPS по умолчанию
- ✅ Быстро (CDN)
- ✅ Авто-деплой при пуше в GitHub

## Остановка сервера

Нажмите `Ctrl+C` в терминале, чтобы остановить оба процесса.

## Troubleshooting

**Ngrok не подключен:**
```bash
# Получите токен на https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken 2abc123def456...  # Вставьте ваш реальный токен!
```

**Порт занят:**
```bash
# Убейте процесс на порту 4321
lsof -ti:4321 | xargs kill -9
```

**Ошибка "ngrok command not found":**
- Установите ngrok: https://ngrok.com/download
- Или используйте: `brew install ngrok` (на macOS)
