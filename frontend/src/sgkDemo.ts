/**
 * DEMO: Resmi Tatil API'si ve SGK Dönem Kontrolü Test
 */

import { demoHolidaysTR } from './utils/holidaysTR';
import { checkSgkPeriodStatus, formatPeriod, getMonthNameTR } from './features/portal/utils/sgkPeriodCheck';

async function runDemo() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   ALIAPORT SGK DÖNEM KONTROLÜ DEMO                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // 1. Resmi Tatil Kontrolü
  console.log('1️⃣  RESMİ TATİL API TESTİ\n');
  await demoHolidaysTR();

  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('\n');

  // 2. SGK Dönem Kontrolü (Bugün: 27 Kasım 2025)
  console.log('2️⃣  SGK DÖNEM DURUMU KONTROLÜ\n');
  
  const testDate = new Date(2025, 10, 27); // 27 Kasım 2025
  console.log(`Test Tarihi: ${testDate.toLocaleDateString('tr-TR')}\n`);

  // Senaryo 1: Hiç yükleme yapılmamış
  console.log('📊 SENARYO 1: Hiç SGK Listesi Yüklenmemiş\n');
  const status1 = await checkSgkPeriodStatus(testDate, null);
  printStatus(status1);

  console.log('\n' + '─'.repeat(60) + '\n');

  // Senaryo 2: Ekim 2025 yüklenmiş
  console.log('📊 SENARYO 2: Ekim 2025 Yüklenmiş (Güncel)\n');
  const status2 = await checkSgkPeriodStatus(testDate, '202510');
  printStatus(status2);

  console.log('\n' + '─'.repeat(60) + '\n');

  // Senaryo 3: Eylül 2025 yüklenmiş (1 ay eksik)
  console.log('📊 SENARYO 3: Eylül 2025 Yüklenmiş (1 Ay Eksik)\n');
  const status3 = await checkSgkPeriodStatus(testDate, '202509');
  printStatus(status3);

  console.log('\n' + '─'.repeat(60) + '\n');

  // Senaryo 4: Ağustos 2025 yüklenmiş (2 ay eksik - kritik)
  console.log('📊 SENARYO 4: Ağustos 2025 Yüklenmiş (2+ Ay Eksik - KRİTİK)\n');
  const status4 = await checkSgkPeriodStatus(testDate, '202508');
  printStatus(status4);

  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('\n✅ DEMO TAMAMLANDI\n');
}

function printStatus(status: any) {
  console.log(`Uyarı Seviyesi: ${getAlertLevelIcon(status.alertLevel)} ${status.alertLevel.toUpperCase()}`);
  console.log(`Mesaj: ${status.message}`);
  console.log(`\nSon Yüklenen Dönem: ${status.lastUploadedPeriod ? formatPeriod(status.lastUploadedPeriod) : 'YOK'}`);
  console.log(`Eksik Dönem Var mı: ${status.hasMissingPeriod ? 'EVET' : 'HAYIR'}`);
  
  if (status.hasMissingPeriod) {
    console.log(`Eksik Dönem Sayısı: ${status.missingPeriodCount}`);
    console.log(`Eksik Dönemler: ${status.missingPeriods.map(formatPeriod).join(', ')}`);
  }
  
  console.log(`\nBir Sonraki Yükleme Tarihi: ${status.nextUploadDeadline.toLocaleDateString('tr-TR')}`);
  console.log(`Bir Sonraki Yüklenecek Dönem: ${formatPeriod(status.nextPeriodToUpload)}`);
  
  console.log(`\nYüklenmesi Gereken Tüm Dönemler (${status.requiredPeriods.length}):`);
  console.log(status.requiredPeriods.map(formatPeriod).join(', '));
}

function getAlertLevelIcon(level: string): string {
  switch (level) {
    case 'none': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '🚨';
    default: return '❓';
  }
}

// Demo'yu çalıştır
runDemo().catch(console.error);
