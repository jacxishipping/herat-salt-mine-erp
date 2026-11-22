import crypto from "crypto";
import { UserRole } from "@/types/erp";

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const DEFAULT_SECRET = "herat-salt-erp-dev-secret-change-in-prod";

function getSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

export function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  ttlSeconds = 60 * 60 * 12
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = base64UrlEncode(
    crypto
      .createHmac("sha256", getSecret())
      .update(`${header}.${body}`)
      .digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");
  const [header, body, sig] = parts;

  const expectedSig = base64UrlEncode(
    crypto
      .createHmac("sha256", getSecret())
      .update(`${header}.${body}`)
      .digest()
  );

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid JWT signature");
  }

  const parsed = JSON.parse(base64UrlDecode(body)) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) {
    throw new Error("JWT expired");
  }
  return parsed;
}
