# Veritabanı İndeks Stratejisi (2025-11-23)

Bu doküman; mevcut modellerde eksik olan tekil (single-column) indeksleri ve sorgu kalıplarını hızlandırmak için önerilen bileşik (composite) indeksleri listeler. Amaç; yüksek hacimli listeleme, durum bazlı dashboard, son kayıt / güncel durum sorguları ve faturalama / tarife erişim senaryolarını optimize etmektir.

## Rehber İlkeler
- Az fakat etkili: Sorgu predicate'lerinde düzenli kullanılan ve seçiciliği orta/yüksek kolonlar.
- Bileşik indeks kolon sırası: En sık filtrelenen ilk; sıralama / aralık sorgusu son.
- Aşırı indeks yok: Yazma maliyetini arttıracak gereksiz kombinasyonlardan kaçınıldı.
- SQLite kullanılıyor: Partial (WHERE koşullu) indeksler desteklenir ancak başlangıçta minimal set uygulanır.

## Tekil İndeks Gereksinimleri (Modelde index=True olup migration'da henüz yok)
| Tablo | Kolon | Tip | Not |
|-------|-------|-----|-----|
| work_order | wo_number | UNIQUE | İş emri numarası lookup |
| work_order | cari_code | NONUNIQUE | Cari bazlı filtre |
| work_order | type | NONUNIQUE | Tip + durum filtreleri |
| work_order | status | NONUNIQUE | Dashboard / liste |
| work_order_item | work_order_id | NONUNIQUE | Kalemleri çekme |
| work_order_item | wo_number | NONUNIQUE | Alternatif join / lookup |
| work_order_item | is_invoiced | NONUNIQUE | Faturalama kuyruğu |
| Cari | CariKod | UNIQUE | Müşteri / tedarikçi lookup |
| PriceList | Kod | UNIQUE | Tarife seçimi |
| PriceListItem | PriceListId | NONUNIQUE | Tarife kalemleri |
| Parametre | Kategori | NONUNIQUE | Parametre listeleme |
| Parametre | Kod | UNIQUE | Tekil parametre erişimi |
| ExchangeRate | CurrencyFrom | NONUNIQUE | Kur çifti filtre |
| ExchangeRate | CurrencyTo | NONUNIQUE | Kur çifti filtre |
| ExchangeRate | RateDate | NONUNIQUE | Tarih bazlı sorgu |
| Hizmet | Kod | UNIQUE | Hizmet kartı erişimi |
| users | email | UNIQUE | Auth lookup |
| roles | name | UNIQUE | RBAC rol erişimi |
| permissions | name | UNIQUE | RBAC izin erişimi |
| permissions | resource | NONUNIQUE | Kaynak bazlı filtre |
| gatelog | wo_number | NONUNIQUE | İş emri kapı hareketleri |
| gatelog | wo_status | NONUNIQUE | Durum bazlı kapı hareketleri |
| gatelog | gate_time | NONUNIQUE | Son hareket seçimi |
| gate_checklist_item | wo_type | NONUNIQUE | Tip bazlı checklist |
| gate_checklist_item | is_active | NONUNIQUE | Aktif öğeler |

## Bileşik İndeks Önerileri
| Tablo | Kolonlar | Rasyonel |
|-------|----------|----------|
| work_order | (status, planned_start) | Operasyonel durum + zaman aralığı planlama filtreleri |
| work_order | (cari_code, status) | Cari bazında açık iş emirleri |
| work_order_item | (is_invoiced, work_order_id) | Faturalama bekleyen kalemler (iş emri içi) |
| work_order_item | (service_code, is_invoiced) | Hizmet bazında faturalama kuyruğu |
| MbTrip | (MotorbotId, SeferTarihi) | Motorbot günlük / tarih aralığı sorguları |
| MbTrip | (Durum, SeferTarihi) | Planlanmış / aktif seferleri kronolojik liste |
| PriceList | (AktifMi, GecerlilikBaslangic, GecerlilikBitis) | Geçerli aktif tarifeler aralıklı sorgu |
| PriceList | (Durum, AktifMi) | Durum + aktiflik dashboard |
| PriceListItem | (PriceListId, HizmetKodu) | Tarife içi hizmet hızlı erişim |
| Parametre | (Kategori, AktifMi) | Kategori bazlı aktif parametre listesi |
| ExchangeRate | (CurrencyFrom, CurrencyTo, RateDate) | Kur çifti belirli gün sorgusu |
| gatelog | (wo_number, gate_time) | Belirli iş emrinin son giriş/çıkışı |
| gatelog | (wo_status, gate_time) | Duruma göre en güncel hareketler |
| gatelog | (is_exception, gate_time) | İstisnaların kronolojik incelemesi |
| gate_checklist_item | (wo_type, is_active, display_order) | Checklist render sırası |
| Hizmet | (GrupKod, AktifMi) | Grup bazlı aktif hizmet listesi |

## Gelecekteki Opsiyonel Partial İndeksler (Post-Usage Ölçüm)
| Tablo | Tanım | Örnek |
|-------|-------|-------|
| gatelog | İstisna kayıtları | `CREATE INDEX ix_gatelog_exception_recent ON gatelog(gate_time) WHERE is_exception = 1;` |
| work_order_item | Faturalanmamış kalemler | `CREATE INDEX ix_work_order_item_uninvoiced ON work_order_item(work_order_id) WHERE is_invoiced = 0;` |
| PriceListItem | Aktif kalemler | `CREATE INDEX ix_pricelistitem_active ON "PriceListItem"(PriceListId) WHERE AktifMi = 1;` |

## İzleme ve Doğrulama
1. Uygulama sonrası sorgu planları (EXPLAIN) gözlenmeli.
2. Yazma performansı olumsuz etkilenirse en az kullanılan bileşik indeksler kaldırılmalı.
3. İndeks kullanım oranı ("seq scan" vs "index scan") ölçümlenerek partial indeks gerekliliği kararlaştırılmalı.

## Geri Dönüş Stratejisi (Rollback)
Migration ile oluşturulan tüm indeksler downgrade'de temizlenecek. Önce bileşik indeksler, sonra tekil indeksler kaldırılır.

---
Başlangıç paketinin amacı sorgu deneyimini stabilize etmektir; sonraki iterasyonlarda gerçek sorgu metrikleri ile rafine edilecektir.
