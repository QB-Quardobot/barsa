import asyncio
from aiogram import Dispatcher

from config.logger import logger
from database.database import create_tables
from utils.sending.sending_handlers import admin_router # Чтобы зарегистрировались хендлеры рассылки

from config.bots import user_bot as bot
from config.bots import admin_bot

from handlers.user_bot_handler import router
dp = Dispatcher()

dp2 = Dispatcher()

async def main():

    await create_tables()
    # await del_me()
    dp.include_router(router)
    dp2.include_router(admin_router)
    # Подключаем on_startup для запуска планировщика рассылок
    from utils.time_scheduler import on_startup
    dp.startup.register(on_startup)
    print("Боты успешно запущены!")
    # Запускаем ботов

    await asyncio.gather(dp.start_polling(bot), dp2.start_polling(admin_bot))

if __name__=="__main__":
    try:
        logger.info("🚀 Запускаем ботов...")
        print("🚀 Запускаем ботов...")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("❌ Бот остановлен вручную через Ctrl+C")
    finally:
        logger.info("🛑 Завершаем работу...")