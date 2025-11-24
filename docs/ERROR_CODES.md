# Aliaport v3.1 - ERROR_CODES Rehberi

Bu doküman `backend/aliaport_api/core/error_codes.py` içinde tanımlı tutarlı hata kodu (ErrorCode) altyapısının kullanımını, HTTP durum kodu eşlemelerini ve örnek senaryoları açıklar.

## 1. Amaç
- İstemci tarafında (frontend, entegrasyonlar) deterministik hata işleme.
- Log ve izleme (monitoring) katmanında sınıflandırılabilir olaylar.
- Dokümantasyonda sade ve tekrar kullanılabilir referans.

## 2. Tasarım İlkeleri
| İlke | Açıklama |
|------|---------|
| Sabit İsimlendirme | UPPER_SNAKE_CASE + modül/bağlam prefix: `CARI_NOT_FOUND`, `AUTH_TOKEN_EXPIRED` |
| HTTP Uyumu | Her kod doğrudan tek bir HTTP status'a map edilir (örn. `CARI_NOT_FOUND` → 404). |
| Mesaj Yerelleştirme | Varsayılan Türkçe mesaj `DEFAULT_ERROR_MESSAGES` içinde; frontend çeviri isteğe bağlı. |
| Detay Alanı | `error.details` serbest JSON; ek alanlar (ör. `required_permissions`, `expires_at`) buraya. |
| Genişletilebilirlik | Yeni modül eklerken sadece enum'a ve mapping dict'lerine ekleme yeterli. |

## 3. Hata Kodu Kategorileri
Başlıca kategoriler enum içinde gruplanmıştır:
- Genel: `INTERNAL_SERVER_ERROR`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`
- Database: `DATABASE_ERROR`, `DUPLICATE_ENTRY`, `FOREIGN_KEY_CONSTRAINT`
- Modül Bazlı: `CARI_*`, `MOTORBOT_*`, `SEFER_*`, `HIZMET_*`, `TARIFE_*`, `BARINMA_*`, `KUR_*`, `PARAMETRE_*`, `WO_*`, `WORKLOG_*`, `GATELOG_*`, `ARCHIVE_*`, `REPORT_*`
- Auth: `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `AUTH_INSUFFICIENT_PERMISSIONS`, vb.
- External: `EXTERNAL_API_ERROR`, `EVDS_API_ERROR`, `EMAIL_SEND_ERROR`, `SMS_SEND_ERROR`
- Rate Limiting: `RATE_LIMIT_EXCEEDED`

## 4. HTTP Status Eşlemeleri
Seçilmiş önemli kodlar (tam liste için dosyaya bakınız):
| ErrorCode | HTTP | Açıklama |
|-----------|------|---------|
| `VALIDATION_ERROR` | 400 | Girdi şema validasyonu başarısız |
| `INVALID_INPUT` | 400 | İş kuralı veya format hatası |
| `UNAUTHORIZED` | 401 | Kimlik doğrulama yok/başarısız |
| `AUTH_INVALID_CREDENTIALS` | 401 | Yanlış email/şifre |
| `AUTH_TOKEN_EXPIRED` | 401 | Süresi dolmuş JWT |
| `AUTH_TOKEN_INVALID` | 401 | Bozuk veya imzası geçersiz token |
| `FORBIDDEN` | 403 | Yetki yok (genel) |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | RBAC izin yetersiz |
| `NOT_FOUND` | 404 | Genel bulunamadı |
| `CARI_NOT_FOUND` | 404 | Cari kaydı yok |
| `WO_NOT_FOUND` | 404 | İş emri kaydı yok |
| `CONFLICT` | 409 | Genel çatışma |
| `DUPLICATE_ENTRY` | 409 | Benzersiz alan tekrar |
| `RATE_LIMIT_EXCEEDED` | 429 | Çok fazla istek (SlowAPI) |
| `INTERNAL_SERVER_ERROR` | 500 | Yakalanmamış uygulama hatası |
| `DATABASE_CONNECTION_ERROR` | 503 | DB erişilemiyor |

## 5. Varsayılan Mesajlar
`DEFAULT_ERROR_MESSAGES` sözlüğünde belirli kodlar için Türkçe kısa açıklamalar:
```python
DEFAULT_ERROR_MESSAGES = {
  ErrorCode.INTERNAL_SERVER_ERROR: "Sunucu hatası oluştu",
  ErrorCode.VALIDATION_ERROR: "Girilen veriler geçersiz",
  ErrorCode.UNAUTHORIZED: "Yetkilendirme gerekli",
  ErrorCode.CARI_NOT_FOUND: "Cari bulunamadı",
  ErrorCode.RATE_LIMIT_EXCEEDED: "İstek sınırı aşıldı",
  # ...
}
```
Mesaj bulunmazsa `error_code.value` fallback olarak döner.

## 6. Standart Yanıt Zarfı (Hata)
Backend yanıt formatı:
```json
{
  "success": false,
  "error": {
    "code": "CARI_NOT_FOUND",
    "message": "Cari bulunamadı",
    "details": {
      "searched_code": "C001"
    }
  },
  "timestamp": "2025-11-23T10:30:00Z"
}
```

## 7. Backend Kullanımı
### 7.1 Hata Fırlatma (Manual)
```python
from fastapi import HTTPException
from aliaport_api.core.error_codes import ErrorCode, get_http_status_for_error
from aliaport_api.core.responses import error_response

raise HTTPException(
  status_code=get_http_status_for_error(ErrorCode.CARI_NOT_FOUND),
  detail=error_response(
    code=ErrorCode.CARI_NOT_FOUND,
    message="Cari bulunamadı",
    details={"searched_code": cari_kod}
  )
)
```
### 7.2 Global Exception Handler
İş kuralı dışındaki yakalanmamış hatalar `INTERNAL_SERVER_ERROR` koduyla standardize edilir.

### 7.3 RBAC Decorator Örneği
```python
# require_permission başarısız olursa:
error_response(
  code=ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
  message="İzin eksik",
  details={
    "required_permissions": ["admin:write"],
    "user_permissions": ["cari:read"],
    "mode": "all"
  }
)
```

## 8. Frontend İşleme Örneği
```typescript
interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

function handleApiError(err: ApiErrorEnvelope) {
  switch (err.error.code) {
    case 'AUTH_TOKEN_EXPIRED':
      // refresh token akışı tetikle
      break;
    case 'RATE_LIMIT_EXCEEDED':
      showToast('Çok fazla istek, lütfen bekleyin');
      break;
    default:
      showToast(err.error.message);
  }
}
```

## 9. Rate Limit Özel Durumu
`RateLimitExceeded` FastAPI exception'ı özel handler ile:
```json
{
  "success": false,
  "message": "İstek sınırı aşıldı",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Çok fazla istek. Lütfen daha sonra tekrar deneyin.
",
    "details": {"route": "/auth/login", "policy": "10/minute"}
  }
}
```
Gelecek iyileştirme: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dinamik `Retry-After` header.

## 10. Yeni Kod Ekleme Adımları
1. Enum'a yeni değer ekle: `class ErrorCode(str, Enum): NEW_MODULE_SOMETHING = "NEW_MODULE_SOMETHING"`
2. HTTP mapping: `ERROR_CODE_TO_HTTP_STATUS[ErrorCode.NEW_MODULE_SOMETHING] = 422`
3. Varsayılan mesaj (opsiyonel): `DEFAULT_ERROR_MESSAGES[ErrorCode.NEW_MODULE_SOMETHING] = "Açıklama"`
4. Router/service içinde kullanım: `error_response(code=ErrorCode.NEW_MODULE_SOMETHING, ...)`
5. Dokümana tabloya ekle (bu dosya güncelle)

## 11. Sık Yapılan Hatalar
| Durum | Çözüm |
|-------|-------|
| Mesaj detayları doğrudan `detail` yerine `error.details` altına yazılmamış | `error_response(..., details={})` kullanın |
| HTTPException içine raw dict koyma | `error_response` ile zarfı üretin, `status_code` mapping ile uyum sağlayın |
| Kod mapping eksik → 500 dönmesi | `ERROR_CODE_TO_HTTP_STATUS` içine ekleyin |
| Frontend locale ihtiyacı | Mesaj içindeki stringleri i18n katmanına aktarın |

## 12. Checklist (Kod Eklerken)
- [ ] Enum'a eklendi
- [ ] HTTP mapping eklendi
- [ ] Varsayılan mesaj (gerekirse) eklendi
- [ ] Router/service'lerde kullanım testi yapıldı
- [ ] Bu doküman güncellendi
- [ ] Frontend error handler gerekli ise güncellendi

## 13. Versiyonlama
Bu doküman v1.0 (23 Kasım 2025). Yeni kod eklenince minör versiyon artırılmalı (v1.1, v1.2 ...).

## 14. Önerilen Gelecek Geliştirmeler
- Kod gruplama meta verisi (örn. severity: LOW/MEDIUM/HIGH)
- Otomatik OpenAPI response örneği jeneratörü
- Error korrelasyon ID (trace context) ekleme

---
Son Güncelleme: 23 Kasım 2025
