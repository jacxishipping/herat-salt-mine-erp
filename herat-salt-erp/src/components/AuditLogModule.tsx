"use client";

import React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { AuditLogEntry, UserRole } from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface AuditLogModuleProps {
  t: TranslationDict;
  role: UserRole;
  logs: AuditLogEntry[];
}

export function AuditLogModule({ t, role, logs }: AuditLogModuleProps) {
  const perms = ROLE_PERMISSIONS[role];

  if (!perms.canViewAuditLogs) {
    return (
      <div className="surface p-10 text-center space-y-3 anim-enter">
        <div
          className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <Lock className="h-5 w-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold">{t.audit.title}</h3>
        <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          {t.audit.restricted}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 anim-enter">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t.audit.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t.audit.subtitle}
          </p>
        </div>
      </div>

      {/* Activity Timeline Feed */}
      <div className="surface p-5 space-y-4">
        {logs.map((entry, idx) => (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 ${
                  entry.action === "VOID_APPROVE"
                    ? "bg-rose-400"
                    : entry.action === "VOID_REQUEST"
                    ? "bg-amber-400"
                    : entry.action === "SYNC_RECONCILE"
                    ? "bg-indigo-400"
                    : "bg-emerald-400"
                }`}
              />
              {idx < logs.length - 1 && (
                <span
                  className="w-px flex-1 mt-1"
                  style={{ background: "var(--border-hair)" }}
                />
              )}
            </div>
            <div className="pb-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="chip active mono text-[10.5px]">
                  {entry.action}
                </span>
                <span className="mono font-semibold">{entry.recordRef}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  — {entry.summary}
                </span>
              </div>
              <div
                className="text-[11px] mono mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {new Date(entry.createdAt).toLocaleString()} · {entry.tableName} ·{" "}
                {entry.actorName} ({t.roles[entry.actorRole]})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
