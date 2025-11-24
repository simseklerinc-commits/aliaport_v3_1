# db_dump_all.py
"""
Tüm veritabanı tablolarındaki verileri (cari, hizmet, motorbot, parametre vs.) konsola yazdırır.
Kullanım: python db_dump_all.py
"""
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.cari.models import Cari
from aliaport_api.modules.hizmet.models import Hizmet
from aliaport_api.modules.motorbot.models import Motorbot
from aliaport_api.modules.parametre.models import Parametre
from aliaport_api.modules.tarife.models import PriceList
from aliaport_api.modules.barinma.models import BarinmaContract
from aliaport_api.modules.isemri.models import WorkOrder
from aliaport_api.modules.guvenlik.models import GateLog
from aliaport_api.modules.auth.models import User


def print_table(name, rows):
    print(f"\n=== {name} (Toplam: {len(rows)}) ===")
    for row in rows:
        print(row)

def main():
    db = SessionLocal()
    try:
        print_table("Cari", db.query(Cari).all())
        print_table("Hizmet", db.query(Hizmet).all())
        print_table("Motorbot", db.query(Motorbot).all())
        print_table("Parametre", db.query(Parametre).all())
        print_table("Tarife", db.query(PriceList).all())
        print_table("Barinma", db.query(BarinmaContract).all())
        print_table("İş Emri", db.query(WorkOrder).all())
        print_table("Güvenlik Log", db.query(GateLog).all())
        print_table("Kullanıcı", db.query(User).all())
    finally:
        db.close()

if __name__ == "__main__":
    main()
