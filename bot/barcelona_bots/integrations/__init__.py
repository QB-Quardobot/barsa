"""
Integrations Module
Модуль для интеграций с внешними сервисами (Google Sheets, Email, Webhook)
"""
from .google_sheets import save_to_google_sheets, get_google_sheets
from .email_notification import send_email_notification, get_email_notification
from .webhook import send_webhook_notification, get_webhook

__all__ = [
    'save_to_google_sheets',
    'get_google_sheets',
    'send_email_notification',
    'get_email_notification',
    'send_webhook_notification',
    'get_webhook',
]
