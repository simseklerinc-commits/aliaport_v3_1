import sqlite3
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect('aliaport.db')
cursor = conn.cursor()

# Test kullanıcısı için hash'li şifre
hashed_password = pwd_context.hash("Test1234!")

# Portal kullanıcısı ekle
cursor.execute('''
    INSERT INTO portal_user (email, full_name, hashed_password, cari_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
''', (
    'test@aliaport.com',
    'Test User',
    hashed_password,
    1,  # cari_id
    1,  # is_active
    datetime.now()
))

conn.commit()
print('✅ Portal kullanıcısı oluşturuldu!')
print('   Email: test@aliaport.com')
print('   Şifre: Test1234!')
print('   Cari ID: 1')

conn.close()
