import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import { erpStore, logFleetMaintenanceServer } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({ fleetAssets: erpStore.fleetAssets });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "SITE_OPS_MANAGER",
      body.actorName || "Site Ops Manager"
    );
    const asset = logFleetMaintenanceServer(
      body.assetId,
      body.action,
      Number(body.downtimeDeltaHrs || 0),
      body.note || "",
      actor.actorName,
      actor.actorRole
    );
    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fleet update failed" },
      { status: 403 }
    );
  }
}
