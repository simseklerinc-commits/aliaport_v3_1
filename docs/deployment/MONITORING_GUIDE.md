# Aliaport v3.1 - Monitoring & Alerting Setup

## Endpoints

### Health Check
```bash
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "aliaport-api",
  "version": "3.1.0",
  "timestamp": "2025-11-23T10:30:00Z"
}
```
**Kullanım:** Load balancer health checks, Docker healthcheck

### Readiness Check
```bash
GET /ready
```
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": "connected",
    "timestamp": "2025-11-23T10:30:00Z"
  }
}
```
**Status Codes:**
- `200 OK` - Service ready
- `503 Service Unavailable` - Database connection failed

**Kullanım:** Kubernetes readiness probe

### Metrics (Prometheus)
```bash
GET /metrics
```
**Response:** Prometheus exposition format
```
# HELP aliaport_http_requests_total Total HTTP requests
# TYPE aliaport_http_requests_total counter
aliaport_http_requests_total{method="GET",endpoint="/api/cari",status="200"} 1234

# HELP aliaport_http_request_duration_seconds HTTP request duration
# TYPE aliaport_http_request_duration_seconds histogram
aliaport_http_request_duration_seconds_bucket{method="GET",endpoint="/api/cari",le="0.1"} 950
aliaport_http_request_duration_seconds_sum{method="GET",endpoint="/api/cari"} 45.2
```

**Metrics:**
- `aliaport_http_requests_total` - Request count (method, endpoint, status)
- `aliaport_http_request_duration_seconds` - Request duration histogram
- `aliaport_active_users` - Active user count
- `aliaport_db_connections` - Database connections
- `aliaport_cache_hit_rate` - Cache hit rate percentage
- `aliaport_work_orders_total` - Work orders created (by status)
- `aliaport_gate_logs_total` - Gate logs (by direction)
- `aliaport_currency_sync_success` - Successful currency syncs
- `aliaport_currency_sync_failure` - Failed currency syncs

### Detailed Status
```bash
GET /status
```
**Response:**
```json
{
  "success": true,
  "data": {
    "service": "aliaport-api",
    "version": "3.1.0",
    "status": "healthy",
    "timestamp": "2025-11-23T10:30:00Z",
    "uptime_seconds": 86400,
    "system": {
      "cpu_percent": 15.5,
      "memory_percent": 45.2,
      "memory_available_mb": 2048,
      "disk_percent": 65.0,
      "disk_free_gb": 50
    },
    "database": {
      "status": "connected",
      "engine": "postgresql"
    },
    "environment": "production"
  }
}
```
**Kullanım:** Admin dashboard, detailed monitoring

---

## Prometheus Setup

### 1. Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aliaport-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
```

### 2. Docker Compose Integration
```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: aliaport-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - aliaport-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: aliaport-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    networks:
      - aliaport-network
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

### 3. Start Monitoring Stack
```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

---

## Grafana Dashboards

### Aliaport Overview Dashboard
**Panels:**
1. **Request Rate** - aliaport_http_requests_total (rate over 5m)
2. **Response Time (p95)** - aliaport_http_request_duration_seconds (95th percentile)
3. **Error Rate** - aliaport_http_requests_total{status=~"5.."} / total
4. **Active Users** - aliaport_active_users
5. **Database Connections** - aliaport_db_connections
6. **Work Orders (24h)** - aliaport_work_orders_total (increase over 24h)
7. **Gate Logs (24h)** - aliaport_gate_logs_total (increase over 24h)
8. **Currency Sync Success Rate** - success / (success + failure) * 100

### System Metrics Dashboard
**Panels:**
1. **CPU Usage** - system CPU via /status endpoint
2. **Memory Usage** - system memory via /status endpoint
3. **Disk Usage** - system disk via /status endpoint
4. **Request Duration Heatmap** - histogram over time

---

## Sentry Error Tracking

### 1. Install Sentry SDK
```bash
pip install sentry-sdk[fastapi]
```

### 2. Initialize in main.py
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

# Sentry initialization (before app creation)
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        environment=os.getenv("ENVIRONMENT", "development"),
        traces_sample_rate=1.0 if os.getenv("ENVIRONMENT") == "development" else 0.1,
        send_default_pii=False  # GDPR compliance
    )
```

### 3. Environment Variable
```bash
# .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 4. Manual Error Capture
```python
from sentry_sdk import capture_exception, capture_message

try:
    # Risky operation
    result = dangerous_function()
except Exception as e:
    capture_exception(e)
    logger.error(f"Operation failed: {e}")
```

---

## Uptime Monitoring

### UptimeRobot Setup
1. Create account: https://uptimerobot.com
2. Add monitors:
   - **Production Health**: https://aliaport.com/health (HTTP, 5 min interval)
   - **Production API**: https://aliaport.com/api/cari (HTTP, 5 min interval)
   - **Staging Health**: https://staging.aliaport.com/health (HTTP, 10 min interval)

### Alert Channels
- **Email**: admin@aliaport.com
- **Slack**: #aliaport-alerts webhook
- **SMS**: Critical alerts only (production)

---

## Alert Rules (Prometheus Alertmanager)

### alertmanager.yml
```yaml
# monitoring/alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - channel: '#aliaport-alerts'
        title: 'Aliaport Alert'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### alert.rules.yml
```yaml
# monitoring/alert.rules.yml
groups:
  - name: aliaport
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(aliaport_http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          description: "Error rate is {{ $value }}% (threshold: 5%)"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(aliaport_http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          description: "P95 response time is {{ $value }}s (threshold: 1s)"

      - alert: DatabaseDown
        expr: up{job="aliaport-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          description: "Backend service is down"

      - alert: HighCPUUsage
        expr: (100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          description: "CPU usage is {{ $value }}% (threshold: 80%)"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          description: "Memory usage is {{ $value }}% (threshold: 85%)"

      - alert: CurrencySyncFailed
        expr: increase(aliaport_currency_sync_failure[1h]) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          description: "Currency sync failed {{ $value }} times in the last hour"
```

---

## Log Aggregation (ELK Stack - Optional)

### Filebeat Configuration
```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /app/logs/app.log
      - /app/logs/api.log
      - /app/logs/error.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "aliaport-%{+yyyy.MM.dd}"

setup.kibana:
  host: "kibana:5601"
```

### Docker Compose
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    volumes:
      - ./logs:/app/logs:ro
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
    depends_on:
      - elasticsearch
```

---

## Monitoring Checklist

### Production Deployment
- [ ] `/health` endpoint responding 200
- [ ] `/ready` endpoint responding 200
- [ ] `/metrics` endpoint exposing Prometheus metrics
- [ ] Prometheus scraping backend successfully
- [ ] Grafana dashboards created and populated
- [ ] Sentry DSN configured (error tracking)
- [ ] UptimeRobot monitors active
- [ ] Alertmanager rules configured
- [ ] Slack webhook integrated
- [ ] Email alerts configured
- [ ] Log retention policy active (30 days app, 90 days audit)

### Weekly Monitoring Tasks
- [ ] Review error logs (Sentry)
- [ ] Check uptime metrics (UptimeRobot)
- [ ] Review Grafana dashboards (trends)
- [ ] Check disk usage (logs, backups, database)
- [ ] Review alert history (false positives?)

### Monthly Tasks
- [ ] Rotate API keys and secrets
- [ ] Review and archive old logs
- [ ] Update Grafana dashboards
- [ ] Performance baseline review
- [ ] Capacity planning (resource usage trends)

---

## Performance Baselines

### API Response Times (p95)
- `GET /api/cari` (list): < 300ms
- `POST /api/cari` (create): < 200ms
- `GET /api/work-order` (list): < 400ms
- `POST /auth/login`: < 200ms
- `GET /health`: < 50ms

### Error Rates
- 4xx errors: < 5% (user errors acceptable)
- 5xx errors: < 1% (server errors critical)

### System Resources
- CPU: < 60% average, < 80% peak
- Memory: < 75% average, < 85% peak
- Disk: < 80% usage

### Database
- Connection pool: < 80% utilization
- Query duration (p95): < 100ms
- Slow queries (>1s): < 0.1%

---

## Troubleshooting

### High Error Rate Alert
```bash
# Check error logs
docker-compose logs backend | grep ERROR | tail -100

# Check Sentry for stack traces
# Visit: https://sentry.io/organizations/your-org/issues/

# Review recent deployments
git log --oneline -10
```

### High Response Time
```bash
# Check system resources
docker-compose exec backend python -c "
import psutil
print(f'CPU: {psutil.cpu_percent()}%')
print(f'Memory: {psutil.virtual_memory().percent}%')
"

# Check database connections
docker-compose exec db psql -U aliaport -c "SELECT count(*) FROM pg_stat_activity;"

# Review slow query logs
docker-compose logs db | grep "duration:"
```

### Database Down
```bash
# Check container status
docker-compose ps db

# Check logs
docker-compose logs db --tail=50

# Restart if needed
docker-compose restart db

# Verify readiness
curl http://localhost:8000/ready
```

---

## Next Steps

1. **Set up Prometheus + Grafana** (docker-compose.monitoring.yml)
2. **Configure Sentry** (error tracking)
3. **Create UptimeRobot monitors** (uptime checks)
4. **Set up Alertmanager** (alert routing)
5. **Configure Slack webhook** (notifications)
6. **Create Grafana dashboards** (visualization)
7. **Document runbooks** (incident response procedures)
