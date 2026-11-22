using System;
using System.Collections.Generic;

namespace HeratSaltErp.Models;

public enum UserRole
{
    MINE_OWNER,
    SITE_OPS_MANAGER,
    WEIGHBRIDGE_CLERK,
    WAREHOUSE_OFFICER,
    FINANCE_OFFICER,
    HSE_COMPLIANCE_OFFICER
}

public enum LangCode { EN, FA, PS }
public enum CurrencyCode { AFN, USD }

public sealed class MineZone
{
    public string Code { get; set; } = "";
    public string Region { get; set; } = "Ghoryan";
    public string NameEn { get; set; } = "";
    public string NameFa { get; set; } = "";
    public string NamePs { get; set; } = "";
    public string ZoneType { get; set; } = "PIT";
    public double EstimatedReservesMt { get; set; }
    public double DailyTargetMt { get; set; }
    public double TodayExtractedMt { get; set; }
    public double ProgressPct => DailyTargetMt > 0 ? Math.Min(100, Math.Round((TodayExtractedMt / DailyTargetMt) * 100, 1)) : 0;
}

public sealed class FleetAsset
{
    public string AssetCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public double EngineHours { get; set; }
    public double NextServiceHours { get; set; }
    public string Status { get; set; } = "OPERATIONAL";
    public double DowntimeHoursMonth { get; set; }
    public string LastServiceDate { get; set; } = "";
}

public sealed class ExtractionLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string ClientSyncId { get; set; } = Guid.NewGuid().ToString();
    public string ZoneCode { get; set; } = "GHR-PIT-01";
    public string ShiftCode { get; set; } = "SHIFT_A_DAY";
    public string Method { get; set; } = "ROCK_BLASTING_CUTTING";
    public double RawTonnageMt { get; set; }
    public string CrewLeadName { get; set; } = "";
    public string EquipmentCode { get; set; } = "EXC-CAT336-02";
    public double FuelUsedL { get; set; }
    public double EngineHoursDelta { get; set; }
    public double MoisturePct { get; set; } = 2.4;
    public string SyncState { get; set; } = "SYNCED";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class WeighbridgeTicket
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string ClientSyncId { get; set; } = Guid.NewGuid().ToString();
    public string TicketNumber { get; set; } = "";
    public string Direction { get; set; } = "OUTBOUND_DISPATCH";
    public string Status { get; set; } = "ACTIVE";
    public string TruckPlate { get; set; } = "";
    public string DriverName { get; set; } = "";
    public string DriverTazkira { get; set; } = "";
    public string CounterpartyName { get; set; } = "";
    public string SaltGrade { get; set; } = "REFINED_IODIZED_25KG";
    public string DestinationType { get; set; } = "ISLAM_QALA_EXPORT";
    public double GrossWeightKg { get; set; }
    public double TareWeightKg { get; set; }
    public double NetWeightKg => Math.Max(0, GrossWeightKg - TareWeightKg);
    public double UnitPriceAfnPerMt { get; set; }
    public double LockedUsdToAfn { get; set; } = 71.50;
    public string PaymentMethod { get; set; } = "HAWALA";
    public string HawalaRef { get; set; } = "";
    public string ScaleDeviceId { get; set; } = "KANTA-GHR-01";
    public string QrPayloadHash { get; set; } = "";
    public string SyncState { get; set; } = "SYNCED";
    public string OperatorName { get; set; } = "";
    public string VoidReason { get; set; } = "";
    public string VoidApprovedBy { get; set; } = "";
    public DateTime WeighOutAt { get; set; } = DateTime.UtcNow;
}

public sealed class WarehouseStock
{
    public string WarehouseCode { get; set; } = "";
    public string WarehouseName { get; set; } = "";
    public string SaltGrade { get; set; } = "";
    public double QuantityMt { get; set; }
    public double CapacityMt { get; set; }
    public double UtilizationPct => CapacityMt > 0 ? Math.Min(100, Math.Round((QuantityMt / CapacityMt) * 100, 1)) : 0;
}

public sealed class InventoryTransfer
{
    public string TransferCode { get; set; } = "";
    public string TransferType { get; set; } = "TRANSFER"; // TRANSFER, SHRINKAGE_ADJUSTMENT
    public string FromWarehouse { get; set; } = "WH-GHR-SITE";
    public string ToWarehouse { get; set; } = "WH-HRT-CITY";
    public string SaltGrade { get; set; } = "REFINED_IODIZED_25KG";
    public double QuantityMt { get; set; }
    public string Reason { get; set; } = "";
    public string RecordedAt { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
}

public sealed class ProcessingBatch
{
    public string BatchCode { get; set; } = "";
    public string SaltGrade { get; set; } = "";
    public string WarehouseCode { get; set; } = "";
    public double IntakeMt { get; set; }
    public double OutputMt { get; set; }
    public double ShrinkageMt => Math.Round(IntakeMt - OutputMt, 2);
    public double IodinePpm { get; set; }
    public string Compliance => IodinePpm >= 30 && IodinePpm <= 60 ? "Food-Grade OK" : "Industrial";
}

public sealed class CustomerAccount
{
    public string Code { get; set; } = "";
    public string CompanyName { get; set; } = "";
    public string CustomerType { get; set; } = "WHOLESALER";
    public double CreditLimitAfn { get; set; }
    public double OutstandingAfn { get; set; }
    public double CreditPct => CreditLimitAfn > 0 ? Math.Min(100, Math.Round((OutstandingAfn / CreditLimitAfn) * 100, 1)) : 0;
}

public sealed class TonnageContract
{
    public string ContractCode { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string SaltGrade { get; set; } = "";
    public double ContractedMt { get; set; }
    public double DeliveredMt { get; set; }
    public double TierPriceAfnPerMt { get; set; }
    public double ProgressPct => ContractedMt > 0 ? Math.Min(100, Math.Round((DeliveredMt / ContractedMt) * 100, 1)) : 0;
}

public sealed class InvoiceRecord
{
    public string InvoiceNumber { get; set; } = "";
    public string TicketNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public double QuantityMt { get; set; }
    public double TotalAfn { get; set; }
    public double PaidAfn { get; set; }
    public double BalanceAfn => Math.Max(0, TotalAfn - PaidAfn);
    public string Status { get; set; } = "PARTIAL";
}

public sealed class FinancialEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string EntryType { get; set; } = "RECEIVABLE_PAYMENT";
    public string Counterparty { get; set; } = "";
    public string Currency { get; set; } = "USD";
    public double Amount { get; set; }
    public double LockedUsdToAfn { get; set; } = 71.50;
    public double AmountAfnEquiv => Currency == "USD" ? Math.Round(Amount * LockedUsdToAfn, 2) : Amount;
    public string Method { get; set; } = "HAWALA";
    public string Reference { get; set; } = "";
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

public sealed class MompRoyalty
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string PeriodLabel { get; set; } = "";
    public double ExtractedMt { get; set; }
    public double ExportedMt { get; set; }
    public string CustomsBorderRef { get; set; } = "";
    public double TotalRoyaltyAfn { get; set; }
    public string Status { get; set; } = "PENDING";
}

public sealed class EmployeePayroll
{
    public string EmployeeCode { get; set; } = "";
    public string FullName { get; set; } = "";
    public string TazkiraNo { get; set; } = "";
    public string RoleTitle { get; set; } = "";
    public string SiteZone { get; set; } = "GHR-PIT-01";
    public int DaysWorked { get; set; }
    public double DailyWageAfn { get; set; }
    public double TonBonusAfn { get; set; }
    public double AdvancesDeductionAfn { get; set; }
    public double NetPayableAfn => Math.Max(0, (DaysWorked * DailyWageAfn) + TonBonusAfn - AdvancesDeductionAfn);
    public string SalaryStatus { get; set; } = "UNPAID"; // UNPAID, PAID
    public string LastPaidDate { get; set; } = "-";
}

public sealed class AttendanceRecord
{
    public string ClientSyncId { get; set; } = Guid.NewGuid().ToString();
    public string EmployeeCode { get; set; } = "";
    public string FullName { get; set; } = "";
    public string ShiftCode { get; set; } = "SHIFT_A_DAY";
    public string Method { get; set; } = "BIOMETRIC_FINGERPRINT";
    public string CheckInTime { get; set; } = DateTime.Now.ToString("HH:mm:ss");
    public string Status { get; set; } = "PRESENT";
    public string SyncState { get; set; } = "SYNCED";
}

public sealed class PpeIssuance
{
    public string EmployeeCode { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Items { get; set; } = "";
    public string IssuedDate { get; set; } = DateTime.Now.ToString("yyyy-MM-dd");
    public string Inspector { get; set; } = "";
}

public sealed class HseIncident
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string ClientSyncId { get; set; } = Guid.NewGuid().ToString();
    public string ZoneCode { get; set; } = "GHR-PIT-01";
    public string IncidentType { get; set; } = "DUST_EXCEEDANCE";
    public string Severity { get; set; } = "LOW";
    public string Description { get; set; } = "";
    public bool PpeCompliant { get; set; } = true;
    public string SyncState { get; set; } = "SYNCED";
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
}

public sealed class AuditLogEntry
{
    public string Timestamp { get; set; } = DateTime.Now.ToString("HH:mm:ss");
    public string TableName { get; set; } = "";
    public string RecordRef { get; set; } = "";
    public string Action { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Actor { get; set; } = "";
}

public sealed class SupplierBill
{
    public string BillNumber { get; set; } = "";
    public string SupplierName { get; set; } = "";
    public string Category { get; set; } = "DIESEL_FUEL"; // DIESEL_FUEL, EXPLOSIVES, PACKAGING_BAGS, POTASSIUM_IODATE
    public double AmountAfn { get; set; }
    public string DueDate { get; set; } = DateTime.Now.AddDays(14).ToString("yyyy-MM-dd");
    public string Status { get; set; } = "UNPAID"; // UNPAID, PAID
    public string PaymentRef { get; set; } = "";
}

public sealed class OperatorAccount
{
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.WEIGHBRIDGE_CLERK;
    public bool IsActive { get; set; } = true;
}

public sealed class AppSettings
{
    public string CompanyName { get; set; } = "Herat Salt Mine Co. (Ghoryan & Kuhsan)";
    public string MompLicenseNo { get; set; } = "MOMP-HRT-2026-0419";
    public string TaxIdTin { get; set; } = "AFG-TIN-9048211";
    public string ScaleDeviceId { get; set; } = "KANTA-GHR-01";
    public double MompRoyaltyRateAfnPerMt { get; set; } = 350.0;
    public double DefaultMarginPct { get; set; } = 25.0;
    public string ComPort { get; set; } = "COM3";
    public int BaudRate { get; set; } = 9600;
    public string SyncApiBaseUrl { get; set; } = "http://localhost:3000";
}

public sealed class GlAccount
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string AccountType { get; set; } = "ASSET"; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    public double TotalDebitAfn { get; set; }
    public double TotalCreditAfn { get; set; }
    public double BalanceAfn => AccountType is "ASSET" or "EXPENSE"
        ? TotalDebitAfn - TotalCreditAfn
        : TotalCreditAfn - TotalDebitAfn;
    public string DisplayLabel => $"{Code} — {Name}";
}

public sealed class JournalEntry
{
    public string EntryNumber { get; set; } = "";
    public string Date { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
    public string DebitAccountCode { get; set; } = "";
    public string DebitAccountName { get; set; } = "";
    public string CreditAccountCode { get; set; } = "";
    public string CreditAccountName { get; set; } = "";
    public double AmountAfn { get; set; }
    public string Memo { get; set; } = "";
    public string PostedBy { get; set; } = "";
}

public sealed class QcLabTest
{
    public string TestCode { get; set; } = "";
    public string BatchCode { get; set; } = "";
    public string SaltGrade { get; set; } = "REFINED_IODIZED_25KG";
    public double NaClPurityPct { get; set; } = 98.6;
    public double MoisturePct { get; set; } = 1.4;
    public double IodinePpm { get; set; } = 42.0;
    public double InsolublePct { get; set; } = 0.22;
    public string Status { get; set; } = "PASS_FOOD_GRADE";
    public string TestedBy { get; set; } = "Lab Chemist";
    public string TestedAt { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
}

public sealed class ExportShipment
{
    public string ShipmentCode { get; set; } = "";
    public string CustomsDeclNo { get; set; } = "";
    public string BorderPost { get; set; } = "ISLAM_QALA_EXPORT";
    public string BuyerName { get; set; } = "";
    public string TruckPlate { get; set; } = "";
    public double TonnageMt { get; set; }
    public double FreightCostAfn { get; set; }
    public string Status { get; set; } = "AT_MINE"; // AT_MINE, IN_TRANSIT, BORDER_CLEARED, DELIVERED
    public string UpdatedAt { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
}

public sealed class ConsumableItem
{
    public string SkuCode { get; set; } = "";
    public string ItemName { get; set; } = "";
    public string Category { get; set; } = "DIESEL_FUEL";
    public string Unit { get; set; } = "Liters";
    public double StockQty { get; set; }
    public double ReorderLevel { get; set; }
    public double UnitCostAfn { get; set; }
    public string StockStatus => StockQty <= ReorderLevel ? "LOW STOCK" : "HEALTHY";
}

public sealed class GradeProfitRow
{
    public string SaltGrade { get; set; } = "";
    public double DispatchedMt { get; set; }
    public double RevenueAfn { get; set; }
    public double EstCostAfn { get; set; }
    public double EstProfitAfn => RevenueAfn - EstCostAfn;
    public double MarginPct => RevenueAfn > 0 ? Math.Round((EstProfitAfn / RevenueAfn) * 100.0, 1) : 0;
}

public sealed class MineExpense
{
    public string ExpenseCode { get; set; } = "";
    public string Date { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
    public string Category { get; set; } = "CREW_FOOD_CAMP";
    public string Description { get; set; } = "";
    public string Payee { get; set; } = "";
    public double AmountAfn { get; set; }
    public string PaymentAccountCode { get; set; } = "1000"; // 1000 Cash, 1010 Bank, 1020 Hawala
    public string ReceiptRef { get; set; } = "";
    public string RecordedBy { get; set; } = "";
}

public sealed class GovernmentObligation
{
    public string ObligationCode { get; set; } = "";
    public string Title { get; set; } = "";
    public string ObligationType { get; set; } = "CASH_PAYMENT"; // CASH_PAYMENT, BUILD_PROJECT
    public string Category { get; set; } = "SURFACE_RENT";
    public string MinistryOrAgency { get; set; } = "MoMP";
    public double BudgetOrDueAfn { get; set; }
    public double PaidOrSpentAfn { get; set; }
    public double RemainingAfn => Math.Max(0, BudgetOrDueAfn - PaidOrSpentAfn);
    public double ProgressPct => BudgetOrDueAfn > 0 ? Math.Min(100, Math.Round((PaidOrSpentAfn / BudgetOrDueAfn) * 100.0, 1)) : 0;
    public string DueDate { get; set; } = DateTime.Now.AddMonths(1).ToString("yyyy-MM-dd");
    public string Status { get; set; } = "IN_PROGRESS"; // PENDING, IN_PROGRESS, COMPLETED
    public string ReferenceDoc { get; set; } = "";
}

public sealed class ErpLocalSnapshot
{
    public double UsdToAfn { get; set; } = 71.50;
    public AppSettings Settings { get; set; } = new();
    public List<MineZone> Zones { get; set; } = new();
    public List<FleetAsset> FleetAssets { get; set; } = new();
    public List<ExtractionLog> ExtractionLogs { get; set; } = new();
    public List<WeighbridgeTicket> WeighbridgeTickets { get; set; } = new();
    public List<WarehouseStock> WarehouseStocks { get; set; } = new();
    public List<InventoryTransfer> InventoryTransfers { get; set; } = new();
    public List<ProcessingBatch> ProcessingBatches { get; set; } = new();
    public List<CustomerAccount> Customers { get; set; } = new();
    public List<TonnageContract> Contracts { get; set; } = new();
    public List<InvoiceRecord> Invoices { get; set; } = new();
    public List<SupplierBill> SupplierBills { get; set; } = new();
    public List<FinancialEntry> FinancialLedger { get; set; } = new();
    public List<MompRoyalty> MompRoyalties { get; set; } = new();
    public List<EmployeePayroll> PayrollRecords { get; set; } = new();
    public List<AttendanceRecord> AttendanceRecords { get; set; } = new();
    public List<PpeIssuance> PpeIssuances { get; set; } = new();
    public List<HseIncident> HseIncidents { get; set; } = new();
    public List<OperatorAccount> Operators { get; set; } = new();
    public List<GlAccount> ChartOfAccounts { get; set; } = new();
    public List<JournalEntry> JournalEntries { get; set; } = new();
    public List<QcLabTest> QcLabTests { get; set; } = new();
    public List<ExportShipment> ExportShipments { get; set; } = new();
    public List<ConsumableItem> ConsumableItems { get; set; } = new();
    public List<MineExpense> MineExpenses { get; set; } = new();
    public List<GovernmentObligation> GovernmentObligations { get; set; } = new();
    public List<AuditLogEntry> AuditLogs { get; set; } = new();
}
