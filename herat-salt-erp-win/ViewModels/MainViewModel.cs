using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using HeratSaltErp.Models;
using HeratSaltErp.Services;

namespace HeratSaltErp.ViewModels;

public sealed class RelayCommand : ICommand
{
    private readonly Action<object?> _execute;
    private readonly Func<object?, bool>? _canExecute;

    public RelayCommand(Action<object?> execute, Func<object?, bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public bool CanExecute(object? parameter) => _canExecute?.Invoke(parameter) ?? true;
    public void Execute(object? parameter) => _execute(parameter);
    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }
}

public sealed class MainViewModel : INotifyPropertyChanged
{
    private readonly ErpDataService _dataService = new();
    private readonly KantaSerialService _kantaService = new();
    private readonly ErpLocalSnapshot _snapshot;

    public event PropertyChangedEventHandler? PropertyChanged;
    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    // Collections
    public ObservableCollection<MineZone> Zones { get; }
    public ObservableCollection<FleetAsset> FleetAssets { get; }
    public ObservableCollection<ExtractionLog> ExtractionLogs { get; }
    public ObservableCollection<WeighbridgeTicket> WeighbridgeTickets { get; }
    public ObservableCollection<WeighbridgeTicket> FilteredTickets { get; } = new();
    public ObservableCollection<WarehouseStock> WarehouseStocks { get; }
    public ObservableCollection<InventoryTransfer> InventoryTransfers { get; }
    public ObservableCollection<ProcessingBatch> ProcessingBatches { get; }
    public ObservableCollection<CustomerAccount> Customers { get; }
    public ObservableCollection<TonnageContract> Contracts { get; }
    public ObservableCollection<InvoiceRecord> Invoices { get; }
    public ObservableCollection<FinancialEntry> FinancialLedger { get; }
    public ObservableCollection<MompRoyalty> MompRoyalties { get; }
    public ObservableCollection<EmployeePayroll> PayrollRecords { get; }
    public ObservableCollection<AttendanceRecord> AttendanceRecords { get; }
    public ObservableCollection<PpeIssuance> PpeIssuances { get; }
    public ObservableCollection<HseIncident> HseIncidents { get; }
    public ObservableCollection<AuditLogEntry> AuditLogs { get; }

    // Reference Lists
    public IReadOnlyList<UserRole> AllRoles { get; } = Enum.GetValues<UserRole>();
    public IReadOnlyList<string> SaltGrades { get; } = new[]
    {
        "INDUSTRIAL_RAW_ROCK", "REFINED_IODIZED_25KG", "REFINED_IODIZED_50KG",
        "REFINED_IODIZED_1KG", "LIVESTOCK_SALT_BLOCK", "DEICING_CHEMICAL"
    };
    public IReadOnlyList<string> Destinations { get; } = new[]
    {
        "HERAT_LOCAL", "DOMESTIC_PROVINCE", "ISLAM_QALA_EXPORT", "TORGHUNDI_EXPORT"
    };
    public IReadOnlyList<string> PaymentMethods { get; } = new[] { "HAWALA", "CASH", "BANK_TRANSFER" };
    public IReadOnlyList<string> WarehouseCodes { get; } = new[] { "WH-GHR-SITE", "WH-HRT-CITY", "WH-ISQ-STG" };
    public IReadOnlyList<string> ExtractionMethods { get; } = new[] { "ROCK_BLASTING_CUTTING", "SOLAR_EVAPORATION" };
    public IReadOnlyList<string> Shifts { get; } = new[] { "SHIFT_A_DAY", "SHIFT_B_NIGHT" };
    public IReadOnlyList<string> HseCategories { get; } = new[] { "DUST_EXCEEDANCE", "NEAR_MISS", "EQUIPMENT_HAZARD", "INJURY" };
    public IReadOnlyList<string> HseSeverities { get; } = new[] { "LOW", "MEDIUM", "HIGH", "CRITICAL" };

    // Navigation & Theme
    private string _activeTab = "Dashboard";
    public string ActiveTab
    {
        get => _activeTab;
        set { _activeTab = value; OnPropertyChanged(); OnPropertyChanged(nameof(ActiveBreadcrumb)); }
    }

    private bool _isDarkTheme = true;
    public bool IsDarkTheme
    {
        get => _isDarkTheme;
        set
        {
            _isDarkTheme = value;
            App.ApplyTheme(value);
            OnPropertyChanged();
            ShowToast(value ? "Switched to Dark Mode" : "Switched to Light Mode");
        }
    }

    private LangCode _lang = LangCode.EN;
    public LangCode CurrentLang
    {
        get => _lang;
        set
        {
            _lang = value;
            Strings = LocalizationService.GetStrings(value);
            OnPropertyChanged();
            OnPropertyChanged(nameof(WindowFlowDirection));
            OnPropertyChanged(nameof(Strings));
            OnPropertyChanged(nameof(ActiveBreadcrumb));
        }
    }

    public FlowDirection WindowFlowDirection => LocalizationService.GetFlowDirection(CurrentLang);
    public Dictionary<string, string> Strings { get; private set; } = LocalizationService.GetStrings(LangCode.EN);

    private CurrencyCode _currency = CurrencyCode.AFN;
    public CurrencyCode CurrentCurrency
    {
        get => _currency;
        set { _currency = value; OnPropertyChanged(); RefreshKpis(); }
    }

    private double _usdToAfn = 71.50;
    public double UsdToAfn
    {
        get => _usdToAfn;
        set
        {
            if (value > 0)
            {
                _usdToAfn = value;
                _snapshot.UsdToAfn = value;
                OnPropertyChanged();
                RefreshKpis();
            }
        }
    }

    private UserRole _activeRole = UserRole.MINE_OWNER;
    public UserRole ActiveRole
    {
        get => _activeRole;
        set
        {
            _activeRole = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(CanViewFinancials));
            OnPropertyChanged(nameof(CannotViewFinancials));
            OnPropertyChanged(nameof(CanApproveVoid));
            OnPropertyChanged(nameof(CanViewAuditLogs));
            OnPropertyChanged(nameof(CannotViewAuditLogs));
            RefreshKpis();
            ShowToast($"Active Role: {value}");
        }
    }

    // Operator DPAPI Login Modal
    private bool _isLoginOpen;
    public bool IsLoginOpen { get => _isLoginOpen; set { _isLoginOpen = value; OnPropertyChanged(); } }
    private string _loginEmail = "owner@heratsalt.af";
    public string LoginEmail { get => _loginEmail; set { _loginEmail = value; OnPropertyChanged(); } }
    private string _operatorBadge = "DPAPI Vault: Unlocked";
    public string OperatorBadge { get => _operatorBadge; set { _operatorBadge = value; OnPropertyChanged(); } }

    private bool _isOfflineMode;
    public bool IsOfflineMode
    {
        get => _isOfflineMode;
        set
        {
            _isOfflineMode = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(ConnectionStatusText));
            if (!value) _ = SyncOfflineQueueAsync();
            else ShowToast("Offline Mine Mode active — queuing locally");
        }
    }

    public string ConnectionStatusText => IsOfflineMode ? Strings["Offline"] : Strings["Online"];
    public string ActiveBreadcrumb => ActiveTab switch
    {
        "Weighbridge" => Strings["NavWeighbridge"],
        "Extraction" => Strings["NavExtraction"],
        "Processing" => Strings["NavProcessing"],
        "Finance" => Strings["NavFinance"],
        "HrHse" => Strings["NavHrHse"],
        "Audit" => Strings["NavAudit"],
        _ => Strings["NavDashboard"]
    };

    // RBAC
    public bool CanViewFinancials => ActiveRole is UserRole.MINE_OWNER or UserRole.FINANCE_OFFICER;
    public bool CannotViewFinancials => !CanViewFinancials;
    public bool CanApproveVoid => ActiveRole is UserRole.MINE_OWNER or UserRole.SITE_OPS_MANAGER;
    public bool CanViewAuditLogs => ActiveRole is UserRole.MINE_OWNER or UserRole.SITE_OPS_MANAGER or UserRole.FINANCE_OFFICER;
    public bool CannotViewAuditLogs => !CanViewAuditLogs;

    // KPIs
    public string KpiExtractedText => $"{ExtractionLogs.Sum(x => x.RawTonnageMt):F1} MT";
    public string KpiProcessedText => $"{ExtractionLogs.Sum(x => x.RawTonnageMt) * 0.868:F1} MT";
    public string KpiDispatchedText => $"{WeighbridgeTickets.Where(t => t.Status == "ACTIVE").Sum(t => t.NetWeightKg) / 1000.0:F2} MT";
    public string KpiRevenueText => CanViewFinancials
        ? FormatMoney(WeighbridgeTickets.Where(t => t.Status == "ACTIVE").Sum(t => (t.NetWeightKg / 1000.0) * t.UnitPriceAfnPerMt))
        : "RBAC Restricted";
    public string KpiRoyaltyText => $"MoMP Royalty: {FormatMoney(ExtractionLogs.Sum(x => x.RawTonnageMt) * 350.0)}";
    public string KpiFuelText
    {
        get
        {
            var tons = ExtractionLogs.Sum(x => x.RawTonnageMt);
            var fuel = ExtractionLogs.Sum(x => x.FuelUsedL);
            return tons > 0 ? $"{fuel / tons:F2} L/MT ({fuel:N0} L)" : "0 L/MT";
        }
    }
    public string PendingSyncLabel => $"{Strings["SyncNow"]} ({PendingSyncCount})";
    public int PendingSyncCount =>
        WeighbridgeTickets.Count(t => t.SyncState == "PENDING_SYNC") +
        ExtractionLogs.Count(e => e.SyncState == "PENDING_SYNC") +
        AttendanceRecords.Count(a => a.SyncState == "PENDING_SYNC") +
        HseIncidents.Count(h => h.SyncState == "PENDING_SYNC");
    public bool HasPendingSync => PendingSyncCount > 0;

    // Weighbridge Search & Filter
    private string _ticketSearch = "";
    public string TicketSearch { get => _ticketSearch; set { _ticketSearch = value; OnPropertyChanged(); ApplyTicketFilter(); } }
    private string _ticketStatusFilter = "ALL";
    public string TicketStatusFilter { get => _ticketStatusFilter; set { _ticketStatusFilter = value; OnPropertyChanged(); ApplyTicketFilter(); } }

    // Weighbridge Form Fields
    public string TicketDirection { get; set; } = "OUTBOUND_DISPATCH";
    public string TicketSaltGrade { get; set; } = "REFINED_IODIZED_25KG";
    public string TicketDestination { get; set; } = "ISLAM_QALA_EXPORT";
    public string TicketPaymentMethod { get; set; } = "HAWALA";
    public string TicketHawalaRef { get; set; } = "Saraf Aria #HW-2026";
    private string _ticketPlate = "HRT-62910";
    public string TicketPlate { get => _ticketPlate; set { _ticketPlate = value; OnPropertyChanged(); } }
    private string _ticketDriver = "Bismillah Khan";
    public string TicketDriver { get => _ticketDriver; set { _ticketDriver = value; OnPropertyChanged(); } }
    private string _ticketTazkira = "1399-0211-54820";
    public string TicketTazkira { get => _ticketTazkira; set { _ticketTazkira = value; OnPropertyChanged(); } }
    private string _ticketBuyer = "Khorasan Food Industries";
    public string TicketBuyer { get => _ticketBuyer; set { _ticketBuyer = value; OnPropertyChanged(); } }
    private double _ticketGrossKg = 38500;
    public double TicketGrossKg { get => _ticketGrossKg; set { _ticketGrossKg = value; OnPropertyChanged(); OnPropertyChanged(nameof(TicketNetKgPreview)); } }
    private double _ticketTareKg = 13500;
    public double TicketTareKg { get => _ticketTareKg; set { _ticketTareKg = value; OnPropertyChanged(); OnPropertyChanged(nameof(TicketNetKgPreview)); } }
    private double _ticketPriceAfn = 6800;
    public double TicketPriceAfn { get => _ticketPriceAfn; set { _ticketPriceAfn = value; OnPropertyChanged(); } }
    public string TicketNetKgPreview => $"{Math.Max(0, TicketGrossKg - TicketTareKg):N0} kg ({Math.Max(0, TicketGrossKg - TicketTareKg) / 1000.0:F2} MT)";

    // Extraction Form Fields
    public string ExtZone { get; set; } = "GHR-PIT-01";
    public string ExtShift { get; set; } = "SHIFT_A_DAY";
    public string ExtMethod { get; set; } = "ROCK_BLASTING_CUTTING";
    public string ExtEquipment { get; set; } = "EXC-CAT336-02";
    public string ExtLead { get; set; } = "Eng. Ahmadullah Noori";
    public double ExtTons { get; set; } = 42.5;
    public double ExtFuel { get; set; } = 115;

    // Processing & Transfer Form Fields
    public string ProcGrade { get; set; } = "REFINED_IODIZED_25KG";
    public string ProcWarehouse { get; set; } = "WH-HRT-CITY";
    public double ProcIntakeMt { get; set; } = 100;
    public double ProcOutputMt { get; set; } = 88;
    public double ProcIodinePpm { get; set; } = 40;

    public string TrfType { get; set; } = "TRANSFER";
    public string TrfFrom { get; set; } = "WH-GHR-SITE";
    public string TrfTo { get; set; } = "WH-HRT-CITY";
    public string TrfGrade { get; set; } = "REFINED_IODIZED_25KG";
    public double TrfQtyMt { get; set; } = 25;
    public string TrfReason { get; set; } = "Herat depot staging transfer";

    // Finance / Hawala Settlement Form Fields
    public string FinType { get; set; } = "RECEIVABLE_PAYMENT";
    public string FinCounterparty { get; set; } = "Khorasan Food Industries (Mashhad)";
    public string FinCurrency { get; set; } = "USD";
    public double FinAmount { get; set; } = 2500;
    public string FinMethod { get; set; } = "HAWALA";
    public string FinReference { get; set; } = "Saraf Aria #HW-2026-441";

    // HSE & PPE Form Fields
    public string HseZone { get; set; } = "GHR-PIT-01";
    public string HseCategory { get; set; } = "DUST_EXCEEDANCE";
    public string HseSeverity { get; set; } = "LOW";
    public bool HsePpeCompliant { get; set; } = true;
    private string _hseDesc = "Routine PM10 dust inspection completed";
    public string HseDesc { get => _hseDesc; set { _hseDesc = value; OnPropertyChanged(); } }

    // QR Waybill Slide-Over Drawer
    private WeighbridgeTicket? _selectedWaybill;
    public WeighbridgeTicket? SelectedWaybill
    {
        get => _selectedWaybill;
        set { _selectedWaybill = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsWaybillDrawerOpen)); }
    }
    public bool IsWaybillDrawerOpen => SelectedWaybill is not null;

    // Toast
    private string _toastMessage = "";
    public string ToastMessage { get => _toastMessage; set { _toastMessage = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsToastVisible)); } }
    public bool IsToastVisible => !string.IsNullOrWhiteSpace(ToastMessage);

    // Commands
    public ICommand SelectTabCommand { get; }
    public ICommand ToggleThemeCommand { get; }
    public ICommand SetLangCommand { get; }
    public ICommand SetCurrencyCommand { get; }
    public ICommand OpenLoginCommand { get; }
    public ICommand CloseLoginCommand { get; }
    public ICommand SignInOperatorCommand { get; }
    public ICommand SetTicketFilterCommand { get; }
    public ICommand CaptureScaleCommand { get; }
    public ICommand IssueTicketCommand { get; }
    public ICommand RequestVoidCommand { get; }
    public ICommand ApproveVoidCommand { get; }
    public ICommand OpenWaybillCommand { get; }
    public ICommand CloseWaybillCommand { get; }
    public ICommand PrintWaybillCommand { get; }
    public ICommand LogExtractionCommand { get; }
    public ICommand CompleteFleetServiceCommand { get; }
    public ICommand LogFleetBreakdownCommand { get; }
    public ICommand LogProcessingBatchCommand { get; }
    public ICommand RecordTransferCommand { get; }
    public ICommand PostFinancialEntryCommand { get; }
    public ICommand SettleInvoiceCommand { get; }
    public ICommand MarkRoyaltyFiledCommand { get; }
    public ICommand MarkRoyaltyPaidCommand { get; }
    public ICommand LogAttendanceCommand { get; }
    public ICommand LogHseIncidentCommand { get; }
    public ICommand IssuePpeKitCommand { get; }
    public ICommand SyncQueueCommand { get; }
    public ICommand ExportCsvCommand { get; }

    public MainViewModel()
    {
        _snapshot = _dataService.LoadOrSeed();
        _usdToAfn = _snapshot.UsdToAfn;
        Zones = new(_snapshot.Zones);
        FleetAssets = new(_snapshot.FleetAssets);
        ExtractionLogs = new(_snapshot.ExtractionLogs);
        WeighbridgeTickets = new(_snapshot.WeighbridgeTickets);
        WarehouseStocks = new(_snapshot.WarehouseStocks);
        InventoryTransfers = new(_snapshot.InventoryTransfers);
        ProcessingBatches = new(_snapshot.ProcessingBatches);
        Customers = new(_snapshot.Customers);
        Contracts = new(_snapshot.Contracts);
        Invoices = new(_snapshot.Invoices);
        FinancialLedger = new(_snapshot.FinancialLedger);
        MompRoyalties = new(_snapshot.MompRoyalties);
        PayrollRecords = new(_snapshot.PayrollRecords);
        AttendanceRecords = new(_snapshot.AttendanceRecords);
        PpeIssuances = new(_snapshot.PpeIssuances);
        HseIncidents = new(_snapshot.HseIncidents);
        AuditLogs = new(_snapshot.AuditLogs);
        ApplyTicketFilter();

        SelectTabCommand = new RelayCommand(p => ActiveTab = p?.ToString() ?? "Dashboard");
        ToggleThemeCommand = new RelayCommand(_ => IsDarkTheme = !IsDarkTheme);
        SetLangCommand = new RelayCommand(p => { if (Enum.TryParse<LangCode>(p?.ToString(), out var l)) CurrentLang = l; });
        SetCurrencyCommand = new RelayCommand(p => { if (Enum.TryParse<CurrencyCode>(p?.ToString(), out var c)) CurrentCurrency = c; });
        OpenLoginCommand = new RelayCommand(_ => IsLoginOpen = true);
        CloseLoginCommand = new RelayCommand(_ => IsLoginOpen = false);
        SignInOperatorCommand = new RelayCommand(_ => SignInOperator());
        SetTicketFilterCommand = new RelayCommand(p => TicketStatusFilter = p?.ToString() ?? "ALL");
        CaptureScaleCommand = new RelayCommand(_ => CaptureRs232Scale());
        IssueTicketCommand = new RelayCommand(_ => IssueWeighbridgeTicket());
        RequestVoidCommand = new RelayCommand(p => RequestTicketVoid(p as WeighbridgeTicket));
        ApproveVoidCommand = new RelayCommand(p => ApproveTicketVoid(p as WeighbridgeTicket));
        OpenWaybillCommand = new RelayCommand(p => SelectedWaybill = p as WeighbridgeTicket);
        CloseWaybillCommand = new RelayCommand(_ => SelectedWaybill = null);
        PrintWaybillCommand = new RelayCommand(_ => PrintThermalWaybill());
        LogExtractionCommand = new RelayCommand(_ => LogExtraction());
        CompleteFleetServiceCommand = new RelayCommand(p => UpdateFleet(p as FleetAsset, false));
        LogFleetBreakdownCommand = new RelayCommand(p => UpdateFleet(p as FleetAsset, true));
        LogProcessingBatchCommand = new RelayCommand(_ => LogProcessingBatch());
        RecordTransferCommand = new RelayCommand(_ => RecordTransfer());
        PostFinancialEntryCommand = new RelayCommand(_ => PostFinancialEntry());
        SettleInvoiceCommand = new RelayCommand(p => SettleInvoice(p as InvoiceRecord));
        MarkRoyaltyFiledCommand = new RelayCommand(p => UpdateRoyalty(p as MompRoyalty, "FILED"));
        MarkRoyaltyPaidCommand = new RelayCommand(p => UpdateRoyalty(p as MompRoyalty, "PAID"));
        LogAttendanceCommand = new RelayCommand(_ => LogBiometricAttendance());
        LogHseIncidentCommand = new RelayCommand(_ => LogHseIncident());
        IssuePpeKitCommand = new RelayCommand(_ => IssuePpeKit());
        SyncQueueCommand = new RelayCommand(async _ => await SyncOfflineQueueAsync());
        ExportCsvCommand = new RelayCommand(_ => ExportCsv());
    }

    public string FormatMoney(double amountAfn) =>
        CurrentCurrency == CurrencyCode.USD ? $"${amountAfn / UsdToAfn:N2}" : $"{Math.Round(amountAfn):N0} ؋";

    private void SignInOperator()
    {
        var email = LoginEmail.Trim().ToLowerInvariant();
        ActiveRole = email switch
        {
            "ops@heratsalt.af" => UserRole.SITE_OPS_MANAGER,
            "kanta@heratsalt.af" => UserRole.WEIGHBRIDGE_CLERK,
            "warehouse@heratsalt.af" => UserRole.WAREHOUSE_OFFICER,
            "finance@heratsalt.af" => UserRole.FINANCE_OFFICER,
            "hse@heratsalt.af" => UserRole.HSE_COMPLIANCE_OFFICER,
            _ => UserRole.MINE_OWNER
        };
        _dataService.SealJwtTokenDpapi($"jwt.{email}.{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}");
        OperatorBadge = $"DPAPI Sealed: {email}";
        IsLoginOpen = false;
        ShowToast($"Authenticated & DPAPI-sealed session for {email}");
    }

    private void ApplyTicketFilter()
    {
        FilteredTickets.Clear();
        var q = TicketSearch.Trim().ToLowerInvariant();
        foreach (var t in WeighbridgeTickets)
        {
            if (TicketStatusFilter != "ALL" && t.Status != TicketStatusFilter) continue;
            if (!string.IsNullOrEmpty(q) &&
                !t.TicketNumber.ToLowerInvariant().Contains(q) &&
                !t.TruckPlate.ToLowerInvariant().Contains(q) &&
                !t.CounterpartyName.ToLowerInvariant().Contains(q))
                continue;
            FilteredTickets.Add(t);
        }
    }

    private void CaptureRs232Scale()
    {
        var (weightKg, mode, scaleId) = _kantaService.CaptureWeight("COM3");
        TicketGrossKg = weightKg;
        ShowToast($"Locked {weightKg:N0} kg from {scaleId} ({mode})");
    }

    private void IssueWeighbridgeTicket()
    {
        if (TicketGrossKg <= TicketTareKg) { ShowToast("Error: Gross must exceed Tare."); return; }
        var seq = 1845 + WeighbridgeTickets.Count;
        var ticketNo = $"KNT-2026-{seq:D6}";
        var now = DateTime.UtcNow;
        var netKg = TicketGrossKg - TicketTareKg;

        var ticket = new WeighbridgeTicket
        {
            TicketNumber = ticketNo,
            Direction = TicketDirection,
            TruckPlate = TicketPlate.Trim(),
            DriverName = TicketDriver.Trim(),
            DriverTazkira = TicketTazkira.Trim(),
            CounterpartyName = TicketBuyer.Trim(),
            SaltGrade = TicketSaltGrade,
            DestinationType = TicketDestination,
            GrossWeightKg = TicketGrossKg,
            TareWeightKg = TicketTareKg,
            UnitPriceAfnPerMt = TicketPriceAfn,
            LockedUsdToAfn = UsdToAfn,
            PaymentMethod = TicketPaymentMethod,
            HawalaRef = TicketHawalaRef,
            QrPayloadHash = ErpDataService.GenerateSha256QrSeal(ticketNo, TicketPlate, netKg, now),
            SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED",
            OperatorName = ActiveRole.ToString(),
            WeighOutAt = now
        };

        WeighbridgeTickets.Insert(0, ticket);
        _snapshot.WeighbridgeTickets.Insert(0, ticket);

        // Auto-generate linked Invoice for outbound dispatches
        if (TicketDirection == "OUTBOUND_DISPATCH")
        {
            var inv = new InvoiceRecord
            {
                InvoiceNumber = $"INV-2026-{883 + Invoices.Count}",
                TicketNumber = ticketNo,
                CustomerName = ticket.CounterpartyName,
                QuantityMt = Math.Round(netKg / 1000.0, 2),
                TotalAfn = Math.Round((netKg / 1000.0) * TicketPriceAfn, 0),
                PaidAfn = 0,
                Status = "ISSUED"
            };
            Invoices.Insert(0, inv);
            _snapshot.Invoices.Insert(0, inv);
        }

        AddAudit("weighbridge_tickets", ticketNo, "INSERT", $"Issued {netKg / 1000.0:F2} MT ({TicketSaltGrade}) for {ticket.TruckPlate}");
        ApplyTicketFilter();
        PersistAndRefresh();
        ShowToast(IsOfflineMode ? $"Queued {ticketNo} offline" : $"Issued {ticketNo} + Invoice");
    }

    private void RequestTicketVoid(WeighbridgeTicket? ticket)
    {
        if (ticket is null || ticket.Status != "ACTIVE") return;
        ticket.Status = "VOID_PENDING";
        ticket.VoidReason = "Operator requested void pending supervisor review";
        AddAudit("weighbridge_tickets", ticket.TicketNumber, "VOID_REQUEST", ticket.VoidReason);
        ApplyTicketFilter();
        PersistAndRefresh();
        ShowToast($"Void requested for {ticket.TicketNumber}");
    }

    private void ApproveTicketVoid(WeighbridgeTicket? ticket)
    {
        if (ticket is null) return;
        if (!CanApproveVoid) { ShowToast("SECURITY VIOLATION: Supervisor role required."); return; }
        ticket.Status = "VOIDED";
        ticket.VoidApprovedBy = ActiveRole.ToString();
        AddAudit("weighbridge_tickets", ticket.TicketNumber, "VOID_APPROVE", $"Supervisor approved void on {ticket.TicketNumber}");
        ApplyTicketFilter();
        PersistAndRefresh();
        ShowToast($"Void approved for {ticket.TicketNumber}");
    }

    private void LogExtraction()
    {
        if (ExtTons <= 0) return;
        var log = new ExtractionLog
        {
            ZoneCode = ExtZone, ShiftCode = ExtShift, Method = ExtMethod,
            EquipmentCode = ExtEquipment, RawTonnageMt = ExtTons, CrewLeadName = ExtLead,
            FuelUsedL = ExtFuel, EngineHoursDelta = 4.5, SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED"
        };
        ExtractionLogs.Insert(0, log);
        _snapshot.ExtractionLogs.Insert(0, log);
        var zone = Zones.FirstOrDefault(z => z.Code == ExtZone);
        if (zone is not null) zone.TodayExtractedMt = Math.Round(zone.TodayExtractedMt + ExtTons, 1);
        AddAudit("extraction_logs", ExtZone, "INSERT", $"Logged {ExtTons:F1} MT ({ExtMethod})");
        PersistAndRefresh();
        ShowToast($"Logged {ExtTons:F1} MT in {ExtZone}");
    }

    private void UpdateFleet(FleetAsset? asset, bool isBreakdown)
    {
        if (asset is null) return;
        if (isBreakdown)
        {
            asset.Status = "MAINTENANCE";
            asset.DowntimeHoursMonth = Math.Round(asset.DowntimeHoursMonth + 2.5, 1);
            AddAudit("fleet_maintenance", asset.AssetCode, "STATUS_UPDATE", "Logged +2.5h breakdown downtime");
            ShowToast($"{asset.AssetCode}: +2.5h breakdown logged");
        }
        else
        {
            asset.Status = "OPERATIONAL";
            asset.NextServiceHours = Math.Round(asset.EngineHours + 500);
            asset.LastServiceDate = DateTime.Now.ToString("yyyy-MM-dd");
            AddAudit("fleet_maintenance", asset.AssetCode, "STATUS_UPDATE", "Completed 500-hr preventive service");
            ShowToast($"{asset.AssetCode} marked OPERATIONAL");
        }
        PersistAndRefresh();
    }

    private void LogProcessingBatch()
    {
        if (ProcOutputMt > ProcIntakeMt || ProcOutputMt <= 0) { ShowToast("Output MT must be <= Intake MT"); return; }
        var batch = new ProcessingBatch
        {
            BatchCode = $"PRC-2026-0{414 + ProcessingBatches.Count}",
            SaltGrade = ProcGrade, WarehouseCode = ProcWarehouse,
            IntakeMt = ProcIntakeMt, OutputMt = ProcOutputMt, IodinePpm = ProcIodinePpm
        };
        ProcessingBatches.Insert(0, batch);
        _snapshot.ProcessingBatches.Insert(0, batch);

        var stock = WarehouseStocks.FirstOrDefault(s => s.WarehouseCode == ProcWarehouse && s.SaltGrade == ProcGrade);
        if (stock is not null) stock.QuantityMt = Math.Round(stock.QuantityMt + ProcOutputMt, 1);
        AddAudit("processing_batches", batch.BatchCode, "INSERT", $"Processed {ProcOutputMt} MT ({ProcIodinePpm} ppm I2) into {ProcWarehouse}");
        PersistAndRefresh();
        ShowToast($"Recorded batch {batch.BatchCode}");
    }

    private void RecordTransfer()
    {
        if (TrfQtyMt <= 0) return;
        var from = WarehouseStocks.FirstOrDefault(s => s.WarehouseCode == TrfFrom);
        if (from is not null) from.QuantityMt = Math.Max(0, Math.Round(from.QuantityMt - TrfQtyMt, 1));
        if (TrfType == "TRANSFER")
        {
            var to = WarehouseStocks.FirstOrDefault(s => s.WarehouseCode == TrfTo);
            if (to is not null) to.QuantityMt = Math.Round(to.QuantityMt + TrfQtyMt, 1);
        }
        var rec = new InventoryTransfer
        {
            TransferCode = $"{(TrfType == "TRANSFER" ? "TRF" : "ADJ")}-2026-0{200 + InventoryTransfers.Count}",
            TransferType = TrfType, FromWarehouse = TrfFrom, ToWarehouse = TrfType == "TRANSFER" ? TrfTo : "-",
            SaltGrade = TrfGrade, QuantityMt = TrfQtyMt, Reason = TrfReason
        };
        InventoryTransfers.Insert(0, rec);
        _snapshot.InventoryTransfers.Insert(0, rec);
        AddAudit("inventory_transfers", rec.TransferCode, "TRANSFER", $"{TrfType}: {TrfQtyMt} MT ({TrfFrom} -> {rec.ToWarehouse})");
        PersistAndRefresh();
        ShowToast($"Recorded {rec.TransferCode}");
    }

    private void PostFinancialEntry()
    {
        if (!CanViewFinancials || FinAmount <= 0) return;
        var entry = new FinancialEntry
        {
            EntryType = FinType, Counterparty = FinCounterparty, Currency = FinCurrency,
            Amount = FinAmount, LockedUsdToAfn = UsdToAfn, Method = FinMethod, Reference = FinReference
        };
        FinancialLedger.Insert(0, entry);
        _snapshot.FinancialLedger.Insert(0, entry);
        AddAudit("financial_ledger", FinReference, "INSERT", $"{FinType}: {FinAmount} {FinCurrency} via {FinMethod}");
        PersistAndRefresh();
        ShowToast($"Posted {FinAmount} {FinCurrency} to ledger");
    }

    private void SettleInvoice(InvoiceRecord? inv)
    {
        if (inv is null || !CanViewFinancials) return;
        inv.PaidAfn = inv.TotalAfn;
        inv.Status = "PAID";
        AddAudit("invoices", inv.InvoiceNumber, "STATUS_UPDATE", $"Settled full balance on {inv.InvoiceNumber}");
        PersistAndRefresh();
        ShowToast($"Invoice {inv.InvoiceNumber} marked PAID");
    }

    private void UpdateRoyalty(MompRoyalty? royalty, string status)
    {
        if (royalty is null || !CanViewFinancials) return;
        royalty.Status = status;
        AddAudit("momp_royalties", royalty.CustomsBorderRef, "STATUS_UPDATE", $"Marked {royalty.PeriodLabel} {status}");
        PersistAndRefresh();
        ShowToast($"MoMP Royalty marked {status}");
    }

    private void LogBiometricAttendance()
    {
        var emp = PayrollRecords.FirstOrDefault();
        if (emp is null) return;
        var rec = new AttendanceRecord
        {
            EmployeeCode = emp.EmployeeCode, FullName = emp.FullName,
            ShiftCode = "SHIFT_A_DAY", Method = "BIOMETRIC_FINGERPRINT",
            CheckInTime = DateTime.Now.ToString("HH:mm:ss"), Status = "PRESENT",
            SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED"
        };
        AttendanceRecords.Insert(0, rec);
        _snapshot.AttendanceRecords.Insert(0, rec);
        AddAudit("attendance", rec.EmployeeCode, "INSERT", $"Biometric check-in for {rec.FullName}");
        PersistAndRefresh();
        ShowToast(IsOfflineMode ? "Biometric check-in queued offline" : $"Checked in {rec.FullName}");
    }

    private void LogHseIncident()
    {
        var inc = new HseIncident
        {
            ZoneCode = HseZone, IncidentType = HseCategory, Severity = HseSeverity,
            Description = HseDesc, PpeCompliant = HsePpeCompliant,
            SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED"
        };
        HseIncidents.Insert(0, inc);
        _snapshot.HseIncidents.Insert(0, inc);
        AddAudit("hse_incidents", HseZone, "INSERT", $"HSE {HseSeverity} {HseCategory}: {HseDesc}");
        PersistAndRefresh();
        ShowToast("HSE safety report logged");
    }

    private void IssuePpeKit()
    {
        var emp = PayrollRecords.Skip(1).FirstOrDefault() ?? PayrollRecords.FirstOrDefault();
        if (emp is null) return;
        var ppe = new PpeIssuance
        {
            EmployeeCode = emp.EmployeeCode, FullName = emp.FullName,
            Items = "N95 Dust Respirator Kit, Safety Helmet, Reflective Vest",
            IssuedDate = DateTime.Now.ToString("yyyy-MM-dd"), Inspector = ActiveRole.ToString()
        };
        PpeIssuances.Insert(0, ppe);
        _snapshot.PpeIssuances.Insert(0, ppe);
        PersistAndRefresh();
        ShowToast($"Issued PPE kit to {emp.FullName}");
    }

    private async Task SyncOfflineQueueAsync()
    {
        int count = await _dataService.SyncPendingRecordsAsync(_snapshot, "http://localhost:3000");
        foreach (var a in AttendanceRecords.Where(x => x.SyncState == "PENDING_SYNC")) { a.SyncState = "SYNCED"; count++; }
        if (count > 0)
        {
            ApplyTicketFilter();
            RefreshKpis();
            ShowToast($"Reconciled {count} offline record(s)");
        }
    }

    private void ExportCsv()
    {
        var path = _dataService.ExportAuditCsv(_snapshot);
        ShowToast($"Exported CSV to Desktop: {System.IO.Path.GetFileName(path)}");
    }

    private void PrintThermalWaybill()
    {
        if (SelectedWaybill is null) return;
        var dlg = new PrintDialog();
        if (dlg.ShowDialog() != true) return;
        var doc = new FlowDocument
        {
            PageWidth = 300, PagePadding = new Thickness(12), FlowDirection = WindowFlowDirection,
            FontFamily = new FontFamily("Segoe UI"), FontSize = 11
        };
        doc.Blocks.Add(new Paragraph(new Bold(new Run("HERAT SALT MINE — KANTA WAYBILL"))) { TextAlignment = TextAlignment.Center });
        doc.Blocks.Add(new Paragraph(new Run($"Ticket: {SelectedWaybill.TicketNumber}\nPlate: {SelectedWaybill.TruckPlate}\nDriver: {SelectedWaybill.DriverName}\nTazkira: {SelectedWaybill.DriverTazkira}\nBuyer: {SelectedWaybill.CounterpartyName}\nGrade: {SelectedWaybill.SaltGrade}\nDest: {SelectedWaybill.DestinationType}\nGross: {SelectedWaybill.GrossWeightKg:N0} kg\nTare: {SelectedWaybill.TareWeightKg:N0} kg\nNET: {SelectedWaybill.NetWeightKg:N0} kg ({SelectedWaybill.NetWeightKg / 1000.0:F2} MT)\nFX: 1 USD = {SelectedWaybill.LockedUsdToAfn} AFN\nSHA256: {SelectedWaybill.QrPayloadHash}")));
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, SelectedWaybill.TicketNumber);
        ShowToast($"Printed {SelectedWaybill.TicketNumber}");
    }

    private void AddAudit(string table, string recordRef, string action, string summary)
    {
        var entry = new AuditLogEntry { Timestamp = DateTime.Now.ToString("HH:mm:ss"), TableName = table, RecordRef = recordRef, Action = action, Summary = summary, Actor = ActiveRole.ToString() };
        AuditLogs.Insert(0, entry);
        _snapshot.AuditLogs.Insert(0, entry);
    }

    private void PersistAndRefresh() { _dataService.Save(_snapshot); RefreshKpis(); }

    private void RefreshKpis()
    {
        OnPropertyChanged(nameof(KpiExtractedText));
        OnPropertyChanged(nameof(KpiProcessedText));
        OnPropertyChanged(nameof(KpiDispatchedText));
        OnPropertyChanged(nameof(KpiRevenueText));
        OnPropertyChanged(nameof(KpiRoyaltyText));
        OnPropertyChanged(nameof(KpiFuelText));
        OnPropertyChanged(nameof(PendingSyncCount));
        OnPropertyChanged(nameof(PendingSyncLabel));
        OnPropertyChanged(nameof(HasPendingSync));
    }

    public async void ShowToast(string msg)
    {
        ToastMessage = msg;
        await Task.Delay(2600);
        if (ToastMessage == msg) ToastMessage = "";
    }
}
