import { describe, expect, it } from "vitest";
import { RETAILERS, findRetailerInText, searchRetailers } from "./retailers";

describe("searchRetailers", () => {
  it("returns everything for an empty query", () => {
    expect(searchRetailers("  ")).toHaveLength(RETAILERS.length);
  });

  it("ranks exact and prefix matches first", () => {
    expect(searchRetailers("best")[0]?.id).toBe("best-buy");
    expect(searchRetailers("target")[0]?.id).toBe("target");
  });

  it("ignores case, spacing and punctuation", () => {
    expect(searchRetailers("h&m")[0]?.id).toBe("hm");
    expect(searchRetailers("HM")[0]?.id).toBe("hm");
    expect(searchRetailers("bestbuy")[0]?.id).toBe("best-buy");
    expect(searchRetailers("macys")[0]?.id).toBe("macys");
  });

  it("returns nothing for unknown retailers", () => {
    expect(searchRetailers("zzzz")).toEqual([]);
  });
});

describe("findRetailerInText", () => {
  it("finds the first retailer mentioned", () => {
    expect(findRetailerInText("Thanks for shopping at Target. Unlike Amazon…")?.id).toBe("target");
    expect(findRetailerInText("Your H&M order")?.id).toBe("hm");
  });

  it("requires whole-word matches", () => {
    expect(findRetailerInText("A gap in the schedule")).toBeUndefined();
    expect(findRetailerInText("targeting the right customers")).toBeUndefined();
  });
});
