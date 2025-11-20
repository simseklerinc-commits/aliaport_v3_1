# Aliaport - Port Management System

## Overview

Aliaport is a comprehensive port and marina management system designed for harbor operations in Turkey. The application manages customer relationships, motorboat operations, trip scheduling, accommodation contracts, service definitions, pricing, and invoicing with e-Invoice integration compliance.

The system operates as a full-stack web application with a Python FastAPI backend and React TypeScript frontend, designed to run on Replit with SQLite database storage.

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
- Mock data layers in `/src/data/` for frontend development
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
- Response models ensure type safety with Pydantic

### Frontend Architecture

**Component-Based React Application:**
- Modular design with feature-based component organization
- Main navigation through sidebar with submenu system
- Module structure: Dashboard → List View → Detail/Edit Forms
- Shared UI components from Shadcn/ui library

**Key Feature Modules:**
1. **Cari Management** - Customer/supplier cards with e-Invoice fields
2. **Service Cards** - Service definitions without pricing (pricing in tariffs)
3. **Tariff Management** - Price list management with service items
4. **Motorboat Registry** - Boat master data and accommodation contracts
5. **Trip Management** - Voyage tracking with departure/return logging
6. **Invoicing** - Invoice generation with e-Invoice/e-Archive support
7. **Reporting** - Analytics dashboards and operational reports

**State Management:**
- Component-level React state with useState
- No global state management library
- API calls through mock services (ready for backend integration)

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