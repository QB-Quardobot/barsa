"""
API Server for Offer Confirmation
Handles HTTP requests from frontend to save offer confirmations
"""
import asyncio
import json
import os
import shutil
import subprocess
import re
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uvicorn

from config.logger import logger
from database.database import create_tables
from database.queries import (
    save_offer_confirmation, 
    get_admin_stats, 
    get_all_confirmations, 
    get_all_users
)

app = FastAPI(title="Offer Confirmation API", version="1.0.0")

# CORS middleware для разрешения запросов с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OfferConfirmationRequest(BaseModel):
    """Модель запроса для подтверждения оферты (поддерживает snake_case и camelCase)"""
    first_name: Optional[str] = Field(default=None, alias="firstName")
    last_name: Optional[str] = Field(default=None, alias="lastName")
    email: Optional[str] = None
    payment_type: Optional[str] = Field(default=None, alias="paymentType")
    additional_data: Optional[Any] = Field(default=None, alias="additionalData")

    class Config:
        populate_by_name = True


class OfferConfirmationResponse(BaseModel):
    """Модель ответа"""
    success: bool
    confirmation_id: int = None
    message: str


@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске сервера"""
    await create_tables()
    logger.info("API Server started and database tables created")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint for /api/ path"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Логирует некорректные запросы, чтобы не терять лиды из-за 422."""
    try:
        raw_body = await request.body()
        logger.warning(f"Validation error on {request.url.path}: {exc.errors()} | body={raw_body[:200]!r}")
    except Exception:
        logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(status_code=400, content={"detail": "Invalid request payload"})


@app.post("/api/offer-confirmation", response_model=OfferConfirmationResponse)
async def confirm_offer(request: Request, data: OfferConfirmationRequest):
    """
    Сохраняет подтверждение оферты и данные клиента
    
    Args:
        request: FastAPI Request object для получения IP и User-Agent
        data: Данные подтверждения оферты
    
    Returns:
        OfferConfirmationResponse с результатом сохранения
    """
    # Логируем входящий запрос
    logger.info(f"=== INCOMING REQUEST ===")
    logger.info(f"Method: {request.method}, URL: {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Client IP: {request.client.host if request.client else 'unknown'}")
    logger.info(f"Data received: first_name={data.first_name}, last_name={data.last_name}, email={data.email}, payment_type={data.payment_type}")
    
    try:
        # Нормализация входных данных
        first_name = (data.first_name or "").strip()
        last_name = (data.last_name or "").strip()
        email = (data.email or "").strip()
        payment_type = (data.payment_type or "").strip()

        # Попробовать восстановить payment_type из additional_data
        if not payment_type and isinstance(data.additional_data, dict):
            candidate = data.additional_data.get("payment_type")
            if candidate:
                payment_type = str(candidate).strip()
            else:
                tariff_id = data.additional_data.get("tariff_id")
                currency = data.additional_data.get("currency")
                if tariff_id and currency:
                    payment_type = f"tariff_{tariff_id}_{currency}".strip()

        # Подготавливаем additional_data
        extra_additional: dict = {}
        if isinstance(data.additional_data, dict):
            extra_additional = dict(data.additional_data)
        elif data.additional_data is not None:
            extra_additional = {"raw_additional_data": str(data.additional_data)}

        # Валидация email (fallback, чтобы не терять лиды)
        if not email and extra_additional:
            candidate_email = (
                extra_additional.get("email")
                or extra_additional.get("user_email")
            )
            if candidate_email:
                email = str(candidate_email).strip()

        if not email:
            fallback_email = f"unknown+{int(datetime.now().timestamp())}@invalid.local"
            logger.warning(f"Email missing in request, using fallback: {fallback_email}")
            email = fallback_email
            extra_additional["missing_email"] = True

        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
            logger.warning(f"Invalid email format received: {email}")

        # Валидация типа оплаты (fallback на unknown, чтобы не терять лиды)
        if not payment_type:
            payment_type = "unknown"
            logger.warning("payment_type missing, using fallback 'unknown'")
        elif payment_type not in ['installment', 'crypto'] and not payment_type.startswith("tariff_"):
            logger.warning(f"Unknown payment_type received: {payment_type} (allowed: installment, crypto, tariff_*)")

        if extra_additional is not None:
            extra_additional.setdefault("payment_type", payment_type)
        
        # Получаем IP адрес и User-Agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", None)
        
        # Преобразуем additional_data в JSON строку если есть
        additional_data_str = None
        if extra_additional:
            try:
                additional_data_str = json.dumps(extra_additional)
            except Exception:
                additional_data_str = json.dumps({"raw": str(extra_additional)})
        
        # Сохраняем в БД
        confirmation_id, is_duplicate = await save_offer_confirmation(
            first_name=first_name or "—",
            last_name=last_name or "—",
            email=email,
            payment_type=payment_type,
            ip_address=ip_address,
            user_agent=user_agent,
            additional_data=additional_data_str
        )
        
        logger.info(
            f"Offer confirmation saved: ID={confirmation_id}, "
            f"Email={email}, Type={payment_type}, Duplicate={is_duplicate}"
        )

        if is_duplicate:
            logger.warning("Duplicate request detected; skipping integrations")
            return OfferConfirmationResponse(
                success=True,
                confirmation_id=confirmation_id,
                message="Duplicate request ignored"
            )
        
        # Интеграции (выполняются параллельно, не блокируют ответ)
        # Google Sheets
        logger.info(f"=== STARTING GOOGLE SHEETS INTEGRATION ===")
        try:
            from integrations import save_to_google_sheets
            logger.info(f"Attempting to save to Google Sheets: {email}, {payment_type}")
            logger.info(f"Parameters: first_name={first_name}, last_name={last_name}, email={email}, payment_type={payment_type}")
            result = save_to_google_sheets(
                first_name=first_name or "—",
                last_name=last_name or "—",
                email=email,
                payment_type=payment_type,
                ip_address=ip_address,
                user_agent=user_agent,
                additional_data=extra_additional if extra_additional else None
            )
            logger.info(f"Google Sheets save_to_google_sheets returned: {result} (type: {type(result)})")
            if result:
                logger.info(f"✅ Successfully saved to Google Sheets: {email}")
            else:
                logger.warning(f"❌ Google Sheets save returned False for: {email}")
        except Exception as e:
            logger.error(f"❌ Google Sheets integration failed: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Email уведомления
        try:
            from integrations import send_email_notification
            send_email_notification(
                first_name=first_name or "—",
                last_name=last_name or "—",
                email=email,
                payment_type=payment_type,
                ip_address=ip_address,
                user_agent=user_agent,
                additional_data=extra_additional if extra_additional else None
            )
        except Exception as e:
            logger.warning(f"Email notification failed: {e}")
        
        # Webhook
        try:
            from integrations import send_webhook_notification
            await send_webhook_notification(
                first_name=first_name or "—",
                last_name=last_name or "—",
                email=email,
                payment_type=payment_type,
                ip_address=ip_address,
                user_agent=user_agent,
                additional_data=extra_additional if extra_additional else None
            )
        except Exception as e:
            logger.warning(f"Webhook integration failed: {e}")
        
        return OfferConfirmationResponse(
            success=True,
            confirmation_id=confirmation_id,
            message="Offer confirmation saved successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving offer confirmation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# Admin Endpoints
ADMIN_PANEL_TOKEN = os.getenv("ADMIN_PANEL_TOKEN")

def verify_admin(request: Request):
    if not ADMIN_PANEL_TOKEN:
        raise HTTPException(status_code=500, detail="ADMIN_PANEL_TOKEN not configured")
    token = request.headers.get("X-Admin-Token")
    auth_header = request.headers.get("Authorization", "")
    if not token and auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
    if token != ADMIN_PANEL_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")

@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    """Возвращает статистику для админки"""
    verify_admin(request)
    stats = await get_admin_stats()
    return stats

@app.get("/api/admin/confirmations")
async def admin_confirmations(request: Request, limit: int = 100):
    """Возвращает список подтверждений"""
    verify_admin(request)
    confirmations = await get_all_confirmations(limit=limit)
    return confirmations

@app.get("/api/admin/users")
async def admin_users(request: Request, limit: int = 100):
    """Возвращает список пользователей бота"""
    verify_admin(request)
    users = await get_all_users(limit=limit)
    return users


@app.get("/api/admin/server-info")
async def server_info(request: Request):
    """Возвращает информацию о сервере: диск, память, CPU"""
    verify_admin(request)
    try:
        import psutil
        import shutil
        from datetime import datetime
        
        # Диск
        disk = shutil.disk_usage('/')
        disk_total_gb = disk.total / (1024**3)
        disk_used_gb = disk.used / (1024**3)
        disk_free_gb = disk.free / (1024**3)
        disk_percent = (disk.used / disk.total) * 100
        
        # Память
        memory = psutil.virtual_memory()
        memory_total_gb = memory.total / (1024**3)
        memory_used_gb = memory.used / (1024**3)
        memory_free_gb = memory.available / (1024**3)
        memory_percent = memory.percent
        
        # Swap
        swap = psutil.swap_memory()
        swap_total_gb = swap.total / (1024**3) if swap.total > 0 else 0
        swap_used_gb = swap.used / (1024**3) if swap.used > 0 else 0
        swap_percent = swap.percent if swap.total > 0 else 0
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        cpu_freq_mhz = cpu_freq.current if cpu_freq else 0
        
        # Загрузка системы
        load_avg = psutil.getloadavg()
        
        # Время работы
        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime_seconds = (datetime.now() - boot_time).total_seconds()
        uptime_days = int(uptime_seconds // 86400)
        uptime_hours = int((uptime_seconds % 86400) // 3600)
        uptime_minutes = int((uptime_seconds % 3600) // 60)
        
        return {
            "disk": {
                "total_gb": round(disk_total_gb, 2),
                "used_gb": round(disk_used_gb, 2),
                "free_gb": round(disk_free_gb, 2),
                "percent": round(disk_percent, 1),
                "status": "critical" if disk_percent > 90 else "warning" if disk_percent > 75 else "ok"
            },
            "memory": {
                "total_gb": round(memory_total_gb, 2),
                "used_gb": round(memory_used_gb, 2),
                "free_gb": round(memory_free_gb, 2),
                "percent": round(memory_percent, 1),
                "status": "critical" if memory_percent > 90 else "warning" if memory_percent > 75 else "ok"
            },
            "swap": {
                "total_gb": round(swap_total_gb, 2),
                "used_gb": round(swap_used_gb, 2),
                "percent": round(swap_percent, 1),
                "status": "ok" if swap_percent < 50 else "warning"
            },
            "cpu": {
                "percent": round(cpu_percent, 1),
                "count": cpu_count,
                "freq_mhz": round(cpu_freq_mhz, 0),
                "load_avg": [round(x, 2) for x in load_avg],
                "status": "critical" if cpu_percent > 90 else "warning" if cpu_percent > 75 else "ok"
            },
            "uptime": {
                "days": uptime_days,
                "hours": uptime_hours,
                "minutes": uptime_minutes,
                "formatted": f"{uptime_days}д {uptime_hours}ч {uptime_minutes}м"
            },
            "timestamp": datetime.now().isoformat()
        }
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="psutil not installed. Run: pip install psutil"
        )
    except Exception as e:
        logger.error(f"Error getting server info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting server info: {str(e)}"
        )


@app.post("/api/admin/cleanup-cache")
async def cleanup_cache(request: Request):
    """Очищает кэш и временные файлы"""
    verify_admin(request)
    try:
        results = {
            "cleaned": [],
            "errors": [],
            "freed_space_mb": 0
        }
        
        # Получаем размер до очистки
        disk_before = shutil.disk_usage('/')
        space_before = disk_before.free / (1024**2)  # MB
        
        # 1. Очистка npm кэша
        try:
            result = subprocess.run(
                ['npm', 'cache', 'clean', '--force'],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                results["cleaned"].append("npm cache")
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
            results["errors"].append(f"npm cache: {str(e)}")
        
        # 2. Очистка временных файлов Python
        try:
            import tempfile
            temp_dir = tempfile.gettempdir()
            temp_size = sum(
                f.stat().st_size for f in Path(temp_dir).rglob('*') if f.is_file()
            ) / (1024**2)
            
            # Удаляем файлы старше 7 дней
            for temp_file in Path(temp_dir).rglob('*'):
                if temp_file.is_file():
                    try:
                        if (datetime.now().timestamp() - temp_file.stat().st_mtime) > (7 * 24 * 60 * 60):
                            temp_file.unlink()
                    except:
                        pass
            
            results["cleaned"].append(f"Python temp files (~{int(temp_size)}MB)")
        except Exception as e:
            results["errors"].append(f"temp files: {str(e)}")
        
        # 3. Очистка старых логов (если есть доступ)
        try:
            log_dirs = ['/var/log', '/tmp']
            for log_dir in log_dirs:
                if os.path.exists(log_dir) and os.access(log_dir, os.W_OK):
                    # Удаляем логи старше 7 дней
                    for log_file in Path(log_dir).rglob('*.log'):
                        if log_file.is_file():
                            try:
                                if (datetime.now().timestamp() - log_file.stat().st_mtime) > (7 * 24 * 60 * 60):
                                    log_file.unlink()
                            except:
                                pass
                    results["cleaned"].append(f"old logs from {log_dir}")
        except Exception as e:
            results["errors"].append(f"logs: {str(e)}")
        
        # Получаем размер после очистки
        disk_after = shutil.disk_usage('/')
        space_after = disk_after.free / (1024**2)  # MB
        results["freed_space_mb"] = round(space_after - space_before, 2)
        
        return {
            "success": True,
            "message": "Cache cleanup completed",
            "results": results
        }
    except Exception as e:
        logger.error(f"Error cleaning cache: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error cleaning cache: {str(e)}"
        )


def run_api_server(host: str = "0.0.0.0", port: int = 8000):
    """Запускает API сервер"""
    logger.info(f"Starting API server on {host}:{port}")
    logger.info(f"API endpoints will be available at: http://{host}:{port}/api/offer-confirmation")
    uvicorn.run(
        app, 
        host=host, 
        port=port, 
        log_level="info",
        access_log=True,
        log_config=None  # Use default uvicorn logging
    )


if __name__ == "__main__":
    # Для запуска отдельно: python api_server.py
    run_api_server()
