import sqlite3

conn = sqlite3.connect('aliaport.db')
cur = conn.cursor()

# Portal tabloları
tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'portal_%'").fetchall()
print("Portal Tables:")
for t in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
    print(f"  {t[0]}: {count} rows")

conn.close()
