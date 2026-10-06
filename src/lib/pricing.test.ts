import { describe, expect, it } from "vitest";
import { pricingConfig } from "./config";
import { formatMoney, isReturnDay, quotePickup } from "./pricing";

// 2026-10-03 is a Saturday, 2026-10-05 a Monday.
const SATURDAY = "2026-10-03";
const MONDAY = "2026-10-05";

describe("quotePickup", () => {
  it("charges the single-item rate for one item", () => {
    const quote = quotePickup(1, MONDAY);
    expect(quote.total).toBe(pricingConfig.singleItem);
    expect(quote.lines).toHaveLength(1);
  });

  it("bundles two or more items into the multi-item rate", () => {
    expect(quotePickup(2, MONDAY).total).toBe(pricingConfig.multiItem);
    expect(quotePickup(7, MONDAY).total).toBe(pricingConfig.multiItem);
    expect(quotePickup(3, MONDAY).lines[0]?.label).toContain("3 items");
  });

  it("applies the Return Day discount on Saturdays", () => {
    const quote = quotePickup(1, SATURDAY);
    expect(quote.lines.at(-1)).toEqual({
      label: "Return Day (Saturday) discount",
      amount: -pricingConfig.returnDay.discount,
    });
    expect(quote.total).toBe(5.99);
  });

  it("avoids floating point drift in totals", () => {
    expect(quotePickup(4, SATURDAY).total).toBe(10.99);
  });

  it("treats zero or fractional counts as at least one whole item", () => {
    expect(quotePickup(0).total).toBe(pricingConfig.singleItem);
    expect(quotePickup(1.7).total).toBe(pricingConfig.singleItem);
  });

  it("quotes without a date (no discount yet)", () => {
    expect(quotePickup(1).lines).toHaveLength(1);
  });
});

describe("isReturnDay", () => {
  it("is true only for Saturdays", () => {
    expect(isReturnDay(SATURDAY)).toBe(true);
    expect(isReturnDay(MONDAY)).toBe(false);
  });
});

describe("formatMoney", () => {
  it("formats US dollars", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
    expect(formatMoney(-2)).toBe("-$2.00");
  });
});
