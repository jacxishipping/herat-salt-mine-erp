# Core REST API Endpoint Specification (`/api/v1`)

All endpoints require `Authorization: Bearer <JWT>` and enforce RBAC middleware. Offline-capable `POST` endpoints accept `client_sync_id` (UUID) for idempotency.

## 1. Auth, RBAC & Offline Sync
- `POST /api/v1/auth/login` — Authenticate user, return JWT + role permissions + preferred language (`en` | `fa` | `ps`).
- `POST /api/v1/sync/batch` — Reconcile offline IndexedDB queue (`weighbridge_tickets`, `extraction_logs`); returns `{ syncedIds[], conflicts[] }`.
- `GET /api/v1/audit-logs` — *(Mine Owner only)* Paginated immutable audit trail filtered by table, actor, or date.

## 2. Module A: Extraction, Quarry Zones & Fleet
- `GET /api/v1/zones` — List active Ghoryan & Kuhsan pits, tunnels, and brine pans with reserves & daily targets.
- `GET /api/v1/extraction-logs?date=&zoneId=` — List shift extraction logs with tonnage & fuel metrics.
- `POST /api/v1/extraction-logs` — Record shift extraction log (auto-updates equipment engine hours).
- `GET /api/v1/fleet` — List excavators, dump trucks, crushers, generators & maintenance due status.

## 3. Module B: Processing & Warehouse Inventory
- `GET /api/v1/inventory/stock` — Real-time stock balances by warehouse & salt grade (`INDUSTRIAL_RAW_ROCK`, `REFINED_IODIZED_25KG`, etc.).
- `POST /api/v1/processing/batches` — Log raw intake -> crushed/washed/iodized output + automatic shrinkage calculation.
- `POST /api/v1/inventory/adjustments` — Record shrinkage/moisture loss or inter-warehouse transfer (Herat depot / Islam Qala staging).

## 4. Module C: Weighbridge (Kanta) & Logistics Dispatch
- `GET /api/v1/weighbridge/tickets?status=&direction=` — List serialized weighbridge tickets (`KNT-YYYY-XXXXXX`).
- `POST /api/v1/weighbridge/tickets` — Issue immutable weighbridge ticket + compute `net_weight_kg` + generate SHA-256 QR payload hash.
- `POST /api/v1/weighbridge/tickets/:id/void-request` — Clerk requests void with mandatory `void_reason`.
- `POST /api/v1/weighbridge/tickets/:id/void-approve` — *(Mine Owner / Site Ops Mgr only)* Approves voiding; recorded in `audit_logs`.
- `GET /api/v1/weighbridge/tickets/:id/waybill` — Returns QR-coded Waybill/Bilty JSON/PDF data for thermal or A4 RTL/LTR printing.

## 5. Module D: Sales, Dual-Currency & MoMP Royalties
- `GET /api/v1/finance/exchange-rate/today` — Get/lock daily `USD -> AFN` rate.
- `POST /api/v1/finance/invoices` — Create AFN or USD invoice linked to weighbridge ticket with locked FX rate.
- `POST /api/v1/finance/payments` — Record `CASH`, `BANK_TRANSFER`, or `HAWALA` (`hawala_saraf_name`, `hawala_code`) payment.
- `GET /api/v1/compliance/momp-royalties` — Calculate accrued MoMP royalties per MT extracted/exported (Islam Qala / Torghundi).

## 6. Module E & F: HR/HSE & Executive Analytics
- `POST /api/v1/hse/incidents` — Log safety incident, near-miss, or dust check.
- `GET /api/v1/analytics/executive?currency=AFN|USD` — Aggregated KPIs: extracted vs. processed vs. dispatched MT, cost/ton, fuel efficiency, revenue, pending MoMP liabilities.
