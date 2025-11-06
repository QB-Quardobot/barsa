"""Импорт всех переменных окружения"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

USER_TOKEN = os.getenv("USER_TOKEN")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

# Get absolute path to database directory
# This file is in barcelona_bots/config/, so we go up one level to barcelona_bots/
_bot_dir = Path(__file__).parent.parent
_db_dir = _bot_dir / "database"
_db_dir.mkdir(exist_ok=True)  # Create directory if it doesn't exist
_db_path = _db_dir / "client.db"

# Convert sqlite:// to sqlite+aiosqlite:// for async support
_db_url = os.getenv('DATABASE_URL')
if not _db_url:
    # Use absolute path for default database location
    _db_url = f'sqlite+aiosqlite:///{_db_path}'
elif _db_url.startswith('sqlite://'):
    # If relative path is provided, convert to absolute
    if _db_url.startswith('sqlite:///./'):
        # Relative path like sqlite:///./database/client.db
        rel_path = _db_url.replace('sqlite:///./', '')
        _db_path = _bot_dir / rel_path
        _db_path.parent.mkdir(parents=True, exist_ok=True)
        _db_url = f'sqlite+aiosqlite:///{_db_path}'
    else:
        _db_url = _db_url.replace('sqlite://', 'sqlite+aiosqlite://', 1)
elif _db_url.startswith('sqlite+aiosqlite://'):
    # Already correct format, but ensure directory exists if relative path
    if '/./' in _db_url:
        rel_path = _db_url.split('sqlite+aiosqlite:///./')[-1]
        _db_path = _bot_dir / rel_path
        _db_path.parent.mkdir(parents=True, exist_ok=True)
        _db_url = f'sqlite+aiosqlite:///{_db_path}'

DATABASE_URL = _db_url
ADMIN_IDS = [int(admin_id.strip()) for admin_id in os.getenv("ADMIN_IDS", "").split(",") if admin_id.strip()]
ALEX_KLYAUZER_ID = int(os.getenv('ALEX_KLYAUZER_ID')) if os.getenv('ALEX_KLYAUZER_ID') else None