import { NextResponse } from "next/server";
import {
  addFinancialEntryServer,
  erpStore,
  updateRoyaltyStatusServer,
} from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({
    customers: erpStore.customers,
    financialLedger: erpStore.financialLedger,
    mompRoyalties: erpStore.mompRoyalties,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (body.actorRole as UserRole) || "FINANCE_OFFICER";
    const entry = addFinancialEntryServer(body.entry, actorRole);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Finance entry failed" },
      { status: 403 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (body.actorRole as UserRole) || "FINANCE_OFFICER";
    const royalty = updateRoyaltyStatusServer(
      body.royaltyId,
      body.status,
      body.actorName || "Finance Officer",
      actorRole
    );
    return NextResponse.json({ royalty });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Royalty update failed" },
      { status: 403 }
    );
  }
}
