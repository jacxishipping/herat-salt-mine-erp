import crypto from "crypto";
import {
  AttendanceRecord,
  AuditLogEntry,
  CustomerAccount,
  DailyProductionPoint,
  EmployeePayrollRecord,
  ExtractionLog,
  FinancialEntry,
  FleetAsset,
  HseIncident,
  InventoryTransfer,
  InvoiceRecord,
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
import { DEFAULT_USD_TO_AFN } from "@/lib/currency";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

export interface ErpServerState {
  usdToAfn: number;
  zones: MineZone[];
  fleetAssets: FleetAsset[];
  extractionLogs: ExtractionLog[];
  weighbridgeTickets: WeighbridgeTicket[];
  auditLogs: AuditLogEntry[];
  weeklySeries: DailyProductionPoint[];
  warehouses: Warehouse[];
  warehouseStock: WarehouseStockItem[];
  inventoryTransfers: InventoryTransfer[];
  processingBatches: ProcessingBatch[];
  customers: CustomerAccount[];
  contracts: TonnageContract[];
  invoices: InvoiceRecord[];
  financialLedger: FinancialEntry[];
  mompRoyalties: MompRoyaltyAssessment[];
  payrollRecords: EmployeePayrollRecord[];
  attendanceRecords: AttendanceRecord[];
  ppeIssuances: PpeIssuance[];
  hseIncidents: HseIncident[];
}

export function generateQrHash(payload: {
  ticketNumber: string;
  truckPlate: string;
  netWeightKg: number;
  weighOutAt: string;
}): string {
  return crypto
    .createHash("sha256")
    .update(
      `${payload.ticketNumber}|${payload.truckPlate}|${payload.netWeightKg}|${payload.weighOutAt}|HERAT-MOMP-SALT`
    )
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
}

const initialState: ErpServerState = {
  usdToAfn: DEFAULT_USD_TO_AFN,
  zones: [
    {
      id: "zone-ghr-01",
      code: "GHR-PIT-01",
      region: "Ghoryan",
      nameEn: "Ghoryan North Rock Pit",
      nameFa: "گودال سنگ نمک شمال غوریان",
      namePs: "د غوریان شمالي ډبرین کنده",
      zoneType: "PIT",
      gpsCoords: "34.3421° N, 61.4912° E",
      estimatedReservesMt: 420000,
      dailyTargetMt: 180,
      todayExtractedMt: 148.5,
      isActive: true,
    },
    {
      id: "zone-ghr-02",
      code: "GHR-TUN-02",
      region: "Ghoryan",
      nameEn: "Ghoryan Deep Seam Tunnel B",
      nameFa: "تونل رگه عمیق غوریان ب",
      namePs: "د غوریان ژور تونل ب",
      zoneType: "TUNNEL",
      gpsCoords: "34.3389° N, 61.4875° E",
      estimatedReservesMt: 285000,
      dailyTargetMt: 110,
      todayExtractedMt: 94.0,
      isActive: true,
    },
    {
      id: "zone-khs-01",
      code: "KHS-PAN-03",
      region: "Kuhsan",
      nameEn: "Kuhsan Solar Brine Pan #3",
      nameFa: "حوضچه تبخیر آفتابی کهسان ۳",
      namePs: "د کهسان لمریز تبخیر حوض ۳",
      zoneType: "BRINE_PAN",
      gpsCoords: "34.6510° N, 61.1984° E",
      estimatedReservesMt: 165000,
      dailyTargetMt: 95,
      todayExtractedMt: 82.4,
      isActive: true,
    },
  ],
  extractionLogs: [
    {
      id: "ext-101",
      clientSyncId: "c1010000-0000-4000-8000-000000000101",
      zoneId: "zone-ghr-01",
      zoneCode: "GHR-PIT-01",
      shiftCode: "SHIFT_A_DAY",
      logDate: "2026-11-18",
      method: "ROCK_BLASTING_CUTTING",
      rawTonnageMt: 148.5,
      crewLeadName: "Eng.Ahmadullah Noori",
      equipmentCode: "EXC-CAT336-02",
      fuelUsedL: 310,
      engineHoursDelta: 7.5,
      moisturePct: 2.1,
      notes: "High-purity white rock seam reached at 18m bench.",
      offlineCreatedAt: "2026-11-18T06:30:00Z",
      syncedAt: "2026-11-18T06:32:10Z",
      syncState: "SYNCED",
    },
    {
      id: "ext-102",
      clientSyncId: "c1010000-0000-4000-8000-000000000102",
      zoneId: "zone-ghr-02",
      zoneCode: "GHR-TUN-02",
      shiftCode: "SHIFT_A_DAY",
      logDate: "2026-11-18",
      method: "ROCK_BLASTING_CUTTING",
      rawTonnageMt: 94.0,
      crewLeadName: "Zabihullah Karimi",
      equipmentCode: "LDR-KOM950-01",
      fuelUsedL: 220,
      engineHoursDelta: 6.8,
      moisturePct: 1.8,
      notes: "Ventilation dust check passed (PM10 within limit).",
      offlineCreatedAt: "2026-11-18T07:15:00Z",
      syncedAt: "2026-11-18T07:15:05Z",
      syncState: "SYNCED",
    },
    {
      id: "ext-103",
      clientSyncId: "c1010000-0000-4000-8000-000000000103",
      zoneId: "zone-khs-01",
      zoneCode: "KHS-PAN-03",
      shiftCode: "SHIFT_A_DAY",
      logDate: "2026-11-18",
      method: "SOLAR_EVAPORATION",
      rawTonnageMt: 82.4,
      crewLeadName: "Haji Gulabuddin",
      equipmentCode: "TRK-HINO-05",
      fuelUsedL: 145,
      engineHoursDelta: 5.5,
      moisturePct: 4.6,
      notes: "Harvested crust from east brine crystallizer.",
      offlineCreatedAt: "2026-11-18T08:05:00Z",
      syncedAt: "2026-11-18T08:12:00Z",
      syncState: "SYNCED",
    },
  ],
  weighbridgeTickets: [
    {
      id: "tkt-201",
      clientSyncId: "d2010000-0000-4000-8000-000000000201",
      ticketNumber: "KNT-2026-001842",
      direction: "OUTBOUND_DISPATCH",
      status: "ACTIVE",
      truckPlate: "HRT-48291",
      driverName: "Mohammad Naser",
      driverTazkira: "1398-0402-88412",
      counterpartyName: " Khorasan Food Industries (Mashhad Export)",
      paymentMethod: "HAWALA",
      hawalaRef: "Saraf Aria-Herat #HW-9921",
      zoneCode: "GHR-PIT-01",
      saltGrade: "REFINED_IODIZED_25KG",
      destinationType: "ISLAM_QALA_EXPORT",
      destinationDetail: "Islam Qala Customs Gate -> Mashhad",
      grossWeightKg: 38450,
      tareWeightKg: 13450,
      netWeightKg: 25000,
      unitPriceAfnPerMt: 6800,
      lockedUsdToAfn: 71.5,
      scaleDeviceId: "KANTA-GHR-01",
      qrPayloadHash: "8F2A91C4B0E3D7721940A12C",
      weighOutAt: "2026-11-18T07:45:00Z",
      operatorName: "Fardin Ahmadi",
      offlineCreatedAt: "2026-11-18T07:45:00Z",
      syncedAt: "2026-11-18T07:45:12Z",
      syncState: "SYNCED",
    },
    {
      id: "tkt-202",
      clientSyncId: "d2010000-0000-4000-8000-000000000202",
      ticketNumber: "KNT-2026-001843",
      direction: "OUTBOUND_DISPATCH",
      status: "ACTIVE",
      truckPlate: "HRT-19044",
      driverName: "Abdul Qadir",
      driverTazkira: "1400-0119-44210",
      counterpartyName: "Herat Central Salt Wholesalers",
      paymentMethod: "CASH",
      zoneCode: "GHR-TUN-02",
      saltGrade: "INDUSTRIAL_RAW_ROCK",
      destinationType: "HERAT_LOCAL",
      destinationDetail: "Herat Industrial Park Phase 2",
      grossWeightKg: 42100,
      tareWeightKg: 14100,
      netWeightKg: 28000,
      unitPriceAfnPerMt: 3200,
      lockedUsdToAfn: 71.5,
      scaleDeviceId: "KANTA-GHR-01",
      qrPayloadHash: "4C7E19D8A2F05B3188C2E019",
      weighOutAt: "2026-11-18T08:20:00Z",
      operatorName: "Fardin Ahmadi",
      offlineCreatedAt: "2026-11-18T08:20:00Z",
      syncedAt: "2026-11-18T08:20:08Z",
      syncState: "SYNCED",
    },
    {
      id: "tkt-203",
      clientSyncId: "d2010000-0000-4000-8000-000000000203",
      ticketNumber: "KNT-2026-001844",
      direction: "OUTBOUND_DISPATCH",
      status: "VOID_PENDING",
      truckPlate: "KBL-77310",
      driverName: "Shir Agha",
      driverTazkira: "1395-0881-12093",
      counterpartyName: "Mazar Livestock Co-op",
      paymentMethod: "BANK_TRANSFER",
      zoneCode: "KHS-PAN-03",
      saltGrade: "LIVESTOCK_SALT_BLOCK",
      destinationType: "TORGHUNDI_EXPORT",
      destinationDetail: "Torghundi Rail/Road Staging",
      grossWeightKg: 31200,
      tareWeightKg: 11200,
      netWeightKg: 20000,
      unitPriceAfnPerMt: 5400,
      lockedUsdToAfn: 71.5,
      scaleDeviceId: "KANTA-KHS-02",
      qrPayloadHash: "9A11D3F7E4C802B516D9F304",
      weighOutAt: "2026-11-18T08:50:00Z",
      operatorName: "Fardin Ahmadi",
      voidReason: "Truck axle hydraulic fault at gate; cargo transferred to HRT-55102.",
      offlineCreatedAt: "2026-11-18T08:50:00Z",
      syncedAt: "2026-11-18T08:50:15Z",
      syncState: "SYNCED",
    },
  ],
  auditLogs: [
    {
      id: "aud-01",
      tableName: "weighbridge_tickets",
      recordRef: "KNT-2026-001842",
      action: "INSERT",
      summary: "Issued 25.00 MT Refined Iodized (Islam Qala Export) — QR 8F2A91C4...",
      actorName: "Fardin Ahmadi",
      actorRole: "WEIGHBRIDGE_CLERK",
      createdAt: "2026-11-18T07:45:12Z",
    },
    {
      id: "aud-02",
      tableName: "weighbridge_tickets",
      recordRef: "KNT-2026-001844",
      action: "VOID_REQUEST",
      summary: "Clerk requested void: Truck axle hydraulic fault at gate.",
      actorName: "Fardin Ahmadi",
      actorRole: "WEIGHBRIDGE_CLERK",
      createdAt: "2026-11-18T08:54:00Z",
    },
  ],
  weeklySeries: [
    { day: "Sat", extractedMt: 295, processedMt: 240, dispatchedMt: 215 },
    { day: "Sun", extractedMt: 318, processedMt: 265, dispatchedMt: 248 },
    { day: "Mon", extractedMt: 340, processedMt: 280, dispatchedMt: 270 },
    { day: "Tue", extractedMt: 310, processedMt: 275, dispatchedMt: 260 },
    { day: "Wed", extractedMt: 355, processedMt: 298, dispatchedMt: 285 },
    { day: "Thu", extractedMt: 332, processedMt: 290, dispatchedMt: 274 },
    { day: "Fri", extractedMt: 324.9, processedMt: 282, dispatchedMt: 268 },
  ],
  warehouses: [
    {
      id: "wh-ghr-site",
      code: "WH-GHR-SITE",
      nameEn: "Ghoryan On-Site Stockpile",
      nameFa: "ذخیره‌گاه ساحوی غوریان",
      namePs: "د غوریان ساحوي زېرمه",
      locationType: "ON_SITE_STOCKPILE",
      capacityMt: 15000,
    },
    {
      id: "wh-hrt-depot",
      code: "WH-HRT-CITY",
      nameEn: "Herat Industrial Park Depot",
      nameFa: "گدام شهرک صنعتی هرات",
      namePs: "د هرات صنعتي ښارګوټي ګودام",
      locationType: "HERAT_CITY_DEPOT",
      capacityMt: 6500,
    },
    {
      id: "wh-isl-border",
      code: "WH-ISQ-STG",
      nameEn: "Islam Qala Border Staging",
      nameFa: "گدام مرزی اسلام‌قلعه",
      namePs: "د اسلام‌قلعه سرحدي تمځای",
      locationType: "BORDER_STAGING",
      capacityMt: 2500,
    },
  ],
  warehouseStock: [
    {
      warehouseId: "wh-ghr-site",
      warehouseCode: "WH-GHR-SITE",
      saltGrade: "INDUSTRIAL_RAW_ROCK",
      quantityMt: 4820.5,
    },
    {
      warehouseId: "wh-ghr-site",
      warehouseCode: "WH-GHR-SITE",
      saltGrade: "REFINED_IODIZED_25KG",
      quantityMt: 612.0,
    },
    {
      warehouseId: "wh-hrt-depot",
      warehouseCode: "WH-HRT-CITY",
      saltGrade: "REFINED_IODIZED_25KG",
      quantityMt: 440.0,
    },
    {
      warehouseId: "wh-hrt-depot",
      warehouseCode: "WH-HRT-CITY",
      saltGrade: "REFINED_IODIZED_1KG",
      quantityMt: 118.5,
    },
    {
      warehouseId: "wh-isl-border",
      warehouseCode: "WH-ISQ-STG",
      saltGrade: "LIVESTOCK_SALT_BLOCK",
      quantityMt: 290.0,
    },
  ],
  processingBatches: [
    {
      id: "proc-01",
      batchCode: "PRC-2026-0412",
      intakeTonnageMt: 120.0,
      outputTonnageMt: 105.6,
      shrinkageMt: 14.4,
      saltGrade: "REFINED_IODIZED_25KG",
      iodinePpm: 42.5,
      moistureAfterPct: 0.45,
      warehouseId: "wh-hrt-depot",
      warehouseCode: "WH-HRT-CITY",
      supervisorName: "Eng. Jawid Sadat",
      processedAt: "2026-11-18T06:00:00Z",
    },
    {
      id: "proc-02",
      batchCode: "PRC-2026-0413",
      intakeTonnageMt: 85.0,
      outputTonnageMt: 78.2,
      shrinkageMt: 6.8,
      saltGrade: "LIVESTOCK_SALT_BLOCK",
      iodinePpm: 0,
      moistureAfterPct: 1.1,
      warehouseId: "wh-isl-border",
      warehouseCode: "WH-ISQ-STG",
      supervisorName: "Eng. Jawid Sadat",
      processedAt: "2026-11-18T08:10:00Z",
    },
  ],
  customers: [
    {
      id: "cust-01",
      code: "CUS-EXP-001",
      companyName: "Khorasan Food Industries (Mashhad)",
      customerType: "EXPORT_BUYER",
      phone: "+93 799 214 880",
      creditLimitAfn: 2500000,
      outstandingAfn: 480000,
      preferredCurrency: "USD",
    },
    {
      id: "cust-02",
      code: "CUS-HRT-014",
      companyName: "Herat Central Salt Wholesalers",
      customerType: "WHOLESALER",
      phone: "+93 700 412 091",
      creditLimitAfn: 1200000,
      outstandingAfn: 195000,
      preferredCurrency: "AFN",
    },
    {
      id: "cust-03",
      code: "CUS-GOV-003",
      companyName: "Western Provinces Municipal De-Icing Tender",
      customerType: "GOV_TENDER",
      phone: "+93 798 110 340",
      creditLimitAfn: 4000000,
      outstandingAfn: 920000,
      preferredCurrency: "AFN",
    },
  ],
  financialLedger: [
    {
      id: "fin-01",
      entryType: "RECEIVABLE_PAYMENT",
      counterparty: "Khorasan Food Industries (Mashhad)",
      currency: "USD",
      amount: 4500,
      lockedUsdToAfn: 71.5,
      amountAfnEquiv: 321750,
      method: "HAWALA",
      hawalaSarafName: "Saraf Aria (Herat Chowk Gulha)",
      hawalaCode: "HW-9921-KHR",
      recordedBy: "Finance Officer",
      recordedAt: "2026-11-18T08:00:00Z",
    },
    {
      id: "fin-02",
      entryType: "SUPPLIER_BILL",
      counterparty: "Herat Industrial Fuel & Diesel Co.",
      currency: "AFN",
      amount: 145000,
      lockedUsdToAfn: 71.5,
      amountAfnEquiv: 145000,
      method: "BANK_TRANSFER",
      bankRef: "AIB-TXN-884120",
      recordedBy: "Finance Officer",
      recordedAt: "2026-11-18T08:30:00Z",
    },
  ],
  mompRoyalties: [
    {
      id: "momp-01",
      periodLabel: "2026-11 (Current Cycle)",
      extractedMt: 2274.9,
      exportedMt: 640.0,
      royaltyRateAfnPerMt: 350,
      totalRoyaltyAfn: 796215,
      customsBorderRef: "ISQ-CUS-2026-4410",
      status: "PENDING",
    },
    {
      id: "momp-02",
      periodLabel: "2026-10 (Closed Cycle)",
      extractedMt: 8920.0,
      exportedMt: 2150.0,
      royaltyRateAfnPerMt: 350,
      totalRoyaltyAfn: 3122000,
      customsBorderRef: "ISQ-CUS-2026-3982",
      status: "PAID",
    },
  ],
  payrollRecords: [
    {
      id: "emp-01",
      employeeCode: "EMP-GHR-011",
      fullName: "Eng. Ahmadullah Noori",
      tazkiraNo: "1391-0512-33104",
      roleTitle: "Pit Shift Supervisor",
      daysWorked: 26,
      dailyWageAfn: 950,
      tonBonusAfn: 6400,
      overtimeAfn: 1800,
      advancesDeductionAfn: 2000,
      netPayableAfn: 30900,
    },
    {
      id: "emp-02",
      employeeCode: "EMP-GHR-024",
      fullName: "Zabihullah Karimi",
      tazkiraNo: "1396-0901-77215",
      roleTitle: "CAT 336 Excavator Operator",
      daysWorked: 26,
      dailyWageAfn: 850,
      tonBonusAfn: 4200,
      overtimeAfn: 1500,
      advancesDeductionAfn: 0,
      netPayableAfn: 27800,
    },
    {
      id: "emp-03",
      employeeCode: "EMP-KHS-008",
      fullName: "Haji Gulabuddin",
      tazkiraNo: "1388-0218-19044",
      roleTitle: "Solar Brine Pan Lead",
      daysWorked: 25,
      dailyWageAfn: 700,
      tonBonusAfn: 3100,
      overtimeAfn: 900,
      advancesDeductionAfn: 1500,
      netPayableAfn: 20000,
    },
    {
      id: "emp-04",
      employeeCode: "EMP-KNT-002",
      fullName: "Fardin Ahmadi",
      tazkiraNo: "1399-1104-60122",
      roleTitle: "Weighbridge (Kanta) Clerk",
      daysWorked: 26,
      dailyWageAfn: 680,
      tonBonusAfn: 0,
      overtimeAfn: 1200,
      advancesDeductionAfn: 1000,
      netPayableAfn: 17880,
    },
  ],
  hseIncidents: [
    {
      id: "hse-01",
      zoneCode: "GHR-TUN-02",
      incidentType: "DUST_EXCEEDANCE",
      severity: "LOW",
      description: "Routine PM10 check after blasting; misting fans activated for 20 mins.",
      ppeCompliant: true,
      reportedBy: "HSE & Compliance",
      reportedAt: "2026-11-18T07:20:00Z",
    },
    {
      id: "hse-02",
      zoneCode: "GHR-PIT-01",
      incidentType: "NEAR_MISS",
      severity: "MEDIUM",
      description: "Dump truck reversing alarm replaced immediately during Shift A inspection.",
      ppeCompliant: true,
      reportedBy: "HSE & Compliance",
      reportedAt: "2026-11-18T08:40:00Z",
    },
  ],
  fleetAssets: [
    {
      id: "flt-01",
      assetCode: "EXC-CAT336-02",
      name: "CAT 336D Hydraulic Excavator",
      category: "EXCAVATOR",
      engineHours: 4892.5,
      nextServiceHours: 5000,
      status: "OPERATIONAL",
      lastServiceDate: "2026-10-22",
      downtimeHoursMonth: 2.0,
    },
    {
      id: "flt-02",
      assetCode: "LDR-KOM950-01",
      name: "Komatsu WA470 Wheel Loader",
      category: "LOADER",
      engineHours: 3510.0,
      nextServiceHours: 3500,
      status: "SERVICE_DUE",
      lastServiceDate: "2026-09-14",
      downtimeHoursMonth: 6.5,
      lastNote: "500-hr hydraulic filter service overdue by 10 hrs.",
    },
    {
      id: "flt-03",
      assetCode: "CRUSH-METSO-01",
      name: "Metso Primary Jaw Crusher",
      category: "CRUSHER",
      engineHours: 6120.0,
      nextServiceHours: 6500,
      status: "OPERATIONAL",
      lastServiceDate: "2026-11-01",
      downtimeHoursMonth: 1.5,
    },
    {
      id: "flt-04",
      assetCode: "TRK-HINO-05",
      name: "Hino 700 25-Ton Dump Truck",
      category: "DUMP_TRUCK",
      engineHours: 2940.0,
      nextServiceHours: 3000,
      status: "MAINTENANCE",
      lastServiceDate: "2026-10-28",
      downtimeHoursMonth: 11.0,
      lastNote: "Rear leaf spring replacement in Ghoryan workshop.",
    },
  ],
  inventoryTransfers: [
    {
      id: "trf-01",
      transferCode: "TRF-2026-0192",
      type: "TRANSFER",
      fromWarehouseCode: "WH-GHR-SITE",
      toWarehouseCode: "WH-HRT-CITY",
      saltGrade: "REFINED_IODIZED_25KG",
      quantityMt: 65.0,
      reason: "Replenish Herat Industrial Park distribution stock",
      recordedBy: "Warehouse Officer",
      createdAt: "2026-11-18T07:10:00Z",
    },
    {
      id: "trf-02",
      transferCode: "ADJ-2026-0044",
      type: "SHRINKAGE_ADJUSTMENT",
      fromWarehouseCode: "WH-GHR-SITE",
      saltGrade: "INDUSTRIAL_RAW_ROCK",
      quantityMt: 8.5,
      reason: "Seasonal moisture loss audit on outdoor stockpile",
      recordedBy: "Warehouse Officer",
      createdAt: "2026-11-18T08:00:00Z",
    },
  ],
  contracts: [
    {
      id: "ctr-01",
      contractCode: "CTR-EXP-2026-01",
      customerName: "Khorasan Food Industries (Mashhad)",
      saltGrade: "REFINED_IODIZED_25KG",
      contractedMt: 1500,
      deliveredMt: 640,
      tierPriceAfnPerMt: 6800,
      currency: "USD",
      validUntil: "2027-03-31",
      status: "ACTIVE",
    },
    {
      id: "ctr-02",
      contractCode: "CTR-GOV-2026-04",
      customerName: "Western Provinces Municipal De-Icing Tender",
      saltGrade: "DEICING_CHEMICAL",
      contractedMt: 2000,
      deliveredMt: 820,
      tierPriceAfnPerMt: 3600,
      currency: "AFN",
      validUntil: "2027-02-28",
      status: "ACTIVE",
    },
  ],
  invoices: [
    {
      id: "inv-01",
      invoiceNumber: "INV-2026-0881",
      ticketNumber: "KNT-2026-001842",
      customerName: "Khorasan Food Industries (Mashhad)",
      quantityMt: 25.0,
      totalAfn: 170000,
      paidAfn: 120000,
      lockedUsdToAfn: 71.5,
      status: "PARTIAL",
      issuedAt: "2026-11-18T07:50:00Z",
    },
    {
      id: "inv-02",
      invoiceNumber: "INV-2026-0882",
      ticketNumber: "KNT-2026-001843",
      customerName: "Herat Central Salt Wholesalers",
      quantityMt: 28.0,
      totalAfn: 89600,
      paidAfn: 89600,
      lockedUsdToAfn: 71.5,
      status: "PAID",
      issuedAt: "2026-11-18T08:25:00Z",
    },
  ],
  attendanceRecords: [
    {
      id: "att-01",
      clientSyncId: "a1000000-0000-4000-8000-000000000001",
      employeeCode: "EMP-GHR-011",
      fullName: "Eng. Ahmadullah Noori",
      shiftCode: "SHIFT_A_DAY",
      method: "BIOMETRIC_FINGERPRINT",
      checkInAt: "2026-11-18T05:55:00Z",
      status: "PRESENT",
      syncState: "SYNCED",
    },
    {
      id: "att-02",
      clientSyncId: "a1000000-0000-4000-8000-000000000002",
      employeeCode: "EMP-GHR-024",
      fullName: "Zabihullah Karimi",
      shiftCode: "SHIFT_A_DAY",
      method: "TAZKIRA_RFID",
      checkInAt: "2026-11-18T06:04:00Z",
      status: "PRESENT",
      syncState: "SYNCED",
    },
  ],
  ppeIssuances: [
    {
      id: "ppe-01",
      employeeCode: "EMP-GHR-011",
      fullName: "Eng. Ahmadullah Noori",
      items: "N95 Dust Respirator (x5), Hard Hat, Safety Boots",
      issuedDate: "2026-11-15",
      inspector: "Dr. Zabiullah Rahimi",
    },
    {
      id: "ppe-02",
      employeeCode: "EMP-KHS-008",
      fullName: "Haji Gulabuddin",
      items: "UV Polarized Goggles, Salt-Resistant Rubber Boots, Gloves",
      issuedDate: "2026-11-16",
      inspector: "Dr. Zabiullah Rahimi",
    },
  ],
};

// Persist across hot-reloads in Next.js dev server
const globalForErp = globalThis as unknown as { erpStore?: ErpServerState };
export const erpStore: ErpServerState =
  globalForErp.erpStore ?? structuredClone(initialState);
if (process.env.NODE_ENV !== "production") {
  globalForErp.erpStore = erpStore;
}

export function addWeighbridgeTicketServer(
  input: Omit<
    WeighbridgeTicket,
    "id" | "ticketNumber" | "netWeightKg" | "qrPayloadHash" | "syncedAt" | "syncState"
  >,
  actorRole: UserRole
): WeighbridgeTicket {
  // Idempotency check for offline sync
  const existing = erpStore.weighbridgeTickets.find(
    (t) => t.clientSyncId === input.clientSyncId
  );
  if (existing) return existing;

  if (input.grossWeightKg <= input.tareWeightKg) {
    throw new Error("Gross weight must exceed Tare weight.");
  }

  const netWeightKg = input.grossWeightKg - input.tareWeightKg;
  const seq = 1845 + erpStore.weighbridgeTickets.length;
  const ticketNumber = `KNT-2026-${String(seq).padStart(6, "0")}`;
  const qrPayloadHash = generateQrHash({
    ticketNumber,
    truckPlate: input.truckPlate,
    netWeightKg,
    weighOutAt: input.weighOutAt,
  });

  const ticket: WeighbridgeTicket = {
    ...input,
    id: `tkt-${crypto.randomUUID().slice(0, 8)}`,
    ticketNumber,
    netWeightKg,
    qrPayloadHash,
    syncedAt: new Date().toISOString(),
    syncState: "SYNCED",
  };

  erpStore.weighbridgeTickets.unshift(ticket);
  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "weighbridge_tickets",
    recordRef: ticket.ticketNumber,
    action: "INSERT",
    summary: `Issued ${(netWeightKg / 1000).toFixed(2)} MT (${ticket.saltGrade}) for ${ticket.truckPlate}`,
    actorName: ticket.operatorName,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return ticket;
}

export function voidWeighbridgeTicketServer(
  ticketId: string,
  action: "REQUEST" | "APPROVE",
  reason: string,
  actorName: string,
  actorRole: UserRole
): WeighbridgeTicket {
  const ticket = erpStore.weighbridgeTickets.find((t) => t.id === ticketId);
  if (!ticket) throw new Error("Ticket not found");

  if (action === "APPROVE") {
    if (!ROLE_PERMISSIONS[actorRole].canApproveVoidTicket) {
      throw new Error(
        "SECURITY VIOLATION: Supervisor role (Mine Owner or Site Ops Manager) required to approve voiding."
      );
    }
    ticket.status = "VOIDED";
    ticket.voidReason = reason || ticket.voidReason || "Supervisor approved void";
    ticket.voidApprovedBy = actorName;

    erpStore.auditLogs.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      tableName: "weighbridge_tickets",
      recordRef: ticket.ticketNumber,
      action: "VOID_APPROVE",
      summary: `Void approved by ${actorName}: ${ticket.voidReason}`,
      actorName,
      actorRole,
      createdAt: new Date().toISOString(),
    });
  } else {
    ticket.status = "VOID_PENDING";
    ticket.voidReason = reason;

    erpStore.auditLogs.unshift({
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      tableName: "weighbridge_tickets",
      recordRef: ticket.ticketNumber,
      action: "VOID_REQUEST",
      summary: `Void requested: ${reason}`,
      actorName,
      actorRole,
      createdAt: new Date().toISOString(),
    });
  }

  return ticket;
}

export function addExtractionLogServer(
  input: Omit<ExtractionLog, "id" | "syncedAt" | "syncState">,
  actorRole: UserRole
): ExtractionLog {
  const existing = erpStore.extractionLogs.find(
    (e) => e.clientSyncId === input.clientSyncId
  );
  if (existing) return existing;

  const log: ExtractionLog = {
    ...input,
    id: `ext-${crypto.randomUUID().slice(0, 8)}`,
    syncedAt: new Date().toISOString(),
    syncState: "SYNCED",
  };

  erpStore.extractionLogs.unshift(log);
  const zone = erpStore.zones.find((z) => z.id === log.zoneId);
  if (zone) {
    zone.todayExtractedMt = Number(
      (zone.todayExtractedMt + log.rawTonnageMt).toFixed(2)
    );
  }

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "extraction_logs",
    recordRef: log.zoneCode,
    action: "INSERT",
    summary: `Logged ${log.rawTonnageMt} MT (${log.method}) by ${log.crewLeadName}`,
    actorName: log.crewLeadName,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return log;
}

export function addProcessingBatchServer(
  input: Omit<ProcessingBatch, "id" | "batchCode" | "shrinkageMt" | "processedAt">,
  actorRole: UserRole
): ProcessingBatch {
  if (!ROLE_PERMISSIONS[actorRole].canManageProcessing) {
    throw new Error("RBAC: Role cannot record processing batches.");
  }
  if (input.outputTonnageMt > input.intakeTonnageMt) {
    throw new Error("Output tonnage cannot exceed raw intake tonnage.");
  }

  const shrinkageMt = Number(
    (input.intakeTonnageMt - input.outputTonnageMt).toFixed(2)
  );
  const seq = 414 + erpStore.processingBatches.length;
  const batch: ProcessingBatch = {
    ...input,
    id: `proc-${crypto.randomUUID().slice(0, 8)}`,
    batchCode: `PRC-2026-0${seq}`,
    shrinkageMt,
    processedAt: new Date().toISOString(),
  };
  erpStore.processingBatches.unshift(batch);

  // Update warehouse stock
  const existingStock = erpStore.warehouseStock.find(
    (s) => s.warehouseId === batch.warehouseId && s.saltGrade === batch.saltGrade
  );
  if (existingStock) {
    existingStock.quantityMt = Number(
      (existingStock.quantityMt + batch.outputTonnageMt).toFixed(2)
    );
  } else {
    erpStore.warehouseStock.push({
      warehouseId: batch.warehouseId,
      warehouseCode: batch.warehouseCode,
      saltGrade: batch.saltGrade,
      quantityMt: batch.outputTonnageMt,
    });
  }

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "processing_batches",
    recordRef: batch.batchCode,
    action: "INSERT",
    summary: `Processed ${batch.outputTonnageMt} MT (${batch.saltGrade}, ${batch.iodinePpm} ppm I2) into ${batch.warehouseCode}`,
    actorName: batch.supervisorName,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return batch;
}

export function addFinancialEntryServer(
  input: Omit<FinancialEntry, "id" | "amountAfnEquiv" | "recordedAt">,
  actorRole: UserRole
): FinancialEntry {
  if (!ROLE_PERMISSIONS[actorRole].canManageFinance) {
    throw new Error("RBAC: Only Mine Owner or Finance Officer can post financial entries.");
  }
  const amountAfnEquiv =
    input.currency === "USD"
      ? Number((input.amount * input.lockedUsdToAfn).toFixed(2))
      : input.amount;

  const entry: FinancialEntry = {
    ...input,
    id: `fin-${crypto.randomUUID().slice(0, 8)}`,
    amountAfnEquiv,
    recordedAt: new Date().toISOString(),
  };
  erpStore.financialLedger.unshift(entry);

  if (entry.entryType === "RECEIVABLE_PAYMENT") {
    const cust = erpStore.customers.find(
      (c) => c.companyName.toLowerCase() === entry.counterparty.toLowerCase()
    );
    if (cust) {
      cust.outstandingAfn = Math.max(0, cust.outstandingAfn - amountAfnEquiv);
    }
  }

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "financial_ledger",
    recordRef: entry.hawalaCode || entry.bankRef || entry.id.toUpperCase(),
    action: "INSERT",
    summary: `${entry.entryType}: ${entry.amount} ${entry.currency} via ${entry.method} (${entry.counterparty})`,
    actorName: entry.recordedBy,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return entry;
}

export function updateRoyaltyStatusServer(
  royaltyId: string,
  status: "FILED" | "PAID",
  actorName: string,
  actorRole: UserRole
): MompRoyaltyAssessment {
  if (!ROLE_PERMISSIONS[actorRole].canManageFinance) {
    throw new Error("RBAC: Only Mine Owner or Finance Officer can update MoMP royalty status.");
  }
  const item = erpStore.mompRoyalties.find((r) => r.id === royaltyId);
  if (!item) throw new Error("Royalty assessment not found");
  item.status = status;

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "financial_ledger",
    recordRef: item.customsBorderRef,
    action: "STATUS_UPDATE",
    summary: `MoMP Royalty (${item.periodLabel}) marked ${status}`,
    actorName,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return item;
}

export function addHseIncidentServer(
  input: Omit<HseIncident, "id" | "reportedAt">,
  actorRole: UserRole
): HseIncident {
  if (!ROLE_PERMISSIONS[actorRole].canLogHse) {
    throw new Error("RBAC: Role cannot log HSE incidents.");
  }
  const incident: HseIncident = {
    ...input,
    id: `hse-${crypto.randomUUID().slice(0, 8)}`,
    reportedAt: new Date().toISOString(),
  };
  erpStore.hseIncidents.unshift(incident);

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "hse_incidents",
    recordRef: incident.zoneCode,
    action: "INSERT",
    summary: `HSE ${incident.severity} ${incident.incidentType}: ${incident.description.slice(0, 60)}`,
    actorName: incident.reportedBy,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return incident;
}

export function logFleetMaintenanceServer(
  assetId: string,
  action: "COMPLETE_SERVICE" | "LOG_BREAKDOWN",
  downtimeDeltaHrs: number,
  note: string,
  actorName: string,
  actorRole: UserRole
): FleetAsset {
  if (!ROLE_PERMISSIONS[actorRole].canCreateExtractionLog) {
    throw new Error("RBAC: Only Mine Owner or Site Ops Manager can update fleet maintenance.");
  }
  const asset = erpStore.fleetAssets.find((a) => a.id === assetId);
  if (!asset) throw new Error("Fleet asset not found");

  if (action === "COMPLETE_SERVICE") {
    asset.status = "OPERATIONAL";
    asset.lastServiceDate = new Date().toISOString().slice(0, 10);
    asset.nextServiceHours = Math.round(asset.engineHours + 500);
    asset.lastNote = note || "Preventive 500-hr service completed.";
  } else {
    asset.status = "MAINTENANCE";
    asset.downtimeHoursMonth = Number(
      (asset.downtimeHoursMonth + Math.max(0, downtimeDeltaHrs)).toFixed(1)
    );
    asset.lastNote = note || "Breakdown logged for workshop repair.";
  }

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "fleet_maintenance",
    recordRef: asset.assetCode,
    action: "STATUS_UPDATE",
    summary: `${action} on ${asset.assetCode}: ${asset.lastNote}`,
    actorName,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return asset;
}

export function addInventoryTransferServer(
  input: Omit<InventoryTransfer, "id" | "transferCode" | "createdAt">,
  actorRole: UserRole
): InventoryTransfer {
  if (!ROLE_PERMISSIONS[actorRole].canManageInventory) {
    throw new Error("RBAC: Role cannot record warehouse transfers or shrinkage.");
  }

  const fromStock = erpStore.warehouseStock.find(
    (s) =>
      s.warehouseCode === input.fromWarehouseCode &&
      s.saltGrade === input.saltGrade
  );
  if (fromStock) {
    fromStock.quantityMt = Math.max(
      0,
      Number((fromStock.quantityMt - input.quantityMt).toFixed(2))
    );
  }

  if (input.type === "TRANSFER" && input.toWarehouseCode) {
    const destWh = erpStore.warehouses.find(
      (w) => w.code === input.toWarehouseCode
    );
    const toStock = erpStore.warehouseStock.find(
      (s) =>
        s.warehouseCode === input.toWarehouseCode &&
        s.saltGrade === input.saltGrade
    );
    if (toStock) {
      toStock.quantityMt = Number(
        (toStock.quantityMt + input.quantityMt).toFixed(2)
      );
    } else if (destWh) {
      erpStore.warehouseStock.push({
        warehouseId: destWh.id,
        warehouseCode: destWh.code,
        saltGrade: input.saltGrade,
        quantityMt: input.quantityMt,
      });
    }
  }

  const prefix = input.type === "TRANSFER" ? "TRF" : "ADJ";
  const record: InventoryTransfer = {
    ...input,
    id: `trf-${crypto.randomUUID().slice(0, 8)}`,
    transferCode: `${prefix}-2026-0${200 + erpStore.inventoryTransfers.length}`,
    createdAt: new Date().toISOString(),
  };
  erpStore.inventoryTransfers.unshift(record);

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "inventory_transfers",
    recordRef: record.transferCode,
    action: "TRANSFER",
    summary:
      input.type === "TRANSFER"
        ? `Transferred ${input.quantityMt} MT (${input.saltGrade}) ${input.fromWarehouseCode} -> ${input.toWarehouseCode}`
        : `Shrinkage adjustment -${input.quantityMt} MT (${input.saltGrade}) at ${input.fromWarehouseCode}`,
    actorName: input.recordedBy,
    actorRole,
    createdAt: new Date().toISOString(),
  });

  return record;
}

export function addContractServer(
  input: Omit<TonnageContract, "id" | "contractCode" | "deliveredMt" | "status">,
  actorRole: UserRole
): TonnageContract {
  if (!ROLE_PERMISSIONS[actorRole].canManageFinance) {
    throw new Error("RBAC: Only Mine Owner or Finance Officer can create contracts.");
  }
  const contract: TonnageContract = {
    ...input,
    id: `ctr-${crypto.randomUUID().slice(0, 8)}`,
    contractCode: `CTR-2026-0${10 + erpStore.contracts.length}`,
    deliveredMt: 0,
    status: "ACTIVE",
  };
  erpStore.contracts.unshift(contract);
  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "contracts_invoices",
    recordRef: contract.contractCode,
    action: "INSERT",
    summary: `Signed ${contract.contractedMt} MT contract with ${contract.customerName}`,
    actorName: actorRole,
    actorRole,
    createdAt: new Date().toISOString(),
  });
  return contract;
}

export function recordInvoicePaymentServer(
  invoiceId: string,
  paymentAfn: number,
  actorName: string,
  actorRole: UserRole
): InvoiceRecord {
  if (!ROLE_PERMISSIONS[actorRole].canManageFinance) {
    throw new Error("RBAC: Only Mine Owner or Finance Officer can record invoice payments.");
  }
  const inv = erpStore.invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new Error("Invoice not found");
  inv.paidAfn = Math.min(inv.totalAfn, inv.paidAfn + paymentAfn);
  inv.status = inv.paidAfn >= inv.totalAfn ? "PAID" : "PARTIAL";

  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "contracts_invoices",
    recordRef: inv.invoiceNumber,
    action: "STATUS_UPDATE",
    summary: `Recorded ${paymentAfn} AFN payment on ${inv.invoiceNumber} -> ${inv.status}`,
    actorName,
    actorRole,
    createdAt: new Date().toISOString(),
  });
  return inv;
}

export function addAttendanceServer(
  input: Omit<AttendanceRecord, "id" | "syncState">,
  actorRole: UserRole
): AttendanceRecord {
  const existing = erpStore.attendanceRecords.find(
    (a) => a.clientSyncId === input.clientSyncId
  );
  if (existing) return existing;

  const rec: AttendanceRecord = {
    ...input,
    id: `att-${crypto.randomUUID().slice(0, 8)}`,
    syncState: "SYNCED",
  };
  erpStore.attendanceRecords.unshift(rec);
  erpStore.auditLogs.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    tableName: "attendance",
    recordRef: rec.employeeCode,
    action: "INSERT",
    summary: `${rec.fullName} checked in (${rec.method}) — ${rec.status}`,
    actorName: rec.fullName,
    actorRole,
    createdAt: new Date().toISOString(),
  });
  return rec;
}

export function addPpeIssuanceServer(
  input: Omit<PpeIssuance, "id">,
  actorRole: UserRole
): PpeIssuance {
  if (!ROLE_PERMISSIONS[actorRole].canLogHse) {
    throw new Error("RBAC: Role cannot issue PPE records.");
  }
  const rec: PpeIssuance = {
    ...input,
    id: `ppe-${crypto.randomUUID().slice(0, 8)}`,
  };
  erpStore.ppeIssuances.unshift(rec);
  return rec;
}


