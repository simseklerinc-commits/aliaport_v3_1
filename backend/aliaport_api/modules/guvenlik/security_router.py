"""
SECURITY ROUTER
API endpoints for Security module (Vehicle Entry/Exit, Person Approval)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timedelta

from ...config.database import get_db
from ...core import success_response, error_response, ErrorCode
from ..guvenlik.models import GateLog
from ..isemri.models import WorkOrder, WorkOrderPerson
from ..hizmet.pricing_engine import PricingEngine
from .security_schemas import (
    VehicleEntryRequest,
    VehicleExitRequest,
    VehicleExitResponse,
    PersonIdentityUploadRequest,
    SecurityApprovalBulkRequest,
    PendingPersonResponse,
    ActiveVehicleResponse
)

router = APIRouter()


@router.post("/security/vehicle-entry")
def record_vehicle_entry(
    entry_data: VehicleEntryRequest,
    db: Session = Depends(get_db)
):
    """Record vehicle entry at gate"""
    try:
        # Check work order exists
        work_order = db.get(WorkOrder, entry_data.work_order_id)
        if not work_order:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="İş emri bulunamadı",
                    details={"work_order_id": entry_data.work_order_id}
                )
            )
        
        # Create gate log entry
        gate_log = GateLog(
            WorkOrderId=entry_data.work_order_id,
            VehiclePlate=entry_data.vehicle_plate,
            VehicleType=entry_data.vehicle_type,
            DriverName=entry_data.driver_name,
            EntryTime=datetime.now(),
            Notes=entry_data.notes
        )
        
        db.add(gate_log)
        db.commit()
        db.refresh(gate_log)
        
        return success_response(
            data={"gate_log_id": gate_log.Id, "entry_time": gate_log.EntryTime.isoformat()},
            message="Araç girişi kaydedildi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Araç girişi kaydedilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/security/vehicle-exit")
def record_vehicle_exit(
    exit_data: VehicleExitRequest,
    db: Session = Depends(get_db)
):
    """Record vehicle exit and calculate 4-hour rule charges"""
    try:
        # Get gate log entry
        gate_log = db.get(GateLog, exit_data.gate_log_id)
        
        if not gate_log:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Giriş kaydı bulunamadı",
                    details={"gate_log_id": exit_data.gate_log_id}
                )
            )
        
        if gate_log.ExitTime is not None:
            raise HTTPException(
                status_code=400,
                detail=error_response(
                    code=ErrorCode.VALIDATION_ERROR,
                    message="Araç çıkışı zaten kaydedilmiş",
                    details={"gate_log_id": exit_data.gate_log_id}
                )
            )
        
        # Calculate duration and pricing
        exit_time = datetime.now()
        duration = exit_time - gate_log.EntryTime
        duration_minutes = int(duration.total_seconds() / 60)
        
        # Use pricing engine for 4-hour rule
        pricing_engine = PricingEngine(db)
        
        # Assuming 4-hour rule hizmet exists
        # In production, this should be configurable
        params = {"duration_minutes": duration_minutes}
        
        # Mock calculation (replace with actual hizmet lookup)
        base_hours = 4
        base_price = 100.0  # TRY
        extra_charges = 0.0
        
        if duration_minutes > base_hours * 60:
            extra_hours = (duration_minutes - base_hours * 60) / 60
            extra_charges = extra_hours * 25.0  # 25 TRY per extra hour
        
        total_price = base_price + extra_charges
        
        # Update gate log
        gate_log.ExitTime = exit_time
        gate_log.DurationMinutes = duration_minutes
        
        db.commit()
        
        breakdown = {
            "base_hours": base_hours,
            "base_price": base_price,
            "extra_hours": max(0, (duration_minutes - base_hours * 60) / 60),
            "extra_charges": extra_charges,
            "total_price": total_price
        }
        
        response = VehicleExitResponse(
            gate_log_id=gate_log.Id,
            entry_time=gate_log.EntryTime,
            exit_time=exit_time,
            duration_minutes=duration_minutes,
            base_price=base_price,
            extra_charges=extra_charges,
            total_price=total_price,
            currency="TRY",
            breakdown=breakdown,
            message=f"Araç çıkışı kaydedildi. Süre: {duration_minutes} dk. Ücret: {total_price} TRY"
        )
        
        return success_response(
            data=response.model_dump(),
            message="Araç çıkışı kaydedildi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Araç çıkışı kaydedilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/security/active-vehicles")
def get_active_vehicles(db: Session = Depends(get_db)):
    """Get all active vehicles (entered but not exited)"""
    try:
        vehicles = db.execute(
            select(GateLog, WorkOrder.WONumber)
            .join(WorkOrder, GateLog.WorkOrderId == WorkOrder.Id)
            .where(GateLog.ExitTime == None)
        ).all()
        
        active_vehicles = []
        for gate_log, wo_number in vehicles:
            duration = datetime.now() - gate_log.EntryTime
            duration_minutes = int(duration.total_seconds() / 60)
            
            active_vehicles.append(ActiveVehicleResponse(
                Id=gate_log.Id,
                WorkOrderId=gate_log.WorkOrderId,
                WorkOrderNumber=wo_number,
                VehiclePlate=gate_log.VehiclePlate,
                VehicleType=gate_log.VehicleType,
                DriverName=gate_log.DriverName,
                EntryTime=gate_log.EntryTime,
                DurationMinutes=duration_minutes,
                Notes=gate_log.Notes
            ))
        
        return success_response(
            data={"vehicles": [v.model_dump() for v in active_vehicles]},
            message=f"{len(active_vehicles)} aktif araç"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Aktif araçlar getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/security/pending-persons")
def get_pending_persons(db: Session = Depends(get_db)):
    """Get all persons pending security approval"""
    try:
        persons = db.execute(
            select(WorkOrderPerson, WorkOrder.WONumber)
            .join(WorkOrder, WorkOrderPerson.WorkOrderId == WorkOrder.Id)
            .where(WorkOrderPerson.SecurityApproved == False)
        ).all()
        
        pending_persons = []
        for person, wo_number in persons:
            pending_persons.append(PendingPersonResponse(
                Id=person.Id,
                WorkOrderId=person.WorkOrderId,
                WorkOrderNumber=wo_number,
                FullName=person.FullName,
                TcKimlik=person.TcKimlik,
                Pasaport=person.Pasaport,
                SecurityNotes=person.SecurityNotes,
                CreatedAt=person.CreatedAt
            ))
        
        return success_response(
            data={"persons": [p.model_dump() for p in pending_persons]},
            message=f"{len(pending_persons)} onay bekleyen kişi"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Onay bekleyen kişiler getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/security/upload-identity")
def upload_identity_document(
    upload_data: PersonIdentityUploadRequest,
    db: Session = Depends(get_db)
):
    """Upload identity document (TC Kimlik/Pasaport photo)"""
    try:
        person = db.get(WorkOrderPerson, upload_data.person_id)
        
        if not person:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Kişi kaydı bulunamadı",
                    details={"person_id": upload_data.person_id}
                )
            )
        
        # In production, save document_data to file storage or S3
        # For now, just add notes
        notes = f"[{upload_data.identity_type}] Kimlik belgesi yüklendi. {upload_data.notes or ''}"
        
        if person.SecurityNotes:
            person.SecurityNotes += "\n" + notes
        else:
            person.SecurityNotes = notes
        
        db.commit()
        
        return success_response(
            data={"person_id": person.Id, "identity_type": upload_data.identity_type},
            message="Kimlik belgesi yüklendi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kimlik belgesi yüklenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/security/bulk-approval")
def bulk_person_approval(
    approval_data: SecurityApprovalBulkRequest,
    db: Session = Depends(get_db)
):
    """Bulk approve or reject multiple persons"""
    try:
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.Id.in_(approval_data.person_ids))
        ).scalars().all()
        
        if len(persons) != len(approval_data.person_ids):
            found_ids = [p.Id for p in persons]
            missing_ids = [pid for pid in approval_data.person_ids if pid not in found_ids]
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="Bazı kişiler bulunamadı",
                    details={"missing_ids": missing_ids}
                )
            )
        
        approval_time = datetime.now() if approval_data.approved else None
        
        for person in persons:
            person.SecurityApproved = approval_data.approved
            person.ApprovalDate = approval_time
            
            if approval_data.notes:
                person.SecurityNotes = approval_data.notes
        
        db.commit()
        
        status_text = "onaylandı" if approval_data.approved else "reddedildi"
        
        return success_response(
            data={"updated_count": len(persons), "person_ids": approval_data.person_ids},
            message=f"{len(persons)} kişi {status_text}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Toplu onay işlenirken hata oluştu",
                details={"error": str(e)}
            )
        )
