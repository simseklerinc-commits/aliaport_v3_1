"""
Aliaport v3.1 - Error Code Definitions
Tüm API hata kodları merkezi enum olarak tanımlı
"""

from enum import Enum


class ErrorCode(str, Enum):
    """
    API hata kodları
    
    Naming Convention:
        {MODUL}_{HATA_TIPI}
        
    Örnek:
        CARI_NOT_FOUND
        CARI_DUPLICATE_CODE
        CARI_INVALID_EMAIL
    """
    
    # ============================================
    # GENEL HATALAR
    # ============================================
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # ============================================
    # DATABASE HATALARI
    # ============================================
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR"
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY"
    FOREIGN_KEY_CONSTRAINT = "FOREIGN_KEY_CONSTRAINT"
    
    # ============================================
    # CARİ MODÜLÜ
    # ============================================
    CARI_NOT_FOUND = "CARI_NOT_FOUND"
    CARI_DUPLICATE_CODE = "CARI_DUPLICATE_CODE"
    CARI_INVALID_EMAIL = "CARI_INVALID_EMAIL"
    CARI_INVALID_PHONE = "CARI_INVALID_PHONE"
    CARI_INVALID_TAX_NUMBER = "CARI_INVALID_TAX_NUMBER"
    CARI_DELETE_HAS_RELATIONS = "CARI_DELETE_HAS_RELATIONS"
    CARI_INACTIVE = "CARI_INACTIVE"
    
    # ============================================
    # MOTORBOT MODÜLÜ
    # ============================================
    MOTORBOT_NOT_FOUND = "MOTORBOT_NOT_FOUND"
    MOTORBOT_DUPLICATE_CODE = "MOTORBOT_DUPLICATE_CODE"
    MOTORBOT_INVALID_LENGTH = "MOTORBOT_INVALID_LENGTH"
    MOTORBOT_INVALID_CAPACITY = "MOTORBOT_INVALID_CAPACITY"
    MOTORBOT_UNAVAILABLE = "MOTORBOT_UNAVAILABLE"
    MOTORBOT_IN_USE = "MOTORBOT_IN_USE"
    
    # ============================================
    # SEFER MODÜLÜ
    # ============================================
    SEFER_NOT_FOUND = "SEFER_NOT_FOUND"
    SEFER_DUPLICATE = "SEFER_DUPLICATE"
    SEFER_INVALID_DATE = "SEFER_INVALID_DATE"
    SEFER_ALREADY_COMPLETED = "SEFER_ALREADY_COMPLETED"
    SEFER_CANNOT_DELETE = "SEFER_CANNOT_DELETE"
    
    # ============================================
    # HİZMET MODÜLÜ
    # ============================================
    HIZMET_NOT_FOUND = "HIZMET_NOT_FOUND"
    HIZMET_DUPLICATE_CODE = "HIZMET_DUPLICATE_CODE"
    HIZMET_INVALID_PRICE = "HIZMET_INVALID_PRICE"
    HIZMET_INACTIVE = "HIZMET_INACTIVE"
    
    # ============================================
    # TARİFE MODÜLÜ
    # ============================================
    TARIFE_NOT_FOUND = "TARIFE_NOT_FOUND"
    TARIFE_DUPLICATE = "TARIFE_DUPLICATE"
    TARIFE_INVALID_DATES = "TARIFE_INVALID_DATES"
    TARIFE_OVERLAPPING_PERIOD = "TARIFE_OVERLAPPING_PERIOD"
    TARIFE_INACTIVE = "TARIFE_INACTIVE"
    TARIFE_ITEM_NOT_FOUND = "TARIFE_ITEM_NOT_FOUND"
    
    # ============================================
    # BARINMA MODÜLÜ
    # ============================================
    BARINMA_NOT_FOUND = "BARINMA_NOT_FOUND"
    BARINMA_DUPLICATE_CONTRACT = "BARINMA_DUPLICATE_CONTRACT"
    BARINMA_INVALID_DATES = "BARINMA_INVALID_DATES"
    BARINMA_CAPACITY_EXCEEDED = "BARINMA_CAPACITY_EXCEEDED"
    
    # ============================================
    # KURLAR MODÜLÜ
    # ============================================
    KUR_NOT_FOUND = "KUR_NOT_FOUND"
    KUR_FETCH_ERROR = "KUR_FETCH_ERROR"
    KUR_INVALID_DATE = "KUR_INVALID_DATE"
    KUR_RATE_NOT_AVAILABLE = "KUR_RATE_NOT_AVAILABLE"
    
    # ============================================
    # PARAMETRE MODÜLÜ
    # ============================================
    PARAMETRE_NOT_FOUND = "PARAMETRE_NOT_FOUND"
    PARAMETRE_DUPLICATE_CODE = "PARAMETRE_DUPLICATE_CODE"
    PARAMETRE_INVALID_CATEGORY = "PARAMETRE_INVALID_CATEGORY"
    PARAMETRE_REQUIRED = "PARAMETRE_REQUIRED"
    
    # ============================================
    # İŞ EMRİ MODÜLÜ
    # ============================================
    WO_NOT_FOUND = "WO_NOT_FOUND"
    WO_DUPLICATE_NUMBER = "WO_DUPLICATE_NUMBER"
    WO_INVALID_STATUS_TRANSITION = "WO_INVALID_STATUS_TRANSITION"
    WO_MISSING_REQUIRED_FIELD = "WO_MISSING_REQUIRED_FIELD"
    WO_CANNOT_DELETE = "WO_CANNOT_DELETE"
    WO_ALREADY_INVOICED = "WO_ALREADY_INVOICED"
    WO_ITEM_NOT_FOUND = "WO_ITEM_NOT_FOUND"
    
    # ============================================
    # WORKLOG MODÜLÜ
    # ============================================
    WORKLOG_NOT_FOUND = "WORKLOG_NOT_FOUND"
    WORKLOG_INVALID_HOURS = "WORKLOG_INVALID_HOURS"
    WORKLOG_WO_COMPLETED = "WORKLOG_WO_COMPLETED"
    WORKLOG_DUPLICATE_ENTRY = "WORKLOG_DUPLICATE_ENTRY"
    
    # ============================================
    # GÜVENLİK MODÜLÜ (GateLog)
    # ============================================
    GATELOG_NOT_FOUND = "GATELOG_NOT_FOUND"
    GATELOG_ALREADY_EXITED = "GATELOG_ALREADY_EXITED"
    GATELOG_MISSING_CHECKLIST = "GATELOG_MISSING_CHECKLIST"
    GATELOG_INVALID_PIN = "GATELOG_INVALID_PIN"
    
    # ============================================
    # DİJİTAL ARŞİV MODÜLÜ
    # ============================================
    ARCHIVE_NOT_FOUND = "ARCHIVE_NOT_FOUND"
    ARCHIVE_FILE_TOO_LARGE = "ARCHIVE_FILE_TOO_LARGE"
    ARCHIVE_INVALID_FILE_TYPE = "ARCHIVE_INVALID_FILE_TYPE"
    ARCHIVE_UPLOAD_ERROR = "ARCHIVE_UPLOAD_ERROR"
    
    # ============================================
    # RAPOR MODÜLÜ
    # ============================================
    REPORT_NOT_FOUND = "REPORT_NOT_FOUND"
    REPORT_GENERATION_ERROR = "REPORT_GENERATION_ERROR"
    REPORT_INVALID_PARAMETERS = "REPORT_INVALID_PARAMETERS"
    
    # ============================================
    # AUTH MODÜLÜ (İleride eklenecek)
    # ============================================
    AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID"
    AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND"
    AUTH_USER_INACTIVE = "AUTH_USER_INACTIVE"
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS"
    AUTH_PASSWORD_RESET_TOKEN_INVALID = "AUTH_PASSWORD_RESET_TOKEN_INVALID"
    AUTH_PASSWORD_RESET_TOKEN_EXPIRED = "AUTH_PASSWORD_RESET_TOKEN_EXPIRED"
    AUTH_PASSWORD_RESET_TOKEN_USED = "AUTH_PASSWORD_RESET_TOKEN_USED"
    AUTH_EMAIL_NOT_FOUND = "AUTH_EMAIL_NOT_FOUND"
    
    # ============================================
    # EXTERNAL API HATALARI
    # ============================================
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    EVDS_API_ERROR = "EVDS_API_ERROR"
    EMAIL_SEND_ERROR = "EMAIL_SEND_ERROR"
    SMS_SEND_ERROR = "SMS_SEND_ERROR"


# ============================================
# ERROR CODE → HTTP STATUS CODE MAPPING
# ============================================

ERROR_CODE_TO_HTTP_STATUS = {
    # 400 Bad Request
    ErrorCode.VALIDATION_ERROR: 400,
    ErrorCode.INVALID_INPUT: 400,
    ErrorCode.CARI_INVALID_EMAIL: 400,
    ErrorCode.CARI_INVALID_PHONE: 400,
    ErrorCode.MOTORBOT_INVALID_LENGTH: 400,
    ErrorCode.SEFER_INVALID_DATE: 400,
    ErrorCode.TARIFE_INVALID_DATES: 400,
    ErrorCode.KUR_INVALID_DATE: 400,
    ErrorCode.WORKLOG_INVALID_HOURS: 400,
    
    # 401 Unauthorized
    ErrorCode.UNAUTHORIZED: 401,
    ErrorCode.AUTH_INVALID_CREDENTIALS: 401,
    ErrorCode.AUTH_TOKEN_EXPIRED: 401,
    ErrorCode.AUTH_TOKEN_INVALID: 401,
    ErrorCode.AUTH_PASSWORD_RESET_TOKEN_INVALID: 401,
    ErrorCode.AUTH_PASSWORD_RESET_TOKEN_EXPIRED: 401,
    ErrorCode.AUTH_PASSWORD_RESET_TOKEN_USED: 401,
    
    # 403 Forbidden
    ErrorCode.FORBIDDEN: 403,
    ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS: 403,
    ErrorCode.AUTH_USER_INACTIVE: 403,
    
    # 404 Not Found
    ErrorCode.NOT_FOUND: 404,
    ErrorCode.CARI_NOT_FOUND: 404,
    ErrorCode.MOTORBOT_NOT_FOUND: 404,
    ErrorCode.SEFER_NOT_FOUND: 404,
    ErrorCode.HIZMET_NOT_FOUND: 404,
    ErrorCode.TARIFE_NOT_FOUND: 404,
    ErrorCode.TARIFE_ITEM_NOT_FOUND: 404,
    ErrorCode.BARINMA_NOT_FOUND: 404,
    ErrorCode.KUR_NOT_FOUND: 404,
    ErrorCode.PARAMETRE_NOT_FOUND: 404,
    ErrorCode.WO_NOT_FOUND: 404,
    ErrorCode.WO_ITEM_NOT_FOUND: 404,
    ErrorCode.WORKLOG_NOT_FOUND: 404,
    ErrorCode.GATELOG_NOT_FOUND: 404,
    ErrorCode.ARCHIVE_NOT_FOUND: 404,
    ErrorCode.REPORT_NOT_FOUND: 404,
    ErrorCode.AUTH_EMAIL_NOT_FOUND: 404,
    
    # 405 Method Not Allowed
    ErrorCode.METHOD_NOT_ALLOWED: 405,
    
    # 409 Conflict
    ErrorCode.CONFLICT: 409,
    ErrorCode.DUPLICATE_ENTRY: 409,
    ErrorCode.CARI_DUPLICATE_CODE: 409,
    ErrorCode.MOTORBOT_DUPLICATE_CODE: 409,
    ErrorCode.HIZMET_DUPLICATE_CODE: 409,
    ErrorCode.TARIFE_DUPLICATE: 409,
    # Parametre duplicate kodu (eksik mapping)
    ErrorCode.PARAMETRE_DUPLICATE_CODE: 409,
    ErrorCode.TARIFE_OVERLAPPING_PERIOD: 409,
    ErrorCode.WO_DUPLICATE_NUMBER: 409,
    ErrorCode.MOTORBOT_IN_USE: 409,
    ErrorCode.SEFER_ALREADY_COMPLETED: 409,
    
    # 422 Unprocessable Entity
    # Cari silme ilişkili kayıt çatışması: semantic olarak 409 (Conflict)
    ErrorCode.CARI_DELETE_HAS_RELATIONS: 409,
    ErrorCode.WO_INVALID_STATUS_TRANSITION: 422,
    ErrorCode.WORKLOG_WO_COMPLETED: 422,
    ErrorCode.GATELOG_ALREADY_EXITED: 422,

    # 429 Too Many Requests
    ErrorCode.RATE_LIMIT_EXCEEDED: 429,
    
    # 500 Internal Server Error
    ErrorCode.INTERNAL_SERVER_ERROR: 500,
    ErrorCode.DATABASE_ERROR: 500,
    ErrorCode.EXTERNAL_API_ERROR: 500,
    ErrorCode.REPORT_GENERATION_ERROR: 500,
    
    # 503 Service Unavailable
    ErrorCode.DATABASE_CONNECTION_ERROR: 503,
    ErrorCode.KUR_FETCH_ERROR: 503,
}


def get_http_status_for_error(error_code: ErrorCode) -> int:
    """
    Error code için HTTP status code al
    
    Args:
        error_code: ErrorCode enum
    
    Returns:
        HTTP status code (default: 500)
    """
    return ERROR_CODE_TO_HTTP_STATUS.get(error_code, 500)


# ============================================
# TÜRKÇE HATA MESAJLARI (Default)
# ============================================

DEFAULT_ERROR_MESSAGES = {
    # Genel
    ErrorCode.INTERNAL_SERVER_ERROR: "Sunucu hatası oluştu",
    ErrorCode.VALIDATION_ERROR: "Girilen veriler geçersiz",
    ErrorCode.INVALID_INPUT: "Geçersiz giriş",
    ErrorCode.UNAUTHORIZED: "Yetkilendirme gerekli",
    ErrorCode.FORBIDDEN: "Bu işlem için yetkiniz yok",
    ErrorCode.NOT_FOUND: "Kayıt bulunamadı",
    ErrorCode.RATE_LIMIT_EXCEEDED: "İstek sınırı aşıldı",
    
    # Cari
    ErrorCode.CARI_NOT_FOUND: "Cari bulunamadı",
    ErrorCode.CARI_DUPLICATE_CODE: "Bu cari kodu zaten kullanılıyor",
    ErrorCode.CARI_INVALID_EMAIL: "Geçersiz email adresi",
    ErrorCode.CARI_DELETE_HAS_RELATIONS: "Bu cari silinemez, ilişkili kayıtlar var",
    
    # Motorbot
    ErrorCode.MOTORBOT_NOT_FOUND: "Motorbot bulunamadı",
    ErrorCode.MOTORBOT_DUPLICATE_CODE: "Bu motorbot kodu zaten kullanılıyor",
    ErrorCode.TARIFE_DUPLICATE: "Bu tarife kodu zaten kullanılıyor",
    ErrorCode.TARIFE_NOT_FOUND: "Tarife bulunamadı",
    ErrorCode.TARIFE_ITEM_NOT_FOUND: "Tarife kalemi bulunamadı",
    ErrorCode.MOTORBOT_IN_USE: "Motorbot şu anda kullanımda",
    
    # İş Emri
    ErrorCode.WO_NOT_FOUND: "İş emri bulunamadı",
    ErrorCode.WO_INVALID_STATUS_TRANSITION: "Geçersiz durum geçişi",
    ErrorCode.WO_ALREADY_INVOICED: "Bu iş emri zaten faturalandırılmış",
    
    # ... diğerleri için de eklenebilir
}


def get_default_message(error_code: ErrorCode) -> str:
    """
    Error code için default Türkçe mesaj al
    
    Args:
        error_code: ErrorCode enum
    
    Returns:
        Default mesaj (yoksa error code'un kendisi)
    """
    return DEFAULT_ERROR_MESSAGES.get(error_code, error_code.value)
