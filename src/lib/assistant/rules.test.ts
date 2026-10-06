import { describe, expect, it } from "vitest";
import { recommendNextAction, summarize } from "./describe";
import { extractDeadline, extractWithRules, findDates } from "./rules";
import { buildSamples } from "./samples";

const NOW = new Date("2026-10-02T10:00");

describe("findDates", () => {
  it("understands month names, numeric and ISO dates", () => {
    const dates = findDates("Oct 18, Sept. 3rd 2027, 11/05 and 2026-12-01", NOW).map((d) => d.date);
    expect(dates).toEqual(["2026-10-18", "2027-09-03", "2026-11-05", "2026-12-01"]);
  });

  it("rolls a year-less date that's long past into next year", () => {
    expect(findDates("January 10", NOW)[0]?.date).toBe("2027-01-10");
    expect(findDates("September 25", NOW)[0]?.date).toBe("2026-09-25");
  });

  it("ignores impossible dates", () => {
    expect(findDates("February 30 and 13/45", NOW)).toEqual([]);
  });
});

describe("extractDeadline", () => {
  it("prefers a date introduced by a deadline phrase", () => {
    const result = extractDeadline(
      "Delivered on Oct 1. Your return is eligible until October 18.",
      NOW,
    );
    expect(result.deadline).toBe("2026-10-18");
    expect(result.deadlineEvidence).toContain("eligible until October 18");
  });

  it("computes the deadline from a window and a start date", () => {
    const result = extractDeadline(
      "Return within 30 days of delivery. Delivered on September 20.",
      NOW,
    );
    expect(result).toMatchObject({ deadline: "2026-10-20", windowDays: 30 });
  });

  it("returns null when there's no deadline", () => {
    expect(extractDeadline("Thanks for your order!", NOW)).toEqual({
      deadline: null,
      deadlineEvidence: null,
      windowDays: null,
    });
  });
});

describe("extractWithRules", () => {
  it("handles the Nike-style QR email from the product brief", () => {
    const extraction = extractWithRules(
      "Your Nike return is eligible until October 18. No printer is required. Show this UPS QR code at drop-off.",
      NOW,
    );
    expect(extraction).toMatchObject({
      retailer: "Nike",
      retailerId: "nike",
      deadline: "2026-10-18",
      method: "qr_code",
      carrier: "UPS",
      labelRequirement: "not_required",
    });
    expect(summarize(extraction, NOW)).toBe(
      "Your Nike return is eligible until October 18. No printer is required. The return uses a UPS QR code.",
    );
  });

  it("extracts every field from the bundled samples", () => {
    const [qr, label, policy] = buildSamples(NOW).map((sample) =>
      extractWithRules(sample.text, NOW),
    );

    expect(qr).toMatchObject({
      retailer: "Nike",
      orderNumber: "C01234567890",
      itemDescription: "Air Zoom running shoes, size 9",
      refundAmount: 139.99,
      deadline: "2026-10-18",
      method: "qr_code",
      carrier: "UPS",
      labelRequirement: "not_required",
    });
    expect(qr!.conditions).toEqual(
      expect.arrayContaining(["Tags must be attached", "Item should be unused"]),
    );

    expect(label).toMatchObject({
      retailer: "Amazon",
      orderNumber: "114-3920571-2284465",
      refundAmount: 129.99,
      deadline: "2026-10-04",
      method: "printed_label",
      carrier: "UPS",
      labelRequirement: "required",
      packagingRequirement: "required",
    });

    expect(policy).toMatchObject({
      retailer: "Zara",
      deadline: "2026-10-23", // shipped Sep 23 + 30 days
      windowDays: 30,
      method: "qr_code",
      carrier: "USPS",
      packagingRequirement: "not_required",
    });
  });

  it("doesn't invent facts from unrelated text", () => {
    const extraction = extractWithRules(
      "Hope you're having a good week. See you at the game on Saturday!",
      NOW,
    );
    expect(extraction).toMatchObject({
      retailer: null,
      deadline: null,
      method: "unknown",
      carrier: null,
      labelRequirement: "unknown",
      packagingRequirement: "unknown",
      refundAmount: null,
    });
  });

  it("doesn't read the word 'ups' in prose as the carrier", () => {
    expect(extractWithRules("We had some ups and downs with this order.", NOW).carrier).toBeNull();
  });
});

describe("recommendNextAction", () => {
  const base = extractWithRules("", NOW);

  it("escalates as the deadline approaches", () => {
    expect(recommendNextAction({ ...base, deadline: "2026-10-30" }, NOW).urgency).toBe("normal");
    expect(recommendNextAction({ ...base, deadline: "2026-10-07" }, NOW).urgency).toBe("soon");
    expect(recommendNextAction({ ...base, deadline: "2026-10-03" }, NOW).urgency).toBe("urgent");
    expect(recommendNextAction({ ...base, deadline: "2026-09-28" }, NOW).urgency).toBe("passed");
    expect(recommendNextAction(base, NOW).urgency).toBe("unknown");
  });
});

describe("extractOrderNumber", () => {
  it("requires a digit so ordinary words aren't mistaken for order numbers", async () => {
    const { extractOrderNumber } = await import("./rules");
    expect(extractOrderNumber("Your order confirmed today")).toBeNull();
    expect(extractOrderNumber("Order #A1B2C3")).toBe("A1B2C3");
    expect(extractOrderNumber("for order C01234567890.")).toBe("C01234567890");
  });
});
