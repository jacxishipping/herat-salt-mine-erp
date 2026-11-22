import { LangCode } from "@/types/erp";

export interface Phase2Dict {
  exportCsv: string;
  processing: {
    title: string;
    subtitle: string;
    newBatchBtn: string;
    batchCode: string;
    intakeMt: string;
    outputMt: string;
    shrinkageMt: string;
    iodinePpm: string;
    moistureAfter: string;
    warehouse: string;
    submitBatch: string;
    stockTitle: string;
    onHandMt: string;
    iodineCompliant: string;
    iodineWarning: string;
  };
  finance: {
    title: string;
    subtitle: string;
    newPaymentBtn: string;
    customersTitle: string;
    creditLimit: string;
    outstanding: string;
    ledgerTitle: string;
    entryType: string;
    counterparty: string;
    amount: string;
    method: string;
    reference: string;
    sarafName: string;
    hawalaCode: string;
    recordPayment: string;
    mompTitle: string;
    period: string;
    extractedMt: string;
    exportedMt: string;
    royaltyDue: string;
    borderRef: string;
    markFiled: string;
    markPaid: string;
    restricted: string;
  };
  hrHse: {
    title: string;
    subtitle: string;
    payrollTitle: string;
    employee: string;
    roleTitle: string;
    daysWorked: string;
    baseWage: string;
    tonBonus: string;
    overtime: string;
    deductions: string;
    netPayable: string;
    hseTitle: string;
    logIncidentBtn: string;
    zone: string;
    incidentType: string;
    severity: string;
    description: string;
    ppeCompliant: string;
    submitIncident: string;
  };
}

export const PHASE2_TRANSLATIONS: Record<LangCode, Phase2Dict> = {
  en: {
    exportCsv: "Export CSV / Excel",
    processing: {
      title: "Processing Plant, Iodization & Warehouse Stockpiles",
      subtitle:
        "Track crushing, washing, 30–50 ppm food-grade iodization, shrinkage, and multi-warehouse balances.",
      newBatchBtn: "Log Processing Batch",
      batchCode: "Batch Code",
      intakeMt: "Raw Intake (MT)",
      outputMt: "Refined Output (MT)",
      shrinkageMt: "Shrinkage / Loss",
      iodinePpm: "Iodine (ppm)",
      moistureAfter: "Moisture %",
      warehouse: "Target Warehouse",
      submitBatch: "Record Batch & Update Stock",
      stockTitle: "Real-Time Warehouse & Border Staging Inventory",
      onHandMt: "On-Hand (MT)",
      iodineCompliant: "Food-Grade OK",
      iodineWarning: "Industrial Only",
    },
    finance: {
      title: "Sales, Multi-Currency Hawala Ledger & MoMP Royalties",
      subtitle:
        "Manage buyer credit, AFN/USD locked settlements (Cash, Bank, Hawala), and MoMP/Customs royalty filings.",
      newPaymentBtn: "Record Settlement",
      customersTitle: "Offtaker & Wholesale Accounts",
      creditLimit: "Credit Limit",
      outstanding: "Outstanding",
      ledgerTitle: "Financial & Hawala Ledger",
      entryType: "Entry Type",
      counterparty: "Counterparty",
      amount: "Amount",
      method: "Method",
      reference: "Saraf / Bank Ref",
      sarafName: "Hawala Saraf Name",
      hawalaCode: "Hawala Code",
      recordPayment: "Post to Ledger",
      mompTitle: "MoMP Royalty & Herat Customs Assessments",
      period: "Assessment Period",
      extractedMt: "Extracted (MT)",
      exportedMt: "Exported (MT)",
      royaltyDue: "Royalty Due",
      borderRef: "Customs Border Ref",
      markFiled: "Mark Filed",
      markPaid: "Mark Paid",
      restricted:
        "Access Restricted: Only Mine Owner and Finance Officer can manage financial ledgers and Hawala settlements.",
    },
    hrHse: {
      title: "Workforce Payroll & Mine Safety (HSE)",
      subtitle:
        "Calculate daily wages, per-ton extraction bonuses, advances, and log mine safety & dust inspections.",
      payrollTitle: "Shift Workforce & Payroll Summary",
      employee: "Employee / Tazkira",
      roleTitle: "Position",
      daysWorked: "Days",
      baseWage: "Daily Wage",
      tonBonus: "Ton Bonus",
      overtime: "Overtime",
      deductions: "Advances",
      netPayable: "Net Payable",
      hseTitle: "HSE Incidents, Dust & PPE Compliance",
      logIncidentBtn: "Log HSE Report",
      zone: "Mine Zone",
      incidentType: "Category",
      severity: "Severity",
      description: "Inspection / Incident Details",
      ppeCompliant: "PPE Compliant",
      submitIncident: "Save HSE Record",
    },
  },
  fa: {
    exportCsv: "خروجی اکسل / CSV",
    processing: {
      title: "کارخانه پروسس، آیودین‌سازی و موجودی گدام‌ها",
      subtitle:
        "کنترول آسیاب، شستشو، آیودین‌سازی غذایی (۳۰ تا ۵۰ ppm)، افت رطوبت و موجودی گدام‌های هرات و مرز.",
      newBatchBtn: "ثبت بچ پروسس جدید",
      batchCode: "کود بچ",
      intakeMt: "ورودی خام (تُن)",
      outputMt: "محصول نهایی (تُن)",
      shrinkageMt: "ضایعات / افت رطوبت",
      iodinePpm: "آیودین (ppm)",
      moistureAfter: "رطوبت نهایی %",
      warehouse: "گدام مقصد",
      submitBatch: "ثبت بچ و بروزرسانی گدام",
      stockTitle: "موجودی لحظه‌ای گدام‌ها و نقاط مرزی",
      onHandMt: "موجودی (تُن)",
      iodineCompliant: "تایید غذایی",
      iodineWarning: "صنعتی",
    },
    finance: {
      title: "فروش، دفتر حواله دوارزی و حق‌الامتیاز وزارت معادن",
      subtitle:
        "مدیریت حساب مشتریان، تصفیه نقدی/بانکی/حواله با نرخ قفل‌شده دالر و پیگیری تعرفه‌های وزارت معادن و گمرک.",
      newPaymentBtn: "ثبت پرداخت / حواله",
      customersTitle: "حساب مشتریان و خریداران عمده",
      creditLimit: "سقف اعتبار",
      outstanding: "باقی‌دار",
      ledgerTitle: "دفتر روزنامه مالی و حواله‌جات",
      entryType: "نوع سند",
      counterparty: "طرف حساب",
      amount: "مبلغ",
      method: "روش",
      reference: "شماره حواله / بانک",
      sarafName: "نام صرافی / حواله‌دار",
      hawalaCode: "کود حواله",
      recordPayment: "ثبت در دفتر مالی",
      mompTitle: "ارزیابی حق‌الامتیاز وزارت معادن و گمرک هرات",
      period: "دوره مالی",
      extractedMt: "استخراج (تُن)",
      exportedMt: "صادرات (تُن)",
      royaltyDue: "حق‌الامتیاز",
      borderRef: "سند گمرک مرزی",
      markFiled: "ثبت اظهارنامه",
      markPaid: "تایید پرداخت",
      restricted:
        "دسترسی محدود: فقط مالک معدن و مدیر مالی مجاز به مدیریت دفتر مالی و حواله‌جات هستند.",
    },
    hrHse: {
      title: "منابع بشری، معاشات و ایمنی معدن (HSE)",
      subtitle:
        "محاسبه معاش روزانه، پاداش استخراج هر تُن، مساعده و ثبت گزارش‌های ایمنی، گردوغبار و تجهیزات محافظتی.",
      payrollTitle: "فهرست کارمندان و محاسبه معاشات",
      employee: "کارمند / تذکره",
      roleTitle: "وظیفه",
      daysWorked: "روز کار",
      baseWage: "مزد روزانه",
      tonBonus: "پاداش تناژ",
      overtime: "اضافه‌کاری",
      deductions: "کسورات / مساعده",
      netPayable: "خالص قابل پرداخت",
      hseTitle: "گزارش حوادث، گردوغبار و رعایت PPE",
      logIncidentBtn: "ثبت گزارش ایمنی HSE",
      zone: "زون معدن",
      incidentType: "نوع واقعه",
      severity: "شدت",
      description: "شرح بررسی / حادثه",
      ppeCompliant: "رعایت تجهیزات ایمنی",
      submitIncident: "ذخیره گزارش ایمنی",
    },
  },
  ps: {
    exportCsv: "د اکسل / CSV راپور",
    processing: {
      title: "د پروسس فابریکه، ایوډین کول او د ګودام زېرمې",
      subtitle:
        "د میده کولو، مینځلو، خوراکي ایوډین (۳۰–۵۰ ppm)، ضایعاتو او د هرات/سرحد ګودامونو کنترول.",
      newBatchBtn: "نوی پروسس بیچ ثبت کړئ",
      batchCode: "د بیچ کوډ",
      intakeMt: "خام داخل (ټن)",
      outputMt: "پروسس محصول (ټن)",
      shrinkageMt: "ضایعات / رطوبت",
      iodinePpm: "ایوډین (ppm)",
      moistureAfter: "رطوبت %",
      warehouse: "ګودام",
      submitBatch: "بیچ ثبت او زېرمه تازه کړئ",
      stockTitle: "د ګودامونو او سرحدي تمځایونو اوسنۍ زېرمه",
      onHandMt: "موجودي (ټن)",
      iodineCompliant: "خوراکي تایید",
      iodineWarning: "صنعتي",
    },
    finance: {
      title: "پلور، دوه اسعاري حواله او د کانونو وزارت حق‌الامتیاز",
      subtitle:
        "د پیرودونکو کریډیټ، نغد/بانکي/حوالې تصفیه او د کانونو وزارت او اسلام‌قلعه ګمرک حق‌الامتیاز.",
      newPaymentBtn: "تادیه / حواله ثبت کړئ",
      customersTitle: "د پیرودونکو او عمده پلورونکو حسابونه",
      creditLimit: "کریډیټ حد",
      outstanding: "پاتې پور",
      ledgerTitle: "مالي او د حوالې کتابچه",
      entryType: "د سند ډول",
      counterparty: "حساب لرونکی",
      amount: "مبلغ",
      method: "طریقه",
      reference: "د صراف / بانک حواله",
      sarafName: "د صراف نوم",
      hawalaCode: "د حوالې کوډ",
      recordPayment: "مالي کتابچه کې ثبت کړئ",
      mompTitle: "د کانونو وزارت حق‌الامتیاز او هرات ګمرک",
      period: "مالي دوره",
      extractedMt: "استخراج (ټن)",
      exportedMt: "صادرات (ټن)",
      royaltyDue: "حق‌الامتیاز",
      borderRef: "د ګمرک سند",
      markFiled: "سپارل شوی",
      markPaid: "تادیه شوی",
      restricted:
        "محدود لاسرسی: یوازې د کان مالک او مالي مدیر مالي حسابونه او حوالې اداره کولای شي.",
    },
    hrHse: {
      title: "بشري سرچینې، معاشونه او د کان خوندیتوب (HSE)",
      subtitle:
        "د ورځني مزد، د هر ټن استخراج بخشش، پیشکي او د خوندیتوب او دوړو معایناتو ثبت.",
      payrollTitle: "د کارکوونکو لیست او معاشونو محاسبه",
      employee: "کارکوونکی / تذکره",
      roleTitle: "دنده",
      daysWorked: "ورځې",
      baseWage: "ورځنی مزد",
      tonBonus: "د ټن بخشش",
      overtime: "اضافه کاري",
      deductions: "پیشکي / کسر",
      netPayable: "خالص معاش",
      hseTitle: "د HSE پېښې، دوړې او د PPE رعایت",
      logIncidentBtn: "د خوندیتوب راپور ثبت",
      zone: "د کان زون",
      incidentType: "کټګوري",
      severity: "شدت",
      description: "د معاینې / پېښې جزئیات",
      ppeCompliant: "د خوندیتوب وسایل",
      submitIncident: "د خوندیتوب راپور خوندي کړئ",
    },
  },
};
