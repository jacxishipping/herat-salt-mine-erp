import { NextResponse } from "next/server";
import { checkPostgresHealth } from "@/lib/db";

export async function GET() {
  const db = await checkPostgresHealth();
  return NextResponse.json({
    status: "OK",
    service: "herat-salt-erp",
    database: db,
    timestamp: new Date().toISOString(),
  });
}
