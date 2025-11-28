from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# SQLAlchemy engine
engine = create_engine('sqlite:///aliaport.db')
Session = sessionmaker(bind=engine)
db = Session()

# Raw SQL ile test
print("=== RAW SQL TEST ===")
result = db.execute(text("SELECT id, email, cari_id FROM portal_user WHERE email='test@aliaport.com'"))
user = result.fetchone()
print(f"Portal User: id={user[0]}, email={user[1]}, cari_id={user[2]}")

cari_id = user[2]
print(f"\n=== EMPLOYEES for cari_id={cari_id} ===")
result = db.execute(text(f"SELECT id, full_name, tc_kimlik, position FROM portal_employee WHERE cari_id={cari_id} LIMIT 5"))
for row in result:
    print(f"  {row[0]}: {row[1]} ({row[3]})")

print(f"\n=== VEHICLES for cari_id={cari_id} ===")
result = db.execute(text(f"SELECT id, plaka, marka, model FROM portal_vehicle WHERE cari_id={cari_id} LIMIT 5"))
for row in result:
    print(f"  {row[0]}: {row[1]} - {row[2]} {row[3]}")

db.close()
