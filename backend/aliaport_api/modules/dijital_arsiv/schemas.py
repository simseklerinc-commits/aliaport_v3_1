"""
DİJİTAL ARŞİV MODÜLÜ - Pydantic Schemas
Request/Response validation için schema'lar
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from .models import DocumentCategory, DocumentType, DocumentStatus, WorkOrderApprovalStatus


# ============================================
# PORTAL USER SCHEMAS
# ============================================

class PortalUserBase(BaseModel):
    """Portal kullanıcı base schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    is_admin: bool = False
    is_active: bool = True


class PortalUserCreate(PortalUserBase):
    """Portal kullanıcı oluşturma"""
    cari_id: int
    password: str = Field(..., min_length=8, max_length=50)
    
    @validator('password')
    def password_strength(cls, v):
        """Şifre güvenlik kontrolü"""
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalıdır')
        if not any(char.isdigit() for char in v):
            raise ValueError('Şifre en az bir rakam içermelidir')
        if not any(char.isupper() for char in v):
            raise ValueError('Şifre en az bir büyük harf içermelidir')
        return v


class PortalUserUpdate(BaseModel):
    """Portal kullanıcı güncelleme"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


class PortalUserResponse(PortalUserBase):
    """Portal kullanıcı response"""
    id: int
    cari_id: int
    cari_code: Optional[str] = None
    cari_title: Optional[str] = None
    must_change_password: bool
    last_login_at: Optional[datetime] = None
    login_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PortalUserDetailResponse(PortalUserResponse):
    """Portal kullanıcı detaylı response"""
    password_changed_at: Optional[datetime] = None
    created_by_name: Optional[str] = None


class PortalUserLogin(BaseModel):
    """Portal kullanıcı login"""
    email: EmailStr
    password: str


class PortalUserPasswordChange(BaseModel):
    """Portal kullanıcı şifre değiştirme"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=50)
    
    @validator('new_password')
    def password_strength(cls, v):
        """Şifre güvenlik kontrolü"""
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalıdır')
        if not any(char.isdigit() for char in v):
            raise ValueError('Şifre en az bir rakam içermelidir')
        if not any(char.isupper() for char in v):
            raise ValueError('Şifre en az bir büyük harf içermelidir')
        return v


class PortalUserForgotPassword(BaseModel):
    """Portal kullanıcı şifre unutma"""
    email: EmailStr


class PortalUserResetPassword(BaseModel):
    """Portal kullanıcı şifre sıfırlama"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=50)


# ============================================
# ARCHIVE DOCUMENT SCHEMAS
# ============================================

class ArchiveDocumentBase(BaseModel):
    """Arşiv belge base schema"""
    category: DocumentCategory
    document_type: DocumentType
    description: Optional[str] = None
    tags: Optional[str] = None
    issue_date: Optional[datetime] = None


class ArchiveDocumentCreate(ArchiveDocumentBase):
    """Arşiv belge oluşturma (file upload ile beraber)"""
    work_order_id: Optional[int] = None
    cari_id: Optional[int] = None
    
    @validator('work_order_id', 'cari_id')
    def at_least_one_relation(cls, v, values):
        """En az bir ilişki olmalı"""
        if not v and not values.get('work_order_id') and not values.get('cari_id'):
            raise ValueError('work_order_id veya cari_id gereklidir')
        return v


class ArchiveDocumentUpdate(BaseModel):
    """Arşiv belge güncelleme"""
    description: Optional[str] = None
    tags: Optional[str] = None
    issue_date: Optional[datetime] = None


class ArchiveDocumentApprove(BaseModel):
    """Belge onaylama"""
    approval_note: Optional[str] = Field(None, max_length=500)


class ArchiveDocumentReject(BaseModel):
    """Belge reddetme"""
    rejection_reason: str = Field(..., min_length=10, max_length=500)


class ArchiveDocumentResponse(ArchiveDocumentBase):
    """Arşiv belge response"""
    id: int
    work_order_id: Optional[int] = None
    work_order_no: Optional[str] = None
    cari_id: Optional[int] = None
    cari_code: Optional[str] = None
    cari_title: Optional[str] = None
    
    file_name: str
    file_size: int
    file_size_mb: float
    file_type: str
    
    version: int
    is_latest_version: bool
    status: DocumentStatus
    
    uploaded_by_name: Optional[str] = None
    uploaded_by_portal_user_name: Optional[str] = None
    uploaded_at: datetime
    
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    approval_note: Optional[str] = None
    
    rejected_by_name: Optional[str] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    expires_at: Optional[datetime] = None
    is_expired: bool
    days_until_expiry: Optional[int] = None
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class ArchiveDocumentDetailResponse(ArchiveDocumentResponse):
    """Arşiv belge detaylı response"""
    file_path: str
    file_hash: str
    previous_version_id: Optional[int] = None
    expiry_notification_sent: bool


class ArchiveDocumentVersionHistory(BaseModel):
    """Belge versiyon geçmişi"""
    id: int
    version: int
    status: DocumentStatus
    file_name: str
    file_size_mb: float
    uploaded_by_name: Optional[str] = None
    uploaded_at: datetime
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    class Config:
        from_attributes = True


class ArchiveDocumentListResponse(BaseModel):
    """Arşiv belge liste response"""
    total: int
    items: List[ArchiveDocumentResponse]


class ArchiveDashboardStats(BaseModel):
    """Dashboard istatistikleri"""
    total_documents: int
    pending_approval: int
    approved: int
    rejected: int
    expired: int
    expiring_soon_30_days: int
    by_category: dict
    recent_uploads_7_days: int
    recent_approvals_7_days: int


# ============================================
# WORK ORDER SCHEMAS (Extensions)
# ============================================

class WorkOrderStartRequest(BaseModel):
    """İş emri başlatma"""
    estimated_completion: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class WorkOrderCompleteRequest(BaseModel):
    """İş emri tamamlama"""
    completion_notes: Optional[str] = Field(None, max_length=1000)


class WorkOrderApproveRequest(BaseModel):
    """İş emri onaylama"""
    approval_note: Optional[str] = Field(None, max_length=500)


class WorkOrderRejectRequest(BaseModel):
    """İş emri reddetme"""
    rejection_reason: str = Field(..., min_length=10, max_length=500)


class WorkOrderDocumentStatus(BaseModel):
    """İş emri belge durumu"""
    work_order_id: int
    work_order_no: str
    required_documents_complete: bool
    total_documents: int
    approved_documents: int
    pending_documents: int
    rejected_documents: int
    completion_percentage: float


# ============================================
# NOTIFICATION SCHEMAS
# ============================================

class NotificationBase(BaseModel):
    """Bildirim base schema"""
    type: str
    title: str
    message: str


class NotificationCreate(NotificationBase):
    """Bildirim oluşturma"""
    user_id: Optional[int] = None
    portal_user_id: Optional[int] = None
    work_order_id: Optional[int] = None
    document_id: Optional[int] = None


class NotificationResponse(NotificationBase):
    """Bildirim response"""
    id: int
    work_order_id: Optional[int] = None
    work_order_no: Optional[str] = None
    document_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Bildirim liste response"""
    total: int
    unread_count: int
    items: List[NotificationResponse]


# ============================================
# AUTH SCHEMAS
# ============================================

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    must_change_password: bool = False


class PortalTokenResponse(TokenResponse):
    """Portal JWT token response"""
    cari_id: int
    cari_code: str
    is_admin: bool
    created_at: Optional[str] = None  # Firma kayıt tarihi (ISO format)


# ============================================
# FILE UPLOAD SCHEMAS
# ============================================

class FileUploadResponse(BaseModel):
    """Dosya upload response"""
    file_name: str
    file_path: str
    file_size: int
    file_size_mb: float
    file_type: str
    file_hash: str
    document_id: int


class BulkUploadResponse(BaseModel):
    """Toplu dosya upload response"""
    success_count: int
    failed_count: int
    uploaded_files: List[FileUploadResponse]
    errors: List[dict]


# ============================================
# ANALYTICS SCHEMAS
# ============================================

class DocumentAnalytics(BaseModel):
    """Belge analitik"""
    total_documents: int
    by_status: dict
    by_category: dict
    by_document_type: dict
    average_approval_time_hours: float
    fastest_approval_hours: float
    slowest_approval_hours: float


class ExpiryReportItem(BaseModel):
    """Süre sonu rapor item"""
    document_id: int
    document_type: DocumentType
    category: DocumentCategory
    work_order_no: Optional[str] = None
    cari_title: Optional[str] = None
    employee_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    expires_at: datetime
    days_until_expiry: int
    status: DocumentStatus


class ExpiryReport(BaseModel):
    """Süre sonu raporu"""
    expiring_soon: List[ExpiryReportItem]
    expired: List[ExpiryReportItem]
    total_expiring_soon: int
    total_expired: int


# ============================================
# EMPLOYEE DOCUMENT SCHEMAS
# ============================================

class PortalEmployeeDocumentBase(BaseModel):
    """Çalışan belgesi base schema"""
    document_type: str  # EHLIYET, SRC5
    issue_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class PortalEmployeeDocumentCreate(PortalEmployeeDocumentBase):
    """Çalışan belgesi oluşturma"""
    pass


class PortalEmployeeDocumentResponse(PortalEmployeeDocumentBase):
    """Çalışan belgesi response"""
    id: int
    employee_id: int
    cari_id: int
    file_name: str
    file_path: str
    file_size: int
    file_type: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

