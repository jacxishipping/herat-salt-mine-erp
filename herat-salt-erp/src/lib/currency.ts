import { CurrencyCode } from "@/types/erp";

export const DEFAULT_USD_TO_AFN = 71.5;

export function formatCurrency(
  amountInAfn: number,
  currency: CurrencyCode,
  usdToAfn: number = DEFAULT_USD_TO_AFN
): string {
  if (currency === "USD") {
    const usd = amountInAfn / usdToAfn;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(amountInAfn))} ؋`;
}

export function formatNumber(val: number, decimals = 1): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}
