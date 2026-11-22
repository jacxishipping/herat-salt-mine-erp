-- ============================================================================
-- Herat Salt Mine ERP — Initial Seed Data (PostgreSQL 15+)
-- ============================================================================

INSERT INTO users (full_name, email, phone, tazkira_no, role, password_hash, preferred_lang)
VALUES
  ('Haji Abdul Rahim (MD)', 'owner@heratsalt.af', '+93799000101', '1380-0101-10001', 'MINE_OWNER', 'scrypt:demo-hash', 'fa'),
  ('Eng. Ahmadullah Noori', 'ops@heratsalt.af', '+93799000102', '1391-0512-33104', 'SITE_OPS_MANAGER', 'scrypt:demo-hash', 'fa'),
  ('Fardin Ahmadi', 'kanta@heratsalt.af', '+93799000103', '1399-1104-60122', 'WEIGHBRIDGE_CLERK', 'scrypt:demo-hash', 'fa'),
  ('Eng. Jawid Sadat', 'warehouse@heratsalt.af', '+93799000104', '1394-0309-44102', 'WAREHOUSE_OFFICER', 'scrypt:demo-hash', 'fa'),
  ('Mirwais Sultani', 'finance@heratsalt.af', '+93799000105', '1392-0718-88210', 'FINANCE_OFFICER', 'scrypt:demo-hash', 'en'),
  ('Dr. Zabiullah Rahimi', 'hse@heratsalt.af', '+93799000106', '1393-0422-71903', 'HSE_COMPLIANCE_OFFICER', 'scrypt:demo-hash', 'ps')
ON CONFLICT (email) DO NOTHING;

INSERT INTO exchange_rates (rate_date, usd_to_afn, source)
VALUES (CURRENT_DATE, 71.5000, 'Sarai Shahzada / Da Afghanistan Bank')
ON CONFLICT (rate_date) DO NOTHING;

INSERT INTO mine_zones (code, region, name_en, name_fa, name_ps, zone_type, gps_coords, estimated_reserves_mt, daily_target_mt)
VALUES
  ('GHR-PIT-01', 'Ghoryan', 'Ghoryan North Rock Pit', 'گودال سنگ نمک شمال غوریان', 'د غوریان شمالي ډبرین کنده', 'PIT', '34.3421 N, 61.4912 E', 420000, 180),
  ('GHR-TUN-02', 'Ghoryan', 'Ghoryan Deep Seam Tunnel B', 'تونل رگه عمیق غوریان ب', 'د غوریان ژور تونل ب', 'TUNNEL', '34.3389 N, 61.4875 E', 285000, 110),
  ('KHS-PAN-03', 'Kuhsan', 'Kuhsan Solar Brine Pan #3', 'حوضچه تبخیر آفتابی کهسان ۳', 'د کهسان لمریز تبخیر حوض ۳', 'BRINE_PAN', '34.6510 N, 61.1984 E', 165000, 95)
ON CONFLICT (code) DO NOTHING;

INSERT INTO warehouses (code, name_en, name_fa, name_ps, location_type, capacity_mt)
VALUES
  ('WH-GHR-SITE', 'Ghoryan On-Site Stockpile', 'ذخیره‌گاه ساحوی غوریان', 'د غوریان ساحوي زېرمه', 'ON_SITE_STOCKPILE', 15000),
  ('WH-HRT-CITY', 'Herat Industrial Park Depot', 'گدام شهرک صنعتی هرات', 'د هرات صنعتي ښارګوټي ګودام', 'HERAT_CITY_DEPOT', 6500),
  ('WH-ISQ-STG', 'Islam Qala Border Staging', 'گدام مرزی اسلام‌قلعه', 'د اسلام‌قلعه سرحدي تمځای', 'BORDER_STAGING', 2500)
ON CONFLICT (code) DO NOTHING;
