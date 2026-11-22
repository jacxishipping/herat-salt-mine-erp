"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Factory,
  HardHat,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Moon,
  Mountain,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sun,
} from "lucide-react";
import {
  AttendanceRecord,
  AuditLogEntry,
  CurrencyCode,
  CustomerAccount,
  DailyProductionPoint,
  EmployeePayrollRecord,
  ExtractionLog,
  FinancialEntry,
  FleetAsset,
  HseIncident,
  InventoryTransfer,
  InvoiceRecord,
  LangCode,
  MineZone,
  MompRoyaltyAssessment,
  PpeIssuance,
  ProcessingBatch,
  TonnageContract,
  UserRole,
  Warehouse,
  WarehouseStockItem,
  WeighbridgeTicket,
} from "@/types/erp";
import { TRANSLATIONS } from "@/lib/i18n";
import { PHASE2_TRANSLATIONS } from "@/lib/i18n-phase2";
import {
  clearSyncedQueue,
  getPendingQueue,
  queueOfflineAttendance,
  queueOfflineExtraction,
  queueOfflineHse,
  queueOfflineTicket,
} from "@/lib/offline-db";
import { exportErpWorkbookXlsx } from "@/lib/export-reports";
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { WeighbridgeModule } from "./WeighbridgeModule";
import { ExtractionModule } from "./ExtractionModule";
import { ProcessingInventoryModule } from "./ProcessingInventoryModule";
import { FinanceSalesModule } from "./FinanceSalesModule";
import { HrHseModule } from "./HrHseModule";
import { AuditLogModule } from "./AuditLogModule";
import { LoginModal } from "./LoginModal";

type ActiveTab =
  | "dashboard"
  | "weighbridge"
  | "extraction"
  | "processing"
  | "finance"
  | "hr_hse"
  | "audit";

export function ErpShell() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<LangCode>("en");
  const [currency, setCurrency] = useState<CurrencyCode>("AFN");
  const [role, setRole] = useState<UserRole>("MINE_OWNER");
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [operatorLabel, setOperatorLabel] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [usdToAfn, setUsdToAfn] = useState(71.5);
  const [zones, setZones] = useState<MineZone[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [extractionLogs, setExtractionLogs] = useState<ExtractionLog[]>([]);
  const [tickets, setTickets] = useState<WeighbridgeTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [weeklySeries, setWeeklySeries] = useState<DailyProductionPoint[]>([]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStockItem[]>([]);
  const [inventoryTransfers, setInventoryTransfers] = useState<InventoryTransfer[]>([]);
  const [processingBatches, setProcessingBatches] = useState<ProcessingBatch[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [contracts, setContracts] = useState<TonnageContract[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [financialLedger, setFinancialLedger] = useState<FinancialEntry[]>([]);
  const [mompRoyalties, setMompRoyalties] = useState<MompRoyaltyAssessment[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<EmployeePayrollRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [ppeIssuances, setPpeIssuances] = useState<PpeIssuance[]>([]);
  const [hseIncidents, setHseIncidents] = useState<HseIncident[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const t = TRANSLATIONS[lang];
  const t2 = PHASE2_TRANSLATIONS[lang];
  const effectiveOnline = isBrowserOnline && !isOfflineSimulated;

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (jwtToken) h.Authorization = `Bearer ${jwtToken}`;
    return h;
  }, [jwtToken]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((curr) => (curr === msg ? null : curr)), 2400);
  }, []);

  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const loadErpState = useCallback(async () => {
    const pending = await getPendingQueue();
    setPendingCount(
      pending.tickets.length +
        pending.extractions.length +
        pending.attendance.length +
        pending.hse.length
    );

    try {
      const res = await fetch("/api/v1/erp/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch ERP state");
      const data = await res.json();
      setUsdToAfn(data.usdToAfn);
      setZones(data.zones || []);
      setFleetAssets(data.fleetAssets || []);
      setWeeklySeries(data.weeklySeries || []);
      setAuditLogs(data.auditLogs || []);
      setWarehouses(data.warehouses || []);
      setWarehouseStock(data.warehouseStock || []);
      setInventoryTransfers(data.inventoryTransfers || []);
      setProcessingBatches(data.processingBatches || []);
      setCustomers(data.customers || []);
      setContracts(data.contracts || []);
      setInvoices(data.invoices || []);
      setFinancialLedger(data.financialLedger || []);
      setMompRoyalties(data.mompRoyalties || []);
      setPayrollRecords(data.payrollRecords || []);
      setPpeIssuances(data.ppeIssuances || []);

      setTickets([...pending.tickets, ...(data.weighbridgeTickets || [])]);
      setExtractionLogs([...pending.extractions, ...(data.extractionLogs || [])]);
      setAttendanceRecords([...pending.attendance, ...(data.attendanceRecords || [])]);
      setHseIncidents([...pending.hse, ...(data.hseIncidents || [])]);
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    setIsBrowserOnline(
      typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const onOnline = () => setIsBrowserOnline(true);
    const onOffline = () => setIsBrowserOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    loadErpState();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [loadErpState]);

  const handleSyncQueue = useCallback(async () => {
    if (!effectiveOnline) return;
    const pending = await getPendingQueue();
    const total =
      pending.tickets.length +
      pending.extractions.length +
      pending.attendance.length +
      pending.hse.length;
    if (total === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/v1/sync/batch", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          actorRole: role,
          tickets: pending.tickets,
          extractions: pending.extractions,
          attendance: pending.attendance,
          hse: pending.hse,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        await clearSyncedQueue(
          result.syncedTicketSyncIds,
          result.syncedExtractionSyncIds,
          result.syncedAttendanceSyncIds,
          result.syncedHseSyncIds
        );
        await loadErpState();
        showToast(`Reconciled ${total} offline record(s) from IndexedDB`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [effectiveOnline, role, authHeaders, loadErpState, showToast]);

  useEffect(() => {
    if (effectiveOnline && pendingCount > 0) {
      handleSyncQueue();
    }
  }, [effectiveOnline, pendingCount, handleSyncQueue]);

  async function handleCreateTicket(
    input: Omit<
      WeighbridgeTicket,
      | "id"
      | "ticketNumber"
      | "netWeightKg"
      | "qrPayloadHash"
      | "syncedAt"
      | "syncState"
    >
  ) {
    if (!effectiveOnline) {
      const netWeightKg = input.grossWeightKg - input.tareWeightKg;
      const offlineTicket: WeighbridgeTicket = {
        ...input,
        id: `offline-${input.clientSyncId.slice(0, 8)}`,
        ticketNumber: `KNT-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        netWeightKg,
        qrPayloadHash: `OFFLINE-${input.clientSyncId.slice(0, 12).toUpperCase()}`,
        syncState: "PENDING_SYNC",
      };
      await queueOfflineTicket(offlineTicket);
      setTickets((prev) => [offlineTicket, ...prev]);
      setPendingCount((c) => c + 1);
      showToast("Saved ticket to IndexedDB offline queue");
      return;
    }

    const res = await fetch("/api/v1/weighbridge/tickets", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ticket: input, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Weighbridge ticket issued & QR sealed");
    }
  }

  async function handleVoidAction(
    ticketId: string,
    action: "REQUEST" | "APPROVE",
    reason: string
  ) {
    const res = await fetch(`/api/v1/weighbridge/tickets/${ticketId}/void`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        action,
        reason,
        actorName: operatorLabel || t.roles[role],
        actorRole: role,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Void action rejected");
    await loadErpState();
    showToast(action === "APPROVE" ? "Ticket void approved" : "Void requested");
  }

  async function handleCreateExtraction(
    input: Omit<ExtractionLog, "id" | "syncedAt" | "syncState">
  ) {
    if (!effectiveOnline) {
      const offlineLog: ExtractionLog = {
        ...input,
        id: `offline-${input.clientSyncId.slice(0, 8)}`,
        syncState: "PENDING_SYNC",
      };
      await queueOfflineExtraction(offlineLog);
      setExtractionLogs((prev) => [offlineLog, ...prev]);
      setPendingCount((c) => c + 1);
      showToast("Saved extraction log to offline IndexedDB");
      return;
    }

    const res = await fetch("/api/v1/extraction-logs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ log: input, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Shift extraction log recorded");
    }
  }

  async function handleFleetMaintenance(
    assetId: string,
    action: "COMPLETE_SERVICE" | "LOG_BREAKDOWN",
    downtimeDeltaHrs: number,
    note: string
  ) {
    const res = await fetch("/api/v1/fleet", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        assetId,
        action,
        downtimeDeltaHrs,
        note,
        actorRole: role,
        actorName: operatorLabel || t.roles[role],
      }),
    });
    if (res.ok) {
      await loadErpState();
      showToast(`Fleet updated: ${action}`);
    }
  }

  async function handleCreateBatch(
    batch: Omit<ProcessingBatch, "id" | "batchCode" | "shrinkageMt" | "processedAt">
  ) {
    const res = await fetch("/api/v1/processing", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ batch, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Processing batch recorded & stockpile updated");
    }
  }

  async function handleCreateTransfer(
    transfer: Omit<InventoryTransfer, "id" | "transferCode" | "createdAt" | "recordedBy">
  ) {
    const res = await fetch("/api/v1/inventory/transfer", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        transfer,
        actorRole: role,
        actorName: operatorLabel || t.roles[role],
      }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Inventory transfer / shrinkage recorded");
    }
  }

  async function handleCreateFinancialEntry(
    entry: Omit<FinancialEntry, "id" | "amountAfnEquiv" | "recordedAt">
  ) {
    const res = await fetch("/api/v1/finance", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ entry, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Settlement posted to financial ledger");
    }
  }

  async function handleUpdateRoyaltyStatus(
    royaltyId: string,
    status: "FILED" | "PAID"
  ) {
    const res = await fetch("/api/v1/finance", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        royaltyId,
        status,
        actorName: operatorLabel || t.roles[role],
        actorRole: role,
      }),
    });
    if (res.ok) {
      await loadErpState();
      showToast(`MoMP Royalty marked ${status}`);
    }
  }

  async function handleRecordInvoicePayment(
    invoiceId: string,
    paymentAfn: number
  ) {
    const res = await fetch("/api/v1/contracts", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        invoiceId,
        paymentAfn,
        actorName: operatorLabel || t.roles[role],
        actorRole: role,
      }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Invoice balance settled");
    }
  }

  async function handleCreateHseIncident(
    incident: Omit<HseIncident, "id" | "reportedAt">
  ) {
    if (!effectiveOnline) {
      const offlineInc: HseIncident = {
        ...incident,
        id: `offline-hse-${Date.now()}`,
        clientSyncId: crypto.randomUUID(),
        reportedAt: new Date().toISOString(),
        syncState: "PENDING_SYNC",
      };
      await queueOfflineHse(offlineInc);
      setHseIncidents((prev) => [offlineInc, ...prev]);
      setPendingCount((c) => c + 1);
      showToast("Saved HSE report to offline IndexedDB");
      return;
    }

    const res = await fetch("/api/v1/hse", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ incident, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("HSE safety report logged");
    }
  }

  async function handleCheckInAttendance(
    rec: Omit<AttendanceRecord, "id" | "syncState">
  ) {
    if (!effectiveOnline) {
      const offlineAtt: AttendanceRecord = {
        ...rec,
        id: `offline-att-${Date.now()}`,
        syncState: "PENDING_SYNC",
      };
      await queueOfflineAttendance(offlineAtt);
      setAttendanceRecords((prev) => [offlineAtt, ...prev]);
      setPendingCount((c) => c + 1);
      showToast("Biometric check-in queued offline");
      return;
    }

    const res = await fetch("/api/v1/attendance", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ attendance: rec, actorRole: role }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("Biometric attendance logged");
    }
  }

  async function handleIssuePpe(rec: Omit<PpeIssuance, "id" | "inspector">) {
    const res = await fetch("/api/v1/attendance", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        ppe: rec,
        actorRole: role,
        actorName: operatorLabel || t.roles[role],
      }),
    });
    if (res.ok) {
      await loadErpState();
      showToast("PPE kit issuance recorded");
    }
  }

  function handleExportWorkbook() {
    exportErpWorkbookXlsx({
      tickets,
      extractionLogs,
      warehouseStock,
      financialLedger,
      mompRoyalties,
      payrollRecords,
      hseIncidents,
    });
    showToast("Exported multi-sheet Excel (.xlsx) audit workbook");
  }

  const activeLabel =
    activeTab === "dashboard"
      ? t.nav.dashboard
      : activeTab === "weighbridge"
      ? t.nav.weighbridge
      : activeTab === "extraction"
      ? t.nav.extraction
      : activeTab === "processing"
      ? t.nav.processing
      : activeTab === "finance"
      ? t.nav.finance
      : activeTab === "hr_hse"
      ? t.nav.hrHse
      : t.nav.auditLogs;

  return (
    <div className="erp-shell">
      {/* AI Bridge UI Sidebar */}
      <aside className="erp-sidebar no-print">
        <div className="flex items-center gap-2.5 px-2 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs shrink-0"
            style={{ background: "var(--accent)" }}
          >
            HS
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[13px] leading-tight truncate">
              {t.brandName}
            </div>
            <div
              className="mono text-[10.5px] truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {t.brandSub}
            </div>
          </div>
        </div>

        <div
          className="text-[10.5px] font-medium uppercase tracking-wider px-2.5 mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Operations
        </div>
        <nav className="flex flex-col gap-0.5 mb-3">
          <NavBtn
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<LayoutDashboard className="h-3.5 w-3.5" />}
            label={t.nav.dashboard}
          />
          <NavBtn
            active={activeTab === "weighbridge"}
            onClick={() => setActiveTab("weighbridge")}
            icon={<Scale className="h-3.5 w-3.5" />}
            label={t.nav.weighbridge}
          />
          <NavBtn
            active={activeTab === "extraction"}
            onClick={() => setActiveTab("extraction")}
            icon={<Mountain className="h-3.5 w-3.5" />}
            label={t.nav.extraction}
          />
          <NavBtn
            active={activeTab === "processing"}
            onClick={() => setActiveTab("processing")}
            icon={<Factory className="h-3.5 w-3.5" />}
            label={t.nav.processing}
          />
        </nav>

        <div
          className="text-[10.5px] font-medium uppercase tracking-wider px-2.5 mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          Finance &amp; Governance
        </div>
        <nav className="flex flex-col gap-0.5 mb-4">
          <NavBtn
            active={activeTab === "finance"}
            onClick={() => setActiveTab("finance")}
            icon={<Landmark className="h-3.5 w-3.5" />}
            label={t.nav.finance}
          />
          <NavBtn
            active={activeTab === "hr_hse"}
            onClick={() => setActiveTab("hr_hse")}
            icon={<HardHat className="h-3.5 w-3.5" />}
            label={t.nav.hrHse}
          />
          <NavBtn
            active={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label={t.nav.auditLogs}
          />
        </nav>

        {/* Control Link Status Card */}
        <div className="mt-auto pt-2 space-y-2.5">
          <button
            onClick={() => setShowLogin(true)}
            className="btn w-full justify-center text-xs"
          >
            <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
            {jwtToken ? `JWT: ${operatorLabel}` : "Operator JWT Sign-In"}
          </button>

          <div className="surface p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                Site Sync Link
              </span>
              {effectiveOnline ? (
                <span className="pulse-dot" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </div>
            <div
              className={`text-xs font-semibold ${
                effectiveOnline ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {effectiveOnline ? t.topbar.online : t.topbar.offlineSite}
            </div>
            <div
              className="flex items-center justify-between pt-2 text-[11px]"
              style={{ borderTop: "1px solid var(--border-hair)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                {t.topbar.simulateOffline}
              </span>
              <button
                onClick={() => {
                  setIsOfflineSimulated((v) => !v);
                  showToast(
                    !isOfflineSimulated
                      ? "Offline Mine Mode enabled (IndexedDB queue)"
                      : "Reconnected to Central Server"
                  );
                }}
                className={`toggle ${isOfflineSimulated ? "on" : ""}`}
                aria-label="Simulate Offline"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0">
        <header
          className="h-auto min-h-12 py-2 px-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 no-print"
          style={{
            background: "var(--bg-main)",
            borderBottom: "1px solid var(--border-hair)",
          }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: "var(--text-muted)" }}>{t.brandName}</span>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="font-medium">{activeLabel}</span>

            {pendingCount > 0 && (
              <button
                onClick={handleSyncQueue}
                disabled={!effectiveOnline || isSyncing}
                className="btn btn-primary py-1 px-2.5 text-xs ms-2"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing
                  ? t.topbar.syncing
                  : `${t.topbar.syncNow} (${pendingCount})`}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t.topbar.roleLabel}
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole);
                showToast(`Switched role to ${t.roles[e.target.value as UserRole]}`);
              }}
              className="field py-1 px-2.5 text-xs"
            >
              {(Object.keys(t.roles) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {t.roles[r]}
                </option>
              ))}
            </select>

            <div
              className="inline-flex p-0.5 rounded-lg gap-0.5"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-hair)",
              }}
            >
              <button
                onClick={() => setCurrency("AFN")}
                className={`chip py-1 px-2 ${currency === "AFN" ? "active" : ""}`}
              >
                AFN ؋
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`chip py-1 px-2 ${currency === "USD" ? "active" : ""}`}
              >
                USD $
              </button>
            </div>

            <div
              className="inline-flex p-0.5 rounded-lg gap-0.5"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-hair)",
              }}
            >
              <button
                onClick={() => setLang("en")}
                className={`chip py-1 px-2 ${lang === "en" ? "active" : ""}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("fa")}
                className={`chip py-1 px-2 ${lang === "fa" ? "active" : ""}`}
              >
                دری
              </button>
              <button
                onClick={() => setLang("ps")}
                className={`chip py-1 px-2 ${lang === "ps" ? "active" : ""}`}
              >
                پښتو
              </button>
            </div>

            <button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                showToast(`Switched to ${next} mode`);
              }}
              className="btn btn-icon"
              title="Toggle Light / Dark Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </header>

        <main className="p-6 max-w-[1200px] w-full mx-auto flex-1">
          {activeTab === "dashboard" && (
            <ExecutiveDashboard
              t={t}
              lang={lang}
              currency={currency}
              usdToAfn={usdToAfn}
              role={role}
              zones={zones}
              extractionLogs={extractionLogs}
              tickets={tickets}
              weeklySeries={weeklySeries}
            />
          )}
          {activeTab === "weighbridge" && (
            <WeighbridgeModule
              t={t}
              lang={lang}
              currency={currency}
              usdToAfn={usdToAfn}
              role={role}
              tickets={tickets}
              onCreateTicket={handleCreateTicket}
              onVoidAction={handleVoidAction}
            />
          )}
          {activeTab === "extraction" && (
            <ExtractionModule
              t={t}
              lang={lang}
              role={role}
              zones={zones}
              fleetAssets={fleetAssets}
              extractionLogs={extractionLogs}
              onCreateExtraction={handleCreateExtraction}
              onFleetMaintenance={handleFleetMaintenance}
            />
          )}
          {activeTab === "processing" && (
            <ProcessingInventoryModule
              t={t}
              t2={t2}
              lang={lang}
              role={role}
              warehouses={warehouses}
              warehouseStock={warehouseStock}
              inventoryTransfers={inventoryTransfers}
              processingBatches={processingBatches}
              onCreateBatch={handleCreateBatch}
              onCreateTransfer={handleCreateTransfer}
            />
          )}
          {activeTab === "finance" && (
            <FinanceSalesModule
              t={t}
              t2={t2}
              currency={currency}
              usdToAfn={usdToAfn}
              role={role}
              customers={customers}
              contracts={contracts}
              invoices={invoices}
              financialLedger={financialLedger}
              mompRoyalties={mompRoyalties}
              onCreateEntry={handleCreateFinancialEntry}
              onUpdateRoyaltyStatus={handleUpdateRoyaltyStatus}
              onRecordInvoicePayment={handleRecordInvoicePayment}
              onExportCsv={handleExportWorkbook}
            />
          )}
          {activeTab === "hr_hse" && (
            <HrHseModule
              t={t}
              t2={t2}
              currency={currency}
              usdToAfn={usdToAfn}
              role={role}
              zones={zones}
              payrollRecords={payrollRecords}
              attendanceRecords={attendanceRecords}
              ppeIssuances={ppeIssuances}
              hseIncidents={hseIncidents}
              onCreateIncident={handleCreateHseIncident}
              onCheckInAttendance={handleCheckInAttendance}
              onIssuePpe={handleIssuePpe}
            />
          )}
          {activeTab === "audit" && (
            <AuditLogModule t={t} role={role} logs={auditLogs} />
          )}
        </main>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(auth) => {
            setJwtToken(auth.token);
            setRole(auth.role);
            setOperatorLabel(auth.fullName);
            setShowLogin(false);
            showToast(`Signed in via JWT as ${auth.fullName}`);
          }}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-5 end-5 z-50 surface modal-card px-3.5 py-2 text-xs font-medium shadow-xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button onClick={onClick} className={`nav-item ${active ? "active" : ""}`}>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
