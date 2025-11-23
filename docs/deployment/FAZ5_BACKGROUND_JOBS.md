# FAZ 5 - Background Jobs & Task Scheduling

**Son Güncelleme**: 23 Kasım 2025  
**Versiyon**: v3.1  
**Aşama**: FAZ 5 (Performance & Scalability)

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Scheduler Mimarisi](#scheduler-mimarisi)
- [Job Tipleri](#job-tipleri)
- [Implementation Planı](#implementation-planı)
- [Monitoring & Alerting](#monitoring--alerting)

---

## Genel Bakış

### Hedef
Aliaport sisteminde tekrarlayan görevleri (kur güncelleme, log temizleme, rapor oluşturma) otomatikleştirmek ve sistem performansını optimize etmek.

### Teknoloji Seçimleri

| Bileşen | Teknoloji | Neden Seçildi |
|---------|-----------|---------------|
| **Scheduler** | APScheduler | Python native, FastAPI ile kolay entegrasyon, cron-like syntax |
| **Task Queue** | Celery + Redis | Async task execution, distributed workers, retry mechanism |
| **Storage** | PostgreSQL | Mevcut DB, partition support, JSONB for metadata |
| **Monitoring** | Prometheus + Grafana | Metrics collection, alerting, dashboard |

### Başarı Kriterleri
- ✅ Kur güncellemeleri her gün otomatik (16:00 TCMB kapanış saati)
- ✅ Audit log'ları 90 gün sonra otomatik arşivleniyor
- ✅ Heavy raporlar async queue'de, kullanıcıyı bloke etmeden oluşturuluyor
- ✅ Job failure rate < %1, retry mechanism aktif
- ✅ Job execution time < 5 dakika (timeout: 10 dakika)

---

## Scheduler Mimarisi

### APScheduler Setup

```python
# backend/aliaport_api/core/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Job stores (PostgreSQL)
jobstores = {
    'default': SQLAlchemyJobStore(url='postgresql://user:pass@localhost/aliaport')
}

# Executors
executors = {
    'default': ThreadPoolExecutor(max_workers=5),
    'processpool': ProcessPoolExecutor(max_workers=3)
}

# Job defaults
job_defaults = {
    'coalesce': True,  # Birden fazla missed run varsa tek seferde çalıştır
    'max_instances': 1,  # Aynı job'dan sadece 1 instance çalışsın
    'misfire_grace_time': 300  # 5 dakika geç başlama toleransı
}

# Scheduler instance
scheduler = AsyncIOScheduler(
    jobstores=jobstores,
    executors=executors,
    job_defaults=job_defaults,
    timezone='Europe/Istanbul'
)

def start_scheduler():
    """Scheduler'ı başlat"""
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started successfully")
    else:
        logger.warning("APScheduler already running")

def shutdown_scheduler():
    """Scheduler'ı durdur"""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("APScheduler shutdown complete")
```

### FastAPI Integration

```python
# backend/aliaport_api/main.py
from fastapi import FastAPI
from .core.scheduler import scheduler, start_scheduler, shutdown_scheduler
from .jobs import register_jobs

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    """Uygulama başlangıcında scheduler'ı başlat"""
    start_scheduler()
    register_jobs()  # Job'ları kaydet

@app.on_event("shutdown")
async def shutdown_event():
    """Uygulama kapanışında scheduler'ı durdur"""
    shutdown_scheduler()
```

---

## Job Tipleri

### 1. Kur Güncelleme Job (TCMB/EVDS Sync)

**Amaç**: TCMB'den günlük döviz kurlarını çekip Kurlar tablosuna kaydetmek.

**Schedule**: Her gün 16:00 (TCMB kapanış saati)

**Implementation**:
```python
# backend/aliaport_api/jobs/kur_sync_job.py
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from ..integrations.tcmb_client import TCMBClient
from ..integrations.evds_client import EVDSClient
from ..modules.kurlar.models import Kur
from ..config.database import get_db
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)

async def kur_guncelleme_job():
    """
    TCMB/EVDS API'den günlük kurları çek ve DB'ye kaydet
    
    Workflow:
    1. TCMB XML API'den günlük kurları çek (USD, EUR, GBP)
    2. Fallback: EVDS API kullan (TCMB down ise)
    3. Validation: Kur değerleri makul aralıkta mı? (±%10 son kurdan)
    4. DB insert/update (UPSERT pattern)
    5. Cache invalidation (kurlar cache'ini temizle)
    6. Metrics: kur_sync_success_total, kur_sync_duration_seconds
    """
    start_time = datetime.utcnow()
    db: Session = next(get_db())
    
    try:
        logger.info("Kur güncelleme job başladı")
        
        # TCMB client (primary)
        tcmb_client = TCMBClient()
        kurlar = await tcmb_client.get_daily_rates()
        
        if not kurlar:
            # Fallback to EVDS
            logger.warning("TCMB API failed, trying EVDS")
            evds_client = EVDSClient(api_key=os.getenv("EVDS_API_KEY"))
            kurlar = await evds_client.get_daily_rates()
        
        if not kurlar:
            raise Exception("Both TCMB and EVDS APIs failed")
        
        # Validation
        for kur in kurlar:
            validate_kur_value(kur, db)
        
        # UPSERT pattern
        bugun = date.today()
        for kur_data in kurlar:
            db.execute(
                """
                INSERT INTO kurlar (tarih, doviz_kodu, alis, satis, efektif_alis, efektif_satis)
                VALUES (:tarih, :doviz_kodu, :alis, :satis, :efektif_alis, :efektif_satis)
                ON CONFLICT (tarih, doviz_kodu) 
                DO UPDATE SET 
                    alis = EXCLUDED.alis,
                    satis = EXCLUDED.satis,
                    efektif_alis = EXCLUDED.efektif_alis,
                    efektif_satis = EXCLUDED.efektif_satis,
                    updated_at = NOW()
                """,
                {"tarih": bugun, **kur_data}
            )
        
        db.commit()
        
        # Cache invalidation
        from ..core.cache import cache_manager
        cache_manager.delete_pattern("kurlar:*")
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Kur güncelleme başarılı. {len(kurlar)} kur güncellendi. Süre: {duration}s")
        
        # Metrics
        from prometheus_client import Counter, Histogram
        KUR_SYNC_SUCCESS = Counter('kur_sync_success_total', 'Successful kur sync jobs')
        KUR_SYNC_DURATION = Histogram('kur_sync_duration_seconds', 'Kur sync duration')
        KUR_SYNC_SUCCESS.inc()
        KUR_SYNC_DURATION.observe(duration)
        
    except Exception as e:
        logger.error(f"Kur güncelleme job failed: {str(e)}", exc_info=True)
        db.rollback()
        
        # Alert
        from ..core.alerts import send_alert
        send_alert(
            severity="HIGH",
            title="Kur Güncelleme Job Failed",
            message=f"TCMB/EVDS kur sync job failed: {str(e)}",
            details={"date": str(bugun), "error": str(e)}
        )
        
        raise  # Re-raise for APScheduler retry
    finally:
        db.close()


def validate_kur_value(kur_data: dict, db: Session):
    """
    Kur değerini valide et (±%10 son kurdan)
    """
    doviz_kodu = kur_data["doviz_kodu"]
    yeni_alis = kur_data["alis"]
    
    # Son kuru getir
    last_kur = db.query(Kur).filter(
        Kur.doviz_kodu == doviz_kodu
    ).order_by(Kur.tarih.desc()).first()
    
    if last_kur:
        degisim_orani = abs((yeni_alis - last_kur.alis) / last_kur.alis)
        if degisim_orani > 0.10:  # %10'dan fazla değişim
            logger.warning(
                f"{doviz_kodu} kuru %{degisim_orani*100:.2f} değişti. "
                f"Eski: {last_kur.alis}, Yeni: {yeni_alis}"
            )
            # Alert gönder ama exception throw etme (manuel kontrol gerekebilir)


# Job registration
def register_kur_sync_job(scheduler):
    """Kur sync job'ını scheduler'a ekle"""
    scheduler.add_job(
        kur_guncelleme_job,
        trigger=CronTrigger(hour=16, minute=0, timezone='Europe/Istanbul'),
        id='kur_guncelleme_daily',
        name='TCMB/EVDS Kur Güncelleme',
        replace_existing=True,
        misfire_grace_time=300  # 5 dakika geç başlama toleransı
    )
    logger.info("Kur güncelleme job registered (daily at 16:00)")
```

**Retry Strategi**:
- Max retries: 3
- Retry delay: 5 dakika (exponential backoff)
- Fallback: EVDS API (TCMB başarısız olursa)

**Monitoring Metrics**:
- `kur_sync_success_total`: Başarılı sync sayısı
- `kur_sync_failure_total`: Başarısız sync sayısı
- `kur_sync_duration_seconds`: Sync süresi
- `kur_sync_rate_count`: Güncellenen kur sayısı

---

### 2. Audit Log Archiving Job

**Amaç**: 90 günden eski audit event kayıtlarını arşiv tablosuna taşımak.

**Schedule**: Her gün 03:00 (düşük trafik saati)

**Implementation**:
```python
# backend/aliaport_api/jobs/audit_archive_job.py
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

async def audit_log_archive_job():
    """
    90 günden eski audit event'leri arşiv tablosuna taşı
    
    Workflow:
    1. 90 günden eski kayıtları seç (created_at < NOW() - INTERVAL '90 days')
    2. audit_events_archive tablosuna INSERT
    3. audit_events tablosundan DELETE
    4. VACUUM ANALYZE (disk space geri kazanım)
    5. Metrics: archived_records_total, archive_duration_seconds
    """
    db: Session = next(get_db())
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    
    try:
        logger.info(f"Audit log archiving başladı. Cutoff date: {cutoff_date}")
        
        # Step 1: Arşivlenecek kayıt sayısını say
        count_result = db.execute(
            text("SELECT COUNT(*) FROM audit_events WHERE created_at < :cutoff"),
            {"cutoff": cutoff_date}
        ).scalar()
        
        if count_result == 0:
            logger.info("Arşivlenecek kayıt yok")
            return
        
        logger.info(f"{count_result} kayıt arşivlenecek")
        
        # Step 2: Arşiv tablosuna INSERT (batch processing)
        batch_size = 1000
        archived_count = 0
        
        while True:
            # Batch SELECT + INSERT
            result = db.execute(text("""
                WITH old_records AS (
                    SELECT * FROM audit_events 
                    WHERE created_at < :cutoff
                    LIMIT :batch_size
                )
                INSERT INTO audit_events_archive 
                SELECT * FROM old_records
                RETURNING id
            """), {"cutoff": cutoff_date, "batch_size": batch_size})
            
            batch_count = result.rowcount
            if batch_count == 0:
                break
            
            archived_count += batch_count
            db.commit()
            
            logger.info(f"Archived {archived_count}/{count_result} records")
        
        # Step 3: Eski kayıtları sil
        db.execute(
            text("DELETE FROM audit_events WHERE created_at < :cutoff"),
            {"cutoff": cutoff_date}
        )
        db.commit()
        
        # Step 4: VACUUM (PostgreSQL only)
        if db.bind.dialect.name == 'postgresql':
            # VACUUM ANALYZE için autocommit mode gerekli
            db.connection().connection.set_isolation_level(0)
            db.execute(text("VACUUM ANALYZE audit_events"))
            db.connection().connection.set_isolation_level(1)
            logger.info("VACUUM ANALYZE completed")
        
        logger.info(f"Audit log archiving başarılı. {archived_count} kayıt arşivlendi")
        
        # Metrics
        from prometheus_client import Counter
        ARCHIVE_SUCCESS = Counter('audit_archive_success_total', 'Successful archive jobs')
        ARCHIVE_RECORDS = Counter('audit_archive_records_total', 'Total archived records')
        ARCHIVE_SUCCESS.inc()
        ARCHIVE_RECORDS.inc(archived_count)
        
    except Exception as e:
        logger.error(f"Audit log archiving failed: {str(e)}", exc_info=True)
        db.rollback()
        raise
    finally:
        db.close()


# Job registration
def register_audit_archive_job(scheduler):
    """Audit archive job'ını scheduler'a ekle"""
    scheduler.add_job(
        audit_log_archive_job,
        trigger=CronTrigger(hour=3, minute=0, timezone='Europe/Istanbul'),
        id='audit_archive_daily',
        name='Audit Log Archiving (90+ days)',
        replace_existing=True
    )
    logger.info("Audit archive job registered (daily at 03:00)")
```

**PostgreSQL Partition Stratejisi** (opsiyonel, FAZ 6):
```sql
-- audit_events tablosunu partition'a (monthly)
CREATE TABLE audit_events (
    id SERIAL,
    event_type VARCHAR(50),
    user_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Her ay için partition oluştur
CREATE TABLE audit_events_2025_11 PARTITION OF audit_events
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_events_2025_12 PARTITION OF audit_events
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Partition drop ile hızlı silme (DELETE yerine)
DROP TABLE audit_events_2025_08;  -- 90 gün önceki partition
```

---

### 3. Async Rapor Queue (Heavy Reports)

**Amaç**: Heavy raporların (Manifest, Barınma Özet, Cari Ekstre) async olarak oluşturulması.

**Teknoloji**: Celery + Redis

**Setup**:
```python
# backend/aliaport_api/core/celery_app.py
from celery import Celery
import os

# Celery app instance
celery_app = Celery(
    'aliaport_tasks',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Celery config
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Istanbul',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 dakika timeout
    task_soft_time_limit=540,  # 9 dakika soft timeout (graceful shutdown)
    worker_prefetch_multiplier=1,  # Her worker 1 task alsın (long-running tasks için)
    worker_max_tasks_per_child=50  # 50 task'ten sonra worker restart (memory leak prevention)
)

# Task routes
celery_app.conf.task_routes = {
    'aliaport_tasks.reports.*': {'queue': 'reports'},
    'aliaport_tasks.kur.*': {'queue': 'background'},
    'aliaport_tasks.audit.*': {'queue': 'background'}
}
```

**Rapor Task Example**:
```python
# backend/aliaport_api/tasks/report_tasks.py
from ..core.celery_app import celery_app
from ..modules.barinma.services import BarinmaReportService
from ..modules.manifest.services import ManifestReportService
from ..core.storage import S3Storage
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='aliaport_tasks.reports.generate_barinma_report')
def generate_barinma_report_task(self, filters: dict, user_id: int):
    """
    Barınma özet raporu oluştur (async)
    
    Args:
        filters: Rapor filtreleri (date_from, date_to, cari_code)
        user_id: Raporu isteyen kullanıcı ID
    
    Returns:
        report_url: S3'te raporun URL'i
    """
    try:
        # Progress update
        self.update_state(state='PROGRESS', meta={'current': 0, 'total': 100, 'status': 'Başladı'})
        
        # Rapor oluştur
        service = BarinmaReportService()
        report_data = service.generate_summary_report(filters)
        
        self.update_state(state='PROGRESS', meta={'current': 50, 'total': 100, 'status': 'Veri hazırlandı'})
        
        # Excel export
        excel_bytes = service.export_to_excel(report_data)
        
        self.update_state(state='PROGRESS', meta={'current': 80, 'total': 100, 'status': 'Excel oluşturuldu'})
        
        # S3'e upload
        storage = S3Storage()
        file_key = f"reports/barinma/{user_id}/{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        report_url = storage.upload(excel_bytes, file_key, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
        self.update_state(state='PROGRESS', meta={'current': 100, 'total': 100, 'status': 'Tamamlandı'})
        
        logger.info(f"Barınma raporu oluşturuldu: {report_url}")
        return {'report_url': report_url, 'status': 'SUCCESS'}
        
    except Exception as e:
        logger.error(f"Rapor oluşturma hatası: {str(e)}", exc_info=True)
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise


@celery_app.task(bind=True, name='aliaport_tasks.reports.generate_manifest_report')
def generate_manifest_report_task(self, manifest_id: int, user_id: int):
    """Manifest raporu oluştur (async)"""
    # Similar implementation
    pass
```

**FastAPI Endpoint (Async Rapor Başlat)**:
```python
# backend/aliaport_api/modules/barinma/router.py
from fastapi import APIRouter, Depends, BackgroundTasks
from ...tasks.report_tasks import generate_barinma_report_task
from ...core.responses import success_response

router = APIRouter()

@router.post("/barinma/reports/generate")
def generate_barinma_report_async(
    filters: dict,
    current_user = Depends(get_current_user)
):
    """
    Barınma raporu oluştur (async)
    
    Returns:
        task_id: Celery task ID (progress tracking için)
    """
    # Celery task başlat
    task = generate_barinma_report_task.delay(filters, current_user.id)
    
    return success_response(
        data={"task_id": task.id, "status": "PENDING"},
        message="Rapor oluşturma başlatıldı. Task ID ile progress takip edebilirsiniz."
    )


@router.get("/barinma/reports/status/{task_id}")
def get_report_status(task_id: str):
    """
    Rapor oluşturma durumunu kontrol et
    
    Returns:
        state: PENDING, PROGRESS, SUCCESS, FAILURE
        meta: Progress bilgisi veya sonuç
    """
    from celery.result import AsyncResult
    task_result = AsyncResult(task_id, app=celery_app)
    
    if task_result.state == 'PENDING':
        response = {'state': 'PENDING', 'status': 'Rapor kuyruğunda bekliyor'}
    elif task_result.state == 'PROGRESS':
        response = {
            'state': 'PROGRESS',
            'current': task_result.info.get('current', 0),
            'total': task_result.info.get('total', 100),
            'status': task_result.info.get('status', '')
        }
    elif task_result.state == 'SUCCESS':
        response = {
            'state': 'SUCCESS',
            'report_url': task_result.result.get('report_url'),
            'status': 'Rapor hazır'
        }
    else:  # FAILURE
        response = {
            'state': 'FAILURE',
            'error': str(task_result.info),
            'status': 'Rapor oluşturulamadı'
        }
    
    return success_response(data=response)
```

**Frontend Integration**:
```typescript
// frontend/src/services/reportService.ts
import { api } from './apiClient';

export interface ReportTaskResponse {
  task_id: string;
  status: string;
}

export interface ReportStatusResponse {
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE';
  current?: number;
  total?: number;
  status: string;
  report_url?: string;
  error?: string;
}

export const reportService = {
  // Async rapor başlat
  async generateBarinmaReport(filters: any): Promise<ReportTaskResponse> {
    const response = await api.post('/barinma/reports/generate', filters);
    return response.data.data;
  },

  // Rapor durumu sorgula
  async getReportStatus(taskId: string): Promise<ReportStatusResponse> {
    const response = await api.get(`/barinma/reports/status/${taskId}`);
    return response.data.data;
  },

  // Polling ile rapor tamamlanana kadar bekle
  async waitForReport(taskId: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const status = await this.getReportStatus(taskId);
          
          if (status.state === 'PROGRESS' && onProgress) {
            const progress = (status.current! / status.total!) * 100;
            onProgress(progress);
          }
          
          if (status.state === 'SUCCESS') {
            clearInterval(interval);
            resolve(status.report_url!);
          }
          
          if (status.state === 'FAILURE') {
            clearInterval(interval);
            reject(new Error(status.error));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000); // Her 2 saniyede bir polling
    });
  }
};
```

---

## Implementation Planı

### Phase 1: APScheduler Setup (2 gün)
- [x] APScheduler dependency install
- [ ] `core/scheduler.py` oluştur
- [ ] FastAPI startup/shutdown integration
- [ ] Job store (PostgreSQL) setup
- [ ] Basic health check endpoint (`/api/scheduler/health`)

### Phase 2: Kur Güncelleme Job (3 gün)
- [ ] TCMB XML client implementation
- [ ] EVDS API client implementation (fallback)
- [ ] Kur validation logic
- [ ] Job registration ve test
- [ ] Metrics integration (Prometheus)
- [ ] Alert setup (Slack/Email)

### Phase 3: Audit Log Archiving (2 gün)
- [ ] `audit_events_archive` tablo oluştur
- [ ] Archive job implementation
- [ ] Batch processing logic
- [ ] VACUUM automation
- [ ] Monitoring dashboard (Grafana)

### Phase 4: Celery Setup (3 gün)
- [ ] Celery + Redis setup
- [ ] Task routing ve queue config
- [ ] Worker setup (systemd/supervisor)
- [ ] Flower monitoring (http://localhost:5555)
- [ ] Health check endpoints

### Phase 5: Async Rapor Queue (4 gün)
- [ ] Barınma rapor task implementation
- [ ] Manifest rapor task implementation
- [ ] S3 storage integration
- [ ] Frontend polling UI
- [ ] Progress bar component
- [ ] Error handling ve retry

**Toplam Süre**: ~14 gün

---

## Monitoring & Alerting

### Prometheus Metrics

```python
# backend/aliaport_api/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Job execution metrics
JOB_EXECUTIONS_TOTAL = Counter(
    'scheduler_job_executions_total',
    'Total job executions',
    ['job_name', 'status']  # status: success, failure
)

JOB_DURATION_SECONDS = Histogram(
    'scheduler_job_duration_seconds',
    'Job execution duration',
    ['job_name'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600]  # 1s to 10min
)

# Celery task metrics
CELERY_TASK_TOTAL = Counter(
    'celery_task_total',
    'Total Celery tasks',
    ['task_name', 'state']  # state: PENDING, SUCCESS, FAILURE
)

CELERY_QUEUE_LENGTH = Gauge(
    'celery_queue_length',
    'Number of tasks in queue',
    ['queue_name']
)

# Kur sync metrics
KUR_SYNC_RATE_COUNT = Gauge(
    'kur_sync_rate_count',
    'Number of exchange rates synced',
    ['currency']
)

# Audit archive metrics
AUDIT_ARCHIVED_RECORDS = Counter(
    'audit_archived_records_total',
    'Total archived audit records'
)
```

### Grafana Dashboard

**Panel 1: Job Success Rate**
```promql
rate(scheduler_job_executions_total{status="success"}[5m]) 
/ 
rate(scheduler_job_executions_total[5m])
```

**Panel 2: Job Duration (p95)**
```promql
histogram_quantile(0.95, 
  rate(scheduler_job_duration_seconds_bucket[5m])
)
```

**Panel 3: Celery Queue Length**
```promql
celery_queue_length{queue_name="reports"}
```

**Panel 4: Kur Sync Status**
```promql
sum(kur_sync_rate_count) by (currency)
```

### Alerting Rules

```yaml
# prometheus/alerts/background_jobs.yml
groups:
  - name: background_jobs
    interval: 30s
    rules:
      # Kur sync failed
      - alert: KurSyncFailed
        expr: increase(scheduler_job_executions_total{job_name="kur_guncelleme_daily", status="failure"}[1h]) > 0
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Kur güncelleme job failed"
          description: "TCMB/EVDS kur sync job failed in the last hour"
      
      # Job duration too long
      - alert: JobDurationHigh
        expr: scheduler_job_duration_seconds > 300
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Job duration exceeded 5 minutes"
          description: "Job {{ $labels.job_name }} took {{ $value }}s to complete"
      
      # Celery queue backlog
      - alert: CeleryQueueBacklog
        expr: celery_queue_length{queue_name="reports"} > 50
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Celery report queue has backlog"
          description: "{{ $value }} tasks waiting in reports queue"
      
      # No kur sync in last 25 hours (should run daily)
      - alert: KurSyncMissing
        expr: time() - kur_sync_last_success_timestamp > 90000
        labels:
          severity: high
        annotations:
          summary: "Kur sync missing for >25 hours"
          description: "Last successful kur sync was {{ $value }}s ago"
```

---

## Deployment Checklist

### Redis Setup
```bash
# Redis install (Ubuntu)
sudo apt update
sudo apt install redis-server

# Redis config
sudo nano /etc/redis/redis.conf
# Değişiklikler:
# - maxmemory 1gb
# - maxmemory-policy allkeys-lru

# Redis start
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Celery Worker Setup
```bash
# Celery worker systemd service
sudo nano /etc/systemd/system/celery-worker.service
```

```ini
[Unit]
Description=Celery Worker (Aliaport Background Tasks)
After=network.target redis-server.service

[Service]
Type=forking
User=aliaport
Group=aliaport
WorkingDirectory=/opt/aliaport/backend
ExecStart=/opt/aliaport/venv/bin/celery -A aliaport_api.core.celery_app worker \
    --loglevel=info \
    --concurrency=4 \
    --queues=reports,background \
    --max-tasks-per-child=50
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Celery worker başlat
sudo systemctl start celery-worker
sudo systemctl enable celery-worker
```

### Flower Monitoring
```bash
# Flower (Celery monitoring UI)
pip install flower

# Flower systemd service
sudo nano /etc/systemd/system/celery-flower.service
```

```ini
[Unit]
Description=Celery Flower (Task Monitoring)
After=network.target redis-server.service

[Service]
Type=simple
User=aliaport
Group=aliaport
WorkingDirectory=/opt/aliaport/backend
ExecStart=/opt/aliaport/venv/bin/celery -A aliaport_api.core.celery_app flower \
    --port=5555 \
    --basic_auth=admin:secure_password
Restart=always

[Install]
WantedBy=multi-user.target
```

**Flower URL**: http://localhost:5555

---

## Güvenlik Notları

1. **Redis Security**:
   - `requirepass` ayarla (Redis auth)
   - Firewall: Sadece localhost'tan erişim
   - TLS encryption (production)

2. **Celery Task Security**:
   - Task serialization: JSON only (pickle güvensiz)
   - Task signature validation
   - Rate limiting (abuse prevention)

3. **S3 Storage**:
   - Pre-signed URLs (time-limited)
   - IAM role ile credentials (access key/secret yerine)
   - Bucket policy: Private by default

4. **Monitoring Access**:
   - Flower basic auth
   - Prometheus scrape endpoint: Internal network only
   - Grafana: LDAP/OAuth integration

---

## Kaynaklar

- **APScheduler Docs**: https://apscheduler.readthedocs.io/
- **Celery Docs**: https://docs.celeryproject.org/
- **TCMB API**: https://www.tcmb.gov.tr/kurlar/today.xml
- **EVDS API**: https://evds2.tcmb.gov.tr/
- **Prometheus Python Client**: https://github.com/prometheus/client_python
- **Flower**: https://flower.readthedocs.io/

---

**Sonraki Adım**: Implementation başlat (Phase 1: APScheduler Setup)
