// frontend/src/features/portal/components/VehicleManagement.tsx
import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Car, Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { VehicleDocumentsPanel } from './VehicleDocumentsPanel';
import { PORTAL_API_BASE } from '../config';

interface Vehicle {
  id: number;
  plaka: string;
  marka: string;
  model: string;
  vehicle_type: string;
  ruhsat_sahibi: string;
  ruhsat_tarihi: string;
  is_active: boolean;
  vehicle_status?: "AKTİF" | "EKSİK_EVRAK" | "ONAY_BEKLIYOR";
}

export function VehicleManagement() {
  const { user } = usePortalAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Araç Evrakları Paneli State
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isDocumentsPanelOpen, setIsDocumentsPanelOpen] = useState(false);
  
  // Arama state
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    plaka: '',
    marka: '',
    model: '',
    vehicle_type: '',
    ruhsat_sahibi: '',
    ruhsat_tarihi: '',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const token = portalTokenStorage.getToken();
    try {
      const response = await axios.get(`${PORTAL_API_BASE}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Plakaya göre alfabetik sırala
      const sortedVehicles = response.data.sort((a: Vehicle, b: Vehicle) => 
        a.plaka.localeCompare(b.plaka, 'tr-TR')
      );
      setVehicles(sortedVehicles);
    } catch (error) {
      toast.error('Araçlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = portalTokenStorage.getToken();
    try {
      if (editingVehicle) {
        await axios.put(
          `${PORTAL_API_BASE}/vehicles/${editingVehicle.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Araç güncellendi');
      } else {
        await axios.post(
          `${PORTAL_API_BASE}/vehicles`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Araç eklendi');
      }
      
      setShowForm(false);
      setEditingVehicle(null);
      setFormData({ plaka: '', marka: '', model: '', vehicle_type: '', ruhsat_sahibi: '', ruhsat_tarihi: '' });
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Aracı silmek istediğinize emin misiniz?')) return;
    
    const token = portalTokenStorage.getToken();
    try {
      await axios.delete(`${PORTAL_API_BASE}/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Araç silindi');
      fetchVehicles();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Araç Tanımlamaları</h1>
            <p className="text-gray-600">Limana/sahaya gelecek araçları yönetin</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingVehicle(null); }}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Araç
          </Button>
        </div>

        {/* Arama Çubuğu */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Plaka, marka veya model ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plaka *</Label>
                    <Input value={formData.plaka} onChange={(e) => setFormData({ ...formData, plaka: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Marka</Label>
                    <Input value={formData.marka} onChange={(e) => setFormData({ ...formData, marka: e.target.value })} />
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                  </div>
                  <div>
                    <Label>Araç Tipi</Label>
                    <Input value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} placeholder="KAMYON, TIR, FORKLIFT" />
                  </div>
                  <div>
                    <Label>Ruhsat Sahibi</Label>
                    <Input value={formData.ruhsat_sahibi} onChange={(e) => setFormData({ ...formData, ruhsat_sahibi: e.target.value })} />
                  </div>
                  <div>
                    <Label>Ruhsat Tarihi</Label>
                    <Input type="date" value={formData.ruhsat_tarihi} onChange={(e) => setFormData({ ...formData, ruhsat_tarihi: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Kaydet</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Plaka</th>
                  <th className="text-left p-4">Marka/Model</th>
                  <th className="text-left p-4">Araç Tipi</th>
                  <th className="text-left p-4">Ruhsat Sahibi</th>
                  <th className="text-left p-4">Ruhsat Tarihi</th>
                  <th className="text-left p-4">Durum</th>
                  <th className="text-right p-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Araçlar yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.filter(v => 
                  searchTerm === '' || 
                  v.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  v.marka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  v.model.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div>
                          <p className="text-lg font-medium">Araç bulunamadı</p>
                          <p className="text-sm mt-1">Arama kriterlerinize uygun araç yok</p>
                        </div>
                      ) : (
                        <div>
                          <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium">Henüz araç eklenmemiş</p>
                          <p className="text-sm mt-1">Yukarıdaki "Yeni Araç" butonuna tıklayarak başlayın</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : vehicles.filter(v => 
                  searchTerm === '' || 
                  v.plaka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  v.marka.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  v.model.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((veh) => (
                  <tr key={veh.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{veh.plaka}</td>
                    <td className="p-4">{veh.marka} {veh.model}</td>
                    <td className="p-4">{veh.vehicle_type}</td>
                    <td className="p-4">{veh.ruhsat_sahibi}</td>
                    <td className="p-4">{veh.ruhsat_tarihi}</td>
                    <td className="p-4">
                      {(() => {
                        const rawStatus = veh.vehicle_status ?? "EKSİK_EVRAK";
                        let label = "";
                        let colorClass = "";

                        switch (rawStatus) {
                          case "AKTİF":
                            label = "Aktif";
                            colorClass = "bg-green-500 hover:bg-green-600";
                            break;
                          case "ONAY_BEKLIYOR":
                            label = "Onay Bekliyor";
                            colorClass = "bg-orange-500 hover:bg-orange-600";
                            break;
                          case "EKSİK_EVRAK":
                          default:
                            label = "Eksik Evrak";
                            colorClass = "bg-red-500 hover:bg-red-600";
                            break;
                        }

                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                className={`${colorClass} cursor-pointer`}
                                onClick={() => {
                                  setSelectedVehicleId(veh.id);
                                  setIsDocumentsPanelOpen(true);
                                }}
                              >
                                {label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-sm">
                              {rawStatus === "AKTİF" && "Tüm zorunlu evraklar onaylı ve süresi geçerli."}
                              {rawStatus === "ONAY_BEKLIYOR" && "Evraklar yüklenmiş, onay süreci devam ediyor."}
                              {rawStatus === "EKSİK_EVRAK" && "Ruhsat, muayene, trafik sigortası veya kasko belgelerinde eksik veya süresi geçmiş evrak var."}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingVehicle(veh); setFormData(veh); setShowForm(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(veh.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Araç Evrakları Paneli */}
        <VehicleDocumentsPanel
          vehicleId={selectedVehicleId}
          open={isDocumentsPanelOpen}
          onClose={() => {
            setIsDocumentsPanelOpen(false);
            setSelectedVehicleId(null);
            // Panel kapandıktan sonra araç listesini yenile (durum güncellenmiş olabilir)
            fetchVehicles();
          }}
        />
      </div>
    </div>
    </TooltipProvider>
  );
}
