import { verifyJwt } from "@/lib/auth";
import { UserRole } from "@/types/erp";

export interface ResolvedActor {
  actorRole: UserRole;
  actorName: string;
  authenticated: boolean;
}

/**
 * Extracts and verifies JWT Bearer token when present.
 * In strict mode (REQUIRE_JWT=true), missing/invalid tokens throw 401.
 * In demo mode, falls back to body.actorRole while validating any provided JWT.
 */
export function resolveActorFromRequest(
  request: Request,
  fallbackRole: UserRole = "WEIGHBRIDGE_CLERK",
  fallbackName = "Operator"
): ResolvedActor {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = verifyJwt(token);
    return {
      actorRole: payload.role,
      actorName: payload.fullName,
      authenticated: true,
    };
  }

  if (process.env.REQUIRE_JWT === "true") {
    throw new Error("UNAUTHORIZED: Valid Bearer JWT required.");
  }

  return {
    actorRole: fallbackRole,
    actorName: fallbackName,
    authenticated: false,
  };
}
