"""
SAHA PERSONEL ROUTER
API endpoints for Field Personnel (Saha Personel)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import Optional

from ...config.database import get_db
from ...core import success_response, error_response, ErrorCode
from ..isemri.models import WorkOrder, WorkOrderPerson
from ..saha.models import WorkLog
from ..guvenlik.models import GateLog
from .saha_personel_schemas import (
    ActiveWorkOrderResponse,
    WorkOrderPersonSummary,
    WorkOrderSummaryResponse,
    MyWorkOrderResponse
)

router = APIRouter()


@router.get("/saha-personel/active-work-orders")
def get_active_work_orders(
    search: Optional[str] = Query(None, description="WONumber/CariCode/CariTitle/Subject arama"),
    status: Optional[str] = Query(None, description="Status filtresi (APPROVED/IN_PROGRESS/COMPLETED)"),
    db: Session = Depends(get_db)
):
    """Get active work orders for field personnel dashboard"""
    try:
        # Base query with person counts
        query = db.query(
            WorkOrder,
            func.count(WorkOrderPerson.Id).label('total_persons'),
            func.sum(func.cast(WorkOrderPerson.SecurityApproved, db.Integer)).label('approved_persons')
        ).outerjoin(WorkOrderPerson, WorkOrder.Id == WorkOrderPerson.WorkOrderId)
        
        # Filters
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    WorkOrder.WONumber.ilike(search_filter),
                    WorkOrder.CariCode.ilike(search_filter),
                    WorkOrder.CariTitle.ilike(search_filter),
                    WorkOrder.Subject.ilike(search_filter)
                )
            )
        
        if status:
            query = query.filter(WorkOrder.Status == status)
        else:
            # Default: Show APPROVED, IN_PROGRESS, COMPLETED
            query = query.filter(WorkOrder.Status.in_(['APPROVED', 'IN_PROGRESS', 'COMPLETED']))
        
        # Group by work order
        query = query.group_by(WorkOrder.Id)
        
        results = query.all()
        
        active_work_orders = []
        for wo, total_persons, approved_persons in results:
            active_work_orders.append(ActiveWorkOrderResponse(
                Id=wo.Id,
                WONumber=wo.WONumber,
                CariCode=wo.CariCode,
                CariTitle=wo.CariTitle,
                Subject=wo.Subject,
                Status=wo.Status,
                StartDate=wo.StartDate,
                EstimatedEndDate=wo.EstimatedEndDate,
                TotalPersonCount=total_persons or 0,
                ApprovedPersonCount=approved_persons or 0
            ))
        
        return success_response(
            data={"work_orders": [wo.model_dump() for wo in active_work_orders]},
            message=f"{len(active_work_orders)} aktif iş emri"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Aktif iş emirleri getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/saha-personel/my-work-orders")
def get_my_work_orders(
    user_id: int = Query(..., description="Kullanıcı ID"),
    db: Session = Depends(get_db)
):
    """Get work orders assigned to current user"""
    try:
        # Get work orders assigned to user
        work_orders = db.execute(
            select(WorkOrder).where(WorkOrder.AssignedUserId == user_id)
        ).scalars().all()
        
        my_work_orders = []
        for wo in work_orders:
            my_work_orders.append(MyWorkOrderResponse(
                Id=wo.Id,
                WONumber=wo.WONumber,
                CariCode=wo.CariCode,
                CariTitle=wo.CariTitle,
                Subject=wo.Subject,
                Status=wo.Status,
                StartDate=wo.StartDate,
                EstimatedEndDate=wo.EstimatedEndDate,
                AssignedUserId=wo.AssignedUserId
            ))
        
        return success_response(
            data={"work_orders": [wo.model_dump() for wo in my_work_orders]},
            message=f"{len(my_work_orders)} iş emri atanmış"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="İş emirleri getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/saha-personel/work-order/{work_order_id}/summary")
def get_work_order_summary(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    """Get work order summary with person list (for modal)"""
    try:
        # Get work order
        work_order = db.get(WorkOrder, work_order_id)
        
        if not work_order:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="İş emri bulunamadı",
                    details={"work_order_id": work_order_id}
                )
            )
        
        # Get all persons for this work order
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.WorkOrderId == work_order_id)
        ).scalars().all()
        
        # Statistics
        total_persons = len(persons)
        approved_persons = sum(1 for p in persons if p.SecurityApproved)
        pending_persons = total_persons - approved_persons
        entered_persons = sum(1 for p in persons if p.GateLogEntryId is not None)
        exited_persons = sum(1 for p in persons if p.GateLogExitId is not None)
        
        # Get worklog count
        worklog_count = db.execute(
            select(func.count(WorkLog.Id)).where(WorkLog.WorkOrderId == work_order_id)
        ).scalar() or 0
        
        # Person summaries
        person_summaries = []
        for person in persons:
            person_summaries.append(WorkOrderPersonSummary(
                Id=person.Id,
                FullName=person.FullName,
                TcKimlik=person.TcKimlik,
                Pasaport=person.Pasaport,
                SecurityApproved=person.SecurityApproved,
                ApprovalDate=person.ApprovalDate,
                GateLogEntryId=person.GateLogEntryId,
                GateLogExitId=person.GateLogExitId
            ))
        
        summary = WorkOrderSummaryResponse(
            work_order_id=work_order.Id,
            wo_number=work_order.WONumber,
            cari_code=work_order.CariCode,
            cari_title=work_order.CariTitle,
            subject=work_order.Subject,
            status=work_order.Status,
            start_date=work_order.StartDate,
            estimated_end_date=work_order.EstimatedEndDate,
            total_persons=total_persons,
            approved_persons=approved_persons,
            pending_persons=pending_persons,
            entered_persons=entered_persons,
            exited_persons=exited_persons,
            persons=person_summaries,
            worklog_count=worklog_count
        )
        
        return success_response(
            data=summary.model_dump(),
            message="İş emri özeti getirildi"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="İş emri özeti getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/saha-personel/work-order/{work_order_id}/persons")
def get_work_order_persons(
    work_order_id: int,
    db: Session = Depends(get_db)
):
    """Get all persons for a specific work order"""
    try:
        # Check if work order exists
        work_order = db.get(WorkOrder, work_order_id)
        if not work_order:
            raise HTTPException(
                status_code=404,
                detail=error_response(
                    code=ErrorCode.NOT_FOUND,
                    message="İş emri bulunamadı",
                    details={"work_order_id": work_order_id}
                )
            )
        
        # Get all persons
        persons = db.execute(
            select(WorkOrderPerson).where(WorkOrderPerson.WorkOrderId == work_order_id)
        ).scalars().all()
        
        person_summaries = []
        for person in persons:
            person_summaries.append(WorkOrderPersonSummary(
                Id=person.Id,
                FullName=person.FullName,
                TcKimlik=person.TcKimlik,
                Pasaport=person.Pasaport,
                SecurityApproved=person.SecurityApproved,
                ApprovalDate=person.ApprovalDate,
                GateLogEntryId=person.GateLogEntryId,
                GateLogExitId=person.GateLogExitId
            ))
        
        return success_response(
            data={"persons": [p.model_dump() for p in person_summaries]},
            message=f"{len(persons)} kişi bulundu"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Kişiler getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )
