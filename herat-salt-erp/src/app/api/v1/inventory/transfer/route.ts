import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import { addInventoryTransferServer, erpStore } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({ inventoryTransfers: erpStore.inventoryTransfers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "WAREHOUSE_OFFICER",
      body.actorName || "Warehouse Officer"
    );
    const transfer = addInventoryTransferServer(
      { ...body.transfer, recordedBy: actor.actorName },
      actor.actorRole
    );
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transfer failed" },
      { status: 403 }
    );
  }
}
