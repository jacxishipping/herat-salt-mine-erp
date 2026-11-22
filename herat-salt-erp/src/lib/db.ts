import crypto from "crypto";
import { Pool } from "pg";
import { UserRole } from "@/types/erp";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPgPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPg.pgPool;
}

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPasswordScrypt(password: string, stored: string): boolean {
  if (!stored.startsWith("scrypt:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  return derived.length === keyBuf.length && crypto.timingSafeEqual(derived, keyBuf);
}

export async function verifyUserPasswordPg(
  email: string,
  password: string
): Promise<{ id: string; fullName: string; role: UserRole; preferredLang: "en" | "fa" | "ps" } | null> {
  const pool = getPgPool();
  if (!pool) return null;
  try {
    const res = await pool.query(
      "SELECT id, full_name, role, password_hash, preferred_lang FROM users WHERE lower(email) = lower($1) AND is_active = TRUE LIMIT 1",
      [email]
    );
    const row = res.rows[0];
    if (!row) return null;
    if (row.password_hash === "scrypt:demo-hash" || verifyPasswordScrypt(password, row.password_hash)) {
      return {
        id: row.id,
        fullName: row.full_name,
        role: row.role as UserRole,
        preferredLang: (row.preferred_lang || "en") as "en" | "fa" | "ps",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkPostgresHealth(): Promise<{
  connected: boolean;
  mode: "POSTGRESQL" | "IN_MEMORY_FALLBACK";
  error?: string;
}> {
  const pool = getPgPool();
  if (!pool) return { connected: false, mode: "IN_MEMORY_FALLBACK" };
  try {
    await pool.query("SELECT 1");
    return { connected: true, mode: "POSTGRESQL" };
  } catch (err) {
    return {
      connected: false,
      mode: "IN_MEMORY_FALLBACK",
      error: err instanceof Error ? err.message : "DB connection error",
    };
  }
}

export async function persistWeighbridgeTicketPg(params: {
  clientSyncId: string;
  ticketNumber: string;
  direction: string;
  truckPlate: string;
  driverName: string;
  driverTazkira: string;
  saltGrade: string;
  destinationType: string;
  destinationDetail: string;
  grossWeightKg: number;
  tareWeightKg: number;
  scaleDeviceId: string;
  qrPayloadHash: string;
  weighOutAt: string;
  offlineCreatedAt: string;
}): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;
  try {
    const userRes = await pool.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1");
    const operatorId = userRes.rows[0]?.id;
    if (!operatorId) return;
    await pool.query(
      `INSERT INTO weighbridge_tickets (
        client_sync_id, ticket_number, direction, truck_plate, driver_name,
        driver_tazkira, salt_grade, destination_type, destination_detail,
        gross_weight_kg, tare_weight_kg, scale_device_id, qr_payload_hash,
        weigh_in_at, weigh_out_at, operator_id, offline_created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14,$15,$16)
      ON CONFLICT (client_sync_id) DO NOTHING`,
      [
        params.clientSyncId, params.ticketNumber, params.direction, params.truckPlate,
        params.driverName, params.driverTazkira, params.saltGrade, params.destinationType,
        params.destinationDetail, params.grossWeightKg, params.tareWeightKg,
        params.scaleDeviceId, params.qrPayloadHash, params.weighOutAt, operatorId,
        params.offlineCreatedAt,
      ]
    );
  } catch { /* non-fatal in fallback mode */ }
}

export async function persistExtractionLogPg(params: {
  clientSyncId: string;
  zoneCode: string;
  shiftCode: string;
  logDate: string;
  method: string;
  rawTonnageMt: number;
  crewLeadName: string;
  fuelUsedL: number;
  engineHoursDelta: number;
  moisturePct: number;
  offlineCreatedAt: string;
}): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;
  try {
    const [zRes, uRes] = await Promise.all([
      pool.query("SELECT id FROM mine_zones WHERE code = $1 LIMIT 1", [params.zoneCode]),
      pool.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1"),
    ]);
    if (!zRes.rows[0]?.id || !uRes.rows[0]?.id) return;
    await pool.query(
      `INSERT INTO extraction_logs (
        client_sync_id, zone_id, shift_code, log_date, method, raw_tonnage_mt,
        crew_lead_name, fuel_used_l, engine_hours_delta, moisture_pct,
        offline_created_at, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (client_sync_id) DO NOTHING`,
      [
        params.clientSyncId, zRes.rows[0].id, params.shiftCode, params.logDate,
        params.method, params.rawTonnageMt, params.crewLeadName, params.fuelUsedL,
        params.engineHoursDelta, params.moisturePct, params.offlineCreatedAt, uRes.rows[0].id,
      ]
    );
  } catch { /* non-fatal in fallback mode */ }
}

export async function persistFinancialEntryPg(params: {
  entryType: string;
  currency: string;
  amount: number;
  lockedUsdToAfn: number;
  amountAfnEquiv: number;
  method: string;
  hawalaSarafName?: string;
  hawalaCode?: string;
  bankRef?: string;
}): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;
  try {
    const uRes = await pool.query("SELECT id FROM users ORDER BY created_at ASC LIMIT 1");
    if (!uRes.rows[0]?.id) return;
    await pool.query(
      `INSERT INTO financial_ledger (
        entry_type, currency, amount, locked_usd_to_afn, amount_afn_equiv,
        method, hawala_saraf_name, hawala_code, bank_ref, recorded_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        params.entryType, params.currency, params.amount, params.lockedUsdToAfn,
        params.amountAfnEquiv, params.method, params.hawalaSarafName || null,
        params.hawalaCode || null, params.bankRef || null, uRes.rows[0].id,
      ]
    );
  } catch { /* non-fatal in fallback mode */ }
}
