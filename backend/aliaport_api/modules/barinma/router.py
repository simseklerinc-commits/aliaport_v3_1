# NOTE: Barınma Contract Router - CRUD endpoints /api/barinma
# Pattern: router_hizmet.py ile uyumlu
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import BarinmaContract
from .schemas import (
    BarinmaContractResponse,
    BarinmaContractCreate,
    BarinmaContractUpdate,
    PaginatedBarinmaContractResponse,
)
import math

router = APIRouter()


@router.get("/")
def get_all_contracts(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    is_active: Optional[bool] = Query(None, description="Aktif/pasif filtresi"),
    motorbot_id: Optional[int] = Query(None, description="Motorbot ID filtresi"),
    cari_id: Optional[int] = Query(None, description="Cari ID filtresi"),
    search: Optional[str] = Query(None, description="Kontrat numarası ile arama"),
    db: Session = Depends(get_db),
):
    """
    Barınma kontrat listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with contract list
    """
    try:
        # Base query
        query = db.query(BarinmaContract)
        
        # Filters
        if is_active is not None:
            query = query.filter(BarinmaContract.IsActive == is_active)
        if motorbot_id:
            query = query.filter(BarinmaContract.MotorbotId == motorbot_id)
        if cari_id:
            query = query.filter(BarinmaContract.CariId == cari_id)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(BarinmaContract.ContractNumber.ilike(search_filter))
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(BarinmaContract.Id.desc()).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        contract_list = [BarinmaContractResponse.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=contract_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} kontrat bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kontrat listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/{contract_id}")
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    ID ile kontrat getir
    
    Returns:
        StandardResponse with contract data
    """
    obj = db.get(BarinmaContract, contract_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.BARINMA_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.BARINMA_NOT_FOUND,
                message="Kontrat bulunamadı",
                details={"contract_id": contract_id}
            )
        )
    
    contract_data = BarinmaContractResponse.model_validate(obj)
    return success_response(
        data=contract_data.model_dump(),
        message="Kontrat başarıyla getirildi"
    )


@router.post("/")
def create_contract(payload: BarinmaContractCreate, db: Session = Depends(get_db)):
    """
    Yeni barınma kontratı oluştur
    
    Returns:
        StandardResponse with created contract
    """
    # Duplicate contract number check
    if db.query(BarinmaContract).filter(
        BarinmaContract.ContractNumber == payload.ContractNumber
    ).first():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.BARINMA_DUPLICATE_CONTRACT),
            detail=error_response(
                code=ErrorCode.BARINMA_DUPLICATE_CONTRACT,
                message="Bu kontrat numarası zaten kullanılıyor",
                details={"contract_number": payload.ContractNumber},
                field="ContractNumber"
            )
        )
    
    try:
        obj = BarinmaContract(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        contract_data = BarinmaContractResponse.model_validate(obj)
        return success_response(
            data=contract_data.model_dump(),
            message="Kontrat başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Kontrat oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{contract_id}")
def update_contract(
    contract_id: int,
    payload: BarinmaContractUpdate,
    db: Session = Depends(get_db),
):
    """
    Barınma kontratını güncelle
    
    Returns:
        StandardResponse with updated contract
    """
    obj = db.get(BarinmaContract, contract_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.BARINMA_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.BARINMA_NOT_FOUND,
                message="Kontrat bulunamadı",
                details={"contract_id": contract_id}
            )
        )
    
    # Kontrat numarası değişiyorsa duplicate check
    update_data = payload.model_dump(exclude_unset=True)
    if "ContractNumber" in update_data and update_data["ContractNumber"] != obj.ContractNumber:
        existing = db.query(BarinmaContract).filter(
            BarinmaContract.ContractNumber == update_data["ContractNumber"]
        ).first()
        if existing:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.BARINMA_DUPLICATE_CONTRACT),
                detail=error_response(
                    code=ErrorCode.BARINMA_DUPLICATE_CONTRACT,
                    message="Bu kontrat numarası zaten kullanılıyor",
                    details={"contract_number": update_data["ContractNumber"]},
                    field="ContractNumber"
                )
            )
    
    try:
        for k, v in update_data.items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        
        contract_data = BarinmaContractResponse.model_validate(obj)
        return success_response(
            data=contract_data.model_dump(),
            message="Kontrat başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Kontrat güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    Barınma kontratını sil (hard delete)
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(BarinmaContract, contract_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.BARINMA_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.BARINMA_NOT_FOUND,
                message="Kontrat bulunamadı",
                details={"contract_id": contract_id}
            )
        )
    
    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": contract_id, "deleted": True},
            message="Kontrat başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Kontrat silinirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/motorbot/{motorbot_id}/active")
def get_active_contract_by_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    """
    Motorbot'un aktif kontratını getir
    
    Returns:
        StandardResponse with active contract or null
    """
    try:
        contract = (
            db.query(BarinmaContract)
            .filter(
                BarinmaContract.MotorbotId == motorbot_id,
                BarinmaContract.IsActive == True,
            )
            .first()
        )
        
        if contract:
            contract_data = BarinmaContractResponse.model_validate(contract)
            return success_response(
                data=contract_data.model_dump(),
                message="Aktif kontrat bulundu"
            )
        else:
            return success_response(
                data=None,
                message="Aktif kontrat bulunamadı"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Aktif kontrat sorgulamasında hata oluştu",
                details={"error": str(e)}
            )
        )
