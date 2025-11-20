# Aliaport - Port Management System

## Overview

Aliaport is a comprehensive port and marina management system designed for harbor operations in Turkey. The application manages customer relationships, motorboat operations, trip scheduling, accommodation contracts, service definitions, pricing, and invoicing with e-Invoice integration compliance.

The system operates as a full-stack web application with a Python FastAPI backend and React TypeScript frontend, designed to run on Replit with SQLite database storage.

## Recent Changes (November 20, 2025)

**Mock Data Removal & Real API Integration:**
- ✅ Completely removed all mock data from `src/data/` directory
- ✅ Cleaned API service files (cari.ts, motorbot.ts, sefer.ts, hizmet.ts, kurlar.ts) - removed mock functions, kept only real API endpoints
- ✅ Configured Sonner toast notification system for user feedback
- ✅ Updated CariModule with real backend API integration (`/api/cari/`)
- ✅ Updated MotorbotModule with real backend API integration (`/api/motorbot/`)
- ✅ Updated SeferModule with real backend API integration (`/api/mb-trip/`)
- ✅ Activated HizmetModule with complete backend & frontend integration
- ✅ **NEW:** Activated Exchange Rate (Kurlar) module - Complete backend & frontend integration
- ✅ Created PlaceholderModule for inactive features
- ✅ Streamlined App.tsx routing - now **5 active modules**, others show placeholder
- ✅ All active modules have proper loading/error/empty state management
- ✅ Turkish language error messages and toast notifications
- ✅ Fixed API client to dynamically use window.location.origin (Replit deployment ready)
- ✅ Configured Vite proxy to forward /api requests to backend with trailing slash fix
- ✅ Backend returning 200 OK responses for all API calls
- ✅ PascalCase → snake_case field transformers working correctly across all modules

**Exchange Rate Module (Kurlar) - November 20, 2025:**
- ✅ **Backend implementation:** `models_kurlar.py`, `schemas_kurlar.py`, `router_kurlar.py` (12 endpoints, production-ready)
- ✅ **Frontend implementation:** `Kurlar.tsx` component (matches original ZIP structure exactly)
- ✅ **Component location:** `src/components/Kurlar.tsx` (NOT in modules/ subdirectory)
- ✅ **Export style:** Named export `export function Kurlar` (original ZIP pattern)
- ✅ **Page ID:** "kurlar" (not "kurlar-module")
- ✅ **API client:** `kurlar.ts` - mock API replaced with real `kurlarApi.getByDateAll()`, toast notifications added
- ✅ **SQLite table:** `ExchangeRate` (CurrencyFrom, CurrencyTo, Rate, RateDate, Source, CreatedAt)
- ✅ **UI features:** Card-based layout, currency flags 🇺🇸🇪🇺, date selector, TCMB refresh button, trend indicators
- ✅ **Advanced endpoints:** /today, /latest/{from}/{to}, /date/{date}, /convert, /bulk (no trailing slash, production-ready)
- ✅ **Currency conversion:** With reverse rate fallback logic
- ✅ **Test data:** USD/TRY (34.5), EUR/TRY (37.8), GBP/TRY (43.2), CHF/TRY, JPY/TRY rates
- ✅ **Data dependency:** `src/data/parametersData.ts` created from ZIP (14KB, currencyMasterData)
- ✅ **Routing:** Integrated into App.tsx with correct import and page ID
- ✅ **Production ready:** No trailing slash dependency, Vite proxy cleaned, works in dev and production builds
- ⏸️ **TCMB API integration:** Placeholder endpoint (returns 501 Not Implemented)

**Development Status:**
- **Active Frontend Modules (5):** CariModule, MotorbotModule, SeferModule, HizmetModule, **Kurlar**
- **Active Backend APIs (5):** /api/cari, /api/motorbot, /api/mb-trip, /api/hizmet, **/api/exchange-rate**
- **Placeholder Modules:** All other features pending API development
- **API Communication:** Working correctly with FastAPI backend on port 8000
- **Production Ready:** All 5 modules tested and architect-reviewed

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure

**Dual Stack Architecture:**
- Original Windows-based SQL Server implementation (Aliaport_v3_1/)
- Replit-optimized SQLite implementation (app/, src/)

The active Replit implementation uses:
- **Backend:** Python FastAPI with SQLAlchemy ORM
- **Frontend:** React 18 with TypeScript, Vite bundler
- **Database:** SQLite (adapted from SQL Server schema)
- **UI Framework:** Radix UI components with Shadcn/ui styling

### Data Layer

**Database Design:**
- SQLite database with normalized relational schema
- Core entities: Cari (customers/suppliers), Motorbot (boats), MbTrip (trips), service cards, price lists, invoices
- Audit trail system for change tracking
- Metadata tracking with created_at/updated_at timestamps
- Foreign key relationships maintaining referential integrity

**Data Models:**
- SQLAlchemy ORM models in `/app/models.py`
- Pydantic schemas for validation in `/app/schemas.py`
- Frontend connects directly to backend APIs (no mock data)
- Master data includes parameters, service definitions, and pricing rules

### API Architecture

**RESTful API Design:**
- FastAPI framework with automatic OpenAPI documentation
- Resource-based routing: `/api/cari`, `/api/motorbot`, `/api/mb-trip`
- CRUD operations for all major entities
- Dependency injection for database sessions
- CORS middleware enabled for cross-origin requests

**API Modules:**
- `router_cari.py` - Customer/supplier management
- `router_motorbot.py` - Boat registry operations
- `router_mbtrip.py` - Trip/voyage management
- `router_hizmet.py` - Service card management
- `router_kurlar.py` - Exchange rate management (NEW)
- Response models ensure type safety with Pydantic

### Frontend Architecture

**Component-Based React Application:**
- Modular design with feature-based component organization
- Main navigation through sidebar with submenu system
- Module structure: Dashboard → List View → Detail/Edit Forms
- Shared UI components from Shadcn/ui library
- PlaceholderModule for inactive features during development

**Active Feature Modules (Connected to Backend APIs):**
1. **Cari Management** (CariModule) - Customer/supplier management with real API integration
   - Endpoint: `/api/cari`
   - Features: List, search, create, edit, delete customers/suppliers
   - Toast notifications for user feedback
   - Loading, error, and empty states handled
   
2. **Motorboat Registry** (MotorbotModule) - Boat registry with real API integration
   - Endpoint: `/api/motorbot`
   - Features: List, search, create, edit, delete motorboats
   - Toast notifications for user feedback
   - Loading, error, and empty states handled
   
3. **Trip Management** (SeferModule) - Voyage tracking with real API integration
   - Endpoint: `/api/mb-trip`
   - Features: Trip departure/return logging
   - Toast notifications for user feedback
   - Loading, error, and empty states handled

4. **Service Cards** (HizmetModule) - Service definition management with real API integration
   - Endpoint: `/api/hizmet`
   - Backend: FastAPI router (router_hizmet.py), SQLAlchemy model (models_hizmet.py), Pydantic schemas (schemas_hizmet.py)
   - Database: SQLite table "Hizmet" with fields: Kod, Ad, GrupKod, Birim, Fiyat, ParaBirimi, KdvOrani, SiraNo, AktifMi
   - Features: List, search, create, edit, delete service cards
   - Field transformer: Backend PascalCase → Frontend snake_case (transformHizmetResponse)
   - Toast notifications for user feedback
   - Loading, error, and empty states handled
   - Simplified CariModule pattern (backed up old complex version to HizmetModule.tsx.backup)

5. **Exchange Rates** (Kurlar) - Exchange rate management with real API integration
   - Endpoint: `/api/exchange-rate`
   - Component: `src/components/Kurlar.tsx` (original ZIP structure)
   - Features: Date-based rate viewing, TCMB refresh button, currency search
   - UI: Card-based layout with currency flags, trend indicators, rate comparison
   - Data: currencyMasterData from `src/data/parametersData.ts`
   - Toast notifications for user feedback
   - Loading, error, and empty states handled

**Inactive Modules (Placeholder):**
- Service Cards, Tariff Management, Invoicing, Reporting, and other features show placeholder message: "Bu modül henüz aktif değil"

**State Management:**
- Component-level React state with useState
- No global state management library
- Direct API calls to FastAPI backend
- Sonner library for toast notifications
- Error handling with try-catch and user-friendly messages

**Form Handling:**
- React Hook Form for complex forms
- Real-time validation with custom utility functions
- Field-level error display
- Quick-add modals for related entities (Sheet components)

### Authentication & Authorization

**Current Implementation:**
- User tracking fields (created_by, updated_by) in database schema
- Metadata system tracks user actions
- No active authentication implemented (development phase)

**Planned Features:**
- Role-based access control (admin, operator, field personnel, security)
- User management interface
- Permission-based field editing rules

### Business Logic Patterns

**Audit Trail System:**
- Comprehensive change tracking for all entities
- AuditLogViewer component displays modification history
- DeleteConfirmDialog checks for dependent records before deletion
- RecordMetadataCard shows creation/modification details

**Validation Framework:**
- Turkish tax ID validation (VKN/TCKN algorithms)
- Email, phone, IBAN format validation
- Postal code validation by country
- Field-specific rules in `/utils/cariValidation.ts`

**Multi-Language Support:**
- Turkish language UI
- Currency support: TRY, USD, EUR
- Turkish tax system compliance (KDV rates, e-Invoice requirements)

### Pricing Architecture

**Two-Tier Pricing System:**
- Service cards define services WITHOUT prices
- Price lists (tariffs) contain actual pricing
- Relationship: One service can appear in multiple price lists with different rates
- Supports time-based pricing (daily, monthly, yearly contracts)

**Contract Management:**
- Accommodation contracts for boat parking
- Trip-based billing for motorboat services
- Bulk invoicing capability for periodic contracts
- Integration between contracts and invoice generation

### Turkish E-Invoice Integration

**Compliance Fields:**
- E-Invoice customer designation (IsEInvoiceCustomer)
- E-Invoice type: GB (Gönderici Birim), PK (Posta Kutusu), OK (Özel Entegratör)
- E-Invoice alias/label for electronic delivery
- E-Archive acceptance flag
- Send method selection: E-FATURA, E-ARSIV, KAGIT
- KEP (Kayıtlı Elektronik Posta) address support

**Tax Information:**
- VKN (Vergi Kimlik Numarası) for legal entities
- TCKN (TC Kimlik Numarası) for individuals
- Tax office (Vergi Dairesi) information
- Mersis number for registered companies

## External Dependencies

### Backend Dependencies
- **FastAPI** (0.115.0) - Web framework
- **Uvicorn** (0.32.0) - ASGI server with WebSocket support
- **SQLAlchemy** (2.0.36) - ORM for database operations
- **Pydantic** (2.10.0) - Data validation and settings management
- **python-multipart** (0.0.12) - Form data parsing

### Frontend Dependencies
- **React** (18.3.1) - UI framework
- **Vite** - Build tool and development server
- **TypeScript** - Type safety
- **Radix UI** - Headless component primitives (25+ components)
- **Lucide React** (0.487.0) - Icon library
- **Recharts** (2.15.2) - Chart components
- **React Hook Form** (7.55.0) - Form management
- **Tailwind CSS** v4.0 - Utility-first styling
- **date-fns** (4.1.0) - Date manipulation
- **Sonner** (2.0.3) - Toast notifications

### Development Tools
- **@vitejs/plugin-react** - Vite React integration
- **TypeScript** compiler
- **ESLint** - Code linting
- **PostCSS** with Autoprefixer

### Database
- **SQLite** - File-based relational database
  - Location: `./aliaport.db` (auto-created)
  - Replaces SQL Server from original implementation
  - Compatible with future PostgreSQL migration

### Build & Deployment
- **Node.js** 18+ required
- **Python** 3.8+ required
- Replit environment optimized
- Vite dev server on port 3000 (configurable)
- Backend serves on port 8000

### Notes on Dependencies
- Heavy use of Radix UI for accessible components
- Shadcn/ui provides styled wrappers over Radix primitives
- Mock API layer allows frontend development independent of backend
- Version pinning in package.json ensures consistency
- SQLite chosen for Replit compatibility (no external database service needed)