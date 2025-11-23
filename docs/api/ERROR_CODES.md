# Aliaport v3.1 – Error Code Referansı

Backend `ErrorCode` enum ve HTTP status mapping listesi. Frontend hata yönetimi için `error.code` değerleri tek gerçek kaynaktır.

## Error Response Format

All API errors follow this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2025-11-23T10:30:00Z"
}
```

---

## Error Code Categories

### Authentication & Authorization (40x)

| Code | HTTP Status | Varsayılan Mesaj |
|------|-------------|------------------|
| AUTH_INVALID_CREDENTIALS | 401 | Kullanıcı adı veya şifre hatalı |
| AUTH_TOKEN_EXPIRED | 401 | Token süresi dolmuş |
| AUTH_TOKEN_INVALID | 401 | Geçersiz token |
| AUTH_INSUFFICIENT_PERMISSIONS | 403 | Bu işlem için yetkiniz yok |
| AUTH_USER_NOT_FOUND | 404 | Kullanıcı bulunamadı |
| AUTH_USER_INACTIVE | 403 | Kullanıcı pasif |
| UNAUTHORIZED | 401 | Yetkilendirme gerekli |
| FORBIDDEN | 403 | Bu işlem için yetkiniz yok |

### Cari (Customer) Errors

| Code | HTTP Status | Varsayılan Mesaj |
|------|-------------|------------------|
| CARI_NOT_FOUND | 404 | Cari bulunamadı |
| CARI_DUPLICATE_CODE | 409 | Bu cari kodu zaten kullanılıyor |
| CARI_DELETE_HAS_RELATIONS | 422 | Bu cari silinemez, ilişkili kayıtlar var |
| CARI_INVALID_EMAIL | 400 | Geçersiz email adresi |
| CARI_INVALID_PHONE | 400 | Geçersiz telefon numarası |
| CARI_INVALID_TAX_NUMBER | 400 | Geçersiz vergi numarası |
| CARI_INACTIVE | 400 | Cari pasif |

### Work Order Errors

| Code | HTTP Status | Varsayılan Mesaj |
|------|-------------|------------------|
| WO_NOT_FOUND | 404 | İş emri bulunamadı |
| WO_DUPLICATE_NUMBER | 409 | İş emri numarası zaten mevcut |
| WO_INVALID_STATUS_TRANSITION | 422 | Geçersiz durum geçişi |
| WO_MISSING_REQUIRED_FIELD | 400 | Zorunlu alan eksik |
| WO_CANNOT_DELETE | 422 | İş emri silinemez |
| WO_ALREADY_INVOICED | 422 | Bu iş emri zaten faturalandırılmış |
| WO_ITEM_NOT_FOUND | 404 | İş emri kalemi bulunamadı |

### General Errors

| Code | HTTP Status | Varsayılan Mesaj |
|------|-------------|------------------|
| INTERNAL_SERVER_ERROR | 500 | Sunucu hatası oluştu |
| VALIDATION_ERROR | 400 | Girilen veriler geçersiz |
| INVALID_INPUT | 400 | Geçersiz giriş |
| NOT_FOUND | 404 | Kayıt bulunamadı |
| METHOD_NOT_ALLOWED | 405 | İzin verilmeyen method |
| CONFLICT | 409 | Çakışma var |
| DATABASE_ERROR | 500 | Veritabanı hatası |
| DATABASE_CONNECTION_ERROR | 503 | Veritabanı bağlantısı yok |
| DUPLICATE_ENTRY | 409 | Tekrar eden kayıt |
| FOREIGN_KEY_CONSTRAINT | 500 | Foreign key hatası |

**Diğer kategoriler (Hizmet, Tarife, Motorbot, Sefer, Barınma, Kurlar, Parametre, WorkLog, GateLog, Archive, Report, External API) için tam liste yukarıdaki tablolarda.**

## Kullanım Önerileri (Frontend)
```typescript
if (resp.success === false) {
  switch(resp.error.code) {
    case 'CARI_NOT_FOUND': // kullanıcıya uyarı göster
    case 'WO_INVALID_STATUS_TRANSITION': // form alanını kilitle
    // ...
  }
}
```

## Genişletme İlkeleri
- Mevcut kodlar asla yeniden adlandırılmaz (backward compatibility).
- Yeni domain → {DOMAIN}_{SEMANTIC_DESCR} formatı.
- HTTP status mapping her eklemede güncellenmeli.
- Varsayılan mesaj yoksa frontend fallback: `error.code`.

## Güncelleme Süreci
1. Gereksinim analizi → yeni hata tipi.
2. Enum ekle → mapping ekle → default mesaj (opsiyonel).
3. Test ekle (örn: invalid workflow → beklenen error.code).
4. Bu dosya ve `frontend/src/core/constants/errorCodes.ts` güncelle.

Son Güncelleme: 23 Kasım 2025