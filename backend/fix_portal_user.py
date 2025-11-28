import sqlite3
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# Eski kullanıcıyı sil
cursor.execute("DELETE FROM portal_user WHERE email='test@aliaport.com'")

# Yeni kullanıcıyı ID=2 ile oluştur
hashed_pw = pwd_context.hash("Test1234!")
cursor.execute("""
    INSERT INTO portal_user (id, email, full_name, hashed_password, cari_id, is_active, created_at)
    VALUES (2, 'test@aliaport.com', 'Test User', ?, 1, 1, ?)
""", (hashed_pw, datetime.now()))

conn.commit()
print("✅ Portal kullanıcısı ID=2 ile oluşturuldu")
conn.close()
