# GitHub Actions CI/CD Setup Guide

## Gerekli Secrets

GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

### Docker Hub
```
DOCKER_USERNAME: your-dockerhub-username
DOCKER_PASSWORD: your-dockerhub-token (NOT password, use access token)
```

### Staging Environment
```
STAGING_HOST: staging.aliaport.com (veya IP)
STAGING_USER: deploy
STAGING_SSH_KEY: -----BEGIN OPENSSH PRIVATE KEY----- ... (SSH private key)
STAGING_PORT: 22
```

### Production Environment
```
PROD_HOST: aliaport.com (veya IP)
PROD_USER: deploy
PROD_SSH_KEY: -----BEGIN OPENSSH PRIVATE KEY----- ... (SSH private key)
PROD_PORT: 22
```

### Notifications (Opsiyonel)
```
SLACK_WEBHOOK: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Codecov (Opsiyonel)
```
CODECOV_TOKEN: your-codecov-token
```

## SSH Key Oluşturma

```bash
# Deployment için SSH key oluştur
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key

# Public key'i sunucuya ekle
ssh-copy-id -i deploy_key.pub deploy@staging.aliaport.com
ssh-copy-id -i deploy_key.pub deploy@aliaport.com

# Private key'i GitHub secret olarak ekle
cat deploy_key  # Tüm içeriği kopyala (-----BEGIN ... -----END dahil)
```

## Sunucu Hazırlığı

### 1. Deploy Kullanıcısı Oluştur
```bash
# Staging ve Production sunucuda
sudo adduser deploy
sudo usermod -aG docker deploy
sudo su - deploy

# Aliaport dizini oluştur
cd /opt
sudo mkdir aliaport
sudo chown deploy:deploy aliaport
cd aliaport

# Repository clone
git clone https://github.com/yourusername/Aliaport_v3_1.git .
```

### 2. Environment Dosyası
```bash
# Production sunucuda
cp .env.production.example .env.production

# Güvenli değerler gir
nano .env.production
```

### 3. Docker Compose İlk Kurulum
```bash
# İlk deployment (manuel)
docker-compose up -d

# Database migration
docker-compose exec backend alembic upgrade head

# Admin kullanıcı oluştur
docker-compose exec backend python -c "..."
```

## Workflow'lar

### 1. CI (Continuous Integration)
**Tetikleyici:** Her push ve PR (main, develop)

**İşlemler:**
- Backend: pytest, pylint, mypy, coverage
- Frontend: vitest, eslint, tsc, build
- Docker: Build test (push etmeden)

**Başarı Kriteri:** Tüm testler geçmeli, coverage %80+

### 2. Deploy to Staging
**Tetikleyici:** Main branch'e push

**İşlemler:**
1. Docker image build + push (latest + commit SHA tag)
2. Staging sunucuya SSH
3. Git pull
4. Docker pull
5. Alembic migration
6. Rolling restart (backend → frontend)
7. Health check
8. Slack notification

**Rollback:** Manuel (önceki commit'e git checkout)

### 3. Deploy to Production
**Tetikleyici:** 
- Release publish (GitHub Releases)
- Manuel (workflow_dispatch)

**İşlemler:**
1. Database backup oluştur
2. Mevcut image'ları rollback tag'le
3. Versiyonlu image build + push (v1.0.0 + stable)
4. Git checkout (release tag)
5. Docker pull (versiyonlu)
6. Migration
7. Rolling restart
8. Health check
9. **Başarısızlık durumunda otomatik rollback**
10. Slack notification

**Rollback:** Otomatik (failure durumunda) veya manuel

### 4. Security Scan
**Tetikleyici:**
- Her push/PR (main)
- Haftalık (Pazartesi 06:00)

**İşlemler:**
- Trivy: Dependency + Docker image scan
- TruffleHog: Secret detection
- SARIF results → GitHub Security tab

## Deployment Akışı

### Staging Deployment
```bash
# Code değişikliği yap
git add .
git commit -m "feat: new feature"
git push origin main

# GitHub Actions otomatik başlar
# 5-10 dakika sonra staging'de canlı
```

### Production Deployment
```bash
# Release oluştur (GitHub web UI)
# 1. Releases → Create a new release
# 2. Tag: v1.0.0
# 3. Title: v1.0.0 - Feature Description
# 4. Description: Changelog
# 5. Publish release

# GitHub Actions otomatik başlar
# 10-15 dakika sonra production'da canlı

# VEYA Manuel
# Actions → Deploy to Production → Run workflow
# Version gir: v1.0.0
```

### Rollback (Production)
```bash
# Otomatik rollback (deployment failure durumunda)
# Önceki stable image restore edilir

# Manuel rollback
ssh deploy@aliaport.com
cd /opt/aliaport

# Önceki versiyona geç
git checkout v1.0.0  # önceki tag

# Image'ları rollback
docker tag aliaport-backend:rollback aliaport-backend:stable
docker tag aliaport-frontend:rollback aliaport-frontend:stable

# Restart
docker-compose up -d --no-deps backend frontend

# Database restore (gerekirse)
docker-compose exec backend python -c "
from scripts.backup_database import DatabaseBackupManager
from pathlib import Path
manager = DatabaseBackupManager()
# Son backup'ı listele
backups = sorted(Path('backups/database/daily').glob('*.db'), reverse=True)
print(f'Latest backup: {backups[0]}')
# manager.restore_from_backup(backups[0])  # Uncomment to restore
"
```

## Monitoring

### GitHub Actions Status
```
Repository → Actions → Workflow runs
```

### Deployment Logs
```bash
# Staging/Production sunucuda
ssh deploy@staging.aliaport.com
cd /opt/aliaport
docker-compose logs -f --tail=100
```

### Health Checks
```bash
# Staging
curl https://staging.aliaport.com/health
curl https://staging.aliaport.com/api/health

# Production
curl https://aliaport.com/health
curl https://aliaport.com/api/health
```

## Troubleshooting

### CI Testleri Başarısız
```bash
# Local'de testleri çalıştır
cd backend
pytest tests/ -v

cd frontend
npm run test
```

### Deployment SSH Hatası
```bash
# SSH key kontrolü
cat .ssh/deploy_key | head -n 1  # -----BEGIN OPENSSH PRIVATE KEY----- olmalı

# Connection test
ssh -i .ssh/deploy_key deploy@staging.aliaport.com
```

### Docker Image Push Hatası
```bash
# Docker Hub token kontrolü (password değil!)
# Hub.docker.com → Account Settings → Security → New Access Token
```

### Health Check Başarısız
```bash
# Sunucuda kontrol
docker-compose ps  # Tüm servisler Up olmalı
docker-compose logs backend | tail -50
curl http://localhost:8000/health
```

### Migration Hatası
```bash
# Manuel migration
ssh deploy@staging.aliaport.com
cd /opt/aliaport
docker-compose exec backend alembic current
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1
```

## Best Practices

1. **Test Coverage:** %80+ hedefi
2. **Staging First:** Production'a gitmeden önce staging'de test et
3. **Small Releases:** Küçük, sık release'ler (big bang yerine)
4. **Backup Before Deploy:** Production deployment öncesi otomatik backup
5. **Health Checks:** Deploy sonrası mutlaka health check
6. **Rollback Plan:** Her zaman geri dönüş planı hazır
7. **Monitoring:** Deployment sonrası 1 saat log izle
8. **Notifications:** Slack/email bildirimleri aktif tut
9. **Secrets Rotation:** Düzenli olarak SSH key, token'ları yenile
10. **Documentation:** Her release için changelog yaz

## Release Checklist

- [ ] Tüm testler geçiyor
- [ ] Staging'de test edildi
- [ ] Database migration hazır (varsa)
- [ ] Changelog yazıldı
- [ ] Breaking changes dokümante edildi
- [ ] Backup stratejisi onaylandı
- [ ] Rollback planı hazır
- [ ] Takım bilgilendirildi
- [ ] Monitoring hazır
- [ ] Post-deployment health check planı

## GitHub Environments

Repository → Settings → Environments

### Staging Environment
- Reviewers: (opsiyonel)
- Wait timer: 0 minutes
- Deployment branches: main

### Production Environment
- Reviewers: (zorunlu, en az 1 kişi)
- Wait timer: 5 minutes (opsiyonel)
- Deployment branches: main, tags matching v*

## Sonraki Adımlar

- [ ] Prometheus + Grafana monitoring
- [ ] ELK Stack (log aggregation)
- [ ] Automated performance testing
- [ ] Blue-green deployment (zero-downtime)
- [ ] Canary deployments
- [ ] Infrastructure as Code (Terraform)
