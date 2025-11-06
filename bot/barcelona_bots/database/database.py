# Создание бд и фабрики сессий
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.config import DATABASE_URL

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
