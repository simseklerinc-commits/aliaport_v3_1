"""Helper utilities for computing SGK compliance status of portal employees."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Iterable, Optional, Sequence

from sqlalchemy.orm import Session

from .models import PortalEmployee, PortalEmployeeDocument

SGK_HIRE_DOCUMENT_TYPES = {"SGK_ISE_GIRIS", "SGK_GIRIS"}


class EmployeeSgkStatus(str, Enum):
    """Canonical SGK status codes exposed via the API."""

    TAM = "TAM"
    EKSİK = "EKSİK"
    ONAY_BEKLIYOR = "ONAY_BEKLIYOR"


def _current_required_period(reference_date: Optional[datetime] = None) -> str:
    """Return the YYYYMM period that must be validated as of the given date."""

    reference_date = reference_date or datetime.utcnow()
    year = reference_date.year
    month = reference_date.month

    if reference_date.day >= 26:
        target_year = year
        target_month = month
    else:
        if month == 1:
            target_year = year - 1
            target_month = 12
        else:
            target_year = year
            target_month = month - 1

    return f"{target_year}{target_month:02d}"


def _compute_base_status(employee: PortalEmployee, required_period: str) -> EmployeeSgkStatus:
    """Existing SGK hizmet listesi bazlı statüyü hesapla."""

    last_period = (employee.sgk_last_check_period or "").strip()
    if last_period and employee.sgk_is_active_last_period and last_period >= required_period:
        return EmployeeSgkStatus.TAM
    return EmployeeSgkStatus.EKSİK


def _resolve_hire_declarations(
    employee: PortalEmployee,
    db: Session,
) -> Sequence[PortalEmployeeDocument]:
    """Return latest SGK hire declaration documents for the employee."""

    candidate_docs: Optional[Iterable[PortalEmployeeDocument]] = getattr(employee, "documents", None)

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
) -> EmployeeSgkStatus:
    """Return SGK compliance status for a portal employee without changing business rules.

    1. Önce güncel zorunlu dönem (_current_required_period) için SGK hizmet listesi sonuçları
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
    yeni çalışanlar hizmet listesi güncellenene kadar geçici olarak uyumlu kabul edilir."""

    required_period = _current_required_period(reference_date)
    base_status = _compute_base_status(employee, required_period)

    if base_status == EmployeeSgkStatus.TAM:
        return base_status

    hire_docs = _resolve_hire_declarations(employee, db)
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


__all__ = ["EmployeeSgkStatus", "compute_employee_sgk_status", "SGK_HIRE_DOCUMENT_TYPES"]
