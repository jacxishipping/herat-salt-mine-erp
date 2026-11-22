import { NextResponse } from "next/server";
import { addProcessingBatchServer, erpStore } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({
    warehouses: erpStore.warehouses,
    warehouseStock: erpStore.warehouseStock,
    processingBatches: erpStore.processingBatches,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (body.actorRole as UserRole) || "WAREHOUSE_OFFICER";
    const batch = addProcessingBatchServer(body.batch, actorRole);
    return NextResponse.json({ batch }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing batch failed" },
      { status: 400 }
    );
  }
}
