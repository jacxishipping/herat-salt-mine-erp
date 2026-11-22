import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import {
  addAttendanceServer,
  addPpeIssuanceServer,
  erpStore,
} from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({
    attendanceRecords: erpStore.attendanceRecords,
    ppeIssuances: erpStore.ppeIssuances,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "HSE_COMPLIANCE_OFFICER",
      body.actorName || "HSE Officer"
    );
    if (body.ppe) {
      const ppe = addPpeIssuanceServer(
        { ...body.ppe, inspector: actor.actorName },
        actor.actorRole
      );
      return NextResponse.json({ ppe }, { status: 201 });
    }
    const attendance = addAttendanceServer(body.attendance, actor.actorRole);
    return NextResponse.json({ attendance }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Attendance/PPE failed" },
      { status: 403 }
    );
  }
}
