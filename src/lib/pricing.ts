import { pricingConfig } from "./config";
import { parseISODate, type ISODate } from "./dates";

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceQuote {
  lines: PriceLine[];
  total: number;
  currency: string;
}

const roundCents = (value: number) => Math.round(value * 100) / 100;

export function isReturnDay(pickupDate: ISODate): boolean {
  return parseISODate(pickupDate).getDay() === pricingConfig.returnDay.weekday;
}

/**
 * Quotes a doorstep pickup. One item is the single-item rate; two or more
 * from the same retailer are bundled. Saturday pickups get the Return Day
 * discount, a rule kept from the original 2023 service.
 */
export function quotePickup(itemCount: number, pickupDate?: ISODate): PriceQuote {
  const items = Math.max(1, Math.floor(itemCount));
  const lines: PriceLine[] =
    items === 1
      ? [{ label: "Doorstep pickup · 1 item", amount: pricingConfig.singleItem }]
      : [{ label: `Doorstep pickup · ${items} items`, amount: pricingConfig.multiItem }];

  if (pickupDate && isReturnDay(pickupDate)) {
    lines.push({
      label: "Return Day (Saturday) discount",
      amount: -pricingConfig.returnDay.discount,
    });
  }

  return {
    lines,
    total: roundCents(lines.reduce((sum, line) => sum + line.amount, 0)),
    currency: pricingConfig.currency,
  };
}

export function formatMoney(amount: number, currency: string = pricingConfig.currency): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
