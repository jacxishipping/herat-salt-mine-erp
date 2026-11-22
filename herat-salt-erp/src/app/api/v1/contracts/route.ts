import { NextResponse } from "next/server";
import { resolveActorFromRequest } from "@/lib/api-auth";
import {
  addContractServer,
  erpStore,
  recordInvoicePaymentServer,
} from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function GET() {
  return NextResponse.json({
    contracts: erpStore.contracts,
    invoices: erpStore.invoices,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "FINANCE_OFFICER"
    );
    const contract = addContractServer(body.contract, actor.actorRole);
    return NextResponse.json({ contract }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Contract creation failed" },
      { status: 403 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const actor = resolveActorFromRequest(
      request,
      (body.actorRole as UserRole) || "FINANCE_OFFICER",
      body.actorName || "Finance Officer"
    );
    const invoice = recordInvoicePaymentServer(
      body.invoiceId,
      Number(body.paymentAfn || 0),
      actor.actorName,
      actor.actorRole
    );
    return NextResponse.json({ invoice });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invoice payment failed" },
      { status: 403 }
    );
  }
}
