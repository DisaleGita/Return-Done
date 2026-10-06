import { beforeEach, describe, expect, it } from "vitest";
import { createDemoReturns } from "./demo-data";
import { returnsStore } from "./returns-store";

beforeEach(() => {
  window.localStorage.clear();
  returnsStore._clearCache();
});

describe("returnsStore", () => {
  it("seeds the demo account on first use and persists it", () => {
    const records = returnsStore.getAll();
    expect(records.length).toBeGreaterThan(0);
    expect(window.localStorage.getItem("returndone:returns:v1")).toContain("RD-2026-1847");
  });

  it("adds a return to the top and renumbers duplicate IDs", () => {
    const existing = returnsStore.getAll()[0]!;
    const saved = returnsStore.add({ ...existing, retailerName: "Copy" });
    expect(saved.id).not.toBe(existing.id);
    expect(returnsStore.getAll()[0]?.id).toBe(saved.id);
  });

  it("advances a return's status", () => {
    const scheduled = returnsStore.getAll().find((r) => r.status === "pickup_scheduled")!;
    const updated = returnsStore.advance(scheduled.id);
    expect(updated?.status).toBe("picked_up");
    expect(returnsStore.get(scheduled.id)?.status).toBe("picked_up");
  });

  it("looks returns up case-insensitively", () => {
    expect(returnsStore.get("rd-2026-1847")?.retailerName).toBe("Amazon");
    expect(returnsStore.get("RD-0000-0000")).toBeUndefined();
  });

  it("keeps your own returns when demo data is refreshed on a new day", () => {
    const mine = { ...createDemoReturns(new Date())[0]!, id: "RD-2026-9999", retailerName: "Mine" };
    window.localStorage.setItem(
      "returndone:returns:v1",
      JSON.stringify({ seededOn: "2020-01-01", demoIds: ["RD-2026-1847"], records: [mine] }),
    );
    returnsStore._clearCache();
    const records = returnsStore.getAll();
    expect(records.some((r) => r.id === "RD-2026-9999")).toBe(true);
    expect(records.some((r) => r.id === "RD-2026-2013")).toBe(true);
  });

  it("recovers from corrupted storage", () => {
    window.localStorage.setItem("returndone:returns:v1", "{not json");
    returnsStore._clearCache();
    expect(returnsStore.getAll().length).toBeGreaterThan(0);
  });

  it("reset restores the demo data", () => {
    returnsStore.add({ ...returnsStore.getAll()[0]!, id: "RD-2026-9998" });
    returnsStore.reset();
    expect(returnsStore.get("RD-2026-9998")).toBeUndefined();
  });
});
