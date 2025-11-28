import sys
sys.path.insert(0, 'C:\\Aliaport\\Aliaport_v3_1\\backend')

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///C:\\Aliaport\\Aliaport_v3_1\\backend\\aliaport.db')
Session = sessionmaker(bind=engine)
db = Session()

# Raw SQL
print("=== RAW SQL QUERY ===")
result = db.execute(text("SELECT COUNT(*) FROM portal_employee WHERE cari_id=238"))
count = result.scalar()
print(f"SQL Count: {count}")

result = db.execute(text("SELECT id, full_name FROM portal_employee WHERE cari_id=238 ORDER BY id LIMIT 5"))
rows = result.fetchall()
print("\nFirst 5:")
for r in rows:
    print(f"  {r[0]}: {r[1]}")

# ORM Query
print("\n=== SQLALCHEMY ORM QUERY ===")
try:
    from aliaport_api.modules.dijital_arsiv.models import PortalEmployee
    
    emps = db.query(PortalEmployee).filter(PortalEmployee.cari_id == 238).all()
    print(f"ORM Count: {len(emps)}")
    print("\nFirst 5:")
    for emp in emps[:5]:
        print(f"  {emp.id}: {emp.full_name}")
except Exception as e:
    print(f"ORM Error: {e}")

db.close()
