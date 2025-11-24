# Aliaport v3.1 Rate Limiting Politikaları

Bu doküman API üzerindeki oran sınırlarını (rate limits) ve uygulanma stratejilerini özetler.

## 1. Amaç
Brute force, parola sıfırlama istismarı, kaynak tüketimi ve spam istekleri azaltmak; aynı zamanda meşru kullanıcı deneyimini korumak.

## 2. Temel Kavramlar
- **Anahtar (key)**: Auth olmuş istekte `user:{user_id}`, aksi halde `ip:{client_ip}`.
- **Global Varsayılan**: `300/minute` (kimlikli + kimliksiz birleşik anahtar mantığı ile). Yazma yoğun endpointler ayrıca kısıtlanır.
- **Sıkı Limitler**: Hassas güvenlik/doğrulama uçlarında daha düşük eşikler.

## 3. Uygulanan Mevcut Politikalar
| Endpoint | Limit | Gerekçe |
|----------|-------|---------|
| GLOBAL (kimlikli/kimliksiz) | 300/dakika | Genel üst sınır, kaynak koruma |
| POST /auth/login | 10/dakika | Brute force deneme azaltma |
| POST /auth/request-reset | 5/saat | Email reset talebi spam engelleme |
| POST /auth/reset-password | 10/saat | Token kötüye kullanım ve tahmin denemeleri |
| POST /auth/refresh | 30/dakika | Yenileme fırtınasını azaltma |
| GET /auth/me, /auth/me/permissions | 120/dakika | UI periyodik sorguları için tolerans |
| Admin yazma uçları (/auth/users, role assign) | 20–30/dakika | Yönetim işlemlerinde makul tavan |

## 4. Yanıt Formatı (429)
Örnek JSON zarfı (gerçek uygulama artık X-RateLimit-* başlıklarını ekler):
```json
{
  "success": false,
  "message": "İstek sınırı aşıldı",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
    "details": {
      "route": "/auth/login",
      "policy": "10/minute"
    }
  }
}
```
Ek HTTP başlıkları (aktif):
- `X-RateLimit-Limit`: Pencere içindeki toplam izin verilen istek (ör: 10)
- `X-RateLimit-Remaining`: Pencere kapanana kadar kalan istek sayısı
- `X-RateLimit-Reset`: Pencere reset süresi (saniye olarak epoch offset)
- `Retry-After`: Kalan süre (saniye). Storage fallback durumunda HTTP-date yerine kalan saniye döner

Notlar:
- Header'lar SlowAPI `headers_enabled=True` ile otomatik enjekte edilir.
- Custom handler içinde `_inject_headers` çağrısı limit aşıldı senaryosunda da değerleri korur.
- Dağıtık mod (Redis) sonrası değerlerin tutarlılığı için tekil storage zorunlu.

## 5. Tasarım Kararları
1. **Auth-Aware Key**: Kullanıcı id bazlı anahtar brute force etkisini tek hesapla sınırlar; anonim istekler IP ile gruplanır.
2. **Fail-Open Emniyet**: Token parse başarısız olursa IP fallback (availability > katılık).
3. **Hassas Endpointler**: Login ve reset uçları intentionally düşük.
4. **İleride Dinamik Limit**: Rol bazlı (örn. yönetici rapor çıktıları) veya bölgesel burst izinleri.
5. **Konfigürasyon**: ENV üzerinden override (gelecekte: RATE_LIMIT_DEFAULT, RATE_LIMIT_LOGIN vb.).

## 6. Gelecek Geliştirmeler
- Dinamik `Retry-After` hesaplama (SlowAPI storage verisinden pencere sonu kalan süre).
- Kullanıcı rolüne göre arttırılmış okuma limitleri (örn. rapor inceleme).
- Redis backend ile dağıtık rate limit (current in-memory / process bazlı davranıştan çıkış).
- Proaktif uyarı (429 öncesi kalan hak < N iken uyarı header).
- Limitlemelerin Prometheus metriclerine yansıtılması (hit, exceeded counter).

## 7. Operasyonel İzleme
- Log satırı: `Rate limit exceeded: key=user:123 path=/auth/login` pattern.
- Öneri: Ayrı bir dashboard paneli (ELK / Grafana) ile 429 trend takibi.

## 8. Güvenlik Riskleri ve Mitigasyon
| Risk | Mitigasyon |
|------|------------|
| Credential brute force | Düşük login limit + ileride progressive backoff |
| Reset token flooding | Saatlik düşük limit + tek kullanımlı token yapısı |
| Dağıtık saldırılar (çok IP) | Gelecek: IP reputation / WAF entegrasyonu |
| Kaynak tüketimi (rapor) | Yazma/okuma diferansiyel limit + rol bazlı artırma |

## 9. Test Stratejisi
- Pytest: Aynı kullanıcı ile 11 login isteği -> Sonuncusu 429 + `RATE_LIMIT_EXCEEDED` kodu.
- IP bazlı test: Bearer yok -> key ip:... ile kısıt.

## 10. Sürümleme
- v1.0 (23-11-2025): İlk sürüm (statik başlık planı)
- v1.1 (23-11-2025): Dinamik X-RateLimit-* ve Retry-After başlıkları entegre edildi

## 11. SSS
- Neden 300/dakika? İlk kapasite tahmini; gerçek trafik gözlenerek ayarlanacak.
- Neden Redis yok? Dağıtık mimari sonraki faz (şimdilik tek proses). Redis eklendiğinde storage backend değişimi yapılacak.

---
Son güncelleme: 23 Kasım 2025 (v1.1)
