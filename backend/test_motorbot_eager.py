"""
Motorbot Eager Loading Validation Test
N+1 sorgu probleminin çözüldüğünü doğrula
"""

import sys
from pathlib import Path
from datetime import date, datetime

# Backend path'i ekle
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from aliaport_api.config.database import Base
from aliaport_api.modules.motorbot.models import Motorbot, MbTrip
from aliaport_api.modules.cari.models import Cari  # FK dependency
from sqlalchemy.orm import selectinload, joinedload


# Test database setup (foreign_keys=False - Cari tablosu olmadan test için)
TEST_DB_URL = "sqlite:///./test_motorbot_eager.db"
engine = create_engine(TEST_DB_URL, echo=False, connect_args={"check_same_thread": False})
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
        print(f"Query {self.count}: {statement.split()[0:10]}")


query_counter = QueryCounter()


@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    """Her SQL query'yi say"""
    query_counter.increment(statement)


def setup_test_data():
    """Test verisi oluştur"""
    print("\n=== Test Verisi Oluşturuluyor ===")
    
    # FK constraint'leri disable et (Cari tablosu olmadığı için)
    with engine.connect() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        conn.commit()
    
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    db = SessionLocal()
    try:
        # 5 Motorbot oluştur, her birinde 3 MbTrip
        for i in range(1, 6):
            mb = Motorbot(
                Kod=f"MB{i:03d}",
                Ad=f"Motorbot {i}",
                Plaka=f"34 TEST {i:03d}",
                KapasiteTon=50.0,
                MaxHizKnot=15.0,
                Durum="AKTIF"
            )
            db.add(mb)
            db.flush()  # ID almak için
            
            # Her motorbot için 3 sefer
            for j in range(1, 4):
                trip = MbTrip(
                    MotorbotId=mb.Id,
                    SeferTarihi=date.today(),
                    KalkisIskele=f"İskele {j}",
                    VarisIskele=f"Varis {j}",
                    YukAciklama=f"Yük {j} for MB {i}",
                    Durum="PLANLANDI"
                )
                db.add(trip)
        
        db.commit()
        print("✅ 5 Motorbot + 15 MbTrip oluşturuldu")
    finally:
        db.close()


def test_lazy_loading_problem():
    """
    Lazy loading N+1 problemi testi
    
    Beklenen: lazy="raise" ile InvalidRequestError
    """
    print("\n=== TEST 1: Lazy Loading (N+1 Problem) ===")
    query_counter.reset()
    
    db = SessionLocal()
    try:
        # Normal query (eager loading YOK)
        motorbotlar = db.query(Motorbot).all()
        print(f"Motorbot count: {len(motorbotlar)}")
        
        # trips erişimi (lazy loading tetiklenir)
        try:
            for mb in motorbotlar:
                _ = mb.trips
                print(f"  MB {mb.Kod}: {len(mb.trips)} trips")
        except Exception as e:
            print(f"❌ HATA (beklenen - lazy='raise' aktif): {type(e).__name__}: {str(e)[:100]}")
        
        print(f"Toplam query sayısı: {query_counter.count}")
        if query_counter.count > 5:
            print("⚠️  N+1 problem mevcut (veya lazy='raise' henüz aktif değil)")
        else:
            print("✅ lazy='raise' aktif - InvalidRequestError bekleniyor")
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
        motorbotlar = db.query(Motorbot).options(
            selectinload(Motorbot.trips)
        ).all()
        
        print(f"Motorbot count: {len(motorbotlar)}")
        
        # trips erişimi (ÖNCEden yüklenmiş)
        for mb in motorbotlar:
            print(f"  MB {mb.Kod}: {len(mb.trips)} trips")
        
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
        motorbot = db.query(Motorbot).options(
            joinedload(Motorbot.trips)
        ).filter(Motorbot.Kod == "MB001").first()
        
        if motorbot:
            print(f"Motorbot: {motorbot.Kod} - {motorbot.Ad}")
            print(f"Trips: {len(motorbot.trips)}")
            for trip in motorbot.trips:
                print(f"  - {trip.KalkisIskele} → {trip.VarisIskele}")
        
        print(f"Toplam query sayısı: {query_counter.count}")
        
        if query_counter.count == 1:
            print("✅ BAŞARILI: 1 query (with JOIN)")
        else:
            print(f"❌ HATA: {query_counter.count} query (beklenen: 1)")
    finally:
        db.close()


def test_mbtrip_joinedload():
    """
    MbTrip.motorbot joinedload testi
    
    Beklenen: 1 query with JOIN
    """
    print("\n=== TEST 4: MbTrip.motorbot joinedload ===")
    query_counter.reset()
    
    db = SessionLocal()
    try:
        # joinedload ile motorbot relation
        trips = db.query(MbTrip).options(
            joinedload(MbTrip.motorbot)
        ).limit(5).all()
        
        print(f"MbTrip count: {len(trips)}")
        
        # motorbot erişimi (ÖNCEden yüklenmiş)
        for trip in trips:
            print(f"  Trip {trip.Id}: {trip.motorbot.Kod} - {trip.KalkisIskele}")
        
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
        os.remove("test_motorbot_eager.db")
        print("✅ Test DB silindi")
    except (FileNotFoundError, PermissionError):
        pass


if __name__ == "__main__":
    print("=" * 60)
    print("Motorbot Eager Loading Validation Test")
    print("=" * 60)
    
    try:
        setup_test_data()
        test_lazy_loading_problem()  # lazy="raise" kontrolü
        test_selectinload_list()      # Liste endpoint optimizasyonu
        test_joinedload_detail()      # Detay endpoint optimizasyonu
        test_mbtrip_joinedload()      # MbTrip reverse relation
        
        print("\n" + "=" * 60)
        print("TEST TAMAMLANDI")
        print("=" * 60)
    finally:
        cleanup()
