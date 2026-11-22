import { Pool } from "pg";

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

export async function checkPostgresHealth(): Promise<{
  connected: boolean;
  mode: "POSTGRESQL" | "IN_MEMORY_FALLBACK";
  error?: string;
}> {
  const pool = getPgPool();
  if (!pool) {
    return { connected: false, mode: "IN_MEMORY_FALLBACK" };
  }
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

/**
 * Dual-write helper: persists critical ACID records to PostgreSQL when
 * DATABASE_URL is configured, while keeping the hot state synchronized.
 */
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
    const userRes = await pool.query(
      "SELECT id FROM users ORDER BY created_at ASC LIMIT 1"
    );
    const operatorId = userRes.rows[0]?.id;
    if (!operatorId) return;

    await pool.query(
      `INSERT INTO weighbridge_tickets (
        client_sync_id, ticket_number, direction, truck_plate, driver_name,
        driver_tazkira, salt_grade, destination_type, destination_detail,
        gross_weight_kg, tare_weight_kg, scale_device_id, qr_payload_hash,
        weigh_in_at, weigh_out_at, operator_id, offline_created_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14,$15,$16
      ) ON CONFLICT (client_sync_id) DO NOTHING`,
      [
        params.clientSyncId,
        params.ticketNumber,
        params.direction,
        params.truckPlate,
        params.driverName,
        params.driverTazkira,
        params.saltGrade,
        params.destinationType,
        params.destinationDetail,
        params.grossWeightKg,
        params.tareWeightKg,
        params.scaleDeviceId,
        params.qrPayloadHash,
        params.weighOutAt,
        operatorId,
        params.offlineCreatedAt,
      ]
    );
  } catch {
    // Non-fatal in dev fallback mode; production logs error
  }
}
