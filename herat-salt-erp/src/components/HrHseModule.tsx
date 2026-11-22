"use client";

import React, { useState } from "react";
import { HardHat, Plus, ShieldAlert, Users } from "lucide-react";
import {
  AttendanceRecord,
  CurrencyCode,
  EmployeePayrollRecord,
  HseIncident,
  MineZone,
  PpeIssuance,
  UserRole,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { Phase2Dict } from "@/lib/i18n-phase2";
import { formatCurrency } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface HrHseModuleProps {
  t: TranslationDict;
  t2: Phase2Dict;
  currency: CurrencyCode;
  usdToAfn: number;
  role: UserRole;
  zones: MineZone[];
  payrollRecords: EmployeePayrollRecord[];
  attendanceRecords?: AttendanceRecord[];
  ppeIssuances?: PpeIssuance[];
  hseIncidents: HseIncident[];
  onCreateIncident: (
    incident: Omit<HseIncident, "id" | "reportedAt">
  ) => Promise<void>;
  onCheckInAttendance?: (
    rec: Omit<AttendanceRecord, "id" | "syncState">
  ) => Promise<void>;
  onIssuePpe?: (rec: Omit<PpeIssuance, "id" | "inspector">) => Promise<void>;
}

export function HrHseModule({
  t,
  t2,
  currency,
  usdToAfn,
  role,
  zones,
  payrollRecords,
  attendanceRecords = [],
  ppeIssuances = [],
  hseIncidents,
  onCreateIncident,
  onCheckInAttendance,
  onIssuePpe,
}: HrHseModuleProps) {
  const perms = ROLE_PERMISSIONS[role];
  const [showHseForm, setShowHseForm] = useState(false);

  const [zoneCode, setZoneCode] = useState(zones[0]?.code || "GHR-PIT-01");
  const [incidentType, setIncidentType] =
    useState<HseIncident["incidentType"]>("DUST_EXCEEDANCE");
  const [severity, setSeverity] = useState<HseIncident["severity"]>("LOW");
  const [description, setDescription] = useState("");
  const [ppeCompliant, setPpeCompliant] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateIncident({
      zoneCode,
      incidentType,
      severity,
      description: description.trim(),
      ppeCompliant,
      reportedBy: t.roles[role],
    });
    setShowHseForm(false);
    setDescription("");
  }

  return (
    <div className="space-y-6 anim-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t2.hrHse.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t2.hrHse.subtitle}
          </p>
        </div>
        {perms.canLogHse && (
          <button
            onClick={() => setShowHseForm((v) => !v)}
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t2.hrHse.logIncidentBtn}
          </button>
        )}
      </div>

      {/* Log HSE Form */}
      {showHseForm && perms.canLogHse && (
        <form onSubmit={handleSubmit} className="surface p-5 space-y-4 anim-enter">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.hrHse.zone}
              </span>
              <select
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value)}
                className="field w-full"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.code}>
                    {z.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.hrHse.incidentType}
              </span>
              <select
                value={incidentType}
                onChange={(e) =>
                  setIncidentType(e.target.value as HseIncident["incidentType"])
                }
                className="field w-full"
              >
                <option value="DUST_EXCEEDANCE">Dust / PM10 Check</option>
                <option value="NEAR_MISS">Near Miss</option>
                <option value="EQUIPMENT_HAZARD">Equipment Hazard</option>
                <option value="INJURY">Injury</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.hrHse.severity}
              </span>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as HseIncident["severity"])
                }
                className="field w-full"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {t2.hrHse.description}
            </span>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field w-full"
              placeholder="Describe safety inspection, PPE check, or corrective action..."
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPpeCompliant((v) => !v)}
              className={`toggle ${ppeCompliant ? "on" : ""}`}
              aria-label={t2.hrHse.ppeCompliant}
            />
            <span className="text-xs">{t2.hrHse.ppeCompliant}</span>
          </div>

          <div
            className="flex justify-end gap-2 pt-3"
            style={{ borderTop: "1px solid var(--border-hair)" }}
          >
            <button
              type="button"
              onClick={() => setShowHseForm(false)}
              className="btn btn-ghost"
            >
              {t.weighbridge.close}
            </button>
            <button type="submit" className="btn btn-primary">
              {t2.hrHse.submitIncident}
            </button>
          </div>
        </form>
      )}

      {/* Workforce Payroll Summary */}
      <div className="surface overflow-hidden">
        <div
          className="px-4 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{
            borderBottom: "1px solid var(--border-hair)",
            color: "var(--text-secondary)",
          }}
        >
          <Users className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t2.hrHse.payrollTitle}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-hair)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-4 py-3 text-start font-medium">{t2.hrHse.employee}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.hrHse.roleTitle}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.hrHse.daysWorked}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.hrHse.baseWage}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.hrHse.tonBonus}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.hrHse.deductions}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.hrHse.netPayable}</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.map((emp) => (
                <tr
                  key={emp.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid var(--border-hair)" }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{emp.fullName}</div>
                    <div className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {emp.employeeCode} · {emp.tazkiraNo}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {emp.roleTitle}
                  </td>
                  <td className="px-4 py-3 text-end mono">{emp.daysWorked}</td>
                  <td className="px-4 py-3 text-end mono">
                    {formatCurrency(emp.dailyWageAfn, currency, usdToAfn)}
                  </td>
                  <td className="px-4 py-3 text-end mono text-emerald-400">
                    +{formatCurrency(emp.tonBonusAfn + emp.overtimeAfn, currency, usdToAfn)}
                  </td>
                  <td className="px-4 py-3 text-end mono text-amber-400">
                    -{formatCurrency(emp.advancesDeductionAfn, currency, usdToAfn)}
                  </td>
                  <td className="px-4 py-3 text-end mono font-semibold">
                    {perms.canViewFinancials || perms.canManagePayroll
                      ? formatCurrency(emp.netPayableAfn, currency, usdToAfn)
                      : "RBAC Restricted"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HSE Incidents & Safety Timeline */}
      <div className="surface overflow-hidden">
        <div
          className="px-4 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{
            borderBottom: "1px solid var(--border-hair)",
            color: "var(--text-secondary)",
          }}
        >
          <HardHat className="h-3.5 w-3.5 text-amber-400" />
          <span>{t2.hrHse.hseTitle}</span>
        </div>
        <div>
          {hseIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              style={{ borderBottom: "1px solid var(--border-hair)" }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="chip active mono text-[11px]">{inc.zoneCode}</span>
                  <span className="text-xs font-semibold">{inc.incidentType}</span>
                  <span
                    className={`text-[11px] font-medium ${
                      inc.severity === "HIGH" || inc.severity === "CRITICAL"
                        ? "text-rose-400"
                        : inc.severity === "MEDIUM"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    ● {inc.severity}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {inc.description}
                </p>
              </div>
              <div
                className="text-xs flex items-center gap-2 shrink-0 mono"
                style={{ color: "var(--text-muted)" }}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  PPE: {inc.ppeCompliant ? "OK" : "Alert"} ·{" "}
                  {new Date(inc.reportedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Biometric / Tazkira RFID Attendance & PPE Issuance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Biometric / Tazkira RFID Shift Attendance (Offline-Ready)
            </span>
            {onCheckInAttendance && payrollRecords[0] && (
              <button
                onClick={() =>
                  onCheckInAttendance({
                    clientSyncId: crypto.randomUUID(),
                    employeeCode: payrollRecords[0].employeeCode,
                    fullName: payrollRecords[0].fullName,
                    shiftCode: "SHIFT_A_DAY",
                    method: "BIOMETRIC_FINGERPRINT",
                    checkInAt: new Date().toISOString(),
                    status: "PRESENT",
                  })
                }
                className="btn py-1 px-2.5 text-[11px]"
              >
                + Log Biometric Check-In
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-hair)" }}>
            {attendanceRecords.map((a) => (
              <div key={a.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{a.fullName}</span>
                  <span className="block mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                    {a.employeeCode} · {a.method}
                  </span>
                </div>
                <span className={a.syncState === "SYNCED" ? "text-emerald-400" : "text-amber-400"}>
                  ● {a.status} ({a.syncState})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              PPE Issuance &amp; Dust Compliance Log
            </span>
            {perms.canLogHse && onIssuePpe && payrollRecords[1] && (
              <button
                onClick={() =>
                  onIssuePpe({
                    employeeCode: payrollRecords[1].employeeCode,
                    fullName: payrollRecords[1].fullName,
                    items: "N95 Respirator Kit, Safety Helmet, Reflective Vest",
                    issuedDate: new Date().toISOString().slice(0, 10),
                  })
                }
                className="btn py-1 px-2.5 text-[11px]"
              >
                + Issue PPE Kit
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-hair)" }}>
            {ppeIssuances.map((p) => (
              <div key={p.id} className="py-2 text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-medium">{p.fullName}</span>
                  <span className="mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                    {p.issuedDate}
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>{p.items}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
