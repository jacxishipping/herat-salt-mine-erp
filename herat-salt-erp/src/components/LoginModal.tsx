"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, X } from "lucide-react";
import { UserRole } from "@/types/erp";

interface LoginModalProps {
  onSuccess: (auth: {
    token: string;
    fullName: string;
    role: UserRole;
    email: string;
  }) => void;
  onClose: () => void;
}

const QUICK_ACCOUNTS = [
  { email: "owner@heratsalt.af", label: "Mine Owner / MD" },
  { email: "ops@heratsalt.af", label: "Site Ops Manager" },
  { email: "kanta@heratsalt.af", label: "Weighbridge Clerk" },
  { email: "warehouse@heratsalt.af", label: "Warehouse Officer" },
  { email: "finance@heratsalt.af", label: "Finance Officer" },
  { email: "hse@heratsalt.af", label: "HSE & Compliance" },
];

export function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("owner@heratsalt.af");
  const [password, setPassword] = useState("herat2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onSuccess({
        token: data.token,
        fullName: data.user.fullName,
        role: data.user.role,
        email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="surface modal-card w-full max-w-md p-5 space-y-4">
        <div
          className="flex items-center justify-between pb-3"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold">
              JWT Operator Sign-In (RBAC)
            </span>
          </div>
          <button onClick={onClose} className="chip">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submitLogin} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Operator Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field w-full mono"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field w-full mono"
            />
          </label>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {loading ? "Authenticating..." : "Sign In & Issue JWT"}
          </button>
        </form>

        <div
          className="pt-3 space-y-2"
          style={{ borderTop: "1px solid var(--border-hair)" }}
        >
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Quick Select Herat Mine Account:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setEmail(acc.email)}
                className={`chip text-[11px] ${
                  email === acc.email ? "active" : ""
                }`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
