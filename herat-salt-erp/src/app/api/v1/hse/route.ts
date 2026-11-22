import { NextResponse } from "next/server";
import { addHseIncidentServer, erpStore } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({
    payrollRecords: erpStore.payrollRecords,
    hseIncidents: erpStore.hseIncidents,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (body.actorRole as UserRole) || "HSE_COMPLIANCE_OFFICER";
    const incident = addHseIncidentServer(body.incident, actorRole);
    return NextResponse.json({ incident }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "HSE incident failed" },
      { status: 403 }
    );
  }
}
