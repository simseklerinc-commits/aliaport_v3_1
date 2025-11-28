from datetime import datetime, timedelta

import pytest

from aliaport_api.modules.dijital_arsiv.sgk_status import (
    EmployeeSgkStatus,
    compute_employee_sgk_status,
)


class EmployeeStub:
    """Basitleştirilmiş çalışanın yalnızca testlerde kullanılan alanları."""
    def __init__(self, employee_id=1, last_period=None, is_active=False, documents=None):
        self.id = employee_id
        self.sgk_last_check_period = last_period
        self.sgk_is_active_last_period = is_active
        if documents is not None:
            self.documents = documents


class DocumentStub:
    """SGK işe giriş bildirgesi için minimal belge modeli."""

    def __init__(self, status="APPROVED", uploaded_at=None, is_latest_version=True, doc_type="SGK_ISE_GIRIS"):
        self.document_type = doc_type
        self.status = status
        self.uploaded_at = uploaded_at or datetime.utcnow()
        self.is_latest_version = is_latest_version


class FakeQuery:
    def __init__(self, documents):
        self._documents = documents

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return list(self._documents)


class FakeSession:
    def __init__(self, documents):
        self._documents = documents

    def query(self, model):
        return FakeQuery(self._documents)


REFERENCE_DATE = datetime(2025, 11, 15)


@pytest.mark.unit
def test_compute_status_respects_service_period_compliance():
    employee = EmployeeStub(last_period="202510", is_active=True, documents=[])
    status = compute_employee_sgk_status(FakeSession([]), employee, reference_date=REFERENCE_DATE)
    assert status == EmployeeSgkStatus.TAM


@pytest.mark.unit
def test_compute_status_uses_preloaded_approved_hire_document():
    hire_doc = DocumentStub(status="APPROVED", uploaded_at=REFERENCE_DATE - timedelta(days=1))
    employee = EmployeeStub(last_period="202509", is_active=False, documents=[hire_doc])

    status = compute_employee_sgk_status(FakeSession([]), employee, reference_date=REFERENCE_DATE)

    assert status == EmployeeSgkStatus.TAM


@pytest.mark.unit
def test_compute_status_fetches_pending_hire_document_from_db():
    hire_doc = DocumentStub(status="PENDING", uploaded_at=REFERENCE_DATE - timedelta(hours=2))
    employee = EmployeeStub(last_period="202509", is_active=False, documents=None)

    status = compute_employee_sgk_status(FakeSession([hire_doc]), employee, reference_date=REFERENCE_DATE)

    assert status == EmployeeSgkStatus.ONAY_BEKLIYOR


@pytest.mark.unit
def test_sgk_status_treats_legacy_hire_doc_as_approved():
    legacy_doc = DocumentStub(status=None, uploaded_at=REFERENCE_DATE - timedelta(days=2))
    employee = EmployeeStub(last_period="202508", is_active=False, documents=[legacy_doc])

    status = compute_employee_sgk_status(FakeSession([]), employee, reference_date=REFERENCE_DATE)

    assert status == EmployeeSgkStatus.TAM
