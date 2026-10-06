import { describe, expect, it } from "vitest";
import { createDemoReturns } from "./demo-data";
import {
  RETURN_STATUSES,
  TRACKING_NUMBER_PATTERN,
  advanceReturn,
  buildTimeline,
  deadlineUrgency,
  earliestDeadline,
  generateTrackingNumber,
  nextStatus,
  pickupBeatsDeadline,
  progressPercent,
  sortReturns,
  summarizeReturns,
  type ReturnRecord,
} from "./returns";

const NOW = new Date("2026-10-02T10:00");
const demo = () => createDemoReturns(NOW);
const scheduled = () => demo().find((r) => r.status === "pickup_scheduled")!;

describe("status progression", () => {
  it("walks through every status in order and stops at Refund Complete", () => {
    let record: ReturnRecord = {
      ...scheduled(),
      history: [{ status: "pickup_scheduled", at: NOW.toISOString() }],
    };
    const seen = [record.status];
    for (let i = 0; i < 10; i++) {
      record = advanceReturn(record, NOW);
      if (seen.at(-1) !== record.status) seen.push(record.status);
    }
    expect(seen).toEqual([...RETURN_STATUSES]);
    expect(record.history.map((e) => e.status)).toEqual([...RETURN_STATUSES]);
    expect(nextStatus("refund_complete")).toBeNull();
  });

  it("returns the same object when already complete", () => {
    const done = demo().find((r) => r.status === "refund_complete")!;
    expect(advanceReturn(done, NOW)).toBe(done);
  });

  it("does not mutate the original record", () => {
    const record = scheduled();
    const before = structuredClone(record);
    advanceReturn(record, NOW);
    expect(record).toEqual(before);
  });

  it("reports progress from 0 to 100", () => {
    expect(progressPercent("pickup_scheduled")).toBe(0);
    expect(progressPercent("delivered")).toBe(60);
    expect(progressPercent("refund_complete")).toBe(100);
  });
});

describe("buildTimeline", () => {
  it("marks earlier steps complete, the current step current, and later steps upcoming", () => {
    const record = demo().find((r) => r.status === "in_transit")!;
    const states = buildTimeline(record).map((s) => s.state);
    expect(states).toEqual(["complete", "complete", "current", "upcoming", "upcoming", "upcoming"]);
  });

  it("attaches timestamps from the history", () => {
    const record = demo().find((r) => r.status === "in_transit")!;
    const timeline = buildTimeline(record);
    expect(timeline[0]?.at).toBe(record.history[0]?.at);
    expect(timeline[4]?.at).toBeUndefined();
  });
});

describe("deadlines", () => {
  it("classifies urgency by days remaining", () => {
    expect(deadlineUrgency(undefined, NOW)).toBe("none");
    expect(deadlineUrgency("2026-10-01", NOW)).toBe("passed");
    expect(deadlineUrgency("2026-10-02", NOW)).toBe("urgent");
    expect(deadlineUrgency("2026-10-04", NOW)).toBe("urgent");
    expect(deadlineUrgency("2026-10-08", NOW)).toBe("soon");
    expect(deadlineUrgency("2026-10-20", NOW)).toBe("ok");
  });

  it("requires pickup on or before the deadline", () => {
    expect(pickupBeatsDeadline("2026-10-05", "2026-10-05")).toBe(true);
    expect(pickupBeatsDeadline("2026-10-06", "2026-10-05")).toBe(false);
    expect(pickupBeatsDeadline("2026-10-06")).toBe(true);
  });

  it("finds the earliest deadline across returns", () => {
    expect(
      earliestDeadline([{ returnDeadline: "2026-11-01" }, {}, { returnDeadline: "2026-10-15" }]),
    ).toBe("2026-10-15");
    expect(earliestDeadline([{}])).toBeUndefined();
  });
});

describe("generateTrackingNumber", () => {
  it("uses the RD-YEAR-NNNN format", () => {
    expect(generateTrackingNumber(NOW)).toMatch(TRACKING_NUMBER_PATTERN);
    expect(generateTrackingNumber(NOW, new Set(), () => 0.0943)).toBe("RD-2026-1848");
  });

  it("skips numbers that are already taken", () => {
    const values = [0, 0, 0.5];
    const id = generateTrackingNumber(NOW, new Set(["RD-2026-1000"]), () => values.shift() ?? 0.5);
    expect(id).toBe("RD-2026-5500");
  });
});

describe("dashboard summaries", () => {
  it("totals pending and completed refunds", () => {
    const summary = summarizeReturns(demo());
    expect(summary.active).toBe(4);
    expect(summary.completed).toBe(2);
    expect(summary.refundsPending).toBe(304.86); // 129.99 + 89.90 + 34.99 + 49.98
    expect(summary.refundedTotal).toBe(224); // 145.00 + 79.00
    expect(summary.nextPickup?.retailerName).toBe("Zara");
  });

  it("sorts active returns before completed ones", () => {
    const sorted = sortReturns(demo());
    const firstCompleted = sorted.findIndex((r) => r.status === "refund_complete");
    expect(sorted.slice(firstCompleted).every((r) => r.status === "refund_complete")).toBe(true);
    expect(firstCompleted).toBe(4);
  });
});

describe("demo data", () => {
  it("is relative to today and includes active and completed returns", () => {
    const records = demo();
    expect(records.find((r) => r.retailerName === "Zara")?.pickup.date).toBe("2026-10-04");
    expect(new Set(records.map((r) => r.status)).size).toBeGreaterThanOrEqual(5);
    expect(records.every((r) => TRACKING_NUMBER_PATTERN.test(r.id))).toBe(true);
  });

  it("never has status timestamps in the future", () => {
    for (const record of demo()) {
      for (const event of record.history) {
        expect(new Date(event.at).getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });
});
