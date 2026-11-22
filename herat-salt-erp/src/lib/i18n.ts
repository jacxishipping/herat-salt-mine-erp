import {
  DestinationType,
  ExtractionMethod,
  LangCode,
  SaltGrade,
  UserRole,
} from "@/types/erp";

export interface TranslationDict {
  dir: "ltr" | "rtl";
  brandName: string;
  brandSub: string;
  nav: {
    dashboard: string;
    weighbridge: string;
    extraction: string;
    processing: string;
    finance: string;
    hrHse: string;
    auditLogs: string;
  };
  topbar: {
    online: string;
    offlineSite: string;
    pendingSync: string;
    syncNow: string;
    syncing: string;
    fxRate: string;
    roleLabel: string;
    simulateOffline: string;
  };
  roles: Record<UserRole, string>;
  kpi: {
    extractedToday: string;
    processedToday: string;
    dispatchedToday: string;
    revenueToday: string;
    costPerTon: string;
    fuelEfficiency: string;
    mompRoyalty: string;
    activeZones: string;
    productionVsDispatch: string;
    extractedLabel: string;
    processedLabel: string;
    dispatchedLabel: string;
    complianceBannerTitle: string;
    complianceBannerSub: string;
  };
  weighbridge: {
    title: string;
    subtitle: string;
    newTicketBtn: string;
    ticketNo: string;
    direction: string;
    inbound: string;
    outbound: string;
    truckPlate: string;
    driverName: string;
    driverTazkira: string;
    counterparty: string;
    saltGrade: string;
    destination: string;
    destinationDetail: string;
    grossKg: string;
    tareKg: string;
    netKg: string;
    unitPriceAfn: string;
    paymentMethod: string;
    hawalaRef: string;
    status: string;
    actions: string;
    issueTicket: string;
    viewWaybill: string;
    requestVoid: string;
    approveVoid: string;
    voidReasonPrompt: string;
    antiFraudNotice: string;
    waybillTitle: string;
    printWaybill: string;
    close: string;
    qrVerify: string;
    scaleId: string;
  };
  extraction: {
    title: string;
    subtitle: string;
    logExtractionBtn: string;
    zone: string;
    shift: string;
    shiftDay: string;
    shiftNight: string;
    method: string;
    rawTonnage: string;
    crewLead: string;
    equipment: string;
    fuelLiters: string;
    engineHours: string;
    moisturePct: string;
    notes: string;
    submitLog: string;
    targetProgress: string;
    reserves: string;
  };
  audit: {
    title: string;
    subtitle: string;
    timestamp: string;
    table: string;
    record: string;
    action: string;
    summary: string;
    actor: string;
    restricted: string;
  };
  grades: Record<SaltGrade, string>;
  destinations: Record<DestinationType, string>;
  methods: Record<ExtractionMethod, string>;
  common: {
    mt: string;
    kg: string;
    liters: string;
    hours: string;
    synced: string;
    pending: string;
    active: string;
    voidPending: string;
    voided: string;
    cash: string;
    bankTransfer: string;
    hawala: string;
    noPermission: string;
  };
}

export const TRANSLATIONS: Record<LangCode, TranslationDict> = {
  en: {
    dir: "ltr",
    brandName: "Herat Salt ERP",
    brandSub: "Ghoryan & Kuhsan Operations",
    nav: {
      dashboard: "Executive Dashboard",
      weighbridge: "Weighbridge (Kanta)",
      extraction: "Extraction & Fleet",
      processing: "Processing & Inventory",
      finance: "Finance, Hawala & MoMP",
      hrHse: "HR, Payroll & HSE",
      auditLogs: "Immutable Audit Log",
    },
    topbar: {
      online: "Cloud Connected",
      offlineSite: "Offline Site Mode",
      pendingSync: "Pending Sync",
      syncNow: "Sync Queue",
      syncing: "Syncing...",
      fxRate: "Locked FX",
      roleLabel: "Active Role",
      simulateOffline: "Simulate Mine Offline",
    },
    roles: {
      MINE_OWNER: "Mine Owner / MD",
      SITE_OPS_MANAGER: "Site Ops Manager",
      WEIGHBRIDGE_CLERK: "Weighbridge Clerk",
      WAREHOUSE_OFFICER: "Warehouse Officer",
      FINANCE_OFFICER: "Finance Officer",
      HSE_COMPLIANCE_OFFICER: "HSE & Compliance",
    },
    kpi: {
      extractedToday: "Extracted Today",
      processedToday: "Processed & Iodized",
      dispatchedToday: "Dispatched (Kanta)",
      revenueToday: "Gross Dispatch Value",
      costPerTon: "Extraction Cost / MT",
      fuelEfficiency: "Fleet Fuel Efficiency",
      mompRoyalty: "Pending MoMP Royalty",
      activeZones: "Active Quarry Zones",
      productionVsDispatch: "7-Day Extraction vs. Processing vs. Dispatch (MT)",
      extractedLabel: "Extracted",
      processedLabel: "Processed",
      dispatchedLabel: "Dispatched",
      complianceBannerTitle: "MoMP & Herat Customs Compliance",
      complianceBannerSub:
        "Islam Qala & Torghundi export waybills include SHA-256 QR verification & locked daily AFN/USD rate.",
    },
    weighbridge: {
      title: "Digital Weighbridge (Kanta) & QR Dispatch",
      subtitle:
        "ACID-protected scale tickets. Weights are immutable after issuance; voiding requires supervisor approval.",
      newTicketBtn: "Issue Kanta Ticket",
      ticketNo: "Ticket #",
      direction: "Direction",
      inbound: "Inbound Supply",
      outbound: "Outbound Dispatch",
      truckPlate: "Truck Plate",
      driverName: "Driver Name",
      driverTazkira: "Driver Tazkira ID",
      counterparty: "Customer / Supplier",
      saltGrade: "Salt Grade / SKU",
      destination: "Destination / Border",
      destinationDetail: "Route / Depot Detail",
      grossKg: "Gross (kg)",
      tareKg: "Tare (kg)",
      netKg: "Net Weight (kg)",
      unitPriceAfn: "Rate (AFN / MT)",
      paymentMethod: "Settlement",
      hawalaRef: "Hawala / Saraf Ref",
      status: "Status",
      actions: "Actions",
      issueTicket: "Record & Generate QR",
      viewWaybill: "QR Waybill",
      requestVoid: "Req. Void",
      approveVoid: "Approve Void",
      voidReasonPrompt: "Enter mandatory reason for voiding this ticket:",
      antiFraudNotice:
        "Anti-Fraud Lock: Gross/Tare weights cannot be edited or deleted once issued.",
      waybillTitle: "Official Salt Mine Waybill / Bilty",
      printWaybill: "Print Waybill",
      close: "Close",
      qrVerify: "Scan to verify MoMP & Kanta integrity",
      scaleId: "Scale ID",
    },
    extraction: {
      title: "Quarry, Brine Pan & Fleet Extraction Logs",
      subtitle:
        "Track Ghoryan rock salt blasting and Kuhsan solar evaporation pans with fuel & engine-hour logs.",
      logExtractionBtn: "Log Shift Extraction",
      zone: "Mine Zone",
      shift: "Shift",
      shiftDay: "Shift A (Day)",
      shiftNight: "Shift B (Night)",
      method: "Extraction Method",
      rawTonnage: "Raw Tonnage (MT)",
      crewLead: "Crew Lead",
      equipment: "Equipment Asset",
      fuelLiters: "Diesel Used (L)",
      engineHours: "Engine Hrs",
      moisturePct: "Moisture %",
      notes: "Shift Notes",
      submitLog: "Save Extraction Log",
      targetProgress: "Daily Target Progress",
      reserves: "Est. Reserves",
    },
    audit: {
      title: "Immutable Security & Anti-Fraud Audit Log",
      subtitle:
        "Append-only ledger of all weighbridge issuances, supervisor void approvals, and offline sync reconciliations.",
      timestamp: "Timestamp",
      table: "Entity",
      record: "Record Ref",
      action: "Action",
      summary: "Audit Summary",
      actor: "Actor",
      restricted:
        "Access Restricted: Only Mine Owner, Site Ops Manager, and Finance Officer can inspect immutable audit logs.",
    },
    grades: {
      INDUSTRIAL_RAW_ROCK: "Industrial Raw Rock Salt (Bulk)",
      REFINED_IODIZED_25KG: "Refined Iodized Table Salt (25kg)",
      REFINED_IODIZED_50KG: "Refined Iodized Table Salt (50kg)",
      REFINED_IODIZED_1KG: "Refined Iodized Retail (1kg)",
      LIVESTOCK_SALT_BLOCK: "Livestock Salt Blocks",
      DEICING_CHEMICAL: "De-icing / Chemical Grade",
    },
    destinations: {
      HERAT_LOCAL: "Herat Local Market",
      DOMESTIC_PROVINCE: "Domestic Provinces",
      ISLAM_QALA_EXPORT: "Islam Qala Border (Export)",
      TORGHUNDI_EXPORT: "Torghundi Border (Export)",
    },
    methods: {
      ROCK_BLASTING_CUTTING: "Rock Salt Blasting / Cutting",
      SOLAR_EVAPORATION: "Solar Evaporation Pan",
    },
    common: {
      mt: "MT",
      kg: "kg",
      liters: "L",
      hours: "hrs",
      synced: "Synced",
      pending: "Pending Sync",
      active: "Active",
      voidPending: "Void Pending",
      voided: "Voided",
      cash: "Cash",
      bankTransfer: "Bank Transfer",
      hawala: "Hawala",
      noPermission: "Your active role does not have permission for this action.",
    },
  },
  fa: {
    dir: "rtl",
    brandName: "سیستم جامع معدن نمک هرات",
    brandSub: "عملیات غوریان و کهسان",
    nav: {
      dashboard: "داشبورد مدیریتی",
      weighbridge: "کانته و توزین (بارنامه)",
      extraction: "استخراج و ماشین‌آلات",
      processing: "پروسس و گدام‌داری",
      finance: "مالی، حواله و وزارت معادن",
      hrHse: "منابع بشری، معاشات و ایمنی",
      auditLogs: "ثبت وقایع غیرقابل تغییر",
    },
    topbar: {
      online: "متصل به سرور مرکزی",
      offlineSite: "حالت آفلاین معدن",
      pendingSync: "در انتظار همگام‌سازی",
      syncNow: "همگام‌سازی صف",
      syncing: "در حال همگام‌سازی...",
      fxRate: "نرخ قفل‌شده اسعار",
      roleLabel: "نقش فعلی",
      simulateOffline: "شبیه‌سازی قطع اینترنت",
    },
    roles: {
      MINE_OWNER: "مالک معدن / رئیس",
      SITE_OPS_MANAGER: "مدیر عملیات ساحه",
      WEIGHBRIDGE_CLERK: "مسئول کانته و دروازه",
      WAREHOUSE_OFFICER: "مسئول گدام و موجودی",
      FINANCE_OFFICER: "مدیر مالی و حسابداری",
      HSE_COMPLIANCE_OFFICER: "مسئول ایمنی و مقررات",
    },
    kpi: {
      extractedToday: "استخراج امروز",
      processedToday: "پروسس و آیودین‌دار شده",
      dispatchedToday: "ارسال شده (کانته)",
      revenueToday: "ارزش ناخالص فروش",
      costPerTon: "هزینه استخراج هر تُن",
      fuelEfficiency: "مصرف سوخت ناوگان",
      mompRoyalty: "حق‌الامتیاز معوق وزارت معادن",
      activeZones: "زون‌های فعال معدن",
      productionVsDispatch: "مقایسه ۷ روزه استخراج، پروسس و ارسال (تُن)",
      extractedLabel: "استخراج",
      processedLabel: "پروسس",
      dispatchedLabel: "ارسال",
      complianceBannerTitle: "انطباق با وزارت معادن و گمرک هرات",
      complianceBannerSub:
        "بارنامه‌های صادراتی اسلام‌قلعه و تورغندی دارای کد QR امنیتی و نرخ قفل‌شده دالر/افغانی می‌باشند.",
    },
    weighbridge: {
      title: "کانته دیجیتال (ترازو) و صدور بارنامه QR",
      subtitle:
        "تکت‌های کانته با محافظت ضدتقلب؛ وزن پس از صدور غیرقابل تغییر است و ابطال نیاز به تایید آمر دارد.",
      newTicketBtn: "ثبت تکت کانته جدید",
      ticketNo: "شماره تکت",
      direction: "نوع تردد",
      inbound: "ورودی (تدارکات)",
      outbound: "خروجی (فروش/ارسال)",
      truckPlate: "پلیت موتر",
      driverName: "نام راننده",
      driverTazkira: "نمبر تذکره راننده",
      counterparty: "مشتری / تمویل‌کننده",
      saltGrade: "نوع و گرید نمک",
      destination: "مقصد / سرحد",
      destinationDetail: "جزئیات مسیر / گدام",
      grossKg: "وزن مجموع (کیلو)",
      tareKg: "وزن خالی موتر (کیلو)",
      netKg: "وزن خالص (کیلو)",
      unitPriceAfn: "نرخ (افغانی / تُن)",
      paymentMethod: "روش پرداخت",
      hawalaRef: "حواله / صرافی",
      status: "وضعیت",
      actions: "عملیات",
      issueTicket: "ثبت و صدور بارنامه QR",
      viewWaybill: "بارنامه QR",
      requestVoid: "درخواست ابطال",
      approveVoid: "تایید ابطال",
      voidReasonPrompt: "دلیل الزامی ابطال این تکت کانته را وارد کنید:",
      antiFraudNotice:
        "قفل ضدتقلب: اوزان خالص و ناخالص پس از ثبت قابل ویرایش یا حذف نیستند.",
      waybillTitle: "بارنامه رسمی معدن نمک هرات",
      printWaybill: "چاپ بارنامه",
      close: "بستن",
      qrVerify: "برای تایید اصالت وزارت معادن اسکن کنید",
      scaleId: "شناسه کانته",
    },
    extraction: {
      title: "گزارش استخراج معدن، حوضچه‌های تبخیر و ماشین‌آلات",
      subtitle:
        "ثبت استخراج سنگ نمک غوریان و حوضچه‌های آفتابی کهسان همراه با مصرف تیل و ساعت کار ماشین‌آلات.",
      logExtractionBtn: "ثبت گزارش استخراج شفت",
      zone: "زون معدن",
      shift: "شفت کاری",
      shiftDay: "شفت الف (روز)",
      shiftNight: "شفت ب (شب)",
      method: "روش استخراج",
      rawTonnage: "تناژ خام (تُن)",
      crewLead: "سرگروه تیم",
      equipment: "ماشین / تجهیزات",
      fuelLiters: "دیزل مصرفی (لیتر)",
      engineHours: "ساعت کار موتور",
      moisturePct: "رطوبت %",
      notes: "ملاحظات شفت",
      submitLog: "ذخیره گزارش استخراج",
      targetProgress: "پیشرفت هدف روزانه",
      reserves: "ذخیره تخمینی",
    },
    audit: {
      title: "دفتر ثبت وقایع غیرقابل تغییر و ضدتقلب",
      subtitle:
        "گزارش دائمی تمام تکت‌های کانته، تاییدیه‌های ابطال و همگام‌سازی‌های آفلاین.",
      timestamp: "زمان ثبت",
      table: "بخش",
      record: "شناسه سند",
      action: "عملیات",
      summary: "شرح واقعه",
      actor: "کاربر",
      restricted:
        "دسترسی محدود: فقط مالک معدن، مدیر عملیات و مدیر مالی مجاز به مشاهده دفتر ممیزی هستند.",
    },
    grades: {
      INDUSTRIAL_RAW_ROCK: "سنگ نمک صنعتی خام (فله)",
      REFINED_IODIZED_25KG: "نمک طعام تصفیه‌شده آیودین‌دار (۲۵ کیلو)",
      REFINED_IODIZED_50KG: "نمک طعام تصفیه‌شده آیودین‌دار (۵۰ کیلو)",
      REFINED_IODIZED_1KG: "نمک طعام بسته‌بندی (۱ کیلو)",
      LIVESTOCK_SALT_BLOCK: "بلوک نمک مالداری",
      DEICING_CHEMICAL: "نمک کیمیاوی / ضدیخ جاده",
    },
    destinations: {
      HERAT_LOCAL: "بازار محلی هرات",
      DOMESTIC_PROVINCE: "ولایات داخلی",
      ISLAM_QALA_EXPORT: "مرز اسلام‌قلعه (صادرات)",
      TORGHUNDI_EXPORT: "مرز تورغندی (صادرات)",
    },
    methods: {
      ROCK_BLASTING_CUTTING: "انفجار و برش سنگ نمک",
      SOLAR_EVAPORATION: "تبخیر آفتابی (حوضچه)",
    },
    common: {
      mt: "تُن",
      kg: "کیلو",
      liters: "لیتر",
      hours: "ساعت",
      synced: "همگام‌سازی شد",
      pending: "در صف آفلاین",
      active: "فعال",
      voidPending: "در انتظار ابطال",
      voided: "باطل‌شده",
      cash: "نقد",
      bankTransfer: "انتقال بانکی",
      hawala: "حواله",
      noPermission: "نقش فعلی شما اجازه انجام این عملیات را ندارد.",
    },
  },
  ps: {
    dir: "rtl",
    brandName: "د هرات د مالګې کان ERP سیستم",
    brandSub: "د غوریان او کهسان عملیات",
    nav: {
      dashboard: "اجرائیوي ډشبورډ",
      weighbridge: "کانته او تله (بارنامه)",
      extraction: "استخراج او ماشینري",
      processing: "پروسس او ګودام",
      finance: "مالي، حواله او کانونو وزارت",
      hrHse: "بشري سرچینې، معاشونه او خوندیتوب",
      auditLogs: "نه بدلیدونکی تفتیش ثبت",
    },
    topbar: {
      online: "له مرکزي سرور سره وصل",
      offlineSite: "د کان آفلاین حالت",
      pendingSync: "د همغږۍ په تمه",
      syncNow: "صف همغږی کړئ",
      syncing: "همغږي روانه ده...",
      fxRate: "ثبت شوی اسعار نرخ",
      roleLabel: "فعال رول",
      simulateOffline: "د انټرنیټ پرېکېدل وازمویئ",
    },
    roles: {
      MINE_OWNER: "د کان مالک / رئیس",
      SITE_OPS_MANAGER: "د ساحې عملیاتو مدیر",
      WEIGHBRIDGE_CLERK: "د کانتې او دروازې مامور",
      WAREHOUSE_OFFICER: "د ګودام او زېرمو مسؤل",
      FINANCE_OFFICER: "مالي او محاسبې مدیر",
      HSE_COMPLIANCE_OFFICER: "د خوندیتوب او مقرراتو مسؤل",
    },
    kpi: {
      extractedToday: "نننی استخراج",
      processedToday: "پروسس او ایوډین شوې",
      dispatchedToday: "لېږل شوې (کانته)",
      revenueToday: "د پلور ناخالص ارزښت",
      costPerTon: "د یو ټن استخراج لګښت",
      fuelEfficiency: "د موټرو د تېلو مصرف",
      mompRoyalty: "د کانونو وزارت پاتې حق‌الامتیاز",
      activeZones: "د کان فعال زونونه",
      productionVsDispatch: "د ۷ ورځو استخراج، پروسس او لېږد مقایسه (ټن)",
      extractedLabel: "استخراج",
      processedLabel: "پروسس",
      dispatchedLabel: "لېږد",
      complianceBannerTitle: "د کانونو وزارت او هرات ګمرک مطابقت",
      complianceBannerSub:
        "د اسلام‌قلعه او تورغندي صادراتي بارنامې د QR تصدیق او ثبت شوي ډالر/افغانۍ نرخ لري.",
    },
    weighbridge: {
      title: "ډیجیټل کانته (تله) او د QR بارنامه",
      subtitle:
        "د درغلۍ ضد کانته ټکټونه؛ وزن تر ثبت وروسته نه بدلېږي او لغوه کول د مدیر تایید ته اړتیا لري.",
      newTicketBtn: "نوی کانته ټکټ ثبت کړئ",
      ticketNo: "د ټکټ شمېره",
      direction: "د تګ راتګ ډول",
      inbound: "راغلی (اکمالات)",
      outbound: "وتلی (پلور/لېږد)",
      truckPlate: "د موټر پلیت",
      driverName: "د چلوونکي نوم",
      driverTazkira: "د چلوونکي تذکره",
      counterparty: "پیرودونکی / اکمالوونکی",
      saltGrade: "د مالګې درجه",
      destination: "مقصد / سرحد",
      destinationDetail: "د لارې / ګودام جزئیات",
      grossKg: "ټول وزن (کیلو)",
      tareKg: "خالي موټر وزن (کیلو)",
      netKg: "خالص وزن (کیلو)",
      unitPriceAfn: "نرخ (افغانۍ / ټن)",
      paymentMethod: "د تادیې طریقه",
      hawalaRef: "حواله / صراف",
      status: "حالت",
      actions: "کړنې",
      issueTicket: "ثبت او QR بارنامه جوړه کړئ",
      viewWaybill: "QR بارنامه",
      requestVoid: "د لغوه غوښتنه",
      approveVoid: "لغوه تایید کړئ",
      voidReasonPrompt: "د دې کانته ټکټ د لغوه کولو لازمي دلیل ولیکئ:",
      antiFraudNotice:
        "د درغلۍ ضد قلف: خالص او ناخالص وزن تر ثبت وروسته نشي بدلیدای یا حذف کیدای.",
      waybillTitle: "د هرات مالګې کان رسمي بارنامه",
      printWaybill: "بارنامه چاپ کړئ",
      close: "تړل",
      qrVerify: "د کانونو وزارت تصدیق لپاره سکن کړئ",
      scaleId: "د کانتې کوډ",
    },
    extraction: {
      title: "د کان استخراج، تبخیر حوضونو او ماشینرۍ راپور",
      subtitle:
        "د غوریان ډبرینې مالګې او کهسان لمریزو حوضونو استخراج، د تېلو مصرف او انجن ساعتونه ثبت کړئ.",
      logExtractionBtn: "د شفت استخراج ثبت کړئ",
      zone: "د کان زون",
      shift: "کاري شفت",
      shiftDay: "شفت الف (ورځ)",
      shiftNight: "شفت ب (شپه)",
      method: "د استخراج طریقه",
      rawTonnage: "خام تناژ (ټن)",
      crewLead: "د ټیم مشر",
      equipment: "ماشین / تجهیزات",
      fuelLiters: "مصرف شوي ډیزل (لیتر)",
      engineHours: "د انجن ساعتونه",
      moisturePct: "رطوبت %",
      notes: "د شفت یادښتونه",
      submitLog: "د استخراج راپور خوندي کړئ",
      targetProgress: "د ورځني هدف پرمختګ",
      reserves: "اټکلي زېرمه",
    },
    audit: {
      title: "نه بدلیدونکی امنیتي او د درغلۍ ضد تفتیش ثبت",
      subtitle:
        "د ټولو کانته ټکټونو، د مدیرانو لغوه تاییدونو او آفلاین همغږیو دایمي تاریخچه.",
      timestamp: "وخت",
      table: "برخه",
      record: "د سند کوډ",
      action: "کړنه",
      summary: "د پېښې لنډیز",
      actor: "کاروونکی",
      restricted:
        "محدود لاسرسی: یوازې د کان مالک، د عملیاتو مدیر او مالي مدیر دا ثبت کتلای شي.",
    },
    grades: {
      INDUSTRIAL_RAW_ROCK: "صنعتي خامه ډبرینه مالګه",
      REFINED_IODIZED_25KG: "تصفیه شوې ایوډین لرونکې مالګه (۲۵ کیلو)",
      REFINED_IODIZED_50KG: "تصفیه شوې ایوډین لرونکې مالګه (۵۰ کیلو)",
      REFINED_IODIZED_1KG: "پرچون تصفیه شوې مالګه (۱ کیلو)",
      LIVESTOCK_SALT_BLOCK: "د مالدارۍ مالګې بلاکونه",
      DEICING_CHEMICAL: "کیمیاوي / د سړک یخ ویلي کولو مالګه",
    },
    destinations: {
      HERAT_LOCAL: "د هرات محلي بازار",
      DOMESTIC_PROVINCE: "کورني ولایتونه",
      ISLAM_QALA_EXPORT: "د اسلام‌قلعه سرحد (صادرات)",
      TORGHUNDI_EXPORT: "د تورغندي سرحد (صادرات)",
    },
    methods: {
      ROCK_BLASTING_CUTTING: "د ډبرینې مالګې چاودنه او پرې کول",
      SOLAR_EVAPORATION: "لمریز تبخیر حوضونه",
    },
    common: {
      mt: "ټن",
      kg: "کیلو",
      liters: "لیتر",
      hours: "ساعتونه",
      synced: "همغږی شو",
      pending: "آفلاین صف کې",
      active: "فعال",
      voidPending: "لغوه په تمه",
      voided: "لغوه شوی",
      cash: "نغد",
      bankTransfer: "بانکي انتقال",
      hawala: "حواله",
      noPermission: "ستاسو فعال رول د دې کړنې اجازه نلري.",
    },
  },
};
