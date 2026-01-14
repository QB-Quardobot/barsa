# Быстрый старт - Интеграции

## Что реализовано

✅ **Google Sheets** - автоматическое сохранение в таблицу
✅ **Email уведомления** - отправка email при подтверждении
✅ **Webhook** - отправка данных на внешний API

Все интеграции работают параллельно и не блокируют ответ API.

## Быстрая настройка

### 1. Установка зависимостей

```bash
cd bot/barcelona_bots
pip install gspread google-auth google-auth-oauthlib google-auth-httplib2
```

### 2. Google Sheets (опционально)

1. Создайте Service Account в [Google Cloud Console](https://console.cloud.google.com/)
2. Скачайте JSON credentials
3. Создайте Google таблицу и поделитесь с Service Account email
4. Добавьте в `.env`:
   ```env
   GOOGLE_SHEETS_CREDENTIALS_PATH=/path/to/credentials.json
   GOOGLE_SHEETS_ID=your_spreadsheet_id
   GOOGLE_SHEETS_WORKSHEET_NAME=Offer Confirmations
   ```

### 3. Email (опционально)

Добавьте в `.env`:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=notifications@gmail.com
```

**Для Gmail:** Используйте [App Password](https://myaccount.google.com/apppasswords), не обычный пароль!

### 4. Webhook (опционально)

Добавьте в `.env`:
```env
WEBHOOK_URL=https://your-api.com/webhook
WEBHOOK_SECRET=your-secret-key
```

## Использование

После настройки все интеграции работают автоматически при каждом подтверждении оферты.

Данные сохраняются:
1. В БД (всегда)
2. В Google Sheets (если настроено)
3. Email уведомление (если настроено)
4. Webhook (если настроено)

## Проверка

1. Заполните форму на `/installment` или `/crypto`
2. Проверьте:
   - Google Sheets - новая строка
   - Email - уведомление
   - Webhook - запрос на ваш endpoint

Подробная документация: `INTEGRATIONS_SETUP.md`
