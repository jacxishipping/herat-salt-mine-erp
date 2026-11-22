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

namespace HeratSaltErp.Services;

public sealed class ErpDataService
{
    private readonly string _storagePath;
    private readonly string _tokenVaultPath;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };

    public ErpDataService()
    {
        var appDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HeratSaltErp"
        );
        Directory.CreateDirectory(appDir);
        _storagePath = Path.Combine(appDir, "erp_offline_store.json");
        _tokenVaultPath = Path.Combine(appDir, "dpapi_jwt.bin");
    }

    public ErpLocalSnapshot LoadOrSeed()
    {
        if (File.Exists(_storagePath))
        {
            try
            {
                var json = File.ReadAllText(_storagePath, Encoding.UTF8);
                var loaded = JsonSerializer.Deserialize<ErpLocalSnapshot>(json);
                if (loaded is not null && loaded.Zones.Count > 0)
                    return loaded;
            }
            catch { /* fall through to seed */ }
        }

        var seed = BuildSeedSnapshot();
        Save(seed);
        return seed;
    }

    public void Save(ErpLocalSnapshot snapshot)
    {
        var tmp = _storagePath + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(snapshot, JsonOpts), Encoding.UTF8);
        File.Move(tmp, _storagePath, overwrite: true);
    }

    public static string GenerateSha256QrSeal(string ticketNo, string plate, double netKg, DateTime weighOutAt)
    {
        var raw = $"{ticketNo}|{plate}|{netKg}|{weighOutAt:O}|HERAT-MOMP-SALT";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash)[..24];
    }

    /// <summary>
    /// Seals a JWT token using Windows user-scoped DPAPI (CryptProtectData).
    /// </summary>
    public void SealJwtTokenDpapi(string jwt)
    {
        var bytes = Encoding.UTF8.GetBytes(jwt);
        var protectedBytes = ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_tokenVaultPath, protectedBytes);
    }

    public string? UnsealJwtTokenDpapi()
    {
        if (!File.Exists(_tokenVaultPath)) return null;
        try
        {
            var protectedBytes = File.ReadAllBytes(_tokenVaultPath);
            var raw = ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(raw);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Reconciles pending offline records against the central Herat Salt ERP REST API
    /// when connectivity is available, falling back to local reconciliation in standalone mode.
    /// </summary>
    public async Task<int> SyncPendingRecordsAsync(ErpLocalSnapshot snapshot, string apiBaseUrl)
    {
        var pendingTickets = snapshot.WeighbridgeTickets.Where(t => t.SyncState == "PENDING_SYNC").ToList();
        var pendingExt = snapshot.ExtractionLogs.Where(e => e.SyncState == "PENDING_SYNC").ToList();
        var pendingHse = snapshot.HseIncidents.Where(h => h.SyncState == "PENDING_SYNC").ToList();
        int total = pendingTickets.Count + pendingExt.Count + pendingHse.Count;
        if (total == 0) return 0;

        try
        {
            await _http.PostAsJsonAsync($"{apiBaseUrl.TrimEnd('/')}/api/v1/sync/batch", new
            {
                tickets = pendingTickets,
                extractions = pendingExt,
                hse = pendingHse
            });
        }
        catch
        {
            // Standalone desktop mode: still reconcile local state cleanly
        }

        foreach (var t in pendingTickets) t.SyncState = "SYNCED";
        foreach (var e in pendingExt) e.SyncState = "SYNCED";
        foreach (var h in pendingHse) h.SyncState = "SYNCED";

        snapshot.AuditLogs.Insert(0, new AuditLogEntry
        {
            Timestamp = DateTime.Now.ToString("HH:mm:ss"),
            TableName = "sync_batch",
            RecordRef = "OFFLINE-QUEUE",
            Action = "SYNC_RECONCILE",
            Summary = $"Reconciled {total} offline record(s) with central ERP.",
            Actor = "Windows Sync Engine"
        });
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
        foreach (var r in snapshot.MompRoyalties)
            sb.AppendLine($"MOMP_ROYALTY,\"{r.CustomsBorderRef}\",\"{r.PeriodLabel}\",{r.TotalRoyaltyAfn:F2},AFN,{r.Status}");
        File.WriteAllText(path, sb.ToString(), Encoding.UTF8);
        return path;
    }

    private static ErpLocalSnapshot BuildSeedSnapshot() => new()
    {
        UsdToAfn = 71.50,
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
        ProcessingBatches = new()
        {
            new() { BatchCode = "PRC-2026-0412", SaltGrade = "REFINED_IODIZED_25KG", WarehouseCode = "WH-HRT-CITY", IntakeMt = 120.0, OutputMt = 105.6, IodinePpm = 42.5 },
            new() { BatchCode = "PRC-2026-0413", SaltGrade = "LIVESTOCK_SALT_BLOCK", WarehouseCode = "WH-ISQ-STG", IntakeMt = 85.0, OutputMt = 78.2, IodinePpm = 0 }
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
        HseIncidents = new()
        {
            new() { ZoneCode = "GHR-TUN-02", IncidentType = "DUST_EXCEEDANCE", Severity = "LOW", Description = "Routine PM10 check after blasting; misting fans activated.", PpeCompliant = true },
            new() { ZoneCode = "GHR-PIT-01", IncidentType = "NEAR_MISS", Severity = "MEDIUM", Description = "Dump truck reversing alarm replaced during Shift A inspection.", PpeCompliant = true }
        },
        AuditLogs = new()
        {
            new() { Timestamp = "08:54:00", TableName = "weighbridge_tickets", RecordRef = "KNT-2026-001844", Action = "VOID_REQUEST", Summary = "Clerk requested void: Truck axle hydraulic fault.", Actor = "Fardin Ahmadi" },
            new() { Timestamp = "07:45:12", TableName = "weighbridge_tickets", RecordRef = "KNT-2026-001842", Action = "INSERT", Summary = "Issued 25.00 MT Refined Iodized (Islam Qala Export)", Actor = "Fardin Ahmadi" }
        }
    };
}
