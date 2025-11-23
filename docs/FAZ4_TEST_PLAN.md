# FAZ 4 Test Planı (Authentication, RBAC, Security, Audit)

## Amaç
Kimlik doğrulama, rol/izin kontrolü, güvenlik katmanları ve audit trail bileşenlerinin doğrulanması.

## Önkoşullar
- Seed script çalıştırılmış (`python -m scripts.seed_auth`)
- Admin + örnek kullanıcılar mevcut
- ENV'de `JWT_SECRET_KEY` üretim değerine ayarlı (testte varsayılan olabilir)

## Test Kategorileri
1. Authentication Akışı
2. Token Yenileme (Refresh Flow)
3. RBAC (Roller ve İzinler)
4. Rate Limiting
5. Güvenlik Başlıkları & CORS
6. Audit Trail Persistansı
7. Hata Senaryoları

## 1. Authentication Akışı
| ID | Adım | Beklenen |
|----|------|----------|
| A1 | POST /auth/login doğru cred | 200 + access+refresh token |
| A2 | POST /auth/login yanlış parola | 401 |
| A3 | GET /auth/me geçerli access token | 200 + user payload |
| A4 | GET /auth/me geçersiz token | 401 |
| A5 | POST /auth/logout geçerli refresh | 200 (stateless) |

## 2. Token Yenileme
| ID | Adım | Beklenen |
|----|------|----------|
| R1 | Access süresi dolmuş -> /auth/me | 401 -> frontend refresh denemesi |
| R2 | POST /auth/refresh geçerli refresh | 200 yeni access/refresh |
| R3 | POST /auth/refresh süresi dolmuş refresh | 401 |

## 3. RBAC
| ID | Rol | Endpoint | Permission | Beklenen |
|----|-----|----------|------------|----------|
| RB1 | OPERASYON | POST /api/kurlar | kurlar:write yok | 403 |
| RB2 | FINANS | POST /api/kurlar | kurlar:write var | 200 |
| RB3 | READONLY | POST /api/cari | cari:write yok | 403 |
| RB4 | SAHA | POST /api/work-order | workorder:write var | 200 |
| RB5 | GUVENLIK | DELETE /api/gatelog/{id} | guvenlik:delete var | 200 |
| RB6 | READONLY | GET /api/audit/events | Role yok (admin required) | 403 |
| RB7 | SISTEM_YONETICISI | GET /api/audit/events | Admin | 200 + data |

## 4. Rate Limiting
| ID | Adım | Beklenen |
|----|------|----------|
| RL1 | /auth/login ardışık 25 istek (aynı IP) | İlk 20 200, sonra 429 |
| RL2 | /auth/refresh 35 istek | İlk 30 200, sonra 429 |
| RL3 | /auth/me 150 istek | İlk 120 200, sonra 429 |

## 5. Güvenlik Başlıkları & CORS
| ID | Adım | Beklenen |
|----|------|----------|
| S1 | Her 200 response header incele | X-Frame-Options=DENY |
| S2 | CSP var mı | default-src 'self' |
| S3 | OPTIONS preflight allowed origin listede | 204 / başlıklar doğru |
| S4 | Origin listede değil -> GET | CORS blocked (tarayıcı) |
| S5 | ENABLE_HSTS=1 set edilip response | Strict-Transport-Security header |

## 6. Audit Trail
| ID | Adım | Beklenen |
|----|------|----------|
| AU1 | Başarılı login | audit_events kaydı (method=POST, path=/auth/login) |
| AU2 | RBAC 403 denemesi | audit_events kaydı status_code=403 |
| AU3 | Rate limit 429 | audit_events kaydı status_code=429 |
| AU4 | log_business_event çağrısı | method='BUS', path=/business/<EVENT> |
| AU5 | GET /api/audit/events admin filtre user_id | Sadece ilgili satırlar |

## 7. Hata Senaryoları
| ID | Adım | Beklenen |
|----|------|----------|
| E1 | Geçersiz JWT format | 401 + audit satırı |
| E2 | Expired access token | 401 + audit satırı |
| E3 | Veri tabanı kapalı simülasyonu (opsiyonel) | Request çalışır; audit DB insert silent-fail |

## Test Verisi
Admin: `admin@aliaport.com / Admin123!`
Operasyon: `operasyon@aliaport.com / Operasyon123!`
Güvenlik: `guvenlik@aliaport.com / Guvenlik123!`
Finans: `finans@aliaport.com / Finans123!`

## Otomasyon Önerileri (Gelecek Faz)
- Pytest ile fixture bazlı JWT üretimi
- RBAC parametrik test (role-permission matrisi iterate)
- Performans testi (yük altında rate limit davranışı)

## Kapanış Kriteri
- Tüm senaryolar PASS
- Dokümantasyon repo içinde (AUTH_GUIDE.md, RBAC_MATRIX.md, FAZ4_TEST_PLAN.md)
- Roadmap FAZ 4 status: Completed

---
Bu plan FAZ 4 doğrulama sürecini standartlaştırır.
