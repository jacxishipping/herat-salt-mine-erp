"use client";

import React, { useState } from "react";
import { Fuel, Mountain, Plus } from "lucide-react";
import {
  ExtractionLog,
  ExtractionMethod,
  FleetAsset,
  MineZone,
  UserRole,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface ExtractionModuleProps {
  t: TranslationDict;
  lang: "en" | "fa" | "ps";
  role: UserRole;
  zones: MineZone[];
  fleetAssets?: FleetAsset[];
  extractionLogs: ExtractionLog[];
  onCreateExtraction: (
    log: Omit<ExtractionLog, "id" | "syncedAt" | "syncState">
  ) => Promise<void>;
  onFleetMaintenance?: (
    assetId: string,
    action: "COMPLETE_SERVICE" | "LOG_BREAKDOWN",
    downtimeDeltaHrs: number,
    note: string
  ) => Promise<void>;
}

const FLEET_ASSETS = [
  "EXC-CAT336-02 (Excavator)",
  "LDR-KOM950-01 (Wheel Loader)",
  "TRK-HINO-05 (Dump Truck)",
  "CRUSH-METSO-01 (Primary Crusher)",
  "GEN-CAT500-01 (Site Generator)",
];

export function ExtractionModule({
  t,
  lang,
  role,
  zones,
  fleetAssets = [],
  extractionLogs,
  onCreateExtraction,
  onFleetMaintenance,
}: ExtractionModuleProps) {
  const perms = ROLE_PERMISSIONS[role];
  const [showForm, setShowForm] = useState(false);

  const [zoneId, setZoneId] = useState(zones[0]?.id || "zone-ghr-01");
  const [shiftCode, setShiftCode] = useState<"SHIFT_A_DAY" | "SHIFT_B_NIGHT">(
    "SHIFT_A_DAY"
  );
  const [method, setMethod] = useState<ExtractionMethod>(
    "ROCK_BLASTING_CUTTING"
  );
  const [rawTonnageMt, setRawTonnageMt] = useState<number>(45.5);
  const [crewLeadName, setCrewLeadName] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("EXC-CAT336-02");
  const [fuelUsedL, setFuelUsedL] = useState<number>(110);
  const [engineHoursDelta, setEngineHoursDelta] = useState<number>(4.5);
  const [moisturePct, setMoisturePct] = useState<number>(2.4);
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedZone = zones.find((z) => z.id === zoneId) || zones[0];
    await onCreateExtraction({
      clientSyncId: crypto.randomUUID(),
      zoneId: selectedZone.id,
      zoneCode: selectedZone.code,
      shiftCode,
      logDate: new Date().toISOString().slice(0, 10),
      method,
      rawTonnageMt,
      crewLeadName: crewLeadName.trim(),
      equipmentCode: equipmentCode.split(" ")[0],
      fuelUsedL,
      engineHoursDelta,
      moisturePct,
      notes: notes.trim() || undefined,
      offlineCreatedAt: new Date().toISOString(),
    });
    setShowForm(false);
    setCrewLeadName("");
    setNotes("");
  }

  return (
    <div className="space-y-5 anim-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t.extraction.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t.extraction.subtitle}
          </p>
        </div>
        {perms.canCreateExtractionLog && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.extraction.logExtractionBtn}
          </button>
        )}
      </div>

      {/* Zone Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones.map((z) => {
          const pct = Math.min(
            100,
            Math.round((z.todayExtractedMt / z.dailyTargetMt) * 100)
          );
          const name =
            lang === "fa" ? z.nameFa : lang === "ps" ? z.namePs : z.nameEn;
          return (
            <div key={z.id} className="surface surface-lift p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="chip active mono text-[11px]">{z.code}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {z.region} · {z.zoneType}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{name}</h3>
              <div className="flex justify-between text-xs tnum" style={{ color: "var(--text-secondary)" }}>
                <span>
                  {t.extraction.targetProgress}:{" "}
                  <strong className="mono" style={{ color: "var(--text-primary)" }}>
                    {formatNumber(z.todayExtractedMt, 1)} / {z.dailyTargetMt} {t.common.mt}
                  </strong>
                </span>
                <span className="mono text-indigo-400 font-semibold">{pct}%</span>
              </div>
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
              <div
                className="flex justify-between text-[11px] mono pt-1"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  {t.extraction.reserves}: {formatNumber(z.estimatedReservesMt, 0)}{" "}
                  {t.common.mt}
                </span>
                <span>{z.gpsCoords}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Extraction Form */}
      {showForm && perms.canCreateExtractionLog && (
        <form onSubmit={handleSubmit} className="surface p-5 space-y-4 anim-enter">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.zone}
              </span>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="field w-full"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.code} — {lang === "fa" ? z.nameFa : lang === "ps" ? z.namePs : z.nameEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.shift}
              </span>
              <select
                value={shiftCode}
                onChange={(e) =>
                  setShiftCode(e.target.value as "SHIFT_A_DAY" | "SHIFT_B_NIGHT")
                }
                className="field w-full"
              >
                <option value="SHIFT_A_DAY">{t.extraction.shiftDay}</option>
                <option value="SHIFT_B_NIGHT">{t.extraction.shiftNight}</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.method}
              </span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as ExtractionMethod)}
                className="field w-full"
              >
                {Object.entries(t.methods).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.rawTonnage}
              </span>
              <input
                type="number"
                step="0.1"
                required
                min={0.5}
                value={rawTonnageMt}
                onChange={(e) => setRawTonnageMt(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.crewLead}
              </span>
              <input
                required
                value={crewLeadName}
                onChange={(e) => setCrewLeadName(e.target.value)}
                className="field w-full"
                placeholder="e.g. Eng. Hamidullah"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.equipment}
              </span>
              <select
                value={equipmentCode}
                onChange={(e) => setEquipmentCode(e.target.value)}
                className="field w-full"
              >
                {FLEET_ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.fuelLiters}
              </span>
              <input
                type="number"
                required
                min={0}
                value={fuelUsedL}
                onChange={(e) => setFuelUsedL(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.extraction.engineHours} / {t.extraction.moisturePct}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={engineHoursDelta}
                  onChange={(e) => setEngineHoursDelta(Number(e.target.value))}
                  className="field w-full mono"
                />
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={moisturePct}
                  onChange={(e) => setMoisturePct(Number(e.target.value))}
                  className="field w-full mono"
                />
              </div>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {t.extraction.notes}
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field w-full"
              placeholder="Bench seam quality, dust check, or maintenance note..."
            />
          </label>

          <div
            className="flex justify-end gap-2 pt-3"
            style={{ borderTop: "1px solid var(--border-hair)" }}
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost"
            >
              {t.weighbridge.close}
            </button>
            <button type="submit" className="btn btn-primary">
              {t.extraction.submitLog}
            </button>
          </div>
        </form>
      )}

      {/* Extraction Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-hair)",
                  color: "var(--text-muted)",
                }}
              >
                <th className="px-4 py-3 text-start font-medium">{t.extraction.zone}</th>
                <th className="px-4 py-3 text-start font-medium">{t.extraction.shift}</th>
                <th className="px-4 py-3 text-start font-medium">{t.extraction.method}</th>
                <th className="px-4 py-3 text-start font-medium">{t.extraction.crewLead}</th>
                <th className="px-4 py-3 text-start font-medium">{t.extraction.equipment}</th>
                <th className="px-4 py-3 text-end font-medium">{t.extraction.rawTonnage}</th>
                <th className="px-4 py-3 text-end font-medium">{t.extraction.fuelLiters}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.status}</th>
              </tr>
            </thead>
            <tbody>
              {extractionLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid var(--border-hair)" }}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 mono font-medium">
                      <Mountain className="h-3.5 w-3.5 text-indigo-400" />
                      {log.zoneCode}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {log.shiftCode === "SHIFT_A_DAY"
                      ? t.extraction.shiftDay
                      : t.extraction.shiftNight}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {t.methods[log.method]}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.crewLeadName}</td>
                  <td className="px-4 py-3 mono" style={{ color: "var(--text-muted)" }}>
                    {log.equipmentCode} ({log.engineHoursDelta} {t.common.hours})
                  </td>
                  <td className="px-4 py-3 text-end mono font-semibold">
                    {formatNumber(log.rawTonnageMt, 1)} {t.common.mt}
                  </td>
                  <td className="px-4 py-3 text-end mono">
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <Fuel className="h-3 w-3" />
                      {log.fuelUsedL} {t.common.liters}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        log.syncState === "SYNCED"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      ●{" "}
                      {log.syncState === "SYNCED"
                        ? t.common.synced
                        : t.common.pending}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Fleet Preventive Maintenance & Breakdown Downtime */}
      {fleetAssets.length > 0 && (
        <div className="surface overflow-hidden">
          <div
            className="px-4 py-3 flex items-center justify-between text-xs font-semibold"
            style={{
              borderBottom: "1px solid var(--border-hair)",
              color: "var(--text-secondary)",
            }}
          >
            <span>Fleet Preventive Maintenance &amp; Breakdown Downtime</span>
            <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
              500-hr Service Intervals
            </span>
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
                  <th className="px-4 py-2.5 text-start font-medium">Asset</th>
                  <th className="px-4 py-2.5 text-end font-medium">Engine Hrs</th>
                  <th className="px-4 py-2.5 text-end font-medium">Next Service</th>
                  <th className="px-4 py-2.5 text-end font-medium">Downtime (Mo)</th>
                  <th className="px-4 py-2.5 text-start font-medium">Status</th>
                  <th className="px-4 py-2.5 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fleetAssets.map((f) => (
                  <tr
                    key={f.id}
                    style={{ borderBottom: "1px solid var(--border-hair)" }}
                  >
                    <td className="px-4 py-2.5">
                      <div className="mono font-medium">{f.assetCode}</div>
                      <div style={{ color: "var(--text-muted)" }}>{f.name}</div>
                    </td>
                    <td className="px-4 py-2.5 text-end mono">{f.engineHours}</td>
                    <td className="px-4 py-2.5 text-end mono">{f.nextServiceHours}</td>
                    <td className="px-4 py-2.5 text-end mono text-amber-400">
                      {f.downtimeHoursMonth} hrs
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          f.status === "OPERATIONAL"
                            ? "text-emerald-400"
                            : f.status === "SERVICE_DUE"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }
                      >
                        ● {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-end space-x-1.5">
                      {perms.canCreateExtractionLog && onFleetMaintenance && (
                        <>
                          <button
                            onClick={() =>
                              onFleetMaintenance(
                                f.id,
                                "COMPLETE_SERVICE",
                                0,
                                "Preventive 500-hr service completed"
                              )
                            }
                            className="btn py-1 px-2 text-[11px]"
                          >
                            Complete Service
                          </button>
                          <button
                            onClick={() =>
                              onFleetMaintenance(
                                f.id,
                                "LOG_BREAKDOWN",
                                2.5,
                                "Logged field breakdown (+2.5h)"
                              )
                            }
                            className="btn btn-danger py-1 px-2 text-[11px]"
                          >
                            +2.5h Breakdown
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
