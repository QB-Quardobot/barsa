"""Импорт всех переменных окружения"""
import os

from dotenv import load_dotenv

load_dotenv()

USER_TOKEN = os.getenv("USER_TOKEN")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")

DATABASE_URL = os.getenv('DATABASE_URL')
ADMIN_IDS = [int(admin_id.strip()) for admin_id in os.getenv("ADMIN_IDS", "").split(",")]
ALEX_KLYAUZER_ID = int(os.getenv('ALEX_KLYAUZER_ID'))