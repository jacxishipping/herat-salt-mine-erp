import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import { persistWeighbridgeTicketPg } from "@/lib/db";
import { addWeighbridgeTicketServer, erpStore } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({ tickets: erpStore.weighbridgeTickets });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "WEIGHBRIDGE_CLERK"
    );
    const ticket = addWeighbridgeTicketServer(body.ticket, actor.actorRole);

    // Dual-write to PostgreSQL when DATABASE_URL is configured
    await persistWeighbridgeTicketPg({
      clientSyncId: ticket.clientSyncId,
      ticketNumber: ticket.ticketNumber,
      direction: ticket.direction,
      truckPlate: ticket.truckPlate,
      driverName: ticket.driverName,
      driverTazkira: ticket.driverTazkira,
      saltGrade: ticket.saltGrade,
      destinationType: ticket.destinationType,
      destinationDetail: ticket.destinationDetail,
      grossWeightKg: ticket.grossWeightKg,
      tareWeightKg: ticket.tareWeightKg,
      scaleDeviceId: ticket.scaleDeviceId,
      qrPayloadHash: ticket.qrPayloadHash,
      weighOutAt: ticket.weighOutAt,
      offlineCreatedAt: ticket.offlineCreatedAt,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid ticket payload";
    return NextResponse.json(
      { error: msg },
      { status: msg.startsWith("UNAUTHORIZED") ? 401 : 400 }
    );
  }
}
