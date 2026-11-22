"use client";

import React, { useState } from "react";
import { Download, Landmark, Lock, Plus, Wallet } from "lucide-react";
import {
  CurrencyCode,
  CustomerAccount,
  FinancialEntry,
  InvoiceRecord,
  MompRoyaltyAssessment,
  TonnageContract,
  UserRole,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { Phase2Dict } from "@/lib/i18n-phase2";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface FinanceSalesModuleProps {
  t: TranslationDict;
  t2: Phase2Dict;
  currency: CurrencyCode;
  usdToAfn: number;
  role: UserRole;
  customers: CustomerAccount[];
  contracts?: TonnageContract[];
  invoices?: InvoiceRecord[];
  financialLedger: FinancialEntry[];
  mompRoyalties: MompRoyaltyAssessment[];
  onCreateEntry: (
    entry: Omit<FinancialEntry, "id" | "amountAfnEquiv" | "recordedAt">
  ) => Promise<void>;
  onUpdateRoyaltyStatus: (
    royaltyId: string,
    status: "FILED" | "PAID"
  ) => Promise<void>;
  onRecordInvoicePayment?: (invoiceId: string, paymentAfn: number) => Promise<void>;
  onExportCsv: () => void;
}

export function FinanceSalesModule({
  t,
  t2,
  currency,
  usdToAfn,
  role,
  customers,
  contracts = [],
  invoices = [],
  financialLedger,
  mompRoyalties,
  onCreateEntry,
  onUpdateRoyaltyStatus,
  onRecordInvoicePayment,
  onExportCsv,
}: FinanceSalesModuleProps) {
  const perms = ROLE_PERMISSIONS[role];
  const [showForm, setShowForm] = useState(false);

  const [entryType, setEntryType] = useState<FinancialEntry["entryType"]>(
    "RECEIVABLE_PAYMENT"
  );
  const [counterparty, setCounterparty] = useState(
    customers[0]?.companyName || ""
  );
  const [entryCurrency, setEntryCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState<number>(2500);
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "HAWALA">(
    "HAWALA"
  );
  const [hawalaSarafName, setHawalaSarafName] = useState(
    "Saraf Aria (Herat Chowk Gulha)"
  );
  const [hawalaCode, setHawalaCode] = useState("");
  const [bankRef, setBankRef] = useState("");

  if (!perms.canViewFinancials) {
    return (
      <div className="surface p-10 text-center space-y-3 anim-enter">
        <div
          className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <Lock className="h-5 w-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold">{t2.finance.title}</h3>
        <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          {t2.finance.restricted}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateEntry({
      entryType,
      counterparty: counterparty.trim(),
      currency: entryCurrency,
      amount,
      lockedUsdToAfn: usdToAfn,
      method,
      hawalaSarafName: method === "HAWALA" ? hawalaSarafName.trim() : undefined,
      hawalaCode: method === "HAWALA" ? hawalaCode.trim() : undefined,
      bankRef: method === "BANK_TRANSFER" ? bankRef.trim() : undefined,
      recordedBy: t.roles[role],
    });
    setShowForm(false);
    setHawalaCode("");
    setBankRef("");
  }

  return (
    <div className="space-y-6 anim-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            {t2.finance.title}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {t2.finance.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onExportCsv} className="btn">
            <Download className="h-3.5 w-3.5" />
            {t2.exportCsv}
          </button>
          {perms.canManageFinance && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="btn btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t2.finance.newPaymentBtn}
            </button>
          )}
        </div>
      </div>

      {/* Record Settlement Form */}
      {showForm && perms.canManageFinance && (
        <form onSubmit={handleSubmit} className="surface p-5 space-y-4 anim-enter">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.finance.entryType}
              </span>
              <select
                value={entryType}
                onChange={(e) =>
                  setEntryType(e.target.value as FinancialEntry["entryType"])
                }
                className="field w-full"
              >
                <option value="RECEIVABLE_PAYMENT">Buyer Payment (AR)</option>
                <option value="SUPPLIER_BILL">Supplier Bill (AP)</option>
                <option value="ROYALTY_PAYMENT">MoMP Royalty Payment</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.finance.counterparty}
              </span>
              <input
                required
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                className="field w-full"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Currency
                </span>
                <select
                  value={entryCurrency}
                  onChange={(e) =>
                    setEntryCurrency(e.target.value as CurrencyCode)
                  }
                  className="field w-full"
                >
                  <option value="AFN">AFN ؋</option>
                  <option value="USD">USD $</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t2.finance.amount}
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="field w-full mono"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {t2.finance.method}
              </span>
              <select
                value={method}
                onChange={(e) =>
                  setMethod(
                    e.target.value as "CASH" | "BANK_TRANSFER" | "HAWALA"
                  )
                }
                className="field w-full"
              >
                <option value="HAWALA">{t.common.hawala}</option>
                <option value="BANK_TRANSFER">{t.common.bankTransfer}</option>
                <option value="CASH">{t.common.cash}</option>
              </select>
            </label>

            {method === "HAWALA" && (
              <>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {t2.finance.sarafName}
                  </span>
                  <input
                    required
                    value={hawalaSarafName}
                    onChange={(e) => setHawalaSarafName(e.target.value)}
                    className="field w-full"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {t2.finance.hawalaCode}
                  </span>
                  <input
                    required
                    value={hawalaCode}
                    onChange={(e) => setHawalaCode(e.target.value)}
                    className="field w-full mono"
                    placeholder="HW-2026-XXXX"
                  />
                </label>
              </>
            )}

            {method === "BANK_TRANSFER" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Bank Reference #
                </span>
                <input
                  required
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  className="field w-full mono"
                  placeholder="AIB / Azizi Bank Ref"
                />
              </label>
            )}
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
              {t2.finance.recordPayment}
            </button>
          </div>
        </form>
      )}

      {/* Customer Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customers.map((c) => {
          const pct = Math.min(
            100,
            Math.round((c.outstandingAfn / c.creditLimitAfn) * 100)
          );
          return (
            <div key={c.id} className="surface surface-lift p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="chip active mono text-[11px]">{c.code}</span>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {c.customerType}
                </span>
              </div>
              <h4 className="text-sm font-semibold">{c.companyName}</h4>
              <div className="flex justify-between text-xs tnum" style={{ color: "var(--text-secondary)" }}>
                <span>
                  {t2.finance.outstanding}:{" "}
                  <strong className="mono" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(c.outstandingAfn, currency, usdToAfn)}
                  </strong>
                </span>
                <span className="mono">{pct}%</span>
              </div>
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] mono" style={{ color: "var(--text-muted)" }}>
                {t2.finance.creditLimit}:{" "}
                {formatCurrency(c.creditLimitAfn, currency, usdToAfn)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Financial & Hawala Ledger */}
      <div className="surface overflow-hidden">
        <div
          className="px-4 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{
            borderBottom: "1px solid var(--border-hair)",
            color: "var(--text-secondary)",
          }}
        >
          <Wallet className="h-3.5 w-3.5 text-indigo-400" />
          <span>{t2.finance.ledgerTitle}</span>
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
                <th className="px-4 py-3 text-start font-medium">{t2.finance.entryType}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.finance.counterparty}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.finance.method}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.finance.reference}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.finance.amount}</th>
              </tr>
            </thead>
            <tbody>
              {financialLedger.map((f) => (
                <tr
                  key={f.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid var(--border-hair)" }}
                >
                  <td className="px-4 py-3 mono font-semibold">{f.entryType}</td>
                  <td className="px-4 py-3">{f.counterparty}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {f.method}
                  </td>
                  <td className="px-4 py-3 mono" style={{ color: "var(--text-muted)" }}>
                    {f.hawalaCode
                      ? `${f.hawalaSarafName} (${f.hawalaCode})`
                      : f.bankRef || "CASH-DESK"}
                  </td>
                  <td className="px-4 py-3 text-end mono font-semibold">
                    {formatCurrency(f.amountAfnEquiv, currency, f.lockedUsdToAfn)}
                    <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ({f.amount} {f.currency} @ {f.lockedUsdToAfn})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MoMP Royalty & Herat Customs */}
      <div className="surface overflow-hidden">
        <div
          className="px-4 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{
            borderBottom: "1px solid var(--border-hair)",
            color: "var(--text-secondary)",
          }}
        >
          <Landmark className="h-3.5 w-3.5 text-amber-400" />
          <span>{t2.finance.mompTitle}</span>
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
                <th className="px-4 py-3 text-start font-medium">{t2.finance.period}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.finance.extractedMt}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.finance.exportedMt}</th>
                <th className="px-4 py-3 text-start font-medium">{t2.finance.borderRef}</th>
                <th className="px-4 py-3 text-end font-medium">{t2.finance.royaltyDue}</th>
                <th className="px-4 py-3 text-end font-medium">{t.weighbridge.actions}</th>
              </tr>
            </thead>
            <tbody>
              {mompRoyalties.map((r) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid var(--border-hair)" }}
                >
                  <td className="px-4 py-3 font-medium">{r.periodLabel}</td>
                  <td className="px-4 py-3 text-end mono">
                    {formatNumber(r.extractedMt, 1)}
                  </td>
                  <td className="px-4 py-3 text-end mono">
                    {formatNumber(r.exportedMt, 1)}
                  </td>
                  <td className="px-4 py-3 mono" style={{ color: "var(--text-muted)" }}>
                    {r.customsBorderRef}
                  </td>
                  <td className="px-4 py-3 text-end mono font-semibold">
                    {formatCurrency(r.totalRoyaltyAfn, currency, usdToAfn)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    {r.status === "PENDING" && perms.canManageFinance ? (
                      <button
                        onClick={() => onUpdateRoyaltyStatus(r.id, "FILED")}
                        className="btn py-1 px-2.5 text-xs text-amber-400"
                      >
                        {t2.finance.markFiled}
                      </button>
                    ) : r.status === "FILED" && perms.canManageFinance ? (
                      <button
                        onClick={() => onUpdateRoyaltyStatus(r.id, "PAID")}
                        className="btn btn-primary py-1 px-2.5 text-xs"
                      >
                        {t2.finance.markPaid}
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-medium">
                        ● {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Long-Term Tonnage Contracts & Automated Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Long-Term Tonnage Contracts
          </div>
          {contracts.map((c) => {
            const pct = Math.min(100, Math.round((c.deliveredMt / c.contractedMt) * 100));
            return (
              <div key={c.id} className="space-y-1.5 pb-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{c.customerName}</span>
                  <span className="chip active mono text-[10.5px]">{c.contractCode}</span>
                </div>
                <div className="flex justify-between text-[11px] mono" style={{ color: "var(--text-muted)" }}>
                  <span>{c.deliveredMt} / {c.contractedMt} MT ({t.grades[c.saltGrade]})</span>
                  <span>{formatCurrency(c.tierPriceAfnPerMt, currency, usdToAfn)}/MT</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="surface p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Weighbridge-Linked Invoices &amp; Partial Payments
          </div>
          {invoices.map((inv) => {
            const remaining = Math.max(0, inv.totalAfn - inv.paidAfn);
            return (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <div>
                  <div className="mono font-semibold">
                    {inv.invoiceNumber}{" "}
                    <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                      ({inv.ticketNumber})
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {inv.customerName} · {inv.quantityMt} MT
                  </div>
                  <div className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Paid: {formatCurrency(inv.paidAfn, currency, inv.lockedUsdToAfn)} /{" "}
                    {formatCurrency(inv.totalAfn, currency, inv.lockedUsdToAfn)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={inv.status === "PAID" ? "text-emerald-400" : "text-amber-400"}>
                    ● {inv.status}
                  </span>
                  {remaining > 0 && perms.canManageFinance && onRecordInvoicePayment && (
                    <button
                      onClick={() => onRecordInvoicePayment(inv.id, remaining)}
                      className="btn btn-primary py-1 px-2 text-[11px]"
                    >
                      Settle Balance
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
