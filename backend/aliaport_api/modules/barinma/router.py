# NOTE: Barınma Contract Router - CRUD endpoints /api/barinma
# Pattern: router_hizmet.py ile uyumlu
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ...config.database import get_db
from .models import BarinmaContract
from .schemas import (
    BarinmaContractResponse,
    BarinmaContractCreate,
    BarinmaContractUpdate,
    PaginatedBarinmaContractResponse,
)
import math

router = APIRouter()


@router.get("/", response_model=List[BarinmaContractResponse])
def get_all_contracts(
    page: int = 1,
    page_size: int = 100,
    is_active: Optional[bool] = None,
    motorbot_id: Optional[int] = None,
    cari_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Tüm barınma kontratlarını listele (pagination + filtreler)
    """
    query = db.query(BarinmaContract)
    
    # Filters
    if is_active is not None:
        query = query.filter(BarinmaContract.IsActive == is_active)
    if motorbot_id:
        query = query.filter(BarinmaContract.MotorbotId == motorbot_id)
    if cari_id:
        query = query.filter(BarinmaContract.CariId == cari_id)
    
    # Pagination
    offset = (page - 1) * page_size
    contracts = query.offset(offset).limit(page_size).all()
    
    return contracts


@router.get("/paginated", response_model=PaginatedBarinmaContractResponse)
def get_contracts_paginated(
    page: int = 1,
    page_size: int = 20,
    is_active: Optional[bool] = None,
    motorbot_id: Optional[int] = None,
    cari_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Paginated barınma kontratları listesi (frontend için)
    """
    query = db.query(BarinmaContract)
    
    # Filters
    if is_active is not None:
        query = query.filter(BarinmaContract.IsActive == is_active)
    if motorbot_id:
        query = query.filter(BarinmaContract.MotorbotId == motorbot_id)
    if cari_id:
        query = query.filter(BarinmaContract.CariId == cari_id)
    
    # Total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    contracts = query.offset(offset).limit(page_size).all()
    
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    
    return {
        "items": contracts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{contract_id}", response_model=BarinmaContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir barınma kontratını getir
    """
    contract = (
        db.query(BarinmaContract).filter(BarinmaContract.Id == contract_id).first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Kontrat bulunamadı")
    return contract


@router.post("/", response_model=BarinmaContractResponse)
def create_contract(contract_data: BarinmaContractCreate, db: Session = Depends(get_db)):
    """
    Yeni barınma kontratı oluştur
    """
    # Kontrat numarası benzersizliğini kontrol et
    existing = (
        db.query(BarinmaContract)
        .filter(BarinmaContract.ContractNumber == contract_data.ContractNumber)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Bu kontrat numarası zaten kullanılıyor")
    
    new_contract = BarinmaContract(**contract_data.model_dump())
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    return new_contract


@router.put("/{contract_id}", response_model=BarinmaContractResponse)
def update_contract(
    contract_id: int,
    contract_data: BarinmaContractUpdate,
    db: Session = Depends(get_db),
):
    """
    Barınma kontratını güncelle
    """
    contract = (
        db.query(BarinmaContract).filter(BarinmaContract.Id == contract_id).first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Kontrat bulunamadı")
    
    # Kontrat numarası benzersizliğini kontrol et (eğer değiştiriliyorsa)
    if (
        contract_data.ContractNumber
        and contract_data.ContractNumber != contract.ContractNumber
    ):
        existing = (
            db.query(BarinmaContract)
            .filter(BarinmaContract.ContractNumber == contract_data.ContractNumber)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="Bu kontrat numarası zaten kullanılıyor"
            )
    
    # Güncelleme
    update_data = contract_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)
    
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    Barınma kontratını sil (hard delete)
    """
    contract = (
        db.query(BarinmaContract).filter(BarinmaContract.Id == contract_id).first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Kontrat bulunamadı")
    
    db.delete(contract)
    db.commit()
    return {"message": "Kontrat başarıyla silindi"}


@router.get("/motorbot/{motorbot_id}/active", response_model=Optional[BarinmaContractResponse])
def get_active_contract_by_motorbot(motorbot_id: int, db: Session = Depends(get_db)):
    """
    Motorbot'un aktif kontratını getir
    """
    contract = (
        db.query(BarinmaContract)
        .filter(
            BarinmaContract.MotorbotId == motorbot_id,
            BarinmaContract.IsActive == True,
        )
        .first()
    )
    return contract
