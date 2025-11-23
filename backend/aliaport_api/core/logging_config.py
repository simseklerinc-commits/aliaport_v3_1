"""
Aliaport v3.1 - Logging Configuration
Structured JSON logging with rotation and filtering
"""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime
import json
from typing import Any, Dict
from aliaport_api.modules.audit.utils import persist_business_event  # DB persistence for audit


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON
        """
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Request ID (context'ten alınacak - middleware ile eklenir)
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # User ID (auth implementasyonu sonrası)
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        # Exception bilgisi varsa ekle
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Extra fields
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data
        
        return json.dumps(log_data, ensure_ascii=False)


class ColoredConsoleFormatter(logging.Formatter):
    """
    Colored console output for development
    """
    
    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",      # Cyan
        "INFO": "\033[32m",       # Green
        "WARNING": "\033[33m",    # Yellow
        "ERROR": "\033[31m",      # Red
        "CRITICAL": "\033[35m",   # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format with colors for console
        """
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logging(
    log_dir: Path = Path("logs"),
    log_level: str = "INFO",
    enable_console: bool = True,
    enable_json: bool = True
) -> None:
    """
    Setup logging configuration
    
    Args:
        log_dir: Log files directory
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        enable_console: Enable console output
        enable_json: Enable JSON file output
    """
    
    # Log dizinini oluştur
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # ============================================
    # CONSOLE HANDLER (Development)
    # ============================================
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        
        # Colored formatter for development
        console_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s"
        console_formatter = ColoredConsoleFormatter(
            console_format,
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(console_formatter)
        root_logger.addHandler(console_handler)
    
    # ============================================
    # FILE HANDLERS
    # ============================================
    
    # 1. General Application Log (JSON, Daily Rotation)
    if enable_json:
        app_log_file = log_dir / "app.log"
        app_handler = TimedRotatingFileHandler(
            filename=app_log_file,
            when="midnight",
            interval=1,
            backupCount=30,  # 30 gün saklama
            encoding="utf-8"
        )
        app_handler.setLevel(logging.INFO)
        app_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(app_handler)
    
    # 2. API Request Log (JSON, Daily Rotation)
    api_log_file = log_dir / "api.log"
    api_handler = TimedRotatingFileHandler(
        filename=api_log_file,
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    api_handler.setLevel(logging.INFO)
    api_handler.setFormatter(JSONFormatter())
    
    # Sadece API logger'ından gelenleri yaz
    api_logger = logging.getLogger("aliaport_api")
    api_logger.addHandler(api_handler)
    api_logger.propagate = True  # Root logger'a da gönder
    
    # 3. Error Log (Only ERROR and CRITICAL, Size-based Rotation)
    error_log_file = log_dir / "error.log"
    error_handler = RotatingFileHandler(
        filename=error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10,
        encoding="utf-8"
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(error_handler)
    
    # 4. Audit Log (Critical business operations)
    audit_log_file = log_dir / "audit.log"
    audit_handler = TimedRotatingFileHandler(
        filename=audit_log_file,
        when="midnight",
        interval=1,
        backupCount=90,  # 90 gün saklama (önemli işlemler)
        encoding="utf-8"
    )
    audit_handler.setLevel(logging.INFO)
    audit_handler.setFormatter(JSONFormatter())
    
    # Audit logger (ayrı namespace)
    audit_logger = logging.getLogger("audit")
    audit_logger.addHandler(audit_handler)
    audit_logger.propagate = False  # Root'a gönderme
    
    # ============================================
    # Suppress noisy third-party loggers
    # ============================================
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Initial log
    root_logger.info(f"Logging initialized: level={log_level}, dir={log_dir}")


def get_logger(name: str) -> logging.Logger:
    """
    Get logger instance
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def get_audit_logger() -> logging.Logger:
    """
    Get audit logger for critical business operations
    
    Returns:
        Audit logger instance
    """
    return logging.getLogger("audit")


# ============================================
# Helper functions for structured logging
# ============================================

def log_api_request(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    request_id: str = None,
    user_id: int = None,
    extra_data: Dict[str, Any] = None
) -> None:
    """
    Log API request in structured format
    
    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        request_id: Unique request ID
        user_id: User ID (if authenticated)
        extra_data: Additional data to log
    """
    log_data = {
        "type": "api_request",
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
    }
    
    if extra_data:
        log_data.update(extra_data)
    
    message = f"{method} {path} - {status_code} ({duration_ms:.2f}ms)"
    
    # Extra fields için custom LogRecord attribute
    extra = {"extra_data": log_data}
    if request_id:
        extra["request_id"] = request_id
    if user_id:
        extra["user_id"] = user_id
    
    logger.info(message, extra=extra)


def log_business_event(
    event_type: str,
    description: str,
    user_id: int = None,
    entity_type: str = None,
    entity_id: int = None,
    details: Dict[str, Any] = None
) -> None:
    """
    Log critical business event to audit log
    
    Args:
        event_type: Event type (e.g., "WO_APPROVED", "INVOICE_CREATED")
        description: Human-readable description
        user_id: User who performed action
        entity_type: Entity type (e.g., "WorkOrder", "Cari")
        entity_id: Entity ID
        details: Additional details
    """
    audit_logger = get_audit_logger()
    
    log_data = {
        "type": "business_event",
        "event_type": event_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
    }
    
    if details:
        log_data["details"] = details
    
    extra = {"extra_data": log_data}
    if user_id:
        extra["user_id"] = user_id
    
    audit_logger.info(description, extra=extra)
    # Persist to database audit table (safe-fail)
    try:
        persist_business_event(
            event_type=event_type,
            description=description,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
    except Exception:
        pass


def log_error(
    logger: logging.Logger,
    error_code: str,
    message: str,
    exception: Exception = None,
    context: Dict[str, Any] = None
) -> None:
    """
    Log error with structured context
    
    Args:
        logger: Logger instance
        error_code: Error code from ErrorCode enum
        message: Error message
        exception: Exception instance (if available)
        context: Additional context
    """
    log_data = {
        "type": "error",
        "error_code": error_code,
    }
    
    if context:
        log_data["context"] = context
    
    extra = {"extra_data": log_data}
    
    if exception:
        logger.error(message, exc_info=exception, extra=extra)
    else:
        logger.error(message, extra=extra)
