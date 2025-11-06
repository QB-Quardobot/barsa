"""Импорт всех переменных окружения"""
import os

from dotenv import load_dotenv

load_dotenv()

USER_TOKEN = os.getenv("USER_TOKEN")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

# Convert sqlite:// to sqlite+aiosqlite:// for async support
_db_url = os.getenv('DATABASE_URL', 'sqlite:///./database/client.db')
if _db_url.startswith('sqlite://'):
    _db_url = _db_url.replace('sqlite://', 'sqlite+aiosqlite://', 1)
DATABASE_URL = _db_url
ADMIN_IDS = [int(admin_id.strip()) for admin_id in os.getenv("ADMIN_IDS", "").split(",") if admin_id.strip()]
ALEX_KLYAUZER_ID = int(os.getenv('ALEX_KLYAUZER_ID')) if os.getenv('ALEX_KLYAUZER_ID') else None