# Aliaport v3.1 – OpenAPI & Endpoint Tasarım Notları

## Amaç
Backend entegrasyonlarında tüm endpoint'lerin tutarlı, tahmin edilebilir ve otomatik dokümante edilebilir olmasını sağlamak. FastAPI otomatik OpenAPI şemasını üretir; bu dosya ek kurallar ve genişletme stratejilerini belirtir.

## Standart Response Şeması
Her başarılı yanıt:
```json
{
  "success": true,
  "data": {"...": "..."},
  "message": "İşlem başarılı",
  "timestamp": "2025-11-23T12:34:56.789Z"
}
```

Hata yanıtı:
```json
{
  "success": false,
  "error": {
    "code": "CARI_NOT_FOUND",
    "message": "Cari bulunamadı",
    "details": {"cari_code": "X"},
    "field": null
  },
  "timestamp": "2025-11-23T12:34:56.789Z"
}
```

Sayfalı yanıt:
```json
{
  "success": true,
  "data": [ ... ],
  "message": "Liste başarıyla getirildi",
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 245,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2025-11-23T12:34:56.789Z"
}
```

## OpenAPI Şeması Genişletme
FastAPI otomatik olarak `StandardResponse` Pydantic modellerinden şema üretir. Aşağıdaki stratejilerle genişletilebilir:

1. Ek örnekler: `json_schema_extra` kullanımı (`responses.py` içinde).
2. Özel başlıklar: Request ID header (`X-Request-ID`) tanımı için `app.openapi()` override edilebilir.
3. Güvenlik şemaları (FAZ4): `components.securitySchemes` altında `bearerAuth` tanımlanacak.

Örnek override (ileride):
```python
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )
    # Header açıklaması ekle
    openapi_schema["components"]["headers"] = {
        "X-Request-ID": {"description": "Her isteğe özel UUID"}
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

## ErrorCode Entegrasyonu
Her `HTTPException` çağrısında:
```python
raise HTTPException(
  status_code=get_http_status_for_error(ErrorCode.CARI_NOT_FOUND),
  detail=error_response(
     code=ErrorCode.CARI_NOT_FOUND,
     message="Cari bulunamadı",
     details={"cari_code": code}
  )
)
```

Bu pattern sayesinde:
- Frontend sadece `error.code` ile ayrıştırma yapar.
- Kodlar Stable Contract olarak kabul edilir (semantik değişmez, yeni kod eklenir ama isim değiştirilmez).

## Yeni Endpoint Ekleme Checklist
1. Route dosyasını doğru domain altında ekle (`modules/<domain>/router.py`).
2. Pydantic schema → alias'lar snake_case DB alanlarını camel/pascal API alanlarına çeviriyorsa tutarlılık kontrol et.
3. Başarılı yanıt için `success_response(data=..., message="...")` kullan.
4. Liste/pagination durumunda `paginated_response()`.
5. Hata durumlarında Always: `raise HTTPException(status_code=get_http_status_for_error(ErrorCode.X), detail=error_response(...))`.
6. Gerekli filtre query parametrelerini `Query()` ile belgele.
7. Tarih/datetime parametreleri için ISO8601 beklentisini açıklama (description).
8. Performans notu (büyük listeler): `page_size` üst sınır (`le=500`) koy.
9. Security (FAZ4 sonrası): `@router.get(..., dependencies=[Depends(require_role(...))])` dekoratörü ekle.
10. İş kuralı olayları (onay, faturalama vb.) → `log_business_event()` çağır.

## Versiyonlama Stratejisi
Şu an v3.1. Stabil sözleşme kırılacaksa (breaking change):
- Eski endpoint'i `/api/v1/...` altına taşıma opsiyonu.
- Yeni endpoint'i `/api/v2/...` ile yayınlama.
- Deprecation duyurusu (docs + README).

## Response Tutarlılık Kuralları (Kısa)
| Kural | Açıklama |
|-------|----------|
| success bool | Her yanıt `true/false` içerir |
| timestamp | UTC ISO8601, backend üretir |
| message | Mutlaka kullanıcı okunabilir string |
| error.code | Enum değerleri, değiştirilmeyecek |
| pagination | Sadece liste yanıtlarında bulunur |
| data nullability | Hata durumunda data kullanılmaz |

## Hata Kodları Güncelleme Süreci
1. Yeni durum gereksinimi → domain lead tarafından belirlenir.
2. `ErrorCode` enum'una eklenir, mapping tablosuna HTTP status ilişkisi eklenir.
3. Varsayılan Türkçe mesaj `DEFAULT_ERROR_MESSAGES` içine eklenir.
4. Dokümantasyon (`ERROR_CODES.md`) güncellenir.
5. Frontend `errorCodes.ts` map'i güncellenir.

## Test Önerileri
- Contract test: Belirli endpoint hatalı input → beklenen `error.code`?
- Pagination test: Son sayfa `has_next` false doğrulanmalı.
- Timestamp test: Yanıt timestamp’i UTC formatında (`endswith('Z')` olmadan pydantic isoformat) → frontend parse.

## Gelecek (FAZ4/FAZ6)
- Auth → Security Schemes eklenmesi
- Rate Limit header’ları: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Correlation ID: `X-Request-ID` şemaya not ekleme
- Health/metrics endpoint’lerinin OpenAPI dışında bırakılması (opsiyonel)

---
Son Güncelleme: 23 Kasım 2025