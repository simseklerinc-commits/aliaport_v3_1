# Aliaport v3.1 - RBAC Matrix

Bu doküman sistemdeki roller ve izinler (permissions) ilişkilendirmesini gösterir.

## Permission Formatı
`resource:action`
- resource: Modül adı (cari, motorbot, barinma, workorder, kurlar, tarife, guvenlik, saha, parametre, hizmet)
- action: `read` | `write` | `delete`

## Tüm İzinler
```
cari:read
cari:write
cari:delete
motorbot:read
motorbot:write
motorbot:delete
barinma:read
barinma:write
barinma:delete
workorder:read
workorder:write
workorder:delete
kurlar:read
kurlar:write
kurlar:delete
tarife:read
tarife:write
tarife:delete
guvenlik:read
guvenlik:write
guvenlik:delete
saha:read
saha:write
saha:delete
parametre:read
parametre:write
parametre:delete
hizmet:read
hizmet:write
hizmet:delete
```
Toplam: 30 izin.

## Roller
| Rol | Açıklama |
|-----|----------|
| SISTEM_YONETICISI | Tüm erişimler (superuser) |
| OPERASYON | Operasyon yönetimi |
| GUVENLIK | Gate / güvenlik işlemleri |
| FINANS | Finansal işlemler ve fiyat yönetimi |
| SAHA | Saha (WorkLog, İş Emri) operasyonları |
| READONLY | Salt okuma tüm modüller |

## Rol -> Permission Atamaları
Wildcard kullanımı: `resource:*` ilgili kaynağın tüm eylemleri. Sistemde script düzeyinde genişletilir.

### SISTEM_YONETICISI
- `*` (30 izin tamamı)

### OPERASYON
- `cari:*`
- `motorbot:*`
- `barinma:*`
- `workorder:*`
- `hizmet:*`
- `parametre:read`
- `saha:read`
Toplam genişletilmiş:  (cari 3 + motorbot 3 + barinma 3 + workorder 3 + hizmet 3) = 15 + parametre:read + saha:read = 17 izin

### GUVENLIK
- `guvenlik:*`
- `motorbot:read`
- `cari:read`
Genişletilmiş: guvenlik 3 + 2 read = 5 izin

### FINANS
- `kurlar:*`
- `tarife:*`
- `cari:*`
- `hizmet:read`
- `workorder:read`
Genişletilmiş: kurlar 3 + tarife 3 + cari 3 + 2 read = 11 izin

### SAHA
- `saha:*`
- `workorder:*`
- `motorbot:read`
- `cari:read`
Genişletilmiş: saha 3 + workorder 3 + 2 read = 8 izin

### READONLY
- `cari:read`
- `motorbot:read`
- `barinma:read`
- `workorder:read`
- `kurlar:read`
- `tarife:read`
- `guvenlik:read`
- `saha:read`
- `parametre:read`
- `hizmet:read`
Toplam: 10 izin

## Atama Kuralları
- Superuser (admin) tüm izinleri otomatik alır, RBAC kontrolleri bypass.
- Bir endpoint hem `require_role` hem `require_permission` ile korunabilir; superuser yine bypass eder.
- Wildcard genişletmesi seed aşamasında yapılır, çalışma anında veritabanı üzerinden doğrudan kontrol edilir.

## Test Örnekleri
| Senaryo | Beklenen |
|---------|----------|
| OPERASYON rolü `kurlar:write` denemesi | 403 Forbidden |
| FINANS rolü `tarife:delete` | 200 / başarı (izin var) |
| READONLY rolü `cari:write` | 403 Forbidden |
| SAHA rolü `workorder:write` | 200 / başarı |
| GUVENLIK rolü `guvenlik:delete` | 200 / başarı |
| READONLY rolü `audit` endpoint (admin role required) | 403 Forbidden |

## Gelecek Genişletmeler
- Permission grup kavramı (örn: finansal paket)
- Dinamik permission caching (Redis)
- Kullanıcı bazlı özel izin ekleme (role + direct permission hybrid)

---
Bu matris FAZ 4 kapsamında RBAC yapılandırmasını resmileştirir.
