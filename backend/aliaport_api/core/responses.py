"""
Aliaport v3.1 - Standardized API Response Models
Tüm API endpoint'lerde tutarlı response formatı için Pydantic modelleri
"""

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field


T = TypeVar('T')


class StandardResponse(BaseModel, Generic[T]):
    """
    Standardize edilmiş başarılı API response
    
    Kullanım:
        return StandardResponse(
            success=True,
            data=cari_obj,
            message="Cari başarıyla oluşturuldu"
        )
    """
    success: bool = Field(default=True, description="İşlem başarılı mı?")
    data: Optional[T] = Field(default=None, description="Response verisi")
    message: str = Field(default="İşlem başarılı", description="Kullanıcı mesajı")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response zamanı")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"id": 1, "code": "CARI001", "title": "Test Cari"},
                "message": "Cari başarıyla oluşturuldu",
                "timestamp": "2025-11-23T10:30:00.000Z"
            }
        }


class ErrorDetail(BaseModel):
    """Hata detayları"""
    code: str = Field(..., description="Hata kodu (örn: CARI_NOT_FOUND)")
    message: str = Field(..., description="Kullanıcı dostu hata mesajı")
    details: Optional[dict] = Field(default=None, description="Ek hata detayları")
    field: Optional[str] = Field(default=None, description="Hatalı alan (validation için)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "CARI_NOT_FOUND",
                "message": "Belirtilen cari bulunamadı",
                "details": {"cari_code": "CARI001"},
                "field": None
            }
        }


class ErrorResponse(BaseModel):
    """
    Standardize edilmiş hata response
    
    Kullanım:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                success=False,
                error=ErrorDetail(
                    code="CARI_NOT_FOUND",
                    message="Cari bulunamadı",
                    details={"cari_code": cari_code}
                )
            ).model_dump()
        )
    """
    success: bool = Field(default=False, description="İşlem başarısız")
    error: ErrorDetail = Field(..., description="Hata detayları")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response zamanı")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Girilen veriler geçersiz",
                    "details": {"email": "Geçerli bir email adresi giriniz"},
                    "field": "email"
                },
                "timestamp": "2025-11-23T10:30:00.000Z"
            }
        }


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = Field(..., ge=1, description="Şu anki sayfa")
    page_size: int = Field(..., ge=1, le=1000, description="Sayfa başına kayıt")
    total: int = Field(..., ge=0, description="Toplam kayıt sayısı")
    total_pages: int = Field(..., ge=0, description="Toplam sayfa sayısı")
    has_next: bool = Field(..., description="Sonraki sayfa var mı?")
    has_prev: bool = Field(..., description="Önceki sayfa var mı?")
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 20,
                "total": 150,
                "total_pages": 8,
                "has_next": True,
                "has_prev": False
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Sayfalanmış liste response'ları için
    
    Kullanım:
        return PaginatedResponse(
            success=True,
            data=cari_list,
            message="Cariler listelendi",
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total=total_count,
                total_pages=math.ceil(total_count / page_size),
                has_next=page < math.ceil(total_count / page_size),
                has_prev=page > 1
            )
        )
    """
    success: bool = Field(default=True, description="İşlem başarılı mı?")
    data: List[T] = Field(..., description="Veri listesi")
    message: str = Field(default="Liste başarıyla getirildi", description="Kullanıcı mesajı")
    pagination: PaginationMeta = Field(..., description="Pagination bilgileri")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response zamanı")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [
                    {"id": 1, "code": "CARI001", "title": "Test Cari 1"},
                    {"id": 2, "code": "CARI002", "title": "Test Cari 2"}
                ],
                "message": "Cariler başarıyla listelendi",
                "pagination": {
                    "page": 1,
                    "page_size": 20,
                    "total": 150,
                    "total_pages": 8,
                    "has_next": True,
                    "has_prev": False
                },
                "timestamp": "2025-11-23T10:30:00.000Z"
            }
        }


# ============================================
# HELPER FUNCTIONS
# ============================================

def success_response(
    data: Any = None,
    message: str = "İşlem başarılı",
    status_code: int = 200
) -> dict:
    """
    Başarılı response oluştur (dict olarak)
    
    Args:
        data: Response verisi
        message: Kullanıcı mesajı
        status_code: HTTP status code (kullanılmıyor, ileride için)
    
    Returns:
        StandardResponse dict
    """
    response = StandardResponse(
        success=True,
        data=data,
        message=message
    )
    # Datetime'ı ISO format string'e çevir
    result = response.model_dump()
    result['timestamp'] = result['timestamp'].isoformat() if isinstance(result.get('timestamp'), datetime) else result.get('timestamp')
    return result


def error_response(
    code: str,
    message: str,
    details: Optional[dict] = None,
    field: Optional[str] = None
) -> dict:
    """
    Hata response oluştur (dict olarak)
    
    Args:
        code: Hata kodu (ErrorCode enum kullan)
        message: Kullanıcı dostu mesaj
        details: Ek detaylar
        field: Hatalı alan adı
    
    Returns:
        ErrorResponse dict
    """
    response = ErrorResponse(
        success=False,
        error=ErrorDetail(
            code=code,
            message=message,
            details=details,
            field=field
        )
    )
    # Datetime'ı ISO format string'e çevir
    result = response.model_dump()
    result['timestamp'] = result['timestamp'].isoformat() if isinstance(result.get('timestamp'), datetime) else result.get('timestamp')
    return result


def paginated_response(
    data: List[Any],
    page: int,
    page_size: int,
    total: int,
    message: str = "Liste başarıyla getirildi"
) -> dict:
    """
    Sayfalanmış response oluştur (dict olarak)
    
    Args:
        data: Veri listesi
        page: Şu anki sayfa (1-indexed)
        page_size: Sayfa başına kayıt
        total: Toplam kayıt sayısı
        message: Kullanıcı mesajı
    
    Returns:
        PaginatedResponse dict
    """
    import math
    
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    
    response = PaginatedResponse(
        success=True,
        data=data,
        message=message,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
    )
    # Datetime'ı ISO format string'e çevir
    result = response.model_dump()
    result['timestamp'] = result['timestamp'].isoformat() if isinstance(result.get('timestamp'), datetime) else result.get('timestamp')
    return result


# ============================================
# LEGACY SUPPORT (Eski format için)
# ============================================

def legacy_paginated_response(
    items: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 20
) -> dict:
    """
    Eski paginated response formatı (backward compatibility)
    
    Eski Format:
        {
            "items": [...],
            "total": 150,
            "page": 1,
            "page_size": 20
        }
    
    Yeni formata geçiş için kullan, sonra kaldırılacak.
    """
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
