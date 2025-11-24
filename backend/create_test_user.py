#!/usr/bin/env python3
"""
Test kullanıcı oluştur
"""
import sys
import os
from pathlib import Path

# Backend dizinine git
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from aliaport_api.modules.auth.models import User, Role
from aliaport_api.modules.auth.utils import hash_password
from aliaport_api.config.database import Base

# Veritabanı bağlantısı (aliaport.db - backend root)
db_file = backend_path / "aliaport.db"
DATABASE_URL = f"sqlite:///{db_file.absolute()}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

Session = sessionmaker(bind=engine)
session = Session()

def create_test_user():
    """Test kullanıcı oluştur (şifresiz giriş için)"""
    
    # Mevcut admin kontrol et
    admin = session.query(User).filter(User.email == "admin@aliaport.com").first()
    if admin:
        print(f"✓ Admin zaten var: {admin.email}")
        session.close()
        return
    
    # Admin role'ü kontrol et
    admin_role = session.query(Role).filter(Role.name == "ADMIN").first()
    if not admin_role:
        admin_role = Role(
            name="ADMIN",
            description="Sistem Yöneticisi",
            is_active=True
        )
        session.add(admin_role)
        session.flush()
    
    # Yeni admin oluştur (şifresiz login için hiç password set etmeyebiliriz)
    user = User(
        email="admin@aliaport.com",
        full_name="Sistem Yöneticisi",
        hashed_password="",  # Şifresiz
        is_active=True,
        is_superuser=True
    )
    user.roles.append(admin_role)
    session.add(user)
    session.commit()
    
    print(f"✅ Admin oluşturuldu: admin@aliaport.com (şifresiz giriş)")
    session.close()

if __name__ == '__main__':
    create_test_user()
