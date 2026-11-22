import { NextResponse } from "next/server";
import { signJwt } from "@/lib/auth";
import { isPostgresConfigured, verifyUserPasswordPg } from "@/lib/db";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { UserRole } from "@/types/erp";

const DEMO_USERS: Record<
  string,
  { id: string; fullName: string; role: UserRole; preferredLang: "en" | "fa" | "ps" }
> = {
  "owner@heratsalt.af": { id: "usr-01", fullName: "Haji Abdul Rahim (MD)", role: "MINE_OWNER", preferredLang: "fa" },
  "ops@heratsalt.af": { id: "usr-02", fullName: "Eng. Ahmadullah Noori", role: "SITE_OPS_MANAGER", preferredLang: "fa" },
  "kanta@heratsalt.af": { id: "usr-03", fullName: "Fardin Ahmadi", role: "WEIGHBRIDGE_CLERK", preferredLang: "fa" },
  "warehouse@heratsalt.af": { id: "usr-04", fullName: "Eng. Jawid Sadat", role: "WAREHOUSE_OFFICER", preferredLang: "fa" },
  "finance@heratsalt.af": { id: "usr-05", fullName: "Mirwais Sultani", role: "FINANCE_OFFICER", preferredLang: "en" },
  "hse@heratsalt.af": { id: "usr-06", fullName: "Dr. Zabiullah Rahimi", role: "HSE_COMPLIANCE_OFFICER", preferredLang: "ps" },
};

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  let user = isPostgresConfigured()
    ? await verifyUserPasswordPg(email, password)
    : null;

  if (!user && !isPostgresConfigured()) {
    user = DEMO_USERS[email] || null;
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signJwt({
    sub: user.id,
    email,
    fullName: user.fullName,
    role: user.role,
  });

  return NextResponse.json({
    token,
    user,
    permissions: ROLE_PERMISSIONS[user.role],
  });
}
