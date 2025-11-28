"""
portal_user tablosunu oluştur
DİKKAT: Tasarımın bir parçası olan ForeignKey silmeden tablo oluşturuluyor
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'aliaport_api')))

from sqlalchemy import text
from aliaport_api.config.database import engine

def create_portal_user_table():
    """portal_user tablosunu oluştur"""
    
    print("\n" + "="*60)
    print("🔧 PORTAL_USER TABLOSU OLUŞTURULUYOR")
    print("="*60)
    
    with engine.connect() as conn:
        # 1. Tablo var mı kontrol et
        result = conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='portal_user'
        """))
        
        if result.fetchone():
            print("\n✅ portal_user tablosu zaten mevcut")
            return
        
        # 2. portal_user tablosunu oluştur
        print("\n📋 portal_user tablosu oluşturuluyor...")
        conn.execute(text("""
            CREATE TABLE portal_user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cari_id INTEGER NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                position VARCHAR(100),
                is_admin BOOLEAN DEFAULT 0 NOT NULL,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                must_change_password BOOLEAN DEFAULT 1 NOT NULL,
                password_reset_token VARCHAR(255),
                password_reset_expires DATETIME,
                last_login DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                created_by INTEGER,
                FOREIGN KEY (cari_id) REFERENCES Cari(Id)
            )
        """))
        conn.commit()
        print("   ✅ portal_user tablosu oluşturuldu")
        
        # 3. İndeksler oluştur
        print("\n📋 İndeksler oluşturuluyor...")
        conn.execute(text("CREATE INDEX idx_portal_user_cari_id ON portal_user(cari_id)"))
        conn.execute(text("CREATE INDEX idx_portal_user_email ON portal_user(email)"))
        conn.execute(text("CREATE INDEX idx_portal_user_reset_token ON portal_user(password_reset_token)"))
        conn.commit()
        print("   ✅ İndeksler oluşturuldu")
        
        print("\n" + "="*60)
        print("✅ PORTAL_USER TABLOSU HAZIR!")
        print("="*60)
        print("\n💡 ForeignKey tasarımda korundu, tablo oluşturuldu")
        print("💡 work_order.portal_user_id artık çalışacak")


if __name__ == "__main__":
    create_portal_user_table()
