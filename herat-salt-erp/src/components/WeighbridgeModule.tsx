"use client";

import React, { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  Printer,
  QrCode,
  Scale,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  CurrencyCode,
  DestinationType,
  LangCode,
  SaltGrade,
  TicketDirection,
  TicketStatus,
  UserRole,
  WeighbridgeTicket,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { printThermalWaybillPdf } from "@/lib/export-reports";
import { calculateSaltPriceQuote } from "@/lib/pricing-engine";

interface WeighbridgeModuleProps {
  t: TranslationDict;
  lang?: LangCode;
  currency: CurrencyCode;
  usdToAfn: number;
  role: UserRole;
  tickets: WeighbridgeTicket[];
  onCreateTicket: (
    ticket: Omit<
      WeighbridgeTicket,
      | "id"
      | "ticketNumber"
      | "netWeightKg"
      | "qrPayloadHash"
      | "syncedAt"
      | "syncState"
    >
  ) => Promise<void>;
  onVoidAction: (
    ticketId: string,
    action: "REQUEST" | "APPROVE",
    reason: string
  ) => Promise<void>;
}

export function WeighbridgeModule({
  t,
  lang = "en",
  currency,
  usdToAfn,
  role,
  tickets,
  onCreateTicket,
  onVoidAction,
}: WeighbridgeModuleProps) {
  const perms = ROLE_PERMISSIONS[role];
  const [showForm, setShowForm] = useState(false);
  const [selectedWaybill, setSelectedWaybill] =
    useState<WeighbridgeTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scaleStatus, setScaleStatus] = useState<string | null>(null);

  // Full DataTable search + chip filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");

  // Form State
  const [direction, setDirection] =
    useState<TicketDirection>("OUTBOUND_DISPATCH");
  const [truckPlate, setTruckPlate] = useState("HRT-62910");
  const [driverName, setDriverName] = useState("");
  const [driverTazkira, setDriverTazkira] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [saltGrade, setSaltGrade] = useState<SaltGrade>("REFINED_IODIZED_25KG");
  const [destinationType, setDestinationType] =
    useState<DestinationType>("ISLAM_QALA_EXPORT");
  const [destinationDetail, setDestinationDetail] = useState(
    "Islam Qala Border Customs Gate"
  );
  const [grossWeightKg, setGrossWeightKg] = useState<number>(38500);
  const [tareWeightKg, setTareWeightKg] = useState<number>(13500);
  const [unitPriceAfnPerMt, setUnitPriceAfnPerMt] = useState<number>(6800);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BANK_TRANSFER" | "HAWALA"
  >("HAWALA");
  const [hawalaRef, setHawalaRef] = useState("");

  async function captureLiveKantaScale() {
    try {
      const res = await fetch("http://127.0.0.1:4100/weight");
      if (!res.ok) throw new Error("Bridge offline");
      const data = await res.json();
      setGrossWeightKg(data.weightKg);
      setScaleStatus(`Locked ${data.weightKg} kg from ${data.scaleDeviceId} (${data.mode})`);
    } catch {
      const simWeight = 37800 + Math.floor(Math.random() * 1600);
      setGrossWeightKg(simWeight);
      setScaleStatus(`Locked ${simWeight} kg (RS-232 Simulated Bridge)`);
    }
  }

  const netKg = Math.max(0, grossWeightKg - tareWeightKg);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(25);

  const liveQuote = useMemo(
    () =>
      calculateSaltPriceQuote({
        customerName: counterpartyName,
        saltGrade,
        destination: destinationType,
        quantityMt: netKg / 1000,
        targetMarginPct,
        usdToAfn,
      }),
    [counterpartyName, saltGrade, destinationType, netKg, targetMarginPct, usdToAfn]
  );

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (statusFilter !== "ALL" && tk.status !== statusFilter) return false;
      if (!q) return true;
      return (
        tk.ticketNumber.toLowerCase().includes(q) ||
        tk.truckPlate.toLowerCase().includes(q) ||
        tk.counterpartyName.toLowerCase().includes(q) ||
        tk.driverName.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (grossWeightKg <= tareWeightKg) {
      setErrorMsg("Gross weight must be greater than Tare weight.");
      return;
    }

    await onCreateTicket({
      clientSyncId: crypto.randomUUID(),
      direction,
      status: "ACTIVE",
      truckPlate: truckPlate.trim(),
      driverName: driverName.trim(),
      driverTazkira: driverTazkira.trim(),
      counterpartyName: counterpartyName.trim(),
      paymentMethod,
      hawalaRef: paymentMethod === "HAWALA" ? hawalaRef.trim() : undefined,
      zoneCode: "GHR-PIT-01",
      saltGrade,
      destinationType,
      destinationDetail: destinationDetail.trim(),
      grossWeightKg,
      tareWeightKg,
      unitPriceAfnPerMt,
      lockedUsdToAfn: usdToAfn,
      scaleDeviceId: "KANTA-GHR-01",
      weighOutAt: new Date().toISOString(),
      operatorName: t.roles[role],
      offlineCreatedAt: new Date().toISOString(),
    });

    setShowForm(false);
    setDriverName("");
    setDriverTazkira("");
    setCounterpartyName("");
    setHawalaRef("");
  }

  async function handleVoidClick(
    ticket: WeighbridgeTicket,
    action: "REQUEST" | "APPROVE"
  ) {
    setErrorMsg(null);
    const reason =
      action === "REQUEST"
        ? window.prompt(t.weighbridge.voidReasonPrompt) || ""
        : ticket.voidReason || "Approved by supervisor";
    if (action === "REQUEST" && !reason.trim()) return;
    try {
      await onVoidAction(ticket.id, action, reason);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div className="space-y-5 anim-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t.weighbridge.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t.weighbridge.subtitle}
          </p>
        </div>
        {perms.canCreateWeighbridge && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn btn-primary shrink-0"
          >
            <Scale className="h-3.5 w-3.5" />
            {t.weighbridge.newTicketBtn}
          </button>
        )}
      </div>

      {/* Anti-fraud notice */}
      <div
        className="surface p-3 flex items-center gap-2.5 text-xs"
        style={{
          borderColor: "rgba(245,158,11,0.3)",
          background: "rgba(245,158,11,0.07)",
        }}
      >
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
        <span>{t.weighbridge.antiFraudNotice}</span>
      </div>

      {errorMsg && (
        <div
          className="surface p-3 flex items-center gap-2 text-xs text-rose-400"
          style={{
            borderColor: "rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.08)",
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Structured Ticket Form */}
      {showForm && perms.canCreateWeighbridge && (
        <form onSubmit={handleSubmit} className="surface p-5 space-y-4 anim-enter">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label={t.weighbridge.direction}>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as TicketDirection)}
                className="field w-full"
              >
                <option value="OUTBOUND_DISPATCH">{t.weighbridge.outbound}</option>
                <option value="INBOUND_SUPPLY">{t.weighbridge.inbound}</option>
              </select>
            </Field>

            <Field label={t.weighbridge.truckPlate}>
              <input
                required
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
                className="field w-full mono"
                placeholder="HRT-48291"
              />
            </Field>

            <Field label={t.weighbridge.driverName}>
              <input
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="field w-full"
                placeholder="e.g. Bismillah Khan"
              />
            </Field>

            <Field label={t.weighbridge.driverTazkira}>
              <input
                required
                value={driverTazkira}
                onChange={(e) => setDriverTazkira(e.target.value)}
                className="field w-full mono"
                placeholder="1399-0211-54820"
              />
            </Field>

            <Field label={t.weighbridge.counterparty}>
              <input
                required
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="field w-full"
                placeholder="Herat / Export Buyer"
              />
            </Field>

            <Field label={t.weighbridge.saltGrade}>
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
            </Field>

            <Field label={t.weighbridge.destination}>
              <select
                value={destinationType}
                onChange={(e) =>
                  setDestinationType(e.target.value as DestinationType)
                }
                className="field w-full"
              >
                {Object.entries(t.destinations).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.weighbridge.destinationDetail}>
              <input
                required
                value={destinationDetail}
                onChange={(e) => setDestinationDetail(e.target.value)}
                className="field w-full"
              />
            </Field>

            <Field label={t.weighbridge.grossKg}>
              <input
                type="number"
                required
                min={1000}
                value={grossWeightKg}
                onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                className="field w-full mono"
              />
            </Field>

            <Field label={t.weighbridge.tareKg}>
              <input
                type="number"
                required
                min={500}
                value={tareWeightKg}
                onChange={(e) => setTareWeightKg(Number(e.target.value))}
                className="field w-full mono"
              />
            </Field>

            <Field label={t.weighbridge.netKg}>
              <div
                className="field w-full mono font-semibold text-emerald-400"
                style={{ borderColor: "rgba(16,185,129,0.35)" }}
              >
                {formatNumber(netKg, 0)} {t.common.kg} ({(netKg / 1000).toFixed(2)}{" "}
                {t.common.mt})
              </div>
            </Field>

            <Field label={t.weighbridge.unitPriceAfn}>
              <input
                type="number"
                required
                min={0}
                value={unitPriceAfnPerMt}
                onChange={(e) => setUnitPriceAfnPerMt(Number(e.target.value))}
                className="field w-full mono"
              />
            </Field>

            <Field label={t.weighbridge.paymentMethod}>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as "CASH" | "BANK_TRANSFER" | "HAWALA"
                  )
                }
                className="field w-full"
              >
                <option value="CASH">{t.common.cash}</option>
                <option value="BANK_TRANSFER">{t.common.bankTransfer}</option>
                <option value="HAWALA">{t.common.hawala}</option>
              </select>
            </Field>

            {paymentMethod === "HAWALA" && (
              <Field label={t.weighbridge.hawalaRef}>
                <input
                  value={hawalaRef}
                  onChange={(e) => setHawalaRef(e.target.value)}
                  className="field w-full"
                  placeholder="Saraf / Hawala Code"
                />
              </Field>
            )}
          </div>

          {/* Automatic Cost-Plus & Tiered Pricing Breakdown */}
          <div className="terminal p-3 mono text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div>
                Extraction {liveQuote.extractionAfn} + Processing/I2 {liveQuote.processingIodineAfn} + Bags {liveQuote.packagingAfn} + MoMP {liveQuote.mompRoyaltyAfn} + Freight {liveQuote.transportAfn} ={" "}
                <span className="text-amber-400 font-semibold">
                  Landed {liveQuote.landedCostPerMtAfn} AFN/MT
                </span>
              </div>
              <div className="text-emerald-400">
                Suggested ({liveQuote.pricingSource}): {liveQuote.finalUnitPriceAfn.toLocaleString()} AFN/MT (${liveQuote.finalUnitPriceUsd}/MT) · Est. Profit: {formatCurrency(liveQuote.estimatedProfitAfn, currency, usdToAfn)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400 flex items-center gap-1">
                Margin %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={targetMarginPct}
                  onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                  className="field w-16 py-1 px-2 text-xs mono"
                />
              </label>
              <button
                type="button"
                onClick={() => setUnitPriceAfnPerMt(liveQuote.finalUnitPriceAfn)}
                className="btn py-1 px-2.5 text-xs"
              >
                Apply Auto-Price
              </button>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-2 pt-3"
            style={{ borderTop: "1px solid var(--border-hair)" }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={captureLiveKantaScale}
                className="btn text-xs"
              >
                <Scale className="h-3.5 w-3.5 text-emerald-400" />
                Capture RS-232 Kanta Weight
              </button>
              {scaleStatus && (
                <span className="mono text-[11px] text-emerald-400">
                  {scaleStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-ghost"
              >
                {t.weighbridge.close}
              </button>
              <button type="submit" className="btn btn-primary">
                {t.weighbridge.issueTicket}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Full DataTable Card */}
      <div className="surface overflow-hidden">
        {/* Toolbar: Search + Filter Chips */}
        <div
          className="p-3.5 flex flex-wrap items-center justify-between gap-3"
          style={{ borderBottom: "1px solid var(--border-hair)" }}
        >
          <div className="relative w-full sm:w-64">
            <Search
              className="h-3.5 w-3.5 absolute start-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket, plate, buyer..."
              className="field w-full ps-8"
            />
          </div>
          <div className="flex items-center gap-1">
            {(["ALL", "ACTIVE", "VOID_PENDING", "VOIDED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`chip ${statusFilter === st ? "active" : ""}`}
              >
                {st === "ALL"
                  ? "All"
                  : st === "ACTIVE"
                  ? t.common.active
                  : st === "VOID_PENDING"
                  ? t.common.voidPending
                  : t.common.voided}
              </button>
            ))}
          </div>
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
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.ticketNo}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.truckPlate}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.counterparty}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.saltGrade}</th>
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.destination}</th>
                <th className="px-4 py-3 text-end font-medium">{t.weighbridge.netKg}</th>
                {perms.canViewFinancials && (
                  <th className="px-4 py-3 text-end font-medium">Value</th>
                )}
                <th className="px-4 py-3 text-start font-medium">{t.weighbridge.status}</th>
                <th className="px-4 py-3 text-end font-medium">{t.weighbridge.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((tk) => {
                const valueAfn = (tk.netWeightKg / 1000) * tk.unitPriceAfnPerMt;
                return (
                  <tr
                    key={tk.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid var(--border-hair)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="mono font-medium">{tk.ticketNumber}</div>
                      <span
                        className={`text-[10.5px] ${
                          tk.syncState === "SYNCED"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        ●{" "}
                        {tk.syncState === "SYNCED"
                          ? t.common.synced
                          : t.common.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="mono font-medium">{tk.truckPlate}</div>
                      <div style={{ color: "var(--text-muted)" }}>
                        {tk.driverName}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate">
                      {tk.counterpartyName}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {t.grades[tk.saltGrade]}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {t.destinations[tk.destinationType]}
                    </td>
                    <td className="px-4 py-3 text-end mono font-semibold">
                      {formatNumber(tk.netWeightKg, 0)} {t.common.kg}
                    </td>
                    {perms.canViewFinancials && (
                      <td className="px-4 py-3 text-end mono">
                        {formatCurrency(valueAfn, currency, tk.lockedUsdToAfn)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge status={tk.status} t={t} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedWaybill(tk)}
                          className="btn py-1 px-2 text-xs"
                        >
                          <QrCode className="h-3.5 w-3.5 text-indigo-400" />
                          {t.weighbridge.viewWaybill}
                        </button>
                        {tk.status === "ACTIVE" && perms.canRequestVoidTicket && (
                          <button
                            onClick={() => handleVoidClick(tk, "REQUEST")}
                            className="btn py-1 px-2 text-xs text-amber-400"
                          >
                            {t.weighbridge.requestVoid}
                          </button>
                        )}
                        {tk.status === "VOID_PENDING" &&
                          perms.canApproveVoidTicket && (
                            <button
                              onClick={() => handleVoidClick(tk, "APPROVE")}
                              className="btn btn-danger py-1 px-2 text-xs"
                            >
                              {t.weighbridge.approveVoid}
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Inspector Drawer for QR Waybill */}
      {selectedWaybill && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="surface drawer-panel w-full max-w-md h-full rounded-none p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div
                className="flex items-center justify-between pb-3"
                style={{ borderBottom: "1px solid var(--border-hair)" }}
              >
                <div>
                  <h3 className="text-sm font-semibold">
                    {t.weighbridge.waybillTitle}
                  </h3>
                  <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {selectedWaybill.ticketNumber} · {selectedWaybill.scaleDeviceId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWaybill(null)}
                  className="chip no-print"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center p-4 rounded-xl bg-white">
                <QRCodeSVG
                  value={JSON.stringify({
                    tkt: selectedWaybill.ticketNumber,
                    plate: selectedWaybill.truckPlate,
                    netKg: selectedWaybill.netWeightKg,
                    hash: selectedWaybill.qrPayloadHash,
                  })}
                  size={136}
                />
              </div>

              <div className="terminal p-3 mono text-[11px] text-center">
                SHA-256 SEAL: {selectedWaybill.qrPayloadHash}
              </div>

              <div className="space-y-2 text-xs">
                <Row label={t.weighbridge.truckPlate} val={selectedWaybill.truckPlate} mono />
                <Row label={t.weighbridge.driverName} val={selectedWaybill.driverName} />
                <Row label={t.weighbridge.driverTazkira} val={selectedWaybill.driverTazkira} mono />
                <Row label={t.weighbridge.counterparty} val={selectedWaybill.counterpartyName} />
                <Row label={t.weighbridge.saltGrade} val={t.grades[selectedWaybill.saltGrade]} />
                <Row label={t.weighbridge.destination} val={t.destinations[selectedWaybill.destinationType]} />
              </div>

              <div className="grid grid-cols-3 gap-2 surface p-3 text-center">
                <div>
                  <div className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                    {t.weighbridge.grossKg}
                  </div>
                  <div className="mono font-semibold text-sm">
                    {formatNumber(selectedWaybill.grossWeightKg, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                    {t.weighbridge.tareKg}
                  </div>
                  <div className="mono font-semibold text-sm">
                    {formatNumber(selectedWaybill.tareWeightKg, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-emerald-400">
                    {t.weighbridge.netKg}
                  </div>
                  <div className="mono font-bold text-sm text-emerald-400">
                    {formatNumber(selectedWaybill.netWeightKg, 0)} kg
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex justify-end gap-2 pt-4 mt-4 no-print"
              style={{ borderTop: "1px solid var(--border-hair)" }}
            >
              <button
                onClick={() => printThermalWaybillPdf(selectedWaybill, lang)}
                className="btn btn-primary"
              >
                <Printer className="h-3.5 w-3.5" />
                80mm RTL / PDF
              </button>
              <button
                onClick={() => setSelectedWaybill(null)}
                className="btn btn-ghost"
              >
                {t.weighbridge.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({
  label,
  val,
  mono,
}: {
  label: string;
  val: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex justify-between gap-2 pb-1.5"
      style={{ borderBottom: "1px solid var(--border-hair)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className={`font-medium ${mono ? "mono" : ""}`}>{val}</span>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: WeighbridgeTicket["status"];
  t: TranslationDict;
}) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {t.common.active}
      </span>
    );
  }
  if (status === "VOID_PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {t.common.voidPending}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      {t.common.voided}
    </span>
  );
}
