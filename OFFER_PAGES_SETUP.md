# Настройка страниц оферты и оплаты

## Обзор

Реализованы две отдельные цепочки для оплаты:
1. **Внутренняя рассрочка** (`/installment`) → `/payment?type=installment`
2. **Криптоплатёж** (`/crypto`) → `/payment?type=crypto`

## Структура

### Страницы

1. **`/installment`** - Страница оферты для рассрочки
   - Форма с полями: Имя, Фамилия, Email
   - Чекбокс согласия с офертой
   - После подтверждения → переход на `/payment?type=installment&email=...`

2. **`/crypto`** - Страница оферты для криптоплатежа
   - Аналогичная форма
   - После подтверждения → переход на `/payment?type=crypto&email=...`

3. **`/payment`** - Страница оплаты
   - Принимает параметры `type` и `email` из URL
   - Кнопка "Оплатить" с редиректом на платёжную систему

### База данных

Создана модель `OfferConfirmation` в `bot/barcelona_bots/database/models.py`:
- `first_name` - Имя клиента
- `last_name` - Фамилия клиента
- `email` - Email клиента
- `payment_type` - Тип оплаты ('installment' или 'crypto')
- `confirmed_at` - Дата и время подтверждения
- `ip_address` - IP адрес (для логирования)
- `user_agent` - User Agent (для логирования)
- `additional_data` - Дополнительные данные (JSON)

### API Endpoint

Создан API сервер на FastAPI (`bot/barcelona_bots/api_server.py`):
- **POST** `/api/offer-confirmation` - Сохранение подтверждения оферты
- **GET** `/health` - Health check

## Настройка

### 1. Переменные окружения

Добавьте в `.env` файл (или переменные окружения):

```env
# API Endpoint (для фронтенда)
PUBLIC_API_ENDPOINT=http://localhost:8000/api/offer-confirmation

# Платёжные ссылки
PUBLIC_INSTALLMENT_PAYMENT_URL=https://your-payment-link.com/installment
PUBLIC_CRYPTO_PAYMENT_URL=https://your-payment-link.com/crypto

# Настройки API сервера (для бота)
API_HOST=0.0.0.0
API_PORT=8000
```

### 2. Установка зависимостей

```bash
cd bot/barcelona_bots
pip install -r requirements.txt
```

Новые зависимости:
- `fastapi==0.115.0`
- `uvicorn[standard]==0.32.0`

### 3. Обновление текста оферты

Отредактируйте константу `OFFER_TEXT` в файлах:
- `src/pages/installment.astro` (строка ~8)
- `src/pages/crypto.astro` (строка ~8)

### 4. Обновление платёжных ссылок

Установите актуальные платёжные ссылки через переменные окружения или напрямую в коде:
- `src/pages/payment.astro` (строка ~8-11)

### 5. Запуск

#### Запуск бота с API сервером

```bash
cd bot/barcelona_bots
python main.py
```

Бот и API сервер запустятся параллельно:
- Telegram бот: работает как обычно
- API сервер: доступен на `http://localhost:8000`

#### Запуск только API сервера (для разработки)

```bash
cd bot/barcelona_bots
python api_server.py
```

## Использование

### Ссылки для клиентов

1. **Для рассрочки:**
   ```
   https://your-domain.com/installment
   ```

2. **Для криптоплатежа:**
   ```
   https://your-domain.com/crypto
   ```

### Пользовательский путь

1. Клиент переходит по ссылке → видит страницу оферты
2. Заполняет форму (Имя, Фамилия, Email)
3. Ставит галочку согласия
4. Нажимает "Далее"
5. Данные сохраняются в БД через API
6. Переход на страницу оплаты
7. Нажимает "Оплатить"
8. Редирект на платёжную систему

## Безопасность и SEO

✅ Страницы **не индексируются**:
- `noindex, nofollow` в meta тегах
- Исключены из `sitemap.xml`
- Не отображаются в навигации сайта

✅ Защита от повторной отправки:
- Блокировка кнопки во время отправки
- Валидация формы на клиенте и сервере

✅ Логирование:
- IP адрес
- User Agent
- Дата и время
- Тип оплаты

## API Документация

### POST /api/offer-confirmation

**Request:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "email": "ivan@example.com",
  "payment_type": "installment"
}
```

**Response:**
```json
{
  "success": true,
  "confirmation_id": 123,
  "message": "Offer confirmation saved successfully"
}
```

### GET /health

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Проверка работы

1. **Проверка API:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Тест сохранения данных:**
   ```bash
   curl -X POST http://localhost:8000/api/offer-confirmation \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Test",
       "last_name": "User",
       "email": "test@example.com",
       "payment_type": "installment"
     }'
   ```

3. **Проверка страниц:**
   - Откройте `/installment` или `/crypto`
   - Заполните форму
   - Проверьте переход на `/payment`

## Troubleshooting

### API сервер не запускается

- Проверьте, что порт 8000 свободен
- Убедитесь, что установлены все зависимости
- Проверьте логи в консоли

### Данные не сохраняются

- Проверьте подключение к БД
- Убедитесь, что таблица `offer_confirmations` создана
- Проверьте логи API сервера

### CORS ошибки

- В продакшене обновите `allow_origins` в `api_server.py`
- Укажите конкретные домены вместо `["*"]`

## Дальнейшие улучшения

- [ ] Добавить email-уведомления при подтверждении оферты
- [ ] Интеграция с CRM (Google Sheets, etc.)
- [ ] Webhook для отправки данных на внешние сервисы
- [ ] Админ-панель для просмотра подтверждений
- [ ] Экспорт данных в Excel/CSV
