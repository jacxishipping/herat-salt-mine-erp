-- ============================================================================
-- Herat Salt Mine ERP & Operations Management System (Ghoryan / Kuhsan)
-- PostgreSQL 15+ Production Schema
-- Features: ACID Financial & Weighbridge Integrity, Immutable Audit Triggers,
--           Offline-First Client Sync UUIDs, Dual-Currency (AFN/USD) Locking,
--           MoMP Royalty & Herat Customs (Islam Qala / Torghundi) Compliance
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ENUMERATIONS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'MINE_OWNER',
  'SITE_OPS_MANAGER',
  'WEIGHBRIDGE_CLERK',
  'WAREHOUSE_OFFICER',
  'FINANCE_OFFICER',
  'HSE_COMPLIANCE_OFFICER'
);

CREATE TYPE lang_code AS ENUM ('en', 'fa', 'ps');
CREATE TYPE currency_code AS ENUM ('AFN', 'USD');
CREATE TYPE payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'HAWALA');

CREATE TYPE zone_type AS ENUM ('PIT', 'TUNNEL', 'BRINE_PAN');
CREATE TYPE extraction_method AS ENUM ('ROCK_BLASTING_CUTTING', 'SOLAR_EVAPORATION');

CREATE TYPE salt_grade AS ENUM (
  'INDUSTRIAL_RAW_ROCK',
  'REFINED_IODIZED_25KG',
  'REFINED_IODIZED_50KG',
  'REFINED_IODIZED_1KG',
  'LIVESTOCK_SALT_BLOCK',
  'DEICING_CHEMICAL'
);

CREATE TYPE ticket_direction AS ENUM ('INBOUND_SUPPLY', 'OUTBOUND_DISPATCH');
CREATE TYPE ticket_status AS ENUM ('ACTIVE', 'VOID_PENDING', 'VOIDED');
CREATE TYPE destination_type AS ENUM (
  'HERAT_LOCAL',
  'DOMESTIC_PROVINCE',
  'ISLAM_QALA_EXPORT',
  'TORGHUNDI_EXPORT'
);

CREATE TYPE hse_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ----------------------------------------------------------------------------
-- 2. IDENTITY, RBAC & EXCHANGE RATES
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(180) UNIQUE NOT NULL,
  phone           VARCHAR(30),
  tazkira_no      VARCHAR(40) UNIQUE,
  role            user_role NOT NULL,
  password_hash   TEXT NOT NULL,
  preferred_lang  lang_code NOT NULL DEFAULT 'en',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_date       DATE NOT NULL UNIQUE,
  usd_to_afn      NUMERIC(12, 4) NOT NULL CHECK (usd_to_afn > 0),
  source          VARCHAR(80) NOT NULL DEFAULT 'Sarai Shahzada / Da Afghanistan Bank',
  locked_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. MODULE A: EXTRACTION, QUARRY ZONES & FLEET
-- ----------------------------------------------------------------------------
CREATE TABLE mine_zones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  VARCHAR(20) UNIQUE NOT NULL, -- e.g., GHR-PIT-01, KHS-PAN-03
  region                VARCHAR(60) NOT NULL,        -- Ghoryan, Kuhsan
  name_en               VARCHAR(120) NOT NULL,
  name_fa               VARCHAR(120) NOT NULL,
  name_ps               VARCHAR(120) NOT NULL,
  zone_type             zone_type NOT NULL,
  gps_coords            VARCHAR(64),
  estimated_reserves_mt NUMERIC(14, 2) NOT NULL DEFAULT 0,
  daily_target_mt       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE equipment_fleet (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code          VARCHAR(30) UNIQUE NOT NULL,
  name                VARCHAR(120) NOT NULL,
  category            VARCHAR(40) NOT NULL, -- EXCAVATOR, DUMP_TRUCK, CRUSHER, GENERATOR
  model               VARCHAR(80),
  engine_hours        NUMERIC(10, 1) NOT NULL DEFAULT 0,
  fuel_capacity_l     NUMERIC(8, 1),
  status              VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL', -- OPERATIONAL, MAINTENANCE, DOWN
  last_service_date   DATE,
  next_service_hours  NUMERIC(10, 1),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extraction_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_sync_id      UUID UNIQUE NOT NULL, -- Offline-first idempotency key
  zone_id             UUID NOT NULL REFERENCES mine_zones(id),
  shift_code          VARCHAR(20) NOT NULL, -- SHIFT_A_DAY, SHIFT_B_NIGHT
  log_date            DATE NOT NULL,
  method              extraction_method NOT NULL,
  raw_tonnage_mt      NUMERIC(10, 3) NOT NULL CHECK (raw_tonnage_mt > 0),
  crew_lead_name      VARCHAR(120) NOT NULL,
  equipment_id        UUID REFERENCES equipment_fleet(id),
  fuel_used_l         NUMERIC(8, 2) NOT NULL DEFAULT 0 CHECK (fuel_used_l >= 0),
  engine_hours_delta  NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (engine_hours_delta >= 0),
  moisture_pct        NUMERIC(5, 2) DEFAULT 3.50,
  notes               TEXT,
  offline_created_at  TIMESTAMPTZ NOT NULL,
  synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_extraction_logs_date ON extraction_logs(log_date DESC);
CREATE INDEX idx_extraction_logs_zone ON extraction_logs(zone_id, log_date DESC);

-- ----------------------------------------------------------------------------
-- 4. MODULE B: PROCESSING, GRADING & WAREHOUSE INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE warehouses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,
  name_en         VARCHAR(120) NOT NULL,
  name_fa         VARCHAR(120) NOT NULL,
  name_ps         VARCHAR(120) NOT NULL,
  location_type   VARCHAR(40) NOT NULL, -- ON_SITE_STOCKPILE, HERAT_CITY_DEPOT, BORDER_STAGING
  capacity_mt     NUMERIC(12, 2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE processing_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code          VARCHAR(40) UNIQUE NOT NULL,
  intake_tonnage_mt   NUMERIC(10, 3) NOT NULL CHECK (intake_tonnage_mt > 0),
  output_tonnage_mt   NUMERIC(10, 3) NOT NULL CHECK (output_tonnage_mt > 0),
  salt_grade          salt_grade NOT NULL,
  iodine_ppm          NUMERIC(6, 2), -- Food-grade compliance (e.g., 30-50 ppm)
  moisture_after_pct  NUMERIC(5, 2),
  shrinkage_mt        NUMERIC(10, 3) GENERATED ALWAYS AS (intake_tonnage_mt - output_tonnage_mt) STORED,
  warehouse_id        UUID NOT NULL REFERENCES warehouses(id),
  supervisor_id       UUID NOT NULL REFERENCES users(id),
  processed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  salt_grade      salt_grade NOT NULL,
  delta_mt        NUMERIC(12, 3) NOT NULL,
  reason          VARCHAR(40) NOT NULL, -- EXTRACTION, PROCESSING_IN, DISPATCH_OUT, SHRINKAGE, TRANSFER
  reference_id    UUID,
  recorded_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_wh_grade ON inventory_ledger(warehouse_id, salt_grade);

-- ----------------------------------------------------------------------------
-- 5. MODULE C: WEIGHBRIDGE (KANTA) & LOGISTICS DISPATCH (ANTI-FRAUD)
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                VARCHAR(30) UNIQUE NOT NULL,
  company_name        VARCHAR(160) NOT NULL,
  contact_name        VARCHAR(120),
  phone               VARCHAR(30),
  tazkira_or_tin      VARCHAR(50),
  customer_type       VARCHAR(40) NOT NULL, -- WHOLESALER, FOOD_PROCESSOR, GOV_TENDER, EXPORT_BUYER
  credit_limit_usd    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  preferred_currency  currency_code NOT NULL DEFAULT 'AFN',
  address_herat       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weighbridge_tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_sync_id      UUID UNIQUE NOT NULL, -- Offline-first idempotency key
  ticket_number       VARCHAR(32) UNIQUE NOT NULL, -- e.g., KNT-2026-000142
  direction           ticket_direction NOT NULL,
  status              ticket_status NOT NULL DEFAULT 'ACTIVE',
  truck_plate         VARCHAR(30) NOT NULL, -- e.g., HRT-48291
  driver_name         VARCHAR(120) NOT NULL,
  driver_tazkira      VARCHAR(40) NOT NULL,
  customer_id         UUID REFERENCES customers(id),
  supplier_name       VARCHAR(140),
  zone_id             UUID REFERENCES mine_zones(id),
  salt_grade          salt_grade NOT NULL,
  destination_type    destination_type NOT NULL,
  destination_detail  VARCHAR(200),
  gross_weight_kg     NUMERIC(10, 2) NOT NULL CHECK (gross_weight_kg > 0),
  tare_weight_kg      NUMERIC(10, 2) NOT NULL CHECK (tare_weight_kg > 0),
  net_weight_kg       NUMERIC(10, 2) GENERATED ALWAYS AS (gross_weight_kg - tare_weight_kg) STORED,
  scale_device_id     VARCHAR(40) NOT NULL DEFAULT 'KANTA-GHR-01',
  qr_payload_hash     VARCHAR(128) NOT NULL,
  weigh_in_at         TIMESTAMPTZ NOT NULL,
  weigh_out_at        TIMESTAMPTZ NOT NULL,
  operator_id         UUID NOT NULL REFERENCES users(id),
  void_reason         TEXT,
  void_approved_by    UUID REFERENCES users(id),
  void_approved_at    TIMESTAMPTZ,
  offline_created_at  TIMESTAMPTZ NOT NULL,
  synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_gross_gt_tare CHECK (gross_weight_kg > tare_weight_kg)
);

CREATE INDEX idx_weighbridge_created ON weighbridge_tickets(created_at DESC);
CREATE INDEX idx_weighbridge_plate ON weighbridge_tickets(truck_plate);
CREATE INDEX idx_weighbridge_status ON weighbridge_tickets(status);

-- ----------------------------------------------------------------------------
-- 6. MODULE D: SALES, MULTI-CURRENCY ACCOUNTING, HAWALA & MOMP ROYALTIES
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number      VARCHAR(32) UNIQUE NOT NULL,
  customer_id         UUID NOT NULL REFERENCES customers(id),
  ticket_id           UUID REFERENCES weighbridge_tickets(id),
  currency            currency_code NOT NULL,
  exchange_rate_id    UUID NOT NULL REFERENCES exchange_rates(id),
  locked_usd_to_afn   NUMERIC(12, 4) NOT NULL,
  unit_price          NUMERIC(12, 2) NOT NULL,
  quantity_mt         NUMERIC(10, 3) NOT NULL,
  subtotal_amount     NUMERIC(14, 2) NOT NULL,
  momp_royalty_afn    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status              VARCHAR(30) NOT NULL DEFAULT 'ISSUED', -- ISSUED, PARTIAL, PAID, VOIDED
  issued_by           UUID NOT NULL REFERENCES users(id),
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE financial_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID REFERENCES invoices(id),
  entry_type          VARCHAR(20) NOT NULL, -- RECEIVABLE_PAYMENT, SUPPLIER_BILL, ROYALTY_ACCRUAL, PAYROLL
  currency            currency_code NOT NULL,
  amount              NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  locked_usd_to_afn   NUMERIC(12, 4) NOT NULL,
  amount_afn_equiv    NUMERIC(16, 2) NOT NULL,
  method              payment_method NOT NULL,
  hawala_saraf_name   VARCHAR(120),
  hawala_code         VARCHAR(60),
  bank_ref            VARCHAR(80),
  recorded_by         UUID NOT NULL REFERENCES users(id),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE momp_royalty_assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start          DATE NOT NULL,
  period_end            DATE NOT NULL,
  extracted_mt          NUMERIC(12, 3) NOT NULL,
  exported_mt           NUMERIC(12, 3) NOT NULL DEFAULT 0,
  royalty_rate_afn_mt   NUMERIC(10, 2) NOT NULL,
  total_royalty_afn     NUMERIC(16, 2) NOT NULL,
  customs_border_ref    VARCHAR(100), -- Islam Qala / Torghundi clearance #
  status                VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, FILED, PAID
  filed_by              UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. MODULE E: HR, PAYROLL & HSE COMPLIANCE
-- ----------------------------------------------------------------------------
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code   VARCHAR(24) UNIQUE NOT NULL,
  full_name       VARCHAR(140) NOT NULL,
  tazkira_no      VARCHAR(40) UNIQUE NOT NULL,
  role_title      VARCHAR(80) NOT NULL,
  daily_wage_afn  NUMERIC(10, 2) NOT NULL,
  ton_bonus_afn   NUMERIC(8, 2) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hse_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id         UUID REFERENCES mine_zones(id),
  incident_type   VARCHAR(50) NOT NULL, -- NEAR_MISS, INJURY, DUST_EXCEEDANCE, EQUIPMENT_HAZARD
  severity        hse_severity NOT NULL,
  description     TEXT NOT NULL,
  ppe_compliant   BOOLEAN NOT NULL DEFAULT TRUE,
  reported_by     UUID NOT NULL REFERENCES users(id),
  reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. IMMUTABLE AUDIT LOGS & ANTI-FRAUD TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  table_name      VARCHAR(64) NOT NULL,
  record_id       UUID NOT NULL,
  action          VARCHAR(24) NOT NULL, -- INSERT, UPDATE, VOID_REQUEST, VOID_APPROVE
  old_data        JSONB,
  new_data        JSONB,
  actor_id        UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Prevent deletion of weighbridge tickets or financial ledger entries
CREATE OR REPLACE FUNCTION fn_prevent_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY VIOLATION: Deletion from % is strictly prohibited. Use supervisor-approved voiding.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_delete_weighbridge
  BEFORE DELETE ON weighbridge_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_delete();

CREATE TRIGGER trg_no_delete_financial_ledger
  BEFORE DELETE ON financial_ledger
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_delete();

-- Protect weighbridge weights from post-creation tampering
CREATE OR REPLACE FUNCTION fn_protect_weighbridge_weights()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.gross_weight_kg IS DISTINCT FROM NEW.gross_weight_kg
     OR OLD.tare_weight_kg IS DISTINCT FROM NEW.tare_weight_kg THEN
    RAISE EXCEPTION 'ANTI-FRAUD VIOLATION: Weighbridge weights cannot be modified after ticket issuance (Ticket %).', OLD.ticket_number;
  END IF;

  IF NEW.status = 'VOIDED' AND NEW.void_approved_by IS NULL THEN
    RAISE EXCEPTION 'SUPERVISOR APPROVAL REQUIRED: Ticket % cannot be voided without void_approved_by.', OLD.ticket_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_weighbridge
  BEFORE UPDATE ON weighbridge_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_protect_weighbridge_weights();

-- Automatic JSONB audit trail on weighbridge tickets
CREATE OR REPLACE FUNCTION fn_audit_weighbridge()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_data, new_data, actor_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    to_jsonb(NEW),
    COALESCE(NEW.void_approved_by, NEW.operator_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_weighbridge
  AFTER INSERT OR UPDATE ON weighbridge_tickets
  FOR EACH ROW EXECUTE FUNCTION fn_audit_weighbridge();

-- ----------------------------------------------------------------------------
-- 9. DOUBLE-ENTRY GENERAL LEDGER (CHART OF ACCOUNTS & BALANCED JOURNALS)
-- ----------------------------------------------------------------------------
CREATE TABLE chart_of_accounts (
  code            VARCHAR(12) PRIMARY KEY,
  name            VARCHAR(140) NOT NULL,
  account_type    VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number    VARCHAR(32) UNIQUE NOT NULL,
  entry_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  memo            TEXT NOT NULL,
  posted_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id      UUID NOT NULL REFERENCES journal_entries(id),
  account_code    VARCHAR(12) NOT NULL REFERENCES chart_of_accounts(code),
  debit_afn       NUMERIC(16, 2) NOT NULL DEFAULT 0 CHECK (debit_afn >= 0),
  credit_afn      NUMERIC(16, 2) NOT NULL DEFAULT 0 CHECK (credit_afn >= 0),
  CONSTRAINT chk_debit_xor_credit CHECK ((debit_afn > 0 AND credit_afn = 0) OR (credit_afn > 0 AND debit_afn = 0))
);

CREATE INDEX idx_journal_lines_account ON journal_lines(account_code);

-- ----------------------------------------------------------------------------
-- 10. EXPENSES, SUPPLIERS AP, QC LAB (CoA), EXPORT CUSTOMS & CONSUMABLES STORE
-- ----------------------------------------------------------------------------
CREATE TABLE mine_expenses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_code         VARCHAR(32) UNIQUE NOT NULL,
  category             VARCHAR(40) NOT NULL,
  description          TEXT NOT NULL,
  payee                VARCHAR(140) NOT NULL,
  amount_afn           NUMERIC(14, 2) NOT NULL CHECK (amount_afn > 0),
  payment_account_code VARCHAR(12) NOT NULL REFERENCES chart_of_accounts(code),
  receipt_ref          VARCHAR(64),
  recorded_by          UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number     VARCHAR(32) UNIQUE NOT NULL,
  supplier_name   VARCHAR(140) NOT NULL,
  category        VARCHAR(40) NOT NULL,
  amount_afn      NUMERIC(14, 2) NOT NULL CHECK (amount_afn > 0),
  due_date        DATE NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID')),
  payment_ref     VARCHAR(64),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE qc_lab_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code       VARCHAR(32) UNIQUE NOT NULL,
  batch_code      VARCHAR(40) NOT NULL,
  salt_grade      VARCHAR(40) NOT NULL,
  nacl_purity_pct NUMERIC(5, 2) NOT NULL,
  moisture_pct    NUMERIC(5, 2) NOT NULL,
  iodine_ppm      NUMERIC(6, 2) NOT NULL DEFAULT 0,
  insoluble_pct   NUMERIC(5, 2) NOT NULL DEFAULT 0,
  status          VARCHAR(24) NOT NULL,
  tested_by       VARCHAR(120) NOT NULL,
  tested_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE export_shipments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_code   VARCHAR(32) UNIQUE NOT NULL,
  customs_decl_no VARCHAR(48) NOT NULL,
  border_post     VARCHAR(32) NOT NULL,
  buyer_name      VARCHAR(140) NOT NULL,
  truck_plate     VARCHAR(32) NOT NULL,
  tonnage_mt      NUMERIC(10, 2) NOT NULL CHECK (tonnage_mt > 0),
  freight_afn     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status          VARCHAR(24) NOT NULL DEFAULT 'AT_MINE' CHECK (status IN ('AT_MINE','IN_TRANSIT','BORDER_CLEARED','DELIVERED')),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consumable_items (
  sku_code        VARCHAR(32) PRIMARY KEY,
  item_name       VARCHAR(140) NOT NULL,
  category        VARCHAR(40) NOT NULL,
  unit            VARCHAR(24) NOT NULL,
  stock_qty       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_cost_afn   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


