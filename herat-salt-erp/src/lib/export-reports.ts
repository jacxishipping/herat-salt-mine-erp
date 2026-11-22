import * as XLSX from "xlsx";
import {
  ExtractionLog,
  FinancialEntry,
  HseIncident,
  MompRoyaltyAssessment,
  EmployeePayrollRecord,
  WarehouseStockItem,
  WeighbridgeTicket,
  LangCode,
} from "@/types/erp";

export function exportErpWorkbookXlsx(params: {
  tickets: WeighbridgeTicket[];
  extractionLogs: ExtractionLog[];
  warehouseStock: WarehouseStockItem[];
  financialLedger: FinancialEntry[];
  mompRoyalties: MompRoyaltyAssessment[];
  payrollRecords: EmployeePayrollRecord[];
  hseIncidents: HseIncident[];
}) {
  const wb = XLSX.utils.book_new();

  const kantaSheet = XLSX.utils.json_to_sheet(
    params.tickets.map((t) => ({
      TicketNo: t.ticketNumber,
      Direction: t.direction,
      Status: t.status,
      Plate: t.truckPlate,
      Driver: t.driverName,
      Tazkira: t.driverTazkira,
      Counterparty: t.counterpartyName,
      Grade: t.saltGrade,
      Destination: t.destinationType,
      GrossKg: t.grossWeightKg,
      TareKg: t.tareWeightKg,
      NetKg: t.netWeightKg,
      NetMT: Number((t.netWeightKg / 1000).toFixed(3)),
      PriceAFNPerMT: t.unitPriceAfnPerMt,
      LockedFX: t.lockedUsdToAfn,
      Payment: t.paymentMethod,
      HawalaRef: t.hawalaRef || "",
      QRSeal: t.qrPayloadHash,
    }))
  );
  XLSX.utils.book_append_sheet(wb, kantaSheet, "Weighbridge_Kanta");

  const extSheet = XLSX.utils.json_to_sheet(
    params.extractionLogs.map((e) => ({
      Zone: e.zoneCode,
      Shift: e.shiftCode,
      Date: e.logDate,
      Method: e.method,
      TonnageMT: e.rawTonnageMt,
      CrewLead: e.crewLeadName,
      Equipment: e.equipmentCode,
      DieselLiters: e.fuelUsedL,
      EngineHours: e.engineHoursDelta,
      MoisturePct: e.moisturePct,
    }))
  );
  XLSX.utils.book_append_sheet(wb, extSheet, "Extraction_Logs");

  const stockSheet = XLSX.utils.json_to_sheet(params.warehouseStock);
  XLSX.utils.book_append_sheet(wb, stockSheet, "Warehouse_Stock");

  const finSheet = XLSX.utils.json_to_sheet(params.financialLedger);
  XLSX.utils.book_append_sheet(wb, finSheet, "Hawala_Ledger");

  const mompSheet = XLSX.utils.json_to_sheet(params.mompRoyalties);
  XLSX.utils.book_append_sheet(wb, mompSheet, "MoMP_Royalties");

  const paySheet = XLSX.utils.json_to_sheet(params.payrollRecords);
  XLSX.utils.book_append_sheet(wb, paySheet, "Payroll_AFN");

  const hseSheet = XLSX.utils.json_to_sheet(params.hseIncidents);
  XLSX.utils.book_append_sheet(wb, hseSheet, "HSE_Incidents");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Herat-Salt-ERP-Audit-${date}.xlsx`);
}

/**
 * Opens a dedicated RTL/LTR print window formatted for 80mm thermal gate-pass
 * printers or A4 MoMP/Customs PDF export.
 */
export function printThermalWaybillPdf(
  ticket: WeighbridgeTicket,
  lang: LangCode
) {
  const isRtl = lang === "fa" || lang === "ps";
  const dir = isRtl ? "rtl" : "ltr";
  const title =
    lang === "fa"
      ? "بارنامه رسمی معدن نمک هرات (کانته)"
      : lang === "ps"
      ? "د هرات د مالګې کان رسمي بارنامه"
      : "HERAT SALT MINE — OFFICIAL KANTA WAYBILL";

  const win = window.open("", "_blank", "width=420,height=680");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${ticket.ticketNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { font-family: system-ui, Tahoma, Arial, sans-serif; width: 72mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.45; }
    .hdr { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 2px 0; }
    .mono { font-family: monospace; font-weight: 700; }
    .net { text-align: center; border: 1.5px solid #000; padding: 6px; margin: 8px 0; font-size: 14px; font-weight: 700; }
    .seal { text-align: center; font-family: monospace; font-size: 10px; border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div style="font-weight:700;font-size:13px">${title}</div>
    <div class="mono">${ticket.ticketNumber} | ${ticket.scaleDeviceId}</div>
    <div>${new Date(ticket.weighOutAt).toLocaleString()}</div>
  </div>
  <div class="row"><span>Plate:</span><span class="mono">${ticket.truckPlate}</span></div>
  <div class="row"><span>Driver:</span><span>${ticket.driverName}</span></div>
  <div class="row"><span>Tazkira:</span><span class="mono">${ticket.driverTazkira}</span></div>
  <div class="row"><span>Buyer:</span><span>${ticket.counterpartyName}</span></div>
  <div class="row"><span>Grade:</span><span>${ticket.saltGrade}</span></div>
  <div class="row"><span>Dest:</span><span>${ticket.destinationType}</span></div>
  <div class="row"><span>Gross:</span><span class="mono">${ticket.grossWeightKg.toLocaleString()} kg</span></div>
  <div class="row"><span>Tare:</span><span class="mono">${ticket.tareWeightKg.toLocaleString()} kg</span></div>
  <div class="net">NET: ${ticket.netWeightKg.toLocaleString()} kg (${(ticket.netWeightKg / 1000).toFixed(2)} MT)</div>
  <div class="row"><span>FX Lock:</span><span class="mono">1 USD = ${ticket.lockedUsdToAfn} AFN</span></div>
  <div class="row"><span>Payment:</span><span>${ticket.paymentMethod} ${ticket.hawalaRef || ""}</span></div>
  <div class="seal">
    MoMP &amp; Herat Customs Verification<br/>
    SHA256: ${ticket.qrPayloadHash}
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}
