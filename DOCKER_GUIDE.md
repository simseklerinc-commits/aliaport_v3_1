# Aliaport v3.1 - Docker Deployment Guide

## Gereksinimler
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ Disk

## Hızlı Başlangıç

### 1. Environment Dosyası Oluştur
```bash
# Production için
cp .env.production.example .env.production

# JWT secret key oluştur
openssl rand -hex 32

# .env.production dosyasını düzenle:
# - DB_PASSWORD: Güçlü bir şifre
# - JWT_SECRET_KEY: Yukarıda oluşturduğun key
# - EVDS_API_KEY: TCMB'den aldığınız key
# - ALLOWED_ORIGINS: Frontend domain'leriniz
```

### 2. İlk Çalıştırma (Production)
```bash
# Environment variables yükle
export $(cat .env.production | xargs)

# Servisleri başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Database migration çalıştır (ilk kurulumda)
docker-compose exec backend alembic upgrade head

# Admin kullanıcı oluştur
docker-compose exec backend python -c "
from aliaport_api.modules.auth.models import User
from aliaport_api.config.database import SessionLocal
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

admin = User(
    username='admin',
    email='admin@aliaport.com',
    password_hash=pwd_context.hash('admin123'),
    full_name='System Administrator',
    role='SISTEM_YONETICISI',
    is_active=True
)
db.add(admin)
db.commit()
print('✅ Admin user created: admin / admin123')
"
```

### 3. Development Mode
```bash
# Development compose override ile çalıştır
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Hot reload aktif, kod değişiklikleri otomatik yansır
```

## Servis URL'leri

| Servis | URL | Açıklama |
|--------|-----|----------|
| Frontend | http://localhost | React UI (Nginx) |
| Backend API | http://localhost:8000 | FastAPI endpoints |
| API Docs | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## Yaygın Komutlar

### Servis Yönetimi
```bash
# Tüm servisleri başlat (detached mode)
docker-compose up -d

# Tüm servisleri durdur
docker-compose down

# Servisleri durdur ve volumeleri sil (DİKKAT: Veri kaybı!)
docker-compose down -v

# Belirli bir servisi restart et
docker-compose restart backend

# Servis durumunu kontrol et
docker-compose ps

# Kaynak kullanımını görüntüle
docker-compose stats
```

### Log İzleme
```bash
# Tüm servis logları
docker-compose logs -f

# Sadece backend
docker-compose logs -f backend

# Sadece son 100 satır
docker-compose logs --tail=100 backend

# Belirli bir tarihten itibaren
docker-compose logs --since 2025-11-23T10:00:00
```

### Database İşlemleri
```bash
# Database migration
docker-compose exec backend alembic upgrade head

# Migration geri al
docker-compose exec backend alembic downgrade -1

# PostgreSQL shell
docker-compose exec db psql -U aliaport -d aliaport

# Database backup
docker-compose exec backend python scripts/backup_database.py

# Backup restore (container içinden)
docker-compose exec backend python -c "
from scripts.backup_database import DatabaseBackupManager
from pathlib import Path
manager = DatabaseBackupManager()
manager.restore_from_backup(Path('backups/database/daily/aliaport_daily_YYYYMMDD_HHMMSS.db'))
"
```

### Container İçine Erişim
```bash
# Backend shell
docker-compose exec backend /bin/sh

# Frontend shell
docker-compose exec frontend /bin/sh

# Database shell
docker-compose exec db psql -U aliaport
```

## Production Deployment Checklist

- [ ] `.env.production` dosyası oluşturuldu ve güvende saklanıyor
- [ ] `JWT_SECRET_KEY` kuvvetli ve rastgele (32+ karakter)
- [ ] `DB_PASSWORD` kuvvetli ve benzersiz
- [ ] `ALLOWED_ORIGINS` sadece gerçek domain'leri içeriyor
- [ ] `EVDS_API_KEY` geçerli
- [ ] SSL/TLS sertifikası kuruldu (Nginx reverse proxy ön tarafta)
- [ ] Database backupları otomatik çalışıyor (test edildi)
- [ ] Monitoring/alerting aktif
- [ ] Log rotation yapılandırıldı
- [ ] Firewall kuralları ayarlandı (sadece 80/443 dışa açık)

## Güvenlik Notları

1. **Asla** `.env.production` dosyasını git'e eklemeyin
2. **Default şifreleri değiştirin** (DB_PASSWORD, admin kullanıcı)
3. **JWT_SECRET_KEY** her environment'ta farklı olmalı
4. **PostgreSQL port** (5432) production'da dışa kapatılmalı (internal network only)
5. **Redis port** (6379) dışa kapatılmalı
6. **SSL/TLS** zorunlu (Nginx reverse proxy veya load balancer ile)

## SSL/TLS Kurulumu (Let's Encrypt)

```bash
# Certbot ile SSL sertifikası al
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  -d yourdomain.com -d www.yourdomain.com

# Nginx SSL config ekle (docker-compose.yml'de volume mount)
# frontend/nginx-ssl.conf oluştur ve /etc/nginx/conf.d/ssl.conf'a mount et
```

## Monitoring & Health Checks

### Health Endpoints
```bash
# Frontend health
curl http://localhost/health

# Backend health
curl http://localhost:8000/health

# Backend readiness (DB check)
curl http://localhost:8000/ready
```

### Container Health Status
```bash
# Tüm container health durumu
docker-compose ps

# Detaylı health check logları
docker inspect aliaport-backend | jq '.[0].State.Health'
```

## Troubleshooting

### Backend çalışmıyor
```bash
# Logları kontrol et
docker-compose logs backend

# Database bağlantısı test et
docker-compose exec backend python -c "
from aliaport_api.config.database import engine
engine.connect()
print('✅ Database connection OK')
"

# Migration durumu kontrol et
docker-compose exec backend alembic current
```

### Frontend 502 Bad Gateway
```bash
# Backend health check
curl http://localhost:8000/health

# Nginx config test
docker-compose exec frontend nginx -t

# Backend container çalışıyor mu?
docker-compose ps backend
```

### Database bağlantı hatası
```bash
# PostgreSQL çalışıyor mu?
docker-compose ps db

# PostgreSQL logları
docker-compose logs db

# Manuel bağlantı testi
docker-compose exec db psql -U aliaport -d aliaport -c "SELECT 1;"
```

## Performance Tuning

### PostgreSQL
```yaml
# docker-compose.yml'de environment ekle
db:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 200
```

### Uvicorn Workers
```yaml
# docker-compose.yml backend command
command: uvicorn aliaport_api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Backup & Restore

### Otomatik Backup (Cron)
```bash
# Host sistemde cron job ekle
0 3 * * * cd /path/to/aliaport && docker-compose exec -T backend python scripts/backup_database.py
```

### Manuel PostgreSQL Dump
```bash
# Backup
docker-compose exec -T db pg_dump -U aliaport aliaport > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T db psql -U aliaport aliaport < backup_20251123_030000.sql
```

## Güncellemeler

### Uygulama Güncelleme
```bash
# Git pull
git pull origin main

# Image'ları yeniden build et
docker-compose build

# Servisleri restart et (zero-downtime için rolling update)
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# Migration çalıştır
docker-compose exec backend alembic upgrade head
```

### Docker Image Güncelleme
```bash
# Base image'ları güncelle
docker-compose pull

# Rebuild
docker-compose up -d --build
```

## Resource Limits

```yaml
# docker-compose.yml'de limits ekle
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Sonraki Adımlar
- [ ] CI/CD pipeline kurulumu (.github/workflows)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Log aggregation (ELK Stack veya Loki)
- [ ] Distributed tracing (Jaeger)
- [ ] Kubernetes migration (opsiyonel, ölçekleme için)
