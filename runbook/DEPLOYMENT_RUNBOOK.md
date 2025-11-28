# Aliaport v3.1 - Production Deployment Runbook

**Versiyon:** 1.0  
**Tarih:** 25 Kasım 2025  
**Hedef Ortam:** Turkcell Cloud / Doruknet VDS (Türkiye)  
**Kullanıcı Kapasitesi:** 5-10 internal + 450-500 portal kullanıcısı (eş zamanlı 5-10)

---

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- **İşletim Sistemi:** Ubuntu Server 22.04 LTS
- **vCPU:** 4 core (minimum 2)
- **RAM:** 8 GB (minimum 4 GB)
- **Disk:** 100 GB SSD (minimum 50 GB)
- **Bant Genişliği:** 200 Mbps
- **Lokasyon:** Türkiye (İstanbul/Ankara)
- **Sağlayıcı:** Turkcell Cloud veya Doruknet

### Domain & DNS
- `www.aliaport.com` → Kurumsal website (mevcut hosting)
- `app.aliaport.com` → Aliaport v3.1 uygulaması
- DNS yönetimi: Cloudflare (ücretsiz)

### Entegrasyonlar
- **Mikro Jump 17:** ERP/Muhasebe yazılımı (aynı sunucuda)
- **MSSQL Express:** Mikro Jump veritabanı
- **PostgreSQL 14:** Aliaport v3.1 veritabanı
- **VPN:** OpenVPN (internal kullanıcılar için)

### Harici Servisler
- **Cloudflare:** DDoS protection, SSL, CDN
- **SMTP2GO:** Email servisi (1000 email/ay ücretsiz)
- **Let's Encrypt:** SSL sertifikası (ücretsiz)

---

## 🏗️ Faz 1: Sunucu Kurulumu ve Yapılandırma

### 1.1. Sunucu Tedarik ve İlk Erişim

**Adımlar:**
1. Turkcell Cloud/Doruknet'ten VDS satın al
2. Ubuntu 22.04 LTS kurulumunu seç
3. Root şifresini güvenli yere kaydet
4. Sunucu IP adresini not al (örn: 185.XXX.XXX.XXX)

**İlk SSH Bağlantısı:**
```bash
ssh root@185.XXX.XXX.XXX
```

### 1.2. Sistem Güncelleme ve Temel Paketler

```bash
# Sistem güncellemesi
apt update && apt upgrade -y

# Temel araçlar
apt install -y curl wget git vim htop unzip build-essential

# Zaman dilimi ayarı
timedatectl set-timezone Europe/Istanbul
```

### 1.3. Yeni Kullanıcı Oluşturma (Root Kullanımını Engelle)

```bash
# aliaport kullanıcısı oluştur
adduser aliaport
usermod -aG sudo aliaport

# SSH key tabanlı giriş (güvenlik için)
su - aliaport
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Kendi bilgisayarınızdan public key kopyalayın
# ssh-copy-id aliaport@185.XXX.XXX.XXX
```

**SSH Hardening:**
```bash
# SSH ayarları
sudo vim /etc/ssh/sshd_config

# Değiştirilecekler:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Varsayılan 22 yerine farklı port

# SSH servisi yeniden başlat
sudo systemctl restart sshd
```

### 1.4. Firewall Yapılandırması (UFW)

```bash
# UFW kurulumu
sudo apt install -y ufw

# Varsayılan politikalar
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Gerekli portlar
sudo ufw allow 2222/tcp    # SSH (değiştirilmiş port)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 1194/udp    # OpenVPN

# UFW aktifleştir
sudo ufw enable
sudo ufw status verbose
```

### 1.5. Fail2Ban Kurulumu (Brute Force Koruması)

```bash
# Fail2Ban kurulumu
sudo apt install -y fail2ban

# Yapılandırma
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local

# jail.local içinde:
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600

# Servisi başlat
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🗄️ Faz 2: Veritabanı Kurulumu

### 2.1. PostgreSQL 14 Kurulumu

```bash
# PostgreSQL repository ekle
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Kurulum
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Servis kontrolü
sudo systemctl status postgresql
```

### 2.2. PostgreSQL Güvenlik Yapılandırması

```bash
# PostgreSQL kullanıcısına geç
sudo su - postgres

# psql konsolu
psql

-- Veritabanı ve kullanıcı oluştur
CREATE DATABASE aliaport_db;
CREATE USER aliaport_user WITH PASSWORD 'GÜÇLÜ_ŞİFRE_BURAYA';
GRANT ALL PRIVILEGES ON DATABASE aliaport_db TO aliaport_user;

-- Çıkış
\q
exit
```

**PostgreSQL Erişim Kısıtlaması:**
```bash
# pg_hba.conf düzenle
sudo vim /etc/postgresql/14/main/pg_hba.conf

# Sadece localhost erişimi:
local   all             postgres                                peer
local   all             all                                     peer
host    aliaport_db     aliaport_user   127.0.0.1/32           scram-sha-256
host    aliaport_db     aliaport_user   ::1/128                scram-sha-256

# postgresql.conf düzenle
sudo vim /etc/postgresql/14/main/postgresql.conf

# Sadece localhost'tan dinle:
listen_addresses = 'localhost'

# Servisi yeniden başlat
sudo systemctl restart postgresql
```

### 2.3. MSSQL Express Kurulumu (Mikro Jump için)

```bash
# Microsoft repository ekle
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list)"

# MSSQL Server kurulumu
sudo apt update
sudo apt install -y mssql-server

# Kurulum yapılandırması
sudo /opt/mssql/bin/mssql-conf setup
# Express Edition seç (ücretsiz)
# SA şifresini güvenli belirle

# Servis kontrolü
systemctl status mssql-server
```

**MSSQL Güvenlik:**
```bash
# Firewall'da MSSQL portunu kapat (sadece localhost)
sudo ufw deny 1433/tcp

# MSSQL sadece localhost'tan dinlemeli
sudo /opt/mssql/bin/mssql-conf set network.ipaddress 127.0.0.1
sudo systemctl restart mssql-server
```

---

## 🐍 Faz 3: Python ve Backend Kurulumu

### 3.1. Python 3.11 Kurulumu

```bash
# Python repository
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update

# Python 3.11 kurulumu
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# pip kurulumu
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Python versiyonu kontrol
python3.11 --version
```

### 3.2. Proje Dizini Oluşturma

```bash
# Ana dizin
sudo mkdir -p /var/www/aliaport
sudo chown -R aliaport:aliaport /var/www/aliaport
cd /var/www/aliaport

# Git klonlama
git clone https://github.com/simseklerinc-commits/Aliaport_v3_1.git .

# Backend dizini
cd /var/www/aliaport/backend
```

### 3.3. Python Virtual Environment

```bash
# Virtual environment oluştur
python3.11 -m venv venv

# Aktifleştir
source venv/bin/activate

# Bağımlılıkları yükle
pip install --upgrade pip
pip install -r requirements.txt

# ODBC Driver (Mikro Jump MSSQL entegrasyonu için)
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt update
sudo ACCEPT_EULA=Y apt install -y msodbcsql17 unixodbc-dev

pip install pyodbc
```

### 3.4. Environment Variables (.env)

```bash
# .env dosyası oluştur
vim /var/www/aliaport/backend/.env
```

**.env içeriği:**
```ini
# Application
APP_NAME=Aliaport
APP_ENV=production
DEBUG=False
SECRET_KEY=UZUN_RASTGELE_GÜVENLİ_ANAHTAR_BURAYA

# Database - PostgreSQL
DATABASE_URL=postgresql://aliaport_user:GÜÇLÜ_ŞİFRE@localhost:5432/aliaport_db

# Mikro Jump - MSSQL (Read-only)
MIKRO_MSSQL_SERVER=localhost
MIKRO_MSSQL_DATABASE=MikroJump
MIKRO_MSSQL_USER=aliaport_readonly
MIKRO_MSSQL_PASSWORD=GÜÇLÜ_ŞİFRE

# EVDS API (TCMB Kurlar)
EVDS_API_KEY=10uUNFzxXP

# Email - SMTP2GO
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=aliaport_noreply
SMTP_PASSWORD=SMTP_ŞİFRESİ
SMTP_FROM=noreply@aliaport.com

# CORS
ALLOWED_ORIGINS=https://app.aliaport.com,https://www.aliaport.com

# JWT
JWT_SECRET_KEY=BAŞKA_UZUN_RASTGELE_ANAHTAR
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10 MB
UPLOAD_DIR=/var/www/aliaport/uploads

# KVKK
DATA_RETENTION_DAYS=730  # 2 yıl
PORTAL_USER_INACTIVE_DAYS=180  # 6 ay
```

### 3.5. Database Migration (Alembic)

```bash
# Migrations klasörü kontrolü
cd /var/www/aliaport/backend
source venv/bin/activate

# Alembic başlangıç (eğer yoksa)
alembic init alembic

# alembic.ini düzenle
vim alembic.ini
# sqlalchemy.url = postgresql://aliaport_user:ŞİFRE@localhost/aliaport_db

# Migration oluştur
alembic revision --autogenerate -m "Initial migration"

# Migration uygula
alembic upgrade head
```

### 3.6. Gunicorn + Uvicorn Yapılandırması

```bash
# Gunicorn konfigürasyonu
vim /var/www/aliaport/backend/gunicorn_config.py
```

**gunicorn_config.py:**
```python
import multiprocessing

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1  # 4 vCPU için 9 worker
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 60
keepalive = 5

# Logging
accesslog = "/var/www/aliaport/logs/gunicorn_access.log"
errorlog = "/var/www/aliaport/logs/gunicorn_error.log"
loglevel = "info"

# Process naming
proc_name = "aliaport_backend"

# Server mechanics
daemon = False
pidfile = "/var/run/aliaport_backend.pid"
umask = 0o007
user = "aliaport"
group = "aliaport"
```

### 3.7. Systemd Service (Auto-start)

```bash
# Systemd service dosyası oluştur
sudo vim /etc/systemd/system/aliaport-backend.service
```

**aliaport-backend.service:**
```ini
[Unit]
Description=Aliaport v3.1 FastAPI Backend
After=network.target postgresql.service

[Service]
Type=notify
User=aliaport
Group=aliaport
WorkingDirectory=/var/www/aliaport/backend
Environment="PATH=/var/www/aliaport/backend/venv/bin"
ExecStart=/var/www/aliaport/backend/venv/bin/gunicorn \
    -c /var/www/aliaport/backend/gunicorn_config.py \
    aliaport_api.main:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Service Başlatma:**
```bash
# Log dizini oluştur
sudo mkdir -p /var/www/aliaport/logs
sudo chown aliaport:aliaport /var/www/aliaport/logs

# Service aktifleştir
sudo systemctl daemon-reload
sudo systemctl enable aliaport-backend
sudo systemctl start aliaport-backend

# Durum kontrolü
sudo systemctl status aliaport-backend

# Logları izle
sudo journalctl -u aliaport-backend -f
```

---

## 🌐 Faz 4: Frontend Kurulumu

### 4.1. Node.js ve npm Kurulumu

```bash
# NodeSource repository (Node.js 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Versiyon kontrolü
node --version
npm --version
```

### 4.2. Frontend Build

```bash
cd /var/www/aliaport/frontend

# Bağımlılıkları yükle
npm install

# Production build
npm run build

# Build klasörünü kontrol et
ls -la dist/
```

### 4.3. Environment Variables (Frontend)

```bash
# .env.production dosyası
vim /var/www/aliaport/frontend/.env.production
```

**.env.production:**
```ini
VITE_API_BASE_URL=https://app.aliaport.com/api
VITE_APP_NAME=Aliaport
VITE_APP_VERSION=3.1.0
```

**Rebuild:**
```bash
npm run build
```

---

## 🔒 Faz 5: NGINX ve SSL Kurulumu

### 5.1. NGINX Kurulumu

```bash
sudo apt install -y nginx

# Varsayılan siteyi kaldır
sudo rm /etc/nginx/sites-enabled/default
```

### 5.2. Cloudflare DNS Ayarları

**Cloudflare Panel (cloudflare.com):**
1. Domain ekle: `aliaport.com`
2. A kaydı ekle:
   - Name: `app`
   - Content: `185.XXX.XXX.XXX` (sunucu IP)
   - Proxy: ✅ Aktif (turuncu bulut)
3. SSL/TLS ayarı: **Full (strict)**

### 5.3. Let's Encrypt SSL Sertifikası

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d app.aliaport.com

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

### 5.4. NGINX Yapılandırması

```bash
sudo vim /etc/nginx/sites-available/aliaport
```

**aliaport NGINX config:**
```nginx
# Rate limiting zone tanımlamaları
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream aliaport_backend {
    server 127.0.0.1:8000 fail_timeout=0;
}

# HTTP -> HTTPS yönlendirme
server {
    listen 80;
    listen [::]:80;
    server_name app.aliaport.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.aliaport.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/app.aliaport.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aliaport.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/app.aliaport.com/chain.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client body size (belge yükleme için)
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/aliaport_access.log;
    error_log /var/log/nginx/aliaport_error.log warn;

    # Frontend (React SPA)
    location / {
        root /var/www/aliaport/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://aliaport_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }

    # Login endpoint (daha sıkı rate limit)
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass http://aliaport_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files (belgeler)
    location /uploads/ {
        alias /var/www/aliaport/uploads/;
        
        # Sadece authenticated kullanıcılar erişebilir (backend'den kontrol)
        # internal; keyword'ü kullanarak sadece backend'den serve edilebilir
        
        expires 1y;
        add_header Cache-Control "private, immutable";
    }

    # Health check endpoint (monitoring için)
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

**NGINX Aktifleştirme:**
```bash
# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/aliaport /etc/nginx/sites-enabled/

# Syntax kontrolü
sudo nginx -t

# NGINX başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔐 Faz 6: VPN Kurulumu (Mikro Jump Erişimi)

### 6.1. OpenVPN Kurulumu

```bash
# OpenVPN ve Easy-RSA
sudo apt install -y openvpn easy-rsa

# Easy-RSA dizini
make-cadir ~/openvpn-ca
cd ~/openvpn-ca
```

### 6.2. Certificate Authority (CA) Oluşturma

```bash
# vars dosyasını düzenle
vim vars

# Aşağıdaki değerleri güncelle:
set_var EASYRSA_REQ_COUNTRY    "TR"
set_var EASYRSA_REQ_PROVINCE   "Izmir"
set_var EASYRSA_REQ_CITY       "Aliaga"
set_var EASYRSA_REQ_ORG        "Aliaport"
set_var EASYRSA_REQ_EMAIL      "admin@aliaport.com"
set_var EASYRSA_REQ_OU         "IT"

# PKI başlat
./easyrsa init-pki
./easyrsa build-ca nopass

# Server sertifikası
./easyrsa gen-req server nopass
./easyrsa sign-req server server

# Diffie-Hellman parametreleri
./easyrsa gen-dh

# TLS auth key
openvpn --genkey secret ta.key
```

### 6.3. OpenVPN Server Yapılandırması

```bash
# Sertifikaları kopyala
sudo cp ~/openvpn-ca/pki/ca.crt /etc/openvpn/server/
sudo cp ~/openvpn-ca/pki/issued/server.crt /etc/openvpn/server/
sudo cp ~/openvpn-ca/pki/private/server.key /etc/openvpn/server/
sudo cp ~/openvpn-ca/pki/dh.pem /etc/openvpn/server/
sudo cp ~/openvpn-ca/ta.key /etc/openvpn/server/

# Server config
sudo vim /etc/openvpn/server/server.conf
```

**server.conf:**
```conf
port 1194
proto udp
dev tun

ca ca.crt
cert server.crt
key server.key
dh dh.pem
tls-auth ta.key 0

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

push "route 10.8.0.0 255.255.255.0"
keepalive 10 120
cipher AES-256-CBC
auth SHA256
user nobody
group nogroup
persist-key
persist-tun

status openvpn-status.log
log-append /var/log/openvpn.log
verb 3
```

**IP Forwarding:**
```bash
# Sysctl ayarı
sudo vim /etc/sysctl.conf
# net.ipv4.ip_forward=1 satırını aktifleştir

sudo sysctl -p
```

**OpenVPN Başlat:**
```bash
sudo systemctl enable openvpn-server@server
sudo systemctl start openvpn-server@server
sudo systemctl status openvpn-server@server
```

### 6.4. Client Sertifikaları (Her Kullanıcı İçin)

```bash
cd ~/openvpn-ca

# Örnek: ahmet kullanıcısı için
./easyrsa gen-req ahmet nopass
./easyrsa sign-req client ahmet

# Client config dosyası oluştur
mkdir ~/client-configs
vim ~/client-configs/ahmet.ovpn
```

**ahmet.ovpn şablonu:**
```conf
client
dev tun
proto udp
remote app.aliaport.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
verb 3

<ca>
# ca.crt içeriğini buraya yapıştır
</ca>

<cert>
# ahmet.crt içeriğini buraya yapıştır
</cert>

<key>
# ahmet.key içeriğini buraya yapıştır
</key>

<tls-auth>
# ta.key içeriğini buraya yapıştır
</tls-auth>
key-direction 1
```

**Kullanıcılara dağıtım:**
- `ahmet.ovpn` dosyasını güvenli şekilde kullanıcıya ilet
- OpenVPN Connect uygulamasını indir (Windows/Mac/Mobile)
- `.ovpn` dosyasını import et

---

## 📦 Faz 7: Mikro Jump 17 Kurulumu ve Entegrasyon

### 7.1. Mikro Jump 17 Kurulumu

**Not:** Mikro Jump Windows tabanlı bir yazılım olabilir. Linux sunucuda çalıştırmak için:

**Seçenek A: Wine (Linux'ta Windows app)**
```bash
# Wine kurulumu (önerilmez, performans düşük)
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine64 wine32
```

**Seçenek B: Windows VM (Önerilen)**
```bash
# QEMU/KVM ile Windows VM oluştur
sudo apt install -y qemu-kvm libvirt-daemon-system virtinst

# Windows Server 2022 VM kurulumu
# 2 vCPU, 4 GB RAM
# Mikro Jump 17'yi bu VM'e kur
```

**Seçenek C: Ayrı Windows Server (En İyi)**
- Mikro Jump için ayrı fiziksel/sanal Windows Server
- VPN ile Aliaport sunucusuna bağlan
- MSSQL bağlantısı network üzerinden

### 7.2. Mikro Jump ↔ Aliaport Entegrasyon

**Read-Only SQL User (Aliaport için):**
```sql
-- MSSQL'de aliaport_readonly kullanıcısı oluştur
USE MikroJump;
GO

CREATE LOGIN aliaport_readonly WITH PASSWORD = 'GÜÇLÜ_ŞİFRE';
CREATE USER aliaport_readonly FOR LOGIN aliaport_readonly;

-- Sadece SELECT yetkisi
GRANT SELECT ON SCHEMA::dbo TO aliaport_readonly;
GO
```

**Aliaport Backend'de Test:**
```bash
cd /var/www/aliaport/backend
source venv/bin/activate

python -c "
import pyodbc
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost;'  # veya VPN IP
    'DATABASE=MikroJump;'
    'UID=aliaport_readonly;'
    'PWD=ŞİFRE;'
)
cursor = conn.execute('SELECT TOP 5 * FROM CARI_HESAPLAR')
for row in cursor:
    print(row)
"
```

---

## 📊 Faz 8: Yedekleme ve Monitoring

### 8.1. PostgreSQL Otomatik Yedekleme

**Backup Script:**
```bash
sudo vim /usr/local/bin/backup_aliaport_db.sh
```

**backup_aliaport_db.sh:**
```bash
#!/bin/bash

# Yedekleme dizini
BACKUP_DIR="/var/backups/aliaport/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Dizin oluştur
mkdir -p $BACKUP_DIR

# PostgreSQL dump
sudo -u postgres pg_dump aliaport_db | gzip > $BACKUP_DIR/aliaport_db_$DATE.sql.gz

# Eski yedekleri sil (30 günden eski)
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: aliaport_db_$DATE.sql.gz"
```

**Executable yap:**
```bash
sudo chmod +x /usr/local/bin/backup_aliaport_db.sh
```

**Cron Job (Her gün 02:00):**
```bash
sudo crontab -e

# Ekle:
0 2 * * * /usr/local/bin/backup_aliaport_db.sh >> /var/log/aliaport_backup.log 2>&1
```

### 8.2. Uploads Dizini Yedekleme

```bash
sudo vim /usr/local/bin/backup_aliaport_uploads.sh
```

**backup_aliaport_uploads.sh:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/aliaport/uploads"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Uploads'ı tar.gz yap
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/aliaport/uploads

# Eski yedekleri sil
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Uploads backup completed: uploads_$DATE.tar.gz"
```

**Executable + Cron:**
```bash
sudo chmod +x /usr/local/bin/backup_aliaport_uploads.sh

sudo crontab -e
# Ekle (Pazar günleri 03:00):
0 3 * * 0 /usr/local/bin/backup_aliaport_uploads.sh >> /var/log/aliaport_backup.log 2>&1
```

### 8.3. Uptime Monitoring (Uptime Robot)

**Adımlar:**
1. https://uptimerobot.com kayıt ol (ücretsiz)
2. Monitor ekle:
   - Type: HTTP(s)
   - URL: `https://app.aliaport.com/health`
   - Interval: 5 dakika
   - Alert: Email (sizin email)

### 8.4. Log Rotation

```bash
sudo vim /etc/logrotate.d/aliaport
```

**/etc/logrotate.d/aliaport:**
```
/var/www/aliaport/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 aliaport aliaport
    sharedscripts
    postrotate
        systemctl reload aliaport-backend > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/aliaport*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
```

---

## 🚀 Faz 9: İlk Deployment ve Test

### 9.1. Admin Kullanıcı Oluşturma

```bash
cd /var/www/aliaport/backend
source venv/bin/activate

# Admin oluşturma scripti çalıştır
python admin_reset_password.py
```

**Veya manuel:**
```python
python -c "
from aliaport_api.core.database import SessionLocal
from aliaport_api.modules.auth.models import User
from aliaport_api.core.security import get_password_hash

db = SessionLocal()

admin = User(
    email='admin@aliaport.com',
    username='admin',
    first_name='Admin',
    last_name='User',
    hashed_password=get_password_hash('TempPassword123!'),
    is_active=True,
    is_superuser=True,
    role='ADMIN'
)

db.add(admin)
db.commit()
print('Admin created: admin@aliaport.com / TempPassword123!')
"
```

### 9.2. Sistem Testi

**Backend Health Check:**
```bash
curl https://app.aliaport.com/health
# Response: OK

curl https://app.aliaport.com/api/health
# Response: {"status":"healthy"}
```

**Login Test:**
```bash
curl -X POST https://app.aliaport.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aliaport.com","password":"TempPassword123!"}'

# Response: {"access_token":"eyJ...", "token_type":"bearer"}
```

**Database Connection:**
```bash
sudo -u postgres psql -d aliaport_db -c "SELECT COUNT(*) FROM users;"
# Response: 1 (admin kullanıcısı)
```

### 9.3. Frontend Test

1. Tarayıcıda: `https://app.aliaport.com`
2. Login sayfası görünmeli
3. `admin@aliaport.com` / `TempPassword123!` ile giriş
4. Dashboard açılmalı

### 9.4. Email Test

```python
python -c "
from aliaport_api.core.email_service import send_email
import asyncio

asyncio.run(send_email(
    to='test@example.com',
    subject='Aliaport Test Email',
    body='Bu bir test emailidir.'
))
"
```

---

## 📱 Faz 10: Portal Kullanıcı Yükleme

### 10.1. Cari Listesi Hazırlama

**Excel formatı (cari_listesi.xlsx):**
| cari_code | cari_title | contact_email | contact_phone |
|-----------|------------|---------------|---------------|
| C001 | MSC Denizcilik | info@msc.com | +90 232 XXX XXXX |
| C002 | Maersk Türkiye | contact@maersk.com | +90 232 XXX XXXX |

### 10.2. Toplu Portal Kullanıcı Oluşturma

```python
# Script: create_portal_users.py

import pandas as pd
from aliaport_api.core.database import SessionLocal
from aliaport_api.modules.auth.models import User
from aliaport_api.modules.cari.models import Cari
from aliaport_api.core.security import get_password_hash
import secrets
import string

def generate_password(length=12):
    """Güvenli rastgele şifre oluştur"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_portal_users(excel_file):
    db = SessionLocal()
    df = pd.read_excel(excel_file)
    
    results = []
    
    for _, row in df.iterrows():
        # Cari oluştur/güncelle
        cari = db.query(Cari).filter(Cari.code == row['cari_code']).first()
        if not cari:
            cari = Cari(
                code=row['cari_code'],
                title=row['cari_title'],
                email=row['contact_email'],
                phone=row['contact_phone']
            )
            db.add(cari)
            db.flush()
        
        # Portal kullanıcısı oluştur
        password = generate_password()
        email = row['contact_email']
        
        user = User(
            email=email,
            username=email.split('@')[0],
            first_name=row['cari_title'].split()[0],
            last_name='',
            hashed_password=get_password_hash(password),
            is_active=True,
            is_portal_user=True,
            role='PORTAL_USER',
            cari_id=cari.id,
            password_reset_required=True
        )
        
        db.add(user)
        
        results.append({
            'cari_code': row['cari_code'],
            'email': email,
            'temp_password': password
        })
    
    db.commit()
    
    # Şifreleri CSV'ye kaydet (güvenli paylaşım için)
    results_df = pd.DataFrame(results)
    results_df.to_csv('portal_users_credentials.csv', index=False)
    
    print(f"{len(results)} portal kullanıcısı oluşturuldu.")
    print("Şifreler: portal_users_credentials.csv")

if __name__ == '__main__':
    create_portal_users('cari_listesi.xlsx')
```

**Çalıştır:**
```bash
cd /var/www/aliaport/backend
source venv/bin/activate
python create_portal_users.py
```

### 10.3. Kullanıcılara Email Gönderme

```python
# Script: send_welcome_emails.py

import pandas as pd
from aliaport_api.core.email_service import send_email
import asyncio

async def send_welcome_emails():
    df = pd.read_csv('portal_users_credentials.csv')
    
    for _, row in df.iterrows():
        body = f"""
Sayın {row['cari_code']} Yetkilisi,

Aliağaport İş Emri Takip Sistemi'ne hoş geldiniz.

Giriş Bilgileriniz:
- Web: https://app.aliaport.com
- Email: {row['email']}
- Geçici Şifre: {row['temp_password']}

İlk girişte şifrenizi değiştirmeniz gerekmektedir.

Sorularınız için: destek@aliaport.com

Saygılarımızla,
Aliağaport
"""
        
        await send_email(
            to=row['email'],
            subject='Aliağaport Portal Erişim Bilgileri',
            body=body
        )
        
        print(f"Email gönderildi: {row['email']}")

if __name__ == '__main__':
    asyncio.run(send_welcome_emails())
```

---

## 🔍 Faz 11: KVKK Uyumluluk Ayarları

### 11.1. Aydınlatma Metni ve Rıza Formu

**Frontend'de eklenecek:**
- Kayıt formunda checkbox: "Kişisel Verilerimin İşlenmesi Aydınlatma Metni'ni okudum, onaylıyorum"
- Link: `/kvkk-aydinlatma-metni`

### 11.2. Veri Silme/Düzeltme Endpoint

```python
# backend/aliaport_api/modules/portal/router.py

@router.delete("/portal/user/delete-my-data")
async def delete_user_data(
    current_user: User = Depends(get_current_portal_user),
    db: Session = Depends(get_db)
):
    """
    KVKK: Kullanıcı kendi verilerini silebilir
    """
    # Anonymize user
    current_user.email = f"deleted_{current_user.id}@anonymized.local"
    current_user.first_name = "Silinmiş"
    current_user.last_name = "Kullanıcı"
    current_user.phone = None
    current_user.is_active = False
    current_user.is_anonymized = True
    current_user.anonymized_at = datetime.now()
    
    # Work order'ları anonymize et (tamamen silme yerine)
    work_orders = db.query(WorkOrder).filter(
        WorkOrder.portal_user_id == current_user.id
    ).all()
    
    for wo in work_orders:
        wo.portal_user_id = None  # Bağlantıyı kopar
    
    db.commit()
    
    return {"message": "Verileriniz başarıyla silindi"}
```

### 11.3. Pasif Kullanıcı Temizleme (Cron)

```bash
# Script: cleanup_inactive_users.py
cd /var/www/aliaport/backend
source venv/bin/activate

python -c "
from aliaport_api.core.kvkk import KVKKCompliance
from aliaport_api.core.database import SessionLocal
import asyncio

async def cleanup():
    db = SessionLocal()
    kvkk = KVKKCompliance()
    await kvkk.anonymize_old_users(db)
    print('KVKK cleanup completed')

asyncio.run(cleanup())
"
```

**Cron (ayda 1):**
```bash
sudo crontab -e
# 1. gün 04:00
0 4 1 * * cd /var/www/aliaport/backend && source venv/bin/activate && python cleanup_inactive_users.py
```

---

## 📈 Faz 12: Performance ve Monitoring

### 12.1. Prometheus + Grafana (Opsiyonel)

```bash
# Prometheus kurulumu
sudo apt install -y prometheus

# Backend'de prometheus exporter ekle
pip install prometheus-fastapi-instrumentator
```

**Backend'de aktivasyon:**
```python
# aliaport_api/main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

### 12.2. Database Connection Pooling

**SQLAlchemy ayarı:**
```python
# aliaport_api/core/database.py

engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # Eş zamanlı 20 connection
    max_overflow=10,  # +10 geçici
    pool_pre_ping=True,  # Connection health check
    pool_recycle=3600  # 1 saatte bir recycle
)
```

### 12.3. Redis Cache (Gelecek için)

```bash
# Redis kurulumu
sudo apt install -y redis-server

# Backend'de redis client
pip install redis aioredis
```

---

## ✅ Deployment Checklist

### Pre-Launch
- [ ] Sunucu satın alındı (Turkcell/Doruknet)
- [ ] Ubuntu 22.04 kuruldu
- [ ] SSH key-based auth aktif
- [ ] Firewall yapılandırıldı (UFW)
- [ ] Fail2Ban aktif
- [ ] PostgreSQL kuruldu ve güvenlik ayarlandı
- [ ] Python 3.11 + venv kuruldu
- [ ] Backend dependencies yüklendi
- [ ] Node.js kuruldu
- [ ] Frontend build edildi
- [ ] NGINX kuruldu
- [ ] Let's Encrypt SSL alındı
- [ ] Cloudflare DNS ayarlandı
- [ ] Systemd service oluşturuldu
- [ ] OpenVPN kuruldu
- [ ] Mikro Jump kuruldu
- [ ] Database migration tamamlandı
- [ ] Admin kullanıcı oluşturuldu

### Testing
- [ ] Backend health check: OK
- [ ] Frontend yüklendi: OK
- [ ] Login çalışıyor: OK
- [ ] API endpoints test edildi: OK
- [ ] Email gönderimi test edildi: OK
- [ ] Database connection: OK
- [ ] Mikro Jump entegrasyon: OK
- [ ] VPN bağlantısı: OK
- [ ] File upload: OK
- [ ] SSL sertifikası geçerli: OK

### Go-Live
- [ ] Portal kullanıcılar oluşturuldu (450-500)
- [ ] Welcome email gönderildi
- [ ] Backup cron job aktif
- [ ] Log rotation yapılandırıldı
- [ ] Uptime monitoring aktif
- [ ] KVKK aydınlatma metni yayında
- [ ] Dokümantasyon hazır

### Post-Launch (İlk 7 Gün)
- [ ] Günlük log kontrolü
- [ ] Performance monitoring
- [ ] Kullanıcı feedback toplama
- [ ] Bug fix deployments
- [ ] Backup kontrolü

---

## 🆘 Sorun Giderme

### Backend çalışmıyor
```bash
# Log kontrol
sudo journalctl -u aliaport-backend -f

# Service restart
sudo systemctl restart aliaport-backend

# Manual test
cd /var/www/aliaport/backend
source venv/bin/activate
python -c "from aliaport_api.main import app; print(app)"
```

### Database bağlantı hatası
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Connection test
sudo -u postgres psql -d aliaport_db -c "SELECT 1;"

# .env dosyası kontrol
cat /var/www/aliaport/backend/.env | grep DATABASE_URL
```

### NGINX 502 Bad Gateway
```bash
# Backend port kontrolü
sudo netstat -tulpn | grep 8000

# NGINX error log
sudo tail -f /var/log/nginx/aliaport_error.log

# Backend restart
sudo systemctl restart aliaport-backend
```

### SSL sertifikası yenileme
```bash
# Manuel yenileme
sudo certbot renew

# Otomatik yenileme test
sudo certbot renew --dry-run
```

### VPN bağlantı sorunu
```bash
# OpenVPN status
sudo systemctl status openvpn-server@server

# Log kontrol
sudo tail -f /var/log/openvpn.log

# Firewall VPN portunu kontrol
sudo ufw status | grep 1194
```

---

## 📞 Destek ve İletişim

**Sistem Yöneticisi:**
- Email: admin@aliaport.com
- Telefon: +90 232 XXX XXXX

**Teknik Destek:**
- Email: destek@aliaport.com

**Acil Durum:**
- 7/24 On-Call: +90 5XX XXX XXXX

**Vendor Desteği:**
- Turkcell Cloud: 444 XXXX
- Doruknet: 0850 XXX XXXX
- Cloudflare: https://support.cloudflare.com

---

## 📚 Ek Kaynaklar

- **Aliaport Kullanıcı Kılavuzu:** `/docs/USER_GUIDE.md`
- **API Dokümantasyonu:** `https://app.aliaport.com/api/docs`
- **GitHub Repository:** `https://github.com/simseklerinc-commits/Aliaport_v3_1`
- **KVKK Aydınlatma Metni:** `https://app.aliaport.com/kvkk`

---

**Son Güncelleme:** 25 Kasım 2025  
**Hazırlayan:** GitHub Copilot + Aliaport DevOps Ekibi
