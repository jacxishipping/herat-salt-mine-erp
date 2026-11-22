using System.Collections.Generic;
using System.Windows;
using HeratSaltErp.Models;

namespace HeratSaltErp.Services;

public static class LocalizationService
{
    public static FlowDirection GetFlowDirection(LangCode lang) =>
        lang == LangCode.EN ? FlowDirection.LeftToRight : FlowDirection.RightToLeft;

    public static Dictionary<string, string> GetStrings(LangCode lang) => lang switch
    {
        LangCode.FA => new()
        {
            ["BrandTitle"] = "سیستم جامع معدن نمک هرات",
            ["BrandSub"] = "عملیات غوریان و کهسان",
            ["NavDashboard"] = "داشبورد مدیریتی",
            ["NavWeighbridge"] = "کانته و بارنامه QR",
            ["NavExtraction"] = "استخراج و ماشین‌آلات",
            ["NavProcessing"] = "پروسس و گدام‌داری",
            ["NavQcLab"] = "لابراتوار کیفیت (QC / CoA)",
            ["NavStores"] = "انبار پرزه‌جات و مواد مصرفی",
            ["NavSales"] = "فروش و سفارشات",
            ["NavCustomers"] = "مشتریان و قراردادها",
            ["NavExports"] = "صادرات و گمرک اسلام‌قلعه",
            ["NavFinance"] = "مالی، حواله و وزارت معادن",
            ["NavAccounting"] = "حسابداری دوطرفه (دفتر کل)",
            ["NavExpenses"] = "مصارف روزانه و تنخواه معدن",
            ["NavSuppliers"] = "تمویل‌کنندگان و خریداری",
            ["NavReports"] = "گزارش‌ها و تحلیل بدهی‌ها",
            ["NavHrHse"] = "کارگران، معاشات و ایمنی (HSE)",
            ["NavAudit"] = "دفتر ممیزی غیرقابل تغییر",
            ["NavSettings"] = "تنظیمات و سخت‌افزار کانته",
            ["Online"] = "متصل به سرور مرکزی",
            ["Offline"] = "حالت آفلاین معدن",
            ["OfflineToggle"] = "حالت آفلاین",
            ["SyncNow"] = "همگام‌سازی صف",
            ["IssueTicket"] = "ثبت تکت و کد QR",
            ["CaptureScale"] = "خوانش کانته RS-232",
            ["ExportCsv"] = "خروجی اکسل / CSV",
            ["PrintWaybill"] = "چاپ بارنامه ۸۰ میلی‌متر",
            ["KpiExtracted"] = "استخراج امروز",
            ["KpiProcessed"] = "پروسس و آیودین‌دار",
            ["KpiDispatched"] = "ارسال شده (کانته)",
            ["KpiRevenue"] = "ارزش ناخالص فروش",
            ["KpiRoyalty"] = "حق‌الامتیاز وزارت معادن"
        },
        LangCode.PS => new()
        {
            ["BrandTitle"] = "د هرات د مالګې کان ERP",
            ["BrandSub"] = "د غوریان او کهسان عملیات",
            ["NavDashboard"] = "اجرائیوي ډشبورډ",
            ["NavWeighbridge"] = "کانته او QR بارنامه",
            ["NavExtraction"] = "استخراج او ماشینري",
            ["NavProcessing"] = "پروسس او ګودام",
            ["NavQcLab"] = "د کیفیت لابراتوار (QC)",
            ["NavStores"] = "پرزه‌جات او مصرفي توکي",
            ["NavSales"] = "پلور او فرمایشونه",
            ["NavCustomers"] = "پیرودونکي او قراردادونه",
            ["NavExports"] = "صادرات او د اسلام‌قلعه ګمرک",
            ["NavFinance"] = "مالي، حواله او کانونو وزارت",
            ["NavAccounting"] = "دوه اړخیزه محاسبه (دفتر کل)",
            ["NavExpenses"] = "ورځني لګښتونه او مصارف",
            ["NavSuppliers"] = "اکمالوونکي او پیرودل",
            ["NavReports"] = "راپورونه او تحلیل",
            ["NavHrHse"] = "کارګران، معاشونه او HSE",
            ["NavAudit"] = "نه بدلیدونکی تفتیش",
            ["NavSettings"] = "تنظیمات او کانته COM",
            ["Online"] = "له مرکزي سرور سره وصل",
            ["Offline"] = "د کان آفلاین حالت",
            ["OfflineToggle"] = "آفلاین حالت",
            ["SyncNow"] = "صف همغږی کړئ",
            ["IssueTicket"] = "ټکټ او QR ثبت کړئ",
            ["CaptureScale"] = "د RS-232 کانتې وزن",
            ["ExportCsv"] = "اکسل / CSV راپور",
            ["PrintWaybill"] = "۸۰mm بارنامه چاپ کړئ",
            ["KpiExtracted"] = "نننی استخراج",
            ["KpiProcessed"] = "پروسس او ایوډین شوې",
            ["KpiDispatched"] = "لېږل شوې (کانته)",
            ["KpiRevenue"] = "د پلور ناخالص ارزښت",
            ["KpiRoyalty"] = "د کانونو وزارت حق‌الامتیاز"
        },
        _ => new()
        {
            ["BrandTitle"] = "Herat Salt ERP",
            ["BrandSub"] = "Ghoryan & Kuhsan Operations",
            ["NavDashboard"] = "Executive Dashboard",
            ["NavWeighbridge"] = "Weighbridge (Kanta)",
            ["NavExtraction"] = "Extraction & Fleet",
            ["NavProcessing"] = "Processing & Stock",
            ["NavQcLab"] = "QC Lab & Certificates",
            ["NavStores"] = "Consumables & Spare Parts",
            ["NavSales"] = "Sales & Spot Orders",
            ["NavCustomers"] = "Customers & Contracts",
            ["NavExports"] = "Export Customs & Logistics",
            ["NavFinance"] = "Finance, Hawala & MoMP",
            ["NavAccounting"] = "Accounting & General Ledger",
            ["NavExpenses"] = "Mine Expenses & Petty Cash",
            ["NavSuppliers"] = "Suppliers & AP Bills",
            ["NavReports"] = "Reports & Aging Analytics",
            ["NavHrHse"] = "Labors, Salaries & HSE",
            ["NavAudit"] = "Immutable Audit Log",
            ["NavSettings"] = "Settings & Scale COM",
            ["Online"] = "Cloud Connected",
            ["Offline"] = "Offline Site Mode",
            ["OfflineToggle"] = "Offline Mode",
            ["SyncNow"] = "Sync Queue",
            ["IssueTicket"] = "Issue QR Ticket",
            ["CaptureScale"] = "Capture RS-232 Scale",
            ["ExportCsv"] = "Export CSV / Excel",
            ["PrintWaybill"] = "Print 80mm Waybill",
            ["KpiExtracted"] = "Extracted Today",
            ["KpiProcessed"] = "Processed & Iodized",
            ["KpiDispatched"] = "Dispatched (Kanta)",
            ["KpiRevenue"] = "Gross Dispatch Value",
            ["KpiRoyalty"] = "Pending MoMP Royalty"
        }
    };
}
