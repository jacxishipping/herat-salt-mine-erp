# System Architecture & Data Flow — Herat Salt Mine ERP

## 1. High-Level Architecture (Offline-First & Anti-Fraud)

```mermaid
flowchart TB
    subgraph Site["Remote Mine Site (Ghoryan / Kuhsan - Intermittent Connectivity)"]
        WB["Digital Weighbridge (Kanta) RS-232 / Serial Bridge"]
        UI["Next.js PWA Client (EN LTR / FA RTL / PS RTL)"]
        IDB[("IndexedDB Local Store + Sync Queue")]
        WB -->|"Locked Gross/Tare (kg)"| UI
        UI <-->|"Read/Write Offline"| IDB
    end

    subgraph Sync["Connectivity & Reconciliation Layer"]
        SW["Service Worker / Background Sync"]
        QUEUE["Idempotent Sync Engine (client_sync_id UUID)"]
        IDB -->|"On Network Restore"| SW --> QUEUE
    end

    subgraph Cloud["Central ERP Backend (Herat HQ / Cloud)"]
        API["REST API + JWT & RBAC Guard"]
        AUTH["6-Role RBAC Policy Engine"]
        QR["QR Waybill & MoMP Compliance Service"]
        FX["Daily AFN/USD Rate Lock & Hawala Ledger"]
        PG[("PostgreSQL 15+ (ACID + Immutable Audit Triggers)")]

        QUEUE -->|"POST /api/v1/sync/batch"| API
        API --> AUTH
        API --> QR
        API --> FX
        API --> PG
    end
```

## 2. Offline-First Sync & Reconciliation Flow

1. **Client-Side UUID Generation:** Every field entry (`weighbridge_tickets`, `extraction_logs`) is assigned a deterministic `client_sync_id` (UUID v4) and `offline_created_at` timestamp at creation time.
2. **IndexedDB Persistence:** When `navigator.onLine === false` (or when the user toggles Site Offline Mode), records are committed immediately to IndexedDB (`pending_sync_queue`) and rendered in the UI with a `PENDING_SYNC` badge.
3. **Idempotent Batch Reconciliation:** Upon reconnection, the Sync Engine posts queued records to `/api/v1/sync/batch`. PostgreSQL uses `ON CONFLICT (client_sync_id) DO NOTHING` to guarantee zero duplicate tickets or extraction tonnage.
4. **Server Timestamping:** The server records `synced_at = NOW()` while preserving `offline_created_at` for accurate shift/daily reporting.

## 3. Anti-Fraud Weighbridge (Kanta) Flow

```mermaid
sequenceDiagram
    participant Clerk as Weighbridge Clerk
    participant Scale as Digital Kanta Scale
    participant App as PWA / IndexedDB
    participant DB as PostgreSQL (Triggers)
    participant Mgr as Site Manager / Owner

    Clerk->>Scale: Capture Gross & Tare Weight
    Scale-->>App: Read-only Weight + Scale ID
    Clerk->>App: Enter Truck Plate, Driver Tazkira, Grade, Border/Local Dest
    App->>DB: INSERT weighbridge_ticket (status='ACTIVE', qr_payload_hash)
    DB->>DB: Trigger fn_audit_weighbridge -> INSERT audit_logs
    Note over Clerk,DB: Clerk CANNOT delete or edit weights (fn_prevent_delete & fn_protect_weighbridge_weights)
    Clerk->>Mgr: Request Void (if truck cancelled/error)
    Mgr->>DB: UPDATE status='VOIDED', void_approved_by=Mgr.id
    DB->>DB: Trigger records VOID_APPROVE in audit_logs
```

## 4. Role-Based Access Control (RBAC) Matrix

| Module / Capability | Mine Owner | Site Ops Mgr | Weighbridge Clerk | Warehouse Officer | Finance Officer | HSE Officer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Executive KPIs & Profit/Loss | Full | Production Only | No | No | Full | HSE Only |
| Extraction Logs & Fleet | View | Full | No | View | View | View |
| Weighbridge Tickets | View + Void Approve | View + Void Approve | Create + Print QR | View | View (Invoicing) | No |
| Warehouse & Processing | View | Full | No | Full | View | No |
| Sales, Hawala & MoMP Royalties | Full | No | No | No | Full | No |
| HSE Incidents & Compliance | Full | View | No | No | No | Full |
