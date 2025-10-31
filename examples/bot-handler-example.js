/**
 * Пример обработчика аналитики для Telegram бота
 * 
 * Поддерживаемые фреймворки:
 * - aiogram (Python)
 * - Telegraf (Node.js)
 * - grammY (TypeScript)
 * - node-telegram-bot-api (Node.js)
 */

// ==========================================
// Пример 1: aiogram (Python)
// ==========================================
/*
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import json
import logging

logging.basicConfig(level=logging.INFO)
bot = Bot(token="YOUR_BOT_TOKEN")
dp = Dispatcher(bot)

@dp.message_handler(content_types=types.ContentType.WEB_APP_DATA)
async def handle_analytics(message: types.Message):
    """Обработка аналитических событий из Mini App"""
    try:
        data_str = message.web_app_data.data
        event = json.loads(data_str)
        
        # Пример события:
        # {
        #   "event": "click",
        #   "type": "cta",
        #   "label": "Вступить ✅",
        #   "href": "https://t.me/+-H7bNyi6NihhM2Fk",
        #   "timestamp": 1701234567890,
        #   "sessionId": "session_1701234567890_abc123",
        #   "userId": "123456789",
        #   "platform": "ios",
        #   "version": "6.9",
        #   "utm_source": "telegram",
        #   "utm_campaign": "launch"
        # }
        
        event_type = event.get('event', 'unknown')
        
        if event_type == 'click':
            # Сохранить в базу данных
            await save_click_event(event)
            
            # Логирование
            logging.info(
                f"Click: {event.get('label')} -> {event.get('href')} "
                f"(User: {event.get('userId')}, Platform: {event.get('platform')})"
            )
            
            # Опционально: отправить подтверждение пользователю
            await message.answer("✅ Переходим в канал...")
        
    except Exception as e:
        logging.error(f"Error handling analytics: {e}")
        await message.answer("Ошибка обработки данных")

async def save_click_event(event):
    """Сохранить событие в БД (PostgreSQL, MongoDB, etc.)"""
    # Пример для PostgreSQL (через asyncpg)
    # async with db_pool.acquire() as conn:
    #     await conn.execute(
    #         """
    #         INSERT INTO click_events 
    #         (event_type, label, href, user_id, platform, timestamp, session_id, utm_source, utm_campaign)
    #         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    #         """,
    #         event.get('type'),
    #         event.get('label'),
    #         event.get('href'),
    #         event.get('userId'),
    #         event.get('platform'),
    #         event.get('timestamp'),
    #         event.get('sessionId'),
    #         event.get('utm_source'),
    #         event.get('utm_campaign'),
    #     )
    pass

if __name__ == '__main__':
    from aiogram.utils import executor
    executor.start_polling(dp, skip_updates=True)
*/

// ==========================================
// Пример 2: Telegraf (Node.js)
// ==========================================
/*
const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb'); // или любая другая БД

const bot = new Telegraf('YOUR_BOT_TOKEN');

// Подключение к MongoDB (опционально)
let db;
MongoClient.connect('mongodb://localhost:27017', (err, client) => {
  if (err) throw err;
  db = client.db('analytics');
});

bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    
    // Проверяем тип события
    if (data.event === 'click') {
      console.log('Click event:', {
        label: data.label,
        href: data.href,
        userId: data.userId,
        platform: data.platform,
        timestamp: new Date(data.timestamp).toISOString(),
      });
      
      // Сохранить в БД
      if (db) {
        await db.collection('click_events').insertOne({
          ...data,
          receivedAt: new Date(),
        });
      }
      
      // Опционально: отправить ответ
      await ctx.reply('✅ Переходим в канал...');
    }
  } catch (error) {
    console.error('Error handling analytics:', error);
    await ctx.reply('Ошибка обработки данных');
  }
});

bot.launch();
*/

// ==========================================
// Пример 3: grammY (TypeScript)
// ==========================================
/*
import { Bot, Context } from 'grammy';

const bot = new Bot('YOUR_BOT_TOKEN');

bot.on('web_app_data', async (ctx: Context) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    
    if (data.event === 'click') {
      // Сохранить в БД или отправить в аналитику
      console.log('Click event:', data);
      
      await ctx.reply('✅ Переходим в канал...');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

bot.start();
*/

// ==========================================
// Пример 4: node-telegram-bot-api (Node.js)
// ==========================================
/*
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true });

bot.on('message', async (msg) => {
  // Проверяем, что это данные из WebApp
  if (msg.web_app?.data) {
    try {
      const data = JSON.parse(msg.web_app.data);
      
      if (data.event === 'click') {
        console.log('Click event:', data);
        
        // Сохранить в БД
        // await saveToDatabase(data);
        
        await bot.sendMessage(msg.chat.id, '✅ Переходим в канал...');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
*/

// ==========================================
// Пример 5: Простой HTTP endpoint (без бота)
// ==========================================
/*
// Если вы хотите получать данные через HTTP вместо бота
// Настройте в analytics.ts: serverEndpoint = 'https://your-api.com/analytics'

// Express.js endpoint
const express = require('express');
const app = express();

app.use(express.json());

app.post('/analytics', async (req, res) => {
  try {
    const events = req.body; // Array of events
    
    console.log(`Received ${events.length} events`);
    
    // Сохранить в БД
    // await db.analytics.insertMany(events);
    
    res.json({ success: true, count: events.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Analytics endpoint listening on port 3000');
});
*/

// ==========================================
// Пример 6: SQL Schema для PostgreSQL
// ==========================================
/*
CREATE TABLE click_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  label TEXT,
  href TEXT NOT NULL,
  user_id BIGINT,
  session_id VARCHAR(100),
  platform VARCHAR(20),
  version VARCHAR(20),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON click_events(user_id);
CREATE INDEX idx_session_id ON click_events(session_id);
CREATE INDEX idx_timestamp ON click_events(timestamp);
CREATE INDEX idx_utm_campaign ON click_events(utm_campaign);

-- Пример запроса: статистика по кнопкам
SELECT 
  label,
  COUNT(*) as clicks,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as sessions
FROM click_events
WHERE timestamp > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours') * 1000
GROUP BY label
ORDER BY clicks DESC;

-- Пример запроса: конверсия по UTM кампаниям
SELECT 
  utm_campaign,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT user_id) as unique_users
FROM click_events
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign
ORDER BY total_clicks DESC;
*/

// ==========================================
// Пример 7: MongoDB Schema
// ==========================================
/*
// Коллекция: click_events

{
  "event": "click",
  "type": "cta",
  "label": "Вступить ✅",
  "href": "https://t.me/+-H7bNyi6NihhM2Fk",
  "timestamp": 1701234567890,
  "sessionId": "session_1701234567890_abc123",
  "userId": "123456789",
  "platform": "ios",
  "version": "6.9",
  "utm_source": "telegram",
  "utm_campaign": "launch",
  "receivedAt": ISODate("2024-01-01T12:00:00Z")
}

// Индексы:
db.click_events.createIndex({ "userId": 1 });
db.click_events.createIndex({ "sessionId": 1 });
db.click_events.createIndex({ "timestamp": 1 });
db.click_events.createIndex({ "utm_campaign": 1 });

// Пример запроса: топ кнопок за последние 24 часа
db.click_events.aggregate([
  {
    $match: {
      timestamp: { $gte: Date.now() - 86400000 }
    }
  },
  {
    $group: {
      _id: "$label",
      clicks: { $sum: 1 },
      uniqueUsers: { $addToSet: "$userId" }
    }
  },
  {
    $project: {
      label: "$_id",
      clicks: 1,
      uniqueUsers: { $size: "$uniqueUsers" }
    }
  },
  {
    $sort: { clicks: -1 }
  }
]);
*/

module.exports = {
  // Экспортируем примеры для документации
};

