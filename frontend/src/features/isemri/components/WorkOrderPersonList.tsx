/**
 * İŞ EMRİ KİŞİ LİSTESİ - WorkOrderPerson CRUD UI
 * 
 * Özellikler:
 * - Kişi listesi görüntüleme
 * - Yeni kişi ekleme formu (TC/Pasaport seçimi)
 * - Kişi düzenleme
 * - Kişi silme
 * - TC Kimlik No / Pasaport No validasyonu
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { User, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

interface WorkOrderPerson {
  Id: number;
  WorkOrderId: number;
  WorkOrderItemId?: number;
  FullName: string;
  TcKimlik?: string;  // ✅ Backend field name
  Pasaport?: string;  // ✅ Backend field name
  Nationality?: string;
  Phone?: string;
  IdentityDocumentId?: number;
  IdentityPhotoUrl?: string;
  SecurityNotes?: string;
  SecurityApproved?: boolean;
  CreatedAt: string;
}

interface WorkOrderPersonListProps {
  workOrderId: number;
  persons: WorkOrderPerson[];
  onAdd: (person: Omit<WorkOrderPerson, 'Id' | 'CreatedAt'>) => void;
  onEdit: (personId: number, person: Partial<WorkOrderPerson>) => void;
  onDelete: (personId: number) => void;
}

const COUNTRIES = [
  { code: 'TUR', name: 'Türkiye' },
  { code: 'USA', name: 'Amerika Birleşik Devletleri' },
  { code: 'GBR', name: 'Birleşik Krallık' },
  { code: 'DEU', name: 'Almanya' },
  { code: 'FRA', name: 'Fransa' },
  { code: 'CHN', name: 'Çin' },
  { code: 'RUS', name: 'Rusya' },
  { code: 'JPN', name: 'Japonya' },
  { code: 'ESP', name: 'İspanya' },
  { code: 'ITA', name: 'İtalya' },
];

export function WorkOrderPersonList({ 
  workOrderId, 
  persons, 
  onAdd, 
  onEdit, 
  onDelete 
}: WorkOrderPersonListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<WorkOrderPerson | null>(null);
  
  // Form state
  const [idType, setIdType] = useState<'tc' | 'passport'>('tc');
  const [formData, setFormData] = useState({
    fullName: '',
    tcKimlikNo: '',
    passportNo: '',
    nationality: 'TUR',
    phone: '',
    securityNotes: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Ad Soyad zorunludur';
    }
    
    if (idType === 'tc') {
      if (!formData.tcKimlikNo.trim()) {
        newErrors.tcKimlikNo = 'TC Kimlik No zorunludur';
      } else if (formData.tcKimlikNo.length !== 11) {
        newErrors.tcKimlikNo = 'TC Kimlik No 11 haneli olmalıdır';
      } else if (!/^\d+$/.test(formData.tcKimlikNo)) {
        newErrors.tcKimlikNo = 'TC Kimlik No sadece rakamlardan oluşmalıdır';
      }
    } else {
      if (!formData.passportNo.trim()) {
        newErrors.passportNo = 'Pasaport No zorunludur';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const personData = {
      WorkOrderId: workOrderId,
      FullName: formData.fullName,
      TcKimlik: idType === 'tc' ? formData.tcKimlikNo : undefined,  // ✅ Backend field
      Pasaport: idType === 'passport' ? formData.passportNo : undefined,  // ✅ Backend field
      Nationality: formData.nationality,
      Phone: formData.phone || undefined,
      SecurityNotes: formData.securityNotes || undefined,
    };
    
    if (editingPerson) {
      onEdit(editingPerson.Id, personData);
      setEditingPerson(null);
    } else {
      onAdd(personData);
    }
    
    resetForm();
    setIsAddDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      tcKimlikNo: '',
      passportNo: '',
      nationality: 'TUR',
      phone: '',
      securityNotes: '',
    });
    setErrors({});
    setIdType('tc');
  };

  const handleEdit = (person: WorkOrderPerson) => {
    setEditingPerson(person);
    setIdType(person.TcKimlik ? 'tc' : 'passport');
    setFormData({
      fullName: person.FullName,
      tcKimlikNo: person.TcKimlik || '',
      passportNo: person.Pasaport || '',
      nationality: person.Nationality || 'TUR',
      phone: person.Phone || '',
      securityNotes: person.SecurityNotes || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (personId: number) => {
    if (window.confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) {
      onDelete(personId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Kişi Listesi ({persons.length})
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => {
              resetForm();
              setEditingPerson(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Kişi Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {persons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Henüz kişi eklenmemiş</p>
            <p className="text-xs mt-1">Başlamak için "Kişi Ekle" butonuna tıklayın</p>
          </div>
        ) : (
          <div className="space-y-3">
            {persons.map((person) => (
              <div 
                key={person.Id} 
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{person.FullName}</span>
                    <Badge variant="outline" className="text-xs">
                      {person.Nationality || 'TUR'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {person.TcKimlik && (
                      <div>TC: {person.TcKimlik}</div>
                    )}
                    {person.Pasaport && (
                      <div>Pasaport: {person.Pasaport}</div>
                    )}
                    {person.Phone && (
                      <div>Tel: {person.Phone}</div>
                    )}
                    {person.SecurityNotes && (
                      <div className="text-xs italic mt-2 flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {person.SecurityNotes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(person)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(person.Id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? 'Kişi Düzenle' : 'Yeni Kişi Ekle'}
              </DialogTitle>
              <DialogDescription>
                İş emri için kişi bilgilerini girin. TC Kimlik No veya Pasaport No zorunludur.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Kimlik Tipi Seçimi */}
              <div className="space-y-2">
                <Label>Kimlik Tipi</Label>
                <Select
                  value={idType}
                  onValueChange={(value: 'tc' | 'passport') => setIdType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tc">TC Kimlik No</SelectItem>
                    <SelectItem value="passport">Pasaport No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Soyad */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* TC Kimlik No / Pasaport No */}
              {idType === 'tc' ? (
                <div className="space-y-2">
                  <Label htmlFor="tcKimlikNo">TC Kimlik No *</Label>
                  <Input
                    id="tcKimlikNo"
                    value={formData.tcKimlikNo}
                    onChange={(e) => setFormData({ ...formData, tcKimlikNo: e.target.value })}
                    placeholder="12345678901"
                    maxLength={11}
                  />
                  {errors.tcKimlikNo && (
                    <p className="text-xs text-red-600">{errors.tcKimlikNo}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="passportNo">Pasaport No *</Label>
                  <Input
                    id="passportNo"
                    value={formData.passportNo}
                    onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                    placeholder="US123456789"
                  />
                  {errors.passportNo && (
                    <p className="text-xs text-red-600">{errors.passportNo}</p>
                  )}
                </div>
              )}

              {/* Uyruk */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Uyruk</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+90 532 123 45 67"
                />
              </div>

              {/* Güvenlik Notları */}
              <div className="space-y-2">
                <Label htmlFor="securityNotes">Güvenlik Notları</Label>
                <Textarea
                  id="securityNotes"
                  value={formData.securityNotes}
                  onChange={(e) => setFormData({ ...formData, securityNotes: e.target.value })}
                  placeholder="Güvenlik için önemli notlar..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
                setEditingPerson(null);
              }}>
                İptal
              </Button>
              <Button onClick={handleSubmit}>
                {editingPerson ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
