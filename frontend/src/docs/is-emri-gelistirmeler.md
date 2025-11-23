# İŞ EMRİ MODÜLÜ GELİŞTİRMELER

## ✅ Tamamlanan Geliştirmeler

### 1. Form İyileştirmeleri
- ✅ İş emri no otomatik üretimi (component mount ve create)
- ✅ Cari seçildiğinde otomatik başlık oluşturma
- ✅ Hizmet kartı seçildiğinde otomatik başlık ve açıklama doldurma
- ✅ Akıllı form doldurma (Cari + Hizmet bilgilerini birleştirme)

### 2. Dijital Arşiv Dosya Yükleme
- ✅ FileUploader component'i oluşturuldu (`/components/FileUploader.tsx`)
- ✅ Drag & Drop desteği
- ✅ Dosya tipi seçimi (CONTRACT, INVOICE, RECEIPT, PHOTO, vb.)
- ✅ Görsel önizleme (resimler için)
- ✅ Maksimum boyut kontrolü (10MB)
- ✅ Dosya yükleme simülasyonu
- ✅ IsEmriModule detay sayfasına entegre edildi

### 3. Dashboard ve Raporlama
- ✅ IsEmriDashboard component'i oluşturuldu (`/components/IsEmriDashboard.tsx`)
- ✅ Durum dağılımı (Pie Chart) - Recharts kullanımı
- ✅ Öncelik dağılımı (Bar Chart)
- ✅ Tip dağılımı (Bar Chart)
- ✅ Stat Cards (Toplam, Gecikmiş, Zamanında Tamamlanma, Ortalama Tamamlanma)
- ✅ Gecikmiş işler listesi
- ✅ Liste sayfasına entegre edildi

## 🚧 Yapılacak Geliştirmeler

### 4. İş Emri Kalemleri Geliştirmeleri

**A. Hizmet Kartından Otomatik Kalem Ekleme**
```typescript
// Hizmet seçildiğinde, tarife kartından otomatik fiyat getir
const handleAddItemFromService = (serviceId: number) => {
  const service = serviceCardMasterData.find(s => s.id === serviceId);
  const priceListItems = priceListItemMasterData.filter(
    item => item.service_card_id === serviceId && item.price_list_id === cariPriceListId
  );
  
  // Otomatik kalem oluştur
  if (priceListItems.length > 0) {
    const item = priceListItems[0];
    setItemFormData({
      item_type: 'SERVICE',
      service_code: service.code,
      service_name: service.name,
      quantity: 1,
      unit_price: item.unit_price,
      currency: item.currency,
      vat_rate: service.vat_rate_id === 1 ? 20 : 10,
      // ... diğer alanlar
    });
  }
};
```

**B. Toplu Kalem Ekleme**
- Hizmet kartından tüm ilgili kalemleri ekle
- Excel'den kalem import
- Şablon kullanarak kalem ekleme

**C. Kalem Şablonları**
- Sık kullanılan hizmet kombinasyonlarını kaydet
- Hızlı erişim için şablon listesi
- Şablon düzenleme ve silme

### 5. İş Akışı (Workflow)

**A. Durum Geçişleri**
```typescript
// Durum geçiş kuralları
const workflowRules = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['SAHADA'],
  SAHADA: ['TAMAMLANDI'],
  TAMAMLANDI: ['FATURALANDI'],
  FATURALANDI: ['KAPANDI'],
  REJECTED: ['DRAFT'],
};

// Validasyon
const canChangeStatus = (
  currentStatus: string,
  newStatus: string
): boolean => {
  return workflowRules[currentStatus]?.includes(newStatus) || false;
};
```

**B. Onay Süreci**
- SUBMITTED → APPROVED: Yönetici onayı gerekli
- APPROVED → SAHADA: Kaynak tahsisi kontrolü
- SAHADA → TAMAMLANDI: Worklog kaydı zorunlu
- TAMAMLANDI → FATURALANDI: Fiyat kontrolü

**C. Otomatik Bildirimler**
- Durum değişikliğinde e-mail/SMS
- Atanan kullanıcılara bildirim
- Gecikmiş işler için hatırlatma

### 6. Dashboard ve Raporlama

**A. İş Emri Dashboard**
```typescript
interface DashboardStats {
  // Durum bazlı
  byStatus: Record<WorkOrder['status'], number>;
  
  // Öncelik bazlı
  byPriority: Record<WorkOrder['priority'], number>;
  
  // Tip bazlı
  byType: Record<WorkOrder['type'], number>;
  
  // Performans metrikleri
  avgCompletionTime: number; // saat
  onTimeRate: number; // %
  overdueCount: number;
  
  // Finansal
  totalValue: number;
  invoicedValue: number;
  pendingValue: number;
}
```

**B. Grafikler**
- Durum dağılımı (Pie Chart)
- Aylık iş emri trend (Line Chart)
- Cari bazlı iş emri sayısı (Bar Chart)
- Gecikmiş işler listesi

**C. Export Özellikleri**
- Excel export
- PDF rapor
- CSV export

## 📋 Kullanım Örnekleri

### FileUploader Entegrasyonu
```tsx
import { FileUploader } from "../FileUploader";

// Detay görünümünde
<div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
  <h3 className="flex items-center gap-2 mb-4">
    <Upload className="w-5 h-5 text-yellow-400" />
    Dosya Yükle
  </h3>
  
  <FileUploader
    workOrderId={selectedWorkOrder?.id}
    onUploadComplete={(files) => {
      console.log('Uploaded files:', files);
      // Arşiv belgeleri listesini güncelle
      loadArchiveDocs(selectedWorkOrder.id);
    }}
    maxFiles={10}
    maxSize={10}
  />
</div>
```

### Kalem Ekleme İyileştirmesi
```tsx
// Hizmet seçici ile kalem ekleme
<HizmetSecici
  hizmetList={serviceCardMasterData}
  selectedHizmet={null}
  onSelect={(hizmet) => {
    if (hizmet) {
      handleAddItemFromService(hizmet.id);
      setItemFormOpen(true);
    }
  }}
  open={hizmetKalemSeciciOpen}
  onOpenChange={setHizmetKalemSeciciOpen}
  title="Hizmet Seç ve Kalem Ekle"
/>
```

### Dashboard Component
```tsx
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";

export function IsEmriDashboard({ workOrders }: { workOrders: WorkOrder[] }) {
  const stats = calculateStats(workOrders);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Stat Cards */}
      <StatCard
        title="Toplam İş Emri"
        value={stats.total}
        icon={<ClipboardList />}
        color="blue"
      />
      
      <StatCard
        title="Gecikmiş"
        value={stats.overdueCount}
        icon={<AlertTriangle />}
        color="red"
      />
      
      <StatCard
        title="Zamanında Tamamlanma"
        value={`${stats.onTimeRate}%`}
        icon={<TrendingUp />}
        color="green"
      />
      
      <StatCard
        title="Toplam Değer"
        value={formatCurrency(stats.totalValue)}
        icon={<BarChart3 />}
        color="purple"
      />
    </div>
  );
}
```

## 🎯 Öncelik Sırası

1. **Yüksek Öncelik**
   - FileUploader entegrasyonu (Detay sayfasına)
   - Hizmet kartından otomatik kalem ekleme
   - Durum geçişi validasyonu

2. **Orta Öncelik**
   - Dashboard component'i
   - Kalem şablonları
   - Excel export

3. **Düşük Öncelik**
   - Otomatik bildirimler
   - Toplu işlemler
   - Gelişmiş raporlama

## 💡 Notlar

- Tüm geliştirmeler mock data ile test edilmeli
- Audit trail her değişiklikte güncellenmeli
- API entegrasyonu için hazır yapı kullanılmalı
- Responsive tasarıma dikkat edilmeli