"""
Global Error Handler Middleware
Catches all unhandled exceptions and returns standardized error responses
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError
import os
from typing import Union

from ..core.responses import error_response
from ..core.error_codes import ErrorCode, get_http_status_for_error
from ..core.logging_config import get_logger, log_error

logger = get_logger(__name__)

# Production mod kontrolü
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler - tüm yakalanmamış hataları yakalar
    
    Args:
        request: FastAPI request
        exc: Exception instance
    
    Returns:
        JSONResponse with standardized error format
    """
    
    # Request ID'yi al (middleware tarafından eklenir)
    request_id = getattr(request.state, "request_id", None)
    
    # ============================================
    # HTTP Exceptions (FastAPI/Starlette)
    # ============================================
    if isinstance(exc, StarletteHTTPException):
        # HTTPException içinde zaten error_response formatı varsa kullan
        if isinstance(exc.detail, dict) and "error" in exc.detail:
            return JSONResponse(
                status_code=exc.status_code,
                content=exc.detail
            )
        
        # Basit string detail ise standart formata çevir
        error_code = _http_status_to_error_code(exc.status_code)
        
        log_error(
            logger=logger,
            error_code=error_code.value,
            message=str(exc.detail),
            context={
                "request_id": request_id,
                "path": str(request.url.path),
                "method": request.method,
                "status_code": exc.status_code
            }
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                code=error_code.value,
                message=str(exc.detail) if not IS_PRODUCTION else "An error occurred",
                details={"request_id": request_id} if request_id else None
            )
        )
    
    # ============================================
    # Validation Errors (Pydantic)
    # ============================================
    if isinstance(exc, RequestValidationError):
        log_error(
            logger=logger,
            error_code=ErrorCode.VALIDATION_ERROR.value,
            message="Request validation failed",
            context={
                "request_id": request_id,
                "path": str(request.url.path),
                "errors": exc.errors()
            }
        )
        
        # Production'da detayları gizle
        validation_details = None if IS_PRODUCTION else {
            "validation_errors": exc.errors(),
            "body": exc.body
        }
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response(
                code=ErrorCode.VALIDATION_ERROR.value,
                message="Validation error" if IS_PRODUCTION else "Request validation failed",
                details=validation_details
            )
        )
    
    # ============================================
    # Database Errors (SQLAlchemy)
    # ============================================
    if isinstance(exc, IntegrityError):
        log_error(
            logger=logger,
            error_code=ErrorCode.DUPLICATE_ENTRY.value,
            message="Database integrity error",
            exception=exc,
            context={
                "request_id": request_id,
                "path": str(request.url.path)
            }
        )
        
        # Production'da SQL detaylarını gizle
        error_msg = "Duplicate entry or integrity constraint violation"
        if not IS_PRODUCTION:
            error_msg = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=error_response(
                code=ErrorCode.DUPLICATE_ENTRY.value,
                message=error_msg,
                details={"request_id": request_id} if request_id else None
            )
        )
    
    if isinstance(exc, OperationalError):
        log_error(
            logger=logger,
            error_code=ErrorCode.DATABASE_CONNECTION_ERROR.value,
            message="Database operational error",
            exception=exc,
            context={
                "request_id": request_id,
                "path": str(request.url.path)
            }
        )
        
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_response(
                code=ErrorCode.DATABASE_CONNECTION_ERROR.value,
                message="Database connection error" if IS_PRODUCTION else str(exc),
                details={"request_id": request_id} if request_id else None
            )
        )
    
    # ============================================
    # Generic Unhandled Exceptions
    # ============================================
    log_error(
        logger=logger,
        error_code=ErrorCode.INTERNAL_SERVER_ERROR.value,
        message="Unhandled exception",
        exception=exc,
        context={
            "request_id": request_id,
            "path": str(request.url.path),
            "method": request.method,
            "exception_type": type(exc).__name__
        }
    )
    
    # Production'da detayları gizle
    error_details = None
    if not IS_PRODUCTION:
        error_details = {
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "request_id": request_id
        }
    elif request_id:
        error_details = {"request_id": request_id}
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            code=ErrorCode.INTERNAL_SERVER_ERROR.value,
            message="Internal server error" if IS_PRODUCTION else str(exc),
            details=error_details
        )
    )


def _http_status_to_error_code(status_code: int) -> ErrorCode:
    """
    HTTP status code'u ErrorCode'a çevir
    
    Args:
        status_code: HTTP status code
    
    Returns:
        ErrorCode enum
    """
    mapping = {
        400: ErrorCode.INVALID_INPUT,
        401: ErrorCode.UNAUTHORIZED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        405: ErrorCode.METHOD_NOT_ALLOWED,
        409: ErrorCode.CONFLICT,
        422: ErrorCode.VALIDATION_ERROR,
        500: ErrorCode.INTERNAL_SERVER_ERROR,
        503: ErrorCode.DATABASE_CONNECTION_ERROR,
    }
    return mapping.get(status_code, ErrorCode.INTERNAL_SERVER_ERROR)
