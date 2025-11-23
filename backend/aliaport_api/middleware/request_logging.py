"""
Request Logging Middleware
Logs all API requests with timing and request ID
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
import uuid
from typing import Callable
from ..core.logging_config import get_logger, log_api_request

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests with timing and request ID
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log details
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Add request ID to request state (diğer middleware'lar için erişilebilir)
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as exc:
            # Log exception
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "extra_data": {
                        "type": "request_error",
                        "method": request.method,
                        "path": str(request.url.path),
                        "duration_ms": round(duration_ms, 2),
                        "error": str(exc)
                    }
                },
                exc_info=exc
            )
            raise
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Log request
        log_api_request(
            logger=logger,
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id,
            extra_data={
                "query_params": dict(request.query_params) if request.query_params else None,
                "client_host": request.client.host if request.client else None,
            }
        )
        
        return response
