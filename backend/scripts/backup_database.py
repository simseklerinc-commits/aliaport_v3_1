"""
Aliaport v3.1 - Database Backup Manager
Otomatik database yedekleme ve retention yönetimi
"""
import os
import shutil
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import sqlite3

# Logging yapılandırması
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseBackupManager:
    """Database backup ve retention yönetimi"""
    
    def __init__(
        self,
        db_path: str = "aliaport.db",
        backup_root: str = "backups/database"
    ):
        """
        Args:
            db_path: Yedeklenecek database dosya yolu
            backup_root: Backup dosyalarının saklanacağı root klasör
        """
        self.db_path = Path(db_path)
        self.backup_root = Path(backup_root)
        
        # Backup klasör yapısı
        self.daily_dir = self.backup_root / "daily"
        self.weekly_dir = self.backup_root / "weekly"
        self.monthly_dir = self.backup_root / "monthly"
        
        # Klasörleri oluştur
        for directory in [self.daily_dir, self.weekly_dir, self.monthly_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def create_backup(self, backup_type: str = "daily") -> Optional[Path]:
        """
        Database backup oluştur
        
        Args:
            backup_type: "daily", "weekly" veya "monthly"
            
        Returns:
            Backup dosya yolu veya None (hata durumunda)
        """
        try:
            # Database dosyası var mı kontrol et
            if not self.db_path.exists():
                logger.error(f"Database dosyası bulunamadı: {self.db_path}")
                return None
            
            # Database boyutunu kontrol et
            db_size = os.path.getsize(self.db_path)
            if db_size == 0:
                logger.warning("Database dosyası boş!")
            
            # Backup dosya adı (timestamp ile)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"aliaport_{backup_type}_{timestamp}.db"
            
            # Hedef dizin
            if backup_type == "weekly":
                target_dir = self.weekly_dir
            elif backup_type == "monthly":
                target_dir = self.monthly_dir
            else:
                target_dir = self.daily_dir
            
            backup_path = target_dir / backup_filename
            
            # SQLite VACUUM ile optimize edilmiş backup
            logger.info(f"Backup başlatılıyor: {backup_path}")
            self._vacuum_copy(self.db_path, backup_path)
            
            # Backup doğrulama
            if self._verify_backup(backup_path):
                backup_size_mb = os.path.getsize(backup_path) / (1024 * 1024)
                logger.info(
                    f"✅ Backup başarılı: {backup_path.name} "
                    f"({backup_size_mb:.2f} MB)"
                )
                return backup_path
            else:
                logger.error(f"❌ Backup doğrulama başarısız: {backup_path}")
                if backup_path.exists():
                    backup_path.unlink()
                return None
                
        except Exception as e:
            logger.error(f"Backup hatası: {e}", exc_info=True)
            return None
    
    def _vacuum_copy(self, source: Path, destination: Path) -> None:
        """
        SQLite VACUUM komutu ile optimize edilmiş kopya oluştur
        
        Args:
            source: Kaynak database
            destination: Hedef backup dosyası
        """
        # Önce düz kopyalama yap
        shutil.copy2(source, destination)
        
        # Sonra VACUUM ile optimize et
        try:
            conn = sqlite3.connect(str(destination))
            conn.execute("VACUUM")
            conn.close()
            logger.debug(f"Database optimize edildi: {destination}")
        except Exception as e:
            logger.warning(f"VACUUM işlemi başarısız (kopya yine de oluşturuldu): {e}")
    
    def _verify_backup(self, backup_path: Path) -> bool:
        """
        Backup dosyasının geçerli bir SQLite database olduğunu doğrula
        
        Args:
            backup_path: Kontrol edilecek backup dosyası
            
        Returns:
            True ise backup geçerli
        """
        try:
            # Dosya var mı ve boyutu > 0 mı?
            if not backup_path.exists() or os.path.getsize(backup_path) == 0:
                return False
            
            # SQLite database olarak açılabiliyor mu?
            conn = sqlite3.connect(str(backup_path))
            cursor = conn.cursor()
            
            # Basit bir sorgu çalıştır
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            conn.close()
            
            # En az bir tablo olmalı
            if len(tables) == 0:
                logger.warning("Backup'ta hiç tablo bulunamadı")
                return False
            
            logger.debug(f"Backup doğrulandı: {len(tables)} tablo bulundu")
            return True
            
        except Exception as e:
            logger.error(f"Backup doğrulama hatası: {e}")
            return False
    
    def cleanup_old_backups(self) -> dict:
        """
        Eski backup'ları retention policy'e göre temizle
        
        Retention Policy:
        - Daily: 30 gün
        - Weekly: 12 hafta (84 gün)
        - Monthly: 12 ay (365 gün)
        
        Returns:
            Silinen dosya sayıları {"daily": 3, "weekly": 1, "monthly": 0}
        """
        now = datetime.now()
        deleted_counts = {"daily": 0, "weekly": 0, "monthly": 0}
        
        # Daily backups - 30 gün
        deleted_counts["daily"] = self._cleanup_directory(
            self.daily_dir, 
            timedelta(days=30),
            now
        )
        
        # Weekly backups - 12 hafta
        deleted_counts["weekly"] = self._cleanup_directory(
            self.weekly_dir,
            timedelta(days=84),
            now
        )
        
        # Monthly backups - 12 ay
        deleted_counts["monthly"] = self._cleanup_directory(
            self.monthly_dir,
            timedelta(days=365),
            now
        )
        
        total_deleted = sum(deleted_counts.values())
        if total_deleted > 0:
            logger.info(f"🗑️ Eski backup'lar temizlendi: {deleted_counts}")
        
        return deleted_counts
    
    def _cleanup_directory(
        self, 
        directory: Path, 
        max_age: timedelta,
        now: datetime
    ) -> int:
        """
        Belirli bir dizindeki eski dosyaları sil
        
        Args:
            directory: Temizlenecek dizin
            max_age: Maksimum yaş (timedelta)
            now: Şu anki zaman
            
        Returns:
            Silinen dosya sayısı
        """
        deleted_count = 0
        
        try:
            for backup_file in directory.glob("*.db"):
                # Dosya yaşını kontrol et
                file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                file_age = now - file_time
                
                if file_age > max_age:
                    try:
                        backup_file.unlink()
                        deleted_count += 1
                        logger.debug(
                            f"Eski backup silindi: {backup_file.name} "
                            f"(yaş: {file_age.days} gün)"
                        )
                    except Exception as e:
                        logger.error(f"Dosya silinirken hata: {backup_file.name} - {e}")
        
        except Exception as e:
            logger.error(f"Dizin temizleme hatası: {directory} - {e}")
        
        return deleted_count
    
    def get_backup_stats(self) -> dict:
        """
        Backup istatistiklerini al
        
        Returns:
            {
                "daily": {"count": 5, "total_size_mb": 12.3},
                "weekly": {"count": 3, "total_size_mb": 8.1},
                "monthly": {"count": 2, "total_size_mb": 5.4}
            }
        """
        stats = {}
        
        for backup_type, directory in [
            ("daily", self.daily_dir),
            ("weekly", self.weekly_dir),
            ("monthly", self.monthly_dir)
        ]:
            backup_files = list(directory.glob("*.db"))
            total_size = sum(f.stat().st_size for f in backup_files)
            
            stats[backup_type] = {
                "count": len(backup_files),
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "files": [f.name for f in sorted(backup_files, reverse=True)[:5]]
            }
        
        return stats
    
    def restore_from_backup(self, backup_path: Path) -> bool:
        """
        Backup'tan restore et (İLERİ SEVİYE - DİKKATLE KULLAN!)
        
        Args:
            backup_path: Restore edilecek backup dosyası
            
        Returns:
            True ise restore başarılı
        """
        try:
            # Backup dosyası geçerli mi?
            if not self._verify_backup(backup_path):
                logger.error(f"Geçersiz backup dosyası: {backup_path}")
                return False
            
            # Mevcut database'in yedeğini al (safety)
            safety_backup = self.db_path.parent / f"aliaport_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            if self.db_path.exists():
                shutil.copy2(self.db_path, safety_backup)
                logger.info(f"Güvenlik yedeği oluşturuldu: {safety_backup}")
            
            # Restore
            shutil.copy2(backup_path, self.db_path)
            logger.info(f"✅ Restore başarılı: {backup_path} -> {self.db_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Restore hatası: {e}", exc_info=True)
            return False


def scheduled_backup():
    """
    APScheduler için günlük backup fonksiyonu
    Her gün saat 03:00'da çalışır
    """
    logger.info("=" * 60)
    logger.info("GÜNLÜK BACKUP BAŞLADI")
    logger.info("=" * 60)
    
    manager = DatabaseBackupManager()
    
    # Backup oluştur
    backup_path = manager.create_backup(backup_type="daily")
    
    if backup_path:
        # Haftalık backup (Pazar günleri)
        if datetime.now().weekday() == 6:  # Sunday = 6
            logger.info("📅 Pazar günü - Haftalık backup oluşturuluyor...")
            manager.create_backup(backup_type="weekly")
        
        # Aylık backup (Ayın 1'i)
        if datetime.now().day == 1:
            logger.info("📅 Ayın ilk günü - Aylık backup oluşturuluyor...")
            manager.create_backup(backup_type="monthly")
        
        # Eski backup'ları temizle
        manager.cleanup_old_backups()
        
        # İstatistikleri logla
        stats = manager.get_backup_stats()
        logger.info("📊 Backup İstatistikleri:")
        for backup_type, data in stats.items():
            logger.info(
                f"  {backup_type.capitalize()}: {data['count']} dosya, "
                f"{data['total_size_mb']} MB"
            )
    else:
        logger.error("❌ Günlük backup başarısız!")
    
    logger.info("=" * 60)


if __name__ == "__main__":
    """Test ve manuel çalıştırma için"""
    print("Aliaport Database Backup Manager")
    print("=" * 60)
    
    # Test backup
    manager = DatabaseBackupManager()
    
    print("\n1. Manuel backup oluşturuluyor...")
    backup_path = manager.create_backup(backup_type="daily")
    
    if backup_path:
        print(f"✅ Backup başarılı: {backup_path}")
    else:
        print("❌ Backup başarısız!")
    
    print("\n2. Backup istatistikleri:")
    stats = manager.get_backup_stats()
    for backup_type, data in stats.items():
        print(f"\n{backup_type.upper()}:")
        print(f"  Dosya sayısı: {data['count']}")
        print(f"  Toplam boyut: {data['total_size_mb']} MB")
        if data['files']:
            print(f"  Son backups:")
            for f in data['files']:
                print(f"    - {f}")
    
    print("\n3. Eski backup temizleme...")
    deleted = manager.cleanup_old_backups()
    print(f"  Silinen dosyalar: {deleted}")
    
    print("\n" + "=" * 60)
    print("✅ Test tamamlandı")
