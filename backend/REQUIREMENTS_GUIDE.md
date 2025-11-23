# Requirements Yönetim Kılavuzu

## 📦 Dosya Yapısı

```
backend/
├── requirements.txt              # ✅ Ana bağımlılıklar (geliştirme için)
├── requirements-production.txt   # ✅ Production (sabitleşmiş)
└── requirements-dev.txt          # ✅ Development tools
```

## 🚀 Kullanım

### Development Ortamı
```bash
cd backend
pip install -r requirements.txt
# veya development tools ile:
pip install -r requirements-dev.txt
```

### Production Ortamı
```bash
cd backend
pip install -r requirements-production.txt
```

## 🔒 Versiyon Sabitleme Politikası

### Production (requirements-production.txt)
- **Tüm versiyonlar sabit** (`==` operatörü)
- Breaking change koruması
- Güvenlik güncellemeleri manuel yapılır
- Her değişiklik test edilir

### Development (requirements.txt)
- **Esnek versiyonlar** (`>=` veya `==`)
- Yeni özellikler test edilebilir
- Production'a geçmeden önce test gerekir

## 📝 Güncelleme Prosedürü

### 1. Yeni Paket Ekleme
```bash
# Development'ta test et
pip install yeni-paket==1.0.0

# Çalıştığını doğrula
pytest

# Production requirements'a ekle
echo "yeni-paket==1.0.0" >> requirements-production.txt
```

### 2. Mevcut Paket Güncelleme
```bash
# Mevcut versiyonu kontrol et
pip show paket-adi

# Development'ta yeni versiyonu test et
pip install --upgrade paket-adi

# Test et
pytest

# Production requirements'ı güncelle
# requirements-production.txt'de versiyonu değiştir
```

### 3. Tüm Paketleri Yenileme
```bash
# Mevcut durumu freeze et
pip freeze > requirements-backup.txt

# Yeni versiyonları yükle
pip install --upgrade -r requirements.txt

# Test et
pytest

# Sorun yoksa production'ı güncelle
pip freeze > requirements-production.txt
```

## 🔍 Versiyon Kontrolü

### Kurulu Paketleri Listele
```bash
pip list
```

### Outdated Paketleri Göster
```bash
pip list --outdated
```

### Dependency Tree
```bash
pip install pipdeptree
pipdeptree
```

## ⚠️ Kritik Paketler

### Core Framework
- `fastapi>=0.121.0` - API framework
- `uvicorn>=0.38.0` - ASGI server
- `SQLAlchemy>=2.0.0` - ORM

### Güvenlik Kritik
- `pydantic>=2.0.0` - Validation
- `requests` - HTTP istekleri
- `python-dotenv` - Env variables

## 🐛 Sorun Giderme

### Dependency Conflict
```bash
pip install --force-reinstall -r requirements-production.txt
```

### Cache Temizleme
```bash
pip cache purge
pip install --no-cache-dir -r requirements-production.txt
```

### Virtual Environment Yenileme
```bash
# Mevcut venv'i sil
deactivate
rm -rf venv/

# Yeni venv oluştur
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Requirements yükle
pip install -r requirements-production.txt
```

## 📊 Versiyon Geçmişi

| Tarih | Versiyon | Değişiklik |
|-------|----------|------------|
| 2025-11-23 | 1.0.0 | İlk production freeze |
| - | - | - |

## 🔗 İlgili Dökümanlar

- [PRODUCTION_ROADMAP.md](../PRODUCTION_ROADMAP.md) - Production hazırlık planı
- [README_ENTERPRISE.md](../README_ENTERPRISE.md) - Proje dokümantasyonu
