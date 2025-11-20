# Audit Log ve Değişiklik Geçmişi Sistemi - Kullanım Kılavuzu

## 📋 Genel Bakış

Aliaport Liman Yönetim Sistemi'nde tüm kritik kayıtlar için kapsamlı bir audit trail (denetim izi) sistemi mevcuttur.

### Temel Özellikler

✅ **Değişiklik Geçmişi**: Her değişiklik kim, ne zaman, ne değiştirdi kaydedilir
✅ **Hareket Kontrolü**: Hareket varsa silme engellenir
✅ **Alan Bazlı Kilitleme**: Kod alanları değiştirilemez
✅ **Soft Delete**: Kayıtlar arşivlenir, fiziksel olarak silinmez
✅ **Kullanıcı İzleme**: Oluşturan ve güncelleyen kullanıcı bilgileri
✅ **Versiyon Kontrolü**: Her güncelleme yeni versiyon numarası

---

## 🎯 Kullanım Senaryoları

### 1. Hizmet Kartı Detay Sayfası

```tsx
import { AuditLogViewer } from "./components/AuditLogViewer";
import { RecordMetadataCard } from "./components/RecordMetadataCard";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";

function HizmetKartiDetay({ service, theme }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Ana İçerik */}
      <Card>
        <CardHeader>
          <CardTitle>{service.service_name}</CardTitle>
          <CardDescription>{service.service_code}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Hizmet detayları */}
        </CardContent>
      </Card>
      
      {/* Kayıt Metadata Kartı */}
      <RecordMetadataCard 
        tableName="services"
        recordId={service.id}
        theme={theme}
      />
      
      {/* Değişiklik Geçmişi */}
      <AuditLogViewer
        tableName="services"
        recordId={service.id}
        recordName={service.service_name}
        theme={theme}
      />
      
      {/* Silme Butonu */}
      <Button 
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        Hizmeti Sil
      </Button>
      
      {/* Silme Onay Dialogu */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        tableName="services"
        recordId={service.id}
        recordName={service.service_name}
        recordCode={service.service_code}
      />
    </div>
  );
}
```

---

### 2. Hizmet Düzenleme Formu

```tsx
import { FIELD_EDIT_RULES } from "../lib/types/audit";
import { logMultipleChanges } from "../lib/api/audit";

function HizmetKartiDuzenle({ service, onSave, theme }) {
  const [formData, setFormData] = useState(service);
  const [metadata, setMetadata] = useState<RecordMetadata | null>(null);
  
  // Metadata yükle
  useEffect(() => {
    loadMetadata();
  }, []);
  
  const loadMetadata = async () => {
    const data = await recordMetadataApiMock.getMetadata('services', service.id);
    setMetadata(data);
  };
  
  // Alan düzenlenebilir mi kontrol et
  const isFieldEditable = (fieldName: string): boolean => {
    const rules = FIELD_EDIT_RULES.services;
    const rule = rules.find(r => r.field_name === fieldName);
    
    if (!rule) return true;
    
    if (rule.editable === 'never') return false;
    if (rule.editable === 'always') return true;
    if (rule.editable === 'if_no_movements' && metadata?.has_movements) return false;
    
    return true;
  };
  
  // Değişiklikleri kaydet
  const handleSave = async () => {
    // Değişen alanları bul
    const changes = [];
    
    Object.keys(formData).forEach(key => {
      if (formData[key] !== service[key]) {
        changes.push({
          field: key,
          oldValue: service[key],
          newValue: formData[key],
        });
      }
    });
    
    if (changes.length > 0) {
      // Audit log kaydet
      await logMultipleChanges(
        'services',
        service.id,
        1, // Kullanıcı ID (gerçekte auth'dan gelecek)
        'Ahmet Yılmaz', // Kullanıcı adı
        changes,
        'Hizmet kartı güncellendi'
      );
    }
    
    // Kaydı güncelle
    onSave(formData);
  };
  
  return (
    <div className="space-y-6">
      {/* Hizmet Kodu - Değiştirilemez */}
      <div>
        <Label>Hizmet Kodu</Label>
        <Input 
          value={formData.service_code}
          disabled={true}
          className="bg-gray-800 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          Hizmet kodu değiştirilemez
        </p>
      </div>
      
      {/* Hizmet Adı - Her zaman düzenlenebilir */}
      <div>
        <Label>Hizmet Adı</Label>
        <Input 
          value={formData.service_name}
          onChange={(e) => setFormData({...formData, service_name: e.target.value})}
        />
      </div>
      
      {/* Birim - Hareket varsa düzenlenemez */}
      <div>
        <Label>Birim</Label>
        <Select 
          value={formData.unit_id}
          onValueChange={(value) => setFormData({...formData, unit_id: value})}
          disabled={!isFieldEditable('unit_id')}
        >
          {/* Birim seçenekleri */}
        </Select>
        {!isFieldEditable('unit_id') && (
          <p className="text-xs text-yellow-500 mt-1">
            ⚠️ Bu hizmete ait hareketler var, birim değiştirilemez
          </p>
        )}
      </div>
      
      {/* Kompakt Metadata Gösterimi */}
      <RecordMetadataCard
        tableName="services"
        recordId={service.id}
        theme={theme}
        compact={true}
      />
      
      <Button onClick={handleSave}>Kaydet</Button>
    </div>
  );
}
```

---

### 3. Cari Kartı Silme

```tsx
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { logChange } from "../lib/api/audit";

function CariKartlari({ theme }) {
  const [selectedCari, setSelectedCari] = useState<Customer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDeleteClick = (cari: Customer) => {
    setSelectedCari(cari);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedCari) return;
    
    try {
      // Soft delete işlemi
      await cariApi.update(selectedCari.id, { is_deleted: true });
      
      // Audit log kaydet
      await logChange(
        'customers',
        selectedCari.id,
        'DELETE',
        1, // Kullanıcı ID
        'Ahmet Yılmaz',
        undefined,
        undefined,
        undefined,
        `Cari kartı silindi: ${selectedCari.customer_name}`
      );
      
      // Liste yenile
      loadCariList();
      
    } catch (error) {
      console.error('Cari silinemedi:', error);
    }
  };
  
  return (
    <div>
      {/* Cari Listesi */}
      <Table>
        <TableBody>
          {cariList.map(cari => (
            <TableRow key={cari.id}>
              <TableCell>{cari.customer_code}</TableCell>
              <TableCell>{cari.customer_name}</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteClick(cari)}
                >
                  Sil
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Silme Onay Dialogu */}
      {selectedCari && (
        <DeleteConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          tableName="customers"
          recordId={selectedCari.id}
          recordName={selectedCari.customer_name}
          recordCode={selectedCari.customer_code}
        />
      )}
    </div>
  );
}
```

---

## 🔒 Alan Düzenleme Kuralları

### Hizmet Kartları (services)

| Alan | Kural | Açıklama |
|------|-------|----------|
| `service_code` | ❌ Hiç değiştirilemez | Sistem içinde unique referans |
| `service_name` | ✅ Her zaman değiştirilebilir | Display name |
| `description` | ✅ Her zaman değiştirilebilir | Açıklama metni |
| `unit_id` | ⚠️ Hareket yoksa değiştirilebilir | Birim değişimi faturaları etkiler |
| `pricing_rule_id` | ⚠️ Hareket yoksa değiştirilebilir | Fiyat hesaplamasını etkiler |
| `category_id` | ✅ Her zaman değiştirilebilir | Kategorilendirme |

### Cari Kartlar (customers)

| Alan | Kural | Açıklama |
|------|-------|----------|
| `customer_code` | ❌ Hiç değiştirilemez | Sistem içinde unique referans |
| `customer_name` | ✅ Her zaman değiştirilebilir | Firma/Şahıs adı |
| `customer_type` | ⚠️ Hareket yoksa değiştirilebilir | Şahıs/Firma ayrımı |
| `tax_number` | ⚠️ Hareket yoksa değiştirilebilir | Fatura vergi numarası |
| `currency` | ⚠️ Hareket yoksa değiştirilebilir | Para birimi değişimi bakiyeleri etkiler |
| `phone`, `email`, `address` | ✅ Her zaman değiştirilebilir | İletişim bilgileri |

### Motorbot Kartları (motorboats)

| Alan | Kural | Açıklama |
|------|-------|----------|
| `motorboat_code` | ❌ Hiç değiştirilemez | Sistem içinde unique referans |
| `motorboat_name` | ✅ Her zaman değiştirilebilir | Motorbot adı |
| `capacity` | ⚠️ Hareket yoksa değiştirilebilir | Kapasite seferleri etkiler |
| `model`, `year`, `license_plate` | ✅ Her zaman değiştirilebilir | Tanımlayıcı bilgiler |

---

## 🗑️ Silme Kuralları

### Hareket Kontrolü

```typescript
// Silme işlemi öncesi kontrol
const validation = await recordMetadataApiMock.checkDeletable('services', serviceId);

if (validation.can_delete) {
  // Silinebilir
  await hizmetApi.delete(serviceId);
} else {
  // Silinemez - Hata mesajı göster
  alert(validation.reason);
  // Örnek: "Bu kayda ait 45 adet hareket bulunmaktadır. Önce hareketleri silmeniz gerekmektedir."
}
```

### Soft Delete vs Hard Delete

**Soft Delete (Önerilen):**
```typescript
// Kayıt arşivlenir, fiziksel olarak silinmez
await hizmetApi.update(serviceId, { 
  is_deleted: true,
  deleted_at: new Date().toISOString(),
  deleted_by: userId 
});
```

**Hard Delete (Sadece hareket yoksa):**
```typescript
// Fiziksel silme
const validation = await recordMetadataApiMock.checkDeletable('services', serviceId);
if (validation.can_delete && validation.movement_count === 0) {
  await hizmetApi.delete(serviceId);
}
```

---

## 📊 Durum Yönetimi

### Durum Geçişleri

```
TASLAK → AKTİF → PASİF → ARŞİV
   ↓
  İPTAL (Geri dönüşü yok)
```

### Durum Değiştirme

```typescript
import { STATUS_TRANSITIONS } from "../lib/types/audit";

// Geçiş kontrolü
const canTransition = (currentStatus: RecordStatus, newStatus: RecordStatus): boolean => {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

// Durum değiştir
const changeStatus = async (recordId: number, newStatus: RecordStatus) => {
  const currentStatus = record.status;
  
  if (!canTransition(currentStatus, newStatus)) {
    throw new Error(`${currentStatus} → ${newStatus} geçişi yapılamaz`);
  }
  
  // Durum güncelle
  await hizmetApi.update(recordId, { status: newStatus });
  
  // Audit log kaydet
  await logChange(
    'services',
    recordId,
    'STATUS_CHANGE',
    userId,
    userName,
    'status',
    currentStatus,
    newStatus,
    `Durum değiştirildi: ${currentStatus} → ${newStatus}`
  );
};
```

---

## 💡 Best Practices

### 1. Her Değişikliği Logla

```typescript
// ✅ DOĞRU
const handleUpdate = async () => {
  const changes = detectChanges(oldData, newData);
  
  // Önce audit log
  await logMultipleChanges('services', serviceId, userId, userName, changes);
  
  // Sonra güncelle
  await hizmetApi.update(serviceId, newData);
};

// ❌ YANLIŞ
const handleUpdate = async () => {
  await hizmetApi.update(serviceId, newData);
  // Audit log yok!
};
```

### 2. Silme Önce Kontrol Et

```typescript
// ✅ DOĞRU
const handleDelete = async () => {
  const validation = await recordMetadataApiMock.checkDeletable('services', serviceId);
  
  if (!validation.can_delete) {
    showError(validation.reason);
    return;
  }
  
  await hizmetApi.delete(serviceId);
};

// ❌ YANLIŞ
const handleDelete = async () => {
  await hizmetApi.delete(serviceId);
  // Hareket kontrolü yok!
};
```

### 3. Alan Düzenleme İzinlerini Kontrol Et

```typescript
// ✅ DOĞRU
<Input 
  value={formData.unit_id}
  disabled={!isFieldEditable('unit_id')}
/>

// ❌ YANLIŞ
<Input 
  value={formData.unit_id}
  // Hareket varsa da değiştirilebilir - YANLIŞ!
/>
```

---

## 📝 Örnek Senaryolar

### Senaryo 1: Hizmet Adı Değiştirme

1. Kullanıcı "Motorbot Sefer" → "Motorbot Sefer Hizmeti" olarak değiştiriyor
2. Sistem:
   - ✅ Değişikliği kaydeder
   - ✅ Audit log oluşturur: `UPDATE | service_name | "Motorbot Sefer" → "Motorbot Sefer Hizmeti" | Ahmet Yılmaz | 19.11.2025 14:30`
   - ✅ Versiyon numarasını artırır: v2 → v3

### Senaryo 2: Hizmet Birimini Değiştirme (Hareket Var)

1. Kullanıcı hizmetin birimini değiştirmeye çalışıyor
2. Sistem:
   - ❌ Hareket kontrolü: 45 fatura kalemi bulundu
   - ❌ Değişiklik engellendi
   - ⚠️ Uyarı mesajı: "Bu hizmete ait hareketler var, birim değiştirilemez"

### Senaryo 3: Cari Silme (Hareket Var)

1. Kullanıcı cariyi silmeye çalışıyor
2. DeleteConfirmDialog açılır:
   - ❌ "Bu kayıt silinemez!"
   - ℹ️ "Bu kayda ait 120 adet hareket bulunmaktadır"
   - 📋 İlişkili kayıtlar: "Faturalar - 120 kayıt"
   - 💡 Çözüm: "Önce faturaları silin veya kaydı Pasif duruma alın"

---

## 🚀 Sonraki Adımlar

1. **Parametreler → Kullanıcılar** menüsünden audit loglarını görüntüleyin
2. **Herhangi bir hizmet kartını** açın ve "Değişiklik Geçmişi" sekmesini inceleyin
3. **Hareketi olan bir kaydı** silmeye çalışın ve uyarı mesajını görün
4. **Kod alanlarını** düzenlemeye çalışın ve disabled olduğunu görün

---

## 📚 İlgili Dosyalar

- `/lib/types/audit.ts` - Tip tanımları ve kurallar
- `/lib/api/audit.ts` - API endpoint'leri ve helper fonksiyonlar
- `/components/AuditLogViewer.tsx` - Değişiklik geçmişi görüntüleyici
- `/components/RecordMetadataCard.tsx` - Kayıt metadata kartı
- `/components/DeleteConfirmDialog.tsx` - Silme onay dialogu

**Sistem hazır ve kullanıma uygun! 🎉**
