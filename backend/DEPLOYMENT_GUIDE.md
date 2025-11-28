# 🚀 Aliaport v3.1 - Deployment Guide

## Environment Configuration

### Development Environment

```bash
# .env dosyası
APP_ENV=development
DEBUG=True
LOG_LEVEL=DEBUG
```

**Davranış:**
- ✅ `Base.metadata.create_all()` otomatik çalışır (hızlı prototipleme)
- ✅ Bootstrap data otomatik yüklenir (admin user, test data)
- ✅ Detaylı error mesajları gösterilir
- ✅ Auto-reload aktif

**Kullanım:**
```bash
# Development server
uvicorn aliaport_api.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Production Environment

```bash
# .env dosyası
APP_ENV=production
DEBUG=False
LOG_LEVEL=INFO
```

**Davranış:**
- ❌ `Base.metadata.create_all()` KAPALI (güvenlik)
- ✅ Sadece Alembic migration'lar çalışır
- ❌ Bootstrap data otomatik yüklenmez (manuel seed gerekir)
- ✅ Minimal error mesajları (güvenlik)
- ❌ Auto-reload kapalı

**Deployment Workflow:**

#### 1️⃣ Database Migration
```bash
# Migration history kontrol
alembic current
alembic history

# Migration uygula
alembic upgrade head

# Rollback (gerekirse)
alembic downgrade -1
```

#### 2️⃣ Manual Data Seeding (ilk deployment)
```bash
# Admin user oluştur
python -m aliaport_api.scripts.create_admin

# Test data yükle (opsiyonel)
python -m aliaport_api.scripts.seed_data
```

#### 3️⃣ Production Server
```bash
# Gunicorn ile production server
gunicorn aliaport_api.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --log-level info
```

---

## Database Schema Management

### 🔴 CRITICAL: Production Schema Değişiklikleri

**❌ YAPMAYIN:**
```python
# main.py'de
Base.metadata.create_all(bind=engine)  # TEHLIKE! Production'da kapalı
```

**✅ YAPIN:**
```bash
# 1. Model değişikliği yap (models.py)
# 2. Migration oluştur
alembic revision --autogenerate -m "add_column_to_table"

# 3. Migration gözden geçir
cat alembic/versions/xxx_add_column_to_table.py

# 4. Migration test et (development)
alembic upgrade head

# 5. Production'a deploy et
# Git push → CI/CD → alembic upgrade head
```

### Migration Best Practices

1. **Autogenerate sonrası mutlaka gözden geçir**
   - Foreign key'ler doğru mu?
   - Index'ler eklendi mi?
   - Nullable constraint'ler doğru mu?

2. **Reversible migration'lar yaz**
   ```python
   def upgrade():
       op.add_column('table', sa.Column('new_col', sa.String(50)))
   
   def downgrade():
       op.drop_column('table', 'new_col')
   ```

3. **Data migration için manual SQL**
   ```python
   def upgrade():
       # Schema change
       op.add_column('users', sa.Column('status', sa.String(20)))
       
       # Data migration
       op.execute("UPDATE users SET status = 'ACTIVE' WHERE is_active = 1")
   ```

4. **Batch operations için transaction**
   ```python
   from sqlalchemy import text
   
   def upgrade():
       connection = op.get_bind()
       with connection.begin():
           # Batch operations
           pass
   ```

---

## Environment Variables

### Required

| Variable | Development | Production | Description |
|----------|------------|------------|-------------|
| `APP_ENV` | `development` | `production` | Environment mode |
| `DEBUG` | `True` | `False` | Debug mode |
| `DATABASE_URL` | `sqlite:///./aliaport.db` | `postgresql://...` | Database connection |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG/INFO/WARNING/ERROR) |
| `EVDS_API_KEY` | - | TCMB EVDS API key (kur sync) |
| `SMTP_HOST` | `mail.aliaport.com.tr` | Email SMTP server |
| `SMTP_PORT` | `587` | Email SMTP port |

---

## Health Check

### Development
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "database_mode": "SQLAlchemy create_all() [DEV ONLY]",
  "bootstrap_active": true
}
```

### Production
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "environment": "production",
  "database_mode": "Alembic migrations only [PRODUCTION]",
  "bootstrap_active": false
}
```

---

## Troubleshooting

### Problem: Production'da tablolar yok
**Neden:** Alembic migration çalıştırılmamış  
**Çözüm:**
```bash
alembic upgrade head
```

### Problem: Migration conflict
**Neden:** İki branch farklı migration oluşturmuş  
**Çözüm:**
```bash
# Branch merge sonrası
alembic merge heads -m "merge_branches"
alembic upgrade head
```

### Problem: Schema drift (model ≠ database)
**Neden:** create_all() production'da çalışmış  
**Çözüm:**
```bash
# 1. Mevcut durumu tespit et
alembic current

# 2. Yeni migration oluştur
alembic revision --autogenerate -m "fix_schema_drift"

# 3. Gözden geçir ve uygula
alembic upgrade head
```

---

## Security Checklist

### Production Deployment

- [ ] `APP_ENV=production` set edildi
- [ ] `DEBUG=False` set edildi
- [ ] Database URL production'a işaret ediyor
- [ ] SMTP credentials güvenli
- [ ] Admin default password değiştirildi
- [ ] CORS origins whitelist yapılandırıldı
- [ ] HTTPS sertifikası kuruldu
- [ ] Log dosyaları rotate ediliyor
- [ ] Backup stratejisi var
- [ ] Alembic migration history git'te

---

## CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Database Migrations
        run: |
          alembic upgrade head
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      
      - name: Restart Application
        run: |
          systemctl restart aliaport
```

---

## Monitoring

### Logs
```bash
# Application logs
tail -f logs/aliaport.log

# Access logs
tail -f logs/access.log

# Error logs
tail -f logs/error.log
```

### Database
```bash
# Migration history
alembic history

# Current version
alembic current

# Show current revision
alembic show current
```

---

## Support

**Documentation:** `backend/docs/`  
**Migration Guide:** `backend/alembic/README.md`  
**API Docs:** `http://localhost:8000/docs`

**Contact:** Aliaport DevOps Team
