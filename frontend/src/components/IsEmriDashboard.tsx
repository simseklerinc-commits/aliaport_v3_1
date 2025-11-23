// İŞ EMRİ DASHBOARD - İstatistikler ve grafikler

import { BarChart3, TrendingUp, AlertTriangle, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { Badge } from "./ui/badge";
import type { WorkOrder } from "../lib/types/database";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface IsEmriDashboardProps {
  workOrders: WorkOrder[];
}

export function IsEmriDashboard({ workOrders }: IsEmriDashboardProps) {
  // İstatistikleri hesapla
  const stats = calculateStats(workOrders);

  // Durum dağılımı için data
  const statusData = [
    { name: 'Taslak', value: stats.byStatus.DRAFT, color: '#6b7280' },
    { name: 'Gönderildi', value: stats.byStatus.SUBMITTED, color: '#3b82f6' },
    { name: 'Onaylandı', value: stats.byStatus.APPROVED, color: '#8b5cf6' },
    { name: 'Sahada', value: stats.byStatus.SAHADA, color: '#f59e0b' },
    { name: 'Tamamlandı', value: stats.byStatus.TAMAMLANDI, color: '#10b981' },
    { name: 'Faturalandı', value: stats.byStatus.FATURALANDI, color: '#06b6d4' },
    { name: 'Kapatıldı', value: stats.byStatus.KAPANDI, color: '#64748b' },
    { name: 'Reddedildi', value: stats.byStatus.REJECTED, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Öncelik dağılımı
  const priorityData = [
    { name: 'Düşük', count: stats.byPriority.LOW, color: '#10b981' },
    { name: 'Orta', count: stats.byPriority.MEDIUM, color: '#3b82f6' },
    { name: 'Yüksek', count: stats.byPriority.HIGH, color: '#f59e0b' },
    { name: 'Acil', count: stats.byPriority.URGENT, color: '#ef4444' },
  ];

  // Tip dağılımı
  const typeData = [
    { name: 'Hizmet', count: stats.byType.HIZMET },
    { name: 'Motorbot', count: stats.byType.MOTORBOT },
    { name: 'Barınma', count: stats.byType.BARINMA },
    { name: 'Diğer', count: stats.byType.DIGER },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Toplam İş Emri"
          value={stats.total}
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
        />
        
        <StatCard
          title="Gecikmiş İşler"
          value={stats.overdueCount}
          subtitle={stats.overdueCount > 0 ? "Acil önlem gerekli" : "Tüm işler zamanında"}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        
        <StatCard
          title="Zamanında Tamamlama"
          value={`${stats.onTimeRate}%`}
          subtitle={`Son 30 gün`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        
        <StatCard
          title="Ortalama Tamamlanma"
          value={`${stats.avgCompletionTime}h`}
          subtitle="Saat cinsinden"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Durum Dağılımı - Pie Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-4">Durum Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Öncelik Dağılımı - Bar Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-4">Öncelik Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="count" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tip Dağılımı - Bar Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-4">İş Emri Tipleri</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={typeData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gecikmiş İşler Listesi */}
      {stats.overdueCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-red-400 mb-3">
            <AlertTriangle className="w-5 h-5" />
            Gecikmiş İşler ({stats.overdueCount})
          </h3>
          <div className="space-y-2">
            {workOrders
              .filter(wo => {
                if (!wo.planned_end) return false;
                const plannedEnd = new Date(wo.planned_end);
                const now = new Date();
                return plannedEnd < now && wo.status !== 'TAMAMLANDI' && wo.status !== 'KAPANDI';
              })
              .slice(0, 5)
              .map(wo => (
                <div
                  key={wo.id}
                  className="bg-gray-900/50 border border-gray-700 rounded p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{wo.subject}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {wo.wo_number} • {wo.cari_title}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-500/20 text-red-400">
                      {wo.priority}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {wo.planned_end ? formatDateDiff(new Date(wo.planned_end), new Date()) : ''}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'purple' | 'yellow';
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm opacity-90">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-xs opacity-75">{subtitle}</div>}
    </div>
  );
}

// İstatistikleri hesapla
function calculateStats(workOrders: WorkOrder[]) {
  const now = new Date();

  // Durum bazlı
  const byStatus = {
    DRAFT: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    SAHADA: 0,
    TAMAMLANDI: 0,
    FATURALANDI: 0,
    KAPANDI: 0,
    REJECTED: 0,
  };

  // Öncelik bazlı
  const byPriority = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  // Tip bazlı
  const byType = {
    HIZMET: 0,
    MOTORBOT: 0,
    BARINMA: 0,
    DIGER: 0,
  };

  let overdueCount = 0;
  let completedOnTime = 0;
  let completedLate = 0;
  let totalCompletionTime = 0;
  let completedCount = 0;

  workOrders.forEach(wo => {
    // Durum
    byStatus[wo.status]++;

    // Öncelik
    byPriority[wo.priority]++;

    // Tip
    byType[wo.type]++;

    // Gecikmiş kontrolü
    if (wo.planned_end) {
      const plannedEnd = new Date(wo.planned_end);
      if (plannedEnd < now && wo.status !== 'TAMAMLANDI' && wo.status !== 'KAPANDI') {
        overdueCount++;
      }
    }

    // Tamamlanma zamanı
    if (wo.status === 'TAMAMLANDI' && wo.created_at && wo.updated_at) {
      const created = new Date(wo.created_at);
      const completed = new Date(wo.updated_at);
      const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalCompletionTime += hours;
      completedCount++;

      // Zamanında mı tamamlandı?
      if (wo.planned_end) {
        const plannedEnd = new Date(wo.planned_end);
        if (completed <= plannedEnd) {
          completedOnTime++;
        } else {
          completedLate++;
        }
      }
    }
  });

  const avgCompletionTime = completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 0;
  const onTimeRate = (completedOnTime + completedLate) > 0 
    ? Math.round((completedOnTime / (completedOnTime + completedLate)) * 100) 
    : 100;

  return {
    total: workOrders.length,
    byStatus,
    byPriority,
    byType,
    overdueCount,
    avgCompletionTime,
    onTimeRate,
  };
}

// Tarih farkını formatla
function formatDateDiff(date1: Date, date2: Date): string {
  const diffMs = date2.getTime() - date1.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays} gün gecikmiş`;
  } else if (diffHours > 0) {
    return `${diffHours} saat gecikmiş`;
  } else {
    return 'Az önce geçti';
  }
}
