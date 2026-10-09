import { describe, expect, it } from "vitest";
import { buildReturnRecord } from "./create-return";
import {
  EMPTY_DRAFT,
  draftFromParams,
  parseCreateInput,
  validateStep,
  type ReturnDraft,
} from "./return-draft";
import { createReturnSchema } from "./schemas";

const NOW = new Date("2026-10-02T10:00");

const COMPLETE: ReturnDraft = {
  ...EMPTY_DRAFT,
  retailerId: "zara",
  itemDescription: "Black blazer",
  itemCount: "1",
  refundAmount: "$89.90",
  returnDeadline: "2026-10-09",
  hasQrCode: "yes",
  pickupDate: "2026-10-03",
  windowId: "10-12",
  line1: "10 W 35th St",
  city: "Chicago",
  state: "il",
  zip: "60616",
  contactEmail: "customer@gmail.com",
};

describe("validateStep", () => {
  it("requires a retailer, and a name when choosing Other", () => {
    expect(validateStep("retailer", EMPTY_DRAFT, NOW)).toHaveProperty("retailerId");
    const withEmail = { ...EMPTY_DRAFT, contactEmail: "customer@gmail.com" };
    const other = validateStep("retailer", { ...withEmail, retailerId: "other" }, NOW);
    expect(other).toEqual({ customRetailerName: "Tell us the retailer's name" });
    expect(
      validateStep(
        "retailer",
        { ...withEmail, retailerId: "other", customRetailerName: "Everlane" },
        NOW,
      ),
    ).toEqual({});
  });

  it("only requires the item description on the details step", () => {
    const errors = validateStep("details", { ...EMPTY_DRAFT, retailerId: "nike" }, NOW);
    expect(Object.keys(errors)).toEqual(["itemDescription"]);
    expect(validateStep("details", { ...EMPTY_DRAFT, itemDescription: "Sneakers" }, NOW)).toEqual(
      {},
    );
  });

  it("validates optional details when they are provided", () => {
    const errors = validateStep(
      "details",
      {
        ...EMPTY_DRAFT,
        itemDescription: "Sneakers",
        itemCount: "0",
        refundAmount: "abc",
        returnDeadline: "2026-09-30",
      },
      NOW,
    );
    expect(errors.itemCount).toBe("At least one item");
    expect(errors.refundAmount).toBe("Enter an amount like 49.99");
    expect(errors.returnDeadline).toMatch(/already passed/);
  });

  it("requires a bookable slot and a valid address on the pickup step", () => {
    const errors = validateStep(
      "pickup",
      { ...COMPLETE, pickupDate: "", windowId: "", zip: "606", state: "Illinois" },
      NOW,
    );
    expect(errors).toMatchObject({
      pickupDate: "Choose a pickup day",
      windowId: "Choose a pickup window",
      zip: "Enter a 5-digit ZIP code",
      state: "Use a 2-letter state, like IL",
    });
  });

  it("rejects a window that has already started", () => {
    const errors = validateStep(
      "pickup",
      { ...COMPLETE, pickupDate: "2026-10-02", windowId: "08-10" },
      NOW,
    );
    expect(errors.windowId).toMatch(/no longer available/);
  });

  it("rejects a pickup after the return deadline", () => {
    const errors = validateStep(
      "pickup",
      { ...COMPLETE, pickupDate: "2026-10-12", returnDeadline: "2026-10-09" },
      NOW,
    );
    expect(errors.pickupDate).toBe("Pick a date on or before your return deadline");
  });

  it("catches typo and placeholder emails on the first step", () => {
    expect(
      validateStep("retailer", { ...COMPLETE, contactEmail: "customer@gnail.com" }, NOW),
    ).toEqual({
      contactEmail: "Did you mean customer@gmail.com?",
    });
    expect(validateStep("retailer", { ...COMPLETE, contactEmail: "anc@abc.com" }, NOW)).toEqual({
      contactEmail: "Please use your real email address so we can reach you",
    });
  });

  it("asks for a valid email on the first step", () => {
    expect(validateStep("retailer", { ...COMPLETE, contactEmail: "" }, NOW)).toEqual({
      contactEmail: "Enter your email so we can send your confirmation",
    });
    expect(validateStep("retailer", { ...COMPLETE, contactEmail: "customer@" }, NOW)).toEqual({
      contactEmail: "Enter a valid email address",
    });
    expect(validateStep("retailer", COMPLETE, NOW)).toEqual({});
  });

  it("passes a complete draft", () => {
    expect(validateStep("pickup", COMPLETE, NOW)).toEqual({});
  });
});

describe("draft to return record", () => {
  it("normalizes input and builds a scheduled return", () => {
    const input = parseCreateInput(COMPLETE);
    expect(input).not.toBeNull();
    expect(input!.refundAmount).toBe(89.9);
    expect(input!.pickup.address.state).toBe("IL");
    expect(input!.hasQrCode).toBe(true);
    expect(input!.hasReturnLabel).toBeUndefined();

    const record = buildReturnRecord(input!, NOW);
    expect(record.status).toBe("pickup_scheduled");
    expect(record.history).toHaveLength(1);
    expect(record.retailerName).toBe("Zara");
    // Oct 3, 2026 is a Saturday: Return Day pricing applies.
    expect(record.price.total).toBe(5.99);
  });

  it("rejects payloads the server shouldn't trust", () => {
    const result = createReturnSchema.safeParse({
      retailerId: "x",
      retailerName: "",
      itemCount: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("draftFromParams", () => {
  it("prefills known retailers and valid values only", () => {
    const draft = draftFromParams(
      new URLSearchParams(
        "retailer=nike&deadline=2026-10-18&carrier=UPS&qr=yes&amount=139.99&label=maybe",
      ),
    );
    expect(draft).toEqual({
      retailerId: "nike",
      returnDeadline: "2026-10-18",
      carrier: "UPS",
      hasQrCode: "yes",
      refundAmount: "139.99",
    });
  });

  it("treats unknown retailers as Other and ignores bad dates", () => {
    expect(draftFromParams(new URLSearchParams("retailer=Everlane&deadline=2026-02-30"))).toEqual({
      retailerId: "other",
      customRetailerName: "Everlane",
    });
  });
});
