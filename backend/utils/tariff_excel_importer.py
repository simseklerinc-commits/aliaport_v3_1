"""
TARIFF EXCEL IMPORTER
Excel dosyasından TarifeListesi import/export aracı

Özellikler:
- Excel (.xlsx) dosyasından tarife listesi okuma
- CalculationType mapping (Excel → Backend enum)
- TarifeListesi kayıt oluşturma
- Hizmet tablosu ile ilişkilendirme
- Batch import desteği
- Export: Mevcut tarifeleri Excel'e aktarma
- Hata raporlama ve validation

Excel Formatı:
- Sheet: "TarifeListesi"
- Kolonlar:
  * HizmetKod (string): Hizmet kodu (zorunlu)
  * BaseFiyat (float): Baz fiyat (zorunlu)
  * ParaBirimi (string): Para birimi (örn: USD, EUR, TRY)
  * ValidFrom (date): Geçerlilik başlangıç tarihi
  * ValidTo (date): Geçerlilik bitiş tarihi
  * CalculationType (string): Hesaplama tipi
  * IsActive (bool): Aktif mi? (default: True)
  * VersionNote (string): Versiyon notu
  * FormulaParams (JSON string): Formül parametreleri

CalculationType Mapping (Excel → Backend):
- "Sabit" → FIXED
- "Kişi Başı" → PER_UNIT
- "GT × Oran × Kişi" → X_SECONDARY
- "Blok Başına" → PER_BLOCK
- "Baz + Artış" → BASE_PLUS_INCREMENT
- "4 Saat Kuralı" → VEHICLE_4H_RULE

Kullanım:
    from utils.tariff_excel_importer import TariffExcelImporter
    
    # Import
    importer = TariffExcelImporter(db_session)
    results = importer.import_from_excel("tarife_listesi.xlsx")
    print(f"Başarılı: {results['success_count']}, Hata: {results['error_count']}")
    
    # Export
    importer.export_to_excel("tarife_export.xlsx", active_only=True)
"""

import pandas as pd
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

# Backend imports (adjust paths as needed)
from aliaport_api.modules.hizmet.models import Hizmet, TarifeListesi, CalculationType
from aliaport_api.core.database import get_db


class TariffExcelImporter:
    """Excel tarife listesi import/export aracı"""
    
    # CalculationType mapping: Excel → Backend
    CALCULATION_TYPE_MAPPING = {
        "Sabit": CalculationType.FIXED,
        "Kişi Başı": CalculationType.PER_UNIT,
        "GT × Oran × Kişi": CalculationType.X_SECONDARY,
        "Blok Başına": CalculationType.PER_BLOCK,
        "Baz + Artış": CalculationType.BASE_PLUS_INCREMENT,
        "4 Saat Kuralı": CalculationType.VEHICLE_4H_RULE,
    }
    
    # Reverse mapping for export
    CALCULATION_TYPE_REVERSE = {v.value: k for k, v in CALCULATION_TYPE_MAPPING.items()}
    
    def __init__(self, db: Session):
        """
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    def import_from_excel(
        self,
        file_path: str,
        sheet_name: str = "TarifeListesi",
        created_by_user_id: Optional[int] = None,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Excel dosyasından tarife listesini import et
        
        Args:
            file_path: Excel dosya yolu
            sheet_name: Sheet adı (default: "TarifeListesi")
            created_by_user_id: Oluşturan kullanıcı ID (opsiyonel)
            dry_run: True ise sadece validate et, kaydetme (test için)
        
        Returns:
            Dict with keys: success_count, error_count, errors, imported_tariffs
        """
        results = {
            "success_count": 0,
            "error_count": 0,
            "errors": [],
            "imported_tariffs": []
        }
        
        try:
            # Read Excel
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Validate required columns
            required_cols = ["HizmetKod", "BaseFiyat", "ParaBirimi"]
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Eksik kolonlar: {', '.join(missing_cols)}")
            
            # Process each row
            for idx, row in df.iterrows():
                try:
                    tariff = self._process_row(row, created_by_user_id, idx)
                    
                    if not dry_run:
                        self.db.add(tariff)
                        self.db.flush()  # Flush to get ID
                        results["imported_tariffs"].append({
                            "id": tariff.Id,
                            "hizmet_kod": row["HizmetKod"],
                            "fiyat": row["BaseFiyat"],
                            "valid_from": tariff.ValidFrom.isoformat() if tariff.ValidFrom else None,
                        })
                    
                    results["success_count"] += 1
                    
                except Exception as e:
                    results["error_count"] += 1
                    results["errors"].append({
                        "row": idx + 2,  # Excel row number (1-indexed + header)
                        "hizmet_kod": row.get("HizmetKod", "N/A"),
                        "error": str(e)
                    })
            
            # Commit if not dry run
            if not dry_run and results["success_count"] > 0:
                self.db.commit()
            else:
                self.db.rollback()
        
        except Exception as e:
            self.db.rollback()
            results["errors"].append({
                "row": "GLOBAL",
                "error": f"Excel okuma hatası: {str(e)}"
            })
            results["error_count"] += 1
        
        return results
    
    def _process_row(
        self,
        row: pd.Series,
        created_by_user_id: Optional[int],
        row_idx: int
    ) -> TarifeListesi:
        """
        Tek satırı işle ve TarifeListesi nesnesi oluştur
        
        Args:
            row: Pandas row (Series)
            created_by_user_id: Oluşturan kullanıcı ID
            row_idx: Satır indeksi (hata raporlama için)
        
        Returns:
            TarifeListesi instance
        
        Raises:
            ValueError: Validation hatası durumunda
        """
        # 1. Hizmet lookup
        hizmet_kod = str(row["HizmetKod"]).strip()
        hizmet = self.db.execute(
            select(Hizmet).where(Hizmet.Kod == hizmet_kod)
        ).scalar_one_or_none()
        
        if not hizmet:
            raise ValueError(f"Hizmet bulunamadı: {hizmet_kod}")
        
        # 2. Parse dates
        valid_from = self._parse_date(row.get("ValidFrom"))
        valid_to = self._parse_date(row.get("ValidTo"))
        
        # 3. Parse CalculationType
        calc_type_str = str(row.get("CalculationType", "")).strip() if pd.notna(row.get("CalculationType")) else None
        calc_type = None
        if calc_type_str and calc_type_str in self.CALCULATION_TYPE_MAPPING:
            calc_type = self.CALCULATION_TYPE_MAPPING[calc_type_str].value
        
        # 4. Parse FormulaParams (JSON string)
        formula_params = None
        if pd.notna(row.get("FormulaParams")):
            try:
                formula_params = json.loads(str(row["FormulaParams"]))
            except json.JSONDecodeError:
                # Ignore malformed JSON, leave as None
                pass
        
        # 5. Create TarifeListesi instance
        tariff = TarifeListesi(
            HizmetId=hizmet.Id,
            OverridePrice=float(row["BaseFiyat"]),
            Currency=str(row.get("ParaBirimi", "USD")).strip().upper(),
            ValidFrom=valid_from,
            ValidTo=valid_to,
            CalculationType=calc_type,
            FormulaParams=formula_params,
            IsActive=bool(row.get("IsActive", True)) if pd.notna(row.get("IsActive")) else True,
            VersionNote=str(row.get("VersionNote", "")).strip() if pd.notna(row.get("VersionNote")) else None,
            CreatedBy=created_by_user_id,
        )
        
        return tariff
    
    def _parse_date(self, date_value: Any) -> Optional[datetime]:
        """
        Parse date from Excel cell (handles multiple formats)
        
        Args:
            date_value: Date value from Excel (can be datetime, string, or NaN)
        
        Returns:
            datetime object or None
        """
        if pd.isna(date_value):
            return None
        
        if isinstance(date_value, datetime):
            return date_value
        
        if isinstance(date_value, str):
            # Try common date formats
            for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"]:
                try:
                    return datetime.strptime(date_value.strip(), fmt)
                except ValueError:
                    continue
        
        return None
    
    def export_to_excel(
        self,
        output_path: str,
        active_only: bool = True,
        hizmet_kod_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Mevcut tarifeleri Excel'e export et
        
        Args:
            output_path: Çıktı Excel dosya yolu
            active_only: Sadece aktif tarifeleri export et (default: True)
            hizmet_kod_filter: Sadece belirtilen hizmet kodlarını export et (opsiyonel)
        
        Returns:
            Dict with keys: exported_count, file_path
        """
        # Build query
        query = select(TarifeListesi).join(Hizmet, TarifeListesi.HizmetId == Hizmet.Id)
        
        if active_only:
            query = query.where(TarifeListesi.IsActive == True)
        
        if hizmet_kod_filter:
            query = query.where(Hizmet.Kod.in_(hizmet_kod_filter))
        
        # Execute query
        tariffs = self.db.execute(query).scalars().all()
        
        # Build DataFrame
        data = []
        for tariff in tariffs:
            hizmet = self.db.get(Hizmet, tariff.HizmetId)
            
            # Reverse map CalculationType
            calc_type_excel = self.CALCULATION_TYPE_REVERSE.get(tariff.CalculationType, tariff.CalculationType)
            
            data.append({
                "HizmetKod": hizmet.Kod if hizmet else "N/A",
                "HizmetAd": hizmet.Ad if hizmet else "N/A",
                "BaseFiyat": tariff.OverridePrice,
                "ParaBirimi": tariff.Currency,
                "ValidFrom": tariff.ValidFrom.strftime("%Y-%m-%d") if tariff.ValidFrom else None,
                "ValidTo": tariff.ValidTo.strftime("%Y-%m-%d") if tariff.ValidTo else None,
                "CalculationType": calc_type_excel,
                "FormulaParams": json.dumps(tariff.FormulaParams) if tariff.FormulaParams else None,
                "IsActive": tariff.IsActive,
                "VersionNote": tariff.VersionNote,
                "CreatedAt": tariff.CreatedAt.strftime("%Y-%m-%d %H:%M:%S") if tariff.CreatedAt else None,
            })
        
        # Create DataFrame and export
        df = pd.DataFrame(data)
        df.to_excel(output_path, sheet_name="TarifeListesi", index=False)
        
        return {
            "exported_count": len(tariffs),
            "file_path": output_path
        }


# CLI Script
if __name__ == "__main__":
    import argparse
    from aliaport_api.core.database import SessionLocal
    
    parser = argparse.ArgumentParser(description="Tariff Excel Importer/Exporter")
    parser.add_argument("action", choices=["import", "export"], help="Import or export")
    parser.add_argument("file", help="Excel file path")
    parser.add_argument("--sheet", default="TarifeListesi", help="Sheet name (default: TarifeListesi)")
    parser.add_argument("--user-id", type=int, help="Created by user ID (for import)")
    parser.add_argument("--dry-run", action="store_true", help="Dry run (validate only, don't save)")
    parser.add_argument("--active-only", action="store_true", help="Export active tariffs only")
    
    args = parser.parse_args()
    
    # Create DB session
    db = SessionLocal()
    
    try:
        importer = TariffExcelImporter(db)
        
        if args.action == "import":
            print(f"Importing tariffs from {args.file}...")
            results = importer.import_from_excel(
                file_path=args.file,
                sheet_name=args.sheet,
                created_by_user_id=args.user_id,
                dry_run=args.dry_run
            )
            
            print(f"\n✅ Başarılı: {results['success_count']}")
            print(f"❌ Hata: {results['error_count']}")
            
            if results["errors"]:
                print("\nHatalar:")
                for err in results["errors"]:
                    print(f"  - Satır {err['row']}: {err['error']}")
            
            if results["imported_tariffs"] and not args.dry_run:
                print("\nİçe Aktarılan Tarifeler:")
                for tariff in results["imported_tariffs"][:5]:  # İlk 5'i göster
                    print(f"  - {tariff['hizmet_kod']}: {tariff['fiyat']} (ValidFrom: {tariff['valid_from']})")
                if len(results["imported_tariffs"]) > 5:
                    print(f"  ... ve {len(results['imported_tariffs']) - 5} tarife daha")
        
        elif args.action == "export":
            print(f"Exporting tariffs to {args.file}...")
            results = importer.export_to_excel(
                output_path=args.file,
                active_only=args.active_only
            )
            
            print(f"\n✅ Export tamamlandı: {results['exported_count']} tarife")
            print(f"📄 Dosya: {results['file_path']}")
    
    except Exception as e:
        print(f"\n❌ HATA: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()
