"""Helper utilities for computing SGK compliance status of portal employees."""
from __future__ import annotations

from datetime import datetime, date, timedelta
from enum import Enum
from typing import Iterable, Optional, Sequence
import requests

from sqlalchemy.orm import Session

from .models import PortalEmployee, PortalEmployeeDocument, PortalEmployeeSgkPeriod

SGK_HIRE_DOCUMENT_TYPES = {"SGK_ISE_GIRIS", "SGK_GIRIS"}


class EmployeeSgkStatus(str, Enum):
    """Canonical SGK status codes exposed via the API."""

    TAM = "TAM"
    EKSİK = "EKSİK"
    ONAY_BEKLIYOR = "ONAY_BEKLIYOR"


class HolidayClient:
    """
    Resmi tatil günlerini kontrol eden singleton client.
    Nager.Date Public Holidays API kullanır; cache process-wide paylaşılır.
    """
    _instance: Optional['HolidayClient'] = None
    _cache: dict[int, list[date]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def is_holiday(self, check_date: date) -> bool:
        """Verilen tarih resmi tatil mi kontrol eder."""
        year = check_date.year
        
        # Cache'de yoksa API'den çek (singleton olduğu için tüm isteklerde paylaşılır)
        if year not in HolidayClient._cache:
            try:
                response = requests.get(
                    f"https://date.nager.at/api/v3/PublicHolidays/{year}/TR",
                    timeout=1  # 3s → 1s düşürüldü
                )
                if response.status_code == 200:
                    holidays = response.json()
                    HolidayClient._cache[year] = [
                        datetime.strptime(h["date"], "%Y-%m-%d").date()
                        for h in holidays
                    ]
                else:
                    HolidayClient._cache[year] = []
            except Exception:
                # API hatasında boş liste döndür (tatil yok varsayımı)
                HolidayClient._cache[year] = []
        
        return check_date in HolidayClient._cache[year]


# Global singleton instance (process-wide cache paylaşımı için)
_holiday_client = HolidayClient()


def get_active_sgk_period(today: Optional[date] = None) -> str:
    """
    Bugüne göre aktif SGK dönemini hesaplar.
    
    Kural:
    - Her ayın 26'sına kadar: bir önceki ay zorunlu değil, aktif dönem 'içinde bulunulan ay - 1'
    - 26'sı ve sonrası: aktif dönem = içinde bulunulan ay
    - 26'sı resmi tatil ise: 26'dan sonraki ilk iş günü baz alınır
    
    Returns:
        Dönem formatı: 'YYYY-MM'
    """
    if today is None:
        today = date.today()
    
    # 1) İçinde bulunulan ay için 26'sı tarihini üret
    check_date = date(today.year, today.month, 26)
    
    # 2) Eğer 26'sı tatil veya hafta sonu ise, sonraki iş gününü bul
    while _holiday_client.is_holiday(check_date) or check_date.weekday() >= 5:  # 5=Cumartesi, 6=Pazar
        check_date += timedelta(days=1)
    
    # 3) Eğer today < check_date ise: henüz önceki ay zorunlu sayılmaz
    if today < check_date:
        # aktif dönem = bir önceki ay
        ref = today.replace(day=1) - timedelta(days=1)
    else:
        # aktif dönem = içinde bulunulan ay
        ref = today
    
    return f"{ref.year}-{ref.month:02d}"


def get_employee_period_status(
    db: Session,
    employee_id: int,
    period_code: str
) -> Optional[PortalEmployeeSgkPeriod]:
    """
    Belirtilen çalışan ve dönem için SGK dönem kaydını döndürür.
    Yeni dönemsel tablo sorgusu - is_active=True olanlar aranır.
    """
    return db.query(PortalEmployeeSgkPeriod).filter(
        PortalEmployeeSgkPeriod.employee_id == employee_id,
        PortalEmployeeSgkPeriod.period_code == period_code,
        PortalEmployeeSgkPeriod.is_active == True,  # noqa: E712
    ).first()


def _compute_base_status(
    employee: PortalEmployee,
    required_period: str,
    db: Session,
    prefetched_periods: Optional[Sequence[PortalEmployeeSgkPeriod]] = None,
) -> EmployeeSgkStatus:
    """
    Önce yeni dönemsel tabloyu kontrol et, yoksa eski alanları kullan.
    """
    # 1) Yeni dönemsel tablodan kontrol et
    period_record: Optional[PortalEmployeeSgkPeriod] = None

    if prefetched_periods is not None:
        period_record = next(
            (p for p in prefetched_periods if p.period_code == required_period and p.is_active),
            None,
        )
    else:
        period_record = get_employee_period_status(db, employee.id, required_period)

    if period_record and period_record.is_active:
        return EmployeeSgkStatus.TAM
    
    # 2) Eski alanlardan kontrol et (geriye dönük uyumluluk)
    last_period = (employee.sgk_last_check_period or "").strip()
    if last_period and employee.sgk_is_active_last_period and last_period >= required_period:
        return EmployeeSgkStatus.TAM
    
    return EmployeeSgkStatus.EKSİK


def _resolve_hire_declarations(
    employee: PortalEmployee,
    db: Session,
    prefetched_documents: Optional[Iterable[PortalEmployeeDocument]] = None,
) -> Sequence[PortalEmployeeDocument]:
    """Return latest SGK hire declaration documents for the employee."""

    candidate_docs: Optional[Iterable[PortalEmployeeDocument]] = prefetched_documents
    if candidate_docs is None:
        candidate_docs = getattr(employee, "documents", None)

    if candidate_docs is None:
        candidate_docs = db.query(PortalEmployeeDocument).filter(
            PortalEmployeeDocument.employee_id == employee.id,
            PortalEmployeeDocument.is_latest_version == True,  # noqa: E712 - SQLAlchemy boolean comparison
        ).all()

    return [
        doc
        for doc in candidate_docs
        if doc.document_type in SGK_HIRE_DOCUMENT_TYPES and getattr(doc, "is_latest_version", True)
    ]


def compute_employee_sgk_status(
    db: Session,
    employee: PortalEmployee,
    reference_date: Optional[datetime] = None,
    prefetched_periods: Optional[Sequence[PortalEmployeeSgkPeriod]] = None,
    prefetched_documents: Optional[Iterable[PortalEmployeeDocument]] = None,
) -> EmployeeSgkStatus:
    """Return SGK compliance status for a portal employee without changing business rules.

    1. Önce güncel zorunlu dönem (get_active_sgk_period) için SGK hizmet listesi sonuçları
       değerlendirilir ve `_compute_base_status` ile "base_status" üretilir. Bu adım, çalışan
       kayıtlarında bulunan `sgk_last_check_period` ve `sgk_is_active_last_period` alanlarının
       mevcut mantığına tamamen sadıktır.
    2. Eğer `base_status` zaten ``EmployeeSgkStatus.TAM`` ise, ek kontrol yapılmadan değer aynen
       döndürülür.
    3. Base statü TAM değilse `_resolve_hire_declarations` yardımıyla çalışanın SGK işe giriş
       bildirgesi (``SGK_ISE_GIRIS`` / ``SGK_GIRIS``) belgeleri incelenir:
         * APPROVED/OK durumundaki en güncel işe giriş belgesi varsa sonuç ``TAM`` olur.
         * PENDING/UPLOADED durumunda en güncel belge varsa sonuç ``ONAY_BEKLIYOR`` olur.
         * Belge bulunamazsa veya başka bir statüdeyse başlangıçtaki `base_status` aynen döner.

    Böylece var olan SGK hizmet listesi doğrulaması korunur, ancak işe giriş bildirgesi bulunan
    yeni çalışanlar hizmet listesi güncellenene kadar geçici olarak uyumlu kabul edilir.

    `prefetched_periods` ve `prefetched_documents` parametreleri eager-load edilen ilişkilerin
    tekrar sorgulanmasını engeller; dolayısıyla large listeler için N+1 sorgu patlaması yaşanmaz."""

    # Aktif SGK dönemini hesapla (26'sı kuralı + resmi tatil kontrolü)
    today = reference_date.date() if reference_date else date.today()
    required_period = get_active_sgk_period(today)
    base_status = _compute_base_status(
        employee,
        required_period,
        db,
        prefetched_periods=prefetched_periods,
    )

    if base_status == EmployeeSgkStatus.TAM:
        return base_status

    hire_docs = _resolve_hire_declarations(
        employee,
        db,
        prefetched_documents=prefetched_documents,
    )
    if not hire_docs:
        return base_status

    # En güncel SGK işe giriş belgesini değerlendir
    latest_doc = max(hire_docs, key=lambda doc: doc.uploaded_at or datetime.min)
    doc_status = getattr(latest_doc, "status", None)

    if doc_status is None:
        # Status sütunu olmayan eski kayıtlar otomatik olarak onaylanmış sayılır
        return EmployeeSgkStatus.TAM

    normalized_status = str(doc_status).upper()
    if normalized_status in {"APPROVED", "OK"}:
        return EmployeeSgkStatus.TAM
    if normalized_status in {"PENDING", "UPLOADED", EmployeeSgkStatus.ONAY_BEKLIYOR.value}:
        return EmployeeSgkStatus.ONAY_BEKLIYOR

    return base_status


__all__ = [
    "EmployeeSgkStatus",
    "compute_employee_sgk_status",
    "get_active_sgk_period",
    "HolidayClient",
    "SGK_HIRE_DOCUMENT_TYPES"
]
