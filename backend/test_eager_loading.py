"""
WorkOrder Eager Loading Validation Test
Bu script, N+1 sorgu probleminin çözüldüğünü doğrular
"""

import sys
from pathlib import Path
from contextlib import contextmanager

# Backend path'i ekle
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from aliaport_api.config.database import Base
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem
from sqlalchemy.orm import selectinload, joinedload


# Test database setup
TEST_DB_URL = "sqlite:///./test_eager_loading.db"
engine = create_engine(TEST_DB_URL, echo=False)  # echo=True için SQL görmek gerekirse
SessionLocal = sessionmaker(bind=engine)


class QueryCounter:
    """SQL query sayacı"""
    def __init__(self):
        self.count = 0
        self.queries = []
    
    def reset(self):
        self.count = 0
        self.queries = []
    
    def increment(self, statement):
        self.count += 1
        self.queries.append(str(statement))
        print(f"Query {self.count}: {statement.split()[0:10]}")  # İlk 10 kelime


query_counter = QueryCounter()


@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    """Her SQL query'yi say"""
    query_counter.increment(statement)


def setup_test_data():
    """Test verisi oluştur"""
    print("\n=== Test Verisi Oluşturuluyor ===")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    db = SessionLocal()
    try:
        # 10 WorkOrder oluştur, her birinde 5 WorkOrderItem
        for i in range(1, 11):
            wo = WorkOrder(
                wo_number=f"WO2025TEST{i:03d}",
                cari_id=1,
                cari_code="TEST001",
                cari_title="Test Cari",  # cari_name değil, cari_title
                subject=f"Test WorkOrder {i}",
                description=f"Test açıklaması {i}",
                type="HIZMET",  # SERVICE değil, HIZMET (WorkOrderType enum)
                status="DRAFT",  # PENDING değil, DRAFT (WorkOrderStatus enum)
                priority="MEDIUM"
            )
            db.add(wo)
            db.flush()  # ID almak için
            
            # Her WO için 5 item
            for j in range(1, 6):
                item = WorkOrderItem(
                    work_order_id=wo.id,
                    wo_number=wo.wo_number,
                    item_type="WORKLOG",  # WorkOrderItemType enum
                    # description YOK - sadece notes var
                    notes=f"Item {j} for WO {i}",
                    quantity=1.0,
                    unit="SAAT",  # WORKLOG için SAAT uygun
                    unit_price=100.0,
                    currency="TRY",
                    total_amount=100.0,
                    vat_rate=20.0,
                    vat_amount=20.0,
                    grand_total=120.0
                )
                db.add(item)
        
        db.commit()
        print("✅ 10 WorkOrder + 50 WorkOrderItem oluşturuldu")
    finally:
        db.close()


def test_lazy_loading_problem():
    """
    Lazy loading N+1 problemi testi
    
    Beklenen: 1 main query + 10 lazy query = 11 query
    (Her WorkOrder için items erişiminde 1 ek query)
    
    NOT: lazy="raise" ekledikten sonra bu test DetachedInstanceError verecek
    """
    print("\n=== TEST 1: Lazy Loading (N+1 Problem) ===")
    query_counter.reset()
    
    db = SessionLocal()
    try:
        # Normal query (eager loading YOK)
        work_orders = db.query(WorkOrder).filter(WorkOrder.is_active == True).all()
        print(f"WorkOrder count: {len(work_orders)}")
        
        # Items erişimi (lazy loading tetiklenir)
        try:
            for wo in work_orders:
                _ = wo.items  # Bu satır N+1 problemine sebep olur
                print(f"  WO {wo.wo_number}: {len(wo.items)} items")
        except Exception as e:
            print(f"❌ HATA (beklenen - lazy='raise' aktif): {type(e).__name__}: {str(e)[:100]}")
        
        print(f"Toplam query sayısı: {query_counter.count}")
        if query_counter.count > 5:
            print("⚠️  N+1 problem mevcut (veya lazy='raise' henüz aktif değil)")
        else:
            print("✅ lazy='raise' aktif - DetachedInstanceError bekleniyor")
    finally:
        db.close()


def test_selectinload_list():
    """
    selectinload ile liste optimizasyonu testi
    
    Beklenen: 1 main query + 1 batch IN query = 2 query
    """
    print("\n=== TEST 2: selectinload (Liste Endpoint) ===")
    query_counter.reset()
    
    db = SessionLocal()
    try:
        # selectinload ile eager loading
        work_orders = db.query(WorkOrder).options(
            selectinload(WorkOrder.items)
        ).filter(WorkOrder.is_active == True).all()
        
        print(f"WorkOrder count: {len(work_orders)}")
        
        # Items erişimi (ÖNCEden yüklenmiş)
        for wo in work_orders:
            print(f"  WO {wo.wo_number}: {len(wo.items)} items")
        
        print(f"Toplam query sayısı: {query_counter.count}")
        
        if query_counter.count == 2:
            print("✅ BAŞARILI: 2 query (1 main + 1 batch IN)")
        else:
            print(f"❌ HATA: {query_counter.count} query (beklenen: 2)")
    finally:
        db.close()


def test_joinedload_detail():
    """
    joinedload ile detay optimizasyonu testi
    
    Beklenen: 1 query with LEFT OUTER JOIN
    """
    print("\n=== TEST 3: joinedload (Detay Endpoint) ===")
    query_counter.reset()
    
    db = SessionLocal()
    try:
        # joinedload ile eager loading
        work_order = db.query(WorkOrder).options(
            joinedload(WorkOrder.items)
        ).filter(
            WorkOrder.wo_number == "WO2025TEST001",
            WorkOrder.is_active == True
        ).first()
        
        if work_order:
            print(f"WorkOrder: {work_order.wo_number}")
            print(f"Items: {len(work_order.items)}")
            for item in work_order.items:
                print(f"  - {item.notes}: {item.quantity} {item.unit}")  # description yerine notes
        
        print(f"Toplam query sayısı: {query_counter.count}")
        
        if query_counter.count == 1:
            print("✅ BAŞARILI: 1 query (with JOIN)")
        else:
            print(f"❌ HATA: {query_counter.count} query (beklenen: 1)")
    finally:
        db.close()


def cleanup():
    """Test DB temizle"""
    print("\n=== Temizlik ===")
    import os
    try:
        os.remove("test_eager_loading.db")
        print("✅ Test DB silindi")
    except FileNotFoundError:
        pass


if __name__ == "__main__":
    print("=" * 60)
    print("WorkOrder Eager Loading Validation Test")
    print("=" * 60)
    
    try:
        setup_test_data()
        test_lazy_loading_problem()  # Lazy loading kontrolü (lazy="raise" ile hata vermeli)
        test_selectinload_list()      # Liste endpoint optimizasyonu
        test_joinedload_detail()      # Detay endpoint optimizasyonu
        
        print("\n" + "=" * 60)
        print("TEST TAMAMLANDI")
        print("=" * 60)
    finally:
        cleanup()
