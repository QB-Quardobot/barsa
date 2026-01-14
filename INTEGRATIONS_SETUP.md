# Настройка интеграций (Google Sheets, Email, Webhook)

## Обзор

Реализованы три типа интеграций для сохранения данных оферты:
1. **Google Sheets** - автоматическое сохранение в таблицу
2. **Email уведомления** - отправка email при подтверждении оферты
3. **Webhook** - отправка данных на внешний API endpoint

Все интеграции работают параллельно с сохранением в БД и не блокируют ответ API.

## 1. Google Sheets Integration

### Настройка

#### Шаг 1: Создание Service Account в Google Cloud

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Library**
4. Найдите и включите **Google Sheets API**
5. Перейдите в **APIs & Services** → **Credentials**
6. Нажмите **Create Credentials** → **Service Account**
7. Заполните данные и создайте аккаунт
8. Перейдите в созданный Service Account → **Keys** → **Add Key** → **JSON**
9. Скачайте JSON файл с credentials

#### Шаг 2: Создание Google Sheet

1. Создайте новую Google таблицу
2. Скопируйте **ID таблицы** из URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
3. Нажмите **Share** (Поделиться)
4. Добавьте email из JSON файла (поле `client_email`)
5. Дайте права **Editor** (Редактор)

#### Шаг 3: Настройка переменных окружения

Добавьте в `.env` файл:

```env
# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_WORKSHEET_NAME=Offer Confirmations
```

**Пример:**
```env
GOOGLE_SHEETS_CREDENTIALS_PATH=/home/user/credentials.json
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_WORKSHEET_NAME=Offer Confirmations
```

#### Шаг 4: Установка зависимостей

```bash
cd bot/barcelona_bots
pip install gspread google-auth google-auth-oauthlib google-auth-httplib2
```

### Структура данных в таблице

Таблица автоматически создаст заголовки:
- Дата и время
- Имя
- Фамилия
- Email
- Тип оплаты
- IP адрес
- User Agent
- Дополнительные данные

### Проверка работы

После настройки при каждом подтверждении оферты данные автоматически добавляются в таблицу.

## 2. Email Notifications

### Настройка

#### Для Gmail

1. Включите **2-Step Verification** в Google аккаунте
2. Создайте **App Password**:
   - Перейдите в [Google Account](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Создайте пароль для "Mail"

#### Для других SMTP серверов

Используйте стандартные SMTP настройки вашего провайдера.

#### Настройка переменных окружения

Добавьте в `.env` файл:

```env
# Email Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=notifications@yourdomain.com
```

**Пример для Gmail:**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
NOTIFICATION_EMAIL=your-email@gmail.com
```

**Пример для других SMTP:**
```env
SMTP_SERVER=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=your-email@yandex.ru
SMTP_PASSWORD=your-password
NOTIFICATION_EMAIL=your-email@yandex.ru
```

### Формат уведомлений

Email содержит:
- Красивый HTML формат
- Все данные клиента
- IP адрес и User Agent
- Дополнительные данные (если есть)

## 3. Webhook Integration

### Настройка

Добавьте в `.env` файл:

```env
# Webhook
WEBHOOK_URL=https://your-api.com/webhook/offer-confirmation
WEBHOOK_SECRET=your-secret-key-here
WEBHOOK_TIMEOUT=10
```

**Пример:**
```env
WEBHOOK_URL=https://api.example.com/webhooks/offer
WEBHOOK_SECRET=super-secret-key-12345
WEBHOOK_TIMEOUT=10
```

### Формат данных

Webhook отправляет POST запрос с JSON:

```json
{
  "event_type": "offer_confirmation",
  "timestamp": "2024-01-01T12:00:00",
  "data": {
    "first_name": "Иван",
    "last_name": "Иванов",
    "email": "ivan@example.com",
    "payment_type": "installment",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "additional_data": {}
  }
}
```

### Headers

- `Content-Type: application/json`
- `X-Webhook-Secret: your-secret-key` (если настроен)

### Обработка на вашем сервере

Пример обработчика (Node.js/Express):

```javascript
app.post('/webhook/offer-confirmation', (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  
  // Проверка секрета
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { event_type, timestamp, data } = req.body;
  
  // Обработка данных
  console.log('New offer confirmation:', data);
  
  // Сохранение в вашу CRM/БД
  // ...
  
  res.json({ success: true });
});
```

## Комбинированное использование

Все интеграции работают независимо друг от друга. Можно включить:
- Только Google Sheets
- Только Email
- Только Webhook
- Любую комбинацию
- Все вместе

Если интеграция не настроена, она просто пропускается без ошибок.

## Проверка работы

### Тест Google Sheets

1. Заполните форму на `/installment` или `/crypto`
2. Проверьте таблицу Google Sheets - должна появиться новая строка

### Тест Email

1. Заполните форму
2. Проверьте почту - должно прийти уведомление

### Тест Webhook

1. Настройте тестовый endpoint (например, через [webhook.site](https://webhook.site))
2. Заполните форму
3. Проверьте webhook.site - должен прийти запрос

## Troubleshooting

### Google Sheets не работает

- Проверьте путь к credentials файлу
- Убедитесь, что Service Account имеет доступ к таблице
- Проверьте ID таблицы в переменных окружения
- Проверьте логи: `logger.error` покажет детали ошибки

### Email не отправляется

- Проверьте SMTP настройки
- Для Gmail используйте App Password, не обычный пароль
- Проверьте, что порт не заблокирован файрволом
- Проверьте логи на наличие ошибок

### Webhook не работает

- Проверьте URL webhook
- Убедитесь, что endpoint доступен извне
- Проверьте timeout (увеличьте если нужно)
- Проверьте логи на наличие ошибок

## Безопасность

### Google Sheets

- Храните credentials.json в безопасном месте
- Не коммитьте credentials в git
- Добавьте `credentials.json` в `.gitignore`

### Email

- Используйте App Passwords для Gmail
- Не храните пароли в открытом виде
- Используйте переменные окружения

### Webhook

- Всегда используйте WEBHOOK_SECRET для проверки
- Используйте HTTPS для webhook URL
- Валидируйте данные на стороне webhook

## Пример полной настройки

`.env` файл:

```env
# Database (уже настроено)
DATABASE_URL=sqlite+aiosqlite:///./database/client.db

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_PATH=/home/user/bot/credentials.json
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEETS_WORKSHEET_NAME=Offer Confirmations

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=notifications@gmail.com

# Webhook
WEBHOOK_URL=https://api.example.com/webhooks/offer
WEBHOOK_SECRET=super-secret-key-12345
WEBHOOK_TIMEOUT=10
```

## Дополнительные возможности

### Кастомные интеграции

Вы можете создать свои интеграции по аналогии с существующими:
1. Создайте файл в `bot/barcelona_bots/integrations/`
2. Реализуйте функцию сохранения
3. Импортируйте в `api_server.py`
4. Вызовите после сохранения в БД

### Асинхронные интеграции

Для тяжелых операций можно использовать фоновые задачи:
- Celery
- RQ (Redis Queue)
- asyncio задачи

Текущая реализация использует синхронные вызовы для простоты, но они не блокируют ответ API.
