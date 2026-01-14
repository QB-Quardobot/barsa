# Как посмотреть страницы оферты на локальной машине

## Быстрый способ (только просмотр страниц)

### 1. Запустите Astro dev сервер

```bash
npm run dev
```

Сервер запустится на **http://localhost:4321**

### 2. Откройте страницы в браузере

- **Страница рассрочки:** http://localhost:4321/installment
- **Страница криптоплатежа:** http://localhost:4321/crypto
- **Страница оплаты:** http://localhost:4321/payment?type=installment&email=test@example.com

## Полный тест (с сохранением в БД)

Если нужно протестировать полный функционал с сохранением данных:

### 1. Запустите API сервер (в отдельном терминале)

```bash
cd bot/barcelona_bots
python api_server.py
```

API сервер запустится на **http://localhost:8000**

### 2. Настройте переменные окружения (опционально)

Создайте файл `.env` в корне проекта или установите переменные:

```env
PUBLIC_API_ENDPOINT=http://localhost:8000/api/offer-confirmation
PUBLIC_INSTALLMENT_PAYMENT_URL=https://example.com/installment
PUBLIC_CRYPTO_PAYMENT_URL=https://example.com/crypto
```

Или в `src/pages/installment.astro` и `src/pages/crypto.astro` можно напрямую изменить:

```typescript
const API_ENDPOINT = 'http://localhost:8000/api/offer-confirmation';
```

### 3. Запустите Astro dev сервер

```bash
npm run dev
```

### 4. Откройте страницы

- **Рассрочка:** http://localhost:4321/installment
- **Крипта:** http://localhost:4321/crypto

### 5. Протестируйте форму

1. Заполните форму (Имя, Фамилия, Email)
2. Поставьте галочку согласия
3. Нажмите "Далее"
4. Данные сохранятся в БД через API
5. Произойдет переход на страницу оплаты

## Проверка работы API

### Health check

```bash
curl http://localhost:8000/health
```

Должен вернуть:
```json
{"status":"ok","timestamp":"2024-01-01T12:00:00"}
```

### Тест сохранения данных

```bash
curl -X POST http://localhost:8000/api/offer-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Тест",
    "last_name": "Пользователь",
    "email": "test@example.com",
    "payment_type": "installment"
  }'
```

## Troubleshooting

### Страница не открывается

- Убедитесь, что Astro dev сервер запущен (`npm run dev`)
- Проверьте, что порт 4321 свободен
- Попробуйте другой браузер

### API не работает

- Убедитесь, что API сервер запущен (`python api_server.py`)
- Проверьте, что порт 8000 свободен
- Проверьте логи в консоли

### CORS ошибки

Если видите ошибки CORS в консоли браузера:
- Убедитесь, что API сервер запущен
- Проверьте, что `PUBLIC_API_ENDPOINT` указывает на правильный URL
- В `api_server.py` уже настроен CORS для всех источников (в продакшене нужно ограничить)

### Данные не сохраняются

- Проверьте подключение к БД
- Убедитесь, что таблица `offer_confirmations` создана
- Запустите бота один раз для создания таблиц: `python main.py` (остановите через Ctrl+C после создания таблиц)

## Полезные команды

```bash
# Только просмотр страниц (без API)
npm run dev

# С API сервером (в двух терминалах)
# Терминал 1:
cd bot/barcelona_bots && python api_server.py

# Терминал 2:
npm run dev

# Запуск бота с API (полный функционал)
cd bot/barcelona_bots && python main.py
```

## Структура URL

- `/installment` - страница оферты для рассрочки
- `/crypto` - страница оферты для криптоплатежа  
- `/payment?type=installment&email=...` - страница оплаты (рассрочка)
- `/payment?type=crypto&email=...` - страница оплаты (крипта)
