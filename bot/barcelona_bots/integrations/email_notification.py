"""
Email Notification Integration
Отправляет email уведомления при подтверждении оферты
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from datetime import datetime
import json

from config.logger import logger


class EmailNotificationIntegration:
    """Интеграция для отправки email уведомлений"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.notification_email = os.getenv('NOTIFICATION_EMAIL', self.smtp_user)
        self._enabled = bool(self.smtp_user and self.smtp_password)
    
    def is_enabled(self) -> bool:
        """Проверяет, включена ли интеграция"""
        return self._enabled
    
    def send_notification(
        self,
        first_name: str,
        last_name: str,
        email: str,
        payment_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Отправляет email уведомление о подтверждении оферты
        
        Args:
            first_name: Имя клиента
            last_name: Фамилия клиента
            email: Email клиента
            payment_type: Тип оплаты
            ip_address: IP адрес
            user_agent: User Agent
            additional_data: Дополнительные данные
        
        Returns:
            bool: True если отправка успешна
        """
        if not self._enabled:
            logger.warning("Email notifications not configured, skipping")
            return False
        
        try:
            # Создаем сообщение
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'Новое подтверждение оферты - {payment_type}'
            msg['From'] = self.smtp_user
            msg['To'] = self.notification_email
            
            # Формируем текст сообщения
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            text_content = f"""
Новое подтверждение оферты

Дата и время: {timestamp}
Имя: {first_name}
Фамилия: {last_name}
Email: {email}
Тип оплаты: {payment_type}
IP адрес: {ip_address or 'Не указан'}
User Agent: {user_agent or 'Не указан'}
"""
            
            if additional_data:
                text_content += f"\nДополнительные данные:\n{json.dumps(additional_data, ensure_ascii=False, indent=2)}"
            
            # HTML версия
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #667eea; }}
        .value {{ margin-top: 5px; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Новое подтверждение оферты</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Дата и время:</div>
                <div class="value">{timestamp}</div>
            </div>
            <div class="field">
                <div class="label">Имя:</div>
                <div class="value">{first_name}</div>
            </div>
            <div class="field">
                <div class="label">Фамилия:</div>
                <div class="value">{last_name}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value">{email}</div>
            </div>
            <div class="field">
                <div class="label">Тип оплаты:</div>
                <div class="value">{payment_type}</div>
            </div>
            <div class="field">
                <div class="label">IP адрес:</div>
                <div class="value">{ip_address or 'Не указан'}</div>
            </div>
            <div class="field">
                <div class="label">User Agent:</div>
                <div class="value">{user_agent or 'Не указан'}</div>
            </div>
"""
            
            if additional_data:
                html_content += f"""
            <div class="field">
                <div class="label">Дополнительные данные:</div>
                <div class="value"><pre>{json.dumps(additional_data, ensure_ascii=False, indent=2)}</pre></div>
            </div>
"""
            
            html_content += """
        </div>
        <div class="footer">
            <p>Это автоматическое уведомление от системы обработки оферт.</p>
        </div>
    </div>
</body>
</html>
"""
            
            # Добавляем части сообщения
            msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            
            # Отправляем email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email notification sent: {email}, {payment_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False


# Глобальный экземпляр
_email_notification: Optional[EmailNotificationIntegration] = None


def get_email_notification() -> EmailNotificationIntegration:
    """Получает глобальный экземпляр email интеграции"""
    global _email_notification
    if _email_notification is None:
        _email_notification = EmailNotificationIntegration()
    return _email_notification


def send_email_notification(
    first_name: str,
    last_name: str,
    email: str,
    payment_type: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Удобная функция для отправки email уведомления"""
    notification = get_email_notification()
    if not notification.is_enabled():
        return False
    
    return notification.send_notification(
        first_name=first_name,
        last_name=last_name,
        email=email,
        payment_type=payment_type,
        ip_address=ip_address,
        user_agent=user_agent,
        additional_data=additional_data
    )
