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
    public ObservableCollection<WarehouseStock> WarehouseStocks { get; }
    public ObservableCollection<ProcessingBatch> ProcessingBatches { get; }
    public ObservableCollection<FinancialEntry> FinancialLedger { get; }
    public ObservableCollection<MompRoyalty> MompRoyalties { get; }
    public ObservableCollection<EmployeePayroll> PayrollRecords { get; }
    public ObservableCollection<HseIncident> HseIncidents { get; }
    public ObservableCollection<AuditLogEntry> AuditLogs { get; }

    public IReadOnlyList<UserRole> AllRoles { get; } = Enum.GetValues<UserRole>();

    // Navigation & Theme State
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

    private UserRole _activeRole = UserRole.MINE_OWNER;
    public UserRole ActiveRole
    {
        get => _activeRole;
        set
        {
            _activeRole = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(CanViewFinancials));
            OnPropertyChanged(nameof(CanApproveVoid));
            OnPropertyChanged(nameof(CanViewAuditLogs));
            RefreshKpis();
            ShowToast($"Active Role: {value}");
        }
    }

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

    // RBAC Computed Properties
    public bool CanViewFinancials => ActiveRole is UserRole.MINE_OWNER or UserRole.FINANCE_OFFICER;
    public bool CanApproveVoid => ActiveRole is UserRole.MINE_OWNER or UserRole.SITE_OPS_MANAGER;
    public bool CanViewAuditLogs => ActiveRole is UserRole.MINE_OWNER or UserRole.SITE_OPS_MANAGER or UserRole.FINANCE_OFFICER;

    // KPIs
    public string KpiExtractedText => $"{ExtractionLogs.Sum(x => x.RawTonnageMt):F1} MT";
    public string KpiProcessedText => $"{ExtractionLogs.Sum(x => x.RawTonnageMt) * 0.868:F1} MT";
    public string KpiDispatchedText => $"{WeighbridgeTickets.Where(t => t.Status == "ACTIVE").Sum(t => t.NetWeightKg) / 1000.0:F2} MT";
    public string KpiRevenueText => CanViewFinancials
        ? FormatMoney(WeighbridgeTickets.Where(t => t.Status == "ACTIVE").Sum(t => (t.NetWeightKg / 1000.0) * t.UnitPriceAfnPerMt))
        : "RBAC Restricted";
    public string KpiRoyaltyText => FormatMoney(ExtractionLogs.Sum(x => x.RawTonnageMt) * 350.0);
    public string PendingSyncLabel => $"{Strings["SyncNow"]} ({PendingSyncCount})";
    public int PendingSyncCount =>
        WeighbridgeTickets.Count(t => t.SyncState == "PENDING_SYNC") +
        ExtractionLogs.Count(e => e.SyncState == "PENDING_SYNC") +
        HseIncidents.Count(h => h.SyncState == "PENDING_SYNC");
    public bool HasPendingSync => PendingSyncCount > 0;

    // Weighbridge Form Fields
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
    private string _extZone = "GHR-PIT-01";
    public string ExtZone { get => _extZone; set { _extZone = value; OnPropertyChanged(); } }
    private string _extLead = "Eng. Ahmadullah Noori";
    public string ExtLead { get => _extLead; set { _extLead = value; OnPropertyChanged(); } }
    private double _extTons = 42.5;
    public double ExtTons { get => _extTons; set { _extTons = value; OnPropertyChanged(); } }
    private double _extFuel = 115;
    public double ExtFuel { get => _extFuel; set { _extFuel = value; OnPropertyChanged(); } }

    // QR Waybill Slide-Over Drawer
    private WeighbridgeTicket? _selectedWaybill;
    public WeighbridgeTicket? SelectedWaybill
    {
        get => _selectedWaybill;
        set { _selectedWaybill = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsWaybillDrawerOpen)); }
    }
    public bool IsWaybillDrawerOpen => SelectedWaybill is not null;

    // Toast Notification
    private string _toastMessage = "";
    public string ToastMessage { get => _toastMessage; set { _toastMessage = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsToastVisible)); } }
    public bool IsToastVisible => !string.IsNullOrWhiteSpace(ToastMessage);

    // Commands
    public ICommand SelectTabCommand { get; }
    public ICommand ToggleThemeCommand { get; }
    public ICommand SetLangCommand { get; }
    public ICommand SetCurrencyCommand { get; }
    public ICommand CaptureScaleCommand { get; }
    public ICommand IssueTicketCommand { get; }
    public ICommand ApproveVoidCommand { get; }
    public ICommand OpenWaybillCommand { get; }
    public ICommand CloseWaybillCommand { get; }
    public ICommand PrintWaybillCommand { get; }
    public ICommand LogExtractionCommand { get; }
    public ICommand CompleteFleetServiceCommand { get; }
    public ICommand SyncQueueCommand { get; }
    public ICommand ExportCsvCommand { get; }
    public ICommand MarkRoyaltyPaidCommand { get; }

    public MainViewModel()
    {
        _snapshot = _dataService.LoadOrSeed();
        Zones = new(_snapshot.Zones);
        FleetAssets = new(_snapshot.FleetAssets);
        ExtractionLogs = new(_snapshot.ExtractionLogs);
        WeighbridgeTickets = new(_snapshot.WeighbridgeTickets);
        WarehouseStocks = new(_snapshot.WarehouseStocks);
        ProcessingBatches = new(_snapshot.ProcessingBatches);
        FinancialLedger = new(_snapshot.FinancialLedger);
        MompRoyalties = new(_snapshot.MompRoyalties);
        PayrollRecords = new(_snapshot.PayrollRecords);
        HseIncidents = new(_snapshot.HseIncidents);
        AuditLogs = new(_snapshot.AuditLogs);

        SelectTabCommand = new RelayCommand(p => ActiveTab = p?.ToString() ?? "Dashboard");
        ToggleThemeCommand = new RelayCommand(_ => IsDarkTheme = !IsDarkTheme);
        SetLangCommand = new RelayCommand(p =>
        {
            if (Enum.TryParse<LangCode>(p?.ToString(), out var l)) CurrentLang = l;
        });
        SetCurrencyCommand = new RelayCommand(p =>
        {
            if (Enum.TryParse<CurrencyCode>(p?.ToString(), out var c)) CurrentCurrency = c;
        });
        CaptureScaleCommand = new RelayCommand(_ => CaptureRs232Scale());
        IssueTicketCommand = new RelayCommand(_ => IssueWeighbridgeTicket());
        ApproveVoidCommand = new RelayCommand(p => ApproveTicketVoid(p as WeighbridgeTicket));
        OpenWaybillCommand = new RelayCommand(p => SelectedWaybill = p as WeighbridgeTicket);
        CloseWaybillCommand = new RelayCommand(_ => SelectedWaybill = null);
        PrintWaybillCommand = new RelayCommand(_ => PrintThermalWaybill());
        LogExtractionCommand = new RelayCommand(_ => LogExtraction());
        CompleteFleetServiceCommand = new RelayCommand(p => CompleteFleetService(p as FleetAsset));
        SyncQueueCommand = new RelayCommand(async _ => await SyncOfflineQueueAsync());
        ExportCsvCommand = new RelayCommand(_ => ExportCsv());
        MarkRoyaltyPaidCommand = new RelayCommand(p => MarkRoyaltyPaid(p as MompRoyalty));
    }

    public string FormatMoney(double amountAfn)
    {
        if (CurrentCurrency == CurrencyCode.USD)
            return $"${amountAfn / _snapshot.UsdToAfn:N2}";
        return $"{Math.Round(amountAfn):N0} ؋";
    }

    private void CaptureRs232Scale()
    {
        var (weightKg, mode, scaleId) = _kantaService.CaptureWeight("COM3");
        TicketGrossKg = weightKg;
        ShowToast($"Locked {weightKg:N0} kg from {scaleId} ({mode})");
    }

    private void IssueWeighbridgeTicket()
    {
        if (TicketGrossKg <= TicketTareKg)
        {
            ShowToast("Error: Gross weight must exceed Tare weight.");
            return;
        }

        var seq = 1845 + WeighbridgeTickets.Count;
        var ticketNo = $"KNT-2026-{seq:D6}";
        var now = DateTime.UtcNow;
        var netKg = TicketGrossKg - TicketTareKg;

        var ticket = new WeighbridgeTicket
        {
            TicketNumber = ticketNo,
            TruckPlate = TicketPlate.Trim(),
            DriverName = TicketDriver.Trim(),
            DriverTazkira = TicketTazkira.Trim(),
            CounterpartyName = TicketBuyer.Trim(),
            GrossWeightKg = TicketGrossKg,
            TareWeightKg = TicketTareKg,
            UnitPriceAfnPerMt = TicketPriceAfn,
            LockedUsdToAfn = _snapshot.UsdToAfn,
            QrPayloadHash = ErpDataService.GenerateSha256QrSeal(ticketNo, TicketPlate, netKg, now),
            SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED",
            OperatorName = ActiveRole.ToString(),
            WeighOutAt = now
        };

        WeighbridgeTickets.Insert(0, ticket);
        _snapshot.WeighbridgeTickets.Insert(0, ticket);

        AddAudit("weighbridge_tickets", ticketNo, "INSERT",
            $"Issued {netKg / 1000.0:F2} MT for {ticket.TruckPlate} ({ticket.SyncState})");

        PersistAndRefresh();
        ShowToast(IsOfflineMode ? $"Queued {ticketNo} offline" : $"Issued {ticketNo} with SHA-256 QR");
    }

    private void ApproveTicketVoid(WeighbridgeTicket? ticket)
    {
        if (ticket is null) return;
        if (!CanApproveVoid)
        {
            ShowToast("SECURITY VIOLATION: Supervisor role required to approve void.");
            return;
        }
        ticket.Status = "VOIDED";
        ticket.VoidApprovedBy = ActiveRole.ToString();
        AddAudit("weighbridge_tickets", ticket.TicketNumber, "VOID_APPROVE",
            $"Supervisor approved void on {ticket.TicketNumber}");
        PersistAndRefresh();
        ShowToast($"Void approved for {ticket.TicketNumber}");
    }

    private void LogExtraction()
    {
        if (ExtTons <= 0) return;
        var log = new ExtractionLog
        {
            ZoneCode = ExtZone,
            RawTonnageMt = ExtTons,
            CrewLeadName = ExtLead,
            FuelUsedL = ExtFuel,
            EngineHoursDelta = 4.5,
            SyncState = IsOfflineMode ? "PENDING_SYNC" : "SYNCED"
        };
        ExtractionLogs.Insert(0, log);
        _snapshot.ExtractionLogs.Insert(0, log);

        var zone = Zones.FirstOrDefault(z => z.Code == ExtZone);
        if (zone is not null)
        {
            zone.TodayExtractedMt = Math.Round(zone.TodayExtractedMt + ExtTons, 1);
        }

        AddAudit("extraction_logs", ExtZone, "INSERT", $"Logged {ExtTons:F1} MT ({ExtFuel}L diesel)");
        PersistAndRefresh();
        ShowToast($"Logged {ExtTons:F1} MT in {ExtZone}");
    }

    private void CompleteFleetService(FleetAsset? asset)
    {
        if (asset is null) return;
        asset.Status = "OPERATIONAL";
        asset.NextServiceHours = Math.Round(asset.EngineHours + 500);
        asset.LastServiceDate = DateTime.Now.ToString("yyyy-MM-dd");
        AddAudit("fleet_maintenance", asset.AssetCode, "STATUS_UPDATE", "Completed 500-hr preventive service");
        PersistAndRefresh();
        ShowToast($"{asset.AssetCode} marked OPERATIONAL");
    }

    private void MarkRoyaltyPaid(MompRoyalty? royalty)
    {
        if (royalty is null || !CanViewFinancials) return;
        royalty.Status = "PAID";
        AddAudit("momp_royalties", royalty.CustomsBorderRef, "STATUS_UPDATE", $"Marked {royalty.PeriodLabel} PAID");
        PersistAndRefresh();
        ShowToast($"MoMP Royalty {royalty.PeriodLabel} marked PAID");
    }

    private async Task SyncOfflineQueueAsync()
    {
        int count = await _dataService.SyncPendingRecordsAsync(_snapshot, "http://localhost:3000");
        if (count > 0)
        {
            ReloadCollections();
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
            PageWidth = 300, // 80mm thermal roll width
            PagePadding = new Thickness(12),
            FlowDirection = WindowFlowDirection,
            FontFamily = new FontFamily("Segoe UI"),
            FontSize = 11
        };
        doc.Blocks.Add(new Paragraph(new Bold(new Run("HERAT SALT MINE — KANTA WAYBILL"))) { TextAlignment = TextAlignment.Center });
        doc.Blocks.Add(new Paragraph(new Run($"Ticket: {SelectedWaybill.TicketNumber}\nPlate: {SelectedWaybill.TruckPlate}\nDriver: {SelectedWaybill.DriverName}\nTazkira: {SelectedWaybill.DriverTazkira}\nBuyer: {SelectedWaybill.CounterpartyName}\nGross: {SelectedWaybill.GrossWeightKg:N0} kg\nTare: {SelectedWaybill.TareWeightKg:N0} kg\nNET: {SelectedWaybill.NetWeightKg:N0} kg ({SelectedWaybill.NetWeightKg / 1000.0:F2} MT)\nSHA256: {SelectedWaybill.QrPayloadHash}")));
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, SelectedWaybill.TicketNumber);
        ShowToast($"Sent {SelectedWaybill.TicketNumber} to printer");
    }

    private void AddAudit(string table, string recordRef, string action, string summary)
    {
        var entry = new AuditLogEntry
        {
            Timestamp = DateTime.Now.ToString("HH:mm:ss"),
            TableName = table,
            RecordRef = recordRef,
            Action = action,
            Summary = summary,
            Actor = ActiveRole.ToString()
        };
        AuditLogs.Insert(0, entry);
        _snapshot.AuditLogs.Insert(0, entry);
    }

    private void PersistAndRefresh()
    {
        _dataService.Save(_snapshot);
        RefreshKpis();
    }

    private void ReloadCollections()
    {
        WeighbridgeTickets.Clear();
        foreach (var t in _snapshot.WeighbridgeTickets) WeighbridgeTickets.Add(t);
        ExtractionLogs.Clear();
        foreach (var e in _snapshot.ExtractionLogs) ExtractionLogs.Add(e);
        AuditLogs.Clear();
        foreach (var a in _snapshot.AuditLogs) AuditLogs.Add(a);
        RefreshKpis();
    }

    private void RefreshKpis()
    {
        OnPropertyChanged(nameof(KpiExtractedText));
        OnPropertyChanged(nameof(KpiProcessedText));
        OnPropertyChanged(nameof(KpiDispatchedText));
        OnPropertyChanged(nameof(KpiRevenueText));
        OnPropertyChanged(nameof(KpiRoyaltyText));
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
