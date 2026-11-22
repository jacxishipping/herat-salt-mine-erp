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
    public string SyncState { get; set; } = "SYNCED";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class WeighbridgeTicket
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string ClientSyncId { get; set; } = Guid.NewGuid().ToString();
    public string TicketNumber { get; set; } = "";
    public string Direction { get; set; } = "OUTBOUND_DISPATCH";
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, VOID_PENDING, VOIDED
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
    public string Status { get; set; } = "PENDING"; // PENDING, FILED, PAID
}

public sealed class EmployeePayroll
{
    public string EmployeeCode { get; set; } = "";
    public string FullName { get; set; } = "";
    public string TazkiraNo { get; set; } = "";
    public string RoleTitle { get; set; } = "";
    public int DaysWorked { get; set; }
    public double DailyWageAfn { get; set; }
    public double TonBonusAfn { get; set; }
    public double AdvancesDeductionAfn { get; set; }
    public double NetPayableAfn => (DaysWorked * DailyWageAfn) + TonBonusAfn - AdvancesDeductionAfn;
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

public sealed class ErpLocalSnapshot
{
    public double UsdToAfn { get; set; } = 71.50;
    public List<MineZone> Zones { get; set; } = new();
    public List<FleetAsset> FleetAssets { get; set; } = new();
    public List<ExtractionLog> ExtractionLogs { get; set; } = new();
    public List<WeighbridgeTicket> WeighbridgeTickets { get; set; } = new();
    public List<WarehouseStock> WarehouseStocks { get; set; } = new();
    public List<ProcessingBatch> ProcessingBatches { get; set; } = new();
    public List<FinancialEntry> FinancialLedger { get; set; } = new();
    public List<MompRoyalty> MompRoyalties { get; set; } = new();
    public List<EmployeePayroll> PayrollRecords { get; set; } = new();
    public List<HseIncident> HseIncidents { get; set; } = new();
    public List<AuditLogEntry> AuditLogs { get; set; } = new();
}
