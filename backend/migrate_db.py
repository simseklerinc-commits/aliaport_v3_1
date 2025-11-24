#!/usr/bin/env python3
"""Migrate data from config/database.db to aliaport.db"""
import sys
import shutil
from pathlib import Path

sys.path.insert(0, '.')

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from aliaport_api.config.database import Base

backend_path = Path(__file__).parent

# Source: config/database.db (current)
src_db = backend_path / "aliaport_api" / "config" / "database.db"
# Destination: aliaport.db (new)
dst_db = backend_path / "aliaport.db"

print(f"📦 Veri taşıyıcı")
print(f"Kaynak: {src_db}")
print(f"Hedef: {dst_db}")
print()

if not src_db.exists():
    print(f"❌ Kaynak dosya yok: {src_db}")
    sys.exit(1)

# Source database'i kontrol et
src_url = f"sqlite:///{src_db}"
src_engine = create_engine(src_url, connect_args={"check_same_thread": False})
SrcSession = sessionmaker(bind=src_engine)
src_session = SrcSession()

# Tabloları listele
inspector = inspect(src_engine)
tables = inspector.get_table_names()
print(f"✅ Kaynak tablolar ({len(tables)}):")

table_counts = {}
for table in tables:
    count = src_session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
    table_counts[table] = count
    print(f"   {table}: {count} kayıt")

src_session.close()

# Destination database oluştur ve schema'yı kopyala
dst_url = f"sqlite:///{dst_db}"
dst_engine = create_engine(dst_url, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=dst_engine)

print()
print(f"📋 Hedef database schema oluşturuldu")
print()

# Veriyi taşı (basit SQL copy)
src_engine = create_engine(src_url, connect_args={"check_same_thread": False})
dst_engine = create_engine(dst_url, connect_args={"check_same_thread": False})

SrcSession = sessionmaker(bind=src_engine)
DstSession = sessionmaker(bind=dst_engine)

src_session = SrcSession()
dst_session = DstSession()

migrated_count = 0
for table in tables:
    try:
        # Source'dan oku
        rows = src_session.execute(text(f"SELECT * FROM {table}")).fetchall()
        if not rows:
            print(f"⊘ {table}: veri yok (atlandi)")
            continue
        
        # Destination'a yaz
        for row in rows:
            # INSERT ... VALUES kullanmak gerekse de, ORM ile yapacağız
            pass
        
        # Basit copy: SQL attach
        src_session.connection().execute(text(f"""
            PRAGMA foreign_keys=OFF;
        """))
        
        print(f"✓ {table}: {table_counts[table]} kayıt hazırlanıyor...")
        migrated_count += table_counts[table]
    except Exception as e:
        print(f"⚠ {table}: hata - {e}")

src_session.close()
dst_session.close()

# Daha basit: dosyayı kopyala
print()
print("📝 Dosya kopyalanıyor...")
try:
    shutil.copy2(src_db, dst_db)
    print(f"✅ Dosya kopyalandı: {dst_db}")
except Exception as e:
    print(f"❌ Kopyalama hatası: {e}")
    sys.exit(1)

# Hedef database'i doğrula
print()
print("🔍 Hedef database kontrol ediliyor...")
DstSession = sessionmaker(bind=dst_engine)
dst_session = DstSession()

for table in tables:
    try:
        count = dst_session.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        expected = table_counts.get(table, 0)
        if count == expected:
            print(f"✅ {table}: {count} kayıt (doğru)")
        else:
            print(f"⚠ {table}: {count} kayıt (beklenen: {expected})")
    except Exception as e:
        print(f"❌ {table}: {e}")

dst_session.close()

print()
print("✨ Veri taşıma tamamlandı!")
