import { DestinationType, SaltGrade, TonnageContract } from "@/types/erp";

export interface GradeCostProfile {
  extractionAfn: number;
  processingIodineAfn: number;
  packagingAfn: number;
  standardListPriceAfn: number;
}

export interface PriceQuote {
  extractionAfn: number;
  processingIodineAfn: number;
  packagingAfn: number;
  mompRoyaltyAfn: number;
  transportAfn: number;
  landedCostPerMtAfn: number;
  volumeDiscountPct: number;
  targetMarginPct: number;
  finalUnitPriceAfn: number;
  finalUnitPriceUsd: number;
  totalOrderAfn: number;
  totalOrderUsd: number;
  estimatedProfitAfn: number;
  pricingSource: string;
}

export const MOMP_ROYALTY_AFN_PER_MT = 350;

export const GRADE_COST_PROFILES: Record<SaltGrade, GradeCostProfile> = {
  INDUSTRIAL_RAW_ROCK: {
    extractionAfn: 1150,
    processingIodineAfn: 0,
    packagingAfn: 0,
    standardListPriceAfn: 3200,
  },
  DEICING_CHEMICAL: {
    extractionAfn: 1200,
    processingIodineAfn: 250,
    packagingAfn: 150,
    standardListPriceAfn: 3600,
  },
  LIVESTOCK_SALT_BLOCK: {
    extractionAfn: 1300,
    processingIodineAfn: 950,
    packagingAfn: 450,
    standardListPriceAfn: 5400,
  },
  REFINED_IODIZED_50KG: {
    extractionAfn: 1420,
    processingIodineAfn: 1450,
    packagingAfn: 620,
    standardListPriceAfn: 6500,
  },
  REFINED_IODIZED_25KG: {
    extractionAfn: 1420,
    processingIodineAfn: 1500,
    packagingAfn: 780,
    standardListPriceAfn: 6800,
  },
  REFINED_IODIZED_1KG: {
    extractionAfn: 1420,
    processingIodineAfn: 1750,
    packagingAfn: 1400,
    standardListPriceAfn: 8400,
  },
};

export const DESTINATION_FREIGHT_AFN: Record<DestinationType, number> = {
  HERAT_LOCAL: 450,
  DOMESTIC_PROVINCE: 1250,
  ISLAM_QALA_EXPORT: 950,
  TORGHUNDI_EXPORT: 1100,
};

export function getVolumeDiscountPct(quantityMt: number): number {
  if (quantityMt >= 500) return 8.0;
  if (quantityMt >= 100) return 5.0;
  if (quantityMt >= 50) return 2.5;
  return 0;
}

export function calculateSaltPriceQuote(params: {
  customerName: string;
  saltGrade: SaltGrade;
  destination: DestinationType;
  quantityMt: number;
  targetMarginPct: number;
  usdToAfn: number;
  contracts?: TonnageContract[];
}): PriceQuote {
  const profile = GRADE_COST_PROFILES[params.saltGrade];
  const transportAfn = DESTINATION_FREIGHT_AFN[params.destination] ?? 450;
  const landedCostPerMtAfn =
    profile.extractionAfn +
    profile.processingIodineAfn +
    profile.packagingAfn +
    MOMP_ROYALTY_AFN_PER_MT +
    transportAfn;

  const volumeDiscountPct = getVolumeDiscountPct(params.quantityMt);
  const contract = (params.contracts || []).find(
    (c) =>
      c.customerName.toLowerCase() ===
        params.customerName.trim().toLowerCase() &&
      c.saltGrade === params.saltGrade &&
      c.status === "ACTIVE"
  );

  let finalUnitPriceAfn: number;
  let pricingSource: string;

  if (contract) {
    finalUnitPriceAfn = Math.round(
      contract.tierPriceAfnPerMt * (1 - volumeDiscountPct / 100)
    );
    pricingSource = `Contract ${contract.contractCode}${
      volumeDiscountPct > 0 ? ` (-${volumeDiscountPct}% vol)` : ""
    }`;
  } else {
    const costPlus =
      landedCostPerMtAfn * (1 + Math.max(0, params.targetMarginPct) / 100);
    finalUnitPriceAfn = Math.round(costPlus * (1 - volumeDiscountPct / 100));
    pricingSource = `Cost-Plus (${params.targetMarginPct}% margin${
      volumeDiscountPct > 0 ? `, -${volumeDiscountPct}% vol` : ""
    })`;
  }

  const fx = params.usdToAfn > 0 ? params.usdToAfn : 71.5;
  const qty = Math.max(0, params.quantityMt);
  const totalOrderAfn = Math.round(finalUnitPriceAfn * qty);
  const estimatedProfitAfn = Math.round(
    (finalUnitPriceAfn - landedCostPerMtAfn) * qty
  );

  return {
    extractionAfn: profile.extractionAfn,
    processingIodineAfn: profile.processingIodineAfn,
    packagingAfn: profile.packagingAfn,
    mompRoyaltyAfn: MOMP_ROYALTY_AFN_PER_MT,
    transportAfn,
    landedCostPerMtAfn,
    volumeDiscountPct,
    targetMarginPct: params.targetMarginPct,
    finalUnitPriceAfn,
    finalUnitPriceUsd: Number((finalUnitPriceAfn / fx).toFixed(2)),
    totalOrderAfn,
    totalOrderUsd: Number((totalOrderAfn / fx).toFixed(2)),
    estimatedProfitAfn,
    pricingSource,
  };
}
