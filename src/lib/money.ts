import Decimal from "decimal.js";

/** Display and preview only. Values stay strings until they are formatted. */
export function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return new Decimal(value).toFixed(2);
}

export function marginPercent(retail: string, cost: string) {
  if (!retail || !cost) {
    return null;
  }
  const price = new Decimal(retail);
  if (price.isZero()) {
    return null;
  }
  return price.minus(cost).div(price).times(100).toFixed(1);
}

export function profitPerUnit(retail: string, cost: string) {
  if (!retail || !cost) {
    return null;
  }
  return new Decimal(retail).minus(cost).toFixed(2);
}

export function addQuantities(values: Array<string | number | undefined>) {
  return values.reduce((sum, value) => sum.plus(value ?? 0), new Decimal(0)).toFixed(4).replace(/\.?0+$/, "");
}

/** Quantity-weighted average of stock-balance costs. */
export function weightedAverageCost(
  rows: Array<{ quantity?: number; averageCost?: number }>,
) {
  let qty = new Decimal(0);
  let value = new Decimal(0);
  for (const row of rows) {
    const q = new Decimal(row.quantity ?? 0);
    if (q.lte(0) || row.averageCost === undefined) {
      continue;
    }
    qty = qty.plus(q);
    value = value.plus(q.times(row.averageCost));
  }
  if (qty.isZero()) {
    return null;
  }
  return value.div(qty).toFixed(2);
}
