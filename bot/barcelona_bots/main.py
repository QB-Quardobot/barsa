import asyncio
from aiogram import Dispatcher
import os

from config.logger import logger
from database.database import create_tables
from utils.sending.sending_handlers import admin_router # Чтобы зарегистрировались хендлеры рассылки

from config.bots import user_bot as bot
from config.bots import admin_bot

from handlers.user_bot_handler import router
dp = Dispatcher()

dp2 = Dispatcher()


async def run_bots():
    """Запускает Telegram ботов"""
    await create_tables()
    dp.include_router(router)
    dp2.include_router(admin_router)
    # Подключаем on_startup для запуска планировщика рассылок
    from utils.time_scheduler import on_startup
    dp.startup.register(on_startup)
    logger.info("Боты успешно запущены!")
    # Запускаем ботов
    await asyncio.gather(dp.start_polling(bot), dp2.start_polling(admin_bot))


async def run_api_server():
    """Запускает API сервер"""
    from api_server import run_api_server
    import uvicorn
    # Получаем настройки из переменных окружения или используем значения по умолчанию
    api_host = os.getenv("API_HOST", "0.0.0.0")
    api_port = int(os.getenv("API_PORT", "8000"))
    logger.info(f"Запускаем API сервер на {api_host}:{api_port}")
    # Запускаем uvicorn в отдельном процессе через asyncio
    config = uvicorn.Config(
        "api_server:app",
        host=api_host,
        port=api_port,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()


async def main():
    """Запускает ботов и API сервер параллельно"""
    await create_tables()
    
    # Запускаем ботов и API сервер параллельно
    await asyncio.gather(
        run_bots(),
        run_api_server()
    )

if __name__=="__main__":
    try:
        logger.info("🚀 Запускаем ботов...")
        print("🚀 Запускаем ботов...")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("❌ Бот остановлен вручную через Ctrl+C")
    finally:
        logger.info("🛑 Завершаем работу...")