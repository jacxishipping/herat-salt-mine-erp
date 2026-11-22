import { NextResponse } from "next/server";
import { addExtractionLogServer, erpStore } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({ extractionLogs: erpStore.extractionLogs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (body.actorRole as UserRole) || "SITE_OPS_MANAGER";
    const log = addExtractionLogServer(body.log, actorRole);
    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid extraction log" },
      { status: 400 }
    );
  }
}
