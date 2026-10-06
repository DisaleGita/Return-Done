import { describe, expect, it } from "vitest";
import { schedulingConfig } from "./config";
import { getPickupDays, getPickupWindows, isSlotBookable, windowLabel } from "./scheduling";

const at = (iso: string) => new Date(iso); // local time, no Z suffix

describe("getPickupWindows", () => {
  it("offers every window on a future day", () => {
    const windows = getPickupWindows("2026-10-05", at("2026-10-02T15:00"));
    expect(windows).toHaveLength(schedulingConfig.windows.length);
    expect(windows.every((w) => w.available)).toBe(true);
  });

  it("closes same-day windows that start within the lead time", () => {
    // 11:30 AM: the 12–2 PM window starts in 30 minutes (< 60 min lead time).
    const windows = getPickupWindows("2026-10-02", at("2026-10-02T11:30"));
    const open = windows.filter((w) => w.available).map((w) => w.id);
    expect(open).toEqual(["14-16", "16-18", "18-20"]);
  });

  it("keeps a window open when it starts exactly at the lead-time cutoff", () => {
    const windows = getPickupWindows("2026-10-02", at("2026-10-02T13:00"));
    expect(windows.find((w) => w.id === "14-16")?.available).toBe(true);
  });

  it("labels windows in 12-hour time", () => {
    expect(windowLabel("10-12")).toBe("10 AM – 12 PM");
    expect(windowLabel("18-20")).toBe("6 PM – 8 PM");
  });
});

describe("getPickupDays", () => {
  it("starts today and covers the booking horizon", () => {
    const days = getPickupDays(at("2026-10-02T09:00"));
    expect(days).toHaveLength(schedulingConfig.bookingHorizonDays);
    expect(days[0]?.date).toBe("2026-10-02");
    expect(days[1]?.date).toBe("2026-10-03");
  });

  it("marks today unavailable late in the evening", () => {
    const days = getPickupDays(at("2026-10-02T19:30"));
    expect(days[0]?.available).toBe(false);
    expect(days[1]?.available).toBe(true);
  });
});

describe("isSlotBookable", () => {
  it("rejects unknown window ids and past windows", () => {
    const now = at("2026-10-02T16:30");
    expect(isSlotBookable("2026-10-02", "nope", now)).toBe(false);
    expect(isSlotBookable("2026-10-02", "16-18", now)).toBe(false);
    expect(isSlotBookable("2026-10-02", "18-20", now)).toBe(true);
  });
});
