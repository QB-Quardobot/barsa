"""
Webhook Integration
Отправляет данные на внешний webhook при подтверждении оферты
"""
import os
from typing import Dict, Any, Optional
from datetime import datetime
import json
import httpx

from config.logger import logger


class WebhookIntegration:
    """Интеграция для отправки данных на webhook"""
    
    def __init__(self):
        self.webhook_url = os.getenv('WEBHOOK_URL')
        self.webhook_secret = os.getenv('WEBHOOK_SECRET')
        self.timeout = int(os.getenv('WEBHOOK_TIMEOUT', '10'))
        self._enabled = bool(self.webhook_url)
    
    def is_enabled(self) -> bool:
        """Проверяет, включена ли интеграция"""
        return self._enabled
    
    async def send_webhook(
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
        Отправляет данные на webhook
        
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
            logger.warning("Webhook not configured, skipping")
            return False
        
        try:
            # Формируем payload
            payload = {
                'event_type': 'offer_confirmation',
                'timestamp': datetime.now().isoformat(),
                'data': {
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'payment_type': payment_type,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                }
            }
            
            if additional_data:
                payload['data']['additional_data'] = additional_data
            
            # Подготавливаем headers
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Offer-Confirmation-Bot/1.0'
            }
            
            if self.webhook_secret:
                headers['X-Webhook-Secret'] = self.webhook_secret
            
            # Отправляем запрос
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
            
            logger.info(f"Webhook sent successfully: {email}, {payment_type}")
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Failed to send webhook (HTTP error): {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to send webhook: {e}")
            return False


# Глобальный экземпляр
_webhook: Optional[WebhookIntegration] = None


def get_webhook() -> WebhookIntegration:
    """Получает глобальный экземпляр webhook интеграции"""
    global _webhook
    if _webhook is None:
        _webhook = WebhookIntegration()
    return _webhook


async def send_webhook_notification(
    first_name: str,
    last_name: str,
    email: str,
    payment_type: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Удобная функция для отправки webhook"""
    webhook = get_webhook()
    if not webhook.is_enabled():
        return False
    
    return await webhook.send_webhook(
        first_name=first_name,
        last_name=last_name,
        email=email,
        payment_type=payment_type,
        ip_address=ip_address,
        user_agent=user_agent,
        additional_data=additional_data
    )
