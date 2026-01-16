# Создание бд и фабрики сессий
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.config import DATABASE_URL
from config.logger import logger

# Асинхронный движок и сессия
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# 🔹 Базовый класс
Base = declarative_base()

# Декоратор для подключения к БД
# Фабрика сессий
def connection(func):
    async def wrapper(*args, **kwargs):
        async with async_session() as session:
            return await func(session, *args, **kwargs)
    return wrapper

# Создание асинхронного движка для работы с бд
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_offer_confirmation_columns(conn)


async def _ensure_offer_confirmation_columns(conn) -> None:
    """Добавляет новые колонки в offer_confirmations при необходимости (SQLite)."""
    try:
        result = await conn.exec_driver_sql("PRAGMA table_info(offer_confirmations)")
        existing_columns = {row[1] for row in result}
        if "telegram_user_id" not in existing_columns:
            await conn.exec_driver_sql(
                "ALTER TABLE offer_confirmations ADD COLUMN telegram_user_id TEXT"
            )
        if "telegram_username" not in existing_columns:
            await conn.exec_driver_sql(
                "ALTER TABLE offer_confirmations ADD COLUMN telegram_username TEXT"
            )
    except Exception as exc:
        logger.warning(f"Failed to ensure offer_confirmations columns: {exc}")
