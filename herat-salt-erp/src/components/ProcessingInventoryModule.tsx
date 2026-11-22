"use client";

import React, { useState } from "react";
import { CheckCircle2, Factory, Package, Plus, Warehouse as WarehouseIcon } from "lucide-react";
import {
  InventoryTransfer,
  LangCode,
  ProcessingBatch,
  SaltGrade,
  UserRole,
  Warehouse,
  WarehouseStockItem,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { Phase2Dict } from "@/lib/i18n-phase2";
import { formatNumber } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface ProcessingInventoryModuleProps {
  t: TranslationDict;
  t2: Phase2Dict;
  lang: LangCode;
  role: UserRole;
  warehouses: Warehouse[];
  warehouseStock: WarehouseStockItem[];
  inventoryTransfers?: InventoryTransfer[];
  processingBatches: ProcessingBatch[];
  onCreateBatch: (
    batch: Omit<ProcessingBatch, "id" | "batchCode" | "shrinkageMt" | "processedAt">
  ) => Promise<void>;
  onCreateTransfer?: (
    transfer: Omit<InventoryTransfer, "id" | "transferCode" | "createdAt" | "recordedBy">
  ) => Promise<void>;
}

export function ProcessingInventoryModule({
  t,
  t2,
  lang,
  role,
  warehouses,
  warehouseStock,
  inventoryTransfers = [],
  processingBatches,
  onCreateBatch,
  onCreateTransfer,
}: ProcessingInventoryModuleProps) {
  const perms = ROLE_PERMISSIONS[role];
  const [showForm, setShowForm] = useState(false);

  const [intakeTonnageMt, setIntakeTonnageMt] = useState(100);
  const [outputTonnageMt, setOutputTonnageMt] = useState(88);
  const [saltGrade, setSaltGrade] = useState<SaltGrade>("REFINED_IODIZED_25KG");
  const [iodinePpm, setIodinePpm] = useState(40);
  const [moistureAfterPct, setMoistureAfterPct] = useState(0.5);
  const [warehouseId, setWarehouseId] = useState(
    warehouses[1]?.id || "wh-hrt-depot"
  );

  const [trfType, setTrfType] = useState<"TRANSFER" | "SHRINKAGE_ADJUSTMENT">("TRANSFER");
  const [trfFrom, setTrfFrom] = useState("WH-GHR-SITE");
  const [trfTo, setTrfTo] = useState("WH-HRT-CITY");
  const [trfGrade, setTrfGrade] = useState<SaltGrade>("REFINED_IODIZED_25KG");
  const [trfQty, setTrfQty] = useState(25);
  const [trfReason, setTrfReason] = useState("Dispatch staging transfer");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const wh = warehouses.find((w) => w.id === warehouseId) || warehouses[0];
    await onCreateBatch({
      intakeTonnageMt,
      outputTonnageMt,
      saltGrade,
      iodinePpm,
      moistureAfterPct,
      warehouseId: wh.id,
      warehouseCode: wh.code,
      supervisorName: t.roles[role],
    });
    setShowForm(false);
  }

  return (
    <div className="space-y-6 anim-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t2.processing.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t2.processing.subtitle}
          </p>
        </div>
        {perms.canManageProcessing && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t2.processing.newBatchBtn}
          </button>
        )}
      </div>

      {/* New Processing Batch Form */}
      {showForm && perms.canManageProcessing && (
        <form onSubmit={handleSubmit} className="surface p-5 space-y-4 anim-enter">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t.weighbridge.saltGrade}
              </span>
              <select
                value={saltGrade}
                onChange={(e) => setSaltGrade(e.target.value as SaltGrade)}
                className="field w-full"
              >
                {Object.entries(t.grades).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.processing.warehouse}
              </span>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="field w-full"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {lang === "fa" ? w.nameFa : lang === "ps" ? w.namePs : w.nameEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.processing.intakeMt}
              </span>
              <input
                type="number"
                step="0.5"
                min={1}
                required
                value={intakeTonnageMt}
                onChange={(e) => setIntakeTonnageMt(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.processing.outputMt}
              </span>
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={intakeTonnageMt}
                required
                value={outputTonnageMt}
                onChange={(e) => setOutputTonnageMt(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.processing.iodinePpm}
              </span>
              <input
                type="number"
                step="0.5"
                min={0}
                required
                value={iodinePpm}
                onChange={(e) => setIodinePpm(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.processing.moistureAfter}
              </span>
              <input
                type="number"
                step="0.1"
                min={0}
                required
                value={moistureAfterPct}
                onChange={(e) => setMoistureAfterPct(Number(e.target.value))}
                className="field w-full mono"
              />
            </label>
          </div>

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
              {t2.processing.submitBatch}
            </button>
          </div>
        </form>
      )}

      {/* Warehouse Stockpile Cards */}
      <div className="space-y-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <WarehouseIcon className="h-3.5 w-3.5 text-indigo-400" />
          {t2.processing.stockTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouses.map((wh) => {
            const items = warehouseStock.filter((s) => s.warehouseId === wh.id);
            const totalMt = items.reduce((a, b) => a + b.quantityMt, 0);
            const pct = Math.min(100, Math.round((totalMt / wh.capacityMt) * 100));
            const name =
              lang === "fa" ? wh.nameFa : lang === "ps" ? wh.namePs : wh.nameEn;
            return (
              <div key={wh.id} className="surface surface-lift p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="chip active mono text-[11px]">{wh.code}</span>
                  <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {formatNumber(totalMt, 1)} / {formatNumber(wh.capacityMt, 0)} {t.common.mt}
                  </span>
                </div>
                <p className="text-sm font-semibold">{name}</p>
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
                  className="space-y-1.5 pt-2"
                  style={{ borderTop: "1px solid var(--border-hair)" }}
                >
                  {items.map((item) => (
                    <div
                      key={`${item.warehouseId}-${item.saltGrade}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className="truncate max-w-[180px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {t.grades[item.saltGrade]}
                      </span>
                      <span className="mono font-semibold">
                        {formatNumber(item.quantityMt, 1)} {t.common.mt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Batches Table */}
      <div className="surface overflow-hidden">
        <div
          className="px-4 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{
            borderBottom: "1px solid var(--border-hair)",
            color: "var(--text-secondary)",
          }}
        >
          <Factory className="h-3.5 w-3.5 text-indigo-400" />
          <span>Processing Plant Batches</span>
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
                <th className="px-4 py-3 text-start font-medium">{t2.processing.batchCode}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.saltGrade}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.processing.warehouse}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.processing.intakeMt}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.processing.outputMt}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.processing.shrinkageMt}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.processing.iodinePpm}</th>
              </tr>
            </thead>
            <tbody>
              {processingBatches.map((b) => {
                const foodOk = b.iodinePpm >= 30 && b.iodinePpm <= 60;
                return (
                  <tr
                    key={b.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid var(--border-hair)" }}
                  >
                    <td className="px-4 py-3 mono font-semibold">{b.batchCode}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-indigo-400" />
                        {t.grades[b.saltGrade]}
                      </span>
                    </td>
                    <td className="px-4 py-3 mono">{b.warehouseCode}</td>
                    <td className="px-4 py-3 text-end mono">
                      {formatNumber(b.intakeTonnageMt, 1)}
                    </td>
                    <td className="px-4 py-3 text-end mono font-semibold">
                      {formatNumber(b.outputTonnageMt, 1)}
                    </td>
                    <td className="px-4 py-3 text-end mono text-amber-400">
                      -{formatNumber(b.shrinkageMt, 1)}
                    </td>
                    <td className="px-4 py-3">
                      {foodOk ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {b.iodinePpm} ppm ({t2.processing.iodineCompliant})
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          {b.iodinePpm} ppm ({t2.processing.iodineWarning})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Inter-Warehouse Transfers & Shrinkage Adjustments */}
      <div className="surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Inter-Warehouse Stock Transfers &amp; Moisture Shrinkage
          </h3>
        </div>
        {perms.canManageInventory && onCreateTransfer && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateTransfer({
                type: trfType,
                fromWarehouseCode: trfFrom,
                toWarehouseCode: trfType === "TRANSFER" ? trfTo : undefined,
                saltGrade: trfGrade,
                quantityMt: trfQty,
                reason: trfReason,
              });
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs"
          >
            <select
              value={trfType}
              onChange={(e) =>
                setTrfType(e.target.value as "TRANSFER" | "SHRINKAGE_ADJUSTMENT")
              }
              className="field"
            >
              <option value="TRANSFER">Warehouse Transfer</option>
              <option value="SHRINKAGE_ADJUSTMENT">Shrinkage / Moisture Loss</option>
            </select>
            <select
              value={trfFrom}
              onChange={(e) => setTrfFrom(e.target.value)}
              className="field mono"
            >
              {warehouses.map((w) => (
                <option key={w.code} value={w.code}>
                  From: {w.code}
                </option>
              ))}
            </select>
            {trfType === "TRANSFER" ? (
              <select
                value={trfTo}
                onChange={(e) => setTrfTo(e.target.value)}
                className="field mono"
              >
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    To: {w.code}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={trfReason}
                onChange={(e) => setTrfReason(e.target.value)}
                className="field"
                placeholder="Shrinkage audit reason"
              />
            )}
            <select
              value={trfGrade}
              onChange={(e) => setTrfGrade(e.target.value as SaltGrade)}
              className="field"
            >
              {Object.entries(t.grades).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.5"
              min={0.5}
              value={trfQty}
              onChange={(e) => setTrfQty(Number(e.target.value))}
              className="field mono"
              placeholder="MT"
            />
            <button type="submit" className="btn btn-primary">
              Record
            </button>
          </form>
        )}

        <div className="divide-y" style={{ borderColor: "var(--border-hair)" }}>
          {inventoryTransfers.map((trf) => (
            <div
              key={trf.id}
              className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="chip active mono text-[10.5px] me-2">
                  {trf.transferCode}
                </span>
                <span className="font-medium">
                  {trf.type === "TRANSFER"
                    ? `${trf.fromWarehouseCode} → ${trf.toWarehouseCode}`
                    : `Shrinkage @ ${trf.fromWarehouseCode}`}
                </span>
                <span className="ms-2" style={{ color: "var(--text-muted)" }}>
                  ({t.grades[trf.saltGrade]}) · {trf.reason}
                </span>
              </div>
              <span className="mono font-semibold text-amber-400">
                {trf.type === "TRANSFER" ? "" : "-"}
                {trf.quantityMt} MT
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
