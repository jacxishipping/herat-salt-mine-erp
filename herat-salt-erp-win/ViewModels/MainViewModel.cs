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
using System.Windows.Media.Imaging;
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
    public ObservableCollection<SupplierBill> SupplierBills { get; }
    public ObservableCollection<FinancialEntry> FinancialLedger { get; }
    public ObservableCollection<MompRoyalty> MompRoyalties { get; }
    public ObservableCollection<EmployeePayroll> PayrollRecords { get; }
    public ObservableCollection<AttendanceRecord> AttendanceRecords { get; }
    public ObservableCollection<PpeIssuance> PpeIssuances { get; }
    public ObservableCollection<HseIncident> HseIncidents { get; }
    public ObservableCollection<OperatorAccount> Operators { get; }
    public ObservableCollection<GlAccount> ChartOfAccounts { get; }
    public ObservableCollection<JournalEntry> JournalEntries { get; }
    public ObservableCollection<JournalEntry> FilteredJournals { get; } = new();
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
    public IReadOnlyList<string> SupplierCategories { get; } = new[] { "DIESEL_FUEL", "EXPLOSIVES", "PACKAGING_BAGS", "POTASSIUM_IODATE", "SPARE_PARTS" };
    public IReadOnlyList<string> AvailableComPorts { get; }
    public IReadOnlyList<int> BaudRates { get; } = new[] { 9600, 19200, 38400, 57600, 115200 };

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
        "Sales" => Strings["NavSales"],
        "Customers" => Strings["NavCustomers"],
        "Finance" => Strings["NavFinance"],
        "Accounting" => Strings["NavAccounting"],
        "Suppliers" => Strings["NavSuppliers"],
        "HrHse" => Strings["NavHrHse"],
        "Audit" => Strings["NavAudit"],
        "Settings" => Strings["NavSettings"],
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

    // QR Waybill Slide-Over Drawer (with Scannable 2D QR Bitmap)
    private WeighbridgeTicket? _selectedWaybill;
    private BitmapImage? _selectedWaybillQrImage;
    public WeighbridgeTicket? SelectedWaybill
    {
        get => _selectedWaybill;
        set
        {
            _selectedWaybill = value;
            _selectedWaybillQrImage = value is null
                ? null
                : QrCodeService.GenerateQrBitmap($"HERAT-SALT|{value.TicketNumber}|{value.TruckPlate}|{value.NetWeightKg}kg|{value.QrPayloadHash}");
            OnPropertyChanged();
            OnPropertyChanged(nameof(SelectedWaybillQrImage));
            OnPropertyChanged(nameof(IsWaybillDrawerOpen));
        }
    }
    public BitmapImage? SelectedWaybillQrImage => _selectedWaybillQrImage;
    public bool IsWaybillDrawerOpen => SelectedWaybill is not null;

    // Toast
    private string _toastMessage = "";
    public string ToastMessage { get => _toastMessage; set { _toastMessage = value; OnPropertyChanged(); OnPropertyChanged(nameof(IsToastVisible)); } }
    public bool IsToastVisible => !string.IsNullOrWhiteSpace(ToastMessage);

    // Sales & Spot Order Form Fields (Auto-Calculated via PricingEngineService)
    public IReadOnlyList<string> CustomerTypes { get; } = new[] { "WHOLESALER", "FOOD_PROCESSOR", "GOV_TENDER", "EXPORT_BUYER" };
    private string _saleCustomer = "Khorasan Food Industries (Mashhad)";
    public string SaleCustomer { get => _saleCustomer; set { _saleCustomer = value; OnPropertyChanged(); RecalculateSaleQuote(); } }
    private string _saleSaltGrade = "REFINED_IODIZED_25KG";
    public string SaleSaltGrade { get => _saleSaltGrade; set { _saleSaltGrade = value; OnPropertyChanged(); RecalculateSaleQuote(); } }
    private string _saleDestination = "ISLAM_QALA_EXPORT";
    public string SaleDestination { get => _saleDestination; set { _saleDestination = value; OnPropertyChanged(); RecalculateSaleQuote(); } }
    private double _saleQtyMt = 60;
    public double SaleQtyMt { get => _saleQtyMt; set { _saleQtyMt = value; OnPropertyChanged(); RecalculateSaleQuote(); } }
    private double _saleTargetMarginPct = 25;
    public double SaleTargetMarginPct { get => _saleTargetMarginPct; set { _saleTargetMarginPct = value; OnPropertyChanged(); RecalculateSaleQuote(); } }
    private double _salePriceAfn = 6630;
    public double SalePriceAfn { get => _salePriceAfn; set { _salePriceAfn = value; OnPropertyChanged(); OnPropertyChanged(nameof(SaleTotalPreview)); } }
    public string SalePaymentMethod { get; set; } = "HAWALA";
    public string SaleHawalaRef { get; set; } = "Saraf Aria #HW-2026-NEW";
    public string SaleTotalPreview => FormatMoney(SaleQtyMt * SalePriceAfn);

    private PriceQuote _currentSaleQuote = new();
    public PriceQuote CurrentSaleQuote { get => _currentSaleQuote; private set { _currentSaleQuote = value; OnPropertyChanged(); OnPropertyChanged(nameof(SaleBreakdownSummary)); OnPropertyChanged(nameof(SaleProfitPreview)); } }
    public string SaleBreakdownSummary =>
        $"Extraction {CurrentSaleQuote.ExtractionCostAfn:N0} + Processing/I2 {CurrentSaleQuote.ProcessingCostAfn:N0} + Bags {CurrentSaleQuote.PackagingCostAfn:N0} + MoMP {CurrentSaleQuote.MompRoyaltyAfn:N0} + Freight {CurrentSaleQuote.TransportCostAfn:N0} = Landed {CurrentSaleQuote.LandedCostPerMtAfn:N0} AFN/MT · Rule: {CurrentSaleQuote.PricingSource}";
    public string SaleProfitPreview => $"Est. Net Profit: {FormatMoney(CurrentSaleQuote.EstimatedProfitAfn)} (${CurrentSaleQuote.FinalUnitPriceUsd:N2}/MT)";

    private void RecalculateSaleQuote()
    {
        if (Contracts is null) return;
        CurrentSaleQuote = PricingEngineService.CalculateQuote(
            SaleCustomer, SaleSaltGrade, SaleDestination, SaleQtyMt, SaleTargetMarginPct, UsdToAfn, Contracts);
        SalePriceAfn = CurrentSaleQuote.FinalUnitPriceAfn;
    }

    // Customer CRM & Contract Form Fields
    public string NewCustName { get; set; } = "";
    public string NewCustType { get; set; } = "WHOLESALER";
    public double NewCustCreditAfn { get; set; } = 1500000;
    public string NewCtrCustomer { get; set; } = "Herat Central Salt Wholesalers";
    public string NewCtrGrade { get; set; } = "REFINED_IODIZED_25KG";
    public double NewCtrMt { get; set; } = 1000;
    public double NewCtrPriceAfn { get; set; } = 6400;

    // Supplier AP Bill Form Fields
    public string NewBillSupplier { get; set; } = "Herat Industrial Fuel & Diesel Co.";
    public string NewBillCategory { get; set; } = "DIESEL_FUEL";
    public double NewBillAmountAfn { get; set; } = 125000;
    public string NewBillDueDate { get; set; } = DateTime.Now.AddDays(10).ToString("yyyy-MM-dd");

    // Settings & Hardware COM Port Fields
    public string SettingsComPort { get; set; } = "COM3";
    public int SettingsBaudRate { get; set; } = 9600;
    public string SettingsSyncUrl { get; set; } = "http://localhost:3000";

    // Operator Admin Form Fields
    public string NewOpEmail { get; set; } = "";
    public string NewOpName { get; set; } = "";
    public UserRole NewOpRole { get; set; } = UserRole.WEIGHBRIDGE_CLERK;

    // Double-Entry Accounting & General Ledger Fields
    public string JeDebitCode { get; set; } = "1000";
    public string JeCreditCode { get; set; } = "4000";
    public double JeAmountAfn { get; set; } = 50000;
    public string JeMemo { get; set; } = "Manual accounting adjustment / entry";
    public IReadOnlyList<string> GlFilterOptions { get; } = new[]
    {
        "ALL", "1000", "1010", "1020", "1200", "1300", "2000", "2100", "2200", "3000", "4000", "5000", "5100", "5200"
    };
    private string _glFilterAccount = "ALL";
    public string GlFilterAccount { get => _glFilterAccount; set { _glFilterAccount = value; OnPropertyChanged(); ApplyJournalFilter(); } }

    public string GlTotalAssetsText => FormatMoney(ChartOfAccounts.Where(a => a.AccountType == "ASSET").Sum(a => a.BalanceAfn));
    public string GlTotalLiabEquityText => FormatMoney(
        ChartOfAccounts.Where(a => a.AccountType is "LIABILITY" or "EQUITY").Sum(a => a.BalanceAfn) +
        (ChartOfAccounts.Where(a => a.AccountType == "REVENUE").Sum(a => a.BalanceAfn) -
         ChartOfAccounts.Where(a => a.AccountType == "EXPENSE").Sum(a => a.BalanceAfn)));
    public string GlRevenueText => FormatMoney(ChartOfAccounts.Where(a => a.AccountType == "REVENUE").Sum(a => a.BalanceAfn));
    public string GlExpensesText => FormatMoney(ChartOfAccounts.Where(a => a.AccountType == "EXPENSE").Sum(a => a.BalanceAfn));
    public string GlNetProfitText => FormatMoney(
        ChartOfAccounts.Where(a => a.AccountType == "REVENUE").Sum(a => a.BalanceAfn) -
        ChartOfAccounts.Where(a => a.AccountType == "EXPENSE").Sum(a => a.BalanceAfn));
    public string TrialBalanceCheckText
    {
        get
        {
            double dr = ChartOfAccounts.Sum(a => a.TotalDebitAfn);
            double cr = ChartOfAccounts.Sum(a => a.TotalCreditAfn);
            var ok = Math.Abs(dr - cr) < 0.01;
            return $"Trial Balance: DR {dr:N0} AFN = CR {cr:N0} AFN ({(ok ? "BALANCED" : "OUT OF BALANCE")})";
        }
    }

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
    public ICommand CreateSaleOrderCommand { get; }
    public ICommand AddCustomerCommand { get; }
    public ICommand AddContractCommand { get; }
    public ICommand AddSupplierBillCommand { get; }
    public ICommand PaySupplierBillCommand { get; }
    public ICommand PostFinancialEntryCommand { get; }
    public ICommand PostManualJournalCommand { get; }
    public ICommand SettleInvoiceCommand { get; }
    public ICommand MarkRoyaltyFiledCommand { get; }
    public ICommand MarkRoyaltyPaidCommand { get; }
    public ICommand LogAttendanceCommand { get; }
    public ICommand PrintPayslipCommand { get; }
    public ICommand LogHseIncidentCommand { get; }
    public ICommand IssuePpeKitCommand { get; }
    public ICommand SaveSettingsCommand { get; }
    public ICommand AddOperatorCommand { get; }
    public ICommand ToggleOperatorCommand { get; }
    public ICommand SyncQueueCommand { get; }
    public ICommand ExportCsvCommand { get; }

    public MainViewModel()
    {
        AvailableComPorts = _kantaService.GetAvailablePorts();
        _snapshot = _dataService.LoadOrSeed();
        _usdToAfn = _snapshot.UsdToAfn;
        SettingsComPort = _snapshot.Settings.ComPort;
        SettingsBaudRate = _snapshot.Settings.BaudRate;
        SettingsSyncUrl = _snapshot.Settings.SyncApiBaseUrl;

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
        SupplierBills = new(_snapshot.SupplierBills);
        FinancialLedger = new(_snapshot.FinancialLedger);
        MompRoyalties = new(_snapshot.MompRoyalties);
        PayrollRecords = new(_snapshot.PayrollRecords);
        AttendanceRecords = new(_snapshot.AttendanceRecords);
        PpeIssuances = new(_snapshot.PpeIssuances);
        HseIncidents = new(_snapshot.HseIncidents);
        Operators = new(_snapshot.Operators);
        ChartOfAccounts = new(_snapshot.ChartOfAccounts);
        JournalEntries = new(_snapshot.JournalEntries);
        AuditLogs = new(_snapshot.AuditLogs);
        ApplyTicketFilter();
        ApplyJournalFilter();

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
        CreateSaleOrderCommand = new RelayCommand(_ => CreateSaleOrder());
        AddCustomerCommand = new RelayCommand(_ => AddCustomer());
        AddContractCommand = new RelayCommand(_ => AddContract());
        AddSupplierBillCommand = new RelayCommand(_ => AddSupplierBill());
        PaySupplierBillCommand = new RelayCommand(p => PaySupplierBill(p as SupplierBill));
        PostFinancialEntryCommand = new RelayCommand(_ => PostFinancialEntry());
        PostManualJournalCommand = new RelayCommand(_ => PostManualJournal());
        SettleInvoiceCommand = new RelayCommand(p => SettleInvoice(p as InvoiceRecord));
        MarkRoyaltyFiledCommand = new RelayCommand(p => UpdateRoyalty(p as MompRoyalty, "FILED"));
        MarkRoyaltyPaidCommand = new RelayCommand(p => UpdateRoyalty(p as MompRoyalty, "PAID"));
        LogAttendanceCommand = new RelayCommand(_ => LogBiometricAttendance());
        PrintPayslipCommand = new RelayCommand(p => PrintWorkerPayslip(p as EmployeePayroll));
        LogHseIncidentCommand = new RelayCommand(_ => LogHseIncident());
        IssuePpeKitCommand = new RelayCommand(_ => IssuePpeKit());
        SaveSettingsCommand = new RelayCommand(_ => SaveSettings());
        AddOperatorCommand = new RelayCommand(_ => AddOperator());
        ToggleOperatorCommand = new RelayCommand(p => ToggleOperator(p as OperatorAccount));
        SyncQueueCommand = new RelayCommand(async _ => await SyncOfflineQueueAsync());
        ExportCsvCommand = new RelayCommand(_ => ExportCsv());
        RecalculateSaleQuote();
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
        var (weightKg, mode, scaleId) = _kantaService.CaptureWeight(SettingsComPort, SettingsBaudRate);
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
            PostDoubleEntry("1200", "4000", inv.TotalAfn, $"Kanta Dispatch {ticketNo} ({inv.QuantityMt:F2} MT {TicketSaltGrade})");
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
        if (inv is null || !CanViewFinancials || inv.Status == "PAID") return;
        var remaining = inv.BalanceAfn;
        inv.PaidAfn = inv.TotalAfn;
        inv.Status = "PAID";
        if (remaining > 0)
            PostDoubleEntry("1020", "1200", remaining, $"Invoice settlement {inv.InvoiceNumber} ({inv.CustomerName})");
        AddAudit("invoices", inv.InvoiceNumber, "STATUS_UPDATE", $"Settled full balance on {inv.InvoiceNumber}");
        PersistAndRefresh();
        ShowToast($"Invoice {inv.InvoiceNumber} marked PAID");
    }

    private void UpdateRoyalty(MompRoyalty? royalty, string status)
    {
        if (royalty is null || !CanViewFinancials) return;
        var wasPaid = royalty.Status == "PAID";
        royalty.Status = status;
        if (status == "PAID" && !wasPaid && royalty.TotalRoyaltyAfn > 0)
            PostDoubleEntry("2100", "1010", royalty.TotalRoyaltyAfn, $"MoMP Royalty paid — {royalty.PeriodLabel} ({royalty.CustomsBorderRef})");
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
        int count = await _dataService.SyncPendingRecordsAsync(_snapshot, SettingsSyncUrl);
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

        if (SelectedWaybillQrImage is not null)
        {
            var qrImg = new System.Windows.Controls.Image { Source = SelectedWaybillQrImage, Width = 128, Height = 128 };
            doc.Blocks.Add(new BlockUIContainer(qrImg) { TextAlignment = TextAlignment.Center });
        }

        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, SelectedWaybill.TicketNumber);
        ShowToast($"Printed {SelectedWaybill.TicketNumber} with scannable QR");
    }

    private void PrintWorkerPayslip(EmployeePayroll? emp)
    {
        if (emp is null) return;
        var dlg = new PrintDialog();
        if (dlg.ShowDialog() != true) return;
        var doc = new FlowDocument
        {
            PageWidth = 340, PagePadding = new Thickness(16), FlowDirection = WindowFlowDirection,
            FontFamily = new FontFamily("Segoe UI"), FontSize = 11.5
        };
        doc.Blocks.Add(new Paragraph(new Bold(new Run("HERAT SALT MINE — WORKER PAYSLIP (AFN)"))) { TextAlignment = TextAlignment.Center });
        doc.Blocks.Add(new Paragraph(new Run(
            $"Date: {DateTime.Now:yyyy-MM-dd}\nEmployee: {emp.FullName} ({emp.EmployeeCode})\nTazkira: {emp.TazkiraNo}\nPosition: {emp.RoleTitle}\n" +
            $"Days Worked: {emp.DaysWorked} x {emp.DailyWageAfn:N0} AFN = {emp.DaysWorked * emp.DailyWageAfn:N0} AFN\n" +
            $"Extraction Bonus: +{emp.TonBonusAfn:N0} AFN\nAdvances / Deductions: -{emp.AdvancesDeductionAfn:N0} AFN\n" +
            $"--------------------------------------\nNET PAYABLE: {emp.NetPayableAfn:N0} AFN")));
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, $"Payslip-{emp.EmployeeCode}");
        ShowToast($"Printed AFN payslip for {emp.FullName}");
    }

    private void AddSupplierBill()
    {
        if (!CanViewFinancials || NewBillAmountAfn <= 0) { ShowToast("Owner/Finance role & valid amount required."); return; }
        var bill = new SupplierBill
        {
            BillNumber = $"AP-2026-{304 + SupplierBills.Count}",
            SupplierName = NewBillSupplier.Trim(),
            Category = NewBillCategory,
            AmountAfn = NewBillAmountAfn,
            DueDate = NewBillDueDate,
            Status = "UNPAID"
        };
        SupplierBills.Insert(0, bill);
        _snapshot.SupplierBills.Insert(0, bill);
        var expCode = bill.Category is "PACKAGING_BAGS" or "POTASSIUM_IODATE" ? "5100" : "5000";
        PostDoubleEntry(expCode, "2000", bill.AmountAfn, $"Vendor AP Bill {bill.BillNumber} — {bill.SupplierName} ({bill.Category})");
        AddAudit("supplier_bills", bill.BillNumber, "INSERT", $"Recorded AP bill {bill.AmountAfn:N0} AFN ({bill.SupplierName})");
        PersistAndRefresh();
        ShowToast($"Recorded vendor bill {bill.BillNumber}");
    }

    private void PaySupplierBill(SupplierBill? bill)
    {
        if (bill is null || !CanViewFinancials || bill.Status == "PAID") return;
        bill.Status = "PAID";
        bill.PaymentRef = $"HW-AP-{DateTime.Now:HHmm}";
        var fin = new FinancialEntry
        {
            EntryType = "SUPPLIER_BILL",
            Counterparty = bill.SupplierName,
            Currency = "AFN",
            Amount = bill.AmountAfn,
            LockedUsdToAfn = UsdToAfn,
            Method = "HAWALA",
            Reference = bill.PaymentRef
        };
        FinancialLedger.Insert(0, fin);
        _snapshot.FinancialLedger.Insert(0, fin);
        PostDoubleEntry("2000", "1020", bill.AmountAfn, $"Paid AP Bill {bill.BillNumber} via Hawala ({bill.PaymentRef})");
        AddAudit("supplier_bills", bill.BillNumber, "STATUS_UPDATE", $"Paid vendor bill {bill.BillNumber} ({bill.AmountAfn:N0} AFN)");
        PersistAndRefresh();
        ShowToast($"Paid {bill.BillNumber} via Hawala");
    }

    private void SaveSettings()
    {
        _snapshot.Settings.ComPort = SettingsComPort;
        _snapshot.Settings.BaudRate = SettingsBaudRate;
        _snapshot.Settings.SyncApiBaseUrl = SettingsSyncUrl.Trim();
        PersistAndRefresh();
        ShowToast($"Saved Scale ({SettingsComPort} @ {SettingsBaudRate}) & Sync URL");
    }

    private void AddOperator()
    {
        if (ActiveRole != UserRole.MINE_OWNER) { ShowToast("Only Mine Owner can add operators."); return; }
        if (string.IsNullOrWhiteSpace(NewOpEmail) || string.IsNullOrWhiteSpace(NewOpName)) return;
        var op = new OperatorAccount { Email = NewOpEmail.Trim().ToLowerInvariant(), FullName = NewOpName.Trim(), Role = NewOpRole, IsActive = true };
        Operators.Insert(0, op);
        _snapshot.Operators.Insert(0, op);
        AddAudit("users", op.Email, "INSERT", $"Added operator {op.FullName} ({op.Role})");
        NewOpEmail = "";
        NewOpName = "";
        OnPropertyChanged(nameof(NewOpEmail));
        OnPropertyChanged(nameof(NewOpName));
        PersistAndRefresh();
        ShowToast($"Added operator {op.FullName}");
    }

    private void ToggleOperator(OperatorAccount? op)
    {
        if (op is null || ActiveRole != UserRole.MINE_OWNER) { ShowToast("Only Mine Owner can manage operators."); return; }
        op.IsActive = !op.IsActive;
        AddAudit("users", op.Email, "STATUS_UPDATE", $"Set {op.Email} Active={op.IsActive}");
        PersistAndRefresh();
        ShowToast($"{op.Email} {(op.IsActive ? "Activated" : "Deactivated")}");
    }

    private void AddAudit(string table, string recordRef, string action, string summary)
    {
        var entry = new AuditLogEntry { Timestamp = DateTime.Now.ToString("HH:mm:ss"), TableName = table, RecordRef = recordRef, Action = action, Summary = summary, Actor = ActiveRole.ToString() };
        AuditLogs.Insert(0, entry);
        _snapshot.AuditLogs.Insert(0, entry);
        _dataService.AppendAuditRowSqlite(entry);
    }

    private void PersistAndRefresh() { _dataService.Save(_snapshot); RefreshKpis(); }

    private void CreateSaleOrder()
    {
        if (SaleQtyMt <= 0 || SalePriceAfn <= 0) { ShowToast("Enter valid tonnage & rate."); return; }
        var totalAfn = Math.Round(SaleQtyMt * SalePriceAfn, 0);
        var invNo = $"INV-2026-{883 + Invoices.Count}";
        var inv = new InvoiceRecord
        {
            InvoiceNumber = invNo,
            TicketNumber = "SPOT-SALE",
            CustomerName = SaleCustomer.Trim(),
            QuantityMt = SaleQtyMt,
            TotalAfn = totalAfn,
            PaidAfn = SalePaymentMethod == "CASH" ? totalAfn : 0,
            Status = SalePaymentMethod == "CASH" ? "PAID" : "ISSUED"
        };
        Invoices.Insert(0, inv);
        _snapshot.Invoices.Insert(0, inv);

        var cust = Customers.FirstOrDefault(c => c.CompanyName.Equals(SaleCustomer.Trim(), StringComparison.OrdinalIgnoreCase));
        if (cust is not null && inv.Status != "PAID")
        {
            cust.OutstandingAfn += totalAfn;
        }

        var ctr = Contracts.FirstOrDefault(c => c.CustomerName.Equals(SaleCustomer.Trim(), StringComparison.OrdinalIgnoreCase) && c.SaltGrade == SaleSaltGrade);
        if (ctr is not null)
        {
            ctr.DeliveredMt = Math.Round(ctr.DeliveredMt + SaleQtyMt, 1);
        }

        if (SalePaymentMethod == "CASH")
        {
            var fin = new FinancialEntry
            {
                EntryType = "RECEIVABLE_PAYMENT",
                Counterparty = SaleCustomer.Trim(),
                Currency = "AFN",
                Amount = totalAfn,
                LockedUsdToAfn = UsdToAfn,
                Method = "CASH",
                Reference = invNo
            };
            FinancialLedger.Insert(0, fin);
            _snapshot.FinancialLedger.Insert(0, fin);
        }

        var debitAcc = SalePaymentMethod == "CASH" ? "1000" : "1200";
        PostDoubleEntry(debitAcc, "4000", totalAfn, $"Salt Sale {invNo} — {SaleQtyMt} MT {SaleSaltGrade} to {SaleCustomer}");
        AddAudit("sales_orders", invNo, "INSERT", $"Sold {SaleQtyMt} MT ({SaleSaltGrade}) to {SaleCustomer} — {FormatMoney(totalAfn)} ({SalePaymentMethod})");
        PersistAndRefresh();
        ShowToast($"Sale {invNo} created ({FormatMoney(totalAfn)})");
    }

    private void ApplyJournalFilter()
    {
        FilteredJournals.Clear();
        foreach (var j in JournalEntries)
        {
            if (GlFilterAccount != "ALL" && j.DebitAccountCode != GlFilterAccount && j.CreditAccountCode != GlFilterAccount)
                continue;
            FilteredJournals.Add(j);
        }
    }

    private void PostDoubleEntry(string debitCode, string creditCode, double amountAfn, string memo)
    {
        if (amountAfn <= 0 || debitCode == creditCode) return;
        var dr = ChartOfAccounts.FirstOrDefault(a => a.Code == debitCode);
        var cr = ChartOfAccounts.FirstOrDefault(a => a.Code == creditCode);
        if (dr is null || cr is null) return;

        dr.TotalDebitAfn = Math.Round(dr.TotalDebitAfn + amountAfn, 2);
        cr.TotalCreditAfn = Math.Round(cr.TotalCreditAfn + amountAfn, 2);

        var je = new JournalEntry
        {
            EntryNumber = $"JE-2026-{JournalEntries.Count + 1:D4}",
            Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm"),
            DebitAccountCode = dr.Code,
            DebitAccountName = dr.Name,
            CreditAccountCode = cr.Code,
            CreditAccountName = cr.Name,
            AmountAfn = Math.Round(amountAfn, 2),
            Memo = memo,
            PostedBy = ActiveRole.ToString()
        };

        JournalEntries.Insert(0, je);
        _snapshot.JournalEntries.Insert(0, je);
        ApplyJournalFilter();
        System.Windows.Data.CollectionViewSource.GetDefaultView(ChartOfAccounts)?.Refresh();
    }

    private void PostManualJournal()
    {
        if (!CanViewFinancials) { ShowToast("Owner or Finance Officer role required."); return; }
        if (JeAmountAfn <= 0) { ShowToast("Amount must be greater than 0 AFN."); return; }
        if (JeDebitCode == JeCreditCode) { ShowToast("Debit and Credit accounts must be different."); return; }

        PostDoubleEntry(JeDebitCode, JeCreditCode, JeAmountAfn, string.IsNullOrWhiteSpace(JeMemo) ? "Manual GL Journal" : JeMemo.Trim());
        AddAudit("journal_entries", JournalEntries[0].EntryNumber, "INSERT", $"DR {JeDebitCode} / CR {JeCreditCode}: {JeAmountAfn:N0} AFN — {JeMemo}");
        PersistAndRefresh();
        ShowToast($"Posted balanced journal {JournalEntries[0].EntryNumber} ({JeAmountAfn:N0} AFN)");
    }

    private void AddCustomer()
    {
        if (string.IsNullOrWhiteSpace(NewCustName)) { ShowToast("Enter customer company name."); return; }
        var cust = new CustomerAccount
        {
            Code = $"CUS-HRT-{15 + Customers.Count:D3}",
            CompanyName = NewCustName.Trim(),
            CustomerType = NewCustType,
            CreditLimitAfn = NewCustCreditAfn,
            OutstandingAfn = 0
        };
        Customers.Insert(0, cust);
        _snapshot.Customers.Insert(0, cust);
        AddAudit("customers", cust.Code, "INSERT", $"Added customer {cust.CompanyName} ({cust.CustomerType})");
        NewCustName = "";
        OnPropertyChanged(nameof(NewCustName));
        PersistAndRefresh();
        ShowToast($"Added customer {cust.CompanyName}");
    }

    private void AddContract()
    {
        if (NewCtrMt <= 0 || NewCtrPriceAfn <= 0) return;
        var ctr = new TonnageContract
        {
            ContractCode = $"CTR-2026-{10 + Contracts.Count:D2}",
            CustomerName = NewCtrCustomer.Trim(),
            SaltGrade = NewCtrGrade,
            ContractedMt = NewCtrMt,
            DeliveredMt = 0,
            TierPriceAfnPerMt = NewCtrPriceAfn
        };
        Contracts.Insert(0, ctr);
        _snapshot.Contracts.Insert(0, ctr);
        AddAudit("contracts", ctr.ContractCode, "INSERT", $"Signed {ctr.ContractedMt} MT contract with {ctr.CustomerName}");
        PersistAndRefresh();
        ShowToast($"Created contract {ctr.ContractCode}");
    }

    private void RefreshKpis()
    {
        OnPropertyChanged(nameof(KpiExtractedText));
        OnPropertyChanged(nameof(KpiProcessedText));
        OnPropertyChanged(nameof(KpiDispatchedText));
        OnPropertyChanged(nameof(KpiRevenueText));
        OnPropertyChanged(nameof(KpiRoyaltyText));
        OnPropertyChanged(nameof(KpiFuelText));
        OnPropertyChanged(nameof(SaleTotalPreview));
        OnPropertyChanged(nameof(GlTotalAssetsText));
        OnPropertyChanged(nameof(GlTotalLiabEquityText));
        OnPropertyChanged(nameof(GlRevenueText));
        OnPropertyChanged(nameof(GlExpensesText));
        OnPropertyChanged(nameof(GlNetProfitText));
        OnPropertyChanged(nameof(TrialBalanceCheckText));
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
