# Erişilebilirlik Hızlı Tarama (WCAG 2.1 AA)

Bu doküman 23 Kasım 2025 tarihinde gerçekleştirilen hızlı erişilebilirlik incelemesini ve yapılan iyileştirmeleri özetler.

## 1. Hedefler
- Klavye ile tam gezilebilirlik
- Odak görünürlüğü (focus-visible)
- Anlamlı landmark ve roller
- İkonların dekoratif / semantik ayrımı
- Sayfalama bileşeninde ekran okuyucu uyumu
- Ana içeriğe hızlı geçiş (skip link)

## 2. Tespitler & Aksiyonlar
| Alan | Sorun / Risk | Aksiyon | Durum |
|------|--------------|--------|-------|
| Focus stilleri | Tutarlı outline yok, tarayıcı default | Global `:focus-visible` stili eklendi | ✅ |
| Skip Link | Yok | `.skip-link` eklendi + görünür odakta | ✅ |
| Icon bileşeni | Fallback label yok, focusable olabilir | `focusable="false"`, fallback label, decorative mode | ✅ |
| Landmark yapısı | `<main>` id yok, roller eksik | `role="banner"`, `role="main"`, `role="contentinfo"` + id | ✅ |
| Pagination | `type="button"` yok, aria-disabled yok, aria-label statik | Butonlarda `type="button"`, `aria-disabled`, dinamik aria-label | ✅ |
| Mobil pagination | Erişilebilirlik benzer | Prev/Next butonlarına aria-disabled eklendi | ✅ |
| Kontrast | Birkaç uyarı: mavi 50 arka plan + mavi 600 metin sınırda | Tema dokümanındaki kontrast önerileri kullanılacak | ⚠️ İzlenecek |

## 3. Uygulanan Değişiklikler
- `frontend/src/shared/ui/Icon.tsx` → Fallback label, `focusable="false"`, decorative mod iyileştirme.
- `frontend/src/shared/ui/Pagination.tsx` → Button type, `aria-disabled`, dinamik `aria-label`.
- `frontend/src/shared/layouts/AppLayout.tsx` → Skip link, landmark roller, ana içerik id.
- `frontend/src/assets/styles/a11y.css` → Global focus-visible, skip-link, visually-hidden sınıfı.

## 4. Kullanım Rehberi
### 4.1 Icon
```tsx
<Icon name="add" />              // Ekran okuyucu: "add"
<Icon name="user-plus" title="Kullanıcı ekle" />
<Icon name="delete" decorative /> // aria-hidden
```

### 4.2 Skip Link
Uygulama başında otomatik yerleştirildi. Klavye ile `Tab` basıldığında görünür: "İçeriğe geç".

### 4.3 Focus Halkası
Varsayılan odak: 2px solid `--color-focus-ring` (fallback: #2563eb). Kendi komponentinde özelleştirmek için:
```css
.my-button:focus-visible { outline-color: #3b82f6; }
```

### 4.4 Pagination
Dinamik sayfa bileşeni ekran okuyucular için `aria-current="page"` işaretli. Örnek:
```tsx
<Pagination pagination={meta} onPageChange={setPage} />
```

## 5. İzleme / Sonraki Adımlar
| Adım | Açıklama | Öncelik |
|------|----------|---------|
| Kontrast tam doğrulama | Axe / Lighthouse ile otomasyon | Orta |
| Form hata erişilebilirliği | `aria-describedby` + hata id bağlama | Yüksek |
| Toast canlı bölge | `role="status"` + `aria-live="polite"` ekleme | Orta |
| Tablo başlıklarında scope | `<th scope="col">` denetimi | Orta |

## 6. Önerilen Minimum Lighthouse Hedefleri
- Accessibility Score ≥ 95
- Contrast Issues = 0
- Focusable but not tabbable = 0

## 7. Hızlı Checklist (Geliştiriciler İçin)
- [ ] Her interaktif öğe `button` ise `type="button"`
- [ ] Dekoratif ikonlar `decorative` prop ile gizli
- [ ] Form alanı hataları için açıklayıcı metin id bağlandı
- [ ] Skip link ilk tab'da görünür
- [ ] Renk kontrastı ≥ 4.5:1 (normal metin), ≥ 3:1 (large metin)

## 8. Kaynaklar
- WCAG 2.1 Quick Ref: https://www.w3.org/WAI/WCAG21/quickref/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Axe DevTools (Chrome eklentisi)

---
**Son Güncelleme:** 23 Kasım 2025
