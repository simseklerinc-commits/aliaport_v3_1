# Aliaport v3.1 - Authentication & Security Guide

## Amaç
Bu doküman, Aliaport v3.1 backend ve frontend kimlik doğrulama (Authentication), rol & izin (RBAC) ve güvenlik sertleştirme (Hardening) yaklaşımını açıklar.

## Bileşenler
- FastAPI JWT tabanlı kimlik doğrulama
- Access Token (15 dk) + Refresh Token (7 gün)
- RBAC: Role -> Permissions (resource:action)
- Rate Limiting (SlowAPI)
- CORS kısıtlama (ENV tabanlı origin listesi)
- Güvenlik HTTP Başlıkları (CSP, HSTS opsiyonel, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Audit Trail (Her request + business event DB kaydı)

## Token Yaşam Döngüsü
1. Kullanıcı `/auth/login` ile email + password gönderir.
2. Başarılı doğrulamada: `access_token` (15 dk) + `refresh_token` (7 gün) döner.
3. Frontend `access_token`'ı Authorization: Bearer olarak her istekte kullanır.
4. `access_token` süresi dolunca backend 401 döner; client otomatik `/auth/refresh` çağırır.
5. Refresh başarılı -> yeni access token + refresh token (chain yenilenir).
6. `/auth/logout` refresh token invalidation (stateless modda sadece client siler).

## Endpoint Özeti
| Endpoint | Metod | Açıklama | Rate Limit |
|----------|-------|----------|-----------|
| `/auth/login` | POST | Login | 20/minute |
| `/auth/refresh` | POST | Access yenile | 30/minute |
| `/auth/logout` | POST | Logout | 60/minute |
| `/auth/me` | GET | Current user | 120/minute |
| `/auth/users` | POST | Admin: user oluştur | 30/minute |
| `/auth/users` | GET | Admin: liste | 60/minute |
| `/auth/users/{id}` | GET | Admin: tek kullanıcı | 60/minute |
| `/auth/users/{id}` | PUT | Admin: güncelle | 30/minute |

## RBAC Modeli
- Role (örn: OPERASYON) çoklu Permission setine sahip.
- Permission formatı: `resource:action` (örn: `cari:read`).
- Superuser (admin) tüm kontrolleri bypass eder.
- `require_role([...])` ve `require_permission(resource, action)` dependency fonksiyonları ile korunmuş endpointler.

## Rate Limiting
SlowAPI global limit: `300/minute`.
Her kritik auth endpoint için granular limit eklenmiştir (bkz. router decorator'ları).
Aşımda HTTP 429 döner.

## Güvenlik Başlıkları
Uygulama middleware katmanında:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:`
- Opsiyonel HSTS: `ENABLE_HSTS=1` ise üretimde eklenir.

## CORS
ENV değişkeni `CORS_ALLOWED_ORIGINS` ile belirlenen origin listesi. Metodlar: GET,POST,PUT,DELETE,OPTIONS. Header: Authorization, Content-Type, Accept.

## Audit Trail
### Request Bazlı
Her HTTP isteği `audit_middleware` ile kaydedilir:
- user_id (varsa), roles
- method, path, status_code, süre (ms)
- ip, user_agent
- resource & action (heuristic: path parsing + HTTP method mapping)

### Business Event Bazlı
`log_business_event(event_type, description, ...)` hem `audit.log` dosyasına hem `audit_events` tablosuna `method='BUS'` olarak yazar.

### Tablo Şeması (`audit_events`)
| Alan | Tip | Açıklama |
|------|-----|----------|
| id | int | PK |
| user_id | int | Users FK (nullable) |
| method | string | HTTP veya 'BUS' |
| path | string | İstek path veya /business/<event_type> |
| action | string | create/read/update/delete/business |
| resource | string | Tahmini resource (örn: cari) |
| entity_id | int | Business event ilişkili kayıt |
| status_code | int | HTTP status veya 200 |
| duration_ms | int | Request süresi |
| roles | string | Virgüllü rol listesi |
| ip | string | Client IP |
| user_agent | string | UA |
| extra | JSON | Detaylar |
| created_at | datetime | Otomatik zaman damgası |

## Hata Yönetimi
Global exception handler + structured JSON logging.
Audit insert hataları silent-fail (performans & dayanıklılık için).

## Frontend Akışı
1. Login form valid -> `authService.login(email, password)`.
2. Tokens localStorage'a yazılır.
3. API client istek öncesi access token'i Authorization header'a ekler.
4. 401 -> otomatik refresh denemesi (tek sefer). Başarısız ise logout.
5. AuthContext `user` state'i `/auth/me` ile doldurulur. Role-based UI gating yapılır.

## Güvenlik Önerileri Üretim
- JWT secret environment (güçlü, döngüsel rotasyon)
- HTTPS zorunlu + HSTS aktif
- CSP'de inline script kaldırılması
- Refresh token revocation list (gelecek faz)
- Ek audit index'leri (performans) ve arşiv döngüsü (örn: 90 gün -> S3)

## Manuel Test Senaryoları (Özet)
- Başarılı Login -> access+refresh token dönmeli
- Yanlış şifre -> 401
- Token süresi dolmuş -> 401 ardından refresh ile başarı
- Refresh token süresi dolmuş -> yeniden login gerekir
- RBAC: OPERASYON rolü finans endpointine erişememeli
- READONLY role write endpoint -> 403
- Rate limit aşıldığında 429
- Audit tablosunda login isteği kaydı (method=POST, path=/auth/login)
- log_business_event çağrısı sonrası audit_events satırı (method='BUS')

## Sürüm & İzleme
- Sürüm: 3.1.0
- Log dosyaları: `logs/app.log`, `logs/audit.log`, `logs/api.log`, `logs/error.log`

---
Bu doküman FAZ 4 kapsamında kimlik doğrulama ve güvenlik bileşenlerini resmileştirir.
