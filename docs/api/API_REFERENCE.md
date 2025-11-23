# Aliaport v3.1 - API Reference

## Base URL
```
Development: http://localhost:8000
Staging: https://staging.aliaport.com
Production: https://api.aliaport.com
```

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@aliaport.com",
      "full_name": "Admin User",
      "role": "ADMIN",
      "is_active": true
    }
  },
  "message": "Giriş başarılı",
  "timestamp": "2025-11-23T10:30:00Z"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 900
  },
  "timestamp": "2025-11-23T10:30:00Z"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

---

## Cari (Customer) Endpoints

### List Cari
```http
GET /api/cari?page=1&page_size=50&cari_tip=MUSTERI&search=test
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (int, default: 1) - Sayfa numarası
- `page_size` (int, default: 50) - Sayfa başına kayıt
- `cari_tip` (string, optional) - MUSTERI, TEDARIKCI, HER_IKISI
- `search` (string, optional) - Unvan veya kod arama

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cari_code": "C001",
      "cari_unvan": "Test Şirketi A.Ş.",
      "cari_tip": "MUSTERI",
      "tax_number": "1234567890",
      "tax_office": "Kadıköy",
      "address": "İstanbul",
      "phone": "+90 212 123 45 67",
      "email": "info@test.com",
      "is_active": true,
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-23T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 245,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "message": "Cari listesi",
  "timestamp": "2025-11-23T10:30:00Z"
}
```

### Get Cari by ID
```http
GET /api/cari/{id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cari_code": "C001",
    "cari_unvan": "Test Şirketi A.Ş.",
    "cari_tip": "MUSTERI",
    "tax_number": "1234567890",
    "tax_office": "Kadıköy",
    "address": "İstanbul",
    "phone": "+90 212 123 45 67",
    "email": "info@test.com",
    "is_active": true,
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-23T10:30:00Z"
  },
  "timestamp": "2025-11-23T10:30:00Z"
}
```

### Create Cari
```http
POST /api/cari
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cari_code": "C002",
  "cari_unvan": "Yeni Şirket Ltd.",
  "cari_tip": "MUSTERI",
  "tax_number": "9876543210",
  "tax_office": "Beşiktaş",
  "address": "İstanbul, Türkiye",
  "phone": "+90 212 987 65 43",
  "email": "contact@yenisirket.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "cari_code": "C002",
    "cari_unvan": "Yeni Şirket Ltd.",
    "is_active": true,
    "created_at": "2025-11-23T10:35:00Z"
  },
  "message": "Cari başarıyla oluşturuldu",
  "timestamp": "2025-11-23T10:35:00Z"
}
```

### Update Cari
```http
PUT /api/cari/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+90 212 999 88 77",
  "email": "newemail@yenisirket.com"
}
```

### Delete Cari (Soft Delete)
```http
DELETE /api/cari/{id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cari pasif edildi",
  "timestamp": "2025-11-23T10:40:00Z"
}
```

---

## Work Order Endpoints

### List Work Orders
```http
GET /api/work-order?status=APPROVED&cari_code=C001&page=1&page_size=50
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (string, optional) - DRAFT, APPROVED, SAHADA, TAMAMLANDI, etc.
- `cari_code` (string, optional) - Filter by customer code
- `page`, `page_size` - Pagination

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wo_number": "WO-2025-0001",
      "cari_id": 1,
      "cari_code": "C001",
      "cari_unvan": "Test Şirketi A.Ş.",
      "type": "HIZMET",
      "subject": "Römorkör Hizmeti",
      "status": "APPROVED",
      "created_by": "admin",
      "created_at": "2025-11-23T08:00:00Z",
      "updated_at": "2025-11-23T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 123,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2025-11-23T10:45:00Z"
}
```

### Get Work Order by Number
```http
GET /api/work-order/number/{wo_number}
Authorization: Bearer <access_token>
```

### Create Work Order
```http
POST /api/work-order
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cari_id": 1,
  "cari_code": "C001",
  "type": "HIZMET",
  "subject": "Römorkör Hizmeti",
  "description": "Gemi yanaşma hizmeti",
  "planned_start": "2025-11-24T08:00:00Z",
  "planned_end": "2025-11-24T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "wo_number": "WO-2025-0002",
    "status": "DRAFT",
    "created_at": "2025-11-23T10:50:00Z"
  },
  "message": "İş emri oluşturuldu",
  "timestamp": "2025-11-23T10:50:00Z"
}
```

### Change Work Order Status
```http
PATCH /api/work-order/{id}/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "APPROVED",
  "notes": "Onaylandı"
}
```

**Allowed Status Transitions:**
- DRAFT → APPROVED
- APPROVED → SAHADA
- SAHADA → TAMAMLANDI
- TAMAMLANDI → FATURALANDI
- FATURALANDI → KAPANDI

### Work Order Stats
```http
GET /api/work-order/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 245,
    "draft": 12,
    "approved": 34,
    "sahada": 18,
    "tamamlandi": 67,
    "faturalandi": 89,
    "kapandi": 25
  },
  "timestamp": "2025-11-23T10:55:00Z"
}
```

---

## Exchange Rate (Kurlar) Endpoints

### Get Latest Rates
```http
GET /api/exchange-rate/latest
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "currency_pair": "USD_TRY",
      "date": "2025-11-23",
      "forex_buying": 34.5678,
      "forex_selling": 34.7890,
      "banknote_buying": 34.4567,
      "banknote_selling": 34.8901,
      "is_published": true,
      "is_frozen": false,
      "created_at": "2025-11-23T09:00:00Z"
    },
    {
      "id": 2,
      "currency_pair": "EUR_TRY",
      "date": "2025-11-23",
      "forex_buying": 37.1234,
      "forex_selling": 37.3456,
      "is_published": true,
      "is_frozen": false
    }
  ],
  "timestamp": "2025-11-23T11:00:00Z"
}
```

### Get Published Rate for Date & Pair
```http
GET /api/exchange-rate/published?date=2025-11-23&currency_pair=USD_TRY
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "currency_pair": "USD_TRY",
    "date": "2025-11-23",
    "forex_buying": 34.5678,
    "forex_selling": 34.7890,
    "is_published": true,
    "is_frozen": false
  },
  "timestamp": "2025-11-23T11:05:00Z"
}
```

### Fetch from TCMB
```http
POST /api/exchange-rate/fetch-tcmb
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "currency_pair": "USD_TRY",
      "forex_buying": 34.5678,
      "forex_selling": 34.7890
    }
  ],
  "message": "TCMB kurları çekildi",
  "timestamp": "2025-11-23T11:10:00Z"
}
```

---

## Gate Log (Güvenlik) Endpoints

### List Gate Logs
```http
GET /api/gatelog?direction=IN&wo_number=WO-2025-0001
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `direction` (string, optional) - IN, OUT
- `wo_number` (string, optional)
- `page`, `page_size`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wo_id": 1,
      "wo_number": "WO-2025-0001",
      "direction": "IN",
      "plate_number": "34 ABC 123",
      "driver_name": "Ahmet Yılmaz",
      "timestamp": "2025-11-23T08:30:00Z",
      "photo_url": "/uploads/gatelog/123.jpg",
      "notes": "Giriş onaylandı",
      "security_officer": "Mehmet Kaya"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 89,
    "total_pages": 2
  },
  "timestamp": "2025-11-23T11:15:00Z"
}
```

### Create Gate Log (IN)
```http
POST /api/gatelog
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

wo_number=WO-2025-0001
direction=IN
plate_number=34 ABC 123
driver_name=Ahmet Yılmaz
photo=<file>
```

### Create Exception Log (PIN Override)
```http
POST /api/gatelog/exception
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "plate_number": "34 XYZ 789",
  "driver_name": "Test Driver",
  "direction": "IN",
  "exception_pin": "1234",
  "reason": "Acil durum"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "CARI_NOT_FOUND",
    "message": "Cari bulunamadı",
    "details": {
      "cari_id": 999
    }
  },
  "timestamp": "2025-11-23T11:20:00Z"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CARI_NOT_FOUND` | 404 | Cari bulunamadı |
| `CARI_CODE_EXISTS` | 409 | Cari kodu zaten mevcut |
| `WO_NOT_FOUND` | 404 | İş emri bulunamadı |
| `WO_INVALID_STATUS_TRANSITION` | 400 | Geçersiz durum değişikliği |
| `INVALID_CREDENTIALS` | 401 | Kullanıcı adı veya şifre hatalı |
| `TOKEN_EXPIRED` | 401 | Token süresi dolmuş |
| `INSUFFICIENT_PERMISSIONS` | 403 | Yetki yetersiz |
| `RATE_LIMIT_EXCEEDED` | 429 | İstek limiti aşıldı |
| `VALIDATION_ERROR` | 422 | Validasyon hatası |
| `DATABASE_ERROR` | 503 | Veritabanı hatası |

---

## Rate Limits

### Authenticated Users
- 100 requests / minute
- 1000 requests / hour

### Anonymous Users
- 20 requests / minute
- 100 requests / hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700745600
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "İstek limiti aşıldı. 60 saniye sonra tekrar deneyin.",
    "details": {
      "retry_after": 60
    }
  },
  "timestamp": "2025-11-23T11:25:00Z"
}
```

---

## Pagination

All list endpoints support pagination with these query parameters:
- `page` (int, default: 1) - Page number (1-based)
- `page_size` (int, default: 50, max: 100) - Items per page

**Pagination Metadata:**
```json
{
  "pagination": {
    "page": 2,
    "page_size": 50,
    "total": 245,
    "total_pages": 5,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2025-11-23T10:30:00Z
```

---

## Content-Type

All request/response bodies use `application/json` except file uploads which use `multipart/form-data`.

---

## CORS

Allowed origins (production):
```
https://aliaport.com
https://www.aliaport.com
https://app.aliaport.com
```

Development allows `http://localhost:5173` and `http://localhost:3000`.
