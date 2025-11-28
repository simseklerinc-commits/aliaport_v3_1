from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta
from ...config.database import get_db
from ...core import (
    success_response,
    error_response,
    paginated_response,
    ErrorCode,
    get_http_status_for_error
)
from .models import Hizmet, TarifeListesi
from ..tarife.models import PriceListItem
from .schemas import (
    HizmetResponse, 
    HizmetCreate, 
    HizmetUpdate,
    PriceCalculationRequest,
    PriceCalculationResponse
)
from .pricing_engine import PricingEngine

router = APIRouter()


@router.get("/")
def get_all_hizmetler(
    page: int = Query(1, ge=1, description="Sayfa numarası"),
    page_size: int = Query(20, ge=1, le=1000, description="Sayfa başına kayıt"),
    is_active: Optional[bool] = Query(None, description="Aktif/pasif filtresi"),
    search: Optional[str] = Query(None, description="Kod veya ad ile arama"),
    db: Session = Depends(get_db),
):
    """
    Hizmet listesini getir (sayfalanmış)
    
    Returns:
        PaginatedResponse with hizmet list
    """
    try:
        # Base query
        query = db.query(Hizmet)
        
        # Active filter
        if is_active is not None:
            query = query.filter(Hizmet.AktifMi == is_active)
        
        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Hizmet.Kod.ilike(search_filter)) | 
                (Hizmet.Ad.ilike(search_filter))
            )
        
        # Total count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * page_size
        items = query.order_by(Hizmet.Kod).offset(offset).limit(page_size).all()
        
        # Convert to Pydantic models and then to dicts
        hizmet_list = [HizmetResponse.model_validate(item).model_dump() for item in items]
        
        return paginated_response(
            data=hizmet_list,
            page=page,
            page_size=page_size,
            total=total,
            message=f"{total} hizmet bulundu"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Hizmet listesi getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/{hizmet_id}")
def get_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    ID ile hizmet getir
    
    Returns:
        StandardResponse with hizmet data
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    hizmet_data = HizmetResponse.model_validate(obj)
    return success_response(
        data=hizmet_data.model_dump(),
        message="Hizmet başarıyla getirildi"
    )


@router.post("/")
def create_hizmet(payload: HizmetCreate, db: Session = Depends(get_db)):
    """
    Yeni hizmet oluştur
    
    Returns:
        StandardResponse with created hizmet
    """
    # Duplicate code check
    if db.query(Hizmet).filter(Hizmet.Kod == payload.Kod).first():
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_DUPLICATE_CODE),
            detail=error_response(
                code=ErrorCode.HIZMET_DUPLICATE_CODE,
                message="Bu hizmet kodu zaten kullanılıyor",
                details={"kod": payload.Kod},
                field="Kod"
            )
        )
    
    try:
        obj = Hizmet(**payload.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        
        hizmet_data = HizmetResponse.model_validate(obj)
        return success_response(
            data=hizmet_data.model_dump(),
            message="Hizmet başarıyla oluşturuldu"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet oluşturulurken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.put("/{hizmet_id}")
def update_hizmet(
    hizmet_id: int,
    payload: HizmetUpdate,
    db: Session = Depends(get_db),
):
    """
    Hizmet güncelle
    
    Returns:
        StandardResponse with updated hizmet
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    # Kod değiştiriliyor mu ve duplicate var mı?
    update_data = payload.model_dump(exclude_unset=True)
    if "Kod" in update_data and update_data["Kod"] != obj.Kod:
        existing = db.query(Hizmet).filter(Hizmet.Kod == update_data["Kod"]).first()
        if existing:
            raise HTTPException(
                status_code=get_http_status_for_error(ErrorCode.HIZMET_DUPLICATE_CODE),
                detail=error_response(
                    code=ErrorCode.HIZMET_DUPLICATE_CODE,
                    message="Bu hizmet kodu zaten kullanılıyor",
                    details={"kod": update_data["Kod"]},
                    field="Kod"
                )
            )
    
    try:
        for k, v in update_data.items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        
        hizmet_data = HizmetResponse.model_validate(obj)
        return success_response(
            data=hizmet_data.model_dump(),
            message="Hizmet başarıyla güncellendi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet güncellenirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.delete("/{hizmet_id}")
def delete_hizmet(hizmet_id: int, db: Session = Depends(get_db)):
    """
    Hizmet sil - İşlem görmüş ise silmeyi engelle
    
    Returns:
        StandardResponse with success message
    """
    obj = db.get(Hizmet, hizmet_id)
    if not obj:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": hizmet_id}
            )
        )
    
    # Tarife kalemlerinde kullanılıp kullanılmadığını kontrol et
    tarife_kullanim = db.query(PriceListItem).filter(
        PriceListItem.HizmetKodu == obj.Kod
    ).count()
    
    if tarife_kullanim > 0:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_INACTIVE),
            detail=error_response(
                code=ErrorCode.HIZMET_INACTIVE,
                message=f"Bu hizmet {tarife_kullanim} adet tarife kaleminde kullanılmaktadır. Silme işlemi yapılamaz.",
                details={"hizmet_id": hizmet_id, "kullanim_sayisi": tarife_kullanim}
            )
        )
    
    try:
        db.delete(obj)
        db.commit()
        
        return success_response(
            data={"id": hizmet_id, "deleted": True},
            message="Hizmet başarıyla silindi"
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.DATABASE_ERROR,
                message="Hizmet silinirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.post("/calculate-price", response_model=dict)
def calculate_price(payload: PriceCalculationRequest, db: Session = Depends(get_db)):
    """
    Otomatik fiyat hesaplama endpoint
    
    Hizmetin CalculationType'ına göre otomatik fiyat hesaplar.
    TarifeListesi'nde override varsa, override fiyatı kullanır.
    
    Args:
        payload: PriceCalculationRequest - Hesaplama parametreleri
        
    Returns:
        StandardResponse with PriceCalculationResponse
        
    Raises:
        404: Hizmet bulunamadı
        400: Geçersiz parametreler (eksik veya yanlış parametreler)
        500: Hesaplama hatası
    """
    # 1. Hizmeti getir
    hizmet = db.get(Hizmet, payload.hizmet_id)
    if not hizmet:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_NOT_FOUND),
            detail=error_response(
                code=ErrorCode.HIZMET_NOT_FOUND,
                message="Hizmet bulunamadı",
                details={"hizmet_id": payload.hizmet_id}
            )
        )
    
    if not hizmet.AktifMi:
        raise HTTPException(
            status_code=get_http_status_for_error(ErrorCode.HIZMET_INACTIVE),
            detail=error_response(
                code=ErrorCode.HIZMET_INACTIVE,
                message="Bu hizmet aktif değil",
                details={"hizmet_id": payload.hizmet_id}
            )
        )
    
    # 2. Effective date kontrolü
    effective_date = payload.effective_date or date.today()
    
    # 3. TarifeListesi'nde override var mı kontrol et
    tarife_override = None
    tarife_listesi_id = None
    
    if payload.override_price is None:  # Manuel override yoksa TarifeListesi'ne bak
        tarife_query = db.query(TarifeListesi).filter(
            and_(
                TarifeListesi.HizmetId == hizmet.Id,
                TarifeListesi.IsActive == True,
                TarifeListesi.ValidFrom <= effective_date,
                or_(
                    TarifeListesi.ValidTo.is_(None),
                    TarifeListesi.ValidTo >= effective_date
                )
            )
        ).order_by(TarifeListesi.ValidFrom.desc())
        
        tarife_record = tarife_query.first()
        
        if tarife_record and tarife_record.OverridePrice is not None:
            tarife_override = tarife_record.OverridePrice
            tarife_listesi_id = tarife_record.Id
            override_currency = tarife_record.OverrideCurrency or hizmet.ParaBirimi
    
    # 4. Fiyat hesaplama
    pricing_engine = PricingEngine()
    
    try:
        # Override fiyat varsa direkt kullan
        if payload.override_price is not None:
            calculated_price = payload.override_price
            formula_used = "Manual Override"
            breakdown = {
                "override_price": float(payload.override_price),
                "source": "Manual"
            }
            currency = payload.override_currency or hizmet.ParaBirimi
            tarife_override_applied = False
            
        elif tarife_override is not None:
            calculated_price = tarife_override
            formula_used = "TarifeListesi Override"
            breakdown = {
                "override_price": float(tarife_override),
                "tarife_listesi_id": tarife_listesi_id,
                "source": "TarifeListesi"
            }
            currency = override_currency
            tarife_override_applied = True
            
        else:
            # Hesaplama metodunu çağır
            result = pricing_engine.calculate_price(
                calculation_type=hizmet.CalculationType or "FIXED",
                base_price=float(hizmet.Fiyat) if hizmet.Fiyat else 0.0,
                formula_params=hizmet.FormulaParams or {},
                quantity=payload.quantity,
                person_count=payload.person_count,
                multiplier_x=float(payload.multiplier_x) if payload.multiplier_x else None,
                secondary_value=float(payload.secondary_value) if payload.secondary_value else None,
                block_size=payload.block_size,
                total_duration=payload.total_duration,
                increment_value=float(payload.increment_value) if payload.increment_value else None,
                vehicle_duration_minutes=payload.vehicle_duration_minutes
            )
            
            calculated_price = result["total"]
            formula_used = result["formula"]
            breakdown = result["breakdown"]
            currency = hizmet.ParaBirimi
            tarife_override_applied = False
        
        # 5. Response oluştur
        response_data = PriceCalculationResponse(
            hizmet_id=hizmet.Id,
            hizmet_kod=hizmet.Kod,
            hizmet_ad=hizmet.Ad,
            calculation_type=hizmet.CalculationType or "FIXED",
            formula_used=formula_used,
            calculated_price=calculated_price,
            currency=currency,
            tarife_override_applied=tarife_override_applied,
            tarife_listesi_id=tarife_listesi_id,
            breakdown=breakdown,
            effective_date=effective_date
        )
        
        return success_response(
            data=response_data.model_dump(),
            message="Fiyat başarıyla hesaplandı"
        )
    
    except ValueError as e:
        # Pricing engine validation hataları
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message="Geçersiz hesaplama parametreleri",
                details={"error": str(e)}
            )
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Fiyat hesaplanırken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/analytics/pricing-trends")
def get_pricing_analytics(
    start_date: Optional[str] = Query(None, description="Başlangıç tarihi (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Bitiş tarihi (YYYY-MM-DD)"),
    hizmet_id: Optional[int] = Query(None, description="Hizmet ID filtresi"),
    calculation_type: Optional[str] = Query(None, description="Hesaplama tipi filtresi"),
    db: Session = Depends(get_db),
):
    """
    Fiyatlandırma analitik verileri
    
    Trendler, hesaplama tipi dağılımı, tarife override istatistikleri
    
    NOTE: Bu mock endpoint'dir. Gerçek production'da WorkOrder/Transaction
    tablosundan pricing calculation log'ları çekilerek hesaplanmalı.
    
    Returns:
        StandardResponse with analytics data
    """
    try:
        # Parse dates
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        else:
            start_dt = datetime.now() - timedelta(days=30)
        
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            end_dt = datetime.now()
        
        # MOCK DATA - Production'da gerçek calculation log'larından çekilmeli
        # Bu örnek statik veri döndürür, entegrasyon için veri yapısını gösterir
        
        # Query tarifeleri
        tariff_query = db.query(
            TarifeListesi,
            Hizmet.Kod.label('hizmet_kod'),
            Hizmet.Ad.label('hizmet_ad')
        ).join(Hizmet, TarifeListesi.HizmetId == Hizmet.Id)
        
        if hizmet_id:
            tariff_query = tariff_query.filter(Hizmet.Id == hizmet_id)
        
        if calculation_type:
            tariff_query = tariff_query.filter(TarifeListesi.CalculationType == calculation_type)
        
        tariffs = tariff_query.all()
        
        # Generate mock trends (günlük ortalama fiyatlar)
        trends = []
        current_date = start_dt
        while current_date <= end_dt:
            # Mock data: Random avg/min/max prices based on tariffs
            active_tariffs = [t.TarifeListesi.OverridePrice for t in tariffs if t.TarifeListesi.IsActive]
            if active_tariffs:
                avg_price = sum(active_tariffs) / len(active_tariffs)
                min_price = min(active_tariffs)
                max_price = max(active_tariffs)
            else:
                avg_price = min_price = max_price = 0.0
            
            trends.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "avgPrice": round(avg_price, 2),
                "minPrice": round(min_price, 2),
                "maxPrice": round(max_price, 2),
                "totalCalculations": len(active_tariffs) * 5,  # Mock: 5 calculations per tariff
                "calculationType": calculation_type or "ALL"
            })
            current_date += timedelta(days=1)
        
        # Calculation type breakdown
        calc_types = {}
        for tariff in tariffs:
            ct = tariff.TarifeListesi.CalculationType or "FIXED"
            if ct not in calc_types:
                calc_types[ct] = {
                    "count": 0,
                    "totalRevenue": 0.0,
                    "prices": []
                }
            calc_types[ct]["count"] += 1
            calc_types[ct]["totalRevenue"] += tariff.TarifeListesi.OverridePrice
            calc_types[ct]["prices"].append(tariff.TarifeListesi.OverridePrice)
        
        calc_type_breakdown = []
        total_count = sum(ct["count"] for ct in calc_types.values())
        for calc_type, data in calc_types.items():
            avg_price = data["totalRevenue"] / data["count"] if data["count"] > 0 else 0.0
            percentage = (data["count"] / total_count * 100) if total_count > 0 else 0.0
            calc_type_breakdown.append({
                "calculationType": calc_type,
                "count": data["count"],
                "totalRevenue": round(data["totalRevenue"], 2),
                "avgPrice": round(avg_price, 2),
                "percentage": round(percentage, 2)
            })
        
        # Tariff override stats (Mock)
        # Production'da: actual base price vs override price karşılaştırması yapılmalı
        total_calculations = len(tariffs) * 10  # Mock: 10 calculations per tariff
        override_count = len([t for t in tariffs if t.TarifeListesi.OverridePrice is not None])
        override_percentage = (override_count / len(tariffs) * 100) if len(tariffs) > 0 else 0.0
        
        # Top overridden services (Mock: Most active tariffs)
        top_overridden = []
        tariff_override_counts = {}
        for tariff in tariffs:
            kod = tariff.hizmet_kod
            if kod not in tariff_override_counts:
                tariff_override_counts[kod] = {
                    "hizmetKod": kod,
                    "hizmetAd": tariff.hizmet_ad,
                    "overrideCount": 0
                }
            tariff_override_counts[kod]["overrideCount"] += 1
        
        top_overridden = sorted(
            tariff_override_counts.values(),
            key=lambda x: x["overrideCount"],
            reverse=True
        )[:10]  # Top 10
        
        tariff_override_stats = {
            "totalCalculations": total_calculations,
            "overrideCount": override_count * 10,  # Mock: 10x
            "overridePercentage": round(override_percentage, 2),
            "avgOverrideDiscount": 5.0,  # Mock: 5% average discount
            "topOverriddenServices": top_overridden
        }
        
        # Summary
        total_revenue = sum(ct["totalRevenue"] for ct in calc_types.values())
        avg_calc_price = total_revenue / total_count if total_count > 0 else 0.0
        most_used_type = max(calc_types.items(), key=lambda x: x[1]["count"])[0] if calc_types else "N/A"
        
        summary = {
            "totalCalculations": total_calculations,
            "totalRevenue": round(total_revenue, 2),
            "avgCalculationPrice": round(avg_calc_price, 2),
            "mostUsedCalculationType": most_used_type
        }
        
        analytics_data = {
            "trends": trends,
            "calculationTypeBreakdown": calc_type_breakdown,
            "tariffOverrideStats": tariff_override_stats,
            "summary": summary
        }
        
        return success_response(
            data=analytics_data,
            message="Analitik veriler başarıyla getirildi"
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=error_response(
                code=ErrorCode.VALIDATION_ERROR,
                message="Geçersiz tarih formatı",
                details={"error": str(e)}
            )
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR,
                message="Analitik veriler getirilirken hata oluştu",
                details={"error": str(e)}
            )
        )


@router.get("/analytics/export-csv")
def export_analytics_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    hizmet_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Analytics data CSV export
    
    NOTE: CSV generation needs additional library (e.g., pandas)
    This is a placeholder endpoint
    """
    raise HTTPException(
        status_code=501,
        detail=error_response(
            code=ErrorCode.NOT_IMPLEMENTED,
            message="CSV export henüz implement edilmedi",
            details={"note": "pandas veya csv module ile implement edilecek"}
        )
    )


@router.get("/analytics/export-pdf")
def export_analytics_pdf(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    hizmet_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Analytics data PDF export
    
    NOTE: PDF generation needs additional library (e.g., reportlab)
    This is a placeholder endpoint
    """
    raise HTTPException(
        status_code=501,
        detail=error_response(
            code=ErrorCode.NOT_IMPLEMENTED,
            message="PDF export henüz implement edilmedi",
            details={"note": "reportlab veya weasyprint ile implement edilecek"}
        )
    )

