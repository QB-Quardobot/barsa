import logging, os
from logging.handlers import RotatingFileHandler

# Настройка логирования
logger = logging.getLogger("sqlalchemy")
logger.setLevel(logging.DEBUG)

# Формат логов
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Консольный логгер (только ошибки)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.ERROR)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Файловый логгер (записываем всё)
file_handler = RotatingFileHandler("app.log", maxBytes=1_000_000, backupCount=3, encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Для всех подсистем SQLAlchemy
logging.getLogger("sqlalchemy").setLevel(logging.DEBUG)

# Логирование SQL-запросов (только запросы)
logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)

# Логирование ошибок в ORM
logging.getLogger("sqlalchemy.orm").setLevel(logging.ERROR)

# Логирование работы пула соединений
logging.getLogger("sqlalchemy.pool").setLevel(logging.ERROR)