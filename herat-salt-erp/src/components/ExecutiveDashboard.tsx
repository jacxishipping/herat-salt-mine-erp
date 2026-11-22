"use client";

import React from "react";
import {
  Activity,
  DollarSign,
  Fuel,
  Landmark,
  Lock,
  Mountain,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  CurrencyCode,
  DailyProductionPoint,
  ExtractionLog,
  MineZone,
  UserRole,
  WeighbridgeTicket,
} from "@/types/erp";
import { TranslationDict } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

interface ExecutiveDashboardProps {
  t: TranslationDict;
  currency: CurrencyCode;
  usdToAfn: number;
  role: UserRole;
  zones: MineZone[];
  extractionLogs: ExtractionLog[];
  tickets: WeighbridgeTicket[];
  weeklySeries: DailyProductionPoint[];
  lang: "en" | "fa" | "ps";
}

export function ExecutiveDashboard({
  t,
  currency,
  usdToAfn,
  role,
  zones,
  extractionLogs,
  tickets,
  weeklySeries,
  lang,
}: ExecutiveDashboardProps) {
  const perms = ROLE_PERMISSIONS[role];

  const totalExtractedToday = extractionLogs.reduce(
    (acc, log) => acc + log.rawTonnageMt,
    0
  );
  const totalFuelToday = extractionLogs.reduce(
    (acc, log) => acc + log.fuelUsedL,
    0
  );
  const fuelPerMt =
    totalExtractedToday > 0 ? totalFuelToday / totalExtractedToday : 0;

  const activeOutboundTickets = tickets.filter(
    (tk) => tk.status === "ACTIVE" && tk.direction === "OUTBOUND_DISPATCH"
  );
  const totalDispatchedMt = activeOutboundTickets.reduce(
    (acc, tk) => acc + tk.netWeightKg / 1000,
    0
  );
  const totalRevenueAfn = activeOutboundTickets.reduce(
    (acc, tk) => acc + (tk.netWeightKg / 1000) * tk.unitPriceAfnPerMt,
    0
  );

  const processedTodayMt = totalExtractedToday * 0.868;
  const pendingMompRoyaltyAfn = totalExtractedToday * 350;
  const costPerMtAfn = 1420;

  const maxChartVal = Math.max(
    ...weeklySeries.map((d) =>
      Math.max(d.extractedMt, d.processedMt, d.dispatchedMt)
    ),
    100
  );

  return (
    <div className="space-y-6 anim-enter">
      {/* Compliance Alert Banner */}
      <div
        className="surface p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          borderColor: "rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.06)",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="pulse-dot mt-1.5" />
          <div>
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {t.kpi.complianceBannerTitle}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.kpi.complianceBannerSub}
            </p>
          </div>
        </div>
        <div
          className="mono text-xs px-2.5 py-1 rounded-md shrink-0"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-hair)",
          }}
        >
          1 USD = {usdToAfn.toFixed(2)} AFN
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title={t.kpi.extractedToday}
          value={`${formatNumber(totalExtractedToday, 1)} ${t.common.mt}`}
          sub={`${zones.length} ${t.kpi.activeZones}`}
          icon={<Mountain className="h-4 w-4 text-indigo-400" />}
          live
        />
        <KpiCard
          title={t.kpi.processedToday}
          value={`${formatNumber(processedTodayMt, 1)} ${t.common.mt}`}
          sub="86.8% Yield (35-42 ppm I2)"
          icon={<Activity className="h-4 w-4 text-sky-400" />}
        />
        <KpiCard
          title={t.kpi.dispatchedToday}
          value={`${formatNumber(totalDispatchedMt, 2)} ${t.common.mt}`}
          sub={`${activeOutboundTickets.length} Kanta Tickets`}
          icon={<Scale className="h-4 w-4 text-emerald-400" />}
        />
        <KpiCard
          title={t.kpi.revenueToday}
          value={
            perms.canViewFinancials
              ? formatCurrency(totalRevenueAfn, currency, usdToAfn)
              : "RBAC Restricted"
          }
          locked={!perms.canViewFinancials}
          sub={
            perms.canViewFinancials
              ? `${t.kpi.costPerTon}: ${formatCurrency(costPerMtAfn, currency, usdToAfn)}`
              : t.common.noPermission
          }
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
        />
      </div>

      {/* Secondary KPI + Animated Sparkline Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title={t.kpi.fuelEfficiency}
          value={`${formatNumber(fuelPerMt, 2)} ${t.common.liters}/${t.common.mt}`}
          sub={`${formatNumber(totalFuelToday, 0)} ${t.common.liters} Diesel`}
          icon={<Fuel className="h-4 w-4 text-amber-400" />}
        />
        <KpiCard
          title={t.kpi.mompRoyalty}
          value={
            perms.canViewFinancials || perms.canViewCompliance
              ? formatCurrency(pendingMompRoyaltyAfn, currency, usdToAfn)
              : "RBAC Restricted"
          }
          locked={!perms.canViewFinancials && !perms.canViewCompliance}
          sub="350 AFN / MT (MoMP Assessment)"
          icon={<Landmark className="h-4 w-4 text-indigo-400" />}
        />
        <div className="surface surface-lift p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              Plant Throughput (60m)
            </span>
            <span className="mono text-xs text-emerald-400">94.2%</span>
          </div>
          <svg viewBox="0 0 360 44" className="w-full h-11">
            <path
              className="spark-line"
              d="M0 34 C40 30, 80 18, 140 24 C200 30, 260 12, 360 16"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Chart & Zone Quotas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-Day Production vs Dispatch */}
        <div className="lg:col-span-2 surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {t.kpi.productionVsDispatch}
            </h3>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs" style={{ background: "var(--accent)" }} />
                {t.kpi.extractedLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-sky-400" />
                {t.kpi.processedLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-400" />
                {t.kpi.dispatchedLabel}
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-7 gap-3 items-end h-52 pt-4 pb-2"
            style={{ borderBottom: "1px solid var(--border-hair)" }}
          >
            {weeklySeries.map((pt) => {
              const hExt = Math.round((pt.extractedMt / maxChartVal) * 100);
              const hProc = Math.round((pt.processedMt / maxChartVal) * 100);
              const hDisp = Math.round((pt.dispatchedMt / maxChartVal) * 100);
              return (
                <div
                  key={pt.day}
                  className="flex flex-col items-center gap-2 h-full justify-end"
                >
                  <div className="flex items-end gap-1 w-full justify-center h-40">
                    <div
                      title={`${t.kpi.extractedLabel}: ${pt.extractedMt} MT`}
                      style={{ height: `${hExt}%`, background: "var(--accent)" }}
                      className="w-2.5 sm:w-3.5 rounded-t transition-all"
                    />
                    <div
                      title={`${t.kpi.processedLabel}: ${pt.processedMt} MT`}
                      style={{ height: `${hProc}%` }}
                      className="w-2.5 sm:w-3.5 rounded-t bg-sky-400 transition-all"
                    />
                    <div
                      title={`${t.kpi.dispatchedLabel}: ${pt.dispatchedMt} MT`}
                      style={{ height: `${hDisp}%` }}
                      className="w-2.5 sm:w-3.5 rounded-t bg-emerald-400 transition-all"
                    />
                  </div>
                  <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {pt.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Mine Zones Quota Card */}
        <div className="surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {t.kpi.activeZones}
            </h3>
            <span className="chip active text-[11px]">Live</span>
          </div>
          <div className="space-y-4">
            {zones.map((zone) => {
              const pct = Math.min(
                100,
                Math.round((zone.todayExtractedMt / zone.dailyTargetMt) * 100)
              );
              const zoneName =
                lang === "fa"
                  ? zone.nameFa
                  : lang === "ps"
                  ? zone.namePs
                  : zone.nameEn;
              return (
                <div key={zone.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[170px]">{zoneName}</span>
                    <span className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {formatNumber(zone.todayExtractedMt, 1)} / {zone.dailyTargetMt} {t.common.mt}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 85 ? "#10B981" : "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] mono" style={{ color: "var(--text-muted)" }}>
                    <span>{zone.code} · {zone.region}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Obsidian Live Telemetry Terminal */}
      <div className="terminal p-4 mono text-xs space-y-1.5">
        <div>
          <span className="text-slate-500">[KANTA-GHR-01]</span>{" "}
          <span className="text-emerald-400">[ONLINE]</span> RS-232 Weighbridge bridge active · SHA-256 QR sealing enabled.
        </div>
        <div>
          <span className="text-slate-500">[SYNC-ENGINE]</span>{" "}
          <span className="text-indigo-400">[IDEMPOTENT]</span> IndexedDB offline queue ready · {tickets.length} tickets &amp; {extractionLogs.length} shift logs reconciled.
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  locked,
  live,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  locked?: boolean;
  live?: boolean;
}) {
  return (
    <div className="surface surface-lift p-4 flex flex-col justify-between gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        <div className="flex items-center gap-2">
          {live && <span className="pulse-dot" />}
          {locked ? <Lock className="h-4 w-4 text-slate-500" /> : icon}
        </div>
      </div>
      <div>
        <div
          className={`font-semibold mono tnum ${
            locked ? "text-xs text-slate-500" : "text-xl"
          }`}
        >
          {value}
        </div>
        <p className="text-[11.5px] mt-1" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
