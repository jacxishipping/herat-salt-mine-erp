export type LangCode = "en" | "fa" | "ps";
export type CurrencyCode = "AFN" | "USD";

export type UserRole =
  | "MINE_OWNER"
  | "SITE_OPS_MANAGER"
  | "WEIGHBRIDGE_CLERK"
  | "WAREHOUSE_OFFICER"
  | "FINANCE_OFFICER"
  | "HSE_COMPLIANCE_OFFICER";

export type SaltGrade =
  | "INDUSTRIAL_RAW_ROCK"
  | "REFINED_IODIZED_25KG"
  | "REFINED_IODIZED_50KG"
  | "REFINED_IODIZED_1KG"
  | "LIVESTOCK_SALT_BLOCK"
  | "DEICING_CHEMICAL";

export type TicketDirection = "INBOUND_SUPPLY" | "OUTBOUND_DISPATCH";
export type TicketStatus = "ACTIVE" | "VOID_PENDING" | "VOIDED";

export type DestinationType =
  | "HERAT_LOCAL"
  | "DOMESTIC_PROVINCE"
  | "ISLAM_QALA_EXPORT"
  | "TORGHUNDI_EXPORT";

export type ExtractionMethod = "ROCK_BLASTING_CUTTING" | "SOLAR_EVAPORATION";
export type SyncState = "SYNCED" | "PENDING_SYNC";

export interface MineZone {
  id: string;
  code: string;
  region: "Ghoryan" | "Kuhsan";
  nameEn: string;
  nameFa: string;
  namePs: string;
  zoneType: "PIT" | "TUNNEL" | "BRINE_PAN";
  gpsCoords: string;
  estimatedReservesMt: number;
  dailyTargetMt: number;
  todayExtractedMt: number;
  isActive: boolean;
}

export interface FleetAsset {
  id: string;
  assetCode: string;
  name: string;
  category: "EXCAVATOR" | "DUMP_TRUCK" | "LOADER" | "CRUSHER" | "GENERATOR";
  engineHours: number;
  nextServiceHours: number;
  status: "OPERATIONAL" | "SERVICE_DUE" | "MAINTENANCE" | "DOWN";
  lastServiceDate: string;
  downtimeHoursMonth: number;
  lastNote?: string;
}

export interface ExtractionLog {
  id: string;
  clientSyncId: string;
  zoneId: string;
  zoneCode: string;
  shiftCode: "SHIFT_A_DAY" | "SHIFT_B_NIGHT";
  logDate: string;
  method: ExtractionMethod;
  rawTonnageMt: number;
  crewLeadName: string;
  equipmentCode: string;
  fuelUsedL: number;
  engineHoursDelta: number;
  moisturePct: number;
  notes?: string;
  offlineCreatedAt: string;
  syncedAt?: string;
  syncState: SyncState;
}

export interface WeighbridgeTicket {
  id: string;
  clientSyncId: string;
  ticketNumber: string;
  direction: TicketDirection;
  status: TicketStatus;
  truckPlate: string;
  driverName: string;
  driverTazkira: string;
  counterpartyName: string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "HAWALA";
  hawalaRef?: string;
  zoneCode?: string;
  saltGrade: SaltGrade;
  destinationType: DestinationType;
  destinationDetail: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  unitPriceAfnPerMt: number;
  lockedUsdToAfn: number;
  scaleDeviceId: string;
  qrPayloadHash: string;
  weighOutAt: string;
  operatorName: string;
  voidReason?: string;
  voidApprovedBy?: string;
  offlineCreatedAt: string;
  syncedAt?: string;
  syncState: SyncState;
}

export interface AuditLogEntry {
  id: string;
  tableName:
    | "weighbridge_tickets"
    | "extraction_logs"
    | "financial_ledger"
    | "processing_batches"
    | "inventory_transfers"
    | "fleet_maintenance"
    | "contracts_invoices"
    | "hse_incidents"
    | "attendance";
  recordRef: string;
  action: "INSERT" | "VOID_REQUEST" | "VOID_APPROVE" | "SYNC_RECONCILE" | "STATUS_UPDATE" | "TRANSFER";
  summary: string;
  actorName: string;
  actorRole: UserRole;
  createdAt: string;
}

export interface DailyProductionPoint {
  day: string;
  extractedMt: number;
  processedMt: number;
  dispatchedMt: number;
}

export interface Warehouse {
  id: string;
  code: string;
  nameEn: string;
  nameFa: string;
  namePs: string;
  locationType: "ON_SITE_STOCKPILE" | "HERAT_CITY_DEPOT" | "BORDER_STAGING";
  capacityMt: number;
}

export interface WarehouseStockItem {
  warehouseId: string;
  warehouseCode: string;
  saltGrade: SaltGrade;
  quantityMt: number;
}

export interface InventoryTransfer {
  id: string;
  transferCode: string;
  type: "TRANSFER" | "SHRINKAGE_ADJUSTMENT";
  fromWarehouseCode: string;
  toWarehouseCode?: string;
  saltGrade: SaltGrade;
  quantityMt: number;
  reason: string;
  recordedBy: string;
  createdAt: string;
}

export interface ProcessingBatch {
  id: string;
  batchCode: string;
  intakeTonnageMt: number;
  outputTonnageMt: number;
  shrinkageMt: number;
  saltGrade: SaltGrade;
  iodinePpm: number;
  moistureAfterPct: number;
  warehouseId: string;
  warehouseCode: string;
  supervisorName: string;
  processedAt: string;
}

export interface CustomerAccount {
  id: string;
  code: string;
  companyName: string;
  customerType: "WHOLESALER" | "FOOD_PROCESSOR" | "GOV_TENDER" | "EXPORT_BUYER";
  phone: string;
  creditLimitAfn: number;
  outstandingAfn: number;
  preferredCurrency: CurrencyCode;
}

export interface TonnageContract {
  id: string;
  contractCode: string;
  customerName: string;
  saltGrade: SaltGrade;
  contractedMt: number;
  deliveredMt: number;
  tierPriceAfnPerMt: number;
  currency: CurrencyCode;
  validUntil: string;
  status: "ACTIVE" | "COMPLETED";
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  ticketNumber: string;
  customerName: string;
  quantityMt: number;
  totalAfn: number;
  paidAfn: number;
  lockedUsdToAfn: number;
  status: "ISSUED" | "PARTIAL" | "PAID";
  issuedAt: string;
}

export interface FinancialEntry {
  id: string;
  entryType: "RECEIVABLE_PAYMENT" | "SUPPLIER_BILL" | "ROYALTY_PAYMENT";
  counterparty: string;
  currency: CurrencyCode;
  amount: number;
  lockedUsdToAfn: number;
  amountAfnEquiv: number;
  method: "CASH" | "BANK_TRANSFER" | "HAWALA";
  hawalaSarafName?: string;
  hawalaCode?: string;
  bankRef?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MompRoyaltyAssessment {
  id: string;
  periodLabel: string;
  extractedMt: number;
  exportedMt: number;
  royaltyRateAfnPerMt: number;
  totalRoyaltyAfn: number;
  customsBorderRef: string;
  status: "PENDING" | "FILED" | "PAID";
}

export interface EmployeePayrollRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  tazkiraNo: string;
  roleTitle: string;
  daysWorked: number;
  dailyWageAfn: number;
  tonBonusAfn: number;
  overtimeAfn: number;
  advancesDeductionAfn: number;
  netPayableAfn: number;
}

export interface AttendanceRecord {
  id: string;
  clientSyncId: string;
  employeeCode: string;
  fullName: string;
  shiftCode: "SHIFT_A_DAY" | "SHIFT_B_NIGHT";
  method: "BIOMETRIC_FINGERPRINT" | "TAZKIRA_RFID";
  checkInAt: string;
  status: "PRESENT" | "LATE" | "ABSENT";
  syncState: SyncState;
}

export interface PpeIssuance {
  id: string;
  employeeCode: string;
  fullName: string;
  items: string;
  issuedDate: string;
  inspector: string;
}

export interface HseIncident {
  id: string;
  clientSyncId?: string;
  zoneCode: string;
  incidentType: "NEAR_MISS" | "INJURY" | "DUST_EXCEEDANCE" | "EQUIPMENT_HAZARD";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  ppeCompliant: boolean;
  reportedBy: string;
  reportedAt: string;
  syncState?: SyncState;
}
