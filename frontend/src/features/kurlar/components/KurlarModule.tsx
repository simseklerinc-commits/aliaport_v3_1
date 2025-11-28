/**
 * KURLAR FEATURE - Main Module Component
 * Modern EVDS entegrasyonlu kur yönetimi
 */

import { TrendingUp } from 'lucide-react';
import { ModuleLayout } from '../../../components/layouts';
import { ExchangeRateListModern } from './ExchangeRateListModern';

export function KurlarModule() {
  return (
    <ModuleLayout
      title="Döviz Kurları"
      description="EVDS API entegrasyonu ile güncel döviz kurları ve efektif kurlar"
      icon={TrendingUp}
    >
      <ExchangeRateListModern />
    </ModuleLayout>
  );
}
