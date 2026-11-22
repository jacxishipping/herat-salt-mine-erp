import { NextResponse } from "next/server";
import { voidWeighbridgeTicketServer } from "@/lib/server-store";
import { UserRole } from "@/types/erp";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const ticket = voidWeighbridgeTicketServer(
      id,
      body.action as "REQUEST" | "APPROVE",
      body.reason || "",
      body.actorName || "Supervisor",
      (body.actorRole as UserRole) || "WEIGHBRIDGE_CLERK"
    );
    return NextResponse.json({ ticket });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Void action failed" },
      { status: 403 }
    );
  }
}
