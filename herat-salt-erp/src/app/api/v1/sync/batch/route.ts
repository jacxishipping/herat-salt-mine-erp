import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import {
  addAttendanceServer,
  addExtractionLogServer,
  addHseIncidentServer,
  addWeighbridgeTicketServer,
  erpStore,
} from "@/lib/server-store";
import {
  AttendanceRecord,
  ExtractionLog,
  HseIncident,
  UserRole,
  WeighbridgeTicket,
} from "@/types/erp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "SITE_OPS_MANAGER"
    );
    const tickets = (body.tickets as WeighbridgeTicket[]) || [];
    const extractions = (body.extractions as ExtractionLog[]) || [];
    const attendance = (body.attendance as AttendanceRecord[]) || [];
    const hse = (body.hse as HseIncident[]) || [];

    const syncedTicketSyncIds: string[] = [];
    const syncedExtractionSyncIds: string[] = [];
    const syncedAttendanceSyncIds: string[] = [];
    const syncedHseSyncIds: string[] = [];

    for (const t of tickets) {
      addWeighbridgeTicketServer(t, actor.actorRole);
      syncedTicketSyncIds.push(t.clientSyncId);
    }
    for (const e of extractions) {
      addExtractionLogServer(e, actor.actorRole);
      syncedExtractionSyncIds.push(e.clientSyncId);
    }
    for (const a of attendance) {
      addAttendanceServer(a, actor.actorRole);
      syncedAttendanceSyncIds.push(a.clientSyncId);
    }
    for (const h of hse) {
      addHseIncidentServer(h, actor.actorRole);
      if (h.clientSyncId) syncedHseSyncIds.push(h.clientSyncId);
    }

    const total =
      syncedTicketSyncIds.length +
      syncedExtractionSyncIds.length +
      syncedAttendanceSyncIds.length +
      syncedHseSyncIds.length;

    if (total > 0) {
      erpStore.auditLogs.unshift({
        id: `aud-sync-${Date.now()}`,
        tableName: "weighbridge_tickets",
        recordRef: "OFFLINE-BATCH",
        action: "SYNC_RECONCILE",
        summary: `Reconciled ${syncedTicketSyncIds.length} ticket(s), ${syncedExtractionSyncIds.length} extraction(s), ${syncedAttendanceSyncIds.length} attendance, ${syncedHseSyncIds.length} HSE from IndexedDB.`,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      syncedTicketSyncIds,
      syncedExtractionSyncIds,
      syncedAttendanceSyncIds,
      syncedHseSyncIds,
      state: erpStore,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Batch sync failed" },
      { status: 400 }
    );
  }
}
