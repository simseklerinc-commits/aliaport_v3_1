"""Temizle: work_order, work_order_person, archive_document, gatelog, worklog"""
import sqlite3

db_path = "database/aliaport.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ["work_order_person", "archive_document", "gatelog", "worklog", "work_order"]

for table in tables:
    cursor.execute(f"DELETE FROM {table}")
    print(f"✅ {table}: {cursor.rowcount} kayıt silindi")

conn.commit()
conn.close()
print("\n🎯 Temizlik tamamlandı!")
