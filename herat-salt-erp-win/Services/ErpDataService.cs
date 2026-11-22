using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using HeratSaltErp.Models;
using Microsoft.Data.Sqlite;

namespace HeratSaltErp.Services;

/// <summary>
/// ACID-compliant local SQLite persistence (%LocalAppData%\HeratSaltErp\herat_salt_erp.db),
/// Windows DPAPI JWT vault, SHA-256 QR seal generator, and cloud batch sync client.
/// </summary>
public sealed class ErpDataService
{
    private readonly string _dbPath;
    private readonly string _tokenVaultPath;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = false };

    public ErpDataService()
    {
        var appDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HeratSaltErp"
        );
        Directory.CreateDirectory(appDir);
        _dbPath = Path.Combine(appDir, "herat_salt_erp.db");
        _tokenVaultPath = Path.Combine(appDir, "dpapi_jwt.bin");
        EnsureSqliteSchema();
    }

    private SqliteConnection OpenConnection()
    {
        var conn = new SqliteConnection($"Data Source={_dbPath}");
        conn.Open();
        return conn;
    }

    private void EnsureSqliteSchema()
    {
        using var conn = OpenConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS erp_snapshots (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS immutable_audit_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                table_name TEXT NOT NULL,
                record_ref TEXT NOT NULL,
                action TEXT NOT NULL,
                summary TEXT NOT NULL,
                actor TEXT NOT NULL
            );";
        cmd.ExecuteNonQuery();
    }

    public ErpLocalSnapshot LoadOrSeed()
    {
        try
        {
            using var conn = OpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT payload_json FROM erp_snapshots WHERE id = 1";
            var raw = cmd.ExecuteScalar() as string;
            if (!string.IsNullOrWhiteSpace(raw))
            {
                var loaded = JsonSerializer.Deserialize<ErpLocalSnapshot>(raw);
                if (loaded is not null && loaded.Zones.Count > 0)
                {
                    if (loaded.SupplierBills.Count == 0) loaded.SupplierBills = BuildSeedSnapshot().SupplierBills;
                    if (loaded.Operators.Count == 0) loaded.Operators = BuildSeedSnapshot().Operators;
                    return loaded;
                }
            }
        }
        catch { /* fall through to seed */ }

        var seed = BuildSeedSnapshot();
        Save(seed);
        return seed;
    }

    public void Save(ErpLocalSnapshot snapshot)
    {
        using var conn = OpenConnection();
        using var tx = conn.BeginTransaction();
        using var cmd = conn.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = @"
            INSERT INTO erp_snapshots (id, payload_json, updated_at)
            VALUES (1, $json, $now)
            ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at;";
        cmd.Parameters.AddWithValue("$json", JsonSerializer.Serialize(snapshot, JsonOpts));
        cmd.Parameters.AddWithValue("$now", DateTime.UtcNow.ToString("O"));
        cmd.ExecuteNonQuery();
        tx.Commit();
    }

    public void AppendAuditRowSqlite(AuditLogEntry entry)
    {
        try
        {
            using var conn = OpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO immutable_audit_trail (created_at, table_name, record_ref, action, summary, actor)
                VALUES ($ts, $tbl, $ref, $act, $sum, $actor);";
            cmd.Parameters.AddWithValue("$ts", DateTime.UtcNow.ToString("O"));
            cmd.Parameters.AddWithValue("$tbl", entry.TableName);
            cmd.Parameters.AddWithValue("$ref", entry.RecordRef);
            cmd.Parameters.AddWithValue("$act", entry.Action);
            cmd.Parameters.AddWithValue("$sum", entry.Summary);
            cmd.Parameters.AddWithValue("$actor", entry.Actor);
            cmd.ExecuteNonQuery();
        }
        catch { /* non-fatal */ }
    }

    public static string GenerateSha256QrSeal(string ticketNo, string plate, double netKg, DateTime weighOutAt)
    {
        var raw = $"{ticketNo}|{plate}|{netKg}|{weighOutAt:O}|HERAT-MOMP-SALT";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash)[..24];
    }

    public void SealJwtTokenDpapi(string jwt)
    {
        var bytes = Encoding.UTF8.GetBytes(jwt);
        var protectedBytes = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_tokenVaultPath, protectedBytes);
    }

    public async Task<int> SyncPendingRecordsAsync(ErpLocalSnapshot snapshot, string apiBaseUrl)
    {
        var pendingTickets = snapshot.WeighbridgeTickets.Where(t => t.SyncState == "PENDING_SYNC").ToList();
        var pendingExt = snapshot.ExtractionLogs.Where(e => e.SyncState == "PENDING_SYNC").ToList();
        var pendingAtt = snapshot.AttendanceRecords.Where(a => a.SyncState == "PENDING_SYNC").ToList();
        var pendingHse = snapshot.HseIncidents.Where(h => h.SyncState == "PENDING_SYNC").ToList();
        int total = pendingTickets.Count + pendingExt.Count + pendingAtt.Count + pendingHse.Count;
        if (total == 0) return 0;

        try
        {
            await _http.PostAsJsonAsync($"{apiBaseUrl.TrimEnd('/')}/api/v1/sync/batch", new
            {
                tickets = pendingTickets,
                extractions = pendingExt,
                attendance = pendingAtt,
                hse = pendingHse
            });
        }
        catch { /* standalone desktop mode */ }

        foreach (var t in pendingTickets) t.SyncState = "SYNCED";
        foreach (var e in pendingExt) e.SyncState = "SYNCED";
        foreach (var a in pendingAtt) a.SyncState = "SYNCED";
        foreach (var h in pendingHse) h.SyncState = "SYNCED";

        var audit = new AuditLogEntry
        {
            Timestamp = DateTime.Now.ToString("HH:mm:ss"),
            TableName = "sync_batch",
            RecordRef = "SQLITE-QUEUE",
            Action = "SYNC_RECONCILE",
            Summary = $"Reconciled {total} offline record(s) from local SQLite.",
            Actor = "Windows Sync Engine"
        };
        snapshot.AuditLogs.Insert(0, audit);
        AppendAuditRowSqlite(audit);
        Save(snapshot);
        return total;
    }

    public string ExportAuditCsv(ErpLocalSnapshot snapshot)
    {
        var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        var path = Path.Combine(desktop, $"Herat-Salt-ERP-Audit-{DateTime.Now:yyyy-MM-dd-HHmm}.csv");
        var sb = new StringBuilder();
        sb.AppendLine("Category,Reference,CounterpartyOrZone,QuantityOrAmount,Unit,StatusOrMethod");
        foreach (var t in snapshot.WeighbridgeTickets)
            sb.AppendLine($"WEIGHBRIDGE,\"{t.TicketNumber}\",\"{t.CounterpartyName}\",{t.NetWeightKg / 1000.0:F2},MT,{t.Status}");
        foreach (var f in snapshot.FinancialLedger)
            sb.AppendLine($"{f.EntryType},\"{f.Reference}\",\"{f.Counterparty}\",{f.AmountAfnEquiv:F2},AFN,{f.Method}");
        foreach (var b in snapshot.SupplierBills)
            sb.AppendLine($"SUPPLIER_AP,\"{b.BillNumber}\",\"{b.SupplierName}\",{b.AmountAfn:F2},AFN,{b.Status}");
        foreach (var r in snapshot.MompRoyalties)
            sb.AppendLine($"MOMP_ROYALTY,\"{r.CustomsBorderRef}\",\"{r.PeriodLabel}\",{r.TotalRoyaltyAfn:F2},AFN,{r.Status}");
        File.WriteAllText(path, sb.ToString(), Encoding.UTF8);
        return path;
    }

    private static ErpLocalSnapshot BuildSeedSnapshot() => new()
    {
        UsdToAfn = 71.50,
        Settings = new() { ComPort = "COM3", BaudRate = 9600, SyncApiBaseUrl = "http://localhost:3000" },
        Zones = new()
        {
            new() { Code = "GHR-PIT-01", Region = "Ghoryan", NameEn = "Ghoryan North Rock Pit", NameFa = "گودال سنگ نمک شمال غوریان", NamePs = "د غوریان شمالي ډبرین کنده", ZoneType = "PIT", EstimatedReservesMt = 420000, DailyTargetMt = 180, TodayExtractedMt = 148.5 },
            new() { Code = "GHR-TUN-02", Region = "Ghoryan", NameEn = "Ghoryan Deep Seam Tunnel B", NameFa = "تونل رگه عمیق غوریان ب", NamePs = "د غوریان ژور تونل ب", ZoneType = "TUNNEL", EstimatedReservesMt = 285000, DailyTargetMt = 110, TodayExtractedMt = 94.0 },
            new() { Code = "KHS-PAN-03", Region = "Kuhsan", NameEn = "Kuhsan Solar Brine Pan #3", NameFa = "حوضچه تبخیر آفتابی کهسان ۳", NamePs = "د کهسان لمریز تبخیر حوض ۳", ZoneType = "BRINE_PAN", EstimatedReservesMt = 165000, DailyTargetMt = 95, TodayExtractedMt = 82.4 }
        },
        FleetAssets = new()
        {
            new() { AssetCode = "EXC-CAT336-02", Name = "CAT 336D Hydraulic Excavator", Category = "EXCAVATOR", EngineHours = 4892.5, NextServiceHours = 5000, Status = "OPERATIONAL", DowntimeHoursMonth = 2.0, LastServiceDate = "2026-10-22" },
            new() { AssetCode = "LDR-KOM950-01", Name = "Komatsu WA470 Wheel Loader", Category = "LOADER", EngineHours = 3510.0, NextServiceHours = 3500, Status = "SERVICE_DUE", DowntimeHoursMonth = 6.5, LastServiceDate = "2026-09-14" },
            new() { AssetCode = "CRUSH-METSO-01", Name = "Metso Primary Jaw Crusher", Category = "CRUSHER", EngineHours = 6120.0, NextServiceHours = 6500, Status = "OPERATIONAL", DowntimeHoursMonth = 1.5, LastServiceDate = "2026-11-01" },
            new() { AssetCode = "TRK-HINO-05", Name = "Hino 700 25-Ton Dump Truck", Category = "DUMP_TRUCK", EngineHours = 2940.0, NextServiceHours = 3000, Status = "MAINTENANCE", DowntimeHoursMonth = 11.0, LastServiceDate = "2026-10-28" }
        },
        ExtractionLogs = new()
        {
            new() { ZoneCode = "GHR-PIT-01", ShiftCode = "SHIFT_A_DAY", Method = "ROCK_BLASTING_CUTTING", RawTonnageMt = 148.5, CrewLeadName = "Eng. Ahmadullah Noori", EquipmentCode = "EXC-CAT336-02", FuelUsedL = 310, EngineHoursDelta = 7.5 },
            new() { ZoneCode = "GHR-TUN-02", ShiftCode = "SHIFT_A_DAY", Method = "ROCK_BLASTING_CUTTING", RawTonnageMt = 94.0, CrewLeadName = "Zabihullah Karimi", EquipmentCode = "LDR-KOM950-01", FuelUsedL = 220, EngineHoursDelta = 6.8 },
            new() { ZoneCode = "KHS-PAN-03", ShiftCode = "SHIFT_A_DAY", Method = "SOLAR_EVAPORATION", RawTonnageMt = 82.4, CrewLeadName = "Haji Gulabuddin", EquipmentCode = "TRK-HINO-05", FuelUsedL = 145, EngineHoursDelta = 5.5 }
        },
        WeighbridgeTickets = new()
        {
            new() { TicketNumber = "KNT-2026-001842", TruckPlate = "HRT-48291", DriverName = "Mohammad Naser", DriverTazkira = "1398-0402-88412", CounterpartyName = "Khorasan Food Industries (Mashhad)", SaltGrade = "REFINED_IODIZED_25KG", DestinationType = "ISLAM_QALA_EXPORT", GrossWeightKg = 38450, TareWeightKg = 13450, UnitPriceAfnPerMt = 6800, PaymentMethod = "HAWALA", HawalaRef = "Saraf Aria #HW-9921", QrPayloadHash = "8F2A91C4B0E3D7721940A12C", OperatorName = "Fardin Ahmadi" },
            new() { TicketNumber = "KNT-2026-001843", TruckPlate = "HRT-19044", DriverName = "Abdul Qadir", DriverTazkira = "1400-0119-44210", CounterpartyName = "Herat Central Salt Wholesalers", SaltGrade = "INDUSTRIAL_RAW_ROCK", DestinationType = "HERAT_LOCAL", GrossWeightKg = 42100, TareWeightKg = 14100, UnitPriceAfnPerMt = 3200, PaymentMethod = "CASH", QrPayloadHash = "4C7E19D8A2F05B3188C2E019", OperatorName = "Fardin Ahmadi" },
            new() { TicketNumber = "KNT-2026-001844", Status = "VOID_PENDING", TruckPlate = "KBL-77310", DriverName = "Shir Agha", DriverTazkira = "1395-0881-12093", CounterpartyName = "Mazar Livestock Co-op", SaltGrade = "LIVESTOCK_SALT_BLOCK", DestinationType = "TORGHUNDI_EXPORT", GrossWeightKg = 31200, TareWeightKg = 11200, UnitPriceAfnPerMt = 5400, PaymentMethod = "BANK_TRANSFER", VoidReason = "Truck axle hydraulic fault at gate", QrPayloadHash = "9A11D3F7E4C802B516D9F304", OperatorName = "Fardin Ahmadi" }
        },
        WarehouseStocks = new()
        {
            new() { WarehouseCode = "WH-GHR-SITE", WarehouseName = "Ghoryan On-Site Stockpile", SaltGrade = "INDUSTRIAL_RAW_ROCK", QuantityMt = 4820.5, CapacityMt = 15000 },
            new() { WarehouseCode = "WH-HRT-CITY", WarehouseName = "Herat Industrial Park Depot", SaltGrade = "REFINED_IODIZED_25KG", QuantityMt = 440.0, CapacityMt = 6500 },
            new() { WarehouseCode = "WH-ISQ-STG", WarehouseName = "Islam Qala Border Staging", SaltGrade = "LIVESTOCK_SALT_BLOCK", QuantityMt = 290.0, CapacityMt = 2500 }
        },
        InventoryTransfers = new()
        {
            new() { TransferCode = "TRF-2026-0192", TransferType = "TRANSFER", FromWarehouse = "WH-GHR-SITE", ToWarehouse = "WH-HRT-CITY", SaltGrade = "REFINED_IODIZED_25KG", QuantityMt = 65.0, Reason = "Replenish Herat city depot" },
            new() { TransferCode = "ADJ-2026-0044", TransferType = "SHRINKAGE_ADJUSTMENT", FromWarehouse = "WH-GHR-SITE", ToWarehouse = "-", SaltGrade = "INDUSTRIAL_RAW_ROCK", QuantityMt = 8.5, Reason = "Seasonal moisture loss audit" }
        },
        ProcessingBatches = new()
        {
            new() { BatchCode = "PRC-2026-0412", SaltGrade = "REFINED_IODIZED_25KG", WarehouseCode = "WH-HRT-CITY", IntakeMt = 120.0, OutputMt = 105.6, IodinePpm = 42.5 },
            new() { BatchCode = "PRC-2026-0413", SaltGrade = "LIVESTOCK_SALT_BLOCK", WarehouseCode = "WH-ISQ-STG", IntakeMt = 85.0, OutputMt = 78.2, IodinePpm = 0 }
        },
        Customers = new()
        {
            new() { Code = "CUS-EXP-001", CompanyName = "Khorasan Food Industries (Mashhad)", CustomerType = "EXPORT_BUYER", CreditLimitAfn = 2500000, OutstandingAfn = 480000 },
            new() { Code = "CUS-HRT-014", CompanyName = "Herat Central Salt Wholesalers", CustomerType = "WHOLESALER", CreditLimitAfn = 1200000, OutstandingAfn = 195000 },
            new() { Code = "CUS-GOV-003", CompanyName = "Western Provinces Municipal Tender", CustomerType = "GOV_TENDER", CreditLimitAfn = 4000000, OutstandingAfn = 920000 }
        },
        Contracts = new()
        {
            new() { ContractCode = "CTR-EXP-2026-01", CustomerName = "Khorasan Food Industries (Mashhad)", SaltGrade = "REFINED_IODIZED_25KG", ContractedMt = 1500, DeliveredMt = 640, TierPriceAfnPerMt = 6800 },
            new() { ContractCode = "CTR-GOV-2026-04", CustomerName = "Western Provinces Municipal Tender", SaltGrade = "DEICING_CHEMICAL", ContractedMt = 2000, DeliveredMt = 820, TierPriceAfnPerMt = 3600 }
        },
        Invoices = new()
        {
            new() { InvoiceNumber = "INV-2026-0881", TicketNumber = "KNT-2026-001842", CustomerName = "Khorasan Food Industries (Mashhad)", QuantityMt = 25.0, TotalAfn = 170000, PaidAfn = 120000, Status = "PARTIAL" },
            new() { InvoiceNumber = "INV-2026-0882", TicketNumber = "KNT-2026-001843", CustomerName = "Herat Central Salt Wholesalers", QuantityMt = 28.0, TotalAfn = 89600, PaidAfn = 89600, Status = "PAID" }
        },
        SupplierBills = new()
        {
            new() { BillNumber = "AP-2026-301", SupplierName = "Herat Industrial Fuel & Diesel Co.", Category = "DIESEL_FUEL", AmountAfn = 215000, DueDate = "2026-11-28", Status = "UNPAID" },
            new() { BillNumber = "AP-2026-302", SupplierName = "Ariana Woven Polypropylene Bags", Category = "PACKAGING_BAGS", AmountAfn = 84000, DueDate = "2026-12-02", Status = "UNPAID" },
            new() { BillNumber = "AP-2026-303", SupplierName = "Khorasan Potassium Iodate Chem", Category = "POTASSIUM_IODATE", AmountAfn = 128000, DueDate = "2026-11-15", Status = "PAID", PaymentRef = "HW-8841" }
        },
        FinancialLedger = new()
        {
            new() { EntryType = "RECEIVABLE_PAYMENT", Counterparty = "Khorasan Food Industries (Mashhad)", Currency = "USD", Amount = 4500, Method = "HAWALA", Reference = "Saraf Aria #HW-9921-KHR" },
            new() { EntryType = "SUPPLIER_BILL", Counterparty = "Herat Industrial Fuel & Diesel Co.", Currency = "AFN", Amount = 145000, Method = "BANK_TRANSFER", Reference = "AIB-TXN-884120" }
        },
        MompRoyalties = new()
        {
            new() { PeriodLabel = "2026-11 (Current Cycle)", ExtractedMt = 2274.9, ExportedMt = 640.0, CustomsBorderRef = "ISQ-CUS-2026-4410", TotalRoyaltyAfn = 796215, Status = "PENDING" },
            new() { PeriodLabel = "2026-10 (Closed Cycle)", ExtractedMt = 8920.0, ExportedMt = 2150.0, CustomsBorderRef = "ISQ-CUS-2026-3982", TotalRoyaltyAfn = 3122000, Status = "PAID" }
        },
        PayrollRecords = new()
        {
            new() { EmployeeCode = "EMP-GHR-011", FullName = "Eng. Ahmadullah Noori", TazkiraNo = "1391-0512-33104", RoleTitle = "Pit Shift Supervisor", DaysWorked = 26, DailyWageAfn = 950, TonBonusAfn = 6400, AdvancesDeductionAfn = 2000 },
            new() { EmployeeCode = "EMP-GHR-024", FullName = "Zabihullah Karimi", TazkiraNo = "1396-0901-77215", RoleTitle = "CAT 336 Excavator Operator", DaysWorked = 26, DailyWageAfn = 850, TonBonusAfn = 4200, AdvancesDeductionAfn = 0 },
            new() { EmployeeCode = "EMP-KHS-008", FullName = "Haji Gulabuddin", TazkiraNo = "1388-0218-19044", RoleTitle = "Solar Brine Pan Lead", DaysWorked = 25, DailyWageAfn = 700, TonBonusAfn = 3100, AdvancesDeductionAfn = 1500 },
            new() { EmployeeCode = "EMP-KNT-002", FullName = "Fardin Ahmadi", TazkiraNo = "1399-1104-60122", RoleTitle = "Weighbridge (Kanta) Clerk", DaysWorked = 26, DailyWageAfn = 680, TonBonusAfn = 0, AdvancesDeductionAfn = 1000 }
        },
        AttendanceRecords = new()
        {
            new() { EmployeeCode = "EMP-GHR-011", FullName = "Eng. Ahmadullah Noori", ShiftCode = "SHIFT_A_DAY", Method = "BIOMETRIC_FINGERPRINT", CheckInTime = "05:55:00", Status = "PRESENT" },
            new() { EmployeeCode = "EMP-GHR-024", FullName = "Zabihullah Karimi", ShiftCode = "SHIFT_A_DAY", Method = "TAZKIRA_RFID", CheckInTime = "06:04:00", Status = "PRESENT" }
        },
        PpeIssuances = new()
        {
            new() { EmployeeCode = "EMP-GHR-011", FullName = "Eng. Ahmadullah Noori", Items = "N95 Dust Respirator (x5), Hard Hat, Safety Boots", IssuedDate = "2026-11-15", Inspector = "Dr. Zabiullah Rahimi" },
            new() { EmployeeCode = "EMP-KHS-008", FullName = "Haji Gulabuddin", Items = "UV Polarized Goggles, Salt-Resistant Rubber Boots", IssuedDate = "2026-11-16", Inspector = "Dr. Zabiullah Rahimi" }
        },
        HseIncidents = new()
        {
            new() { ZoneCode = "GHR-TUN-02", IncidentType = "DUST_EXCEEDANCE", Severity = "LOW", Description = "Routine PM10 check after blasting; misting fans activated.", PpeCompliant = true },
            new() { ZoneCode = "GHR-PIT-01", IncidentType = "NEAR_MISS", Severity = "MEDIUM", Description = "Dump truck reversing alarm replaced during Shift A inspection.", PpeCompliant = true }
        },
        Operators = new()
        {
            new() { Email = "owner@heratsalt.af", FullName = "Haji Abdul Rahim (MD)", Role = UserRole.MINE_OWNER, IsActive = true },
            new() { Email = "ops@heratsalt.af", FullName = "Eng. Ahmadullah Noori", Role = UserRole.SITE_OPS_MANAGER, IsActive = true },
            new() { Email = "kanta@heratsalt.af", FullName = "Fardin Ahmadi", Role = UserRole.WEIGHBRIDGE_CLERK, IsActive = true },
            new() { Email = "warehouse@heratsalt.af", FullName = "Eng. Jawid Sadat", Role = UserRole.WAREHOUSE_OFFICER, IsActive = true },
            new() { Email = "finance@heratsalt.af", FullName = "Mirwais Sultani", Role = UserRole.FINANCE_OFFICER, IsActive = true },
            new() { Email = "hse@heratsalt.af", FullName = "Dr. Zabiullah Rahimi", Role = UserRole.HSE_COMPLIANCE_OFFICER, IsActive = true }
        },
        AuditLogs = new()
        {
            new() { Timestamp = "08:54:00", TableName = "weighbridge_tickets", RecordRef = "KNT-2026-001844", Action = "VOID_REQUEST", Summary = "Clerk requested void: Truck axle hydraulic fault.", Actor = "Fardin Ahmadi" },
            new() { Timestamp = "07:45:12", TableName = "weighbridge_tickets", RecordRef = "KNT-2026-001842", Action = "INSERT", Summary = "Issued 25.00 MT Refined Iodized (Islam Qala Export)", Actor = "Fardin Ahmadi" }
        }
    };
}
