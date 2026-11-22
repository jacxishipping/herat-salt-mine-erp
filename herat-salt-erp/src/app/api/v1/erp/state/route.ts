import { NextResponse } from "next/server";
import { erpStore } from "@/lib/server-store";

export async function GET() {
  return NextResponse.json(erpStore);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  if (typeof body.usdToAfn === "number" && body.usdToAfn > 0) {
    erpStore.usdToAfn = body.usdToAfn;
  }
  return NextResponse.json({ usdToAfn: erpStore.usdToAfn });
}
