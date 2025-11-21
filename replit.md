# Aliaport - Port Management System

## Overview

Aliaport is a comprehensive port and marina management system designed for harbor operations in Turkey. It manages customer relationships, motorboat operations, trip scheduling, accommodation contracts, service definitions, pricing, and invoicing with e-Invoice integration compliance. The system operates as a full-stack web application, aiming to streamline port operations and provide robust financial and operational management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-11-21:**
- ✅ **TARİFE Module activated:** Backend (`models_tarife.py`, `schemas_tarife.py`, `router_tarife.py`) + Frontend (`TarifeModule.tsx`, `tarife.ts`) integrated
- ✅ Real API connection established at `/api/price-list/` with pagination and filtering
- ✅ PascalCase↔snake_case transformers implemented for frontend-backend data flow
- ✅ Menu integration completed: Hizmet > Tarife Yönetimi
- ✅ Mock data completely removed, production-ready implementation
- ✅ **7 tarife kaydı ZIP dosyasından veritabanına aktarıldı:** 1 Aktif, 2 Taslak, 4 Pasif (2021-2026 dönemi)
- ✅ **15 hizmet kartı ZIP dosyasından veritabanına aktarıldı:** Barınma, İkmal, Bakım, Tesis hizmetleri
- ✅ **TarifeModule master-detail tasarım:** List view (tarife listesi) + Edit view (tarife header + tüm hizmetlerin fiyatları tablosu)
- ✅ Inline price editing with real-time state tracking and bulk save functionality
- ✅ Parametreler module UI brightness fix: all text updated to text-gray-200/text-white for better readability

## System Architecture

### Application Structure

Aliaport features a dual-stack architecture, utilizing a Python FastAPI backend and a React TypeScript frontend, optimized for deployment on Replit with SQLite for data storage.

### Data Layer

The system uses a normalized SQLite relational database. Core entities include customers (Cari), motorboats (Motorbot), trips (MbTrip), service cards, price lists, and invoices. It includes an audit trail system, metadata tracking with timestamps, and foreign key relationships. SQLAlchemy ORM models define the database schema, complemented by Pydantic schemas for data validation.

### API Architecture

A RESTful API, built with FastAPI, provides resource-based routing for major entities (e.g., `/api/cari`, `/api/motorbot`, `/api/mb-trip`, `/api/hizmet`, `/api/exchange-rate`). It supports CRUD operations, utilizes dependency injection for database sessions, and includes CORS middleware. Response models ensure type safety with Pydantic.

### Frontend Architecture

The frontend is a modular, component-based React application. It uses Radix UI components with Shadcn/ui styling for a consistent user experience.

**Active Feature Modules:**
1.  **Cari Management:** Manages customer and supplier information.
2.  **Motorboat Registry:** Handles motorboat details and operations.
3.  **Trip Management:** Tracks voyage and trip details.
4.  **Service Cards:** Defines and manages available services.
5.  **Exchange Rates:** Provides real-time and historical exchange rate management, including integration with the Central Bank of the Republic of Turkey (TCMB) and Electronic Data Distribution System (EVDS) APIs.
6.  **Tarife (Price Lists):** Master-detail price list management with PriceList (header) and PriceListItem (line items). Full CRUD operations via `/api/price-list/` REST API with PascalCase↔snake_case transformers.

**Key Features:**
*   Component-level state management with React `useState`.
*   Sonner for toast notifications.
*   React Hook Form for form handling and validation.
*   Placeholder modules for features under development.
*   Comprehensive error handling and user-friendly messages.

### Authentication & Authorization

The system currently tracks `created_by` and `updated_by` fields for auditing. Full authentication and role-based access control are planned for future development.

### Business Logic Patterns

*   **Audit Trail System:** Tracks changes for all entities, with a `DeleteConfirmDialog` checking for dependent records.
*   **Validation Framework:** Includes Turkish tax ID (VKN/TCKN), email, phone, IBAN, and postal code validation.
*   **Multi-Language Support:** Primarily Turkish UI, with multi-currency support and compliance with Turkish tax regulations (KDV rates, e-Invoice).
*   **Pricing Architecture:** Implements a two-tier system where service cards define services without prices, and separate price lists contain actual rates, supporting time-based pricing and contract management.
*   **Turkish E-Invoice Integration:** Includes fields and logic for compliance with Turkish e-invoice standards (e.g., VKN/TCKN, e-invoice customer designation, KEP addresses).

## External Dependencies

### Backend
*   **FastAPI**: Web framework.
*   **Uvicorn**: ASGI server.
*   **SQLAlchemy**: ORM for database operations.
*   **Pydantic**: Data validation and settings.
*   **python-multipart**: Form data parsing.
*   **requests**: HTTP library for external API calls (e.g., TCMB).
*   **xml.etree.ElementTree**: XML parsing for TCMB data.
*   **evds**: Official TCMB EVDS Python library.
*   **pandas**: Data processing for EVDS integration.

### Frontend
*   **React**: UI framework.
*   **Vite**: Build tool.
*   **TypeScript**: Type safety.
*   **Radix UI**: Headless component primitives.
*   **Lucide React**: Icon library.
*   **Recharts**: Chart components.
*   **React Hook Form**: Form management.
*   **Tailwind CSS**: Utility-first styling.
*   **date-fns**: Date manipulation.
*   **Sonner**: Toast notifications.

### Database
*   **SQLite**: File-based relational database (`./aliaport.db`), chosen for Replit compatibility.

### Build & Deployment
*   **Node.js** (18+) and **Python** (3.8+) are required. The system is optimized for the Replit environment.